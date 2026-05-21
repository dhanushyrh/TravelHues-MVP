# TravelHues MVP — Backend Plan (NestJS)

## Table of Contents

1. [Module Breakdown](#module-breakdown)
2. [API Endpoint Reference](#api-endpoint-reference)
3. [Database Schema Decisions](#database-schema-decisions)
4. [Authentication Strategy](#authentication-strategy)
5. [Stripe Integration Plan](#stripe-integration-plan)
6. [File Storage Plan](#file-storage-plan)
7. [Redis Caching Strategy](#redis-caching-strategy)
8. [Background Jobs (Bull Queues)](#background-jobs-bull-queues)
9. [Error Handling Strategy](#error-handling-strategy)
10. [Development Phases](#development-phases)
11. [Project Structure](#project-structure)
12. [MVP Timeline](#mvp-timeline)

---

## Module Breakdown

The NestJS backend is organized into **16 feature modules** plus core infrastructure modules. Each module follows the standard NestJS pattern: `Module` → `Controller` → `Service` → `Repository`.

### 1. AppModule (Root)

**Responsibilities:**
- Bootstrap all feature modules
- Configure TypeORM database connection (async config from env)
- Configure global middleware (helmet, compression, cors)
- Configure global pipes (ValidationPipe with whitelist:true, transform:true)
- Configure global filters (HttpExceptionFilter, AllExceptionsFilter)
- Configure global interceptors (LoggingInterceptor, ResponseTransformInterceptor)
- ConfigModule (global, @nestjs/config with .env.* support)

---

### 2. AuthModule

**Responsibilities:**
- User registration with email/password
- Login and token issuance (JWT access + refresh token pair)
- Token refresh endpoint
- Logout (refresh token revocation in Redis)
- Email verification flow
- Password reset flow (forgot / reset)
- OAuth login (Google, Apple) — validate provider idToken, upsert user
- Passport.js strategy configuration (JwtStrategy, LocalStrategy)
- Guards: JwtAuthGuard (global default), RolesGuard, IsOwnerGuard

**Dependencies:** UsersModule, MailModule, RedisModule

---

### 3. UsersModule

**Responsibilities:**
- CRUD for user accounts (admin creates, user self-updates)
- Get own profile (`/users/me`)
- Update own profile
- Change password
- Upload/update avatar (delegates to MediaModule)
- Manage saved addresses (sub-resource)
- Store/update Expo push notification tokens
- User search for admins
- Soft-delete account

**Dependencies:** MediaModule, NotificationsModule

---

### 4. CreatorsModule

**Responsibilities:**
- Create/update `CreatorProfile` for CREATOR role users
- Public creator discovery (list, filter, sort by followers/rating/tier)
- Creator search by name, specialty, location
- Featured creators endpoint
- Follow / unfollow a creator
- Get followers list
- Check if current user follows a creator
- Stripe Connect onboarding (create Express account, get onboarding URL, check status)
- Update denormalized counters (totalFollowers, averageRating) via service methods

**Dependencies:** UsersModule, MediaModule, SubscriptionsModule (read), NotificationsModule

---

### 5. PortfolioModule

**Responsibilities:**
- CRUD for `Portfolio` collections
- CRUD for `PortfolioItem` entries within a portfolio
- Publish/unpublish portfolio
- Reorder portfolio items (bulk update displayOrder)
- Increment viewCount on portfolio access (rate-limited, Redis-backed)
- Public portfolio listing for a creator
- Portfolio item media upload (delegates to MediaModule)

**Dependencies:** MediaModule, CreatorsModule

---

### 6. StorefrontModule

**Responsibilities:**
- Auto-create `Storefront` when creator profile is created
- CRUD for storefront settings (name, slug, branding)
- Validate slug uniqueness
- Publish/unpublish storefront
- Custom domain setup (validation + storage)
- Public storefront lookup by slug
- Upload logo and banner images
- Storefront SEO metadata management

**Dependencies:** MediaModule, CreatorsModule

---

### 7. ProductsModule

**Responsibilities:**
- CRUD for `Product` within a storefront
- Product type-specific validation (itinerary has days/destinations, etc.)
- Publish/unpublish product
- Digital file upload and management (private MinIO bucket)
- Public product listing (paginated, filtered by type/tag/price)
- Product search (full-text via pg_trgm)
- Featured products
- Increment viewCount on product access
- Sync product to Stripe (create Stripe Product + Price on publish)
- Update averageRating + reviewCount when reviews are posted

**Dependencies:** StorefrontModule, MediaModule, CreatorsModule, ReviewsModule (event)

---

### 8. OrdersModule

**Responsibilities:**
- Create order (validate items, calculate totals, create Stripe PaymentIntent)
- Get order by ID (buyer or creator can access)
- List orders for current user (buyer view)
- List orders for creator (seller view, filterable by status/date)
- Order status management (internal, updated by webhook)
- Refund processing (call Stripe Refunds API, update order)
- Generate/regenerate signed download URLs for digital products
- Download endpoint (validate ownership, check limits, proxy or redirect)
- Order statistics for creator dashboard

**Dependencies:** ProductsModule, PaymentsModule, MediaModule, NotificationsModule, AnalyticsModule (event)

---

### 9. PaymentsModule

**Responsibilities:**
- Stripe webhook ingestion (single endpoint, raw body)
- Webhook event routing to appropriate handlers:
  - `payment_intent.succeeded` → OrdersModule
  - `payment_intent.payment_failed` → OrdersModule
  - `customer.subscription.created/updated/deleted` → SubscriptionsModule
  - `invoice.payment_failed` → SubscriptionsModule
  - `account.updated` → CreatorsModule (Connect status)
  - `payout.paid` → CreatorsModule (payout notification)
- Stripe Customer create/retrieve (upsert per user)
- Payment method management (list, set default)
- Creator payout request
- Platform revenue reporting (admin only)

**Dependencies:** OrdersModule, SubscriptionsModule, CreatorsModule, NotificationsModule

---

### 10. SubscriptionsModule

**Responsibilities:**
- List available plans (`/subscriptions/plans`)
- Subscribe to a plan (create Stripe Subscription)
- Cancel subscription (immediately or at period end)
- Get current user's active subscriptions
- Get creator's subscriber list (with plan and since date)
- Creator subscription count + MRR calculation
- Handle plan upgrades/downgrades (change Stripe Subscription plan)
- Webhook-driven status sync (called from PaymentsModule)
- Subscription access checks (used by other modules as guards)

**Dependencies:** PaymentsModule, UsersModule, CreatorsModule, NotificationsModule

---

### 11. ReviewsModule

**Responsibilities:**
- Create review for a product or creator
- Verify purchase before allowing product review (check OrderItems)
- Update/delete own review
- List reviews for a product or creator (paginated, sortable)
- Mark review as helpful
- Admin: hide/unhide reviews (moderation)
- After create/delete: recalculate and update averageRating + reviewCount on target

**Dependencies:** OrdersModule, ProductsModule (event), CreatorsModule (event)

---

### 12. MediaModule

**Responsibilities:**
- Generate presigned PUT upload URLs (MinIO/S3)
- Confirm upload completion and create Media record
- Delete media (also remove from storage)
- Enforce per-user storage quotas (check before generating upload URL)
- Serve private file download (with auth check, generate short-lived presigned GET URL)
- Image processing queue integration (trigger after confirm)
- Expose `getSignedUrl(storageKey)` as shared service method

**Dependencies:** StorageModule (MinIO/S3 abstraction), BullModule

---

### 13. NotificationsModule

**Responsibilities:**
- Create in-app notifications (called by other modules via service injection)
- List notifications for current user (paginated)
- Mark as read (single or batch)
- Mark all as read
- Unread count endpoint
- Push notification dispatch via Expo Push API (queued via Bull)
- Store and manage Expo push tokens per user

**Dependencies:** BullModule, UsersModule

---

### 14. SearchModule

**Responsibilities:**
- Unified search across creators, products, portfolios
- Query using PostgreSQL full-text search (`to_tsvector` / `to_tsquery`)
- Filter by type, category, location, price range
- Trending/popular results (sorted by view count, sales)
- Autocomplete endpoint for tags and creator names
- Search result ranking (relevance + popularity blend)

**Dependencies:** CreatorsModule, ProductsModule, PortfolioModule, TagsModule

---

### 15. TagsModule & CategoriesModule

**Responsibilities (Tags):**
- CRUD for tags (admin only for create/update/delete)
- List tags with filtering by type
- Autocomplete endpoint for tag names
- Increment/decrement usageCount (called internally)

**Responsibilities (Categories):**
- CRUD for categories (admin only)
- Hierarchical category tree endpoint
- Category-based product filtering

---

### 16. AnalyticsModule

**Responsibilities:**
- Creator analytics dashboard data (date range query)
- Aggregate daily snapshot job (scheduled, runs at midnight)
- Track events: profile view, storefront view, product view (Redis buffer → DB flush)
- Admin platform-wide analytics (total revenue, active creators, active users)
- Revenue breakdown by product type
- Top creators by revenue/followers

**Dependencies:** RedisModule, BullModule, CreatorsModule, OrdersModule, SubscriptionsModule

---

### 17. AdminModule

**Responsibilities:**
- User management (list, search, ban/unban, role change)
- Creator verification (set isVerified flag)
- Review moderation
- Subscription plan management (CRUD)
- Category/tag management
- Platform analytics overview
- Broadcast system notifications

**All admin endpoints protected by @Roles('ADMIN')**

---

## API Endpoint Reference

### Auth Module — `/api/v1/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | None | Register new user (USER or CREATOR role) |
| POST | `/login` | None | Email + password login, returns token pair |
| POST | `/refresh` | None | Refresh access token using refresh token |
| POST | `/logout` | JWT | Revoke refresh token |
| POST | `/forgot-password` | None | Send password reset email |
| POST | `/reset-password` | None | Reset password with token |
| GET | `/verify-email` | None | Verify email address with token from email |
| POST | `/resend-verification` | JWT | Resend verification email |
| POST | `/oauth/google` | None | Login/register via Google ID token |
| POST | `/oauth/apple` | None | Login/register via Apple ID token |
| GET | `/me` | JWT | Get current user profile |

---

### Users Module — `/api/v1/users`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/me` | JWT | Get authenticated user's full profile |
| PATCH | `/me` | JWT | Update own profile (name, phone) |
| DELETE | `/me` | JWT | Request account deletion |
| PATCH | `/me/avatar` | JWT | Upload + set profile avatar |
| POST | `/me/change-password` | JWT | Change password (requires current password) |
| GET | `/me/addresses` | JWT | List saved addresses |
| POST | `/me/addresses` | JWT | Create new address |
| PATCH | `/me/addresses/:id` | JWT | Update address |
| DELETE | `/me/addresses/:id` | JWT | Delete address |
| POST | `/me/push-token` | JWT | Register Expo push token |
| DELETE | `/me/push-token` | JWT | Remove push token on logout |
| GET | `/:id` | JWT(Admin) | Get user by ID (admin only) |
| GET | `/` | JWT(Admin) | List all users with pagination (admin) |
| PATCH | `/:id/status` | JWT(Admin) | Ban/unban user (admin) |

---

### Creators Module — `/api/v1/creators`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | None | List/search creators (paginated, filterable) |
| GET | `/featured` | None | Get featured creators list |
| GET | `/:id` | None | Get public creator profile |
| GET | `/me` | JWT(Creator) | Get own full creator profile |
| POST | `/` | JWT | Create creator profile (promotes user to CREATOR role) |
| PATCH | `/me` | JWT(Creator) | Update own creator profile |
| GET | `/:id/followers` | None | Get creator's follower list |
| POST | `/:id/follow` | JWT | Follow a creator |
| DELETE | `/:id/follow` | JWT | Unfollow a creator |
| GET | `/:id/follow/status` | JWT | Check if current user follows this creator |
| GET | `/stripe/onboarding` | JWT(Creator) | Get Stripe Connect onboarding URL |
| GET | `/stripe/dashboard` | JWT(Creator) | Get Stripe Express dashboard link |
| GET | `/stripe/status` | JWT(Creator) | Check Stripe Connect account status |

---

### Portfolio Module — `/api/v1/portfolios`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/creator/:creatorId` | None | List published portfolios for a creator |
| GET | `/:id` | None | Get portfolio with items (published) |
| GET | `/me` | JWT(Creator) | List own portfolios (all, incl. drafts) |
| POST | `/` | JWT(Creator) | Create new portfolio |
| PATCH | `/:id` | JWT(Creator) | Update portfolio settings |
| DELETE | `/:id` | JWT(Creator) | Delete portfolio |
| PATCH | `/:id/publish` | JWT(Creator) | Toggle publish status |
| GET | `/:portfolioId/items` | None | List items in a portfolio |
| POST | `/:portfolioId/items` | JWT(Creator) | Add item to portfolio |
| PATCH | `/:portfolioId/items/:id` | JWT(Creator) | Update portfolio item |
| DELETE | `/:portfolioId/items/:id` | JWT(Creator) | Remove item from portfolio |
| PATCH | `/:portfolioId/items/reorder` | JWT(Creator) | Bulk reorder items (array of {id, displayOrder}) |

---

### Storefront Module — `/api/v1/storefronts`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/:slug` | None | Get public storefront by slug |
| GET | `/me` | JWT(Creator) | Get own storefront settings |
| PATCH | `/me` | JWT(Creator) | Update storefront settings |
| PATCH | `/me/publish` | JWT(Creator) | Toggle publish status |
| POST | `/me/logo` | JWT(Creator) | Upload storefront logo |
| POST | `/me/banner` | JWT(Creator) | Upload storefront banner |
| GET | `/check-slug/:slug` | None | Check if slug is available |

---

### Products Module — `/api/v1/products`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | None | List/search all published products (paginated) |
| GET | `/featured` | None | Get featured/trending products |
| GET | `/storefront/:storefrontId` | None | Get published products for a storefront |
| GET | `/:id` | None | Get product details |
| GET | `/me` | JWT(Creator) | List own products (all statuses) |
| POST | `/` | JWT(Creator) | Create product |
| PATCH | `/:id` | JWT(Creator) | Update product |
| DELETE | `/:id` | JWT(Creator) | Delete product |
| PATCH | `/:id/publish` | JWT(Creator) | Toggle publish status |
| POST | `/:id/file` | JWT(Creator) | Upload digital product file |
| DELETE | `/:id/file` | JWT(Creator) | Remove digital product file |
| GET | `/:id/reviews` | None | Get reviews for a product |

---

### Orders Module — `/api/v1/orders`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | JWT | List own orders (buyer view, paginated) |
| GET | `/:id` | JWT | Get order details (buyer or creator) |
| POST | `/` | JWT | Create order + Stripe PaymentIntent |
| GET | `/creator` | JWT(Creator) | List orders for creator's products |
| POST | `/:id/refund` | JWT(Creator) | Process refund for an order |
| GET | `/:orderId/items/:itemId/download` | JWT | Get download link for digital product |

---

### Payments Module — `/api/v1/payments`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/webhooks/stripe` | None* | Stripe webhook endpoint (*sig verified) |
| GET | `/methods` | JWT | List saved payment methods |
| POST | `/methods` | JWT | Add payment method (Stripe SetupIntent) |
| DELETE | `/methods/:id` | JWT | Remove payment method |
| PATCH | `/methods/:id/default` | JWT | Set default payment method |
| POST | `/payouts/request` | JWT(Creator) | Request manual payout |
| GET | `/payouts/history` | JWT(Creator) | List payout history |

---

### Subscriptions Module — `/api/v1/subscriptions`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/plans` | None | List all active subscription plans |
| GET | `/plans/:id` | None | Get plan details |
| GET | `/` | JWT | List current user's subscriptions |
| POST | `/` | JWT | Subscribe to a plan |
| GET | `/:id` | JWT | Get subscription details |
| POST | `/:id/cancel` | JWT | Cancel subscription |
| POST | `/:id/reactivate` | JWT | Reactivate a cancelled subscription |
| POST | `/:id/change-plan` | JWT | Upgrade/downgrade plan |
| GET | `/creator/subscribers` | JWT(Creator) | List creator's subscribers |
| GET | `/creator/stats` | JWT(Creator) | Subscriber count + MRR |

---

### Reviews Module — `/api/v1/reviews`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/product/:productId` | None | List reviews for a product |
| GET | `/creator/:creatorId` | None | List reviews for a creator |
| POST | `/` | JWT | Submit a review |
| PATCH | `/:id` | JWT | Update own review |
| DELETE | `/:id` | JWT | Delete own review |
| POST | `/:id/helpful` | JWT | Mark review as helpful |
| DELETE | `/:id/helpful` | JWT | Remove helpful mark |
| PATCH | `/:id/hide` | JWT(Admin) | Hide review (moderation) |

---

### Media Module — `/api/v1/media`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/upload-url` | JWT | Get presigned PUT URL for direct upload |
| POST | `/confirm` | JWT | Confirm upload complete, create Media record |
| GET | `/:id` | JWT | Get media record details |
| DELETE | `/:id` | JWT | Delete media file + record |
| GET | `/private/:id/download` | JWT | Get signed download URL for private file |

---

### Notifications Module — `/api/v1/notifications`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | JWT | List notifications (paginated, filterable) |
| GET | `/unread-count` | JWT | Get count of unread notifications |
| PATCH | `/read` | JWT | Mark specific notifications as read |
| PATCH | `/read-all` | JWT | Mark all notifications as read |
| DELETE | `/:id` | JWT | Delete a notification |

---

### Search Module — `/api/v1/search`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | None | Unified search (creators + products) |
| GET | `/creators` | None | Search creators only |
| GET | `/products` | None | Search products only |
| GET | `/autocomplete` | None | Autocomplete for search bar (names, tags) |
| GET | `/trending` | None | Trending searches / popular tags |

---

### Analytics Module — `/api/v1/analytics`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/creator` | JWT(Creator) | Creator analytics (date range, groupBy) |
| GET | `/creator/summary` | JWT(Creator) | Quick stats (today, 7d, 30d) |
| POST | `/events/view` | None | Track page view event (anonymous) |
| GET | `/admin/platform` | JWT(Admin) | Platform-wide analytics (admin) |

---

### Tags & Categories — `/api/v1/tags`, `/api/v1/categories`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/tags` | None | List tags (filter by type) |
| GET | `/tags/autocomplete` | None | Tag name autocomplete |
| POST | `/tags` | JWT(Admin) | Create tag |
| GET | `/categories` | None | Get category tree |
| POST | `/categories` | JWT(Admin) | Create category |
| PATCH | `/categories/:id` | JWT(Admin) | Update category |

---

## Database Schema Decisions

### UUID Primary Keys

All tables use `uuid` as primary keys generated by PostgreSQL's `uuid_ossp` extension (`gen_random_uuid()`). This ensures:
- No sequential ID leakage (can't enumerate resources)
- Safe for distributed/sharded setups in future
- Consistent across all tables

### Soft Deletes

Users and Creators use `isActive` boolean flag rather than hard deletes. Orders, subscriptions, and reviews are never deleted (audit trail). Products and portfolios support hard delete (soft delete via `isPublished=false` first).

### Denormalized Counters

To avoid expensive `COUNT(*)` queries on hot paths:

| Counter Column | Updated When | Update Method |
|---|---|---|
| `creator_profiles.totalFollowers` | Follow/unfollow | DB transaction in FollowService |
| `creator_profiles.totalSales` | Order completed | Webhook handler |
| `creator_profiles.averageRating` | Review created/deleted | ReviewService via DB aggregation |
| `creator_profiles.reviewCount` | Review created/deleted | ReviewService |
| `products.totalSold` | Order completed | Webhook handler |
| `products.averageRating` | Review created/deleted | ReviewService |
| `products.reviewCount` | Review created/deleted | ReviewService |
| `storefronts.totalRevenue` | Order completed | Webhook handler |
| `storefronts.totalOrders` | Order completed | Webhook handler |

**Rating recalculation:** Use `AVG()` + `COUNT()` in a single UPDATE from SELECT rather than incremental arithmetic to avoid drift.

### JSONB Columns

Used sparingly for structured data without query needs:
- `creator_profiles.socialLinks` — no filtering needed
- `products.metadata` — type-specific data, queried by application layer
- `subscription_plans.features` — array of strings for display
- `media.metadata` — EXIF/processing status
- `notifications.data` — deep link payload

**Never use JSONB for data that needs to be queried/filtered in SQL** — use proper columns instead.

### Array Columns (PostgreSQL native)

- `creator_profiles.specialties` — `varchar(100)[]`
- `products.tags` — `varchar(100)[]`
- `products.previewImages` — `varchar(500)[]`
- `portfolio_items.mediaUrls` — `varchar(500)[]`

Arrays indexed with `GIN` index using `btree_gin` extension for fast `@>` (contains) queries.

### Full-Text Search

PostgreSQL `pg_trgm` extension for trigram-based similarity search.

```sql
-- Add GIN trigram indexes for search
CREATE INDEX idx_creator_displayname_trgm ON creator_profiles
  USING GIN (display_name gin_trgm_ops);

CREATE INDEX idx_products_title_trgm ON products
  USING GIN (title gin_trgm_ops);
```

For TypeORM: use `QueryBuilder` with `similarity()` function for ranked results.

### Migration Strategy

- All schema changes via TypeORM migrations (`npm run migration:generate`)
- Migrations committed to source control in `src/database/migrations/`
- Never use `synchronize: true` in production
- `synchronize: true` only in development with a local DB

### Connection Pool Settings

```typescript
// TypeORM DataSource options
{
  type: 'postgres',
  poolSize: 20,          // Max connections
  connectTimeoutMS: 5000,
  maxQueryExecutionTime: 5000,  // Log slow queries
  logging: process.env.NODE_ENV === 'development',
}
```

---

## Authentication Strategy

### JWT Configuration

```typescript
// JWT Access Token
{
  secret: process.env.JWT_SECRET,         // 256-bit secret (production: RS256 keypair)
  signOptions: {
    expiresIn: '15m',
    issuer: 'travelhues-api',
    audience: 'travelhues-client',
  }
}

// JWT Refresh Token
{
  secret: process.env.JWT_REFRESH_SECRET,
  signOptions: { expiresIn: '30d' }
}
```

### Refresh Token Storage (Redis)

```
Key:   rt:{userId}:{tokenId}    (tokenId = UUID embedded in refresh token)
Value: "valid"
TTL:   30 days

On refresh: DELETE old key, SET new key
On logout:  DELETE key
On login:   SET key (allowing multiple sessions per user)
On password change: DELETE all rt:{userId}:* keys
```

### OAuth Providers

**Google:**
- Library: `google-auth-library`
- Verify idToken with `OAuth2Client.verifyIdToken()`
- Extract `sub` (Google user ID), `email`, `name`, `picture`

**Apple:**
- Library: `apple-signin-auth`
- Verify idToken against Apple's JWKS endpoint
- Extract `sub` (Apple user ID), `email` (first login only)
- Handle Apple's email relay addresses

### Password Hashing

```typescript
// bcrypt with cost factor 12
const hash = await bcrypt.hash(password, 12);
```

### Guard Hierarchy

```typescript
// Applied globally via APP_GUARD
JwtAuthGuard        // Validates JWT on all routes
RolesGuard          // Checks @Roles() decorator
IsOwnerGuard        // Checks resource ownership for PATCH/DELETE

// Route-level overrides
@Public()           // Skip JwtAuthGuard
@Roles('CREATOR')   // Require CREATOR role
@Roles('ADMIN')     // Require ADMIN role
```

---

## Stripe Integration Plan

### Stripe Libraries

```
npm install stripe @nestjs/config
```

```typescript
// stripe.module.ts — global Stripe service
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  typescript: true,
});
```

### Payment Flow Implementation

**Creating an Order (PaymentIntent):**
```typescript
const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(totalCents),       // Amount in smallest currency unit
  currency: 'usd',
  customer: stripeCustomerId,
  payment_method_types: ['card'],
  application_fee_amount: Math.round(platformFeeCents),
  transfer_data: {
    destination: creatorStripeAccountId,
  },
  metadata: {
    orderId: order.id,
    userId: user.id,
    creatorId: creator.id,
  },
  idempotency_key: `order-${order.id}`,  // Prevent duplicate charges
});
```

**Stripe Connect Onboarding:**
```typescript
// Create Express account
const account = await stripe.accounts.create({
  type: 'express',
  country: 'US',
  capabilities: { transfers: { requested: true } },
  business_type: 'individual',
  metadata: { creatorId: creator.id },
});

// Get onboarding link
const accountLink = await stripe.accountLinks.create({
  account: account.id,
  refresh_url: `${process.env.APP_URL}/settings/payouts?refresh=true`,
  return_url: `${process.env.APP_URL}/settings/payouts?success=true`,
  type: 'account_onboarding',
});
```

### Webhook Event Handlers

All webhook events arrive at `POST /api/v1/payments/webhooks/stripe`. Raw body is required for signature verification.

```typescript
// payments.controller.ts
@Post('webhooks/stripe')
@HttpCode(200)
async stripeWebhook(
  @RawBody() rawBody: Buffer,
  @Headers('stripe-signature') sig: string,
) {
  const event = this.stripe.webhooks.constructEvent(
    rawBody,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET,
  );
  await this.paymentsService.handleWebhookEvent(event);
}
```

**Webhook Event → Handler Mapping:**

| Stripe Event | Handler | Action |
|---|---|---|
| `payment_intent.succeeded` | OrdersService | Mark order COMPLETED, generate download URLs, send notifications |
| `payment_intent.payment_failed` | OrdersService | Mark order CANCELLED, notify user |
| `customer.subscription.created` | SubscriptionsService | Create/update subscription record |
| `customer.subscription.updated` | SubscriptionsService | Sync status, dates, plan |
| `customer.subscription.deleted` | SubscriptionsService | Set status CANCELLED, downgrade tier |
| `invoice.payment_succeeded` | SubscriptionsService | Record successful renewal |
| `invoice.payment_failed` | SubscriptionsService | Set status PAST_DUE, send dunning email |
| `account.updated` | CreatorsService | Update Stripe account status |
| `payout.paid` | CreatorsService | Send PAYOUT_SENT notification |

**Idempotency (Webhook Deduplication):**
```typescript
// Before processing, check Redis:
const processed = await redis.get(`stripe-event:${event.id}`);
if (processed) return; // Already handled

// After processing:
await redis.set(`stripe-event:${event.id}`, '1', 'EX', 86400 * 7); // 7-day TTL
```

### Subscription Plans Setup

Creator Tier and User Premium plans are created once in Stripe Dashboard and IDs stored in `subscription_plans` table. `USER_CREATOR` subscriptions have a default price template; each creator who enables subscriptions gets a derived Stripe Price.

---

## File Storage Plan

### Storage Abstraction Layer

Create a `StorageService` that abstracts MinIO (dev) and S3 (prod) behind a common interface:

```typescript
// storage.service.ts interface
interface IStorageService {
  generateUploadUrl(key: string, mimeType: string, expiresIn?: number): Promise<string>;
  generateDownloadUrl(key: string, expiresIn?: number): Promise<string>;
  deleteObject(key: string): Promise<void>;
  objectExists(key: string): Promise<boolean>;
  getObjectMetadata(key: string): Promise<ObjectMetadata>;
}
```

Switch implementation via environment variable:
```typescript
// storage.module.ts
providers: [
  {
    provide: StorageService,
    useClass: process.env.STORAGE_PROVIDER === 's3'
      ? S3StorageService
      : MinioStorageService,
  },
],
```

### Storage Key Naming Convention

```
{bucket}/{purpose}/{userId}/{uuid}.{ext}

Examples:
  travelhues-public/avatars/user-uuid/img-uuid.webp
  travelhues-media/portfolio/creator-uuid/portfolio-uuid/item-uuid.jpg
  travelhues-private/products/creator-uuid/product-uuid/file.zip
  travelhues-public/storefronts/creator-uuid/banner.webp
```

### Presigned URL Expiry

| Operation | Expiry |
|---|---|
| Upload URL (PUT) | 15 minutes |
| Public media URL | — (no expiry, CDN cached) |
| Private download URL | 1 hour |
| Product file URL (per download) | 30 minutes |

### Storage Quota Enforcement

| Creator Tier | Media Storage | Private File Storage |
|---|---|---|
| BASIC | 5 GB | 10 GB |
| PRO | 20 GB | 50 GB |
| PREMIUM | Unlimited | 200 GB |
| USER | 100 MB (avatar/profile only) | — |

Quota tracked by summing `media.size` per user in DB before generating upload URL.

---

## Redis Caching Strategy

### Cache Keys and TTL

```
# Auth
rt:{userId}:{tokenId}                  → refresh token entry       TTL: 30d
session:{userId}:push-tokens           → array of Expo push tokens TTL: permanent (SET)

# API Response Cache
cache:creator:{id}                     → CreatorProfile public      TTL: 5m
cache:storefront:slug:{slug}           → Storefront public          TTL: 5m
cache:products:storefront:{id}:{page}  → Product listing page       TTL: 2m
cache:featured:creators                → Featured creators list      TTL: 10m
cache:featured:products                → Featured products list      TTL: 10m
cache:categories:tree                  → Full category tree          TTL: 1h

# Rate Limiting (via @nestjs/throttler with Redis store)
throttle:{endpoint}:{ip}               → request count              TTL: window

# Analytics (view tracking buffer)
analytics:views:{creatorId}:{date}     → view count hash            TTL: 25h

# Idempotency
stripe-event:{eventId}                 → processed flag             TTL: 7d
order-intent:{orderId}                 → PI creation lock           TTL: 5m

# Deduplication
email:sent:{userId}:{type}             → sent flag                  TTL: 5m (rate limit emails)
```

### Cache Invalidation

Cache invalidated on write operations using `@nestjs-cache-manager` or manual Redis DEL:

```typescript
// In CreatorsService.update():
await this.redis.del(`cache:creator:${creatorId}`);

// In StorefrontService.update():
await this.redis.del(`cache:storefront:slug:${oldSlug}`);
await this.redis.del(`cache:storefront:slug:${newSlug}`);
```

### Analytics View Tracking

Instead of a DB write per page view (too much load), buffer in Redis:

```typescript
// AnalyticsService.trackView():
await this.redis.hincrby(
  `analytics:views:${creatorId}:${today}`,
  viewType, // 'profile' | 'storefront' | 'product'
  1,
);
// TTL set to 25 hours on first write

// Nightly analytics job reads Redis, flushes to DB, deletes keys
```

---

## Background Jobs (Bull Queues)

### Queue Definitions

All queues backed by Redis. Managed via `@nestjs/bull`.

```typescript
// app.module.ts
BullModule.forRoot({ redis: { url: process.env.REDIS_URL } }),
BullModule.registerQueue(
  { name: 'email' },
  { name: 'notifications' },
  { name: 'image-processing' },
  { name: 'analytics' },
  { name: 'stripe-sync' },
)
```

### Queue: `email`

| Job | Trigger | Payload |
|---|---|---|
| `send-verification` | User registers | `{ userId, email, token }` |
| `send-password-reset` | Forgot password request | `{ userId, email, token }` |
| `send-order-confirmation` | Order completed (buyer) | `{ orderId, userId }` |
| `send-order-notification` | Order completed (creator) | `{ orderId, creatorId }` |
| `send-subscription-confirmation` | Subscription created | `{ subscriptionId, userId }` |
| `send-dunning-email` | Invoice payment failed | `{ subscriptionId, userId, retryUrl }` |
| `send-payout-notification` | Payout paid | `{ creatorId, amount }` |

**Retry config:** 3 attempts, exponential backoff (1s, 5s, 30s)

### Queue: `notifications`

| Job | Trigger | Payload |
|---|---|---|
| `send-push` | Any notification creation | `{ userId, title, body, data }` |
| `send-bulk-push` | Admin broadcast | `{ userIds[], title, body }` |

**Concurrency:** 5 workers (respects Expo Push API rate limits)

### Queue: `image-processing`

| Job | Trigger | Payload |
|---|---|---|
| `resize-image` | Media confirmed (IMAGE type) | `{ mediaId, storageKey, sizes: [400,800,1200] }` |
| `generate-thumbnail` | Media confirmed (IMAGE/VIDEO) | `{ mediaId, storageKey }` |
| `extract-video-poster` | Media confirmed (VIDEO) | `{ mediaId, storageKey }` |
| `convert-to-webp` | Image uploaded | `{ mediaId, storageKey }` |

**Worker libraries:** `sharp` (image), `fluent-ffmpeg` (video)

### Queue: `analytics`

| Job | Trigger | Payload |
|---|---|---|
| `flush-view-counts` | Scheduled: every 30 min | `{}` — reads Redis, writes to DB |
| `aggregate-daily` | Scheduled: 00:05 daily | `{ date }` — creates CreatorAnalytics rows |
| `update-trending` | Scheduled: every 1 hour | `{}` — recalculate trending scores |

### Queue: `stripe-sync`

| Job | Trigger | Payload |
|---|---|---|
| `sync-product-to-stripe` | Product published | `{ productId }` |
| `update-stripe-product` | Product price/title changed | `{ productId }` |

---

## Error Handling Strategy

### HTTP Exception Hierarchy

All errors thrown as NestJS `HttpException` subclasses with a consistent response body:

```typescript
// Standard error response shape
{
  statusCode: number,
  error: string,         // HTTP status text
  message: string,       // Human-readable message
  code: string,          // Application error code (e.g. "PRODUCT_NOT_FOUND")
  timestamp: string,
  path: string
}
```

### Custom Exception Classes

```typescript
// exceptions/
NotFoundException extends HttpException        // 404
UnauthorizedException extends HttpException    // 401
ForbiddenException extends HttpException       // 403
ConflictException extends HttpException        // 409
BadRequestException extends HttpException      // 400
PaymentException extends HttpException         // 402
StorageQuotaExceededException extends HttpException // 413
```

### Global Exception Filter

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // 1. If HttpException: use its status + message
    // 2. If TypeORM QueryFailedError: map DB errors (unique constraint → 409, etc.)
    // 3. If Stripe error: map to appropriate HTTP status
    // 4. Otherwise: log stack trace, return 500
    // 5. Never expose stack traces in production
  }
}
```

### TypeORM Error Mapping

| PostgreSQL Error Code | HTTP Status | Application Code |
|---|---|---|
| 23505 (unique_violation) | 409 | `DUPLICATE_ENTRY` |
| 23503 (foreign_key_violation) | 400 | `INVALID_REFERENCE` |
| 23502 (not_null_violation) | 400 | `MISSING_REQUIRED_FIELD` |
| 42P01 (undefined_table) | 500 | `DATABASE_ERROR` |

### Stripe Error Mapping

| Stripe Error Type | HTTP Status |
|---|---|
| `card_error` | 402 |
| `invalid_request_error` | 400 |
| `authentication_error` | 401 |
| `rate_limit_error` | 429 |
| `stripe_error` | 502 |

### Validation Errors

`ValidationPipe` with `whitelist: true, forbidNonWhitelisted: false, transform: true` applied globally. Validation errors return 400 with `message` as array of field-specific error strings.

---

## Development Phases

### Phase 1: Core Auth + Users (Week 1–2)

**Goal:** Working registration, login, and user profiles.

**Deliverables:**
- [ ] NestJS project scaffold with all modules registered
- [ ] Docker Compose: PostgreSQL, Redis, MinIO, MailHog
- [ ] TypeORM setup with migrations (create `users`, `user_addresses` tables)
- [ ] `AuthModule`: register, login, refresh, logout, verify-email, forgot/reset password
- [ ] `UsersModule`: GET /me, PATCH /me, addresses CRUD
- [ ] JWT strategy with Redis-backed refresh tokens
- [ ] Email queue with MailHog in development
- [ ] Global validation pipe, exception filter, response interceptor
- [ ] Basic unit tests for AuthService

---

### Phase 2: Creator Profiles + Portfolios (Week 3–4)

**Goal:** Creators can build public profiles and portfolios.

**Deliverables:**
- [ ] Migrations: `creator_profiles`, `portfolios`, `portfolio_items`, `follows`, `media`
- [ ] `CreatorsModule`: create profile, update, public listing, follow/unfollow
- [ ] `PortfolioModule`: CRUD portfolios + items, publish, reorder
- [ ] `MediaModule`: presigned URL upload, confirm, delete
- [ ] Image processing queue (resize, thumbnail, WebP conversion)
- [ ] Public creator discovery endpoint with filtering
- [ ] `StorageService` abstraction (MinIO dev / S3 prod)

---

### Phase 3: Storefront + Products (Week 5–6)

**Goal:** Creators can list and manage products for sale.

**Deliverables:**
- [ ] Migrations: `storefronts`, `products`, `tags`, `categories`
- [ ] `StorefrontModule`: CRUD, slug validation, publish
- [ ] `ProductsModule`: CRUD all product types, publish, file upload
- [ ] Public product listing + search (pg_trgm)
- [ ] `TagsModule` + `CategoriesModule`
- [ ] Stripe product sync (create Stripe Product + Price on publish)
- [ ] Product type-specific validation

---

### Phase 4: Orders + Payments (Week 7–9)

**Goal:** End-to-end purchase flow working.

**Deliverables:**
- [ ] Migrations: `orders`, `order_items`
- [ ] `OrdersModule`: create order, Stripe PaymentIntent, order listing
- [ ] `PaymentsModule`: Stripe webhook ingestion + event routing
- [ ] Webhook handlers: payment_intent.succeeded → order completion
- [ ] Digital product download URL generation
- [ ] Download endpoint with limit enforcement
- [ ] Order status notifications (push + in-app)
- [ ] Creator Stripe Connect onboarding
- [ ] Platform fee via `application_fee_amount`
- [ ] Refund endpoint

---

### Phase 5: Subscriptions (Week 10–11)

**Goal:** All three subscription types working end-to-end.

**Deliverables:**
- [ ] Migrations: `subscription_plans`, `subscriptions`
- [ ] `SubscriptionsModule`: full CRUD, Stripe Subscription creation
- [ ] Webhook handlers: subscription lifecycle events
- [ ] Creator tier upgrades → update `creatorTier` field
- [ ] USER_CREATOR subscription (user → specific creator)
- [ ] Subscriber list for creators
- [ ] Subscription-gated content guards (future-ready)
- [ ] Dunning email flow (invoice.payment_failed)

---

### Phase 6: Analytics, Search & Notifications (Week 12–13)

**Goal:** Discovery, notifications, and analytics all operational.

**Deliverables:**
- [ ] Migrations: `creator_analytics`, `notifications`, `reviews`
- [ ] `AnalyticsModule`: view tracking, daily aggregation job, dashboard API
- [ ] `SearchModule`: unified search with pg_trgm, autocomplete
- [ ] `ReviewsModule`: submit, list, helpful, recalculate ratings
- [ ] `NotificationsModule`: in-app list, read, push dispatch
- [ ] Expo Push Notification integration
- [ ] Creator analytics dashboard endpoints
- [ ] Deep link support in push notifications

---

### Phase 7: Admin + Polish (Week 14)

**Goal:** Admin controls and production readiness.

**Deliverables:**
- [ ] `AdminModule`: user management, creator verification, review moderation
- [ ] Rate limiting configuration (production values)
- [ ] Comprehensive API documentation (Swagger / OpenAPI)
- [ ] Integration tests for critical flows (auth, order, subscription)
- [ ] Health check endpoints (`/health`, `/health/db`, `/health/redis`)
- [ ] Logging setup (Winston + correlation IDs)
- [ ] Environment variable validation on startup (Joi schema)

---

## Project Structure

```
backend/
├── src/
│   ├── main.ts                    # Bootstrap, global middleware
│   ├── app.module.ts              # Root module
│   │
│   ├── config/
│   │   ├── app.config.ts          # App-level config (port, env)
│   │   ├── database.config.ts     # TypeORM config
│   │   ├── jwt.config.ts          # JWT secrets + expiry
│   │   ├── stripe.config.ts       # Stripe key config
│   │   └── storage.config.ts      # MinIO/S3 config
│   │
│   ├── database/
│   │   ├── data-source.ts         # TypeORM DataSource for migrations CLI
│   │   └── migrations/            # Numbered TypeORM migration files
│   │
│   ├── common/
│   │   ├── decorators/            # @Public(), @Roles(), @CurrentUser()
│   │   ├── filters/               # AllExceptionsFilter
│   │   ├── guards/                # JwtAuthGuard, RolesGuard, IsOwnerGuard
│   │   ├── interceptors/          # LoggingInterceptor, TransformInterceptor
│   │   ├── pipes/                 # Custom validation pipes
│   │   └── dto/                   # Shared DTOs (PaginationDto, etc.)
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/        # JwtStrategy, LocalStrategy
│   │   │   └── dto/
│   │   ├── users/
│   │   ├── creators/
│   │   ├── portfolios/
│   │   ├── storefronts/
│   │   ├── products/
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── subscriptions/
│   │   ├── reviews/
│   │   ├── media/
│   │   ├── notifications/
│   │   ├── search/
│   │   ├── analytics/
│   │   ├── tags/
│   │   ├── categories/
│   │   └── admin/
│   │
│   └── shared/
│       ├── redis/                 # Redis module + service
│       ├── storage/               # StorageService (MinIO/S3)
│       ├── mail/                  # MailService (nodemailer)
│       └── stripe/                # StripeService wrapper
│
├── test/
│   ├── unit/                      # Jest unit tests
│   └── e2e/                       # Supertest integration tests
│
├── package.json
├── tsconfig.json
├── .env.example
└── nest-cli.json
```

---

## MVP Timeline

| Phase | Duration | End Week | Milestone |
|---|---|---|---|
| Phase 1: Auth + Users | 2 weeks | Week 2 | Login, register, profiles working |
| Phase 2: Creator + Portfolio | 2 weeks | Week 4 | Portfolio builder functional |
| Phase 3: Storefront + Products | 2 weeks | Week 6 | Creators can list products |
| Phase 4: Orders + Payments | 3 weeks | Week 9 | End-to-end purchase working |
| Phase 5: Subscriptions | 2 weeks | Week 11 | All subscription types working |
| Phase 6: Analytics + Search | 2 weeks | Week 13 | Discovery + analytics live |
| Phase 7: Admin + Polish | 1 week | Week 14 | Production-ready |

**Total: 14 weeks (3.5 months) for backend MVP**

### Key Dependencies / Risks

| Risk | Mitigation |
|---|---|
| Stripe Connect onboarding complexity | Build early (Phase 4); test with test accounts |
| MinIO → S3 migration for prod | StorageService abstraction ensures seamless swap |
| Search performance with pg_trgm | Monitor query times; add Elasticsearch post-MVP if needed |
| Analytics volume at scale | Redis buffering prevents DB overload in MVP phase |
| Webhook reliability | Idempotency keys + retry queues in Bull |
