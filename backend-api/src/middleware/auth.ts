/**
 * BREWAI v4 Authentication Middleware
 * Author: BUILD-AGENT v1
 * 
 * JWT authentication and RBAC authorization middleware.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser, UserRole } from '../models';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      userId?: string;
    }
  }
}

interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  restaurantId: string;
  iat: number;
  exp: number;
}

/**
 * Authentication middleware - verifies JWT token
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'User not found or inactive' });
      return;
    }

    req.user = user;
    req.userId = decoded.userId;
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    
    logger.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
}

/**
 * Optional authentication - attaches user if token present, but doesn't require it
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    const user = await User.findById(decoded.userId);
    
    if (user && user.isActive) {
      req.user = user;
      req.userId = decoded.userId;
    }
    
    next();
  } catch {
    // Token invalid, continue without user
    next();
  }
}

/**
 * Role-based authorization middleware
 * @param allowedRoles Array of roles that are allowed to access the route
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn({
        message: 'Unauthorized access attempt',
        userId: req.userId,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        path: req.path,
      });
      
      res.status(403).json({ 
        error: 'Forbidden',
        message: 'You do not have permission to perform this action',
      });
      return;
    }

    next();
  };
}

/**
 * Restaurant ownership check - ensures user belongs to the restaurant
 */
export function requireRestaurantAccess(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const restaurantId = req.params.restaurantId || req.params.id || req.body.restaurantId;
  
  // Admin can access any restaurant
  if (req.user.role === 'admin') {
    return next();
  }

  if (!restaurantId) {
    res.status(400).json({ error: 'Restaurant ID required' });
    return;
  }

  if (req.user.restaurantId.toString() !== restaurantId) {
    res.status(403).json({ 
      error: 'Forbidden',
      message: 'You do not have access to this restaurant',
    });
    return;
  }

  next();
}

/**
 * Generate JWT token
 */
export function generateToken(user: IUser): string {
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    restaurantId: user.restaurantId.toString(),
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(user: IUser): string {
  const payload = {
    userId: user._id.toString(),
    type: 'refresh',
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });
}

export default {
  authenticate,
  optionalAuth,
  authorize,
  requireRestaurantAccess,
  generateToken,
  generateRefreshToken,
};
