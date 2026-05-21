export enum UserRole {
  USER = 'user',
  CREATOR = 'creator',
  ADMIN = 'admin',
}

export enum ProductType {
  ACTIVITY = 'activity',
  STAY = 'stay',
  ITINERARY = 'itinerary',
  PACKAGE = 'package',
  VISA_SERVICE = 'visa_service',
  DIGITAL_DOWNLOAD = 'digital_download',
}

export enum ContentType {
  REEL = 'reel',
  PHOTO = 'photo',
  CAROUSEL = 'carousel',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CANCELLED = 'cancelled',
  PAST_DUE = 'past_due',
  TRIALING = 'trialing',
  EXPIRED = 'expired',
}

export enum SubscriptionPlanType {
  CREATOR_TIER = 'creator_tier',
  USER_PREMIUM = 'user_premium',
  USER_CREATOR = 'user_creator',
}

export enum CreatorTier {
  BASIC = 'basic',
  PRO = 'pro',
  PREMIUM = 'premium',
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum TripStatus {
  PLANNING = 'planning',
  CONFIRMED = 'confirmed',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TripMemberRole {
  OWNER = 'owner',
  CO_PLANNER = 'co_planner',
  VIEWER = 'viewer',
}

export enum NotificationType {
  FOLLOW = 'follow',
  NEW_PRODUCT = 'new_product',
  ORDER_STATUS = 'order_status',
  SUBSCRIPTION = 'subscription',
  REVIEW = 'review',
  SYSTEM = 'system',
  NEW_SUBSCRIBER = 'new_subscriber',
  TRIP_INVITE = 'trip_invite',
}

export enum DestinationType {
  COUNTRY = 'country',
  CITY = 'city',
  REGION = 'region',
}

export enum TipCategory {
  FOOD = 'food',
  TRANSPORT = 'transport',
  ACCOMMODATION = 'accommodation',
  SAFETY = 'safety',
  CULTURE = 'culture',
  BUDGET = 'budget',
  VISA = 'visa',
  GENERAL = 'general',
}

export enum BillingPeriod {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
}

export enum InviteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
}
