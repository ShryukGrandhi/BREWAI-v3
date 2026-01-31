/**
 * BREWAI v4 Restaurant Model
 * Author: BUILD-AGENT v1
 * 
 * Restaurant schema with site configuration for dynamic website.
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ISiteConfig {
  layoutJson: Record<string, unknown>;
  featureFlags: Record<string, boolean>;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
  };
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  social: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  hours: {
    day: string;
    open: string;
    close: string;
    isClosed: boolean;
  }[];
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
}

export interface IRestaurant extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  timezone: string;
  currency: string;
  siteConfig: ISiteConfig;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SiteConfigSchema = new Schema<ISiteConfig>(
  {
    layoutJson: {
      type: Schema.Types.Mixed,
      default: {},
    },
    featureFlags: {
      type: Map,
      of: Boolean,
      default: new Map([
        ['showMenu', true],
        ['showAnnouncements', true],
        ['enableOrdering', false],
        ['showReviews', true],
      ]),
    },
    theme: {
      primaryColor: { type: String, default: '#0f172a' },
      secondaryColor: { type: String, default: '#f97316' },
      fontFamily: { type: String, default: 'Inter' },
    },
    seo: {
      title: { type: String, default: '' },
      description: { type: String, default: '' },
      keywords: [{ type: String }],
    },
    social: {
      facebook: String,
      instagram: String,
      twitter: String,
    },
    hours: [
      {
        day: { type: String, required: true },
        open: { type: String, default: '09:00' },
        close: { type: String, default: '21:00' },
        isClosed: { type: Boolean, default: false },
      },
    ],
    contactEmail: String,
    contactPhone: String,
    address: String,
  },
  { _id: false }
);

const RestaurantSchema = new Schema<IRestaurant>(
  {
    name: {
      type: String,
      required: [true, 'Restaurant name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    timezone: {
      type: String,
      default: 'America/New_York',
    },
    currency: {
      type: String,
      default: 'USD',
    },
    siteConfig: {
      type: SiteConfigSchema,
      default: () => ({}),
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

// Index for faster queries
RestaurantSchema.index({ slug: 1 });
RestaurantSchema.index({ isActive: 1 });

// Generate slug from name before saving
RestaurantSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

export const Restaurant = mongoose.model<IRestaurant>('Restaurant', RestaurantSchema);
export default Restaurant;
