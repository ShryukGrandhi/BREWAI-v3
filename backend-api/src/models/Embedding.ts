/**
 * BREWAI v4 Embedding Model
 * Author: BUILD-AGENT v1
 * 
 * Vector embeddings for semantic search (Ops Copilot).
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IEmbedding extends Document {
  _id: mongoose.Types.ObjectId;
  docId: mongoose.Types.ObjectId;
  docType: string;
  restaurantId: mongoose.Types.ObjectId;
  vector: number[];
  text: string;
  source: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const EmbeddingSchema = new Schema<IEmbedding>(
  {
    docId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Document ID is required'],
      index: true,
    },
    docType: {
      type: String,
      required: [true, 'Document type is required'],
      enum: ['knowledge_base', 'menu_item', 'announcement', 'ops_doc'],
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Restaurant ID is required'],
      index: true,
    },
    vector: {
      type: [Number],
      required: [true, 'Vector is required'],
    },
    text: {
      type: String,
      required: [true, 'Text is required'],
    },
    source: {
      type: String,
      required: [true, 'Source is required'],
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
EmbeddingSchema.index({ restaurantId: 1, docType: 1 });
EmbeddingSchema.index({ docId: 1, docType: 1 });

export const Embedding = mongoose.model<IEmbedding>('Embedding', EmbeddingSchema);
export default Embedding;
