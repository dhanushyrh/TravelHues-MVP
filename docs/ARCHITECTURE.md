# TravelHues MVP — System Architecture

## Table of Contents

1. [System Overview](#system-overview)
2. [Component Descriptions](#component-descriptions)
3. [Data Flow Diagrams](#data-flow-diagrams)
4. [Authentication Flow](#authentication-flow)
5. [Subscription & Payment Flow](#subscription--payment-flow)
6. [File Upload Flow](#file-upload-flow)
7. [Mobile App Architecture](#mobile-app-architecture)
8. [Creator Web App Architecture](#creator-web-app-architecture)
9. [API Gateway & Reverse Proxy](#api-gateway--reverse-proxy)
10. [Environment Breakdown](#environment-breakdown)
11. [Security Architecture](#security-architecture)

---

## System Overview

TravelHues is a two-sided marketplace platform:

- **Creators** (travel photographers, guides, influencers) — manage portfolios, sell products/services via storefronts, track analytics
- **Users/Travelers** — discover creators, subscribe to them, purchase travel content via mobile app

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TRAVELHUES PLATFORM                               │
│                                                                             │
│  ┌──────────────────────┐         ┌──────────────────────────────────────┐  │
│  │   CREATOR WEB APP    │         │         MOBILE USER APP              │  │
│  │   (React + Vite)     │         │      (React Native + Expo)           │  │
│  │                      │         │                                      │  │
│  │  Dashboard           │         │  Home / Discovery                    │  │
│  │  Portfolio Builder   │         │  Creator Profiles                    │  │
│  │  Storefront Manager  │         │  Storefront / Shop                   │  │
│  │  Product Manager     │         │  Product Purchase                    │  │
│  │  Orders / Revenue    │         │  My Subscriptions                    │  │
│  │  Analytics           │         │  My Orders / Downloads               │  │
│  └──────────┬───────────┘         └──────────────┬───────────────────────┘  │
│             │  HTTPS/REST                        │  HTTPS/REST              │
│             │                                    │                          │
│  ┌──────────▼────────────────────────────────────▼───────────────────────┐  │
│  │                        NGINX (Reverse Proxy)                          │  │
│  │                                                                       │  │
│  │   /api/*  ──► NestJS Backend (port 3000)                             │  │
│  │   /       ──► Creator Web App (port 5173 / static)                   │  │
│  │   /assets ──► MinIO proxy (port 9000)                                │  │
│  └──────────────────────────────┬────────────────────────────────────────┘  │
│                                 │                                           │
│  ┌──────────────────────────────▼────────────────────────────────────────┐  │
│  │                      NESTJS BACKEND API                               │  │
│  │                        (Port 3000)                                    │  │
│  │                                                                       │  │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ ┌─────────────┐  │  │
│  │  │  Auth   │ │  Users   │ │ Creator  │ │Products │ │   Orders    │  │  │
│  │  │ Module  │ │ Module   │ │ Module   │ │ Module  │ │   Module    │  │  │
│  │  └─────────┘ └──────────┘ └──────────┘ └─────────┘ └─────────────┘  │  │
│  │  ┌──────────┐ ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌─────────────┐  │  │
│  │  │  Subs   │ │ Portfolio│ │Storefront│ │  Media  │ │  Analytics  │  │  │
│  │  │ Module  │ │ Module   │ │  Module  │ │ Module  │ │   Module    │  │  │
│  │  └──────────┘ └─────────┘ └──────────┘ └─────────┘ └─────────────┘  │  │
│  │  ┌──────────┐ ┌─────────┐ ┌──────────┐ ┌─────────────────────────┐  │  │
│  │  │ Payments│ │ Search  │ │Notifics  │ │       Admin Module      │  │  │
│  │  │ Module  │ │ Module  │ │  Module  │ │                         │  │  │
│  │  └──────────┘ └─────────┘ └──────────┘ └─────────────────────────┘  │  │
│  └──────┬─────────────┬──────────────────┬──────────────────────────────┘  │
│         │             │                  │                                  │
│  ┌──────▼──────┐ ┌────▼──────┐ ┌────────▼──────────────────────────────┐  │
│  │ PostgreSQL  │ │  Redis    │ │              MinIO                     │  │
│  │ (Port 5432) │ │ (Port     │ │         (Ports 9000/9001)              │  │
│  │             │ │  6379)    │ │                                        │  │
│  │  Main DB    │ │  Cache    │ │  Buckets:                              │  │
│  │  All tables │ │  Sessions │ │  - travelhues-public  (avatars, etc.)  │  │
│  │             │ │  Queues   │ │  - travelhues-private (products)       │  │
│  │             │ │  Rate     │ │  - travelhues-media   (portfolio)      │  │
│  │             │ │  Limiting │ │                                        │  │
│  └─────────────┘ └───────────┘ └────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     EXTERNAL SERVICES                               │   │
│  │                                                                     │   │
│  │  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │   │
│  │  │ Stripe  │  │  Google  │  │  Apple   │  │  Expo    │            │   │
│  │  │Payments │  │  OAuth   │  │  OAuth   │  │  Push    │            │   │
│  │  │Webhooks │  │          │  │          │  │  Notifs  │            │   │
│  │  └─────────┘  └──────────┘  └──────────┘  └──────────┘            │   │
│  │  ┌──────────────────┐  ┌──────────────────────────────┐            │   │
│  │  │  MailHog (dev)   │  │  SendGrid / SES (prod)       │            │   │
│  │  │  Email Testing   │  │  Transactional Emails        │            │   │
│  │  └──────────────────┘  └──────────────────────────────┘            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Descriptions

### NestJS Backend API

The central application server handling all business logic.

| Responsibility | Detail |
|---|---|
| REST API | Versioned JSON API under `/api/v1/` |
| Authentication | JWT access tokens + refresh tokens + OAuth |
| Authorization | Role-based guards (USER, CREATOR, ADMIN) |
| Business Logic | All domain logic isolated in service classes |
| Database Access | TypeORM repositories + QueryBuilder for complex queries |
| Background Jobs | Bull queues backed by Redis |
| Webhook Handling | Stripe webhook endpoint with signature verification |
| File Management | Presigned URL generation, storage quota enforcement |
| Email | Transactional emails via nodemailer (MailHog dev / SES prod) |
| Push Notifications | Expo Push API integration via notification queue |

### PostgreSQL

Primary relational database for all persistent application data.

| Aspect | Detail |
|---|---|
| Version | PostgreSQL 16 |
| Extensions | `uuid-ossp` (UUID gen), `pg_trgm` (fuzzy text search), `btree_gin` (array indexing) |
| Connection Pooling | PgBouncer in prod; TypeORM pool (min: 2, max: 20) in dev |
| Migrations | TypeORM migrations, committed to source control |
| Backup | Daily pg_dump in production; point-in-time recovery on managed DB |

### Redis

Multi-purpose in-memory data store.

| Usage | Detail |
|---|---|
| Session/Auth Cache | Refresh token allow-list and revocation |
| API Response Cache | Creator profiles, product listings (TTL: 5 min) |
| Rate Limiting | Per-IP and per-user request throttling via `@nestjs/throttler` |
| Bull Job Queues | Email delivery, push notifications, analytics aggregation, media processing |
| Idempotency Keys | Stripe webhook deduplication |

### MinIO (Object Storage)

S3-compatible local object storage for development. Replaced by AWS S3 in production.

| Bucket | Contents | Access |
|---|---|---|
| `travelhues-public` | Avatars, profile banners, storefront logos, portfolio cover images | Public read |
| `travelhues-media` | Portfolio item images and videos | Public read with CDN |
| `travelhues-private` | Product files (presets, PDFs, guides) | Private, signed URLs only |
| `travelhues-uploads` | Temporary upload staging area (cleaned up after processing) | Internal only |

### Nginx

Reverse proxy handling all inbound traffic, TLS termination, and routing.

| Function | Detail |
|---|---|
| TLS Termination | Let's Encrypt certificates in production |
| API Routing | `/api/*` proxied to NestJS on port 3000 |
| Static Files | Creator web app served as static assets |
| Rate Limiting | Connection limiting at proxy layer |
| Compression | gzip enabled for API and static responses |
| CORS Headers | Managed at Nginx level in production |

---

## Data Flow Diagrams

### Creator Onboarding Flow

```
Creator Registers
      │
      ▼
POST /api/v1/auth/register { role: "CREATOR" }
      │
      ▼
Backend creates User + CreatorProfile (BASIC tier)
      │
      ├──► Email verification link sent (Bull queue → MailHog/SES)
      │
      ▼
Creator verifies email
      │
      ▼
Creator completes profile (displayName, bio, specialties)
      │
      ▼
Creator clicks "Connect Stripe Payout Account"
      │
      ▼
Backend calls Stripe → creates Express account → returns onboarding URL
      │
      ▼
Creator completes Stripe onboarding on Stripe-hosted page
      │
      ▼
Stripe webhook: account.updated → Backend updates stripeAccountStatus = ACTIVE
      │
      ▼
Creator can now publish products and receive payouts
```

### User Purchase Flow

```
User browses storefront on mobile app
      │
      ▼
GET /api/v1/storefronts/{slug}/products
      │
      ▼
User taps product → Product Detail Screen
      │
      ▼
User taps "Buy Now"
      │
      ▼
POST /api/v1/orders { items: [{ productId, quantity }] }
      │
      ▼
Backend:
  1. Validates product availability and price
  2. Calculates platform fee (10% BASIC, 7% PRO, 5% PREMIUM)
  3. Creates Order record (PENDING)
  4. Creates Stripe PaymentIntent with transfer_data for creator
  5. Returns clientSecret to mobile app
      │
      ▼
Mobile app uses Stripe SDK to collect payment
      │
      ▼
Stripe confirms payment → webhook: payment_intent.succeeded
      │
      ▼
Backend webhook handler:
  1. Updates Order status → COMPLETED
  2. Generates signed download URLs for digital products
  3. Increments product.totalSold, creator.totalSales, storefront.totalRevenue
  4. Sends ORDER_STATUS notification to user (push + in-app)
  5. Sends NEW_ORDER notification to creator (in-app)
  6. Queues analytics update job
```

---

## Authentication Flow

### JWT + Refresh Token Strategy

TravelHues uses a short-lived access token + long-lived refresh token pattern.

```
┌──────────┐                          ┌──────────────┐              ┌──────────┐
│  Client  │                          │   Backend    │              │  Redis   │
└──────────┘                          └──────────────┘              └──────────┘
     │                                       │                            │
     │  POST /auth/login { email, password } │                            │
     │──────────────────────────────────────►│                            │
     │                                       │  bcrypt.compare(password)  │
     │                                       │  Generate accessToken      │
     │                                       │  (JWT, 15 min exp)         │
     │                                       │  Generate refreshToken     │
     │                                       │  (opaque, UUID)            │
     │                                       │──────────────────────────►│
     │                                       │  STORE refreshToken:userId │
     │                                       │  (TTL: 30 days)            │
     │  { accessToken, refreshToken, user }  │                            │
     │◄──────────────────────────────────────│                            │
     │                                       │                            │
     │  GET /some-protected-route            │                            │
     │  Authorization: Bearer {accessToken}  │                            │
     │──────────────────────────────────────►│                            │
     │  Verify JWT signature & expiry        │                            │
     │  Extract userId, role from payload    │                            │
     │  { data }                             │                            │
     │◄──────────────────────────────────────│                            │
     │                                       │                            │
     │  [After 15 min, accessToken expires]  │                            │
     │  POST /auth/refresh { refreshToken }  │                            │
     │──────────────────────────────────────►│                            │
     │                                       │  GET refreshToken from     │
     │                                       │──────────────────────────►│
     │                                       │  Redis: validate exists    │
     │                                       │  DELETE old refreshToken   │
     │                                       │  Generate new tokenPair    │
     │                                       │  STORE new refreshToken    │
     │  { accessToken, refreshToken }        │                            │
     │◄──────────────────────────────────────│                            │
     │                                       │                            │
     │  POST /auth/logout                    │                            │
     │──────────────────────────────────────►│                            │
     │                                       │  DELETE refreshToken       │
     │                                       │──────────────────────────►│
     │  { success: true }                    │                            │
     │◄──────────────────────────────────────│                            │
```

**Token Specifications:**

| Token | Type | Expiry | Storage (Mobile) | Storage (Web) |
|---|---|---|---|---|
| Access Token | JWT (RS256) | 15 minutes | Memory (Zustand) | Memory (Zustand) |
| Refresh Token | Opaque UUID | 30 days | SecureStore (Expo) | HttpOnly Cookie |

**JWT Payload:**
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "CREATOR",
  "tier": "PRO",
  "iat": 1716000000,
  "exp": 1716000900
}
```

### OAuth Flow (Google / Apple)

```
Mobile App                    Backend                    Google/Apple
    │                             │                            │
    │  SDK: get idToken           │                            │
    │─────────────────────────────────────────────────────────►│
    │◄─────────────────────────────────────────────────────────│
    │  POST /auth/oauth           │                            │
    │  { provider, idToken }      │                            │
    │────────────────────────────►│                            │
    │                             │  Verify idToken with       │
    │                             │  Google/Apple JWKS         │
    │                             │                            │
    │                             │  Find or create User       │
    │                             │  (upsert on oauthProviderId)
    │                             │                            │
    │  { accessToken,             │                            │
    │    refreshToken, user,      │                            │
    │    isNewUser }              │                            │
    │◄────────────────────────────│                            │
```

### Email Verification Flow

```
Register → Backend generates emailVerificationToken (UUID)
         → Stores hashed token in users.emailVerificationToken
         → Queues email: "Verify your TravelHues account"
         → Email contains link: https://app.travelhues.com/verify?token=<raw>

User clicks link → GET /auth/verify-email?token=<raw>
                 → Backend hashes token, finds user
                 → Sets isEmailVerified=true, clears token field
                 → Returns success, user is now fully active
```

---

## Subscription & Payment Flow

### Creator Tier Upgrade (Platform Subscription)

```
Creator on Dashboard                 Backend                    Stripe
        │                               │                          │
        │  GET /subscriptions/plans     │                          │
        │  ?type=CREATOR_TIER           │                          │
        │──────────────────────────────►│                          │
        │  [{ BASIC, PRO, PREMIUM }]    │                          │
        │◄──────────────────────────────│                          │
        │                               │                          │
        │  POST /subscriptions          │                          │
        │  { planId, paymentMethodId }  │                          │
        │──────────────────────────────►│                          │
        │                               │  Create/get Stripe       │
        │                               │  Customer                │
        │                               │──────────────────────────►
        │                               │  Create Subscription     │
        │                               │  (planId.stripePriceId)  │
        │                               │──────────────────────────►
        │                               │◄──────────────────────────
        │                               │  subscription.created    │
        │  { subscription, clientSecret}│                          │
        │◄──────────────────────────────│                          │
        │                               │                          │
        │  [Stripe handles 3D Secure    │                          │
        │   if required]                │                          │
        │                               │                          │
        │              ┌────────────────────────────────────────┐  │
        │              │  Stripe Webhooks (async)               │  │
        │              │                                        │  │
        │              │  customer.subscription.updated         │  │
        │              │  → Update subscription.status          │  │
        │              │  → Update user/creator.creatorTier     │  │
        │              │  → Send SUBSCRIPTION notification      │  │
        │              │                                        │  │
        │              │  invoice.payment_failed                │  │
        │              │  → Update status to PAST_DUE           │  │
        │              │  → Send PAYMENT_FAILED notification    │  │
        │              │  → Send email with retry link          │  │
        │              │                                        │  │
        │              │  customer.subscription.deleted         │  │
        │              │  → Update status to CANCELLED          │  │
        │              │  → Downgrade creator tier to BASIC     │  │
        │              └────────────────────────────────────────┘  │
```

### Stripe Connect Payout (Creator Earnings)

```
Order Payment Confirmed (payment_intent.succeeded)
        │
        ▼
Stripe Connect splits payment automatically:
  - Platform fee (10/7/5%) stays in platform account
  - Creator amount transferred to creator's Express account
        │
        ▼
Creator requests manual payout (or auto-payout is configured):
  POST /api/v1/payments/payouts/request
        │
        ▼
Backend calls Stripe: payouts.create on creator's Connect account
        │
        ▼
Stripe webhook: payout.paid → Send PAYOUT_SENT notification to creator
```

**Platform Fee Structure:**

| Creator Tier | Platform Commission |
|---|---|
| BASIC | 10% |
| PRO | 7% |
| PREMIUM | 5% |

---

## File Upload Flow

### Direct Upload to MinIO/S3

TravelHues uses a **presigned URL upload pattern** to avoid routing large files through the application server.

```
Client (Web/Mobile)                Backend                  MinIO/S3
       │                              │                         │
       │  POST /media/upload-url      │                         │
       │  { filename, mimeType,       │                         │
       │    fileSize, purpose }        │                         │
       │─────────────────────────────►│                         │
       │                              │  Validate file type     │
       │                              │  Check quota            │
       │                              │  Generate storageKey    │
       │                              │  (e.g. media/{userId}/{uuid}.jpg)
       │                              │  Create presigned PUT URL
       │                              │─────────────────────────►
       │                              │◄─────────────────────────
       │  { uploadUrl, storageKey,    │                         │
       │    mediaId (pending) }       │                         │
       │◄─────────────────────────────│                         │
       │                              │                         │
       │  PUT {uploadUrl}             │                         │
       │  [binary file data]          │                         │
       │──────────────────────────────────────────────────────►│
       │  HTTP 200 OK                 │                         │
       │◄──────────────────────────────────────────────────────│
       │                              │                         │
       │  POST /media/confirm         │                         │
       │  { mediaId, storageKey }     │                         │
       │─────────────────────────────►│                         │
       │                              │  Verify file exists     │
       │                              │  in MinIO/S3            │
       │                              │─────────────────────────►
       │                              │  HEAD object            │
       │                              │◄─────────────────────────
       │                              │  Create Media record    │
       │                              │  Queue processing job:  │
       │                              │  - Image resize/compress│
       │                              │  - Thumbnail generation  │
       │                              │  - Virus scan (prod)    │
       │  { media: MediaResponseDto } │                         │
       │◄─────────────────────────────│                         │
```

**File Type Restrictions:**

| Purpose | Allowed Types | Max Size |
|---|---|---|
| Avatar | image/jpeg, image/png, image/webp | 5 MB |
| Portfolio Item | image/jpeg, image/png, image/webp, video/mp4 | 50 MB |
| Storefront Banner | image/jpeg, image/png, image/webp | 10 MB |
| Product File | any (PDF, ZIP, preset formats) | 500 MB |
| Product Cover | image/jpeg, image/png, image/webp | 10 MB |

**Image Processing Pipeline (Bull Queue):**
```
Upload confirmed → image-processing queue
  1. Resize to multiple sizes: 400px, 800px, 1200px (images only)
  2. Convert to WebP format for web delivery
  3. Generate thumbnail (200x200px)
  4. Update media.thumbnailUrl and metadata
  5. If portfolio video: generate poster frame
```

---

## Mobile App Architecture

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.74 + Expo SDK 51 |
| Language | TypeScript 5.x |
| Navigation | React Navigation 6 (Stack + Bottom Tabs + Modals) |
| State (Server) | TanStack Query v5 (React Query) |
| State (Client) | Zustand v4 |
| Styling | NativeWind v4 (Tailwind CSS for RN) |
| Forms | React Hook Form + Zod validation |
| Payments | @stripe/stripe-react-native |
| Storage | Expo SecureStore (tokens), AsyncStorage (preferences) |
| Push Notifications | Expo Notifications + Expo Push API |
| Deep Linking | Expo Linking + React Navigation Deep Link config |
| Image Handling | Expo Image (fast loading/caching) |
| Video | Expo Video |
| Maps | React Native Maps (for portfolio location display) |

### Screen Architecture

```
App Entry (expo-router or React Navigation)
│
├── Auth Stack (unauthenticated)
│   ├── WelcomeScreen         – Onboarding carousel + CTA buttons
│   ├── LoginScreen           – Email/password + OAuth buttons
│   ├── RegisterScreen        – Sign up form
│   ├── ForgotPasswordScreen  – Request reset email
│   └── VerifyEmailScreen     – Show "check your email" state
│
└── Main App (authenticated)
    ├── BottomTabNavigator
    │   ├── Tab: Home (HomeStack)
    │   │   ├── HomeScreen         – Featured creators, trending products
    │   │   ├── SearchScreen       – Full-text search + tag filters
    │   │   └── ExploreScreen      – Browse by destination/style
    │   │
    │   ├── Tab: Discover (CreatorStack)
    │   │   ├── CreatorListScreen  – Grid of creators with filters
    │   │   └── CreatorProfileScreen – Full creator profile
    │   │       ├── PortfolioTab
    │   │       │   ├── PortfolioListScreen
    │   │       │   └── PortfolioDetailScreen
    │   │       └── StorefrontTab
    │   │           └── (navigates to StorefrontStack)
    │   │
    │   ├── Tab: Shop (ShopStack)
    │   │   ├── StorefrontScreen   – Creator's shop with product grid
    │   │   ├── ProductDetailScreen – Full product info + buy button
    │   │   ├── CartScreen         – Review cart, apply coupons
    │   │   └── CheckoutScreen     – Payment via Stripe SDK
    │   │
    │   ├── Tab: My Library (LibraryStack)
    │   │   ├── OrdersScreen       – Purchase history
    │   │   ├── OrderDetailScreen  – Single order with download links
    │   │   ├── SubscriptionsScreen – My active subscriptions
    │   │   └── DownloadsScreen    – Downloaded content (offline)
    │   │
    │   └── Tab: Profile (ProfileStack)
    │       ├── ProfileScreen      – User info, stats
    │       ├── FollowingScreen    – Creators I follow
    │       ├── NotificationsScreen – All notifications
    │       ├── AddressesScreen    – Saved addresses
    │       └── SettingsScreen
    │           ├── AccountSettings
    │           ├── NotificationPreferences
    │           ├── PaymentMethods
    │           └── PrivacySettings
    │
    └── Modal Stack (overlays)
        ├── WriteReviewModal
        ├── PaymentMethodModal
        └── ShareModal
```

### State Management Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Zustand Stores                       │
│                                                         │
│  authStore          – currentUser, tokens, isLoading    │
│  cartStore          – items[], total, creatorId         │
│  notificationStore  – unreadCount, pushToken            │
│  uiStore            – theme, language, modals           │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│              TanStack Query (Server State)               │
│                                                         │
│  useCreators()     – paginated creator list             │
│  useCreator(id)    – single creator profile             │
│  useProducts()     – storefront product list            │
│  useOrders()       – user's order history               │
│  useSubscriptions() – active subscriptions              │
│  useNotifications() – notification list                 │
└─────────────────────────────────────────────────────────┘
```

### Push Notification Flow

```
1. App launch → request push permission
   → Expo.Notifications.getExpoPushTokenAsync()
   → POST /api/v1/users/push-token { token, platform }
   → Backend stores token in user record

2. Backend event (e.g. new order) occurs
   → notification-queue job created
   → Bull worker calls Expo Push API
   → https://exp.host/--/api/v2/push/send
   → Payload: { to: expoPushToken, title, body, data }

3. App receives notification
   → Foreground: in-app banner via Notifications.addNotificationReceivedListener
   → Background/killed: OS notification tray
   → Tap: Notifications.addNotificationResponseReceivedListener
     → Parse data.actionUrl
     → Navigate to relevant screen
```

### Deep Linking Configuration

```
Scheme: travelhues://
Web URL: https://app.travelhues.com

Routes:
  travelhues://creator/{id}         → CreatorProfileScreen
  travelhues://shop/{slug}          → StorefrontScreen
  travelhues://product/{id}         → ProductDetailScreen
  travelhues://order/{id}           → OrderDetailScreen
  travelhues://verify?token={token} → VerifyEmailScreen
  travelhues://reset?token={token}  → ResetPasswordScreen
```

---

## Creator Web App Architecture

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite 5 |
| Language | TypeScript 5.x |
| Routing | React Router v6 (data router) |
| State (Server) | TanStack Query v5 |
| State (Client) | Zustand v4 |
| Styling | Tailwind CSS v3 + shadcn/ui |
| Forms | React Hook Form + Zod |
| Rich Text Editor | TipTap (for product descriptions, bio) |
| Charts/Analytics | Recharts |
| File Upload | react-dropzone + custom presigned URL handler |
| Drag & Drop | @dnd-kit/core (portfolio item reordering) |
| Payments | @stripe/stripe-js + @stripe/react-stripe-js |
| Date Handling | date-fns |
| HTTP Client | Axios with interceptors for auth |

### Page / Route Architecture

```
/                       → Redirect to /dashboard (if auth) or /login
/login                  → Login page
/register               → Register as creator
/forgot-password        → Forgot password
/verify-email           → Email verification landing

/dashboard              → Overview: revenue, followers, recent orders
/portfolio              → Portfolio list
/portfolio/new          → Create new portfolio
/portfolio/:id          → Edit portfolio (drag-drop items)
/portfolio/:id/items/new → Add portfolio items

/storefront             → Storefront settings (branding, slug, publish)
/products               → Product list (table with publish/unpublish)
/products/new           → Create product (multi-step wizard)
/products/:id           → Edit product

/orders                 → Orders list (filter by status)
/orders/:id             → Order detail + refund action

/subscribers            → Subscriber list (name, plan, since, revenue)

/analytics              → Analytics dashboard (charts, date range picker)

/settings               → Tab layout:
  /settings/profile     → Edit creator profile, bio, social links
  /settings/account     → Email, password, 2FA (future)
  /settings/payouts     → Stripe Connect setup/dashboard link
  /settings/billing     → Creator tier subscription management
  /settings/notifications → Email notification preferences
```

### Component Architecture

```
src/
├── components/
│   ├── ui/              ← shadcn/ui components (Button, Dialog, etc.)
│   ├── layout/
│   │   ├── AppShell.tsx       – Sidebar + top nav wrapper
│   │   ├── Sidebar.tsx        – Navigation sidebar with active states
│   │   ├── TopBar.tsx         – Header with notifications + user menu
│   │   └── PageHeader.tsx     – Reusable page title + action area
│   ├── portfolio/
│   │   ├── PortfolioCard.tsx
│   │   ├── PortfolioItemGrid.tsx
│   │   ├── PortfolioItemDragList.tsx
│   │   └── MediaUploader.tsx
│   ├── products/
│   │   ├── ProductCard.tsx
│   │   ├── ProductForm/
│   │   │   ├── ProductFormStep1.tsx  – Type + basic info
│   │   │   ├── ProductFormStep2.tsx  – Pricing + stock
│   │   │   ├── ProductFormStep3.tsx  – Media upload
│   │   │   └── ProductFormStep4.tsx  – Review + publish
│   │   └── ProductTypeIcon.tsx
│   ├── analytics/
│   │   ├── RevenueChart.tsx    – Line chart with date range
│   │   ├── FollowerGrowth.tsx  – Bar chart
│   │   ├── StatCard.tsx        – Single KPI display card
│   │   └── ConversionFunnel.tsx
│   ├── orders/
│   │   ├── OrdersTable.tsx
│   │   ├── OrderStatusBadge.tsx
│   │   └── RefundDialog.tsx
│   └── shared/
│       ├── ConfirmDialog.tsx
│       ├── ImageCropper.tsx
│       ├── LoadingSpinner.tsx
│       └── EmptyState.tsx
├── pages/               ← Page-level components (match routes)
├── hooks/               ← Custom React hooks (useAuth, useUpload, etc.)
├── stores/              ← Zustand stores
├── services/            ← API call functions (typed with Axios)
├── lib/                 ← Utilities, constants, validators
└── types/               ← Shared TypeScript types matching backend DTOs
```

### API Client Setup

```typescript
// src/lib/api.ts
// Axios instance with:
// - baseURL: VITE_API_BASE_URL
// - Request interceptor: attach Bearer token from authStore
// - Response interceptor: handle 401 → attempt refresh → retry
// - Response interceptor: parse error shapes into typed ApiError
```

---

## API Gateway & Reverse Proxy

### Nginx Configuration Overview

```nginx
# /etc/nginx/nginx.conf (production)

upstream api_backend {
    server backend:3000;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name api.travelhues.com;

    # TLS (Let's Encrypt / Certbot)
    ssl_certificate /etc/letsencrypt/live/travelhues.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/travelhues.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000";

    # API proxy
    location /api/ {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        client_max_body_size 600M;  # For product file uploads
    }

    # Stripe webhook (bypass rate limiting)
    location /api/v1/webhooks/stripe {
        proxy_pass http://api_backend;
        proxy_set_header X-Forwarded-For $remote_addr;
    }
}

server {
    listen 443 ssl http2;
    server_name app.travelhues.com;  # Creator web app

    root /var/www/creator-app/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;  # SPA fallback
    }

    location ~* \.(js|css|png|jpg|webp|svg|ico|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Request Rate Limiting

| Endpoint Group | Limit | Window |
|---|---|---|
| POST /auth/login | 10 requests | 15 minutes per IP |
| POST /auth/register | 5 requests | 1 hour per IP |
| POST /auth/forgot-password | 3 requests | 1 hour per IP |
| General API (authenticated) | 300 requests | 1 minute per user |
| General API (unauthenticated) | 60 requests | 1 minute per IP |
| File upload initiation | 20 requests | 1 minute per user |
| Stripe webhooks | Unlimited (signature verified) | — |

---

## Environment Breakdown

### Development Environment

```
┌────────────────────────────────────────────────────────┐
│            docker-compose.dev.yml                      │
│                                                        │
│  postgres:16   → localhost:5432                        │
│  redis:7       → localhost:6379                        │
│  minio         → localhost:9000 (API), 9001 (Console)  │
│  mailhog       → localhost:1025 (SMTP), 8025 (UI)      │
│  backend       → localhost:3000 (hot reload via tsx)   │
│  creator-web   → localhost:5173 (Vite HMR)             │
└────────────────────────────────────────────────────────┘
```

**Key dev features:**
- Hot reload on all services
- Stripe CLI `stripe listen` forwarding webhooks to localhost:3000/api/v1/webhooks/stripe
- MailHog catching all outbound emails (visible at http://localhost:8025)
- MinIO Console at http://localhost:9001 for browsing buckets

### Staging Environment

```
┌────────────────────────────────────────────────────────────┐
│                 staging.travelhues.com                     │
│                                                            │
│  Single VPS or Railway/Render deployment                   │
│  Uses Stripe test keys                                     │
│  Real database (separate staging DB)                       │
│  Real MinIO or S3 bucket (travelhues-staging-*)            │
│  SendGrid in sandbox/test mode                             │
│  Seeded with realistic test data                           │
└────────────────────────────────────────────────────────────┘
```

### Production Environment

```
┌────────────────────────────────────────────────────────────┐
│                   travelhues.com (prod)                    │
│                                                            │
│  Managed PostgreSQL (Railway / AWS RDS)                    │
│  Managed Redis (Railway / AWS ElastiCache)                 │
│  AWS S3 (replaces MinIO)                                   │
│  CloudFront CDN in front of S3 for media delivery         │
│  Backend: 2+ replicas with load balancing                  │
│  Stripe live keys                                          │
│  SendGrid production                                       │
│  Sentry for error tracking                                 │
│  Datadog or Grafana for metrics                            │
└────────────────────────────────────────────────────────────┘
```

### Environment Variable Matrix

| Variable | Dev | Staging | Prod |
|---|---|---|---|
| `DATABASE_URL` | localhost:5432 | managed DB URL | managed DB URL |
| `REDIS_URL` | localhost:6379 | managed Redis URL | managed Redis URL |
| `JWT_SECRET` | dev-only-secret | generated | generated (vault) |
| `JWT_REFRESH_SECRET` | dev-only-secret | generated | generated (vault) |
| `STRIPE_SECRET_KEY` | sk_test_xxx | sk_test_xxx | sk_live_xxx |
| `STRIPE_WEBHOOK_SECRET` | whsec_xxx (CLI) | whsec_xxx | whsec_xxx |
| `MINIO_ENDPOINT` | localhost | minio-staging | s3.amazonaws.com |
| `STORAGE_BUCKET_PUBLIC` | travelhues-public | th-staging-public | th-prod-public |
| `SMTP_HOST` | localhost (Mailhog) | smtp.sendgrid.net | smtp.sendgrid.net |
| `APP_ENV` | development | staging | production |

---

## Security Architecture

### Authentication Guards

```
All API routes protected by one of:
  - @Public()           → No auth required (public product listings, etc.)
  - @Roles('USER')      → Authenticated user
  - @Roles('CREATOR')   → Must be CREATOR role
  - @Roles('ADMIN')     → Must be ADMIN role
  - @IsOwner()          → Must own the resource (checks userId match)
```

### Data Access Rules

| Resource | Public Read | Auth Read | Creator Write | Admin Only |
|---|---|---|---|---|
| Creator Profiles | Published only | All | Own profile | Verify/ban |
| Portfolios | Published only | All | Own portfolios | — |
| Products | Published only | All | Own products | — |
| Orders | — | Own orders | Orders for their products | All orders |
| Analytics | — | — | Own analytics | All analytics |
| Subscriptions | — | Own subs | Own creator subs | All |

### Stripe Security

- Webhook signature verification on every incoming Stripe event (raw body required)
- Idempotency keys stored in Redis to prevent duplicate order processing
- Creator Stripe Express accounts managed via Connect — platform never stores card data
- All payment amounts re-validated server-side (never trust client-provided prices)
- Platform fee deducted at Stripe level via `application_fee_amount` on PaymentIntent

### File Security

- Private product files never exposed directly; all access via short-lived presigned URLs (1 hour TTL)
- Download URLs embedded in OrderItem after payment confirmation
- Download count/limit enforcement on every download request
- File type validation both client-side and server-side (MIME type check + magic bytes in prod)
