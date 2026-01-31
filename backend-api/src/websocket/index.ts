import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Session } from '../models/Session';
import logger from '../utils/logger';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  restaurantId?: string;
  sessionId?: string;
}

let io: Server;

export function initializeWebSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
      credentials: true
    },
    pingInterval: 10000,
    pingTimeout: 5000
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || 
                    socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      const user = await User.findById(decoded.userId).select('-password');

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.restaurantId = user.restaurantId?.toString();
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`Client connected: ${socket.id}, User: ${socket.userId}`);

    // Join restaurant room
    if (socket.restaurantId) {
      socket.join(`restaurant:${socket.restaurantId}`);
    }

    // Handle session tracking
    socket.on('session:start', async (data) => {
      try {
        const session = await Session.create({
          restaurantId: socket.restaurantId,
          userId: socket.userId,
          startedAt: new Date(),
          userAgent: socket.handshake.headers['user-agent'],
          ipAddress: socket.handshake.address,
          events: [],
          metadata: data.metadata || {}
        });

        socket.sessionId = session._id.toString();
        socket.emit('session:started', { sessionId: session._id });
      } catch (error) {
        logger.error('Failed to start session:', error);
        socket.emit('error', { message: 'Failed to start session' });
      }
    });

    socket.on('session:event', async (event) => {
      if (!socket.sessionId) return;

      try {
        await Session.findByIdAndUpdate(socket.sessionId, {
          $push: {
            events: {
              type: event.type,
              timestamp: new Date(),
              data: event.data,
              target: event.target
            }
          }
        });
      } catch (error) {
        logger.error('Failed to record session event:', error);
      }
    });

    socket.on('session:end', async () => {
      if (!socket.sessionId) return;

      try {
        await Session.findByIdAndUpdate(socket.sessionId, {
          endedAt: new Date()
        });
      } catch (error) {
        logger.error('Failed to end session:', error);
      }
    });

    // Handle real-time subscriptions
    socket.on('subscribe:agents', () => {
      socket.join(`agents:${socket.restaurantId}`);
    });

    socket.on('subscribe:inventory', () => {
      socket.join(`inventory:${socket.restaurantId}`);
    });

    socket.on('subscribe:analytics', () => {
      socket.join(`analytics:${socket.restaurantId}`);
    });

    socket.on('unsubscribe', (channel: string) => {
      socket.leave(`${channel}:${socket.restaurantId}`);
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      logger.info(`Client disconnected: ${socket.id}`);

      if (socket.sessionId) {
        try {
          await Session.findByIdAndUpdate(socket.sessionId, {
            endedAt: new Date()
          });
        } catch (error) {
          logger.error('Failed to end session on disconnect:', error);
        }
      }
    });
  });

  return io;
}

// Utility functions for emitting events
export function emitToRestaurant(restaurantId: string, event: string, data: any): void {
  if (io) {
    io.to(`restaurant:${restaurantId}`).emit(event, data);
  }
}

export function emitAgentUpdate(restaurantId: string, data: any): void {
  if (io) {
    io.to(`agents:${restaurantId}`).emit('agent:update', data);
  }
}

export function emitInventoryUpdate(restaurantId: string, data: any): void {
  if (io) {
    io.to(`inventory:${restaurantId}`).emit('inventory:update', data);
  }
}

export function emitAnalyticsUpdate(restaurantId: string, data: any): void {
  if (io) {
    io.to(`analytics:${restaurantId}`).emit('analytics:update', data);
  }
}

export function emitNotification(restaurantId: string, notification: {
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  actionRequired?: boolean;
  actionId?: string;
}): void {
  if (io) {
    io.to(`restaurant:${restaurantId}`).emit('notification', notification);
  }
}

export { io };
