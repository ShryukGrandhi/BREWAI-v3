import { Types } from 'mongoose';

// User types
export type UserRole = 'owner' | 'manager' | 'staff' | 'viewer';

export interface IUser {
  _id: Types.ObjectId;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  restaurantId?: Types.ObjectId;
  avatar?: string;
  phone?: string;
  permissions: string[];
  isActive: boolean;
  lastLogin?: Date;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Restaurant types
export interface IRestaurant {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  operatingHours: Array<{
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }>;
  settings: {
    timezone: string;
    currency: string;
    language: string;
    taxRate: number;
    serviceChargeRate?: number;
  };
  integrations: {
    pos?: {
      provider: string;
      apiKey: string;
      locationId: string;
    };
    accounting?: {
      provider: string;
      apiKey: string;
    };
    delivery?: Array<{
      provider: string;
      apiKey: string;
      storeId: string;
    }>;
  };
  subscription: {
    plan: 'free' | 'starter' | 'professional' | 'enterprise';
    status: 'active' | 'cancelled' | 'past_due';
    currentPeriodEnd: Date;
    features: string[];
  };
  ownerId: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Menu types
export interface IMenuItem {
  _id: Types.ObjectId;
  restaurantId: Types.ObjectId;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  price: number;
  cost?: number;
  images: string[];
  ingredients: Array<{
    ingredientId: Types.ObjectId;
    quantity: number;
    unit: string;
  }>;
  allergens: string[];
  dietaryInfo: string[];
  nutritionalInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium: number;
  };
  preparationTime: number;
  isAvailable: boolean;
  isPopular: boolean;
  isFeatured: boolean;
  sortOrder: number;
  modifiers: Array<{
    name: string;
    options: Array<{
      name: string;
      price: number;
    }>;
    required: boolean;
    maxSelections?: number;
  }>;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Agent types
export type AgentActionStatus = 'pending' | 'approved' | 'rejected' | 'executed' | 'failed';
export type AgentActionCategory = 'inventory' | 'pricing' | 'menu' | 'staffing' | 'marketing' | 'operations';

export interface IAgentAction {
  _id: Types.ObjectId;
  restaurantId: Types.ObjectId;
  agentType: string;
  category: AgentActionCategory;
  action: string;
  description: string;
  reasoning: string;
  confidence: number;
  impact: {
    estimated: string;
    metrics: Record<string, number>;
  };
  status: AgentActionStatus;
  requiresApproval: boolean;
  approvalThreshold: number;
  payload: Record<string, any>;
  result?: {
    success: boolean;
    data?: any;
    error?: string;
    executedAt: Date;
  };
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  scheduledFor?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Session types
export interface ISessionEvent {
  type: 'click' | 'scroll' | 'input' | 'navigation' | 'error' | 'custom';
  timestamp: Date;
  data: Record<string, any>;
  target?: string;
}

export interface ISession {
  _id: Types.ObjectId;
  restaurantId: Types.ObjectId;
  userId: Types.ObjectId;
  startedAt: Date;
  endedAt?: Date;
  duration?: number;
  userAgent?: string;
  ipAddress?: string;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  browser?: string;
  os?: string;
  events: ISessionEvent[];
  pageViews: Array<{
    path: string;
    title?: string;
    enteredAt: Date;
    exitedAt?: Date;
    duration?: number;
  }>;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Analytics types
export interface DashboardMetrics {
  revenue: {
    today: number;
    week: number;
    month: number;
    trend: number;
  };
  orders: {
    today: number;
    week: number;
    month: number;
    trend: number;
  };
  averageOrderValue: number;
  topItems: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  peakHours: Array<{
    hour: number;
    orders: number;
  }>;
}

// Embedding/RAG types
export interface IEmbedding {
  _id: Types.ObjectId;
  restaurantId: Types.ObjectId;
  sourceType: 'menu_item' | 'knowledge_base' | 'announcement' | 'document';
  sourceId: Types.ObjectId;
  content: string;
  embedding: number[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
