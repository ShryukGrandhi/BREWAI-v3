/**
 * BREWAI v4 User Routes
 * Author: BUILD-AGENT v1
 * 
 * Routes for user management (admin operations).
 */

import { Router, Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { User } from '../models';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/v1/users
 * List all users (admin only)
 */
router.get(
  '/',
  authenticate,
  authorize('admin'),
  validate([
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('role').optional().isIn(['owner', 'manager', 'staff', 'admin']),
    query('restaurantId').optional().isMongoId(),
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const filter: Record<string, unknown> = {};
      if (req.query.role) filter.role = req.query.role;
      if (req.query.restaurantId) filter.restaurantId = req.query.restaurantId;

      const [users, total] = await Promise.all([
        User.find(filter)
          .select('-passwordHash')
          .populate('restaurantId', 'name slug')
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 }),
        User.countDocuments(filter),
      ]);

      res.json({
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('List users error:', error);
      res.status(500).json({ error: 'Failed to list users' });
    }
  }
);

/**
 * GET /api/v1/users/:id
 * Get user by ID
 */
router.get(
  '/:id',
  authenticate,
  validate([param('id').isMongoId().withMessage('Invalid user ID')]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Non-admins can only view themselves or users in their restaurant
      if (req.user!.role !== 'admin') {
        if (id !== req.userId && req.user!.restaurantId.toString() !== req.user!.restaurantId.toString()) {
          res.status(403).json({ error: 'Access denied' });
          return;
        }
      }

      const user = await User.findById(id)
        .select('-passwordHash')
        .populate('restaurantId', 'name slug');

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({ user });
    } catch (error) {
      logger.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to get user' });
    }
  }
);

/**
 * PUT /api/v1/users/:id
 * Update user
 */
router.put(
  '/:id',
  authenticate,
  validate([
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('name').optional().trim().notEmpty(),
    body('role').optional().isIn(['owner', 'manager', 'staff', 'admin']),
    body('isActive').optional().isBoolean(),
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, role, isActive } = req.body;

      // Check permissions
      const targetUser = await User.findById(id);
      if (!targetUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Only admins can update other users
      if (req.user!.role !== 'admin' && id !== req.userId) {
        // Owners can update users in their restaurant
        if (req.user!.role === 'owner' && 
            targetUser.restaurantId.toString() === req.user!.restaurantId.toString()) {
          // Owner can proceed, but can't change roles to owner or admin
          if (role === 'owner' || role === 'admin') {
            res.status(403).json({ error: 'Cannot assign owner or admin role' });
            return;
          }
        } else {
          res.status(403).json({ error: 'Access denied' });
          return;
        }
      }

      const updates: Record<string, unknown> = {};
      if (name !== undefined) updates.name = name;
      if (role !== undefined && req.user!.role === 'admin') updates.role = role;
      if (isActive !== undefined) updates.isActive = isActive;

      const user = await User.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true }
      ).select('-passwordHash');

      logger.info({ userId: id, updates }, 'User updated');

      res.json({ user });
    } catch (error) {
      logger.error('Update user error:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }
);

/**
 * DELETE /api/v1/users/:id
 * Delete user (soft delete by deactivating)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin', 'owner'),
  validate([param('id').isMongoId().withMessage('Invalid user ID')]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Prevent self-deletion
      if (id === req.userId) {
        res.status(400).json({ error: 'Cannot delete yourself' });
        return;
      }

      const targetUser = await User.findById(id);
      if (!targetUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Owners can only delete users in their restaurant
      if (req.user!.role === 'owner' && 
          targetUser.restaurantId.toString() !== req.user!.restaurantId.toString()) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      // Soft delete
      await User.findByIdAndUpdate(id, { isActive: false });

      logger.info({ userId: id, deletedBy: req.userId }, 'User deleted (deactivated)');

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      logger.error('Delete user error:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }
);

export default router;
