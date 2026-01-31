/**
 * BREWAI v4 Menu Routes
 * Author: BUILD-AGENT v1
 * 
 * Routes for menu item management.
 */

import { Router, Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { MenuItem } from '../models';
import { authenticate, authorize, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/v1/menu
 * Get menu items (public, filtered by restaurant)
 */
router.get(
  '/',
  optionalAuth,
  validate([
    query('restaurantId').isMongoId().withMessage('Restaurant ID is required'),
    query('category').optional().trim(),
    query('tags').optional(),
    query('available').optional().isBoolean(),
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { restaurantId, category, tags, available } = req.query;

      const filter: Record<string, unknown> = {
        restaurantId,
        isActive: true,
      };

      if (category) filter.category = category;
      if (tags) filter.tags = { $in: (tags as string).split(',') };
      if (available !== undefined) filter.isAvailable = available === 'true';

      const menuItems = await MenuItem.find(filter)
        .sort({ category: 1, sortOrder: 1, name: 1 });

      // Group by category
      const grouped = menuItems.reduce((acc, item) => {
        const cat = item.category;
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
      }, {} as Record<string, typeof menuItems>);

      res.json({ 
        menuItems,
        categories: Object.keys(grouped),
        grouped,
      });
    } catch (error) {
      logger.error('Get menu error:', error);
      res.status(500).json({ error: 'Failed to get menu' });
    }
  }
);

/**
 * GET /api/v1/menu/:id
 * Get single menu item
 */
router.get(
  '/:id',
  optionalAuth,
  validate([param('id').isMongoId().withMessage('Invalid menu item ID')]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const menuItem = await MenuItem.findById(req.params.id)
        .populate('ingredients.ingredientId', 'name unit');

      if (!menuItem || !menuItem.isActive) {
        res.status(404).json({ error: 'Menu item not found' });
        return;
      }

      res.json({ menuItem });
    } catch (error) {
      logger.error('Get menu item error:', error);
      res.status(500).json({ error: 'Failed to get menu item' });
    }
  }
);

/**
 * POST /api/v1/menu
 * Create menu item
 */
router.post(
  '/',
  authenticate,
  authorize('admin', 'owner', 'manager'),
  validate([
    body('restaurantId').isMongoId().withMessage('Restaurant ID is required'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
    body('category').trim().notEmpty().withMessage('Category is required'),
    body('description').optional().trim(),
    body('tags').optional().isArray(),
    body('imageUrl').optional().trim(),
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { restaurantId, name, description, price, category, tags, imageUrl, ingredients, nutritionInfo } = req.body;

      // Verify user has access to this restaurant
      if (req.user!.role !== 'admin' && req.user!.restaurantId.toString() !== restaurantId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const menuItem = await MenuItem.create({
        restaurantId,
        name,
        description,
        price,
        category,
        tags: tags || [],
        imageUrl,
        ingredients: ingredients || [],
        nutritionInfo,
      });

      logger.info({ menuItemId: menuItem._id, restaurantId }, 'Menu item created');

      res.status(201).json({ menuItem });
    } catch (error) {
      logger.error('Create menu item error:', error);
      res.status(500).json({ error: 'Failed to create menu item' });
    }
  }
);

/**
 * PUT /api/v1/menu/:id
 * Update menu item
 */
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'owner', 'manager'),
  validate([param('id').isMongoId().withMessage('Invalid menu item ID')]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const menuItem = await MenuItem.findById(req.params.id);
      
      if (!menuItem) {
        res.status(404).json({ error: 'Menu item not found' });
        return;
      }

      // Verify user has access to this restaurant
      if (req.user!.role !== 'admin' && req.user!.restaurantId.toString() !== menuItem.restaurantId.toString()) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const { name, description, price, category, tags, imageUrl, ingredients, nutritionInfo, isActive, isAvailable, sortOrder } = req.body;

      const updates: Record<string, unknown> = {};
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (price !== undefined) updates.price = price;
      if (category !== undefined) updates.category = category;
      if (tags !== undefined) updates.tags = tags;
      if (imageUrl !== undefined) updates.imageUrl = imageUrl;
      if (ingredients !== undefined) updates.ingredients = ingredients;
      if (nutritionInfo !== undefined) updates.nutritionInfo = nutritionInfo;
      if (isActive !== undefined) updates.isActive = isActive;
      if (isAvailable !== undefined) updates.isAvailable = isAvailable;
      if (sortOrder !== undefined) updates.sortOrder = sortOrder;

      const updated = await MenuItem.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
        { new: true }
      );

      logger.info({ menuItemId: req.params.id }, 'Menu item updated');

      res.json({ menuItem: updated });
    } catch (error) {
      logger.error('Update menu item error:', error);
      res.status(500).json({ error: 'Failed to update menu item' });
    }
  }
);

/**
 * DELETE /api/v1/menu/:id
 * Delete menu item (soft delete)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin', 'owner', 'manager'),
  validate([param('id').isMongoId().withMessage('Invalid menu item ID')]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const menuItem = await MenuItem.findById(req.params.id);
      
      if (!menuItem) {
        res.status(404).json({ error: 'Menu item not found' });
        return;
      }

      // Verify user has access to this restaurant
      if (req.user!.role !== 'admin' && req.user!.restaurantId.toString() !== menuItem.restaurantId.toString()) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      await MenuItem.findByIdAndUpdate(req.params.id, { isActive: false });

      logger.info({ menuItemId: req.params.id }, 'Menu item deleted');

      res.json({ message: 'Menu item deleted' });
    } catch (error) {
      logger.error('Delete menu item error:', error);
      res.status(500).json({ error: 'Failed to delete menu item' });
    }
  }
);

export default router;
