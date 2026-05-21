# TravelHues — Additional Entities
# New Data Models from Mobile App & Creator Dashboard Design Specs

These entities emerged from the full design specification and must be added to `entities.json`.
They complement the existing core entities (User, CreatorProfile, Product, Order, etc.) by supporting
the messaging, booking, discovery, and personalization features of the platform.

---

## Summary of New Entities

| Entity | Table | Description |
|---|---|---|
| Service | services | Creator-offered bookable services (separate from purchasable products) |
| ServiceAvailability | service_availabilities | Date/time slots for a service |
| Booking | bookings | Service booking transaction |
| Conversation | conversations | Messaging thread between user and creator |
| Message | messages | Individual message within a conversation |
| SavedItem | saved_items | User's saved/wishlisted content |
| UserPreference | user_preferences | Personalization settings per user |
| CreatorVerification | creator_verifications | Document verification for creator badge |

---

## 1. Service

**Description:** A bookable offering created by a creator — distinct from a purchasable Product. Services involve direct scheduling, calendar availability, and real interaction (e.g. a custom itinerary consultation, group tour, photography session). Services use the `bookings` flow, while Products use the `orders` flow.

**Table:** `services`

### Fields

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | uuid | yes | auto | Primary key, auto-generated UUID |
| `creatorId` | uuid | yes | — | Foreign key to `creator_profiles.id` |
| `title` | varchar(200) | yes | — | Service display title |
| `description` | text | no | null | Full rich-text description of what's offered |
| `type` | enum | yes | — | CUSTOM_ITINERARY \| TRAVEL_CONSULTATION \| PHOTOGRAPHY \| GROUP_TOUR \| VISA_ASSISTANCE |
| `coverImageUrl` | varchar(500) | no | null | Primary listing image URL |
| `imageUrls` | varchar(500)[] | no | [] | Additional image gallery URLs |
| `priceINR` | decimal(10,2) | yes | — | Base price in Indian Rupees |
| `pricingTiers` | jsonb | no | null | Optional tiered pricing: `[{label, description, priceINR}]` |
| `durationHours` | decimal(5,2) | no | null | Duration in hours (e.g., 2.5 = 2 hours 30 min) |
| `durationDays` | integer | no | null | Duration in days for multi-day services |
| `maxGroupSize` | integer | no | 1 | Maximum participants per booking |
| `minGroupSize` | integer | no | 1 | Minimum participants required |
| `isActive` | boolean | yes | true | Whether service is listed and accepting bookings |
| `isOnline` | boolean | yes | false | True if service is delivered online (video call) |
| `availabilityType` | enum | yes | CALENDAR | CALENDAR (creator sets slots) \| ON_REQUEST (user requests, creator approves) |
| `bookingNoticeHours` | integer | yes | 24 | Minimum advance notice required before booking (hours) |
| `cancellationPolicy` | text | no | null | Human-readable cancellation policy text |
| `cancellationNoticeHours` | integer | yes | 48 | Hours before booking for free cancellation |
| `languages` | varchar(10)[] | no | ['en'] | Languages this service is offered in (ISO 639-1 codes) |
| `destinationIds` | uuid[] | no | [] | Array of destination IDs this service is relevant to |
| `tags` | varchar(100)[] | no | [] | Searchable tags |
| `totalBookings` | integer | yes | 0 | Denormalized total confirmed booking count |
| `rating` | decimal(3,2) | yes | 0.00 | Average rating from completed booking reviews |
| `reviewCount` | integer | yes | 0 | Total number of reviews |
| `stripeProductId` | varchar(100) | no | null | Stripe Product ID (created when service is activated) |
| `stripePriceId` | varchar(100) | no | null | Stripe Price ID for checkout |
| `createdAt` | timestamp | yes | now() | Record creation timestamp |
| `updatedAt` | timestamp | yes | now() | Last update timestamp |

### Relations
- `creator` — ManyToOne → `CreatorProfile` (the creator who offers this service)
- `availabilities` — OneToMany → `ServiceAvailability` (available slots)
- `bookings` — OneToMany → `Booking` (all bookings for this service)
- `reviews` — OneToMany → `Review` (reviews with targetType=SERVICE)

### Indexes
- `creatorId`
- `type`
- `isActive`
- `availabilityType`
- `priceINR`
- `rating`
- `createdAt`

### DTOs

**CreateDto:**
```typescript
{
  title: string               // IsString, MinLength(3), MaxLength(200)
  description?: string        // IsOptional, MaxLength(10000)
  type: ServiceType           // IsEnum(ServiceType)
  priceINR: number            // IsNumber, Min(0), Max(9999999)
  pricingTiers?: object[]     // IsOptional, IsArray
  durationHours?: number      // IsOptional, IsNumber, Min(0.5), Max(720)
  durationDays?: integer      // IsOptional, IsInt, Min(1), Max(30)
  maxGroupSize?: number       // IsOptional, IsInt, Min(1), Max(500)
  availabilityType: AvailabilityType  // IsEnum
  bookingNoticeHours?: number // IsOptional, IsInt, Min(1), Max(168), default 24
  cancellationPolicy?: string // IsOptional, MaxLength(2000)
  cancellationNoticeHours?: number // IsOptional, IsInt, Min(0), default 48
  languages?: string[]        // IsOptional, IsArray
  tags?: string[]             // IsOptional, IsArray, ArrayMaxSize(20)
  destinationIds?: string[]   // IsOptional, IsArray, IsUUID each
}
```

**ResponseDto:**
```typescript
{
  id: string
  creatorId: string
  creator: CreatorPublicProfileDto
  title: string
  description: string | null
  type: string
  coverImageUrl: string | null
  imageUrls: string[]
  priceINR: number
  pricingTiers: object[] | null
  durationHours: number | null
  durationDays: number | null
  maxGroupSize: number
  minGroupSize: number
  isActive: boolean
  isOnline: boolean
  availabilityType: string
  bookingNoticeHours: number
  cancellationPolicy: string | null
  cancellationNoticeHours: number
  languages: string[]
  tags: string[]
  totalBookings: number
  rating: number
  reviewCount: number
  createdAt: string
  updatedAt: string
}
```

---

## 2. ServiceAvailability

**Description:** A specific date + time slot that a creator has opened for booking on a particular service. Created by the creator via the AvailabilityCalendar in the creator dashboard. Each slot tracks how many bookings it can accommodate.

**Table:** `service_availabilities`

### Fields

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | uuid | yes | auto | Primary key |
| `serviceId` | uuid | yes | — | Foreign key to `services.id` |
| `date` | date | yes | — | Calendar date of availability (YYYY-MM-DD) |
| `startTime` | time | yes | — | Slot start time in local timezone (HH:MM:SS) |
| `endTime` | time | yes | — | Slot end time in local timezone |
| `timezone` | varchar(50) | yes | 'Asia/Kolkata' | IANA timezone string |
| `maxSlots` | integer | yes | 1 | Maximum bookings accepted for this slot |
| `bookedSlots` | integer | yes | 0 | Current confirmed bookings (auto-incremented) |
| `isBlocked` | boolean | yes | false | Creator manually blocked this slot (no new bookings) |
| `blockedReason` | varchar(200) | no | null | Optional internal note for why slot is blocked |
| `priceOverrideINR` | decimal(10,2) | no | null | Optional per-slot price override (e.g. weekend surcharge) |
| `notes` | varchar(500) | no | null | Creator notes for this specific slot |
| `createdAt` | timestamp | yes | now() | Record creation timestamp |

### Relations
- `service` — ManyToOne → `Service`
- `bookings` — OneToMany → `Booking` (bookings for this specific slot)

### Computed fields
- `availableSlots` = `maxSlots - bookedSlots`
- `isFull` = `bookedSlots >= maxSlots`

### Indexes
- `serviceId`
- `date`
- `serviceId + date (composite)` — for calendar view queries
- `isBlocked`
- `date + isBlocked (composite)` — for availability lookups

### DTOs

**CreateDto:**
```typescript
{
  date: string               // IsDateString (YYYY-MM-DD)
  startTime: string          // Matches(/^\d{2}:\d{2}$/)
  endTime: string            // Matches(/^\d{2}:\d{2}$/)
  timezone?: string          // IsOptional, IsTimeZone, default 'Asia/Kolkata'
  maxSlots?: number          // IsOptional, IsInt, Min(1), Max(1000), default 1
  priceOverrideINR?: number  // IsOptional, IsNumber, Min(0)
  notes?: string             // IsOptional, MaxLength(500)
}
```

**BulkCreateDto:**
```typescript
{
  slots: CreateServiceAvailabilityDto[]  // IsArray, ArrayMinSize(1), ArrayMaxSize(365)
}
```

**ResponseDto:**
```typescript
{
  id: string
  serviceId: string
  date: string
  startTime: string
  endTime: string
  timezone: string
  maxSlots: number
  bookedSlots: number
  availableSlots: number
  isFull: boolean
  isBlocked: boolean
  priceOverrideINR: number | null
  notes: string | null
  createdAt: string
}
```

---

## 3. Booking

**Description:** A service booking transaction representing a user reserving a specific creator service slot. Distinct from `Order` (which handles product purchases). Bookings go through a PENDING → CONFIRMED → COMPLETED lifecycle with optional cancellation/refund.

**Table:** `bookings`

### Fields

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | uuid | yes | auto | Primary key |
| `userId` | uuid | yes | — | Foreign key to `users.id` (the booker) |
| `creatorId` | uuid | yes | — | Foreign key to `creator_profiles.id` (denormalized for queries) |
| `serviceId` | uuid | yes | — | Foreign key to `services.id` |
| `availabilityId` | uuid | no | null | Foreign key to `service_availabilities.id` (null for ON_REQUEST) |
| `status` | enum | yes | PENDING | PENDING \| CONFIRMED \| COMPLETED \| CANCELLED \| REFUNDED |
| `bookingDate` | date | yes | — | The date of the booked service |
| `startTime` | time | no | null | Booked start time (copied from availability slot) |
| `endTime` | time | no | null | Booked end time (copied from availability slot) |
| `groupSize` | integer | yes | 1 | Number of participants |
| `totalAmountINR` | decimal(10,2) | yes | — | Total charged amount in INR |
| `platformFeeINR` | decimal(10,2) | yes | 0 | Platform commission amount |
| `creatorEarningsINR` | decimal(10,2) | yes | 0 | Amount creator receives after platform fee |
| `specialRequirements` | text | no | null | User's special requests / notes |
| `contactName` | varchar(200) | yes | — | Primary contact name for booking |
| `contactPhone` | varchar(20) | yes | — | Contact phone with country code |
| `stripePaymentIntentId` | varchar(100) | no | null | Stripe PaymentIntent ID |
| `stripeChargeId` | varchar(100) | no | null | Stripe Charge ID after payment |
| `cancellationReason` | text | no | null | Reason for cancellation |
| `cancelledBy` | enum | no | null | USER \| CREATOR \| ADMIN |
| `refundAmountINR` | decimal(10,2) | no | null | Amount refunded if applicable |
| `refundedAt` | timestamp | no | null | Timestamp of refund processing |
| `reminderSentAt` | timestamp | no | null | When the booking reminder notification was sent |
| `confirmedAt` | timestamp | no | null | When creator confirmed the booking |
| `completedAt` | timestamp | no | null | When service was marked complete |
| `reviewId` | uuid | no | null | Foreign key to `reviews.id` (after service completion) |
| `createdAt` | timestamp | yes | now() | Booking creation timestamp |
| `updatedAt` | timestamp | yes | now() | Last status update timestamp |

### Relations
- `user` — ManyToOne → `User` (the booker)
- `creator` — ManyToOne → `CreatorProfile` (the service provider)
- `service` — ManyToOne → `Service`
- `availability` — ManyToOne → `ServiceAvailability` (nullable)
- `review` — OneToOne → `Review` (nullable, post-completion)

### Indexes
- `userId`
- `creatorId`
- `serviceId`
- `status`
- `bookingDate`
- `stripePaymentIntentId (unique)`
- `userId + status (composite)` — for user booking history
- `creatorId + status (composite)` — for creator booking management
- `creatorId + bookingDate (composite)` — for calendar view

### DTOs

**CreateDto:**
```typescript
{
  serviceId: string           // IsUUID
  availabilityId?: string     // IsOptional, IsUUID
  bookingDate: string         // IsDateString
  startTime?: string          // IsOptional, Matches(/^\d{2}:\d{2}$/)
  groupSize?: number          // IsOptional, IsInt, Min(1), Max(500), default 1
  specialRequirements?: string // IsOptional, MaxLength(2000)
  contactName: string         // IsString, MinLength(1), MaxLength(200)
  contactPhone: string        // IsMobilePhone
  paymentMethodId: string     // IsString, IsNotEmpty (Stripe PM ID)
}
```

**UpdateStatusDto:**
```typescript
{
  status: BookingStatus       // IsEnum(BookingStatus)
  cancellationReason?: string // IsOptional, MaxLength(1000)
  cancelledBy?: CancelledBy   // IsOptional, IsEnum
}
```

**ResponseDto:**
```typescript
{
  id: string
  userId: string
  creatorId: string
  serviceId: string
  service: ServiceSummaryDto
  creator: CreatorPublicProfileDto
  availabilityId: string | null
  status: string
  bookingDate: string
  startTime: string | null
  endTime: string | null
  groupSize: number
  totalAmountINR: number
  platformFeeINR: number
  creatorEarningsINR: number
  specialRequirements: string | null
  contactName: string
  contactPhone: string
  cancellationReason: string | null
  cancelledBy: string | null
  refundAmountINR: number | null
  refundedAt: string | null
  confirmedAt: string | null
  completedAt: string | null
  reviewId: string | null
  createdAt: string
  updatedAt: string
}
```

---

## 4. Conversation

**Description:** A messaging thread between one user and one creator. One-to-one pairing with deduplication (only one conversation between any user-creator pair). Tracks unread counts for both parties.

**Table:** `conversations`

### Fields

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | uuid | yes | auto | Primary key |
| `userId` | uuid | yes | — | Foreign key to `users.id` (the traveller) |
| `creatorId` | uuid | yes | — | Foreign key to `users.id` (the creator — user account, not creator_profiles) |
| `lastMessageAt` | timestamp | no | null | Timestamp of most recent message (for sort order) |
| `lastMessagePreview` | varchar(200) | no | null | Truncated preview of last message content |
| `userUnreadCount` | integer | yes | 0 | Unread messages for the user |
| `creatorUnreadCount` | integer | yes | 0 | Unread messages for the creator |
| `isActive` | boolean | yes | true | False if either party has deleted/archived the conversation |
| `initiatedBy` | enum | yes | — | USER \| CREATOR (who sent the first message) |
| `relatedServiceId` | uuid | no | null | Optional: conversation linked to a specific service inquiry |
| `relatedBookingId` | uuid | no | null | Optional: conversation linked to a specific booking |
| `createdAt` | timestamp | yes | now() | Conversation creation timestamp |
| `updatedAt` | timestamp | yes | now() | Last update timestamp |

### Relations
- `user` — ManyToOne → `User`
- `creator` — ManyToOne → `User` (via creatorId referencing users.id)
- `messages` — OneToMany → `Message`
- `relatedService` — ManyToOne → `Service` (nullable)
- `relatedBooking` — ManyToOne → `Booking` (nullable)

### Indexes
- `userId + creatorId (unique composite)` — one conversation per pair
- `userId`
- `creatorId`
- `lastMessageAt` — for sort order
- `isActive`

### DTOs

**CreateDto:**
```typescript
{
  creatorId: string            // IsUUID
  initialMessage: string       // IsString, MinLength(1), MaxLength(2000)
  relatedServiceId?: string    // IsOptional, IsUUID
  relatedBookingId?: string    // IsOptional, IsUUID
}
```

**ResponseDto:**
```typescript
{
  id: string
  userId: string
  creatorId: string
  creator: CreatorPublicProfileDto    // populated when user views
  user: UserSummaryDto               // populated when creator views
  lastMessageAt: string | null
  lastMessagePreview: string | null
  userUnreadCount: number
  creatorUnreadCount: number
  isActive: boolean
  relatedServiceId: string | null
  relatedBookingId: string | null
  createdAt: string
  updatedAt: string
}
```

---

## 5. Message

**Description:** A single message within a Conversation. Supports text and image/file attachments. Tracks read status with timestamp for receipt indicators.

**Table:** `messages`

### Fields

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | uuid | yes | auto | Primary key |
| `conversationId` | uuid | yes | — | Foreign key to `conversations.id` |
| `senderId` | uuid | yes | — | Foreign key to `users.id` (message author) |
| `senderType` | enum | yes | — | USER \| CREATOR (denormalized for query efficiency) |
| `content` | text | no | null | Message text content. Null if mediaUrl-only message |
| `mediaUrl` | varchar(500) | no | null | URL to attached image or file |
| `mediaType` | enum | no | null | IMAGE \| FILE (null if text-only) |
| `mediaFilename` | varchar(255) | no | null | Original filename for FILE attachments |
| `mediaSizeBytes` | integer | no | null | File size for display |
| `isRead` | boolean | yes | false | Whether recipient has read the message |
| `readAt` | timestamp | no | null | When message was marked as read |
| `isDeleted` | boolean | yes | false | Soft-delete flag (sender deleted their message) |
| `deletedAt` | timestamp | no | null | When message was soft-deleted |
| `replyToId` | uuid | no | null | Self-referential FK — message being replied to |
| `createdAt` | timestamp | yes | now() | Message creation timestamp |

### Relations
- `conversation` — ManyToOne → `Conversation`
- `sender` — ManyToOne → `User`
- `replyTo` — ManyToOne → `Message` (self-referential, nullable)

### Indexes
- `conversationId` — for message history queries
- `conversationId + createdAt (composite)` — chronological fetch
- `senderId`
- `isRead`
- `createdAt`

### DTOs

**CreateDto:**
```typescript
{
  conversationId: string      // IsUUID
  content?: string            // IsOptional, IsString, MinLength(1), MaxLength(5000)
  mediaUrl?: string           // IsOptional, IsUrl
  mediaType?: MessageMediaType // IsOptional, IsEnum
  replyToId?: string          // IsOptional, IsUUID
}
// Validation: at least one of content or mediaUrl must be present
```

**ResponseDto:**
```typescript
{
  id: string
  conversationId: string
  senderId: string
  senderType: string
  sender: UserSummaryDto
  content: string | null
  mediaUrl: string | null
  mediaType: string | null
  mediaFilename: string | null
  mediaSizeBytes: number | null
  isRead: boolean
  readAt: string | null
  isDeleted: boolean
  replyToId: string | null
  replyTo: MessageSummaryDto | null
  createdAt: string
}
```

---

## 6. SavedItem

**Description:** A user's saved/bookmarked content item. Works as a universal wishlist — users can save stories, itineraries, activities, services, tips, and even creators. Enables the "Saved" tab in the mobile app and offline content caching.

**Table:** `saved_items`

### Fields

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | uuid | yes | auto | Primary key |
| `userId` | uuid | yes | — | Foreign key to `users.id` |
| `itemType` | enum | yes | — | STORY \| ITINERARY \| ACTIVITY \| SERVICE \| TIP \| CREATOR |
| `itemId` | uuid | yes | — | ID of the saved entity (polymorphic reference) |
| `collectionName` | varchar(100) | no | null | Optional collection grouping (e.g., "Goa Trip Ideas") |
| `notes` | varchar(500) | no | null | User's private notes about why they saved this |
| `displayOrder` | integer | yes | 0 | Sort order within collection for user-defined ordering |
| `createdAt` | timestamp | yes | now() | When item was saved |

### Relations
- `user` — ManyToOne → `User`

### Indexes
- `userId`
- `userId + itemType (composite)` — for tab-filtered views
- `userId + itemType + itemId (unique composite)` — prevent duplicate saves
- `userId + collectionName (composite)` — for collection views
- `createdAt`

### DTOs

**CreateDto:**
```typescript
{
  itemType: SavedItemType     // IsEnum(SavedItemType)
  itemId: string              // IsUUID
  collectionName?: string     // IsOptional, MaxLength(100)
  notes?: string              // IsOptional, MaxLength(500)
}
```

**ResponseDto:**
```typescript
{
  id: string
  userId: string
  itemType: string
  itemId: string
  itemData: StoryDto | ItineraryDto | ActivityDto | ServiceDto | TipDto | CreatorDto
  collectionName: string | null
  notes: string | null
  displayOrder: number
  createdAt: string
}
```

**ListQueryDto:**
```typescript
{
  itemType?: SavedItemType    // IsOptional, IsEnum — filter by type
  collectionName?: string     // IsOptional — filter by collection
  page?: number               // IsOptional, IsInt, Min(1), default 1
  limit?: number              // IsOptional, IsInt, Min(1), Max(100), default 20
}
```

---

## 7. UserPreference

**Description:** Personalization settings for a user. Controls content recommendations, notification delivery, language, and travel style. One row per user (OneToOne). Created on profile setup and updated via SettingsScreen.

**Table:** `user_preferences`

### Fields

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | uuid | yes | auto | Primary key |
| `userId` | uuid | yes | — | Foreign key to `users.id` (unique) |
| `preferredDestinations` | varchar(100)[] | no | [] | User's preferred travel destination names or region slugs |
| `travelStyle` | enum[] | no | [] | ADVENTURE \| LUXURY \| BUDGET \| FAMILY \| SOLO \| COUPLE |
| `preferredCurrency` | varchar(3) | yes | 'INR' | ISO 4217 currency code for display (INR always primary) |
| `language` | varchar(10) | yes | 'en' | BCP 47 language tag: 'en', 'hi', 'ta', 'te', 'kn', 'mr' |
| `notificationSettings` | jsonb | yes | see below | Notification channel preferences |
| `locationSharingEnabled` | boolean | yes | false | Whether user allows GPS location sharing |
| `profileVisibility` | enum | yes | PUBLIC | PUBLIC \| FOLLOWERS_ONLY \| PRIVATE |
| `showInSearch` | boolean | yes | true | Whether user profile appears in search results |
| `emailNotificationsEnabled` | boolean | yes | true | Global email notification toggle |
| `pushNotificationsEnabled` | boolean | yes | true | Global push notification toggle |
| `createdAt` | timestamp | yes | now() | Record creation timestamp |
| `updatedAt` | timestamp | yes | now() | Last update timestamp |

**notificationSettings JSON structure:**
```json
{
  "newMessage": true,
  "bookingConfirmed": true,
  "bookingReminder": true,
  "bookingCancelled": true,
  "newContentFromFollowing": true,
  "orderUpdate": true,
  "promotions": false,
  "weeklyDigest": false
}
```

### Relations
- `user` — OneToOne → `User`

### Indexes
- `userId (unique)`
- `language`
- `travelStyle` — GIN index for array search

### DTOs

**UpdateDto:**
```typescript
{
  preferredDestinations?: string[]   // IsOptional, IsArray, ArrayMaxSize(20)
  travelStyle?: TravelStyle[]        // IsOptional, IsArray, IsEnum each
  preferredCurrency?: string         // IsOptional, Length(3,3)
  language?: string                  // IsOptional, IsIn(['en','hi','ta','te','kn','mr'])
  notificationSettings?: object      // IsOptional, IsObject, ValidateNested
  locationSharingEnabled?: boolean   // IsOptional, IsBoolean
  profileVisibility?: ProfileVisibility // IsOptional, IsEnum
  showInSearch?: boolean             // IsOptional, IsBoolean
  emailNotificationsEnabled?: boolean // IsOptional, IsBoolean
  pushNotificationsEnabled?: boolean  // IsOptional, IsBoolean
}
```

**ResponseDto:**
```typescript
{
  id: string
  userId: string
  preferredDestinations: string[]
  travelStyle: string[]
  preferredCurrency: string
  language: string
  notificationSettings: NotificationSettings
  locationSharingEnabled: boolean
  profileVisibility: string
  showInSearch: boolean
  emailNotificationsEnabled: boolean
  pushNotificationsEnabled: boolean
  createdAt: string
  updatedAt: string
}
```

---

## 8. CreatorVerification

**Description:** Tracks the document verification process for creators seeking the "Verified" badge. Admin team reviews submitted documents and approves or rejects the application. Approval sets `creatorProfile.isVerified = true`.

**Table:** `creator_verifications`

### Fields

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | uuid | yes | auto | Primary key |
| `creatorId` | uuid | yes | — | Foreign key to `creator_profiles.id` |
| `status` | enum | yes | PENDING | PENDING \| UNDER_REVIEW \| APPROVED \| REJECTED |
| `submittedDocuments` | jsonb | yes | — | Array of document objects: `[{type, url, filename}]` |
| `applicantStatement` | text | no | null | Creator's statement explaining their expertise |
| `socialMediaLinks` | jsonb | no | null | Links submitted as evidence of content reach |
| `followerCountEvidence` | integer | no | null | Self-reported follower count at time of submission |
| `reviewNotes` | text | no | null | Internal admin notes on the review |
| `rejectionReason` | text | no | null | Reason shown to creator if rejected |
| `reviewedBy` | uuid | no | null | Foreign key to `users.id` of admin who reviewed |
| `submittedAt` | timestamp | yes | now() | When creator submitted the verification request |
| `reviewedAt` | timestamp | no | null | When admin completed their review |
| `resubmittedAt` | timestamp | no | null | If rejected, when creator resubmitted |
| `createdAt` | timestamp | yes | now() | Record creation timestamp |
| `updatedAt` | timestamp | yes | now() | Last update timestamp |

**submittedDocuments JSON structure:**
```json
[
  {
    "type": "GOVERNMENT_ID | SOCIAL_PROOF | PRESS_COVERAGE | WEBSITE",
    "url": "https://storage.travelhues.in/...",
    "filename": "passport_scan.pdf",
    "uploadedAt": "2025-01-01T00:00:00Z"
  }
]
```

### Relations
- `creator` — ManyToOne → `CreatorProfile`
- `reviewedByUser` — ManyToOne → `User` (admin, nullable)

### Indexes
- `creatorId (unique)` — one verification record per creator
- `status`
- `submittedAt`
- `reviewedBy`

### DTOs

**CreateDto (creator submits):**
```typescript
{
  submittedDocuments: VerificationDocument[]  // IsArray, ArrayMinSize(1), ArrayMaxSize(5)
  applicantStatement?: string                 // IsOptional, MinLength(50), MaxLength(3000)
  socialMediaLinks?: object                   // IsOptional, IsObject
  followerCountEvidence?: number              // IsOptional, IsInt, Min(0)
}
```

**AdminReviewDto:**
```typescript
{
  status: 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW'  // IsEnum
  reviewNotes?: string              // IsOptional, MaxLength(5000)
  rejectionReason?: string          // IsOptional, MaxLength(2000) — required if REJECTED
}
```

**ResponseDto:**
```typescript
{
  id: string
  creatorId: string
  status: string
  applicantStatement: string | null
  socialMediaLinks: object | null
  followerCountEvidence: number | null
  rejectionReason: string | null   // only shown to creator
  submittedAt: string
  reviewedAt: string | null
  resubmittedAt: string | null
  createdAt: string
  updatedAt: string
  // reviewNotes and reviewedBy ONLY in admin responses
}
```

---

## New Enums to Add

Add the following enums to `entities.json` → `enums`:

```json
{
  "ServiceType": [
    "CUSTOM_ITINERARY",
    "TRAVEL_CONSULTATION",
    "PHOTOGRAPHY",
    "GROUP_TOUR",
    "VISA_ASSISTANCE"
  ],
  "AvailabilityType": [
    "CALENDAR",
    "ON_REQUEST"
  ],
  "BookingStatus": [
    "PENDING",
    "CONFIRMED",
    "COMPLETED",
    "CANCELLED",
    "REFUNDED"
  ],
  "CancelledBy": [
    "USER",
    "CREATOR",
    "ADMIN"
  ],
  "SenderType": [
    "USER",
    "CREATOR"
  ],
  "MessageMediaType": [
    "IMAGE",
    "FILE"
  ],
  "ConversationInitiator": [
    "USER",
    "CREATOR"
  ],
  "SavedItemType": [
    "STORY",
    "ITINERARY",
    "ACTIVITY",
    "SERVICE",
    "TIP",
    "CREATOR"
  ],
  "TravelStyle": [
    "ADVENTURE",
    "LUXURY",
    "BUDGET",
    "FAMILY",
    "SOLO",
    "COUPLE"
  ],
  "ProfileVisibility": [
    "PUBLIC",
    "FOLLOWERS_ONLY",
    "PRIVATE"
  ],
  "VerificationStatus": [
    "PENDING",
    "UNDER_REVIEW",
    "APPROVED",
    "REJECTED"
  ],
  "VerificationDocumentType": [
    "GOVERNMENT_ID",
    "SOCIAL_PROOF",
    "PRESS_COVERAGE",
    "WEBSITE"
  ]
}
```

---

## Entity Relationship Summary

```
User (1) ──────────── (1) UserPreference
User (1) ──────────── (1) CreatorProfile
User (1) ──────────── (1) CreatorVerification

CreatorProfile (1) ─── (N) Service
Service (1) ────────── (N) ServiceAvailability
Service (1) ────────── (N) Booking

User (1) ──────────── (N) Booking (as booker)
User (1) ──────────── (N) SavedItem
User (1) ──────────── (N) Conversation (as traveller)
User (1) ──────────── (N) Conversation (as creator)
Conversation (1) ───── (N) Message
```
