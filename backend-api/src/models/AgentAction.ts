/**
 * BREWAI v4 AgentAction Model
 * Author: BUILD-AGENT v1
 * 
 * Records of AI agent suggestions and actions with approval workflow.
 */

import mongoose, { Schema, Document } from 'mongoose';

export type AgentActionType = 
  | 'announcement.suggestion'
  | 'layout.suggestion'
  | 'menu.suggestion'
  | 'ops.insight'
  | 'ux.hypothesis';

export type AgentActionStatus = 'draft' | 'suggested' | 'approved' | 'rejected' | 'applied' | 'failed';

export interface IAgentAction extends Document {
  _id: mongoose.Types.ObjectId;
  type: AgentActionType;
  actor: string; // Agent identifier (e.g., 'announcement-agent', 'ux-agent')
  restaurantId: mongoose.Types.ObjectId;
  payload: Record<string, unknown>;
  diff?: Record<string, unknown>; // Changes to be applied
  status: AgentActionStatus;
  confidence: number; // 0-1 confidence score
  explanation: string;
  provenance: {
    model: string;
    promptTemplate: string;
    inputSummary: string;
    timestamp: Date;
  };
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  appliedAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AgentActionSchema = new Schema<IAgentAction>(
  {
    type: {
      type: String,
      required: [true, 'Action type is required'],
      enum: [
        'announcement.suggestion',
        'layout.suggestion',
        'menu.suggestion',
        'ops.insight',
        'ux.hypothesis',
      ],
    },
    actor: {
      type: String,
      required: [true, 'Actor is required'],
      trim: true,
    },
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Restaurant ID is required'],
      index: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: [true, 'Payload is required'],
    },
    diff: {
      type: Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ['draft', 'suggested', 'approved', 'rejected', 'applied', 'failed'],
      default: 'draft',
    },
    confidence: {
      type: Number,
      required: [true, 'Confidence score is required'],
      min: [0, 'Confidence must be between 0 and 1'],
      max: [1, 'Confidence must be between 0 and 1'],
    },
    explanation: {
      type: String,
      required: [true, 'Explanation is required'],
      trim: true,
    },
    provenance: {
      model: { type: String, required: true },
      promptTemplate: { type: String, required: true },
      inputSummary: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    reviewNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Review notes cannot exceed 1000 characters'],
    },
    appliedAt: {
      type: Date,
    },
    errorMessage: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
AgentActionSchema.index({ restaurantId: 1, status: 1 });
AgentActionSchema.index({ restaurantId: 1, type: 1, status: 1 });
AgentActionSchema.index({ actor: 1, status: 1 });
AgentActionSchema.index({ status: 1, createdAt: -1 });

export const AgentAction = mongoose.model<IAgentAction>('AgentAction', AgentActionSchema);
export default AgentAction;
