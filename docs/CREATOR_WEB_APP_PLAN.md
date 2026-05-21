# TravelHues Creator Web App Plan
# React + Vite — Creator Dashboard for India-Focused Travel Platform

---

## Overview

The Creator Web App is the desktop-first dashboard for travel creators to manage their entire TravelHues presence. Creators publish stories, build itineraries, list services, manage bookings, message users, track analytics, and manage payouts — all from a single interface. All revenue figures in INR.

---

## Tech Stack

| Category | Library / Tool | Version | Purpose |
|---|---|---|---|
| Framework | React | 18.x | UI framework |
| Build Tool | Vite | 5.x | Dev server + bundler |
| Language | TypeScript | 5.x | Type safety |
| Routing | TanStack Router | v1 | File-based, type-safe routing |
| Server State | TanStack Query | v5 | Data fetching, mutations, cache |
| Client State | Zustand | v4 | Auth, UI state |
| Styling | Tailwind CSS | v3 | Utility-first CSS |
| Component Library | shadcn/ui | latest | Accessible headless components |
| Rich Text | TipTap | v2 | Story/description editor |
| File Upload | react-dropzone | latest | Multi-file drag-and-drop upload |
| Charts | recharts | v2 | Analytics visualizations |
| Forms | react-hook-form + zod | latest | Form state + validation |
| Drag & Drop | @hello-pangea/dnd | latest | Itinerary day builder ordering |
| Payments | Stripe.js + @stripe/react-stripe-js | latest | Subscription + payout management |
| Realtime | Socket.io-client | v4 | Live notifications, message badge |
| Date Picker | react-day-picker | latest | Availability calendar management |
| HTTP | Axios | latest | API client with interceptors |
| Icons | lucide-react | latest | Consistent icon set |
| Notifications | sonner | latest | Toast notifications |
| Maps | @vis.gl/react-google-maps | latest | Location picker for services |

---

## Pages & Routes

All routes under `/` are protected (redirect to `/auth/login` if unauthenticated).

### Auth Routes (public)

| Route | Component | Description |
|---|---|---|
| `/auth/login` | LoginPage | Email/password + Google SSO |
| `/auth/register` | RegisterPage | Creator signup |
| `/auth/forgot-password` | ForgotPasswordPage | Request reset email |
| `/auth/reset-password` | ResetPasswordPage | Token-based password reset |
| `/auth/verify-email` | VerifyEmailPage | Email verification landing |

### Onboarding (new creators only)

| Route | Component | Description |
|---|---|---|
| `/onboarding` | OnboardingLayout | Wizard wrapper |
| `/onboarding/step-1` | OnboardingProfile | Display name, bio, tagline, location |
| `/onboarding/step-2` | OnboardingSpecialties | Travel specialties, style tags |
| `/onboarding/step-3` | OnboardingStorefront | Storefront name, slug, theme color |
| `/onboarding/step-4` | OnboardingStripe | Stripe Connect Express onboarding |

### Dashboard

| Route | Component | Description |
|---|---|---|
| `/dashboard` | DashboardPage | Overview stats, quick actions, recent activity |

### Content Management

| Route | Component | Description |
|---|---|---|
| `/content` | ContentPage | Grid/list of all content (stories, photos) |
| `/content/new` | ContentUploadPage | New story/reel upload |
| `/content/:id/edit` | ContentEditPage | Edit story title, description, tags |

### Destinations

| Route | Component | Description |
|---|---|---|
| `/destinations` | DestinationsPage | Content organized by destination |
| `/destinations/:slug` | DestinationDetailPage | All content + products for a destination |

### Products

| Route | Component | Description |
|---|---|---|
| `/products` | ProductsPage | All products list with status/sales |
| `/products/new` | ProductTypeSelectorPage | Select product type to create |
| `/products/activity/new` | ActivityProductForm | Create guided activity |
| `/products/activity/:id/edit` | ActivityProductForm | Edit activity |
| `/products/stay/new` | StayProductForm | Create accommodation listing |
| `/products/stay/:id/edit` | StayProductForm | Edit stay |
| `/products/itinerary/new` | ItineraryBuilderPage | Visual day-by-day builder |
| `/products/itinerary/:id/edit` | ItineraryBuilderPage | Edit itinerary |
| `/products/package/new` | PackageProductForm | Create multi-product bundle |
| `/products/package/:id/edit` | PackageProductForm | Edit package |
| `/products/visa/new` | VisaGuideForm | Create visa assistance guide |
| `/products/visa/:id/edit` | VisaGuideForm | Edit visa guide |

### Services

| Route | Component | Description |
|---|---|---|
| `/tips` | TipsPage | All travel tips management |
| `/tips/new` | TipForm | Create new travel tip |
| `/tips/:id/edit` | TipForm | Edit travel tip |

### Storefront

| Route | Component | Description |
|---|---|---|
| `/storefront` | StorefrontSettingsPage | Branding, theme, published status |
| `/storefront/preview` | StorefrontPreviewPage | Live preview of public storefront |

### Orders & Bookings

| Route | Component | Description |
|---|---|---|
| `/orders` | OrdersPage | All product orders, filter by status |
| `/orders/:id` | OrderDetailPage | Individual order details, download links |
| `/bookings` | BookingsPage | Service bookings with calendar view |
| `/bookings/:id` | BookingDetailPage | Individual booking, confirm/cancel |

### Audience

| Route | Component | Description |
|---|---|---|
| `/subscribers` | SubscribersPage | Platform tier subscribers + creator-tier users |
| `/following` | FollowingPage | Users who follow this creator |

### Messages

| Route | Component | Description |
|---|---|---|
| `/messages` | MessagesPage | Inbox layout, conversation list + chat panel |
| `/messages/:conversationId` | MessagesPage | Inbox with specific conversation open |

### Analytics & Finance

| Route | Component | Description |
|---|---|---|
| `/analytics` | AnalyticsPage | Views, revenue, followers charts |
| `/analytics/content` | ContentAnalyticsPage | Per-content performance |
| `/analytics/products` | ProductAnalyticsPage | Per-product sales breakdown |
| `/payouts` | PayoutsPage | Earnings summary, payout history |
| `/payouts/bank-details` | BankDetailsPage | Stripe Connect bank account setup |

### Settings

| Route | Component | Description |
|---|---|---|
| `/settings` | SettingsLayout | Settings wrapper with sidebar nav |
| `/settings/profile` | ProfileSettingsPage | Name, bio, avatar, social links |
| `/settings/account` | AccountSettingsPage | Email, password, connected accounts |
| `/settings/notifications` | NotificationSettingsPage | Email + push preferences |
| `/settings/subscription` | SubscriptionSettingsPage | Current plan, upgrade, billing |
| `/settings/api` | ApiSettingsPage | API keys for integrations (PRO+) |

---

## Page Designs (Detailed)

### /dashboard — DashboardPage

**Layout:** Full-width with sidebar nav (collapsed on medium screens)

**Stats Row (top):**
- Total Revenue (INR) — this month vs. last month delta
- Active Bookings — upcoming confirmed bookings
- New Orders — last 7 days
- Followers — total with weekly growth

**Charts Row:**
- Revenue sparkline (last 30 days, recharts AreaChart)
- Bookings sparkline (last 30 days)

**Quick Actions Panel:**
- "Upload Content" → /content/new
- "Create Product" → /products/new
- "Manage Bookings" → /bookings
- "View Messages" → /messages

**Recent Activity Feed:**
- New order: "{User} purchased {Product} — ₹X"
- New booking: "{User} booked {Service} for {Date}"
- New follower: "{User} started following you"
- New review: "{User} left a ⭐⭐⭐⭐⭐ review on {Product}"

**Tier Upgrade Prompt (if BASIC):**
- "Unlock unlimited products" CTA card → /settings/subscription

---

### /products/itinerary/new — ItineraryBuilderPage

The most complex page. A visual day-by-day drag-and-drop itinerary builder.

**Left Panel — Day List:**
- "Add Day" button at top
- Each day: collapsible card showing day number, date offset, activity count
- @hello-pangea/dnd enables drag-to-reorder days

**Center Panel — Day Editor (when day selected):**
- Day title input ("Day 1: Arrival in Jaipur")
- Day description textarea
- Activity list (draggable)
- Each activity item:
  - Time input (HH:MM)
  - Activity name input
  - Type selector (ACCOMMODATION, MEAL, TRANSPORT, SIGHTSEEING, ACTIVITY, REST)
  - Duration selector
  - Cost input (₹)
  - Notes (optional)
  - Location picker (Google Maps autocomplete)
  - Delete button
- "Add Activity" button at bottom

**Right Panel — Metadata:**
- Cover image upload (react-dropzone)
- Title input
- Description (TipTap rich text editor)
- Destination tags
- Duration (auto-calculated from days)
- Budget range (₹ min / max, auto-calculated from activities)
- Difficulty selector
- Best time to visit
- Tags input
- Is Published toggle

**Top Bar:**
- Save Draft button
- Preview button (opens mobile preview modal)
- Publish button

---

### /bookings — BookingsPage

**Layout:**
- Left: upcoming bookings list (PENDING, CONFIRMED)
- Right: availability calendar (monthly view)

**Calendar (react-day-picker):**
- Green dates: have confirmed bookings
- Yellow dates: have pending bookings
- Orange badge: number of bookings that day
- Click date → filter list to that date

**Booking List:**
- Booking card: user avatar, service name, date/time, group size, amount (₹), status badge
- Actions: Confirm (if PENDING) | Cancel | View Details
- Sort: by date | by status | by amount

**Booking Detail Modal:**
- Full booking info
- User contact details
- Special requirements
- Payment breakdown
- Cancellation policy reminder
- Action buttons: Confirm / Cancel with reason

---

### /analytics — AnalyticsPage

**Date Range Selector:** Last 7d | 14d | 30d | 90d | Custom

**Top KPI Cards:**
- Total Revenue (₹)
- Total Orders
- Profile Views
- Conversion Rate (views → orders)

**Charts (recharts):**
1. Revenue Over Time — AreaChart, daily/weekly/monthly toggle
2. Orders Over Time — BarChart
3. Followers Growth — LineChart
4. Traffic Sources — PieChart (direct, search, share)

**Product Performance Table:**
| Product | Views | Sales | Revenue (₹) | Conversion |
| Goa 5-Day Guide | 1,200 | 85 | ₹8,500 | 7.1% |

**Top Destinations** — horizontal bar chart by content views

---

### /messages — MessagesPage

**Two-panel layout (desktop), single panel with back nav (mobile):**

**Left Panel — Conversation List:**
- Search conversations input
- Filter: All | Unread | Starred
- Conversation items: user avatar, name, last message preview, time, unread badge
- Socket.io updates list in real time

**Right Panel — Chat:**
- Header: user avatar, name, "Book this creator" shortcut
- Message history (virtualized list)
- Typing indicator
- Input bar: text area + image attach + send
- Real-time via Socket.io /messages namespace

**Empty state:** "Select a conversation to start messaging"

---

## Key Components

### ItineraryDayBuilder
```
Props: {
  days: ItineraryDay[],
  onDaysChange: (days: ItineraryDay[]) => void
}
Features:
  - @hello-pangea/dnd DragDropContext wrapping day list
  - Droppable day containers
  - Draggable activity items within each day
  - Add/remove days and activities
  - Cost auto-calculation per day and total
  - Emits changes in real-time for live preview
```

### MediaUploader
```
Props: {
  accept: Record<string, string[]>,
  maxFiles: number,
  maxSizeBytes: number,
  onUpload: (files: UploadedFile[]) => void,
  existingFiles?: UploadedFile[]
}
Features:
  - react-dropzone drag-and-drop zone
  - File type validation client-side
  - Presigned URL fetch from /api/v1/media/presigned
  - Direct browser → MinIO upload (no server relay)
  - Upload progress bars per file
  - Remove/reorder uploaded files
  - Image preview thumbnails
  - Video thumbnail generation
```

### RichTextEditor (TipTap)
```
Props: {
  content: string,          // HTML string
  onChange: (html: string) => void,
  placeholder?: string,
  readOnly?: boolean
}
Extensions:
  - Bold, Italic, Underline, Strikethrough
  - Headings (H2, H3)
  - Ordered + Bullet lists
  - Blockquote
  - Link (with URL input popup)
  - Image (from uploaded URLs)
  - Table
  - Character counter
```

### AvailabilityCalendar
```
Props: {
  serviceId: string,
  onSave: (slots: AvailabilitySlot[]) => void
}
Features:
  - react-day-picker monthly calendar
  - Click date to toggle available/blocked
  - Click available date to add time slots
  - Time slot form: start time, end time, max slots
  - Blocked dates (holidays, personal time)
  - Bulk actions: "Block this month", "Open weekdays only"
  - Save changes to POST /api/v1/services/:id/availability
```

### AnalyticsChart
```
Variants:
  - <RevenueChart data={DailyData[]} groupBy="DAY|WEEK|MONTH" />
  - <OrdersChart data={DailyData[]} />
  - <FollowersChart data={DailyData[]} />
  - <ConversionFunnelChart views={n} orders={n} />
All use recharts, responsive containers, custom tooltips showing INR amounts
```

### StorefrontPreview
```
Props: {
  storefront: StorefrontConfig,
  products: Product[]
}
Features:
  - Iframe-like preview of mobile app storefront
  - Reflects live changes to theme color, banner, logo
  - Toggle between mobile (390px) and tablet (768px) widths
  - Links disabled (preview mode indicator)
```

### CreatorOnboardingWizard
```
Steps: [Profile, Specialties, Storefront, Stripe]
Features:
  - Progress bar at top
  - Step validation before advancing
  - Save draft on each step (resume if user leaves)
  - Stripe Connect: redirect to Stripe hosted onboarding, handle return
  - Completion: sets creatorProfile.onboardingCompleted = true
```

### ProductTypeSelector
```
Features:
  - Grid of product type cards
  - Each card: icon, type name, description, "Best for..." examples
  - Types: Activity | Stay | Itinerary | Package | Visa Guide | Travel Tip
  - Hover tooltip with examples
  - Selecting navigates to correct creation form
```

### EarningsWidget
```
Props: { period: '7d' | '30d' | '90d' }
Features:
  - Total earnings (INR) in period
  - Comparison to previous period (↑ 23% vs last period)
  - Pending payout amount
  - Next payout date
  - Quick link to /payouts
```

---

## Creator Tiers & Features

### BASIC (Free)
- 5 products maximum (any type)
- 3 content posts per month
- Basic analytics (last 7 days, views only)
- Standard storefront (default theme)
- 1 service listing
- Messages: receive only (cannot initiate)
- Platform commission: 15%
- No custom domain
- No Stripe Connect (manual payout request)

### PRO (₹999/month or ₹9,999/year)
- Unlimited products
- 50 content posts per month
- Advanced analytics (90-day history, revenue, conversions)
- Custom storefront (theme color, custom banner)
- Unlimited services
- Full messaging (send + receive)
- Stripe Connect Express (automated INR payouts)
- Platform commission: 10%
- Creator badge on profile
- Priority in search results

### PREMIUM (₹2,499/month or ₹24,999/year)
- Everything in PRO
- Unlimited content posts
- Full analytics history (all-time)
- Custom domain for storefront
- Featured placement on HomeScreen (1 slot/week)
- Priority customer support (4hr response SLA)
- Platform commission: 7%
- Verified badge
- API access for integrations
- Bulk product import/export
- Co-marketing opportunities

### Tier Limits Enforced By:
- Backend middleware checks `creatorProfile.creatorTier` on creation endpoints
- Frontend shows upgrade prompt when limit reached
- Soft limit: creates draft but prevents publishing until upgraded

---

## Folder Structure

```
creator-web/
├── index.html
├── vite.config.ts                    # Path aliases, env var typing
├── tailwind.config.js                # Custom colors, fonts
├── tsconfig.json
├── tsconfig.node.json
├── package.json
├── .env.example                      # VITE_API_URL, VITE_STRIPE_KEY, VITE_GOOGLE_MAPS_KEY
└── src/
    ├── main.tsx                      # App entry, TanStack Router provider
    ├── App.tsx                       # Router outlet + global providers
    ├── api/
    │   ├── client.ts                 # Axios instance, interceptors
    │   ├── auth.api.ts
    │   ├── creator.api.ts
    │   ├── content.api.ts
    │   ├── products.api.ts
    │   ├── services.api.ts
    │   ├── bookings.api.ts
    │   ├── orders.api.ts
    │   ├── messages.api.ts
    │   ├── analytics.api.ts
    │   ├── payouts.api.ts
    │   ├── media.api.ts
    │   └── subscriptions.api.ts
    ├── components/
    │   ├── ui/                       # shadcn/ui components
    │   │   ├── button.tsx
    │   │   ├── card.tsx
    │   │   ├── dialog.tsx
    │   │   ├── input.tsx
    │   │   ├── select.tsx
    │   │   ├── tabs.tsx
    │   │   ├── badge.tsx
    │   │   ├── table.tsx
    │   │   ├── calendar.tsx
    │   │   ├── sheet.tsx
    │   │   ├── toast.tsx
    │   │   └── ...
    │   ├── layout/
    │   │   ├── AppLayout.tsx         # Sidebar + topbar wrapper
    │   │   ├── Sidebar.tsx           # Main navigation
    │   │   ├── TopBar.tsx            # Breadcrumb, notifications, avatar
    │   │   ├── AuthLayout.tsx        # Centered auth pages
    │   │   └── OnboardingLayout.tsx  # Step wizard wrapper
    │   ├── dashboard/
    │   │   ├── StatsCard.tsx
    │   │   ├── RecentActivityFeed.tsx
    │   │   ├── QuickActions.tsx
    │   │   └── EarningsWidget.tsx
    │   ├── content/
    │   │   ├── MediaUploader.tsx
    │   │   ├── RichTextEditor.tsx
    │   │   ├── ContentGrid.tsx
    │   │   └── ContentCard.tsx
    │   ├── products/
    │   │   ├── ProductTypeSelector.tsx
    │   │   ├── ItineraryDayBuilder.tsx
    │   │   ├── DayCard.tsx
    │   │   ├── ActivityItem.tsx
    │   │   ├── ProductCard.tsx
    │   │   └── StorefrontPreview.tsx
    │   ├── analytics/
    │   │   ├── AnalyticsChart.tsx
    │   │   ├── RevenueChart.tsx
    │   │   ├── OrdersChart.tsx
    │   │   ├── FollowersChart.tsx
    │   │   └── KpiCard.tsx
    │   ├── booking/
    │   │   ├── AvailabilityCalendar.tsx
    │   │   ├── BookingCard.tsx
    │   │   ├── BookingDetailModal.tsx
    │   │   └── TimeSlotForm.tsx
    │   └── common/
    │       ├── CreatorOnboardingWizard.tsx
    │       ├── TierUpgradeBanner.tsx
    │       ├── PriceInput.tsx         # INR-formatted number input
    │       ├── StatusBadge.tsx
    │       ├── EmptyState.tsx
    │       ├── ConfirmDialog.tsx
    │       └── LoadingSpinner.tsx
    ├── pages/
    │   ├── auth/
    │   │   ├── LoginPage.tsx
    │   │   ├── RegisterPage.tsx
    │   │   ├── ForgotPasswordPage.tsx
    │   │   └── ResetPasswordPage.tsx
    │   ├── onboarding/
    │   │   ├── OnboardingProfile.tsx
    │   │   ├── OnboardingSpecialties.tsx
    │   │   ├── OnboardingStorefront.tsx
    │   │   └── OnboardingStripe.tsx
    │   ├── DashboardPage.tsx
    │   ├── content/
    │   │   ├── ContentPage.tsx
    │   │   ├── ContentUploadPage.tsx
    │   │   └── ContentEditPage.tsx
    │   ├── products/
    │   │   ├── ProductsPage.tsx
    │   │   ├── ProductTypeSelectorPage.tsx
    │   │   ├── ActivityProductForm.tsx
    │   │   ├── StayProductForm.tsx
    │   │   ├── ItineraryBuilderPage.tsx
    │   │   ├── PackageProductForm.tsx
    │   │   └── VisaGuideForm.tsx
    │   ├── TipsPage.tsx
    │   ├── TipForm.tsx
    │   ├── StorefrontSettingsPage.tsx
    │   ├── StorefrontPreviewPage.tsx
    │   ├── orders/
    │   │   ├── OrdersPage.tsx
    │   │   └── OrderDetailPage.tsx
    │   ├── bookings/
    │   │   ├── BookingsPage.tsx
    │   │   └── BookingDetailPage.tsx
    │   ├── SubscribersPage.tsx
    │   ├── MessagesPage.tsx
    │   ├── analytics/
    │   │   ├── AnalyticsPage.tsx
    │   │   ├── ContentAnalyticsPage.tsx
    │   │   └── ProductAnalyticsPage.tsx
    │   ├── payouts/
    │   │   ├── PayoutsPage.tsx
    │   │   └── BankDetailsPage.tsx
    │   └── settings/
    │       ├── ProfileSettingsPage.tsx
    │       ├── AccountSettingsPage.tsx
    │       ├── NotificationSettingsPage.tsx
    │       └── SubscriptionSettingsPage.tsx
    ├── store/
    │   ├── authStore.ts              # Creator auth state
    │   ├── uiStore.ts                # Sidebar open, active tour, etc.
    │   └── socketStore.ts            # Socket.io connection + event queue
    ├── hooks/
    │   ├── useAuth.ts
    │   ├── useSocket.ts
    │   ├── useMediaUpload.ts         # Presigned URL + progress tracking
    │   ├── useCreatorTier.ts         # Tier check helpers
    │   ├── usePagination.ts
    │   └── useToast.ts               # Sonner wrapper
    ├── lib/
    │   ├── utils.ts                  # cn(), formatINR(), formatDate()
    │   ├── axios.ts                  # Re-export configured client
    │   ├── queryClient.ts            # TanStack QueryClient config
    │   ├── router.ts                 # TanStack Router route tree
    │   └── schemas/                  # Zod validation schemas
    │       ├── auth.schema.ts
    │       ├── product.schema.ts
    │       ├── service.schema.ts
    │       ├── booking.schema.ts
    │       └── storefront.schema.ts
    └── types/
        ├── api.types.ts              # Backend DTO mirrors
        ├── forms.types.ts            # Form state types
        └── ui.types.ts               # Component prop types
```

---

## State Management

### authStore (Zustand)
```typescript
interface CreatorAuthState {
  creator: CreatorProfileResponseDto | null;
  user: UserResponseDto | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshTokens: () => Promise<void>;
  updateCreatorProfile: (updates: Partial<CreatorProfileResponseDto>) => void;
}
```

### uiStore (Zustand)
```typescript
interface UiState {
  sidebarCollapsed: boolean;
  activeModal: string | null;
  toggleSidebar: () => void;
  openModal: (id: string) => void;
  closeModal: () => void;
}
```

### socketStore (Zustand)
```typescript
interface SocketState {
  socket: Socket | null;
  unreadMessageCount: number;
  unreadNotificationCount: number;
  connect: (token: string) => void;
  disconnect: () => void;
  incrementUnreadMessages: () => void;
  resetUnreadMessages: () => void;
}
```

---

## API Integration

Same base `client.ts` pattern as mobile:
- Axios instance with `baseURL: import.meta.env.VITE_API_URL`
- Request interceptor: attaches Bearer token
- Response interceptor: handles 401 refresh flow

**TanStack Query patterns:**
```typescript
// Standard query
const { data, isLoading } = useQuery({
  queryKey: ['bookings', { status: 'PENDING' }],
  queryFn: () => bookingsApi.list({ status: 'PENDING' }),
  staleTime: 60_000,
})

// Mutation with optimistic update
const { mutate } = useMutation({
  mutationFn: (id: string) => bookingsApi.confirm(id),
  onMutate: async (id) => { /* optimistic update */ },
  onError: (_, __, context) => { /* rollback */ },
  onSuccess: () => { queryClient.invalidateQueries(['bookings']) }
})
```

---

## Real-time Features

### Socket.io Connection
- Connect on app mount (when authenticated)
- Creator joins room: `creator:{creatorId}`
- Disconnect on logout

### Events the creator receives
```typescript
// Messages namespace
socket.on('message:received', (msg) => {
  socketStore.incrementUnreadMessages();
  toast.info(`New message from ${msg.senderName}`);
})

// Notifications namespace
socket.on('notification:new', (notif) => {
  socketStore.incrementUnreadNotifications();
  // Show toast for important ones
  if (['NEW_ORDER', 'NEW_BOOKING', 'NEW_SUBSCRIBER'].includes(notif.type)) {
    toast.success(notif.title);
  }
})
```

---

## INR Formatting

All monetary values rendered via shared utility:
```typescript
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
  // Output: ₹1,00,000
}
```

---

## Development Phases

### Phase 1 — Auth + Onboarding + Dashboard (1.5 weeks)
- [ ] Vite + React 18 + TypeScript + Tailwind + shadcn/ui setup
- [ ] TanStack Router file-based routing
- [ ] Login, Register, Forgot/Reset Password pages
- [ ] CreatorOnboardingWizard (4 steps)
- [ ] DashboardPage (static, then wired to API)
- [ ] AppLayout (sidebar + topbar)

### Phase 2 — Content + Products (2 weeks)
- [ ] ContentPage, ContentUploadPage (MediaUploader)
- [ ] RichTextEditor (TipTap)
- [ ] ProductsPage, ProductTypeSelector
- [ ] ActivityProductForm
- [ ] ItineraryBuilderPage (DayBuilder, @hello-pangea/dnd)
- [ ] StayProductForm, PackageProductForm, VisaGuideForm

### Phase 3 — Services + Bookings (1.5 weeks)
- [ ] Service creation form
- [ ] AvailabilityCalendar component
- [ ] BookingsPage (calendar + list view)
- [ ] BookingDetailModal (confirm/cancel)
- [ ] OrdersPage + OrderDetailPage

### Phase 4 — Storefront + Analytics (1 week)
- [ ] StorefrontSettingsPage
- [ ] StorefrontPreviewPage
- [ ] AnalyticsPage (all charts)
- [ ] ContentAnalyticsPage, ProductAnalyticsPage

### Phase 5 — Messaging + Notifications (0.5 weeks)
- [ ] MessagesPage (two-panel layout)
- [ ] Socket.io client integration
- [ ] Notification badge updates

### Phase 6 — Payouts + Settings + Polish (1 week)
- [ ] PayoutsPage (Stripe Connect)
- [ ] BankDetailsPage (Stripe Express dashboard link)
- [ ] SettingsPages (all tabs)
- [ ] SubscriptionSettingsPage (plan upgrade via Stripe)
- [ ] Tier enforcement UI (upgrade prompts)
- [ ] Responsive design pass (tablet support)
