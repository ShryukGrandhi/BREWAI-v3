import { Router, Request, Response } from 'express';
import { KnowledgeBase } from '../models/KnowledgeBase';
import { Embedding } from '../models/Embedding';
import { authenticate, authorize, RequestWithUser } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';
import logger from '../utils/logger';
import { openRouterAdapter } from '../adapters/openrouter';

const router = Router();

// Create knowledge article schema
const createArticleSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(300),
    content: z.string().min(1),
    category: z.enum([
      'recipes',
      'procedures',
      'policies',
      'training',
      'equipment',
      'safety',
      'customer_service',
      'other'
    ]),
    tags: z.array(z.string()).optional(),
    isPublic: z.boolean().default(false),
    attachments: z.array(z.object({
      name: z.string(),
      url: z.string().url(),
      type: z.string()
    })).optional()
  })
});

// Get all knowledge articles
router.get(
  '/',
  authenticate,
  async (req: RequestWithUser, res: Response) => {
    try {
      const { category, search, page = 1, limit = 20 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const filter: any = { restaurantId: req.user!.restaurantId };
      
      if (category) filter.category = category;
      if (search) {
        filter.$text = { $search: search as string };
      }

      const [articles, total] = await Promise.all([
        KnowledgeBase.find(filter)
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .populate('createdBy', 'name')
          .populate('lastEditedBy', 'name')
          .lean(),
        KnowledgeBase.countDocuments(filter)
      ]);

      res.json({
        success: true,
        data: articles,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      logger.error('Error fetching knowledge articles:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch articles' });
    }
  }
);

// Create knowledge article
router.post(
  '/',
  authenticate,
  authorize('owner', 'manager'),
  validateRequest(createArticleSchema),
  async (req: RequestWithUser, res: Response) => {
    try {
      const article = new KnowledgeBase({
        ...req.body,
        restaurantId: req.user!.restaurantId,
        createdBy: req.user!._id,
        lastEditedBy: req.user!._id
      });

      await article.save();

      // Generate embeddings for semantic search
      try {
        const embedding = await openRouterAdapter.generateEmbedding(
          `${article.title}\n\n${article.content}`
        );

        await Embedding.create({
          restaurantId: req.user!.restaurantId,
          sourceType: 'knowledge_base',
          sourceId: article._id,
          content: article.content.substring(0, 8000),
          embedding,
          metadata: {
            title: article.title,
            category: article.category
          }
        });
      } catch (embeddingError) {
        logger.warn('Failed to generate embedding:', embeddingError);
      }

      res.status(201).json({
        success: true,
        data: article
      });
    } catch (error) {
      logger.error('Error creating knowledge article:', error);
      res.status(500).json({ success: false, error: 'Failed to create article' });
    }
  }
);

// Get single article
router.get(
  '/:id',
  authenticate,
  async (req: RequestWithUser, res: Response) => {
    try {
      const article = await KnowledgeBase.findOne({
        _id: req.params.id,
        restaurantId: req.user!.restaurantId
      })
        .populate('createdBy', 'name')
        .populate('lastEditedBy', 'name');

      if (!article) {
        return res.status(404).json({ success: false, error: 'Article not found' });
      }

      // Increment view count
      article.viewCount += 1;
      await article.save();

      res.json({ success: true, data: article });
    } catch (error) {
      logger.error('Error fetching article:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch article' });
    }
  }
);

// Update article
router.put(
  '/:id',
  authenticate,
  authorize('owner', 'manager'),
  async (req: RequestWithUser, res: Response) => {
    try {
      const existingArticle = await KnowledgeBase.findOne({
        _id: req.params.id,
        restaurantId: req.user!.restaurantId
      });

      if (!existingArticle) {
        return res.status(404).json({ success: false, error: 'Article not found' });
      }

      // Add to version history
      const versionHistory = existingArticle.versionHistory || [];
      versionHistory.push({
        content: existingArticle.content,
        editedBy: req.user!._id,
        editedAt: new Date(),
        changeNote: req.body.changeNote || 'Updated article'
      });

      const article = await KnowledgeBase.findByIdAndUpdate(
        req.params.id,
        {
          ...req.body,
          lastEditedBy: req.user!._id,
          versionHistory
        },
        { new: true }
      );

      // Update embeddings
      try {
        const embedding = await openRouterAdapter.generateEmbedding(
          `${article!.title}\n\n${article!.content}`
        );

        await Embedding.findOneAndUpdate(
          { sourceType: 'knowledge_base', sourceId: article!._id },
          {
            content: article!.content.substring(0, 8000),
            embedding,
            metadata: {
              title: article!.title,
              category: article!.category
            }
          },
          { upsert: true }
        );
      } catch (embeddingError) {
        logger.warn('Failed to update embedding:', embeddingError);
      }

      res.json({ success: true, data: article });
    } catch (error) {
      logger.error('Error updating article:', error);
      res.status(500).json({ success: false, error: 'Failed to update article' });
    }
  }
);

// Semantic search
router.post(
  '/search/semantic',
  authenticate,
  async (req: RequestWithUser, res: Response) => {
    try {
      const { query, limit = 5 } = req.body;

      if (!query) {
        return res.status(400).json({ success: false, error: 'Query is required' });
      }

      // Generate embedding for query
      const queryEmbedding = await openRouterAdapter.generateEmbedding(query);

      // Find similar documents using cosine similarity
      const embeddings = await Embedding.find({
        restaurantId: req.user!.restaurantId,
        sourceType: 'knowledge_base'
      }).lean();

      // Calculate cosine similarity
      const results = embeddings.map(doc => {
        const similarity = cosineSimilarity(queryEmbedding, doc.embedding);
        return { ...doc, similarity };
      })
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, Number(limit));

      // Fetch full articles
      const articleIds = results.map(r => r.sourceId);
      const articles = await KnowledgeBase.find({
        _id: { $in: articleIds }
      }).lean();

      const articlesWithScores = results.map(r => {
        const article = articles.find(a => a._id.toString() === r.sourceId.toString());
        return {
          ...article,
          similarityScore: r.similarity
        };
      });

      res.json({
        success: true,
        data: articlesWithScores
      });
    } catch (error) {
      logger.error('Error in semantic search:', error);
      res.status(500).json({ success: false, error: 'Search failed' });
    }
  }
);

// Delete article
router.delete(
  '/:id',
  authenticate,
  authorize('owner'),
  async (req: RequestWithUser, res: Response) => {
    try {
      const article = await KnowledgeBase.findOneAndDelete({
        _id: req.params.id,
        restaurantId: req.user!.restaurantId
      });

      if (!article) {
        return res.status(404).json({ success: false, error: 'Article not found' });
      }

      // Delete associated embedding
      await Embedding.deleteOne({
        sourceType: 'knowledge_base',
        sourceId: req.params.id
      });

      res.json({ success: true, message: 'Article deleted' });
    } catch (error) {
      logger.error('Error deleting article:', error);
      res.status(500).json({ success: false, error: 'Failed to delete article' });
    }
  }
);

// Helper function for cosine similarity
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
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export default router;
