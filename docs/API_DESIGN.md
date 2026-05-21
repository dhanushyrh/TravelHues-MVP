# TravelHues REST API Design
# Complete Endpoint Reference — v1

---

## Overview

| Property | Value |
|---|---|
| Base URL | `/api/v1` |
| Protocol | HTTPS |
| Format | JSON (application/json) |
| Auth | JWT Bearer tokens |
| Currency | INR (₹) for all monetary values |
| Timezone | Timestamps in UTC (ISO 8601), display converted client-side |
| Versioning | URI-based (`/api/v1/`) |

---

## Authentication

### JWT Tokens
- **Access Token:** Short-lived (15 minutes). Sent in `Authorization: Bearer {token}` header.
- **Refresh Token:** Long-lived (30 days). Stored in HttpOnly cookie OR returned in response body for mobile clients.

### Auth Header
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Auth Levels
| Level | Description |
|---|---|
| **Public** | No authentication required |
| **User** | Any authenticated user (USER or CREATOR role) |
| **Creator** | Authenticated user with CREATOR role and active CreatorProfile |
| **Admin** | Authenticated user with ADMIN role |
| **Owner** | Authenticated user who owns the specific resource |

---

## Rate Limiting

| Scope | Limit |
|---|---|
| Auth endpoints | 10 requests / minute per IP |
| General API | 300 requests / minute per user |
| Search endpoints | 60 requests / minute per user |
| Upload endpoints | 20 requests / minute per user |
| WebSocket connections | 5 concurrent per user |

Rate limit headers returned on every response:
```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 247
X-RateLimit-Reset: 1716278400
```

---

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "data": { },
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "must be a valid email address" },
    { "field": "password", "message": "must be at least 8 characters" }
  ]
}
```

### Common HTTP Status Codes
| Code | Meaning |
|---|---|
| 200 | OK — request succeeded |
| 201 | Created — resource created successfully |
| 204 | No Content — success, no response body |
| 400 | Bad Request — validation error |
| 401 | Unauthorized — missing or invalid token |
| 403 | Forbidden — authenticated but insufficient permissions |
| 404 | Not Found — resource does not exist |
| 409 | Conflict — resource already exists (duplicate) |
| 422 | Unprocessable Entity — business logic error |
| 429 | Too Many Requests — rate limit exceeded |
| 500 | Internal Server Error |

---

## Pagination

All list endpoints accept:
| Param | Type | Default | Max | Description |
|---|---|---|---|---|
| `page` | integer | 1 | — | Page number (1-indexed) |
| `limit` | integer | 20 | 100 | Items per page |
| `sortBy` | string | varies | — | Field name to sort by |
| `sortOrder` | `asc\|desc` | `desc` | — | Sort direction |

---

## Module 1: Authentication

**Base path:** `/api/v1/auth`

### POST /api/v1/auth/register
Register a new user account.
- **Auth:** Public
- **Body:** `{ email, password, firstName, lastName, phone?, role? }`
- **Response 201:** `{ user: UserResponseDto, accessToken, refreshToken }`
- **Errors:** 409 if email already exists

### POST /api/v1/auth/login
Authenticate with email and password.
- **Auth:** Public
- **Body:** `{ email, password }`
- **Response 200:** `{ user: UserResponseDto, accessToken, refreshToken }`
- **Errors:** 401 if credentials invalid, 403 if account suspended

### POST /api/v1/auth/google
OAuth login/register with Google ID token.
- **Auth:** Public
- **Body:** `{ idToken: string, role?: 'USER' | 'CREATOR' }`
- **Response 200/201:** `{ user: UserResponseDto, accessToken, refreshToken, isNewUser: boolean }`

### POST /api/v1/auth/refresh
Exchange refresh token for new access token.
- **Auth:** Public (refresh token in body or HttpOnly cookie)
- **Body:** `{ refreshToken?: string }` (or cookie)
- **Response 200:** `{ accessToken, refreshToken }`
- **Errors:** 401 if refresh token expired or invalid

### POST /api/v1/auth/logout
Invalidate refresh token.
- **Auth:** User
- **Body:** `{ refreshToken?: string }`
- **Response 204:** No content

### POST /api/v1/auth/forgot-password
Request password reset email.
- **Auth:** Public
- **Body:** `{ email }`
- **Response 200:** `{ message: "If that email exists, a reset link was sent" }`
- Note: Always returns 200 regardless of email existence (security)

### POST /api/v1/auth/reset-password
Reset password using token from email.
- **Auth:** Public
- **Body:** `{ token, newPassword }`
- **Response 200:** `{ message: "Password reset successful" }`
- **Errors:** 400 if token expired/invalid

### POST /api/v1/auth/verify-email
Confirm email address using verification token.
- **Auth:** Public
- **Body:** `{ token }`
- **Response 200:** `{ message: "Email verified" }`

### POST /api/v1/auth/resend-verification
Resend email verification link.
- **Auth:** User
- **Response 200:** `{ message: "Verification email sent" }`

---

## Module 2: Users

**Base path:** `/api/v1/users`

### GET /api/v1/users/me
Get authenticated user's profile.
- **Auth:** User
- **Response 200:** `{ data: UserResponseDto }`

### PATCH /api/v1/users/me
Update authenticated user's profile.
- **Auth:** User
- **Body:** `{ firstName?, lastName?, phone?, avatarUrl? }`
- **Response 200:** `{ data: UserResponseDto }`

### POST /api/v1/users/me/change-password
Change authenticated user's password.
- **Auth:** User
- **Body:** `{ currentPassword, newPassword }`
- **Response 200:** `{ message: "Password changed" }`

### GET /api/v1/users/me/preferences
Get user's personalization preferences.
- **Auth:** User
- **Response 200:** `{ data: UserPreferenceResponseDto }`

### PUT /api/v1/users/me/preferences
Update user's preferences (full replace).
- **Auth:** User
- **Body:** `UserPreferenceUpdateDto`
- **Response 200:** `{ data: UserPreferenceResponseDto }`

### PATCH /api/v1/users/me/preferences
Partially update user preferences.
- **Auth:** User
- **Body:** `Partial<UserPreferenceUpdateDto>`
- **Response 200:** `{ data: UserPreferenceResponseDto }`

### DELETE /api/v1/users/me
Delete (deactivate) authenticated user's account.
- **Auth:** User
- **Body:** `{ password: string }` (confirmation)
- **Response 204:** No content

### GET /api/v1/users/:id
Get public user profile by ID.
- **Auth:** Public
- **Params:** `id` — user UUID
- **Response 200:** `{ data: UserPublicResponseDto }`
- **Errors:** 404 if user not found

---

## Module 3: Creators

**Base path:** `/api/v1/creators`

### GET /api/v1/creators
List creators with optional filters.
- **Auth:** Public
- **Query:** `page, limit, search, specialties[], isVerified, tier, sortBy (followers|rating|totalSales), location`
- **Response 200:** `{ data: CreatorProfilePublicResponseDto[], meta: PaginationMeta }`

### GET /api/v1/creators/:id
Get creator public profile.
- **Auth:** Public
- **Params:** `id` — creator profile UUID
- **Response 200:** `{ data: CreatorProfileResponseDto }`

### GET /api/v1/creators/:id/storefront
Get creator's storefront details + published products.
- **Auth:** Public
- **Params:** `id` — creator profile UUID
- **Response 200:** `{ data: { storefront: StorefrontDto, products: ProductDto[] } }`

### GET /api/v1/creators/me
Get authenticated creator's own profile.
- **Auth:** Creator
- **Response 200:** `{ data: CreatorProfileResponseDto }`

### POST /api/v1/creators/me
Create creator profile (converts USER to CREATOR).
- **Auth:** User
- **Body:** `CreateCreatorProfileDto`
- **Response 201:** `{ data: CreatorProfileResponseDto }`
- **Errors:** 409 if creator profile already exists

### PATCH /api/v1/creators/me
Update creator profile.
- **Auth:** Creator
- **Body:** `UpdateCreatorProfileDto`
- **Response 200:** `{ data: CreatorProfileResponseDto }`

### GET /api/v1/creators/me/analytics
Get creator's analytics data.
- **Auth:** Creator
- **Query:** `startDate, endDate, groupBy (DAY|WEEK|MONTH)`
- **Response 200:** `{ data: CreatorAnalyticsSummaryDto }`

### POST /api/v1/creators/me/verification
Submit creator verification application.
- **Auth:** Creator
- **Body:** `{ submittedDocuments, applicantStatement?, socialMediaLinks?, followerCountEvidence? }`
- **Response 201:** `{ data: CreatorVerificationResponseDto }`
- **Errors:** 409 if pending verification already exists

### GET /api/v1/creators/me/verification
Get creator's verification status.
- **Auth:** Creator
- **Response 200:** `{ data: CreatorVerificationResponseDto }`

### POST /api/v1/creators/:id/follow
Follow a creator.
- **Auth:** User
- **Params:** `id` — creator profile UUID
- **Response 201:** `{ data: FollowResponseDto }`
- **Errors:** 409 if already following

### DELETE /api/v1/creators/:id/follow
Unfollow a creator.
- **Auth:** User
- **Params:** `id` — creator profile UUID
- **Response 204:** No content

### GET /api/v1/creators/me/followers
Get list of followers.
- **Auth:** Creator
- **Query:** `page, limit`
- **Response 200:** `{ data: FollowResponseDto[], meta: PaginationMeta }`

### GET /api/v1/users/me/following
Get list of creators the user follows.
- **Auth:** User
- **Query:** `page, limit`
- **Response 200:** `{ data: FollowResponseDto[], meta: PaginationMeta }`

---

## Module 4: Destinations

**Base path:** `/api/v1/destinations`

### GET /api/v1/destinations
List all destinations with content counts.
- **Auth:** Public
- **Query:** `page, limit, region, search, sortBy (popularity|name)`
- **Response 200:** `{ data: DestinationDto[], meta: PaginationMeta }`

### GET /api/v1/destinations/:slug
Get destination details with top content.
- **Auth:** Public
- **Params:** `slug` — destination URL slug
- **Response 200:** `{ data: DestinationDetailDto }` (includes top stories, itineraries, creators)

### GET /api/v1/destinations/trending
Get trending destinations this week.
- **Auth:** Public
- **Response 200:** `{ data: DestinationDto[] }`

---

## Module 5: Content (Stories / Portfolio Items)

**Base path:** `/api/v1/content`

### GET /api/v1/content
List content feed (paginated, personalized if authenticated).
- **Auth:** Public (personalized if User)
- **Query:** `page, limit, type (STORY|REEL), creatorId, destinationSlug, tags[], sortBy (trending|latest|popular)`
- **Response 200:** `{ data: ContentItemDto[], meta: PaginationMeta }`

### GET /api/v1/content/:id
Get single content item detail.
- **Auth:** Public
- **Params:** `id` — portfolio item UUID
- **Response 200:** `{ data: ContentItemDetailDto }`
- Note: Increments `viewCount`

### POST /api/v1/content/:id/like
Like a content item.
- **Auth:** User
- **Response 201:** `{ data: { likeCount: number, isLiked: true } }`

### DELETE /api/v1/content/:id/like
Unlike a content item.
- **Auth:** User
- **Response 200:** `{ data: { likeCount: number, isLiked: false } }`

### GET /api/v1/creators/:creatorId/portfolios
List creator's portfolios.
- **Auth:** Public
- **Query:** `page, limit, isPublished`
- **Response 200:** `{ data: PortfolioDto[], meta: PaginationMeta }`

### GET /api/v1/creators/:creatorId/portfolios/:portfolioId
Get portfolio with items.
- **Auth:** Public (unpublished only visible to owner)
- **Response 200:** `{ data: PortfolioDetailDto }`

### POST /api/v1/creators/me/portfolios
Create a new portfolio.
- **Auth:** Creator
- **Body:** `CreatePortfolioDto`
- **Response 201:** `{ data: PortfolioDto }`

### PATCH /api/v1/creators/me/portfolios/:id
Update portfolio metadata.
- **Auth:** Creator (Owner)
- **Body:** `UpdatePortfolioDto`
- **Response 200:** `{ data: PortfolioDto }`

### DELETE /api/v1/creators/me/portfolios/:id
Delete a portfolio and all items.
- **Auth:** Creator (Owner)
- **Response 204:** No content

### POST /api/v1/creators/me/portfolios/:portfolioId/items
Add item to portfolio.
- **Auth:** Creator (Owner)
- **Body:** `CreatePortfolioItemDto`
- **Response 201:** `{ data: PortfolioItemDto }`
- **Limit enforcement:** PRO tier: 50/month, BASIC: 3/month

### PATCH /api/v1/creators/me/portfolios/:portfolioId/items/:itemId
Update portfolio item.
- **Auth:** Creator (Owner)
- **Body:** `UpdatePortfolioItemDto`
- **Response 200:** `{ data: PortfolioItemDto }`

### DELETE /api/v1/creators/me/portfolios/:portfolioId/items/:itemId
Delete portfolio item.
- **Auth:** Creator (Owner)
- **Response 204:** No content

---

## Module 6: Tips

**Base path:** `/api/v1/tips`

### GET /api/v1/tips
List published travel tips.
- **Auth:** Public
- **Query:** `page, limit, creatorId, destinationSlug, tags[], sortBy (latest|popular)`
- **Response 200:** `{ data: TipDto[], meta: PaginationMeta }`

### GET /api/v1/tips/:id
Get single tip detail.
- **Auth:** Public
- **Response 200:** `{ data: TipDetailDto }`

### POST /api/v1/creators/me/tips
Create a travel tip.
- **Auth:** Creator
- **Body:** `{ title, content (HTML), destinationSlugs[], tags[], isPublished }`
- **Response 201:** `{ data: TipDto }`

### PATCH /api/v1/creators/me/tips/:id
Update a travel tip.
- **Auth:** Creator (Owner)
- **Body:** `{ title?, content?, tags?, isPublished? }`
- **Response 200:** `{ data: TipDto }`

### DELETE /api/v1/creators/me/tips/:id
Delete a travel tip.
- **Auth:** Creator (Owner)
- **Response 204:** No content

---

## Module 7: Products

**Base path:** `/api/v1/products`

### GET /api/v1/products
List published products with filtering.
- **Auth:** Public
- **Query:** `page, limit, type (ITINERARY|PHOTO_PRESET|TRAVEL_GUIDE|EXPERIENCE|DIGITAL_DOWNLOAD|CONSULTATION), creatorId, storefrontId, priceMin, priceMax, tags[], sortBy (latest|popular|price-asc|price-desc|rating)`
- **Response 200:** `{ data: ProductResponseDto[], meta: PaginationMeta }`

### GET /api/v1/products/:id
Get product detail.
- **Auth:** Public
- **Response 200:** `{ data: ProductDetailResponseDto }` (includes reviews, creator snippet)
- Note: Increments `productViews` in analytics

### GET /api/v1/creators/me/products
List creator's own products (all statuses).
- **Auth:** Creator
- **Query:** `page, limit, type, isPublished, sortBy`
- **Response 200:** `{ data: ProductResponseDto[], meta: PaginationMeta }`

### POST /api/v1/creators/me/products
Create a new product.
- **Auth:** Creator
- **Body:** `CreateProductDto`
- **Response 201:** `{ data: ProductResponseDto }`
- **Limit enforcement:** BASIC tier: max 5 products

### PATCH /api/v1/creators/me/products/:id
Update product details.
- **Auth:** Creator (Owner)
- **Body:** `UpdateProductDto`
- **Response 200:** `{ data: ProductResponseDto }`

### POST /api/v1/creators/me/products/:id/publish
Publish a draft product.
- **Auth:** Creator (Owner)
- **Response 200:** `{ data: ProductResponseDto }`
- **Errors:** 422 if required fields missing

### POST /api/v1/creators/me/products/:id/unpublish
Unpublish a product (hide from storefront).
- **Auth:** Creator (Owner)
- **Response 200:** `{ data: ProductResponseDto }`

### DELETE /api/v1/creators/me/products/:id
Delete a product (soft delete, archived not truly deleted).
- **Auth:** Creator (Owner)
- **Response 204:** No content
- **Errors:** 422 if product has active orders

### GET /api/v1/products/:id/download
Download digital product file (post-purchase).
- **Auth:** User
- **Response 302:** Redirect to signed MinIO URL
- **Errors:** 403 if no completed order, 410 if download link expired

---

## Module 8: Services

**Base path:** `/api/v1/services`

### GET /api/v1/services
List published services.
- **Auth:** Public
- **Query:** `page, limit, type (ServiceType), creatorId, priceMin, priceMax, availabilityType, isOnline, destinationId, sortBy (latest|popular|price-asc|price-desc|rating)`
- **Response 200:** `{ data: ServiceResponseDto[], meta: PaginationMeta }`

### GET /api/v1/services/:id
Get service detail.
- **Auth:** Public
- **Response 200:** `{ data: ServiceDetailResponseDto }` (includes creator, pricing tiers, review summary)

### GET /api/v1/services/:id/availability
Get available slots for a service in a date range.
- **Auth:** Public
- **Query:** `startDate (YYYY-MM-DD), endDate (YYYY-MM-DD)`
- **Response 200:** `{ data: ServiceAvailabilityResponseDto[] }`

### GET /api/v1/creators/me/services
List creator's own services.
- **Auth:** Creator
- **Query:** `page, limit, isActive`
- **Response 200:** `{ data: ServiceResponseDto[], meta: PaginationMeta }`

### POST /api/v1/creators/me/services
Create a new service listing.
- **Auth:** Creator
- **Body:** `CreateServiceDto`
- **Response 201:** `{ data: ServiceResponseDto }`
- **Limit enforcement:** BASIC tier: max 1 service

### PATCH /api/v1/creators/me/services/:id
Update service details.
- **Auth:** Creator (Owner)
- **Body:** `UpdateServiceDto`
- **Response 200:** `{ data: ServiceResponseDto }`

### DELETE /api/v1/creators/me/services/:id
Delete a service (soft delete).
- **Auth:** Creator (Owner)
- **Response 204:** No content
- **Errors:** 422 if service has upcoming confirmed bookings

### GET /api/v1/creators/me/services/:id/availability
Get all availability slots for creator's service.
- **Auth:** Creator (Owner)
- **Query:** `month (YYYY-MM), startDate, endDate`
- **Response 200:** `{ data: ServiceAvailabilityResponseDto[] }`

### POST /api/v1/creators/me/services/:id/availability
Create availability slot(s).
- **Auth:** Creator (Owner)
- **Body:** `CreateServiceAvailabilityDto | BulkCreateServiceAvailabilityDto`
- **Response 201:** `{ data: ServiceAvailabilityResponseDto[] }`

### PATCH /api/v1/creators/me/services/:id/availability/:slotId
Update an availability slot (block/unblock, change capacity).
- **Auth:** Creator (Owner)
- **Body:** `{ isBlocked?, maxSlots?, notes? }`
- **Response 200:** `{ data: ServiceAvailabilityResponseDto }`
- **Errors:** 422 if slot has bookings and maxSlots would be reduced below current bookedSlots

### DELETE /api/v1/creators/me/services/:id/availability/:slotId
Delete an availability slot.
- **Auth:** Creator (Owner)
- **Response 204:** No content
- **Errors:** 422 if slot has confirmed bookings

---

## Module 9: Bookings

**Base path:** `/api/v1/bookings`

### POST /api/v1/bookings
Create a service booking + initiate payment.
- **Auth:** User
- **Body:** `CreateBookingDto`
- **Response 201:** `{ data: BookingResponseDto, paymentIntentClientSecret: string }`
- **Errors:** 422 if slot full, 422 if booking notice not met, 422 if service inactive

### GET /api/v1/bookings/me
List authenticated user's bookings.
- **Auth:** User
- **Query:** `page, limit, status, sortBy (bookingDate|createdAt)`
- **Response 200:** `{ data: BookingResponseDto[], meta: PaginationMeta }`

### GET /api/v1/bookings/:id
Get booking detail.
- **Auth:** User (own) or Creator (their service) or Admin
- **Params:** `id` — booking UUID
- **Response 200:** `{ data: BookingResponseDto }`

### POST /api/v1/bookings/:id/cancel
Cancel a booking.
- **Auth:** User (own booking) or Creator (their service)
- **Body:** `{ cancellationReason?: string }`
- **Response 200:** `{ data: BookingResponseDto }`
- **Logic:** Refund processed if within cancellationNoticeHours; sets status to CANCELLED

### GET /api/v1/creators/me/bookings
List creator's incoming bookings.
- **Auth:** Creator
- **Query:** `page, limit, status, serviceId, startDate, endDate, sortBy`
- **Response 200:** `{ data: BookingResponseDto[], meta: PaginationMeta }`

### POST /api/v1/creators/me/bookings/:id/confirm
Confirm a pending booking (for ON_REQUEST services).
- **Auth:** Creator (Owner of the booked service)
- **Response 200:** `{ data: BookingResponseDto }`
- **Errors:** 422 if booking already confirmed/completed/cancelled

### POST /api/v1/creators/me/bookings/:id/complete
Mark booking as completed.
- **Auth:** Creator (Owner)
- **Response 200:** `{ data: BookingResponseDto }`
- **Logic:** Triggers payout transfer; enables user to leave review

---

## Module 10: Orders

**Base path:** `/api/v1/orders`

### POST /api/v1/orders
Create an order + initiate payment.
- **Auth:** User
- **Body:** `CreateOrderDto` (items array, notes?, currency?)
- **Response 201:** `{ data: OrderResponseDto, paymentIntentClientSecret: string }`
- **Errors:** 422 if product out of stock, 422 if product unpublished

### GET /api/v1/orders/me
List authenticated user's orders.
- **Auth:** User
- **Query:** `page, limit, status, creatorId`
- **Response 200:** `{ data: OrderResponseDto[], meta: PaginationMeta }`

### GET /api/v1/orders/:id
Get order detail with line items.
- **Auth:** User (own) or Creator (their products) or Admin
- **Response 200:** `{ data: OrderResponseDto }`

### GET /api/v1/creators/me/orders
List creator's product orders.
- **Auth:** Creator
- **Query:** `page, limit, status, productId, startDate, endDate`
- **Response 200:** `{ data: OrderResponseDto[], meta: PaginationMeta }`

### POST /api/v1/orders/:id/items/:itemId/download
Get download URL for a digital product.
- **Auth:** User (must have completed order)
- **Response 200:** `{ data: { downloadUrl: string, expiresAt: string } }`
- **Errors:** 403 if order not completed, 410 if download limit reached

---

## Module 11: Trips

**Base path:** `/api/v1/trips`

### GET /api/v1/trips/me
List authenticated user's trip plans.
- **Auth:** User
- **Query:** `page, limit, status`
- **Response 200:** `{ data: TripDto[], meta: PaginationMeta }`

### POST /api/v1/trips
Create a new trip plan.
- **Auth:** User
- **Body:** `{ name, coverImageUrl?, destinations[], startDate?, endDate?, isPrivate? }`
- **Response 201:** `{ data: TripDto }`

### GET /api/v1/trips/:id
Get trip plan detail.
- **Auth:** User (members only, unless public)
- **Response 200:** `{ data: TripDetailDto }`

### PATCH /api/v1/trips/:id
Update trip plan.
- **Auth:** User (Owner)
- **Body:** `{ name?, destinations?, startDate?, endDate?, isPrivate? }`
- **Response 200:** `{ data: TripDto }`

### DELETE /api/v1/trips/:id
Delete trip plan.
- **Auth:** User (Owner)
- **Response 204:** No content

### POST /api/v1/trips/:id/members
Invite a member to trip plan.
- **Auth:** User (Owner)
- **Body:** `{ email, permission: 'VIEW' | 'EDIT' }`
- **Response 201:** `{ data: TripMemberDto }`

### DELETE /api/v1/trips/:id/members/:userId
Remove a member from trip plan.
- **Auth:** User (Owner or self-removal)
- **Response 204:** No content

### POST /api/v1/trips/:id/bookings
Add a booking reference to a trip.
- **Auth:** User (Member)
- **Body:** `{ bookingId }`
- **Response 201:** `{ data: TripBookingDto }`

### POST /api/v1/trips/:id/saved-items
Add a saved item to a trip.
- **Auth:** User (Member)
- **Body:** `{ savedItemId }`
- **Response 201:** `{ data: TripSavedItemDto }`

---

## Module 12: Messages

**Base path:** `/api/v1/messages`

### GET /api/v1/messages/conversations
List all conversations for the authenticated user/creator.
- **Auth:** User
- **Query:** `page, limit, unreadOnly`
- **Response 200:** `{ data: ConversationResponseDto[], meta: PaginationMeta }`
- Note: Returns conversations ordered by `lastMessageAt DESC`

### POST /api/v1/messages/conversations
Start a new conversation with a creator.
- **Auth:** User
- **Body:** `{ creatorId, initialMessage, relatedServiceId?, relatedBookingId? }`
- **Response 201:** `{ data: ConversationResponseDto }`
- **Errors:** 409 returns existing conversation ID if one already exists

### GET /api/v1/messages/conversations/:id
Get conversation detail.
- **Auth:** User (participant only)
- **Response 200:** `{ data: ConversationResponseDto }`

### GET /api/v1/messages/conversations/:id/messages
List messages in a conversation.
- **Auth:** User (participant only)
- **Query:** `page, limit, before (cursor timestamp for pagination)`
- **Response 200:** `{ data: MessageResponseDto[], meta: PaginationMeta }`
- Side effect: Marks all fetched messages as read, updates unreadCount

### POST /api/v1/messages/conversations/:id/messages
Send a message in a conversation.
- **Auth:** User (participant only)
- **Body:** `{ content?, mediaUrl?, mediaType?, replyToId? }`
- **Response 201:** `{ data: MessageResponseDto }`
- Side effect: Emits `message:received` via Socket.io to other participant

### PATCH /api/v1/messages/conversations/:id/read
Mark all messages in conversation as read.
- **Auth:** User (participant)
- **Response 200:** `{ data: { markedReadCount: number } }`

### DELETE /api/v1/messages/conversations/:id/messages/:messageId
Soft-delete a message (sender only, within 15 minutes).
- **Auth:** User (message sender)
- **Response 200:** `{ data: MessageResponseDto }` (with isDeleted: true, content: null)

### GET /api/v1/messages/unread-count
Get total unread message count.
- **Auth:** User
- **Response 200:** `{ data: { unreadCount: number } }`

---

## Module 13: Saved Items

**Base path:** `/api/v1/saved`

### GET /api/v1/saved
List user's saved items.
- **Auth:** User
- **Query:** `page, limit, itemType, collectionName, sortBy (savedAt|displayOrder)`
- **Response 200:** `{ data: SavedItemResponseDto[], meta: PaginationMeta }`

### POST /api/v1/saved
Save an item to wishlist.
- **Auth:** User
- **Body:** `{ itemType, itemId, collectionName?, notes? }`
- **Response 201:** `{ data: SavedItemResponseDto }`
- **Errors:** 409 if already saved (returns existing saved item)

### DELETE /api/v1/saved/:id
Remove item from saved/wishlist.
- **Auth:** User (Owner)
- **Response 204:** No content

### DELETE /api/v1/saved/item
Remove item from saved by itemType + itemId.
- **Auth:** User
- **Body:** `{ itemType, itemId }`
- **Response 204:** No content

### GET /api/v1/saved/check
Check if specific items are saved (batch).
- **Auth:** User
- **Body:** `{ items: [{ itemType, itemId }] }`
- **Response 200:** `{ data: { [itemType:itemId]: boolean } }`

### PATCH /api/v1/saved/:id
Update saved item (notes, collection, displayOrder).
- **Auth:** User (Owner)
- **Body:** `{ notes?, collectionName?, displayOrder? }`
- **Response 200:** `{ data: SavedItemResponseDto }`

### GET /api/v1/saved/collections
List user's collection names.
- **Auth:** User
- **Response 200:** `{ data: { name: string, count: number }[] }`

### GET /api/v1/recently-viewed
Get user's recently viewed content.
- **Auth:** User
- **Query:** `limit (default 20)`
- **Response 200:** `{ data: RecentlyViewedDto[] }`

### POST /api/v1/recently-viewed
Record a content view (called automatically by detail endpoints).
- **Auth:** User
- **Body:** `{ itemType, itemId }`
- **Response 201:** No content

---

## Module 14: Notifications

**Base path:** `/api/v1/notifications`

### GET /api/v1/notifications
List user's notifications.
- **Auth:** User
- **Query:** `page, limit, isRead, type`
- **Response 200:** `{ data: NotificationResponseDto[], meta: PaginationMeta }`

### GET /api/v1/notifications/unread-count
Get count of unread notifications.
- **Auth:** User
- **Response 200:** `{ data: { unreadCount: number } }`

### POST /api/v1/notifications/mark-read
Mark specific notifications as read.
- **Auth:** User
- **Body:** `{ notificationIds: string[] }`
- **Response 200:** `{ data: { markedReadCount: number } }`

### POST /api/v1/notifications/mark-all-read
Mark all notifications as read.
- **Auth:** User
- **Response 200:** `{ data: { markedReadCount: number } }`

### PATCH /api/v1/notifications/push-token
Register or update Expo push notification token.
- **Auth:** User
- **Body:** `{ pushToken: string, platform: 'ios' | 'android' }`
- **Response 200:** `{ data: { registered: true } }`

### DELETE /api/v1/notifications/push-token
Deregister push token (on logout).
- **Auth:** User
- **Body:** `{ pushToken: string }`
- **Response 204:** No content

---

## Module 15: Subscriptions

**Base path:** `/api/v1/subscriptions`

### GET /api/v1/subscriptions/plans
List all active subscription plans.
- **Auth:** Public
- **Query:** `type (CREATOR_TIER|USER_PREMIUM|USER_CREATOR)`
- **Response 200:** `{ data: SubscriptionPlanResponseDto[] }`

### GET /api/v1/subscriptions/plans/:id
Get subscription plan details.
- **Auth:** Public
- **Response 200:** `{ data: SubscriptionPlanResponseDto }`

### POST /api/v1/subscriptions
Create a new subscription.
- **Auth:** User
- **Body:** `{ planId, creatorId? (for USER_CREATOR), paymentMethodId }`
- **Response 201:** `{ data: SubscriptionResponseDto }`

### GET /api/v1/subscriptions/me
Get authenticated user's active subscriptions.
- **Auth:** User
- **Response 200:** `{ data: SubscriptionResponseDto[] }`

### GET /api/v1/subscriptions/:id
Get subscription detail.
- **Auth:** User (Owner) or Admin
- **Response 200:** `{ data: SubscriptionResponseDto }`

### POST /api/v1/subscriptions/:id/cancel
Cancel a subscription.
- **Auth:** User (Owner)
- **Body:** `{ cancelAtPeriodEnd?: boolean, reason?: string }`
- **Response 200:** `{ data: SubscriptionResponseDto }`

### POST /api/v1/subscriptions/:id/reactivate
Reactivate a cancelled subscription (before period end).
- **Auth:** User (Owner)
- **Response 200:** `{ data: SubscriptionResponseDto }`

### GET /api/v1/creators/me/subscribers
List creator's paid subscribers.
- **Auth:** Creator
- **Query:** `page, limit`
- **Response 200:** `{ data: SubscriptionResponseDto[], meta: PaginationMeta }`

---

## Module 16: Payments & Webhooks

**Base path:** `/api/v1/payments`

### POST /api/v1/payments/create-payment-intent
Create a Stripe PaymentIntent for order/booking.
- **Auth:** User
- **Body:** `{ type: 'ORDER' | 'BOOKING', referenceId: string }`
- **Response 201:** `{ data: { clientSecret: string, paymentIntentId: string, amountINR: number } }`

### POST /api/v1/payments/setup-intent
Create a Stripe SetupIntent for saving payment method.
- **Auth:** User
- **Response 201:** `{ data: { clientSecret: string } }`

### GET /api/v1/payments/methods
List saved payment methods.
- **Auth:** User
- **Response 200:** `{ data: PaymentMethodDto[] }`

### DELETE /api/v1/payments/methods/:id
Remove a saved payment method.
- **Auth:** User
- **Response 204:** No content

### POST /api/v1/payments/stripe/connect/onboard
Start Stripe Connect Express onboarding for creator payouts.
- **Auth:** Creator
- **Response 201:** `{ data: { onboardingUrl: string } }`

### GET /api/v1/payments/stripe/connect/status
Get creator's Stripe Connect account status.
- **Auth:** Creator
- **Response 200:** `{ data: { accountId, status, chargesEnabled, payoutsEnabled } }`

### GET /api/v1/payments/stripe/connect/dashboard-link
Get link to Stripe Express dashboard.
- **Auth:** Creator
- **Response 200:** `{ data: { url: string } }` (expires in 5 minutes)

### POST /api/v1/payments/stripe/webhook
Stripe webhook event handler.
- **Auth:** Public (verified by Stripe-Signature header)
- **Body:** Raw Stripe event payload
- **Response 200:** `{ received: true }`
- **Handled events:**
  - `payment_intent.succeeded` → confirm order/booking
  - `payment_intent.payment_failed` → mark order/booking failed
  - `customer.subscription.updated` → sync subscription status
  - `customer.subscription.deleted` → cancel subscription
  - `invoice.payment_failed` → mark subscription past_due
  - `account.updated` → sync Stripe Connect status

### GET /api/v1/creators/me/payouts
List creator's payout history.
- **Auth:** Creator
- **Query:** `page, limit, startDate, endDate`
- **Response 200:** `{ data: PayoutDto[], meta: PaginationMeta }`

### GET /api/v1/creators/me/earnings
Get earnings summary.
- **Auth:** Creator
- **Query:** `period (7d|30d|90d|all-time)`
- **Response 200:** `{ data: { totalEarningsINR, pendingPayoutINR, paidOutINR, orderCount, bookingCount } }`

---

## Module 17: Media

**Base path:** `/api/v1/media`

### POST /api/v1/media/presigned
Get a presigned URL for direct browser-to-MinIO upload.
- **Auth:** User
- **Body:** `{ filename, mimeType, size, purpose: 'AVATAR' | 'PORTFOLIO' | 'PRODUCT' | 'SERVICE' | 'STOREFRONT' }`
- **Response 201:** `{ data: { uploadUrl: string, mediaId: string, storageKey: string, expiresIn: 300 } }`
- **Errors:** 400 if file type not allowed, 413 if size exceeds tier limit

### POST /api/v1/media/confirm
Confirm upload complete (creates Media record, generates thumbnail).
- **Auth:** User
- **Body:** `{ mediaId, storageKey }`
- **Response 201:** `{ data: MediaResponseDto }`

### GET /api/v1/media/:id
Get media metadata.
- **Auth:** User (uploader) or Admin
- **Response 200:** `{ data: MediaResponseDto }`

### DELETE /api/v1/media/:id
Delete media file from storage and database.
- **Auth:** User (uploader) or Admin
- **Response 204:** No content
- **Errors:** 422 if media is referenced by an active product/service

---

## Module 18: Search

**Base path:** `/api/v1/search`

### GET /api/v1/search
Universal search across all content types.
- **Auth:** Public (personalized results if authenticated)
- **Query:**
  - `q` — search query string (required)
  - `type` — filter: ALL | STORY | ITINERARY | ACTIVITY | SERVICE | CREATOR | DESTINATION
  - `page, limit`
  - `priceMin, priceMax` — INR range
  - `duration` — days range (e.g. "1-7")
  - `difficulty` — EASY | MODERATE | CHALLENGING
  - `rating` — minimum rating (1-5)
  - `isOnline` — filter services by online delivery
  - `destinationSlug`
  - `tags[]`
  - `sortBy` — relevance | latest | price-asc | price-desc | rating | popularity
  - `lat, lng, radiusKm` — geospatial filtering (for nearby results)
- **Response 200:**
```json
{
  "success": true,
  "data": {
    "stories": { "items": [], "total": 0 },
    "itineraries": { "items": [], "total": 0 },
    "activities": { "items": [], "total": 0 },
    "services": { "items": [], "total": 0 },
    "creators": { "items": [], "total": 0 },
    "destinations": { "items": [], "total": 0 }
  },
  "meta": { "total": 150, "page": 1, "limit": 20 }
}
```

### GET /api/v1/search/suggestions
Typeahead search suggestions.
- **Auth:** Public
- **Query:** `q (min 2 chars), limit (default 8, max 20)`
- **Response 200:** `{ data: SearchSuggestionDto[] }`
- Format: `{ type, label, slug, imageUrl? }`

### GET /api/v1/search/trending
Get trending search terms and destinations.
- **Auth:** Public
- **Response 200:** `{ data: { terms: string[], destinations: DestinationDto[] } }`

### GET /api/v1/search/nearby
Get content near a GPS coordinate.
- **Auth:** Public
- **Query:** `lat, lng, radiusKm (default 50, max 500), type, limit`
- **Response 200:** `{ data: NearbyContentDto[] }` (each item has `distanceKm`)

---

## Module 19: Reviews

**Base path:** `/api/v1/reviews`

### GET /api/v1/reviews
List reviews for a target.
- **Auth:** Public
- **Query:** `targetType (PRODUCT|CREATOR|SERVICE), targetId, rating, isVerified, page, limit`
- **Response 200:** `{ data: ReviewResponseDto[], meta: PaginationMeta }`

### POST /api/v1/reviews
Submit a review.
- **Auth:** User
- **Body:** `{ targetType, targetId, orderId?, rating, title?, content? }`
- **Response 201:** `{ data: ReviewResponseDto }`
- **Errors:** 422 if attempting product review without completed order, 409 if already reviewed

### PATCH /api/v1/reviews/:id
Update own review.
- **Auth:** User (Owner)
- **Body:** `{ rating?, title?, content? }`
- **Response 200:** `{ data: ReviewResponseDto }`

### DELETE /api/v1/reviews/:id
Delete own review.
- **Auth:** User (Owner) or Admin
- **Response 204:** No content

### POST /api/v1/reviews/:id/helpful
Mark a review as helpful.
- **Auth:** User
- **Response 200:** `{ data: { helpfulCount: number } }`

---

## Module 20: Admin

**Base path:** `/api/v1/admin`

All admin routes require `ADMIN` role.

### Users
- `GET /api/v1/admin/users` — List all users (page, limit, role, isActive, search)
- `GET /api/v1/admin/users/:id` — Get full user detail
- `PATCH /api/v1/admin/users/:id` — Update user (role, isActive, isEmailVerified)
- `DELETE /api/v1/admin/users/:id` — Hard delete user (irreversible)

### Creator Verifications
- `GET /api/v1/admin/verifications` — List verification applications (status, page, limit)
- `GET /api/v1/admin/verifications/:id` — Get verification detail with documents
- `POST /api/v1/admin/verifications/:id/review` — Submit review decision (APPROVED/REJECTED/UNDER_REVIEW)

### Content Moderation
- `GET /api/v1/admin/reviews` — List all reviews (isHidden, targetType)
- `PATCH /api/v1/admin/reviews/:id/hide` — Hide a review (moderation)
- `PATCH /api/v1/admin/reviews/:id/show` — Unhide a review
- `GET /api/v1/admin/content` — List all portfolio items
- `DELETE /api/v1/admin/content/:id` — Remove inappropriate content

### Subscription Plans
- `GET /api/v1/admin/subscription-plans` — List all plans (including inactive)
- `POST /api/v1/admin/subscription-plans` — Create new plan
- `PATCH /api/v1/admin/subscription-plans/:id` — Update plan
- `DELETE /api/v1/admin/subscription-plans/:id` — Deactivate plan

### Tags & Categories
- `POST /api/v1/admin/tags` — Create tag
- `PATCH /api/v1/admin/tags/:id` — Update tag
- `DELETE /api/v1/admin/tags/:id` — Delete tag
- `POST /api/v1/admin/categories` — Create category
- `PATCH /api/v1/admin/categories/:id` — Update category
- `DELETE /api/v1/admin/categories/:id` — Delete category

### Creator Featured Placement
- `POST /api/v1/admin/creators/:id/feature` — Feature a creator (Body: `{ featuredUntil: date }`)
- `DELETE /api/v1/admin/creators/:id/feature` — Remove feature status

### Platform Analytics
- `GET /api/v1/admin/analytics/overview` — Platform-wide stats (users, creators, revenue, orders)
- `GET /api/v1/admin/analytics/revenue` — Revenue chart data (daily/weekly/monthly)

---

## WebSocket Events

### Connection

**Endpoint:** `ws://api.travelhues.in/socket.io`

**Authentication:** Pass access token in socket handshake:
```javascript
const socket = io('https://api.travelhues.in', {
  auth: { token: accessToken },
  transports: ['websocket'],
});
```

**Connection events:**
- `connect` — successfully connected
- `disconnect` — connection closed
- `connect_error` — authentication failed (invalid/expired token)

---

### Namespace: /messages

Used for real-time messaging between users and creators.

**Join room on connect:**
```
// Server joins user to their user room automatically on auth
room: user:{userId}
room: creator:{creatorId}  (if authenticated as creator)
```

#### Client → Server Events

| Event | Payload | Description |
|---|---|---|
| `message:send` | `{ conversationId, content?, mediaUrl?, mediaType?, replyToId? }` | Send a new message |
| `message:read` | `{ conversationId, messageIds: string[] }` | Mark messages as read |
| `typing:start` | `{ conversationId }` | User started typing |
| `typing:stop` | `{ conversationId }` | User stopped typing |

#### Server → Client Events

| Event | Payload | Description |
|---|---|---|
| `message:received` | `MessageResponseDto` | New message in a conversation |
| `message:sent` | `{ tempId: string, message: MessageResponseDto }` | Confirmation of sent message |
| `message:read` | `{ conversationId, messageIds: string[], readAt: string }` | Recipient read your messages |
| `message:deleted` | `{ conversationId, messageId: string }` | Message was deleted |
| `typing:start` | `{ conversationId, userId: string }` | Other party started typing |
| `typing:stop` | `{ conversationId, userId: string }` | Other party stopped typing |
| `user:online` | `{ userId: string }` | A user you have a conversation with came online |
| `user:offline` | `{ userId: string, lastSeenAt: string }` | A user went offline |
| `conversation:updated` | `ConversationResponseDto` | Conversation metadata updated |
| `error` | `{ code: string, message: string }` | Socket operation error |

---

### Namespace: /notifications

Used for real-time in-app notifications delivery.

#### Server → Client Events

| Event | Payload | Description |
|---|---|---|
| `notification:new` | `NotificationResponseDto` | New notification for this user |
| `notification:badge` | `{ unreadCount: number }` | Unread count update |

#### Client → Server Events

| Event | Payload | Description |
|---|---|---|
| `notification:ack` | `{ notificationId: string }` | Acknowledge/read a notification |

---

## API Error Codes Reference

| Code | HTTP Status | Description |
|---|---|---|
| `AUTH_INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `AUTH_TOKEN_EXPIRED` | 401 | JWT access token has expired |
| `AUTH_TOKEN_INVALID` | 401 | JWT token malformed or signature invalid |
| `AUTH_REFRESH_EXPIRED` | 401 | Refresh token expired, must re-login |
| `AUTH_EMAIL_NOT_VERIFIED` | 403 | Account not verified |
| `AUTH_ACCOUNT_SUSPENDED` | 403 | Account deactivated |
| `CREATOR_TIER_LIMIT` | 422 | Creator has reached product/service limit for their tier |
| `BOOKING_SLOT_FULL` | 422 | Selected time slot is fully booked |
| `BOOKING_NOTICE_REQUIRED` | 422 | Booking requires more advance notice |
| `BOOKING_UNAVAILABLE_DATE` | 422 | Selected date is not available |
| `PAYMENT_FAILED` | 422 | Stripe payment processing failed |
| `PRODUCT_OUT_OF_STOCK` | 422 | Product no longer has available stock |
| `DUPLICATE_SAVE` | 409 | Item already in user's saved list |
| `DUPLICATE_FOLLOW` | 409 | User already follows this creator |
| `DUPLICATE_REVIEW` | 409 | User has already reviewed this item |
| `PURCHASE_REQUIRED` | 403 | Must purchase product before accessing download |
| `DOWNLOAD_EXPIRED` | 410 | Download link has expired |
| `DOWNLOAD_LIMIT_REACHED` | 410 | Maximum download count reached |
| `SELF_ACTION_FORBIDDEN` | 422 | User cannot follow/message themselves |
| `MEDIA_TYPE_NOT_ALLOWED` | 400 | File type not permitted for this upload purpose |
| `MEDIA_SIZE_EXCEEDED` | 413 | File exceeds maximum allowed size |
| `NOT_FOUND` | 404 | Requested resource does not exist |
| `FORBIDDEN` | 403 | Insufficient permissions for this operation |
| `RATE_LIMITED` | 429 | Request rate limit exceeded |
| `VALIDATION_ERROR` | 400 | Request body/query validation failed |

---

## Pagination Examples

### Request
```
GET /api/v1/products?page=2&limit=10&type=ITINERARY&sortBy=rating&sortOrder=desc
```

### Response meta
```json
{
  "meta": {
    "total": 87,
    "page": 2,
    "limit": 10,
    "totalPages": 9,
    "hasNext": true,
    "hasPrev": true
  }
}
```

---

## INR Currency Handling

All monetary fields across the API use INR as the primary currency. Values are stored as `decimal(10,2)` and returned as floating point numbers in JSON.

| Display Format | Example |
|---|---|
| API JSON response | `"priceINR": 1999.00` |
| Mobile display | `₹1,999` |
| Web dashboard | `₹1,999.00` |
| Large amounts | `₹1,00,000` (Indian number system) |

The `currency` field on Order and SubscriptionPlan entities uses ISO 4217 (`"INR"`) for Stripe compatibility.
