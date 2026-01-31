/**
 * BREWAI v4 Search Routes
 * Author: BUILD-AGENT v1
 * 
 * Routes for semantic search and Ops Copilot Q&A.
 */

import { Router, Request, Response } from 'express';
import { body, query } from 'express-validator';
import { KnowledgeBase, Embedding } from '../models';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { openRouterAdapter } from '../adapters/openrouter';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/v1/search/ops-qna
 * Ask a question about operations (Ops Copilot)
 */
router.post(
  '/ops-qna',
  authenticate,
  authorize('admin', 'owner', 'manager', 'staff'),
  validate([
    body('restaurantId').isMongoId().withMessage('Restaurant ID is required'),
    body('question').trim().notEmpty().withMessage('Question is required'),
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { restaurantId, question } = req.body;

      // Verify user has access to this restaurant
      if (req.user!.role !== 'admin' && req.user!.restaurantId.toString() !== restaurantId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      // Get relevant documents using text search
      // In production, you'd use vector similarity search with embeddings
      const relevantDocs = await KnowledgeBase.find({
        restaurantId,
        isActive: true,
        $text: { $search: question },
      })
        .select('title content source metadata')
        .limit(5)
        .sort({ score: { $meta: 'textScore' } });

      // If no text search results, fall back to recent documents
      let context = '';
      if (relevantDocs.length === 0) {
        const recentDocs = await KnowledgeBase.find({
          restaurantId,
          isActive: true,
        })
          .select('title content')
          .limit(3)
          .sort({ createdAt: -1 });

        context = recentDocs
          .map(doc => `## ${doc.title}\n${doc.content.substring(0, 1000)}`)
          .join('\n\n');
      } else {
        context = relevantDocs
          .map(doc => `## ${doc.title}\n${doc.content.substring(0, 1000)}`)
          .join('\n\n');
      }

      // Generate answer using LLM
      const answer = await openRouterAdapter.chat([
        {
          role: 'system',
          content: `You are an operations assistant for a restaurant. Answer questions based on the provided context. If you don't have enough information, say so. Be concise and actionable.

Context from knowledge base:
${context || 'No specific context available. Provide general restaurant operations guidance.'}`,
        },
        {
          role: 'user',
          content: question,
        },
      ], {
        model: process.env.OPENROUTER_MODEL_CHAT || 'anthropic/claude-3-haiku',
        maxTokens: 500,
      });

      logger.info({ 
        restaurantId, 
        questionLength: question.length,
        docsFound: relevantDocs.length,
      }, 'Ops Q&A answered');

      res.json({
        answer,
        sources: relevantDocs.map(doc => ({
          id: doc._id,
          title: doc.title,
          source: doc.source,
        })),
      });
    } catch (error) {
      logger.error('Ops Q&A error:', error);
      res.status(500).json({ error: 'Failed to answer question' });
    }
  }
);

/**
 * POST /api/v1/search/embed
 * Generate and store embeddings for a document
 */
router.post(
  '/embed',
  authenticate,
  authorize('admin', 'owner', 'manager'),
  validate([
    body('docId').isMongoId().withMessage('Document ID is required'),
    body('docType').isIn(['knowledge_base', 'menu_item', 'announcement', 'ops_doc']),
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { docId, docType } = req.body;

      // Get document
      const doc = await KnowledgeBase.findById(docId);
      if (!doc) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }

      // Verify user has access to this restaurant
      if (req.user!.role !== 'admin' && req.user!.restaurantId.toString() !== doc.restaurantId.toString()) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      // Generate embedding
      const text = `${doc.title}\n\n${doc.content}`.substring(0, 8000);
      const vector = await openRouterAdapter.embed(text);

      // Store or update embedding
      const embedding = await Embedding.findOneAndUpdate(
        { docId, docType },
        {
          $set: {
            restaurantId: doc.restaurantId,
            vector,
            text: text.substring(0, 1000), // Store truncated text for reference
            source: doc.source,
            metadata: {
              title: doc.title,
              updatedAt: new Date(),
            },
          },
        },
        { upsert: true, new: true }
      );

      logger.info({ docId, docType, embeddingId: embedding._id }, 'Embedding generated');

      res.json({ embedding });
    } catch (error) {
      logger.error('Generate embedding error:', error);
      res.status(500).json({ error: 'Failed to generate embedding' });
    }
  }
);

/**
 * GET /api/v1/search/similar
 * Find similar documents using vector similarity
 */
router.get(
  '/similar',
  authenticate,
  validate([
    query('restaurantId').isMongoId().withMessage('Restaurant ID is required'),
    query('docId').isMongoId().withMessage('Document ID is required'),
    query('limit').optional().isInt({ min: 1, max: 20 }),
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { restaurantId, docId } = req.query;
      const limit = parseInt(req.query.limit as string) || 5;

      // Verify user has access to this restaurant
      if (req.user!.role !== 'admin' && req.user!.restaurantId.toString() !== restaurantId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      // Get the source embedding
      const sourceEmbedding = await Embedding.findOne({ docId });
      if (!sourceEmbedding) {
        res.status(404).json({ error: 'Embedding not found for this document' });
        return;
      }

      // Find all other embeddings for this restaurant
      // Note: In production, you'd use a vector database like Pinecone, Weaviate, or MongoDB Atlas Vector Search
      const allEmbeddings = await Embedding.find({
        restaurantId,
        docId: { $ne: docId },
      });

      // Calculate cosine similarity
      const similarities = allEmbeddings.map(emb => ({
        docId: emb.docId,
        docType: emb.docType,
        text: emb.text,
        similarity: cosineSimilarity(sourceEmbedding.vector, emb.vector),
      }));

      // Sort by similarity and take top results
      const topSimilar = similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      res.json({ similar: topSimilar });
    } catch (error) {
      logger.error('Find similar error:', error);
      res.status(500).json({ error: 'Failed to find similar documents' });
    }
  }
);

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

export default router;
