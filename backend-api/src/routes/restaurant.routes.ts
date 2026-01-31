/**
 * BREWAI v4 Restaurant Routes
 * Author: BUILD-AGENT v1
 * 
 * Routes for restaurant and site configuration management.
 */

import { Router, Request, Response } from 'express';
import { body, param } from 'express-validator';
import { Restaurant, Announcement, User } from '../models';
import { authenticate, authorize, requireRestaurantAccess, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/v1/restaurant/:id
 * Get restaurant details (public)
 */
router.get(
  '/:id',
  optionalAuth,
  validate([param('id').isMongoId().withMessage('Invalid restaurant ID')]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const restaurant = await Restaurant.findById(req.params.id);
      
      if (!restaurant || !restaurant.isActive) {
        res.status(404).json({ error: 'Restaurant not found' });
        return;
      }

      res.json({ restaurant });
    } catch (error) {
      logger.error('Get restaurant error:', error);
      res.status(500).json({ error: 'Failed to get restaurant' });
    }
  }
);

/**
 * GET /api/v1/restaurant/slug/:slug
 * Get restaurant by slug (public)
 */
router.get(
  '/slug/:slug',
  optionalAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const restaurant = await Restaurant.findOne({ 
        slug: req.params.slug.toLowerCase(),
        isActive: true,
      });
      
      if (!restaurant) {
        res.status(404).json({ error: 'Restaurant not found' });
        return;
      }

      res.json({ restaurant });
    } catch (error) {
      logger.error('Get restaurant by slug error:', error);
      res.status(500).json({ error: 'Failed to get restaurant' });
    }
  }
);

/**
 * PUT /api/v1/restaurant/:id
 * Update restaurant details
 */
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'owner', 'manager'),
  requireRestaurantAccess,
  validate([
    param('id').isMongoId().withMessage('Invalid restaurant ID'),
    body('name').optional().trim().notEmpty(),
    body('timezone').optional().trim().notEmpty(),
    body('currency').optional().trim().notEmpty(),
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, timezone, currency } = req.body;
      const updates: Record<string, unknown> = {};

      if (name) updates.name = name;
      if (timezone) updates.timezone = timezone;
      if (currency) updates.currency = currency;

      const restaurant = await Restaurant.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
        { new: true }
      );

      if (!restaurant) {
        res.status(404).json({ error: 'Restaurant not found' });
        return;
      }

      logger.info({ restaurantId: req.params.id, updates }, 'Restaurant updated');

      res.json({ restaurant });
    } catch (error) {
      logger.error('Update restaurant error:', error);
      res.status(500).json({ error: 'Failed to update restaurant' });
    }
  }
);

/**
 * GET /api/v1/restaurant/:id/site_config
 * Get site configuration
 */
router.get(
  '/:id/site_config',
  optionalAuth,
  validate([param('id').isMongoId().withMessage('Invalid restaurant ID')]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const restaurant = await Restaurant.findById(req.params.id);
      
      if (!restaurant) {
        res.status(404).json({ error: 'Restaurant not found' });
        return;
      }

      res.json({ siteConfig: restaurant.siteConfig });
    } catch (error) {
      logger.error('Get site config error:', error);
      res.status(500).json({ error: 'Failed to get site config' });
    }
  }
);

/**
 * PUT /api/v1/restaurant/:id/site_config
 * Update site configuration
 */
router.put(
  '/:id/site_config',
  authenticate,
  authorize('admin', 'owner', 'manager'),
  requireRestaurantAccess,
  validate([param('id').isMongoId().withMessage('Invalid restaurant ID')]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { siteConfig } = req.body;

      const restaurant = await Restaurant.findByIdAndUpdate(
        req.params.id,
        { $set: { siteConfig } },
        { new: true }
      );

      if (!restaurant) {
        res.status(404).json({ error: 'Restaurant not found' });
        return;
      }

      logger.info({ restaurantId: req.params.id }, 'Site config updated');

      res.json({ siteConfig: restaurant.siteConfig });
    } catch (error) {
      logger.error('Update site config error:', error);
      res.status(500).json({ error: 'Failed to update site config' });
    }
  }
);

/**
 * GET /api/v1/restaurant/:id/announcements
 * Get restaurant announcements
 */
router.get(
  '/:id/announcements',
  optionalAuth,
  validate([param('id').isMongoId().withMessage('Invalid restaurant ID')]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const filter: Record<string, unknown> = {
        restaurantId: req.params.id,
      };

      // Non-authenticated or non-staff users only see published announcements
      if (!req.user || !['admin', 'owner', 'manager'].includes(req.user.role)) {
        filter.status = 'published';
        filter.$or = [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: new Date() } },
        ];
      }

      const announcements = await Announcement.find(filter)
        .populate('createdBy', 'name')
        .sort({ publishedAt: -1, createdAt: -1 });

      res.json({ announcements });
    } catch (error) {
      logger.error('Get announcements error:', error);
      res.status(500).json({ error: 'Failed to get announcements' });
    }
  }
);

/**
 * POST /api/v1/restaurant/:id/announcements
 * Create announcement
 */
router.post(
  '/:id/announcements',
  authenticate,
  authorize('admin', 'owner', 'manager'),
  requireRestaurantAccess,
  validate([
    param('id').isMongoId().withMessage('Invalid restaurant ID'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('body').trim().notEmpty().withMessage('Body is required'),
    body('targetSegments').optional().isArray(),
    body('publishAt').optional().isISO8601(),
    body('expiresAt').optional().isISO8601(),
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { title, body: announcementBody, imageUrl, ctaText, ctaUrl, targetSegments, publishAt, expiresAt } = req.body;

      const announcement = await Announcement.create({
        restaurantId: req.params.id,
        title,
        body: announcementBody,
        imageUrl,
        ctaText,
        ctaUrl,
        targetSegments: targetSegments || ['all'],
        publishAt: publishAt ? new Date(publishAt) : undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        createdBy: req.userId,
        status: 'draft',
      });

      logger.info({ announcementId: announcement._id, restaurantId: req.params.id }, 'Announcement created');

      res.status(201).json({ announcement });
    } catch (error) {
      logger.error('Create announcement error:', error);
      res.status(500).json({ error: 'Failed to create announcement' });
    }
  }
);

/**
 * POST /api/v1/restaurant/:id/announcements/:announcementId/publish
 * Publish announcement
 */
router.post(
  '/:id/announcements/:announcementId/publish',
  authenticate,
  authorize('admin', 'owner'),
  requireRestaurantAccess,
  validate([
    param('id').isMongoId().withMessage('Invalid restaurant ID'),
    param('announcementId').isMongoId().withMessage('Invalid announcement ID'),
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const announcement = await Announcement.findOneAndUpdate(
        {
          _id: req.params.announcementId,
          restaurantId: req.params.id,
        },
        {
          $set: {
            status: 'published',
            publishedAt: new Date(),
            publishedBy: req.userId,
          },
        },
        { new: true }
      );

      if (!announcement) {
        res.status(404).json({ error: 'Announcement not found' });
        return;
      }

      logger.info({ announcementId: announcement._id }, 'Announcement published');

      res.json({ announcement });
    } catch (error) {
      logger.error('Publish announcement error:', error);
      res.status(500).json({ error: 'Failed to publish announcement' });
    }
  }
);

/**
 * GET /api/v1/restaurant/:id/team
 * Get restaurant team members
 */
router.get(
  '/:id/team',
  authenticate,
  authorize('admin', 'owner', 'manager'),
  requireRestaurantAccess,
  validate([param('id').isMongoId().withMessage('Invalid restaurant ID')]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const users = await User.find({ 
        restaurantId: req.params.id,
        isActive: true,
      })
        .select('-passwordHash')
        .sort({ role: 1, name: 1 });

      res.json({ users });
    } catch (error) {
      logger.error('Get team error:', error);
      res.status(500).json({ error: 'Failed to get team' });
    }
  }
);

export default router;
