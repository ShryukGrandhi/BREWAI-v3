import { Router, Request, Response } from 'express';
import { Session, SessionEvent } from '../models/Session';
import { authenticate, AuthRequest } from '../middleware/auth';
import { minioClient, BUCKETS, getObjectUrl } from '../config/minio';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Start a new session
router.post('/start', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { device, browser, screenResolution, initialUrl } = req.body;

    const session = new Session({
      user: req.user!._id,
      restaurant: req.user!.currentRestaurant,
      device: device || 'unknown',
      browser: browser || 'unknown',
      screenResolution: screenResolution || { width: 0, height: 0 },
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip,
      startedAt: new Date(),
      status: 'active',
      events: [],
      pagesVisited: initialUrl ? [initialUrl] : [],
    });

    await session.save();

    res.status(201).json({
      success: true,
      data: {
        sessionId: session._id,
      },
    });
  } catch (error) {
    logger.error('Start session error:', error);
    res.status(500).json({ success: false, error: 'Failed to start session' });
  }
});

// Record session events (batch)
router.post('/:sessionId/events', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { events } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ success: false, error: 'Events array required' });
    }

    const session = await Session.findOne({
      _id: sessionId,
      user: req.user!._id,
      status: 'active',
    });

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    // Add events
    const sessionEvents: SessionEvent[] = events.map((event: any) => ({
      timestamp: new Date(event.timestamp),
      type: event.type,
      data: event.data,
    }));

    session.events.push(...sessionEvents);

    // Track pages visited
    const navigationEvents = events.filter((e: any) => e.type === 'navigation');
    navigationEvents.forEach((e: any) => {
      if (e.data?.url && !session.pagesVisited.includes(e.data.url)) {
        session.pagesVisited.push(e.data.url);
      }
    });

    session.lastActivityAt = new Date();
    await session.save();

    res.json({
      success: true,
      data: {
        eventsRecorded: events.length,
        totalEvents: session.events.length,
      },
    });
  } catch (error) {
    logger.error('Record events error:', error);
    res.status(500).json({ success: false, error: 'Failed to record events' });
  }
});

// End session
router.post('/:sessionId/end', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({
      _id: sessionId,
      user: req.user!._id,
    });

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    session.endedAt = new Date();
    session.status = 'completed';
    session.duration = Math.round(
      (session.endedAt.getTime() - session.startedAt.getTime()) / 1000
    );

    // Compress and store session data in MinIO for replay
    const sessionData = {
      id: session._id,
      events: session.events,
      metadata: {
        user: session.user,
        device: session.device,
        browser: session.browser,
        screenResolution: session.screenResolution,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        duration: session.duration,
        pagesVisited: session.pagesVisited,
      },
    };

    const objectName = `sessions/${session.restaurant}/${session._id}.json`;
    const buffer = Buffer.from(JSON.stringify(sessionData));

    await minioClient.putObject(
      BUCKETS.SESSIONS,
      objectName,
      buffer,
      buffer.length,
      { 'Content-Type': 'application/json' }
    );

    session.recordingUrl = objectName;

    // Clear events from MongoDB to save space (keep in MinIO)
    session.events = [];
    await session.save();

    res.json({
      success: true,
      data: {
        sessionId: session._id,
        duration: session.duration,
        eventsCount: sessionData.events.length,
      },
    });
  } catch (error) {
    logger.error('End session error:', error);
    res.status(500).json({ success: false, error: 'Failed to end session' });
  }
});

// Get sessions list
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      userId,
      status,
      startDate,
      endDate,
    } = req.query;

    const query: any = {
      restaurant: req.user!.currentRestaurant,
    };

    if (userId) query.user = userId;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.startedAt = {};
      if (startDate) query.startedAt.$gte = new Date(startDate as string);
      if (endDate) query.startedAt.$lte = new Date(endDate as string);
    }

    const sessions = await Session.find(query)
      .populate('user', 'firstName lastName email role')
      .sort({ startedAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .select('-events');

    const total = await Session.countDocuments(query);

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Get sessions error:', error);
    res.status(500).json({ success: false, error: 'Failed to get sessions' });
  }
});

// Get session details with replay URL
router.get('/:sessionId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({
      _id: sessionId,
      restaurant: req.user!.currentRestaurant,
    }).populate('user', 'firstName lastName email role');

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    let replayUrl = null;
    if (session.recordingUrl) {
      replayUrl = await getObjectUrl(BUCKETS.SESSIONS, session.recordingUrl);
    }

    res.json({
      success: true,
      data: {
        session,
        replayUrl,
      },
    });
  } catch (error) {
    logger.error('Get session error:', error);
    res.status(500).json({ success: false, error: 'Failed to get session' });
  }
});

// Get session analytics
router.get('/analytics/summary', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const dateQuery: any = {};
    if (startDate) dateQuery.$gte = new Date(startDate as string);
    if (endDate) dateQuery.$lte = new Date(endDate as string);

    const matchQuery: any = {
      restaurant: req.user!.currentRestaurant,
      status: 'completed',
    };
    if (Object.keys(dateQuery).length > 0) {
      matchQuery.startedAt = dateQuery;
    }

    const analytics = await Session.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          avgDuration: { $avg: '$duration' },
          uniqueUsers: { $addToSet: '$user' },
          totalEvents: { $sum: { $size: { $ifNull: ['$events', []] } } },
        },
      },
      {
        $project: {
          _id: 0,
          totalSessions: 1,
          avgDuration: { $round: ['$avgDuration', 0] },
          uniqueUsers: { $size: '$uniqueUsers' },
          totalEvents: 1,
        },
      },
    ]);

    // Get sessions by device
    const byDevice = await Session.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$device', count: { $sum: 1 } } },
    ]);

    // Get most visited pages
    const topPages = await Session.aggregate([
      { $match: matchQuery },
      { $unwind: '$pagesVisited' },
      { $group: { _id: '$pagesVisited', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      data: {
        summary: analytics[0] || {
          totalSessions: 0,
          avgDuration: 0,
          uniqueUsers: 0,
          totalEvents: 0,
        },
        byDevice,
        topPages,
      },
    });
  } catch (error) {
    logger.error('Get session analytics error:', error);
    res.status(500).json({ success: false, error: 'Failed to get analytics' });
  }
});

export default router;
