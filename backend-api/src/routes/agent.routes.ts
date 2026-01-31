/**
 * BREWAI v4 Agent Routes
 * Author: BUILD-AGENT v1
 * 
 * Routes for agent actions and approval workflow.
 */

import { Router, Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { AgentAction, Announcement, Restaurant } from '../models';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/v1/agents/announcement/suggest
 * Agent suggests an announcement (creates agent action)
 */
router.post(
  '/announcement/suggest',
  validate([
    body('restaurantId').isMongoId().withMessage('Restaurant ID is required'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('body').trim().notEmpty().withMessage('Body is required'),
    body('targetSegments').optional().isArray(),
    body('confidence').isFloat({ min: 0, max: 1 }).withMessage('Confidence must be between 0 and 1'),
    body('explanation').trim().notEmpty().withMessage('Explanation is required'),
    body('model').trim().notEmpty().withMessage('Model name is required'),
    body('promptTemplate').trim().notEmpty().withMessage('Prompt template is required'),
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { 
        restaurantId, 
        title, 
        body: announcementBody, 
        targetSegments,
        publishWindow,
        confidence,
        explanation,
        model,
        promptTemplate,
        inputSummary,
      } = req.body;

      // Verify restaurant exists
      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        res.status(404).json({ error: 'Restaurant not found' });
        return;
      }

      const agentAction = await AgentAction.create({
        type: 'announcement.suggestion',
        actor: 'announcement-agent',
        restaurantId,
        payload: {
          title,
          body: announcementBody,
          targetSegments: targetSegments || ['all'],
          suggestedPublishWindow: publishWindow,
        },
        diff: {
          announcements: {
            add: {
              title,
              body: announcementBody,
              targetSegments: targetSegments || ['all'],
              status: 'draft',
            },
          },
        },
        confidence,
        explanation,
        status: 'suggested',
        provenance: {
          model,
          promptTemplate,
          inputSummary: inputSummary || 'Agent-generated suggestion',
          timestamp: new Date(),
        },
      });

      logger.info({ 
        actionId: agentAction._id, 
        restaurantId, 
        type: 'announcement.suggestion' 
      }, 'Agent action created');

      res.status(201).json({ agentAction });
    } catch (error) {
      logger.error('Create agent suggestion error:', error);
      res.status(500).json({ error: 'Failed to create suggestion' });
    }
  }
);

/**
 * GET /api/v1/agents/actions
 * List agent actions
 */
router.get(
  '/actions',
  authenticate,
  authorize('admin', 'owner', 'manager'),
  validate([
    query('restaurantId').isMongoId().withMessage('Restaurant ID is required'),
    query('status').optional().isIn(['draft', 'suggested', 'approved', 'rejected', 'applied', 'failed']),
    query('type').optional(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { restaurantId, status, type } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      // Verify user has access to this restaurant
      if (req.user!.role !== 'admin' && req.user!.restaurantId.toString() !== restaurantId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const filter: Record<string, unknown> = { restaurantId };
      if (status) filter.status = status;
      if (type) filter.type = type;

      const [actions, total] = await Promise.all([
        AgentAction.find(filter)
          .populate('reviewedBy', 'name')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        AgentAction.countDocuments(filter),
      ]);

      res.json({
        actions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error('List agent actions error:', error);
      res.status(500).json({ error: 'Failed to list agent actions' });
    }
  }
);

/**
 * GET /api/v1/agents/actions/:id
 * Get agent action details
 */
router.get(
  '/actions/:id',
  authenticate,
  authorize('admin', 'owner', 'manager'),
  validate([param('id').isMongoId().withMessage('Invalid action ID')]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const action = await AgentAction.findById(req.params.id)
        .populate('reviewedBy', 'name');

      if (!action) {
        res.status(404).json({ error: 'Agent action not found' });
        return;
      }

      // Verify user has access to this restaurant
      if (req.user!.role !== 'admin' && req.user!.restaurantId.toString() !== action.restaurantId.toString()) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      res.json({ action });
    } catch (error) {
      logger.error('Get agent action error:', error);
      res.status(500).json({ error: 'Failed to get agent action' });
    }
  }
);

/**
 * POST /api/v1/agents/actions/:id/approve
 * Approve and apply agent action
 */
router.post(
  '/actions/:id/approve',
  authenticate,
  authorize('admin', 'owner'),
  validate([
    param('id').isMongoId().withMessage('Invalid action ID'),
    body('notes').optional().trim(),
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { notes } = req.body;

      const action = await AgentAction.findById(req.params.id);

      if (!action) {
        res.status(404).json({ error: 'Agent action not found' });
        return;
      }

      // Verify user has access to this restaurant
      if (req.user!.role !== 'admin' && req.user!.restaurantId.toString() !== action.restaurantId.toString()) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      if (action.status !== 'suggested') {
        res.status(400).json({ error: `Cannot approve action with status: ${action.status}` });
        return;
      }

      // Apply the action based on type
      try {
        await applyAgentAction(action, req.userId!);

        // Update action status
        await AgentAction.findByIdAndUpdate(req.params.id, {
          $set: {
            status: 'applied',
            reviewedBy: req.userId,
            reviewedAt: new Date(),
            reviewNotes: notes,
            appliedAt: new Date(),
          },
        });

        logger.info({ actionId: action._id, approvedBy: req.userId }, 'Agent action approved and applied');

        res.json({ message: 'Action approved and applied', action });
      } catch (applyError) {
        // Update action as failed
        await AgentAction.findByIdAndUpdate(req.params.id, {
          $set: {
            status: 'failed',
            reviewedBy: req.userId,
            reviewedAt: new Date(),
            errorMessage: (applyError as Error).message,
          },
        });

        throw applyError;
      }
    } catch (error) {
      logger.error('Approve agent action error:', error);
      res.status(500).json({ error: 'Failed to approve agent action' });
    }
  }
);

/**
 * POST /api/v1/agents/actions/:id/reject
 * Reject agent action
 */
router.post(
  '/actions/:id/reject',
  authenticate,
  authorize('admin', 'owner', 'manager'),
  validate([
    param('id').isMongoId().withMessage('Invalid action ID'),
    body('notes').trim().notEmpty().withMessage('Rejection reason is required'),
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { notes } = req.body;

      const action = await AgentAction.findById(req.params.id);

      if (!action) {
        res.status(404).json({ error: 'Agent action not found' });
        return;
      }

      // Verify user has access to this restaurant
      if (req.user!.role !== 'admin' && req.user!.restaurantId.toString() !== action.restaurantId.toString()) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      if (action.status !== 'suggested') {
        res.status(400).json({ error: `Cannot reject action with status: ${action.status}` });
        return;
      }

      await AgentAction.findByIdAndUpdate(req.params.id, {
        $set: {
          status: 'rejected',
          reviewedBy: req.userId,
          reviewedAt: new Date(),
          reviewNotes: notes,
        },
      });

      logger.info({ actionId: action._id, rejectedBy: req.userId }, 'Agent action rejected');

      res.json({ message: 'Action rejected' });
    } catch (error) {
      logger.error('Reject agent action error:', error);
      res.status(500).json({ error: 'Failed to reject agent action' });
    }
  }
);

/**
 * Apply agent action based on type
 */
async function applyAgentAction(action: InstanceType<typeof AgentAction>, userId: string): Promise<void> {
  switch (action.type) {
    case 'announcement.suggestion': {
      const payload = action.payload as {
        title: string;
        body: string;
        targetSegments: string[];
      };

      await Announcement.create({
        restaurantId: action.restaurantId,
        title: payload.title,
        body: payload.body,
        targetSegments: payload.targetSegments,
        status: 'draft',
        createdBy: userId,
        agentGenerated: true,
        agentActionId: action._id,
      });
      break;
    }

    case 'layout.suggestion': {
      const diff = action.diff as { siteConfig?: Record<string, unknown> };
      if (diff?.siteConfig) {
        await Restaurant.findByIdAndUpdate(action.restaurantId, {
          $set: { siteConfig: diff.siteConfig },
        });
      }
      break;
    }

    default:
      throw new Error(`Unknown action type: ${action.type}`);
  }
}

export default router;
