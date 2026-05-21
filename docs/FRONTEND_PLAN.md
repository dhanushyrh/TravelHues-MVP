# TravelHues MVP — Frontend Plan

## Table of Contents

1. [Creator Web App (ReactJS)](#creator-web-app-reactjs)
   - [Tech Stack](#creator-web-tech-stack)
   - [Project Structure](#creator-web-project-structure)
   - [Pages & Routes](#creator-web-pages--routes)
   - [Key Components](#creator-web-key-components)
   - [State Management](#creator-web-state-management)
   - [API Layer](#creator-web-api-layer)
   - [Development Phases](#creator-web-development-phases)

2. [Mobile User App (React Native + Expo)](#mobile-user-app-react-native--expo)
   - [Tech Stack](#mobile-tech-stack)
   - [Project Structure](#mobile-project-structure)
   - [Screens & Navigation](#screens--navigation)
   - [Key Components](#mobile-key-components)
   - [State Management](#mobile-state-management)
   - [Push Notifications](#push-notifications)
   - [Deep Linking](#deep-linking)
   - [Offline Support](#offline-support)
   - [Development Phases](#mobile-development-phases)

3. [Shared Conventions](#shared-conventions)

---

## Creator Web App (ReactJS)

### Creator Web Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Framework | React | 18.x | UI rendering |
| Build Tool | Vite | 5.x | Fast HMR, optimized builds |
| Language | TypeScript | 5.x | Type safety throughout |
| Routing | React Router | v6.x (data router) | Client-side routing + loaders |
| Server State | TanStack Query | v5.x | API data fetching, caching, mutations |
| Client State | Zustand | v4.x | Auth store, UI state, cart |
| Styling | Tailwind CSS | v3.x | Utility-first CSS |
| Component Library | shadcn/ui | latest | Accessible, unstyled Radix-based components |
| Forms | React Hook Form | v7.x | Performant forms |
| Validation | Zod | v3.x | Schema validation (shared with backend DTO shapes) |
| Rich Text Editor | TipTap | v2.x | Product descriptions, creator bio |
| Charts | Recharts | v2.x | Analytics dashboards |
| Drag & Drop | @dnd-kit/core | v6.x | Portfolio item reordering |
| File Upload | react-dropzone | v14.x | Multi-file drag-drop upload UI |
| Payments | @stripe/stripe-js + @stripe/react-stripe-js | latest | Stripe Elements for payment forms |
| HTTP Client | Axios | v1.x | API calls with interceptors |
| Date Utilities | date-fns | v3.x | Date formatting, range calculation |
| Icons | lucide-react | latest | Consistent icon set |
| Toast Notifications | sonner | latest | Lightweight toasts |
| Image Cropping | react-image-crop | v11.x | Avatar and banner cropping |
| Color Picker | react-colorful | latest | Storefront theme color picker |

---

### Creator Web Project Structure

```
creator-web/
├── public/
│   ├── favicon.ico
│   └── og-image.png
│
├── src/
│   ├── main.tsx                     # React + Router entry point
│   ├── App.tsx                      # Root component with providers
│   │
│   ├── router/
│   │   ├── index.tsx                # React Router createBrowserRouter config
│   │   ├── ProtectedRoute.tsx       # Auth guard wrapper component
│   │   └── CreatorRoute.tsx         # CREATOR role guard
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   ├── ResetPasswordPage.tsx
│   │   │   └── VerifyEmailPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── portfolio/
│   │   │   ├── PortfolioListPage.tsx
│   │   │   ├── PortfolioEditPage.tsx
│   │   │   └── PortfolioNewPage.tsx
│   │   ├── products/
│   │   │   ├── ProductsPage.tsx
│   │   │   ├── ProductNewPage.tsx
│   │   │   └── ProductEditPage.tsx
│   │   ├── storefront/
│   │   │   └── StorefrontPage.tsx
│   │   ├── orders/
│   │   │   ├── OrdersPage.tsx
│   │   │   └── OrderDetailPage.tsx
│   │   ├── subscribers/
│   │   │   └── SubscribersPage.tsx
│   │   ├── analytics/
│   │   │   └── AnalyticsPage.tsx
│   │   └── settings/
│   │       ├── SettingsLayout.tsx
│   │       ├── ProfileSettings.tsx
│   │       ├── AccountSettings.tsx
│   │       ├── PayoutsSettings.tsx
│   │       ├── BillingSettings.tsx
│   │       └── NotificationSettings.tsx
│   │
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components (generated)
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── table.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── card.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── select.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── skeleton.tsx
│   │   │   └── [other shadcn components]
│   │   │
│   │   ├── layout/
│   │   │   ├── AppShell.tsx         # Main app wrapper: sidebar + topbar
│   │   │   ├── Sidebar.tsx          # Left navigation sidebar
│   │   │   ├── TopBar.tsx           # Top header with user menu + notifications
│   │   │   ├── PageHeader.tsx       # Reusable page title + breadcrumbs + actions
│   │   │   └── AuthLayout.tsx       # Centered layout for auth pages
│   │   │
│   │   ├── dashboard/
│   │   │   ├── RevenueCard.tsx      # KPI card: total revenue
│   │   │   ├── FollowerCard.tsx     # KPI card: follower count
│   │   │   ├── RecentOrders.tsx     # Mini order table on dashboard
│   │   │   ├── RecentActivity.tsx   # Activity feed widget
│   │   │   └── QuickActions.tsx     # "Add product", "Edit storefront" CTAs
│   │   │
│   │   ├── portfolio/
│   │   │   ├── PortfolioCard.tsx        # Grid card for portfolio list
│   │   │   ├── PortfolioItemList.tsx    # DnD sortable list of items
│   │   │   ├── PortfolioItemCard.tsx    # Individual item in the DnD list
│   │   │   ├── PortfolioItemForm.tsx    # Add/edit single portfolio item
│   │   │   ├── PortfolioSettings.tsx    # Title, cover, publish settings
│   │   │   └── MediaGallery.tsx         # Multi-image preview carousel
│   │   │
│   │   ├── products/
│   │   │   ├── ProductCard.tsx          # Grid card for product list
│   │   │   ├── ProductsTable.tsx        # Table view of products with actions
│   │   │   ├── ProductTypeSelect.tsx    # Type picker with icons + descriptions
│   │   │   ├── ProductWizard/
│   │   │   │   ├── ProductWizard.tsx    # Multi-step form container
│   │   │   │   ├── Step1BasicInfo.tsx   # Title, type, description
│   │   │   │   ├── Step2Pricing.tsx     # Price, stock, digital toggle
│   │   │   │   ├── Step3Media.tsx       # Cover image, preview images, file upload
│   │   │   │   └── Step4Review.tsx      # Final review + publish
│   │   │   ├── ProductTypeIcon.tsx      # Icon map for each product type
│   │   │   └── ProductStatusBadge.tsx   # Published/Draft badge
│   │   │
│   │   ├── storefront/
│   │   │   ├── StorefrontPreview.tsx    # Live preview of storefront appearance
│   │   │   ├── BrandingForm.tsx         # Logo, banner, colors
│   │   │   ├── SlugEditor.tsx           # Slug input with availability check
│   │   │   ├── ThemeColorPicker.tsx     # Hex color picker
│   │   │   └── CustomDomainInput.tsx    # Custom domain input with validation
│   │   │
│   │   ├── orders/
│   │   │   ├── OrdersTable.tsx          # Orders list with filters
│   │   │   ├── OrderStatusBadge.tsx     # Status chip component
│   │   │   ├── OrderFilters.tsx         # Status + date range filter bar
│   │   │   ├── OrderDetail.tsx          # Full order detail view
│   │   │   ├── OrderItemRow.tsx         # Single line item in order
│   │   │   └── RefundDialog.tsx         # Confirm refund modal
│   │   │
│   │   ├── analytics/
│   │   │   ├── DateRangePicker.tsx      # Date range selector (7d/30d/90d/custom)
│   │   │   ├── StatCard.tsx             # Single KPI display with change indicator
│   │   │   ├── RevenueLineChart.tsx     # Revenue over time (Recharts)
│   │   │   ├── FollowerBarChart.tsx     # Follower growth bar chart
│   │   │   ├── ViewsAreaChart.tsx       # Profile/storefront views area chart
│   │   │   ├── TopProductsTable.tsx     # Best-selling products table
│   │   │   └── ConversionMetrics.tsx    # Views → orders funnel
│   │   │
│   │   ├── subscribers/
│   │   │   ├── SubscribersTable.tsx     # Subscriber list with plan info
│   │   │   ├── SubscriberRow.tsx        # Individual subscriber row
│   │   │   └── MrrDisplay.tsx           # Monthly recurring revenue display
│   │   │
│   │   ├── settings/
│   │   │   ├── AvatarUploader.tsx       # Crop + upload avatar
│   │   │   ├── SocialLinksForm.tsx      # Instagram/Twitter/YouTube/TikTok
│   │   │   ├── SpecialtiesInput.tsx     # Tag-style specialty input
│   │   │   ├── StripeConnectCard.tsx    # Stripe onboarding status + action
│   │   │   ├── PlanCard.tsx             # Subscription plan display + upgrade CTA
│   │   │   └── PlanSelector.tsx         # BASIC/PRO/PREMIUM toggle
│   │   │
│   │   └── shared/
│   │       ├── ConfirmDialog.tsx        # Generic "Are you sure?" modal
│   │       ├── EmptyState.tsx           # Empty list placeholder
│   │       ├── LoadingSpinner.tsx       # Centered spinner
│   │       ├── SkeletonCard.tsx         # Loading skeleton for cards
│   │       ├── FileDropzone.tsx         # Styled dropzone with progress
│   │       ├── ImagePreview.tsx         # Image with remove button overlay
│   │       ├── RichTextEditor.tsx       # TipTap wrapper
│   │       ├── Pagination.tsx           # Page number controls
│   │       ├── SearchInput.tsx          # Debounced search input
│   │       └── StatusDot.tsx            # Colored status indicator dot
│   │
│   ├── hooks/
│   │   ├── useAuth.ts               # Auth state + login/logout actions
│   │   ├── useCreatorProfile.ts     # Current creator's profile data
│   │   ├── useUpload.ts             # Presigned URL upload logic (file → MinIO)
│   │   ├── useSlugCheck.ts          # Debounced slug availability check
│   │   ├── useDebounce.ts           # Generic debounce hook
│   │   ├── useLocalStorage.ts       # Typed localStorage hook
│   │   ├── useStripePayout.ts       # Stripe Connect onboarding flow
│   │   └── useAnalytics.ts          # Analytics data with date range
│   │
│   ├── stores/
│   │   ├── auth.store.ts            # User, tokens, role state
│   │   └── ui.store.ts              # Sidebar collapse, theme, modals
│   │
│   ├── services/
│   │   ├── api.ts                   # Axios instance with interceptors
│   │   ├── auth.service.ts          # Auth API calls
│   │   ├── users.service.ts         # Users API calls
│   │   ├── creators.service.ts      # Creators API calls
│   │   ├── portfolios.service.ts    # Portfolio API calls
│   │   ├── storefronts.service.ts   # Storefront API calls
│   │   ├── products.service.ts      # Products API calls
│   │   ├── orders.service.ts        # Orders API calls
│   │   ├── subscriptions.service.ts # Subscriptions API calls
│   │   ├── analytics.service.ts     # Analytics API calls
│   │   └── media.service.ts         # Upload URL + confirm API calls
│   │
│   ├── lib/
│   │   ├── utils.ts                 # cn(), formatCurrency(), formatDate(), etc.
│   │   ├── validators.ts            # Zod schemas matching backend DTOs
│   │   ├── constants.ts             # Routes, product types, tier configs
│   │   └── stripe.ts                # loadStripe() singleton
│   │
│   └── types/
│       ├── api.types.ts             # Base API response types (paginated, etc.)
│       ├── user.types.ts            # User + auth types
│       ├── creator.types.ts         # CreatorProfile types
│       ├── portfolio.types.ts       # Portfolio + PortfolioItem types
│       ├── product.types.ts         # Product types + enums
│       ├── order.types.ts           # Order + OrderItem types
│       ├── subscription.types.ts    # Subscription + Plan types
│       └── analytics.types.ts       # Analytics types
│
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── .env.example
└── package.json
```

---

### Creator Web Pages & Routes

#### Auth Pages (No Layout)

| Route | Component | Description |
|---|---|---|
| `/login` | `LoginPage` | Email/password form. Links to register + forgot password. Google OAuth button. |
| `/register` | `RegisterPage` | Creator-focused registration. Role pre-set to CREATOR. |
| `/forgot-password` | `ForgotPasswordPage` | Email input, success state with "check your email" message. |
| `/reset-password` | `ResetPasswordPage` | Token from URL param + new password form. |
| `/verify-email` | `VerifyEmailPage` | Auto-verifies token from URL param on mount. Shows success/error state. |

#### Dashboard (AppShell Layout)

| Route | Component | Description |
|---|---|---|
| `/dashboard` | `DashboardPage` | Overview grid: revenue (30d), followers, orders, products. Recent orders table. Stripe Connect alert if not set up. Publish storefront CTA if draft. |

**Dashboard KPI Cards:**
- Total Revenue (30 days) with % change vs previous period
- Total Followers with trend arrow
- Orders This Month with revenue breakdown
- Published Products count
- Average Rating with star display

#### Portfolio

| Route | Component | Description |
|---|---|---|
| `/portfolio` | `PortfolioListPage` | Grid of portfolio cards (title, cover, item count, published status). "New Portfolio" button. |
| `/portfolio/new` | `PortfolioNewPage` | Form: title, description, cover image upload. Creates portfolio in draft. Redirects to edit. |
| `/portfolio/:id` | `PortfolioEditPage` | Two-panel layout: left = settings (title, cover, publish), right = DnD item list. "Add Item" button opens item form. |

**Portfolio Item Editor:**
- Multi-image upload dropzone (drag files in)
- Image carousel preview
- Title, description, location fields
- Date picker for travel date
- Tag input
- Drag handle for reordering

#### Storefront

| Route | Component | Description |
|---|---|---|
| `/storefront` | `StorefrontPage` | Three tabs: Branding, Settings, Preview. Live preview panel updates as creator makes changes. |

**Branding Tab:** Logo upload, banner upload, theme color picker, storefront name.

**Settings Tab:** Slug editor (with live availability check), description (rich text), custom domain input (PRO/PREMIUM only), SEO meta title/description, publish toggle.

**Preview Tab:** Iframe-like preview showing what the public storefront looks like with current settings.

#### Products

| Route | Component | Description |
|---|---|---|
| `/products` | `ProductsPage` | Table with columns: title, type, price, status, sales, rating. Bulk publish/unpublish. Filter by type/status. |
| `/products/new` | `ProductNewPage` | 4-step wizard: 1) Type + basic info, 2) Pricing + stock, 3) Media upload, 4) Review + publish. |
| `/products/:id` | `ProductEditPage` | Same wizard structure but pre-filled. Shows existing file if digital product. |

**Product Wizard Detail:**

Step 1 — Type & Basic Info:
- Product type selector with icon + description cards
- Title input
- Rich text description editor

Step 2 — Pricing:
- Price input (currency display)
- Stock input (empty = unlimited)
- Digital product toggle
- For consultations: duration and booking link fields

Step 3 — Media:
- Cover image dropzone
- Preview images (up to 5 images, drag to reorder)
- For digital products: file upload dropzone (shows file name, size, progress)

Step 4 — Review & Publish:
- Summary of all entered data
- "Save as Draft" vs "Publish" buttons

#### Orders

| Route | Component | Description |
|---|---|---|
| `/orders` | `OrdersPage` | Table: order #, buyer avatar+name, items (pill list), total, status, date. Filter by status (tabs). Date range filter. Export CSV button (PRO+). |
| `/orders/:id` | `OrderDetailPage` | Order header (status, date, payment method), buyer info, line items with download counts, total breakdown, refund button (if eligible). |

**Refund Flow:**
- Button opens `RefundDialog`
- Shows refund amount (full order)
- Reason text area
- Confirmation → calls `POST /orders/:id/refund`
- Toast on success, order status updates

#### Subscribers

| Route | Component | Description |
|---|---|---|
| `/subscribers` | `SubscribersPage` | Summary: active subscribers count, MRR display. Table: avatar, name, plan name, since date, total paid. Filter by plan type. |

#### Analytics

| Route | Component | Description |
|---|---|---|
| `/analytics` | `AnalyticsPage` | Date range picker (7d/30d/90d/custom). Summary KPI row. Tabbed charts: Revenue, Followers, Views, Conversions. Top products table. |

**Analytics Charts:**
- Revenue: Line chart with daily/weekly/monthly grouping toggle
- Follower Growth: Bar chart (new followers per day)
- Page Views: Area chart (profile views + storefront views stacked)
- Conversion: Simple funnel display (views → product views → orders)

#### Settings

| Route | Component | Description |
|---|---|---|
| `/settings/profile` | `ProfileSettings` | Display name, bio (TipTap rich text), tagline, website URL, social links (icon+input for each), location, specialties (tag input). Avatar upload with crop. |
| `/settings/account` | `AccountSettings` | Email (read-only + "change email" flow), change password form. Danger zone: delete account. |
| `/settings/payouts` | `PayoutsSettings` | Stripe Connect status card. If not connected: onboarding CTA. If connected: balance display, payout history table, "Request Payout" button, "Go to Stripe Dashboard" link. |
| `/settings/billing` | `BillingSettings` | Current creator tier card with feature list. Upgrade/downgrade plan selector. Payment method display. Next renewal date. Cancel subscription option. |
| `/settings/notifications` | `NotificationSettings` | Toggles for: new order emails, new follower emails, new subscriber emails, weekly revenue digest, platform updates. |

---

### Creator Web Key Components

#### `FileDropzone`

```
Props:
  accept: Record<string, string[]>  — mime types
  maxSize: number                    — bytes
  maxFiles: number
  onUpload: (files: UploadedMedia[]) — callback after MinIO upload completes
  existing: UploadedMedia[]          — already uploaded files to display

Behavior:
  1. User drops files onto zone
  2. Component calls POST /media/upload-url for each file
  3. Performs PUT to presigned URL (with upload progress tracking)
  4. Calls POST /media/confirm
  5. Calls onUpload with media records
```

#### `RichTextEditor` (TipTap)

Configured extensions:
- Bold, Italic, Underline, Strike
- BulletList, OrderedList
- Heading (H2, H3 only)
- Link (opens in new tab)
- Blockquote
- HardBreak, HorizontalRule
- CharacterCount (with limit display)

#### `DnD Portfolio Item List` (@dnd-kit)

```
Behavior:
  - Renders items as draggable cards
  - On drag end: optimistic UI reorder
  - After drag: PATCH /:portfolioId/items/reorder with new order array
  - On error: revert to previous order + toast
```

#### `ProductWizard`

Multi-step form managed by React Hook Form with Zod validation per step. Uses a `useProductWizard` hook that wraps form state and step navigation. Progress saved to `sessionStorage` so refreshing doesn't lose work.

---

### Creator Web State Management

#### Zustand Stores

```typescript
// stores/auth.store.ts
interface AuthStore {
  user: UserResponseDto | null;
  creatorProfile: CreatorProfileResponseDto | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (user: UserResponseDto) => void;
}

// stores/ui.store.ts
interface UIStore {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  activeModal: string | null;
  openModal: (id: string) => void;
  closeModal: () => void;
}
```

#### TanStack Query Patterns

```typescript
// Queries — all cached and auto-refetched
useQuery(['creator', 'me'], fetchCreatorProfile)
useQuery(['portfolios', 'mine'], fetchMyPortfolios)
useQuery(['products', 'mine', filters], fetchMyProducts)
useQuery(['orders', 'creator', page, filters], fetchCreatorOrders)
useQuery(['analytics', dateRange], fetchAnalytics)

// Mutations — optimistic updates where appropriate
useMutation(createProduct, {
  onSuccess: () => queryClient.invalidateQueries(['products', 'mine'])
})
useMutation(reorderPortfolioItems, {
  onMutate: (newOrder) => {
    // Optimistic update
    queryClient.setQueryData(['portfolio', id, 'items'], newOrder);
  },
  onError: (_, __, context) => {
    // Rollback
    queryClient.setQueryData(['portfolio', id, 'items'], context.previousItems);
  }
})
```

---

### Creator Web API Layer

```typescript
// services/api.ts — Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
});

// Request interceptor: attach token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: handle 401 refresh
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      await useAuthStore.getState().refresh();
      return api(error.config);
    }
    return Promise.reject(error);
  }
);
```

---

### Creator Web Development Phases

| Phase | Weeks | Deliverables |
|---|---|---|
| 1 | 1-2 | Auth pages, routing setup, Axios + Zustand auth store |
| 2 | 3-4 | Dashboard, AppShell layout, sidebar navigation |
| 3 | 5-6 | Portfolio builder (list, create, DnD editor, upload) |
| 4 | 7-8 | Storefront settings + product wizard |
| 5 | 9-10 | Orders table + detail + refund |
| 6 | 11-12 | Analytics charts, subscribers table |
| 7 | 13-14 | All settings pages, Stripe Connect integration |

---

## Mobile User App (React Native + Expo)

### Mobile Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Framework | Expo SDK | 51.x | Managed workflow, OTA updates |
| Language | TypeScript | 5.x | Type safety |
| Navigation | React Navigation | v6.x | Stack, Bottom Tabs, Modals |
| Server State | TanStack Query | v5.x | Cached API data, infinite scroll |
| Client State | Zustand | v4.x | Auth, cart, preferences |
| Styling | NativeWind | v4.x | Tailwind CSS for React Native |
| Forms | React Hook Form | v7.x | Performant mobile forms |
| Validation | Zod | v3.x | Form and API response validation |
| Payments | @stripe/stripe-react-native | latest | Stripe payment sheet |
| Secure Storage | expo-secure-store | latest | Token storage (encrypted) |
| Async Storage | @react-native-async-storage/async-storage | latest | Non-sensitive preferences |
| Push Notifications | expo-notifications | latest | Push token + event handlers |
| Deep Linking | expo-linking | latest | URL scheme handling |
| Image | expo-image | latest | Fast image loading with caching |
| Video | expo-video | latest | Video playback in portfolio |
| Maps | react-native-maps | latest | Portfolio item location view |
| Image Picker | expo-image-picker | latest | Avatar upload |
| Haptics | expo-haptics | latest | Tactile feedback on actions |
| Linear Gradient | expo-linear-gradient | latest | UI gradients on cards |
| Blur | expo-blur | latest | iOS-style blur effects |
| HTTP Client | Axios | v1.x | API calls with interceptors |
| Icons | @expo/vector-icons | latest | Ionicons, MaterialIcons |
| Flash List | @shopify/flash-list | latest | Performant large lists |
| Bottom Sheet | @gorhom/bottom-sheet | latest | Native-feeling bottom sheets |
| Skeleton | moti | latest | Animated loading skeletons |

---

### Mobile Project Structure

```
mobile/
├── app.json                        # Expo config
├── babel.config.js
├── tsconfig.json
├── package.json
│
└── src/
    ├── index.ts                    # Entry point (registerRootComponent)
    ├── App.tsx                     # Root: providers + NavigationContainer
    │
    ├── navigation/
    │   ├── index.tsx               # Root navigator (AuthStack vs MainTab)
    │   ├── AuthStack.tsx           # Stack for unauthenticated screens
    │   ├── MainTabNavigator.tsx    # Bottom tab navigator
    │   ├── HomeStack.tsx           # Home tab stack
    │   ├── DiscoverStack.tsx       # Discover tab stack
    │   ├── ShopStack.tsx           # Shop tab stack
    │   ├── LibraryStack.tsx        # Library tab stack
    │   ├── ProfileStack.tsx        # Profile tab stack
    │   └── linking.config.ts       # Deep link configuration
    │
    ├── screens/
    │   ├── auth/
    │   │   ├── WelcomeScreen.tsx
    │   │   ├── LoginScreen.tsx
    │   │   ├── RegisterScreen.tsx
    │   │   ├── ForgotPasswordScreen.tsx
    │   │   └── VerifyEmailScreen.tsx
    │   │
    │   ├── home/
    │   │   ├── HomeScreen.tsx
    │   │   ├── SearchScreen.tsx
    │   │   └── ExploreScreen.tsx
    │   │
    │   ├── discover/
    │   │   ├── CreatorListScreen.tsx
    │   │   ├── CreatorProfileScreen.tsx
    │   │   ├── PortfolioListScreen.tsx
    │   │   └── PortfolioDetailScreen.tsx
    │   │
    │   ├── shop/
    │   │   ├── StorefrontScreen.tsx
    │   │   ├── ProductDetailScreen.tsx
    │   │   ├── CartScreen.tsx
    │   │   └── CheckoutScreen.tsx
    │   │
    │   ├── library/
    │   │   ├── OrdersScreen.tsx
    │   │   ├── OrderDetailScreen.tsx
    │   │   ├── SubscriptionsScreen.tsx
    │   │   └── DownloadsScreen.tsx
    │   │
    │   └── profile/
    │       ├── ProfileScreen.tsx
    │       ├── FollowingScreen.tsx
    │       ├── NotificationsScreen.tsx
    │       ├── AddressesScreen.tsx
    │       └── SettingsScreen.tsx
    │
    ├── components/
    │   ├── common/
    │   │   ├── SafeAreaView.tsx     # NativeWind-wrapped SafeAreaView
    │   │   ├── Screen.tsx           # Standard screen wrapper with padding
    │   │   ├── Header.tsx           # Custom screen header
    │   │   ├── Button.tsx           # Styled button (variants: primary, secondary, ghost)
    │   │   ├── TextInput.tsx        # Styled text input with error state
    │   │   ├── Avatar.tsx           # Circular avatar with initials fallback
    │   │   ├── Badge.tsx            # Status/tag badge
    │   │   ├── LoadingOverlay.tsx   # Full-screen loading indicator
    │   │   ├── SkeletonItem.tsx     # Moti-based skeleton loader
    │   │   ├── EmptyState.tsx       # Empty list illustration + message
    │   │   ├── ErrorState.tsx       # Error with retry button
    │   │   ├── StarRating.tsx       # Star rating display/input
    │   │   ├── PriceTag.tsx         # Formatted price display
    │   │   └── VerifiedBadge.tsx    # Creator verified checkmark
    │   │
    │   ├── creator/
    │   │   ├── CreatorCard.tsx          # Card for creator list (avatar, name, followers, specialties)
    │   │   ├── CreatorHero.tsx          # Full-width creator profile header
    │   │   ├── CreatorStats.tsx         # Followers, sales, rating row
    │   │   ├── CreatorSocialLinks.tsx   # Social icons row
    │   │   ├── FollowButton.tsx         # Follow/Following toggle button
    │   │   └── SpecialtyPills.tsx       # Horizontal scroll of specialty tags
    │   │
    │   ├── portfolio/
    │   │   ├── PortfolioGrid.tsx        # 2-column portfolio list grid
    │   │   ├── PortfolioCard.tsx        # Portfolio collection card
    │   │   ├── PortfolioItemGrid.tsx    # Masonry grid of portfolio items
    │   │   ├── PortfolioItemCard.tsx    # Single item with location + date
    │   │   └── MediaCarousel.tsx        # Swipeable multi-image carousel
    │   │
    │   ├── product/
    │   │   ├── ProductCard.tsx          # Grid card: cover, title, price, rating
    │   │   ├── ProductDetailHeader.tsx  # Product hero with buy button
    │   │   ├── ProductImageGallery.tsx  # Swipeable image gallery
    │   │   ├── ProductTypeTag.tsx       # "Itinerary" / "Preset Pack" label
    │   │   ├── ReviewsList.tsx          # Paginated reviews with stars
    │   │   ├── ReviewItem.tsx           # Single review row
    │   │   └── AddToCartButton.tsx      # Animated "Add to Cart" button
    │   │
    │   ├── cart/
    │   │   ├── CartItem.tsx             # Line item with price + remove
    │   │   ├── CartSummary.tsx          # Subtotal + tax + total
    │   │   └── EmptyCart.tsx            # Empty state with discover CTA
    │   │
    │   ├── order/
    │   │   ├── OrderCard.tsx            # Order history list card
    │   │   ├── OrderStatusBar.tsx       # Status timeline/progress bar
    │   │   ├── DownloadButton.tsx       # Download with progress indicator
    │   │   └── OrderItemRow.tsx         # Single product row in order detail
    │   │
    │   ├── subscription/
    │   │   ├── SubscriptionCard.tsx     # Active subscription display
    │   │   ├── PlanBadge.tsx            # BASIC/PRO/PREMIUM badge
    │   │   └── SubscriptionStatus.tsx   # Status chip with renewal date
    │   │
    │   └── notification/
    │       ├── NotificationItem.tsx     # Single notification row with icon
    │       └── NotificationBell.tsx     # Tab bar bell with unread badge
    │
    ├── hooks/
    │   ├── useAuth.ts               # Auth state, login, logout
    │   ├── useCart.ts               # Cart state management
    │   ├── useNotifications.ts      # Notification list + unread count
    │   ├── usePushNotifications.ts  # Push token registration
    │   ├── useDownload.ts           # File download progress
    │   ├── useInfiniteScroll.ts     # Paginated FlashList helper
    │   └── useColorScheme.ts        # Light/dark mode detection
    │
    ├── stores/
    │   ├── auth.store.ts            # User session, tokens
    │   ├── cart.store.ts            # Cart items, creator grouping
    │   └── preferences.store.ts     # Theme, notifications enabled
    │
    ├── services/
    │   ├── api.ts                   # Axios instance with auth interceptors
    │   ├── auth.service.ts
    │   ├── creators.service.ts
    │   ├── portfolios.service.ts
    │   ├── storefronts.service.ts
    │   ├── products.service.ts
    │   ├── orders.service.ts
    │   ├── subscriptions.service.ts
    │   ├── notifications.service.ts
    │   ├── reviews.service.ts
    │   └── search.service.ts
    │
    ├── lib/
    │   ├── utils.ts                 # formatCurrency, formatDate, etc.
    │   ├── validators.ts            # Zod schemas
    │   ├── constants.ts             # Colors, sizes, routes
    │   └── stripe.ts                # StripeProvider setup
    │
    └── types/
        ├── navigation.types.ts      # React Navigation param types
        └── [shared API types same as web]
```

---

### Screens & Navigation

#### Authentication Stack

**WelcomeScreen**
- Full-screen gradient background with TravelHues brand
- 3-slide onboarding carousel (value props for travelers)
- "Explore as Guest" (skips auth, limited features)
- "Sign In" and "Create Account" CTAs

**LoginScreen**
- Email + password inputs
- "Forgot Password?" link
- "Continue with Google" button (expo-auth-session)
- "Continue with Apple" button (iOS only, expo-apple-authentication)
- Link to RegisterScreen

**RegisterScreen**
- First name, last name, email, password, confirm password
- Terms of service checkbox
- "Already have an account?" link
- Minimal fields; profile completion happens post-registration

**ForgotPasswordScreen**
- Email input
- Success state showing email sent message
- Link back to login

**VerifyEmailScreen**
- Displayed after registration
- "Check your email" messaging with email address displayed
- "Resend Email" button (rate limited)
- If accessed via deep link with token: auto-verifies and shows success

---

#### Main Tab Navigator

```
Tab Icons (Ionicons):
  🏠 Home     — home-outline / home
  🔍 Discover — compass-outline / compass
  🛍 Shop     — storefront-outline / storefront (badge for cart count)
  📚 Library  — library-outline / library
  👤 Profile  — person-outline / person
```

---

#### Home Tab (HomeStack)

**HomeScreen**
- Sticky header with greeting + search bar
- Horizontal scroll: "Featured Creators" (large cards with banner)
- Section: "Trending Products" (horizontal product cards)
- Section: "Explore by Destination" (destination tag pills → ExploreScreen filtered)
- Section: "Following" (updates from creators user follows — only if following anyone)
- Pull-to-refresh

**SearchScreen**
- Full-screen search with keyboard auto-open
- Recent searches (from AsyncStorage)
- As user types (debounced 300ms): calls `/search/autocomplete`
- Results: tabbed between "All", "Creators", "Products"
- Filter bottom sheet: type, price range, rating filter
- FlashList for results

**ExploreScreen**
- Destination/style tag cloud
- Creator grid filtered by selected tag
- Infinite scroll with FlashList

---

#### Discover Tab (DiscoverStack)

**CreatorListScreen**
- Filter bar: all specialties as horizontal scroll pills
- Sort: "Trending", "New", "Top Rated", "Most Followers"
- 2-column grid of `CreatorCard` components
- Infinite scroll

**CreatorProfileScreen**
- Hero banner with creator photo
- Name, verified badge, tagline, location
- Follower count, sales count, rating
- Follow button (toggles, updates count optimistically)
- Social links row
- Sticky tab bar: "Portfolio" | "Shop" | "About"
- Portfolio Tab: grid of portfolios → navigates to PortfolioListScreen
- Shop Tab: grid of products → navigates to ProductDetailScreen
- About Tab: full bio, specialties, social links

**PortfolioListScreen**
- Creator name in header
- Grid of PortfolioCard components
- Tap → PortfolioDetailScreen

**PortfolioDetailScreen**
- Portfolio title + description header
- Masonry/waterfall grid of portfolio items (FlashList)
- Tap item: expands to `MediaCarousel` full-screen modal
- Full-screen modal: swipeable images, location + date overlay, share button

---

#### Shop Tab (ShopStack)

**StorefrontScreen**
- Storefront hero (banner + logo + name)
- Creator info strip (avatar, name, rating) → navigates to CreatorProfileScreen
- Product grid with type filter tabs
- Search within storefront
- Product card: cover image, title, type badge, price, rating

**ProductDetailScreen**
- Swipeable image gallery (cover + preview images)
- Product type badge
- Title, price, creator attribution
- Description (rich text rendered as native text)
- "What's included" section (from metadata)
- Rating + review count, "See All Reviews" link
- ReviewsList component (first 3 reviews)
- "Add to Cart" sticky bottom bar
- For services: "Book Now" / "Contact Creator" CTA

**CartScreen**
- Grouped by creator (one section per creator)
- CartItem rows with quantity selector and remove
- CartSummary (subtotal, tax estimate, total)
- "Proceed to Checkout" button (disabled if cart empty)
- "Continue Shopping" link

**CheckoutScreen**
- Order summary (items, total)
- Stripe Payment Sheet (via `@stripe/stripe-react-native`)
- "Place Order" button → creates order → shows Stripe sheet
- On success: navigate to OrderDetailScreen
- On failure: show error toast + retry option

---

#### Library Tab (LibraryStack)

**OrdersScreen**
- Filter tabs: "All", "Completed", "Processing"
- OrderCard: product cover thumbnail, creator name, total, status badge, date
- Pull-to-refresh

**OrderDetailScreen**
- Order header: date, status, order number
- Line items list:
  - Product cover, title, price
  - For digital: `DownloadButton` (tracks progress, shows count used/limit)
- Price breakdown: subtotal, tax, total
- Creator contact link

**SubscriptionsScreen**
- Active subscriptions list
- Each subscription: plan name, tier badge, renewal date, amount/month
- "Manage" → shows cancel or change plan options

**DownloadsScreen**
- Files downloaded to device (cached via FileSystem)
- Open, share, delete from cache options

---

#### Profile Tab (ProfileStack)

**ProfileScreen**
- User avatar (tap to change), name, email
- Stats row: orders, following, subscriptions
- Quick links: Following, My Reviews, Notification Settings
- Sign Out button

**FollowingScreen**
- List of followed creators
- CreatorCard with unfollow button overlay

**NotificationsScreen**
- FlashList of notifications grouped by "Today" / "Earlier"
- Swipe to dismiss
- Tap → deep link navigation based on `data` payload
- "Mark all read" header action

**AddressesScreen**
- List of saved addresses with default badge
- Add/edit/delete addresses
- Set as default action

**SettingsScreen**
- Account: email, change password, linked accounts
- Notifications: push toggles per notification type
- Appearance: theme (light/dark/system)
- Payment Methods: list Stripe payment methods
- Privacy & Security
- Help & Support
- Rate the App (expo-store-review)
- About: version, terms, privacy policy

---

### Mobile Key Components

#### `MediaCarousel`

```
Props:
  mediaUrls: string[]
  initialIndex: number

Behavior:
  - Full-screen swipeable (react-native-reanimated gesture)
  - Page dots indicator
  - Pinch-to-zoom on images
  - Double-tap to zoom
  - Share button via Expo Sharing
  - Close button (dismiss to grid)
  - Video plays inline with mute toggle
```

#### `DownloadButton`

```
Props:
  orderItemId: string
  filename: string
  downloadUrl: string

Behavior:
  1. Tap → check expo-file-system for cached version
  2. If cached: open directly
  3. If not: call GET /orders/{id}/items/{itemId}/download for fresh signed URL
  4. Download with progress bar
  5. Cache to expo-file-system DocumentDirectory
  6. Track downloadCount via API call
  7. Show count used vs limit (if limited)
```

#### `FlashList` Patterns

All large lists use `@shopify/flash-list` for 60fps performance:
```typescript
<FlashList
  data={products}
  renderItem={({ item }) => <ProductCard product={item} />}
  estimatedItemSize={220}
  numColumns={2}
  onEndReached={fetchNextPage}
  onEndReachedThreshold={0.5}
  refreshControl={<RefreshControl onRefresh={refetch} />}
  ListFooterComponent={isFetchingNextPage ? <SkeletonItem /> : null}
/>
```

#### `AddToCartButton`

```
Behavior:
  - Tap: haptic feedback (expo-haptics, ImpactFeedbackStyle.Medium)
  - Adds to cartStore
  - Animates to show "Added" with checkmark
  - Cart tab badge updates
  - If product from different creator than current cart: shows alert
    "Your cart has items from {creator}. Start a new cart?" (one creator per cart)
```

---

### Mobile State Management

#### Zustand Stores

```typescript
// stores/auth.store.ts
interface AuthStore {
  user: UserResponseDto | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  pushToken: string | null;
  login: (creds: LoginDto) => Promise<void>;
  loginWithOAuth: (provider: 'google' | 'apple', idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
  setPushToken: (token: string) => void;
}

// Token storage: expo-secure-store
// Key: 'refresh_token' → stored encrypted on device

// stores/cart.store.ts
interface CartStore {
  items: CartItem[];
  creatorId: string | null;     // Cart is per-creator
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clearCart: () => void;
  total: number;                // Computed
  itemCount: number;            // Computed
}

// stores/preferences.store.ts
interface PreferencesStore {
  colorScheme: 'light' | 'dark' | 'system';
  pushEnabled: boolean;
  notificationTypes: Record<NotificationType, boolean>;
  setColorScheme: (scheme: string) => void;
}
// Persisted to AsyncStorage
```

#### TanStack Query — Infinite Scroll Pattern

```typescript
// Creators infinite list
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['creators', filters],
  queryFn: ({ pageParam = 1 }) =>
    creatorsService.list({ page: pageParam, limit: 20, ...filters }),
  getNextPageParam: (lastPage) =>
    lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
});

// Flatten pages for FlashList
const creators = data?.pages.flatMap((p) => p.data) ?? [];
```

---

### Push Notifications

#### Registration Flow

```typescript
// In App.tsx after authentication
async function registerForPushNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig.extra.eas.projectId,
  });

  // Store locally
  useAuthStore.getState().setPushToken(token.data);

  // Send to backend
  await api.post('/users/me/push-token', { token: token.data });
}
```

#### Notification Handling

```typescript
// Foreground: show in-app banner
Notifications.addNotificationReceivedListener((notification) => {
  // Show toast or in-app notification UI
  useNotificationStore.getState().incrementUnread();
});

// Background tap: deep link navigation
Notifications.addNotificationResponseReceivedListener((response) => {
  const { data } = response.notification.request.content;
  if (data.actionUrl) {
    Linking.openURL(data.actionUrl);
  }
});
```

#### Notification Channel (Android)

```typescript
// Set up Android notification channel in app.json
{
  "android": {
    "notifications": {
      "icon": "./assets/notification-icon.png",
      "color": "#E87C2A"
    }
  }
}
```

---

### Deep Linking

```typescript
// src/navigation/linking.config.ts
export const linkingConfig: LinkingOptions<RootParamList> = {
  prefixes: ['travelhues://', 'https://app.travelhues.com'],
  config: {
    screens: {
      Auth: {
        screens: {
          VerifyEmail: 'verify-email',
          ResetPassword: 'reset-password',
        },
      },
      Main: {
        screens: {
          Discover: {
            screens: {
              CreatorProfile: 'creator/:id',
              PortfolioDetail: 'portfolio/:id',
            },
          },
          Shop: {
            screens: {
              Storefront: 'shop/:slug',
              ProductDetail: 'product/:id',
              OrderDetail: 'order/:id',
            },
          },
        },
      },
    },
  },
};
```

---

### Offline Support

**Cached data (via TanStack Query + AsyncStorage persistence):**
- Creator profiles viewed (last 50)
- Storefront/product data (last 30 products viewed)
- Notification list

**Cached files (via expo-file-system):**
- Downloaded digital products stored in `FileSystem.documentDirectory/downloads/`
- Accessible offline via `DownloadsScreen`

**Network detection:**
```typescript
// Show offline banner using @react-native-community/netinfo
// Disable checkout, follow, cart actions when offline
// Queue write actions (follow, review) for retry when online
```

---

### Mobile Development Phases

| Phase | Weeks | Deliverables |
|---|---|---|
| 1 | 1-2 | Project setup, navigation, auth screens, Zustand auth store |
| 2 | 3-4 | HomeScreen, CreatorListScreen, CreatorProfileScreen (read-only) |
| 3 | 5-6 | Portfolio screens, media carousel, storefront + product listing |
| 4 | 7-8 | Product detail, cart store, checkout with Stripe |
| 5 | 9-10 | Orders screen, download functionality, subscriptions screen |
| 6 | 11-12 | Notifications, follow functionality, search screen |
| 7 | 13-14 | Profile/settings screens, push notifications, deep linking, polish |

---

## Shared Conventions

### API Response Envelope

Both web and mobile expect this consistent shape from the backend:

```typescript
// Success (single resource)
{ data: T, meta?: Record<string, unknown> }

// Success (paginated list)
{
  data: T[],
  meta: {
    page: number,
    limit: number,
    total: number,
    totalPages: number,
    hasNextPage: boolean,
    hasPreviousPage: boolean,
  }
}

// Error
{
  statusCode: number,
  error: string,
  message: string,
  code: string,
}
```

### Currency Formatting

All prices stored as `decimal(10,2)` (e.g. `29.99`) in the database. Both clients display using:
```typescript
const formatCurrency = (amount: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
```

### Date Formatting

All timestamps returned as ISO 8601 strings from the API. Display using `date-fns`:
```typescript
// Relative: "2 hours ago"
formatDistanceToNow(new Date(createdAt), { addSuffix: true })

// Absolute: "May 21, 2026"
format(new Date(createdAt), 'MMMM d, yyyy')
```

### Optimistic Updates Pattern

Both apps use TanStack Query optimistic updates for high-frequency actions:
- Follow/unfollow creator (updates follower count immediately)
- Cart add/remove (instant UI response)
- Mark notification read (removes unread indicator instantly)
- Portfolio item reorder (reflects new order before API confirms)

### Image Loading Strategy

**Web (Creator App):**
```html
<!-- Use native <img> with loading="lazy" for portfolio grids -->
<!-- Use React's Suspense with blur placeholder for hero images -->
```

**Mobile:**
```typescript
// expo-image with blurhash placeholder
<Image
  source={{ uri: imageUrl }}
  placeholder={blurhash}
  contentFit="cover"
  transition={200}
/>
```

### Error Handling UI Patterns

| Error Type | Web Behavior | Mobile Behavior |
|---|---|---|
| Network error | Toast + retry button | Snackbar with retry |
| 401 Unauthorized | Auto refresh → redirect to login | Auto refresh → navigate to login |
| 404 Not Found | Inline "Not found" component | Navigate back + toast |
| 422 Validation | Field-level error messages | Field-level error messages |
| 500 Server Error | Toast "Something went wrong" | Alert dialog with retry |
| Payment failed | Error message in checkout form | Alert with support link |
