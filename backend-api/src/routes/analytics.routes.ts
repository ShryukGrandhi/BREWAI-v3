/**
 * BREWAI v4 Analytics Routes
 * Author: BUILD-AGENT v1
 * 
 * Routes for session tracking and replay.
 */

import { Router, Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { Session, Event } from '../models';
import { authenticate, authorize, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { uploadFile, getFile } from '../config/minio';
import { logger } from '../utils/logger';
import { createHash } from 'crypto';
import zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

const router = Router();

const SESSIONS_BUCKET = process.env.MINIO_BUCKET_SESSIONS || 'session-replays';

/**
 * POST /api/v1/analytics/sessions
 * Create a new session
 */
router.post(
  '/sessions',
  validate([
    body('restaurantId').isMongoId().withMessage('Restaurant ID is required'),
    body('visitorId').trim().notEmpty().withMessage('Visitor ID is required'),
    body('consent').isBoolean().withMessage('Consent is required'),
    body('deviceInfo').optional().isObject(),
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { restaurantId, visitorId, consent, deviceInfo } = req.body;

      // Check sampling rate
      const sampleRate = parseFloat(process.env.SESSION_SAMPLE_RATE || '0.2');
      const sampled = Math.random() < sampleRate;

      const sessionId = uuidv4();

      const session = await Session.create({
        _id: sessionId,
        restaurantId,
        visitorId,
        startTs: new Date(),
        sampled,
        consent,
        deviceInfo: deviceInfo || {},
        pageViews: [],
        chunks: [],
        eventCount: 0,
      });

      logger.info({ sessionId, restaurantId, sampled, consent }, 'Session created');

      res.status(201).json({ 
        sessionId,
        sampled,
        consent,
      });
    } catch (error) {
      logger.error('Create session error:', error);
      res.status(500).json({ error: 'Failed to create session' });
    }
  }
);

/**
 * POST /api/v1/analytics/events
 * Bulk upload events
 */
router.post(
  '/events',
  validate([
    body('sessionId').trim().notEmpty().withMessage('Session ID is required'),
    body('events').isArray({ min: 1 }).withMessage('Events array is required'),
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId, events } = req.body;

      const session = await Session.findById(sessionId);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      // Don't store events if no consent for full replay
      if (!session.consent) {
        // Only store aggregate/anonymous events
        const aggregateEvents = events.filter((e: { type: string }) => 
          ['pageview', 'error'].includes(e.type)
        );

        if (aggregateEvents.length > 0) {
          await Event.insertMany(
            aggregateEvents.map((e: Record<string, unknown>) => ({
              ...e,
              sessionId,
              restaurantId: session.restaurantId,
              ts: new Date(e.ts as string || Date.now()),
              // Hash IP for privacy
              ipHash: e.ip ? createHash('sha256').update(e.ip as string).digest('hex').substring(0, 16) : undefined,
            }))
          );
        }

        res.json({ stored: aggregateEvents.length, skipped: events.length - aggregateEvents.length });
        return;
      }

      // Store all events for consented sessions
      const eventsToInsert = events.map((e: Record<string, unknown>) => ({
        ...e,
        sessionId,
        restaurantId: session.restaurantId,
        ts: new Date(e.ts as string || Date.now()),
        ipHash: e.ip ? createHash('sha256').update(e.ip as string).digest('hex').substring(0, 16) : undefined,
      }));

      await Event.insertMany(eventsToInsert);

      // Update session event count
      await Session.findByIdAndUpdate(sessionId, {
        $inc: { eventCount: events.length },
      });

      res.json({ stored: events.length });
    } catch (error) {
      logger.error('Store events error:', error);
      res.status(500).json({ error: 'Failed to store events' });
    }
  }
);

/**
 * POST /api/v1/analytics/replay-chunk
 * Upload replay chunk (compressed DOM snapshots + events)
 */
router.post(
  '/replay-chunk',
  validate([
    body('sessionId').trim().notEmpty().withMessage('Session ID is required'),
    body('chunk').notEmpty().withMessage('Chunk data is required'),
    body('eventCount').optional().isInt({ min: 0 }),
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId, chunk, eventCount = 0 } = req.body;

      const session = await Session.findById(sessionId);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      if (!session.consent || !session.sampled) {
        res.status(403).json({ error: 'Session not consented or not sampled for replay' });
        return;
      }

      // Compress chunk data
      const chunkData = JSON.stringify(chunk);
      const compressed = await gzip(Buffer.from(chunkData));

      const chunkId = uuidv4();
      const minioKey = `${session.restaurantId}/${sessionId}/${chunkId}.gz`;

      // Upload to MinIO
      await uploadFile(SESSIONS_BUCKET, minioKey, compressed, {
        'Content-Type': 'application/gzip',
        'X-Session-Id': sessionId,
        'X-Chunk-Id': chunkId,
      });

      // Update session with chunk reference
      const chunkRecord = {
        chunkId,
        minioKey,
        ts: new Date(),
        eventCount,
        sizeBytes: compressed.length,
      };

      await Session.findByIdAndUpdate(sessionId, {
        $push: { chunks: chunkRecord },
        $inc: { eventCount },
      });

      logger.info({ sessionId, chunkId, sizeBytes: compressed.length }, 'Replay chunk uploaded');

      res.json({ chunkId, sizeBytes: compressed.length });
    } catch (error) {
      logger.error('Upload replay chunk error:', error);
      res.status(500).json({ error: 'Failed to upload replay chunk' });
    }
  }
);

/**
 * GET /api/v1/analytics/sessions
 * List sessions (admin view)
 */
router.get(
  '/sessions',
  authenticate,
  authorize('admin', 'owner', 'manager'),
  validate([
    query('restaurantId').isMongoId().withMessage('Restaurant ID is required'),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('sampled').optional().isBoolean(),
    query('consent').optional().isBoolean(),
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { restaurantId, sampled, consent } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      // Verify user has access to this restaurant
      if (req.user!.role !== 'admin' && req.user!.restaurantId.toString() !== restaurantId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const filter: Record<string, unknown> = { restaurantId };
      if (sampled !== undefined) filter.sampled = sampled === 'true';
      if (consent !== undefined) filter.consent = consent === 'true';

      const [sessions, total] = await Promise.all([
        Session.find(filter)
          .select('-chunks')
          .sort({ startTs: -1 })
          .skip(skip)
          .limit(limit),
        Session.countDocuments(filter),
      ]);

      res.json({
        sessions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('List sessions error:', error);
      res.status(500).json({ error: 'Failed to list sessions' });
    }
  }
);

/**
 * GET /api/v1/analytics/sessions/:sessionId
 * Get session details
 */
router.get(
  '/sessions/:sessionId',
  authenticate,
  authorize('admin', 'owner', 'manager'),
  validate([param('sessionId').trim().notEmpty()]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const session = await Session.findById(req.params.sessionId);
      
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      // Verify user has access to this restaurant
      if (req.user!.role !== 'admin' && req.user!.restaurantId.toString() !== session.restaurantId.toString()) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      res.json({ session });
    } catch (error) {
      logger.error('Get session error:', error);
      res.status(500).json({ error: 'Failed to get session' });
    }
  }
);

/**
 * GET /api/v1/analytics/sessions/:sessionId/replay
 * Get session replay chunks
 */
router.get(
  '/sessions/:sessionId/replay',
  authenticate,
  authorize('admin', 'owner', 'manager'),
  validate([param('sessionId').trim().notEmpty()]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const session = await Session.findById(req.params.sessionId);
      
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      // Verify user has access to this restaurant
      if (req.user!.role !== 'admin' && req.user!.restaurantId.toString() !== session.restaurantId.toString()) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      if (!session.consent) {
        res.status(403).json({ error: 'Session replay not available (no consent)' });
        return;
      }

      // Fetch all chunks from MinIO
      const chunks = await Promise.all(
        session.chunks.map(async (chunk) => {
          try {
            const compressed = await getFile(SESSIONS_BUCKET, chunk.minioKey);
            const decompressed = await gunzip(compressed);
            return {
              chunkId: chunk.chunkId,
              ts: chunk.ts,
              data: JSON.parse(decompressed.toString()),
            };
          } catch (err) {
            logger.error({ chunkId: chunk.chunkId, error: err }, 'Failed to fetch chunk');
            return null;
          }
        })
      );

      res.json({
        session: {
          _id: session._id,
          startTs: session.startTs,
          endTs: session.endTs,
          duration: session.duration,
          deviceInfo: session.deviceInfo,
          pageViews: session.pageViews,
          eventCount: session.eventCount,
        },
        chunks: chunks.filter(c => c !== null),
      });
    } catch (error) {
      logger.error('Get session replay error:', error);
      res.status(500).json({ error: 'Failed to get session replay' });
    }
  }
);

/**
 * POST /api/v1/analytics/sessions/:sessionId/end
 * End a session
 */
router.post(
  '/sessions/:sessionId/end',
  validate([param('sessionId').trim().notEmpty()]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const session = await Session.findById(req.params.sessionId);
      
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      const endTs = new Date();
      const duration = endTs.getTime() - session.startTs.getTime();

      await Session.findByIdAndUpdate(req.params.sessionId, {
        $set: { endTs, duration },
      });

      logger.info({ sessionId: req.params.sessionId, duration }, 'Session ended');

      res.json({ message: 'Session ended', duration });
    } catch (error) {
      logger.error('End session error:', error);
      res.status(500).json({ error: 'Failed to end session' });
    }
  }
);

export default router;
