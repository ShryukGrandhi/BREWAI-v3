/**
 * BREWAI v4 InventoryCount Model
 * Author: BUILD-AGENT v1
 * 
 * Inventory count records for tracking stock levels.
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IInventoryCount extends Document {
  _id: mongoose.Types.ObjectId;
  restaurantId: mongoose.Types.ObjectId;
  ingredientId: mongoose.Types.ObjectId;
  countedAt: Date;
  qty: number;
  previousQty?: number;
  variance?: number;
  countedBy: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryCountSchema = new Schema<IInventoryCount>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Restaurant ID is required'],
      index: true,
    },
    ingredientId: {
      type: Schema.Types.ObjectId,
      ref: 'Ingredient',
      required: [true, 'Ingredient ID is required'],
      index: true,
    },
    countedAt: {
      type: Date,
      required: [true, 'Count date is required'],
      default: Date.now,
    },
    qty: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    previousQty: {
      type: Number,
      min: 0,
    },
    variance: {
      type: Number,
    },
    countedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Counter user ID is required'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
InventoryCountSchema.index({ restaurantId: 1, ingredientId: 1, countedAt: -1 });
InventoryCountSchema.index({ restaurantId: 1, countedAt: -1 });

// Calculate variance before saving
InventoryCountSchema.pre('save', function (next) {
  if (this.previousQty !== undefined && this.previousQty !== null) {
    this.variance = this.qty - this.previousQty;
  }
  next();
});

export const InventoryCount = mongoose.model<IInventoryCount>('InventoryCount', InventoryCountSchema);
export default InventoryCount;
