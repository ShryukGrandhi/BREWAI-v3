/**
 * BREWAI v4 Ingest Routes
 * Author: BUILD-AGENT v1
 * 
 * Routes for Firecrawl and Reducto ingestion jobs.
 */

import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { KnowledgeBase } from '../models';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { logger } from '../utils/logger';
import { firecrawlAdapter } from '../adapters/firecrawl';
import { reductoAdapter } from '../adapters/reducto';

const router = Router();

/**
 * POST /api/v1/ingest/firecrawl
 * Schedule a web crawl job
 */
router.post(
  '/firecrawl',
  authenticate,
  authorize('admin', 'owner', 'manager'),
  validate([
    body('restaurantId').isMongoId().withMessage('Restaurant ID is required'),
    body('urls').isArray({ min: 1 }).withMessage('URLs array is required'),
    body('urls.*').isURL().withMessage('Invalid URL'),
    body('options').optional().isObject(),
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { restaurantId, urls, options } = req.body;

      // Verify user has access to this restaurant
      if (req.user!.role !== 'admin' && req.user!.restaurantId.toString() !== restaurantId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const results = [];

      for (const url of urls) {
        try {
          const crawlResult = await firecrawlAdapter.crawl(url, options);

          // Store in knowledge base
          const doc = await KnowledgeBase.create({
            restaurantId,
            source: 'firecrawl',
            sourceUrl: url,
            title: crawlResult.title || url,
            content: crawlResult.content,
            contentType: 'text/html',
            metadata: {
              crawledAt: new Date(),
              links: crawlResult.links,
              ...crawlResult.metadata,
            },
            tags: crawlResult.tags || [],
          });

          results.push({
            url,
            status: 'success',
            docId: doc._id,
            title: crawlResult.title,
          });
        } catch (error) {
          results.push({
            url,
            status: 'error',
            error: (error as Error).message,
          });
        }
      }

      logger.info({ 
        restaurantId, 
        urlCount: urls.length,
        successCount: results.filter(r => r.status === 'success').length,
      }, 'Firecrawl job completed');

      res.json({ 
        results,
        summary: {
          total: urls.length,
          success: results.filter(r => r.status === 'success').length,
          failed: results.filter(r => r.status === 'error').length,
        },
      });
    } catch (error) {
      logger.error('Firecrawl job error:', error);
      res.status(500).json({ error: 'Failed to process crawl job' });
    }
  }
);

/**
 * POST /api/v1/ingest/reducto
 * Parse a document (PDF, etc.)
 */
router.post(
  '/reducto',
  authenticate,
  authorize('admin', 'owner', 'manager'),
  validate([
    body('restaurantId').isMongoId().withMessage('Restaurant ID is required'),
    body('fileUrl').optional().isURL().withMessage('Invalid file URL'),
    body('fileBase64').optional().isString(),
    body('fileName').trim().notEmpty().withMessage('File name is required'),
    body('options').optional().isObject(),
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { restaurantId, fileUrl, fileBase64, fileName, options } = req.body;

      // Verify user has access to this restaurant
      if (req.user!.role !== 'admin' && req.user!.restaurantId.toString() !== restaurantId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      if (!fileUrl && !fileBase64) {
        res.status(400).json({ error: 'Either fileUrl or fileBase64 is required' });
        return;
      }

      // Parse document
      const parseResult = await reductoAdapter.parse({
        url: fileUrl,
        base64: fileBase64,
        fileName,
        ...options,
      });

      // Store in knowledge base
      const doc = await KnowledgeBase.create({
        restaurantId,
        source: 'reducto',
        sourceFile: fileName,
        sourceUrl: fileUrl,
        title: parseResult.title || fileName,
        content: parseResult.content,
        contentType: parseResult.contentType || 'application/pdf',
        metadata: {
          parsedAt: new Date(),
          tables: parseResult.tables,
          entities: parseResult.entities,
          ...parseResult.metadata,
        },
        tags: parseResult.tags || [],
      });

      logger.info({ 
        restaurantId, 
        fileName,
        docId: doc._id,
      }, 'Reducto parse completed');

      res.json({ 
        doc,
        parseResult: {
          tableCount: parseResult.tables?.length || 0,
          entityCount: parseResult.entities?.length || 0,
        },
      });
    } catch (error) {
      logger.error('Reducto parse error:', error);
      res.status(500).json({ error: 'Failed to parse document' });
    }
  }
);

/**
 * GET /api/v1/ingest/documents
 * List ingested documents
 */
router.get(
  '/documents',
  authenticate,
  authorize('admin', 'owner', 'manager'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { restaurantId, source, tags } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      if (!restaurantId) {
        res.status(400).json({ error: 'Restaurant ID is required' });
        return;
      }

      // Verify user has access to this restaurant
      if (req.user!.role !== 'admin' && req.user!.restaurantId.toString() !== restaurantId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const filter: Record<string, unknown> = { 
        restaurantId,
        isActive: true,
      };
      if (source) filter.source = source;
      if (tags) filter.tags = { $in: (tags as string).split(',') };

      const [documents, total] = await Promise.all([
        KnowledgeBase.find(filter)
          .select('-content') // Don't include full content in list
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        KnowledgeBase.countDocuments(filter),
      ]);

      res.json({
        documents,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('List documents error:', error);
      res.status(500).json({ error: 'Failed to list documents' });
    }
  }
);

export default router;
