import { Router, Request, Response } from 'express';
import { Announcement } from '../models/Announcement';
import { authenticate, authorize, RequestWithUser } from '../middleware/auth';
import { validateRequest, schemas } from '../middleware/validation';
import { z } from 'zod';
import logger from '../utils/logger';

const router = Router();

// Create announcement schema
const createAnnouncementSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    content: z.string().min(1),
    type: z.enum(['info', 'warning', 'urgent', 'celebration']),
    targetAudience: z.array(z.enum(['all', 'managers', 'staff', 'kitchen', 'front_of_house'])),
    scheduledFor: z.string().datetime().optional(),
    expiresAt: z.string().datetime().optional(),
    channels: z.array(z.enum(['in_app', 'email', 'sms', 'push'])).default(['in_app']),
    attachments: z.array(z.object({
      name: z.string(),
      url: z.string().url(),
      type: z.string()
    })).optional(),
    requiresAcknowledgment: z.boolean().default(false)
  })
});

// Get all announcements for restaurant
router.get(
  '/',
  authenticate,
  async (req: RequestWithUser, res: Response) => {
    try {
      const { status, type, page = 1, limit = 20 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const filter: any = { restaurantId: req.user!.restaurantId };
      
      if (status) filter.status = status;
      if (type) filter.type = type;

      // Filter by target audience based on user role
      if (req.user!.role !== 'owner' && req.user!.role !== 'manager') {
        filter.$or = [
          { targetAudience: 'all' },
          { targetAudience: req.user!.role }
        ];
      }

      const [announcements, total] = await Promise.all([
        Announcement.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .populate('createdBy', 'name email')
          .lean(),
        Announcement.countDocuments(filter)
      ]);

      res.json({
        success: true,
        data: announcements,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      logger.error('Error fetching announcements:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch announcements' });
    }
  }
);

// Create announcement
router.post(
  '/',
  authenticate,
  authorize('owner', 'manager'),
  validateRequest(createAnnouncementSchema),
  async (req: RequestWithUser, res: Response) => {
    try {
      const announcement = new Announcement({
        ...req.body,
        restaurantId: req.user!.restaurantId,
        createdBy: req.user!._id,
        status: req.body.scheduledFor ? 'scheduled' : 'active'
      });

      await announcement.save();

      // TODO: Send notifications based on channels

      res.status(201).json({
        success: true,
        data: announcement
      });
    } catch (error) {
      logger.error('Error creating announcement:', error);
      res.status(500).json({ success: false, error: 'Failed to create announcement' });
    }
  }
);

// Get single announcement
router.get(
  '/:id',
  authenticate,
  async (req: RequestWithUser, res: Response) => {
    try {
      const announcement = await Announcement.findOne({
        _id: req.params.id,
        restaurantId: req.user!.restaurantId
      }).populate('createdBy', 'name email');

      if (!announcement) {
        return res.status(404).json({ success: false, error: 'Announcement not found' });
      }

      // Track view
      await Announcement.findByIdAndUpdate(req.params.id, {
        $addToSet: { viewedBy: req.user!._id }
      });

      res.json({ success: true, data: announcement });
    } catch (error) {
      logger.error('Error fetching announcement:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch announcement' });
    }
  }
);

// Acknowledge announcement
router.post(
  '/:id/acknowledge',
  authenticate,
  async (req: RequestWithUser, res: Response) => {
    try {
      const announcement = await Announcement.findOneAndUpdate(
        {
          _id: req.params.id,
          restaurantId: req.user!.restaurantId
        },
        {
          $addToSet: {
            acknowledgments: {
              userId: req.user!._id,
              acknowledgedAt: new Date()
            }
          }
        },
        { new: true }
      );

      if (!announcement) {
        return res.status(404).json({ success: false, error: 'Announcement not found' });
      }

      res.json({ success: true, data: announcement });
    } catch (error) {
      logger.error('Error acknowledging announcement:', error);
      res.status(500).json({ success: false, error: 'Failed to acknowledge announcement' });
    }
  }
);

// Update announcement
router.put(
  '/:id',
  authenticate,
  authorize('owner', 'manager'),
  async (req: RequestWithUser, res: Response) => {
    try {
      const announcement = await Announcement.findOneAndUpdate(
        {
          _id: req.params.id,
          restaurantId: req.user!.restaurantId
        },
        { $set: req.body },
        { new: true }
      );

      if (!announcement) {
        return res.status(404).json({ success: false, error: 'Announcement not found' });
      }

      res.json({ success: true, data: announcement });
    } catch (error) {
      logger.error('Error updating announcement:', error);
      res.status(500).json({ success: false, error: 'Failed to update announcement' });
    }
  }
);

// Archive announcement
router.post(
  '/:id/archive',
  authenticate,
  authorize('owner', 'manager'),
  async (req: RequestWithUser, res: Response) => {
    try {
      const announcement = await Announcement.findOneAndUpdate(
        {
          _id: req.params.id,
          restaurantId: req.user!.restaurantId
        },
        { status: 'archived' },
        { new: true }
      );

      if (!announcement) {
        return res.status(404).json({ success: false, error: 'Announcement not found' });
      }

      res.json({ success: true, data: announcement });
    } catch (error) {
      logger.error('Error archiving announcement:', error);
      res.status(500).json({ success: false, error: 'Failed to archive announcement' });
    }
  }
);

// Delete announcement
router.delete(
  '/:id',
  authenticate,
  authorize('owner'),
  async (req: RequestWithUser, res: Response) => {
    try {
      const announcement = await Announcement.findOneAndDelete({
        _id: req.params.id,
        restaurantId: req.user!.restaurantId
      });

      if (!announcement) {
        return res.status(404).json({ success: false, error: 'Announcement not found' });
      }

      res.json({ success: true, message: 'Announcement deleted' });
    } catch (error) {
      logger.error('Error deleting announcement:', error);
      res.status(500).json({ success: false, error: 'Failed to delete announcement' });
    }
  }
);

export default router;
