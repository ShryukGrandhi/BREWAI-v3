/**
 * BREWAI v4 Session Model
 * Author: BUILD-AGENT v1
 * 
 * Session tracking for user behavior analytics and replay.
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ISessionChunk {
  chunkId: string;
  minioKey: string;
  ts: Date;
  eventCount: number;
  sizeBytes: number;
}

export interface ISession extends Document {
  _id: string; // Session ID (UUID)
  restaurantId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  visitorId: string; // Anonymous visitor identifier
  startTs: Date;
  endTs?: Date;
  duration?: number; // Duration in milliseconds
  sampled: boolean;
  consent: boolean;
  deviceInfo: {
    userAgent: string;
    screenWidth: number;
    screenHeight: number;
    devicePixelRatio: number;
    platform: string;
    language: string;
  };
  pageViews: {
    url: string;
    title: string;
    ts: Date;
    duration?: number;
  }[];
  chunks: ISessionChunk[];
  eventCount: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const SessionChunkSchema = new Schema<ISessionChunk>(
  {
    chunkId: { type: String, required: true },
    minioKey: { type: String, required: true },
    ts: { type: Date, required: true },
    eventCount: { type: Number, default: 0 },
    sizeBytes: { type: Number, default: 0 },
  },
  { _id: false }
);

const SessionSchema = new Schema<ISession>(
  {
    _id: {
      type: String,
      required: true,
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Restaurant ID is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    visitorId: {
      type: String,
      required: true,
      index: true,
    },
    startTs: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endTs: {
      type: Date,
    },
    duration: {
      type: Number,
    },
    sampled: {
      type: Boolean,
      default: false,
    },
    consent: {
      type: Boolean,
      default: false,
    },
    deviceInfo: {
      userAgent: { type: String, default: '' },
      screenWidth: { type: Number, default: 0 },
      screenHeight: { type: Number, default: 0 },
      devicePixelRatio: { type: Number, default: 1 },
      platform: { type: String, default: '' },
      language: { type: String, default: '' },
    },
    pageViews: [
      {
        url: { type: String, required: true },
        title: { type: String, default: '' },
        ts: { type: Date, required: true },
        duration: { type: Number },
      },
    ],
    chunks: [SessionChunkSchema],
    eventCount: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
SessionSchema.index({ restaurantId: 1, startTs: -1 });
SessionSchema.index({ restaurantId: 1, sampled: 1, consent: 1 });
SessionSchema.index({ visitorId: 1, startTs: -1 });

export const Session = mongoose.model<ISession>('Session', SessionSchema);
export default Session;
