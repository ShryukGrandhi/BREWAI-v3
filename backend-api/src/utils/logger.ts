/**
 * BREWAI v4 Logger Utility
 * Author: BUILD-AGENT v1
 * 
 * Structured JSON logging using Pino for observability.
 */

import pino from 'pino';

const isDev = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  base: {
    service: 'brewai-backend',
    version: '4.0.0',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export default logger;
