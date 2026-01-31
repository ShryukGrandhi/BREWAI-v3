/**
 * BREWAI v4 Announcement Model
 * Author: BUILD-AGENT v1
 * 
 * Announcements for the restaurant website.
 */

import mongoose, { Schema, Document } from 'mongoose';

export type AnnouncementStatus = 'draft' | 'scheduled' | 'published' | 'expired' | 'archived';
export type AnnouncementTarget = 'all' | 'web' | 'email' | 'app';

export interface IAnnouncement extends Document {
  _id: mongoose.Types.ObjectId;
  restaurantId: mongoose.Types.ObjectId;
  title: string;
  body: string;
  imageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  status: AnnouncementStatus;
  targetSegments: AnnouncementTarget[];
  publishAt?: Date;
  expiresAt?: Date;
  publishedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  publishedBy?: mongoose.Types.ObjectId;
  agentGenerated: boolean;
  agentActionId?: mongoose.Types.ObjectId;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Restaurant ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    body: {
      type: String,
      required: [true, 'Body is required'],
      trim: true,
      maxlength: [2000, 'Body cannot exceed 2000 characters'],
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    ctaText: {
      type: String,
      trim: true,
      maxlength: [100, 'CTA text cannot exceed 100 characters'],
    },
    ctaUrl: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'published', 'expired', 'archived'],
      default: 'draft',
    },
    targetSegments: [
      {
        type: String,
        enum: ['all', 'web', 'email', 'app'],
      },
    ],
    publishAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
    publishedAt: {
      type: Date,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator user ID is required'],
    },
    publishedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    agentGenerated: {
      type: Boolean,
      default: false,
    },
    agentActionId: {
      type: Schema.Types.ObjectId,
      ref: 'AgentAction',
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
AnnouncementSchema.index({ restaurantId: 1, status: 1 });
AnnouncementSchema.index({ restaurantId: 1, publishAt: 1 });
AnnouncementSchema.index({ status: 1, publishAt: 1 });

export const Announcement = mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
export default Announcement;
