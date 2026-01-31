/**
 * BREWAI v4 KnowledgeBase Model
 * Author: BUILD-AGENT v1
 * 
 * Documents ingested from Firecrawl/Reducto for AI knowledge.
 */

import mongoose, { Schema, Document } from 'mongoose';

export type DocumentSource = 'firecrawl' | 'reducto' | 'manual' | 'api';

export interface IKnowledgeBase extends Document {
  _id: mongoose.Types.ObjectId;
  restaurantId: mongoose.Types.ObjectId;
  source: DocumentSource;
  sourceUrl?: string;
  sourceFile?: string;
  title: string;
  content: string;
  contentType: string;
  metadata: Record<string, unknown>;
  tags: string[];
  isActive: boolean;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeBaseSchema = new Schema<IKnowledgeBase>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Restaurant ID is required'],
      index: true,
    },
    source: {
      type: String,
      required: [true, 'Source is required'],
      enum: ['firecrawl', 'reducto', 'manual', 'api'],
    },
    sourceUrl: {
      type: String,
      trim: true,
    },
    sourceFile: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [500, 'Title cannot exceed 500 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    contentType: {
      type: String,
      default: 'text/plain',
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
KnowledgeBaseSchema.index({ restaurantId: 1, source: 1 });
KnowledgeBaseSchema.index({ restaurantId: 1, tags: 1 });
KnowledgeBaseSchema.index({ title: 'text', content: 'text' });

export const KnowledgeBase = mongoose.model<IKnowledgeBase>('KnowledgeBase', KnowledgeBaseSchema);
export default KnowledgeBase;
