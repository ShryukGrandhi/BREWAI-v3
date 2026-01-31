/**
 * BREWAI v4 Ingredient Model
 * Author: BUILD-AGENT v1
 * 
 * Ingredient schema for inventory management.
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IIngredient extends Document {
  _id: mongoose.Types.ObjectId;
  restaurantId: mongoose.Types.ObjectId;
  name: string;
  unit: string;
  costPerUnit: number;
  vendorId?: mongoose.Types.ObjectId;
  vendorName?: string;
  category: string;
  parLevel: number; // Minimum stock level before reorder
  reorderQty: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const IngredientSchema = new Schema<IIngredient>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Restaurant ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Ingredient name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      trim: true,
      enum: ['kg', 'g', 'lb', 'oz', 'L', 'ml', 'gal', 'each', 'case', 'box'],
    },
    costPerUnit: {
      type: Number,
      required: [true, 'Cost per unit is required'],
      min: [0, 'Cost cannot be negative'],
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'Vendor',
    },
    vendorName: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: ['produce', 'meat', 'seafood', 'dairy', 'dry-goods', 'beverages', 'supplies', 'other'],
    },
    parLevel: {
      type: Number,
      default: 0,
      min: 0,
    },
    reorderQty: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
IngredientSchema.index({ restaurantId: 1, name: 1 });
IngredientSchema.index({ restaurantId: 1, category: 1 });

export const Ingredient = mongoose.model<IIngredient>('Ingredient', IngredientSchema);
export default Ingredient;
