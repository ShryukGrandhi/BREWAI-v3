/**
 * BREWAI v4 Authentication Routes
 * Author: BUILD-AGENT v1
 * 
 * Routes for user registration, login, and profile.
 */

import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { User, Restaurant } from '../models';
import { authenticate, generateToken, generateRefreshToken } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/v1/auth/register
 * Register a new user
 */
router.post(
  '/register',
  validate([
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').optional().isIn(['owner', 'manager', 'staff']).withMessage('Invalid role'),
    body('restaurantId').optional().isMongoId().withMessage('Invalid restaurant ID'),
    body('restaurantName').optional().trim().notEmpty().withMessage('Restaurant name required if creating new'),
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, password, role = 'staff', restaurantId, restaurantName } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        res.status(409).json({ error: 'User with this email already exists' });
        return;
      }

      let finalRestaurantId = restaurantId;

      // If no restaurantId provided, create a new restaurant
      if (!restaurantId && restaurantName) {
        const newRestaurant = await Restaurant.create({
          name: restaurantName,
          slug: restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        });
        finalRestaurantId = newRestaurant._id;
      }

      if (!finalRestaurantId) {
        res.status(400).json({ error: 'Either restaurantId or restaurantName is required' });
        return;
      }

      // Verify restaurant exists
      const restaurant = await Restaurant.findById(finalRestaurantId);
      if (!restaurant) {
        res.status(404).json({ error: 'Restaurant not found' });
        return;
      }

      // Create user
      const user = await User.create({
        name,
        email,
        passwordHash: password, // Will be hashed by pre-save hook
        role: restaurantName ? 'owner' : role, // First user of new restaurant is owner
        restaurantId: finalRestaurantId,
      });

      // Generate tokens
      const token = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      logger.info({ userId: user._id, email: user.email }, 'User registered successfully');

      res.status(201).json({
        message: 'User registered successfully',
        user: user.toJSON(),
        token,
        refreshToken,
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

/**
 * POST /api/v1/auth/login
 * User login
 */
router.post(
  '/login',
  validate([
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      // Check if user is active
      if (!user.isActive) {
        res.status(401).json({ error: 'Account is deactivated' });
        return;
      }

      // Verify password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate tokens
      const token = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      logger.info({ userId: user._id, email: user.email }, 'User logged in');

      res.json({
        message: 'Login successful',
        user: user.toJSON(),
        token,
        refreshToken,
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

/**
 * GET /api/v1/auth/me
 * Get current user profile
 */
router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId).populate('restaurantId', 'name slug');
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user: user.toJSON() });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

/**
 * PUT /api/v1/auth/me
 * Update current user profile
 */
router.put(
  '/me',
  authenticate,
  validate([
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Valid email required'),
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email } = req.body;
      const updates: Record<string, string> = {};

      if (name) updates.name = name;
      if (email) {
        // Check if email is already taken
        const existingUser = await User.findByEmail(email);
        if (existingUser && existingUser._id.toString() !== req.userId) {
          res.status(409).json({ error: 'Email already in use' });
          return;
        }
        updates.email = email;
      }

      const user = await User.findByIdAndUpdate(
        req.userId,
        { $set: updates },
        { new: true }
      );

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({ user: user.toJSON() });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

/**
 * POST /api/v1/auth/change-password
 * Change user password
 */
router.post(
  '/change-password',
  authenticate,
  validate([
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(req.userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const isValidPassword = await user.comparePassword(currentPassword);
      if (!isValidPassword) {
        res.status(401).json({ error: 'Current password is incorrect' });
        return;
      }

      user.passwordHash = newPassword;
      await user.save();

      logger.info({ userId: user._id }, 'Password changed');

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      logger.error('Change password error:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  }
);

export default router;
