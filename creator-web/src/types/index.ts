export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl?: string;
  isEmailVerified: boolean;
}

export interface CreatorProfile {
  id: string;
  userId: string;
  displayName: string;
  bio?: string;
  tagline?: string;
  websiteUrl?: string;
  socialLinks?: Record<string, string>;
  specialties?: string[];
  location?: string;
  isVerified: boolean;
  creatorTier: 'basic' | 'pro' | 'premium';
  isOnboardingComplete?: boolean;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  type: 'activity' | 'stay' | 'itinerary' | 'package' | 'visa';
  price: number;
  coverImageUrl?: string;
  isPublished: boolean;
  totalSold: number;
  createdAt: string;
  updatedAt: string;
  // Activity specific
  duration?: number;
  difficulty?: string;
  groupSize?: number;
  meetingPoint?: string;
  // Stay specific
  propertyType?: string;
  starRating?: number;
  amenities?: string[];
  address?: string;
  // Itinerary specific
  totalDays?: number;
  highlights?: string[];
  days?: ItineraryDay[];
  // Package specific
  departureDates?: string[];
  // Visa specific
  fromCountry?: string;
  toCountry?: string;
  visaType?: string;
  processingTime?: string;
  successRate?: number;
}

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
}

export interface Content {
  id: string;
  title: string;
  caption?: string;
  type: 'reel' | 'photo' | 'carousel';
  thumbnailUrl?: string;
  mediaUrl?: string;
  viewCount: number;
  likeCount: number;
  isPublished: boolean;
  tags?: string[];
  destination?: string;
  createdAt: string;
}

export interface CreatorInvite {
  id: string;
  email: string;
  token: string;
  status: 'pending' | 'used' | 'revoked' | 'expired';
  expiresAt: string;
  createdAt: string;
}

export interface DashboardStats {
  totalContent: number;
  followers: number;
  publishedProducts: number;
  revenueThisMonth: number;
  recentContent: Content[];
  destinations?: string[];
}

export interface AnalyticsData {
  period: string;
  views: number;
  followers: number;
  revenue: number;
  topContent: Content[];
}

export interface OnboardingData {
  displayName: string;
  tagline?: string;
  bio?: string;
  location?: string;
  specialties?: string[];
  destinations?: string[];
  socialLinks?: Record<string, string>;
  websiteUrl?: string;
  avatarUrl?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface MediaUploadResponse {
  url: string;
  key: string;
  mimetype: string;
  size: number;
}
