/**
 * BREWAI v4 Inventory Routes
 * Author: BUILD-AGENT v1
 * 
 * Routes for inventory count management.
 */

import { Router, Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { InventoryCount, Ingredient } from '../models';
import { authenticate, authorize, requireRestaurantAccess } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/v1/inventory_counts
 * Get inventory counts
 */
router.get(
  '/',
  authenticate,
  validate([
    query('restaurantId').isMongoId().withMessage('Restaurant ID is required'),
    query('ingredientId').optional().isMongoId(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { restaurantId, ingredientId, startDate, endDate } = req.query;

      // Verify user has access to this restaurant
      if (req.user!.role !== 'admin' && req.user!.restaurantId.toString() !== restaurantId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const filter: Record<string, unknown> = { restaurantId };
      if (ingredientId) filter.ingredientId = ingredientId;
      if (startDate || endDate) {
        filter.countedAt = {};
        if (startDate) (filter.countedAt as Record<string, Date>).$gte = new Date(startDate as string);
        if (endDate) (filter.countedAt as Record<string, Date>).$lte = new Date(endDate as string);
      }

      const counts = await InventoryCount.find(filter)
        .populate('ingredientId', 'name unit category')
        .populate('countedBy', 'name')
        .sort({ countedAt: -1 })
        .limit(500);

      res.json({ counts });
    } catch (error) {
      logger.error('Get inventory counts error:', error);
      res.status(500).json({ error: 'Failed to get inventory counts' });
    }
  }
);

/**
 * GET /api/v1/inventory_counts/current
 * Get current inventory levels (latest count for each ingredient)
 */
router.get(
  '/current',
  authenticate,
  validate([
    query('restaurantId').isMongoId().withMessage('Restaurant ID is required'),
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { restaurantId } = req.query;

      // Verify user has access to this restaurant
      if (req.user!.role !== 'admin' && req.user!.restaurantId.toString() !== restaurantId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      // Get all ingredients for the restaurant
      const ingredients = await Ingredient.find({ 
        restaurantId, 
        isActive: true 
      });

      // Get latest count for each ingredient
      const currentInventory = await Promise.all(
        ingredients.map(async (ingredient) => {
          const latestCount = await InventoryCount.findOne({
            restaurantId,
            ingredientId: ingredient._id,
          })
            .sort({ countedAt: -1 })
            .populate('countedBy', 'name');

          return {
            ingredient,
            latestCount,
            belowPar: latestCount ? latestCount.qty < ingredient.parLevel : true,
          };
        })
      );

      res.json({ 
        inventory: currentInventory,
        lowStockCount: currentInventory.filter(i => i.belowPar).length,
      });
    } catch (error) {
      logger.error('Get current inventory error:', error);
      res.status(500).json({ error: 'Failed to get current inventory' });
    }
  }
);

/**
 * POST /api/v1/inventory_counts
 * Record inventory count
 */
router.post(
  '/',
  authenticate,
  validate([
    body('restaurantId').isMongoId().withMessage('Restaurant ID is required'),
    body('ingredientId').isMongoId().withMessage('Ingredient ID is required'),
    body('qty').isFloat({ min: 0 }).withMessage('Quantity must be a positive number'),
    body('notes').optional().trim(),
    body('countedAt').optional().isISO8601(),
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { restaurantId, ingredientId, qty, notes, countedAt } = req.body;

      // Verify user has access to this restaurant
      if (req.user!.role !== 'admin' && req.user!.restaurantId.toString() !== restaurantId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      // Verify ingredient exists and belongs to restaurant
      const ingredient = await Ingredient.findOne({
        _id: ingredientId,
        restaurantId,
        isActive: true,
      });

      if (!ingredient) {
        res.status(404).json({ error: 'Ingredient not found' });
        return;
      }

      // Get previous count for variance calculation
      const previousCount = await InventoryCount.findOne({
        restaurantId,
        ingredientId,
      }).sort({ countedAt: -1 });

      const count = await InventoryCount.create({
        restaurantId,
        ingredientId,
        qty,
        previousQty: previousCount?.qty,
        countedBy: req.userId,
        notes,
        countedAt: countedAt ? new Date(countedAt) : new Date(),
      });

      await count.populate('ingredientId', 'name unit');
      await count.populate('countedBy', 'name');

      logger.info({ 
        countId: count._id, 
        ingredientId, 
        qty, 
        variance: count.variance 
      }, 'Inventory count recorded');

      res.status(201).json({ count });
    } catch (error) {
      logger.error('Create inventory count error:', error);
      res.status(500).json({ error: 'Failed to create inventory count' });
    }
  }
);

/**
 * POST /api/v1/inventory_counts/bulk
 * Record multiple inventory counts at once
 */
router.post(
  '/bulk',
  authenticate,
  validate([
    body('restaurantId').isMongoId().withMessage('Restaurant ID is required'),
    body('counts').isArray({ min: 1 }).withMessage('Counts array is required'),
    body('counts.*.ingredientId').isMongoId(),
    body('counts.*.qty').isFloat({ min: 0 }),
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { restaurantId, counts } = req.body;

      // Verify user has access to this restaurant
      if (req.user!.role !== 'admin' && req.user!.restaurantId.toString() !== restaurantId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const countedAt = new Date();
      const createdCounts = [];

      for (const item of counts) {
        // Get previous count for variance
        const previousCount = await InventoryCount.findOne({
          restaurantId,
          ingredientId: item.ingredientId,
        }).sort({ countedAt: -1 });

        const count = await InventoryCount.create({
          restaurantId,
          ingredientId: item.ingredientId,
          qty: item.qty,
          previousQty: previousCount?.qty,
          countedBy: req.userId,
          notes: item.notes,
          countedAt,
        });

        createdCounts.push(count);
      }

      logger.info({ 
        restaurantId, 
        countCount: createdCounts.length 
      }, 'Bulk inventory counts recorded');

      res.status(201).json({ 
        counts: createdCounts,
        message: `${createdCounts.length} counts recorded`,
      });
    } catch (error) {
      logger.error('Bulk inventory count error:', error);
      res.status(500).json({ error: 'Failed to create inventory counts' });
    }
  }
);

export default router;
