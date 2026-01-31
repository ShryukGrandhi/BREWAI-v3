/**
 * BREWAI v4 Event Model
 * Author: BUILD-AGENT v1
 * 
 * Analytics events for session tracking.
 */

import mongoose, { Schema, Document } from 'mongoose';

export type EventType = 
  | 'pageview'
  | 'click'
  | 'scroll'
  | 'input'
  | 'mousemove'
  | 'resize'
  | 'visibility'
  | 'error'
  | 'custom';

export interface IEvent extends Document {
  _id: mongoose.Types.ObjectId;
  sessionId: string;
  restaurantId: mongoose.Types.ObjectId;
  type: EventType;
  payload: Record<string, unknown>;
  ts: Date;
  url: string;
  userAgent?: string;
  ipHash?: string;
  createdAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    sessionId: {
      type: String,
      required: [true, 'Session ID is required'],
      index: true,
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Restaurant ID is required'],
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Event type is required'],
      enum: ['pageview', 'click', 'scroll', 'input', 'mousemove', 'resize', 'visibility', 'error', 'custom'],
    },
    payload: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ts: {
      type: Date,
      required: true,
      default: Date.now,
    },
    url: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
    },
    ipHash: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound indexes for efficient queries
EventSchema.index({ sessionId: 1, ts: 1 });
EventSchema.index({ restaurantId: 1, type: 1, ts: -1 });
EventSchema.index({ restaurantId: 1, ts: -1 });

// TTL index - automatically delete events older than 90 days
EventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const Event = mongoose.model<IEvent>('Event', EventSchema);
export default Event;
