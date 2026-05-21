# TravelHues Mobile App Plan
# React Native (Expo) — India-Focused Travel Content & Commerce Platform

---

## Overview

TravelHues mobile is the primary consumer-facing application — the Instagram + Airbnb + Pinterest hybrid for authentic Indian travel. Users discover stories, save inspiration, book creator services, plan trips, and message creators directly. All pricing in INR.

---

## Tech Stack

| Category | Library / Tool | Version | Purpose |
|---|---|---|---|
| Framework | Expo (managed workflow) | SDK 51+ | Cross-platform iOS/Android |
| Language | TypeScript | 5.x | Type safety throughout |
| Navigation | React Navigation | v6 | Bottom tabs + native stack |
| Server State | TanStack Query | v5 | Data fetching, caching, sync |
| Client State | Zustand | v4 | Auth, cart, offline, settings |
| Styling | NativeWind | v4 | Tailwind CSS for React Native |
| Maps | react-native-maps | latest | Interactive map with content pins |
| Location | Expo Location | SDK 51 | GPS-based recommendations |
| Camera | Expo Camera | SDK 51 | Profile photo capture |
| Video | Expo AV | SDK 51 | Reel/video playback |
| Offline | Expo FileSystem + NetInfo | SDK 51 | Cache content, detect connectivity |
| Payments | Stripe React Native | latest | INR payments, UPI |
| Storage | @react-native-async-storage/async-storage | latest | Local persistence |
| Image Picker | react-native-image-picker | latest | Media selection from gallery |
| Animations | react-native-reanimated + react-native-gesture-handler | v3 | Smooth gesture-driven UI |
| Messaging | Socket.io-client | v4 | Real-time chat |
| Push | Expo Notifications | SDK 51 | Push notification delivery |
| Forms | react-hook-form + zod | latest | Validated form inputs |
| Icons | @expo/vector-icons | SDK 51 | Ionicons, MaterialIcons, etc. |
| Date | date-fns | v3 | Date formatting, calendar logic |
| HTTP | Axios | latest | API client with interceptors |

---

## Screen Map (Complete Hierarchy)

### Auth Stack
Shown when no valid auth token exists. Navigates to Main Tabs on success.

#### SplashScreen
- Full-screen brand logo on gradient background (#E87C2A to #FF6B35)
- Auto-navigate to WelcomeScreen after 2 seconds
- Checks stored auth token — if valid, navigate directly to HomeScreen
- No user interaction required

#### WelcomeScreen
- Hero image: collage of Indian destinations (Rajasthan, Kerala, Ladakh, Goa)
- App tagline: "Discover. Plan. Experience India."
- "Get Started" button → SignUpScreen
- "Already have an account? Sign In" link → SignInScreen
- Skip for now (anonymous browsing mode, limited features)

#### SignUpScreen
- Email input + password input (min 8 chars, 1 uppercase, 1 number)
- First name + last name inputs
- Role selector: "I'm a Traveller" / "I'm a Creator"
- "Sign Up with Google" button (Google SSO via Expo AuthSession)
- Terms & Privacy Policy checkbox
- Submit → API call → auto-login + ProfileSetupScreen
- Already have account link → SignInScreen

#### SignInScreen
- Email + password inputs
- "Sign In with Google" button
- "Forgot Password?" link → ForgotPasswordScreen
- Submit → API call → navigate to HomeScreen
- "Create an account" link → SignUpScreen

#### ForgotPasswordScreen
- Email input
- "Send Reset Link" button → POST /api/v1/auth/forgot-password
- Success state: "Check your email" message with resend option
- Back to Sign In link

#### ResetPasswordScreen
- Reached via deep link from email (travelhues://reset-password?token=xxx)
- New password + confirm password inputs
- Submit → POST /api/v1/auth/reset-password
- On success → SignInScreen with success toast

#### ProfileSetupScreen
- Shown once after first signup
- Avatar upload (Expo Camera or image picker)
- Display name input
- Travel style multi-select chips: ADVENTURE, LUXURY, BUDGET, FAMILY, SOLO, COUPLE
- Preferred destinations multi-select (top Indian regions + international)
- Language preference (default: English, also Hindi, Tamil, Telugu, Kannada, Marathi)
- "Complete Setup" → saves UserPreference → HomeScreen
- "Skip for now" link → HomeScreen

---

### Main Tab Navigator

Five bottom tabs with icons and labels. Active tab uses brand orange (#E87C2A).

```
[Home]  [Search]  [Saved]  [Messages]  [Profile]
```

---

### Home Tab — DiscoveryStack

Entry point for content discovery. Personalized based on UserPreference.

#### HomeScreen
**Layout sections (scrollable vertical feed):**

1. **Header Bar**
   - Location indicator (GPS city or manual selection)
   - Search icon → SearchScreen
   - Notification bell with unread badge → notifications panel

2. **Featured Hero Carousel**
   - Horizontal scroll, auto-plays every 5s
   - Full-width cards: destination cover image, title, creator name
   - Taps → StoryDetailScreen or ItineraryDetailScreen

3. **Quick Filters (horizontal chip row)**
   - All | Activities | Stays | Food | Services | Events
   - Active filter persists and re-fetches feed

4. **"Trending in India" Story Cards**
   - Horizontal scroll of StoryCard components
   - Grouped by region: North | South | East | West | Islands

5. **Trending Itineraries Section**
   - Grid of ItineraryCard components
   - "7 Days in Rajasthan" / "Kerala Backwaters 5D" etc.
   - "View All" → SearchResultsScreen filtered by itineraries

6. **Creator Spotlight**
   - Featured creators row (paid placement for PREMIUM tier)
   - CreatorCard component with follow button

7. **Nearby Experiences (if location permission granted)**
   - Horizontal list of ActivityCard components within 50km
   - "Explore on Map" CTA → MapViewScreen

8. **For You (personalized)**
   - Infinite scroll feed based on UserPreference.travelStyle
   - Mix of stories, itineraries, and activities

**State:** TanStack Query fetches with stale-while-revalidate. Pull-to-refresh. Skeleton loaders on initial load.

---

#### StoryDetailScreen
**Params:** `{ storyId: string }`

**Layout:**
1. **Hero Media** — full-screen image or video (Expo AV), swipeable if multiple
2. **Creator Snippet** — avatar, displayName, follower count, Follow button
3. **Story Title + Location** — with map pin icon
4. **Highlights** — horizontal tag chips (e.g., "Best for couples", "INR 5,000/day")
5. **Story Body** — rich text content, expandable "Read more"
6. **Photo Gallery** — MediaGallery component, tap to fullscreen
7. **Associated Itineraries** — "Plan a similar trip" cards
8. **Associated Activities** — ActivityCard list
9. **Linked Services** — ServiceCard list with "Book" CTA
10. **Related Stories** — horizontal scroll

**Header Actions:** Like (heart), Save (bookmark), Share (native share sheet)
**Floating CTA:** "Book a Service" if creator has active services

---

#### ItineraryDetailScreen
**Params:** `{ itineraryId: string }`

**Layout:**
1. **Cover Image** — hero with gradient overlay
2. **Meta row** — duration (X days), budget (₹X–₹Y), difficulty badge, location
3. **Creator Attribution** — avatar, name → CreatorProfileScreen
4. **Save / Share actions**
5. **Overview tabs:** Overview | Day-by-Day | Map | Cost Breakdown

**Overview Tab:**
- Description text
- Highlights list (what's included)
- Best time to visit
- Tags: adventure, family, budget, etc.

**Day-by-Day Tab:**
- DayTimeline component for each day
- Each day: expandable card showing morning/afternoon/evening activities
- Each activity item: icon, title, duration, cost, location
- "Book this activity" inline link

**Map Tab:**
- react-native-maps MapView
- Day-color-coded pins (Day 1 = red, Day 2 = blue, etc.)
- Route polyline connecting stops
- Tap pin → mini activity card popup

**Cost Breakdown Tab:**
- Category breakdown: Accommodation | Food | Transport | Activities | Misc
- Per-person vs. total toggle
- Budget tier: Budget / Mid-range / Luxury

**Bottom Bar:** "Save to My Trips" button + "Buy Full Guide (₹X)" if product linked

---

#### ActivityDetailScreen
**Params:** `{ activityId: string }`

**Layout:**
1. **Image Gallery** — swipeable, up to 10 images
2. **Title + Location** — with distance from user if GPS available
3. **Meta chips** — Duration | Difficulty | Group size | Language
4. **Price** — PriceTag component (₹X per person), strikethrough if discounted
5. **Description** — expandable rich text
6. **Location Map** — small react-native-maps embed, tap to expand
7. **Creator Tips** — "Pro tip from [CreatorName]" callout card
8. **Reviews Section** — RatingStars summary, top 3 reviews, "See All"
9. **Similar Activities** — horizontal scroll

**Sticky Bottom Bar:** "Book Now — ₹X per person" → BookingFlowScreen

---

#### CreatorProfileScreen
**Params:** `{ creatorId: string }`

**Header:**
- Banner image + avatar (overlapping, Instagram-style)
- Display name + isVerified badge
- Location + specialties chips
- Stats row: X Followers | X Stories | X Itineraries | ⭐ X.X rating
- Action buttons: Follow / Unfollow | Message (→ ChatScreen)
- Subscribe button if creator has paid tier

**Content Tabs (top tab navigator):**

1. **Stories** — grid of PortfolioItem thumbnails → StoryDetailScreen
2. **Itineraries** — list of ItineraryCard → ItineraryDetailScreen
3. **Activities** — grid of ActivityCard → ActivityDetailScreen
4. **Services** — list of ServiceCard → ServiceDetailScreen

**Footer:** "View Full Storefront" link → opens webview or in-app storefront

---

#### ServiceDetailScreen
**Params:** `{ serviceId: string }`

**Layout:**
1. **Cover Image Gallery** — swipeable
2. **Service Title + Type badge** (e.g., CUSTOM_ITINERARY, TRAVEL_CONSULTATION)
3. **Creator attribution** → CreatorProfileScreen
4. **Price tier cards:**
   - Basic / Standard / Premium pricing tiers if applicable
   - Duration indicator (X hours / X days)
   - Group size: up to X people
5. **Description** — full rich text, expandable
6. **What's included / excluded** — bullet lists
7. **Availability Calendar** — BookingCalendar component
   - Shows available (green), booked (grey), blocked (red) dates
   - Tap date → time slot selector
8. **Location / Delivery** — in-person or online indicator
9. **Cancellation Policy** — "Free cancellation up to 48 hours before"
10. **Reviews** — RatingStars + review list

**Sticky Bottom Bar:** "Check Availability" → BookingFlowScreen

---

### Search Tab — SearchStack

#### SearchScreen
**Layout:**
1. **Search Bar** — focused on mount, placeholder "Search destinations, creators, itineraries..."
2. **Recent Searches** — horizontal chips, tap to execute, X to remove
3. **Trending Destinations** — grid cards (Goa, Manali, Kerala, Rajasthan, Coorg...)
4. **Browse by Category** — horizontal: Activities | Stays | Food | Services | Creators
5. **Trending Hashtags** — #solotraveller #budgettravel #incredible_india

**Behavior:** Typing triggers debounced search (300ms). Results appear inline before navigating.

---

#### SearchResultsScreen
**Params:** `{ query?: string, category?: string, filters?: FilterState }`

**Layout:**
1. **Search bar** (editable, back arrow)
2. **Filter chips row** — Type | Location | Budget | Duration | Difficulty | Rating
3. **Sort selector** — Relevance | Latest | Price Low→High | Most Popular
4. **Results count** — "X results for 'Goa'"
5. **Results list** — adaptive cards based on result type:
   - STORY → StoryCard
   - ITINERARY → ItineraryCard (with budget)
   - ACTIVITY → ActivityCard (with price)
   - CREATOR → CreatorCard
   - SERVICE → ServiceCard (with price)
6. **Map toggle button** — switches to MapViewScreen with same filters
7. Infinite scroll pagination

---

#### MapViewScreen
**Params:** `{ filters?: FilterState, initialRegion?: Region }`

**Layout:**
1. **Full-screen MapView** (react-native-maps)
2. **Top overlay:** search bar + filter button
3. **Map pins:** custom colored markers by type
   - Orange = Activities
   - Blue = Stories/Portfolios
   - Purple = Services
   - Green = Creator locations
4. **Cluster markers** — shows count when zoomed out, expands on tap
5. **Bottom sheet panel** — slides up on pin tap
   - Mini card preview of tapped item
   - "View Details" CTA
6. **My Location button** — centers on GPS position
7. **List view toggle** → SearchResultsScreen

---

#### FilterScreen
**Presentation:** Modal sheet (slides up)

**Filter groups:**
- **Content Type** — checkboxes: Stories | Itineraries | Activities | Services | Creators
- **Location** — search input + popular regions list
- **Budget** — range slider (₹0 – ₹1,00,000+)
- **Duration** — range slider (1 day – 30+ days)
- **Difficulty** — chips: Easy | Moderate | Challenging
- **Rating** — "4+ stars" / "3+ stars"
- **Creator Tier** — Verified only | PRO/PREMIUM creators
- **Language** — English | Hindi | Tamil | Telugu | Kannada | Marathi

**Footer:** "Reset All" | "Apply X Filters" (count badge)

---

### Saved Tab — SavedStack

#### SavedScreen
**Header tabs:** Stories | Itineraries | Activities | Services | Creators

Each tab renders the corresponding saved items fetched from SavedItem API.
- Long-press on item → context menu (Remove from saved, Share)
- Drag-to-reorder (react-native-reanimated)
- Empty state with CTA to explore

**Offline indicator banner:** "Viewing cached content — some items may be outdated"

---

#### RecentlyViewedScreen
- Chronological list of recently viewed content
- Grouped by date: Today | Yesterday | This Week
- Clear history button
- Each item shows type icon, title, creator, time ago

---

### Messages Tab — MessagesStack

#### ConversationsScreen
**Layout:**
1. **Header:** "Messages" title + search icon
2. **Search bar** (when toggled) — filter conversations by creator name
3. **Conversations list:**
   - Creator avatar (with online indicator dot)
   - Creator display name
   - Last message preview (truncated 50 chars)
   - Timestamp (relative: "2m ago", "Yesterday")
   - Unread count badge (orange pill)
4. **Empty state:** "No conversations yet. Find a creator and say hello!"
5. **FAB:** Compose new message (searches for creators)

**Real-time:** Socket.io updates conversation list when new messages arrive

---

#### ChatScreen
**Params:** `{ conversationId: string, creatorId: string }`

**Layout:**
1. **Header:** Creator avatar + name + online/offline status + service booking shortcut icon
2. **Messages list** (inverted FlatList for natural scroll-to-bottom):
   - User messages: right-aligned, orange bubble
   - Creator messages: left-aligned, grey bubble
   - Timestamp shown on long-press
   - Read receipts: single tick (sent) → double tick (delivered) → blue double tick (read)
   - Image messages: tap to fullscreen
3. **Typing indicator** — animated dots when creator is typing
4. **Input bar:**
   - Text input (multiline, grows to 4 lines)
   - Image attachment icon → image picker
   - Send button (disabled when empty)
5. **Booking prompt bar:** "Interested in a service? Book here →" → ServiceDetailScreen

**Real-time:** Socket.io /messages namespace
- Emits `message:send` on submit
- Listens to `message:received` for incoming
- Emits `message:read` when messages come into viewport
- Handles reconnection with queue

---

### Profile Tab — ProfileStack

#### ProfileScreen
**Layout:**
1. **Header:** avatar, name, verified badge (if creator)
2. **Stats row:** Trips Created | Countries Visited | Items Saved
3. **Quick actions:** Edit Profile | Booking History | My Trips
4. **Recent Activity** — last 3 saved items
5. **Creator section** (if role === CREATOR):
   - "Go to Creator Dashboard" → opens creator web app URL in WebBrowser
   - Quick earnings widget
6. **Settings gear icon** → SettingsScreen

---

#### EditProfileScreen
- Avatar upload (camera or gallery)
- First name, last name inputs
- Phone number input
- Bio textarea (for creators)
- Travel preferences re-selection
- Language selection
- Save button → PATCH /api/v1/users/me

---

#### BookingHistoryScreen
**Layout:**
1. **Filter tabs:** Upcoming | Past | Cancelled
2. **Booking cards:**
   - Service name + creator avatar
   - Booking date + time
   - Status badge (PENDING/CONFIRMED/COMPLETED/CANCELLED)
   - Total amount in INR
   - "View Details" | "Cancel" (if upcoming + cancellation policy allows) | "Review" (if completed)
3. Tap card → BookingDetailScreen (inline modal)

---

#### MyTripsScreen
**Layout:**
1. **"New Trip" FAB** → CreateTripModal
2. **Trip cards:**
   - Trip name + cover image
   - Destination list
   - Date range
   - Status: Planning | Upcoming | Completed
   - Members count (if collaborative)
3. Tap → TripDetailScreen

---

#### FollowingScreen
- List of creators the user follows
- CreatorCard component for each
- Unfollow swipe action
- "Discover More Creators" CTA at bottom

---

#### SettingsScreen
**Sections:**
1. **Account:** Email, Change Password, Linked Accounts (Google)
2. **Notifications:** Push notifications toggles (New messages, Booking updates, Promotions)
3. **Privacy:** Profile visibility, Location sharing
4. **App:** Language, Currency display (INR default), Theme (Light/Dark/System)
5. **Support:** Help Center, Report a Bug, Contact Support
6. **Legal:** Terms of Service, Privacy Policy
7. **Subscription:** SubscriptionScreen link
8. **Danger zone:** Log Out, Delete Account

---

#### SubscriptionScreen
**Layout:**
1. **Current plan badge** — "You're on Free"
2. **Plan cards (3):**
   - FREE: Basic discovery, no offline, no DM
   - EXPLORER (₹199/month): Offline saves, unlimited DMs, priority search
   - NOMAD PRO (₹499/month): All + exclusive creator content, early access, no ads
3. **Feature comparison table**
4. **"Subscribe" CTA** → Stripe payment sheet (INR)
5. Active subscription: shows renewal date, cancel option

---

### Modal Screens (Overlay Any Tab)

#### BookingFlowScreen
Full-screen modal, 4-step wizard with progress indicator.

**Step 1 — Select Date & Time:**
- BookingCalendar component showing ServiceAvailability
- Available slots listed below calendar
- Group size selector (1 to maxGroupSize)
- "Continue" button

**Step 2 — Your Details:**
- Name (pre-filled from profile)
- Contact number
- Special requirements textarea
- Review booking summary

**Step 3 — Payment:**
- Order summary card (service name, date, group size, total INR)
- Stripe React Native payment sheet
- Supports: Cards, UPI, NetBanking, Wallets
- "Pay ₹X" button

**Step 4 — Confirmation:**
- Success animation (confetti)
- Booking reference number
- Add to calendar button (Expo Calendar)
- "Message Creator" button
- "Back to Home" button
- Push notification scheduled for booking reminder

---

#### CreateTripModal
- Trip name input
- Cover image selection
- Destination(s) multi-select (with search)
- Date range picker
- Privacy: Private / Shared with link / Invite-only
- "Create Trip" → POST /api/v1/trips

---

#### InviteTripMemberModal
- Shown from TripDetailScreen
- Email input OR share link copy
- Permission level: View | Edit

---

#### ReviewModal
- Star rating selector (1–5 taps)
- Title input (optional)
- Review text textarea
- Photo attachment (optional)
- Submit → POST /api/v1/reviews

---

## State Management — Zustand Stores

### authStore
```typescript
interface AuthState {
  user: UserResponseDto | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  updateUser: (updates: Partial<UserResponseDto>) => void;
}
```

### cartStore
```typescript
interface CartState {
  items: CartItem[];          // { productId, title, priceINR, quantity }
  totalINR: number;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => void;
  clear: () => void;
}
```

### offlineStore
```typescript
interface OfflineState {
  savedContent: Map<string, CachedItem>;  // key = itemType:itemId
  isOffline: boolean;
  lastSyncAt: Date | null;
  cacheContent: (type: string, id: string, data: unknown) => Promise<void>;
  getCached: (type: string, id: string) => unknown | null;
  syncWhenOnline: () => Promise<void>;
  clearCache: () => Promise<void>;
}
```

### settingsStore
```typescript
interface SettingsState {
  language: string;              // 'en' | 'hi' | 'ta' | 'te' | 'kn' | 'mr'
  currency: 'INR';               // INR always primary, display only
  notificationsEnabled: boolean;
  locationEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
  updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
}
```

---

## API Integration Layer

### src/api/client.ts
- Axios instance with `baseURL: process.env.EXPO_PUBLIC_API_URL`
- Request interceptor: attaches `Authorization: Bearer {accessToken}` header
- Response interceptor:
  - On 401: attempt token refresh via `POST /api/v1/auth/refresh`
  - On refresh success: retry original request
  - On refresh failure: call `authStore.logout()`
  - All errors mapped to typed `ApiError` class

### API modules
| File | Endpoints covered |
|---|---|
| `auth.api.ts` | register, login, google-oauth, refresh, logout, forgot-password, reset-password, verify-email |
| `users.api.ts` | getMe, updateMe, changePassword, getPreferences, updatePreferences, getUserProfile |
| `creators.api.ts` | getCreatorProfile, listCreators, followCreator, unfollowCreator, getFollowing |
| `content.api.ts` | listStories, getStory, listPortfolioItems, getPortfolioItem, likeItem |
| `destinations.api.ts` | listDestinations, getDestination, getDestinationContent |
| `products.api.ts` | listProducts, getProduct, listProductsByCreator, searchProducts |
| `services.api.ts` | listServices, getService, getServiceAvailability, listServicesByCreator |
| `bookings.api.ts` | createBooking, getBooking, listMyBookings, cancelBooking, confirmBooking |
| `orders.api.ts` | createOrder, getOrder, listMyOrders, createPaymentIntent |
| `trips.api.ts` | createTrip, getTrip, listMyTrips, updateTrip, deleteTrip, addTripMember |
| `messages.api.ts` | listConversations, getConversation, listMessages, sendMessage, markRead |
| `savedItems.api.ts` | getSavedItems, saveItem, unsaveItem, getRecentlyViewed |
| `notifications.api.ts` | listNotifications, markRead, markAllRead, updatePushToken |
| `search.api.ts` | search, getSearchSuggestions, getTrendingSearches |
| `reviews.api.ts` | createReview, updateReview, listReviews, markHelpful |

---

## Component Library

### Content Components

**StoryCard**
```
Props: { story: StoryPreview, onPress: () => void }
Layout: cover image (16:9), creator avatar (bottom-left), title overlay, like count
```

**ItineraryCard**
```
Props: { itinerary: ItineraryPreview, onPress: () => void }
Layout: cover image, duration badge (top-right "7 Days"), title, budget range (₹X–₹Y), location tag
```

**ActivityCard**
```
Props: { activity: ActivityPreview, onPress: () => void }
Layout: square image, title, price (₹X/person), difficulty badge, distance from user
```

**CreatorCard**
```
Props: { creator: CreatorPublicProfile, onFollow?: () => void }
Layout: avatar, displayName, verified badge, specialties, follower count, Follow/Following button
```

**ServiceCard**
```
Props: { service: ServicePreview, onPress: () => void }
Layout: cover image, service type badge, title, price, duration, creator name
```

### UI Components

**DayTimeline**
```
Props: { day: ItineraryDay, isExpanded: boolean, onToggle: () => void }
Layout: day header (expandable), time-ordered activity list, cost subtotal
```

**MediaGallery**
```
Props: { urls: string[], initialIndex?: number, autoplay?: boolean }
Features: Swipe navigation, pinch-to-zoom, share button, index indicator dots
```

**RatingStars**
```
Props: { rating: number, count?: number, size?: 'sm' | 'md' | 'lg', interactive?: boolean }
Layout: 5 stars (filled/half/empty), numeric rating, review count
```

**PriceTag**
```
Props: { amountINR: number, originalAmountINR?: number, per?: string }
Features: Indian number formatting (₹1,00,000), strikethrough for discounts, "per person" suffix
```

**BookingCalendar**
```
Props: { serviceId: string, onDateSelect: (date: Date, slot: TimeSlot) => void }
Features: Fetches ServiceAvailability, color-coded date states, swipe between months
```

**FilterChips**
```
Props: { options: FilterOption[], selected: string[], onToggle: (id: string) => void }
Layout: horizontal scroll, rounded pill chips, selected = filled orange, unselected = outlined
```

**LoadingSkeleton**
```
Props: { type: 'card' | 'list' | 'profile' | 'detail', count?: number }
Features: Animated shimmer effect, matches layout of real content
```

**EmptyState**
```
Props: { icon: string, title: string, subtitle?: string, ctaLabel?: string, onCta?: () => void }
Layout: centered illustration, title, subtitle, optional CTA button
```

**ErrorBoundary**
```
Props: { fallback?: ReactNode, onError?: (error: Error) => void }
Features: Catches render errors, shows retry option, reports to error tracking
```

---

## Real-time Features (Socket.io)

### Connection Management
- Connect on app foreground, disconnect on background (AppState listener)
- Authenticate via `auth: { token: accessToken }` in socket handshake
- Auto-reconnect with exponential backoff

### /messages Namespace
```typescript
// Emit
socket.emit('message:send', { conversationId, content, mediaUrl?, mediaType? })

// Listen
socket.on('message:received', (message: MessageDto) => { /* append to chat */ })
socket.on('message:read', ({ messageId, readAt }) => { /* update receipt icon */ })
socket.on('user:online', ({ userId }) => { /* show green dot */ })
socket.on('user:offline', ({ userId, lastSeenAt }) => { /* update status */ })
```

### /notifications Namespace
```typescript
socket.on('notification:new', (notification: NotificationDto) => {
  // Show in-app banner via Toast
  // Update notification badge count
})
```

### Push Notifications (Expo Notifications)
- Register push token on login: `PATCH /api/v1/notifications/push-token`
- Notification categories:
  - `BOOKING_CONFIRMED` — "Your booking with {creator} is confirmed"
  - `MESSAGE_RECEIVED` — "{creator} sent you a message"
  - `BOOKING_REMINDER` — "Your experience starts tomorrow at {time}"
  - `NEW_CONTENT` — "{creator} you follow posted a new itinerary"

---

## Offline Strategy

### What Gets Cached
| Content Type | Cache Trigger | Expiry |
|---|---|---|
| Saved stories | User saves item | 7 days |
| Saved itineraries | User saves item | 7 days |
| Saved activities | User saves item | 7 days |
| Creator profiles (followed) | Background sync | 24 hours |
| Recent searches | Automatic | 30 days |
| Booking details | On booking confirmation | Never (until completed) |

### Implementation
1. `NetInfo.addEventListener` monitors connectivity
2. On save action: fetch full content via API, store in AsyncStorage with `offlineStore.cacheContent()`
3. Expo FileSystem for media file caching (images, thumbnails)
4. When offline: `offlineStore.isOffline = true`, show offline banner
5. Reads from cache automatically when offline
6. On reconnect: `offlineStore.syncWhenOnline()` — re-fetches stale cached items in background

---

## Multi-Language Support

### Supported Languages (Phase 1)
- English (en) — default
- Hindi (hi)
- Tamil (ta)
- Telugu (te)
- Kannada (kn)
- Marathi (mr)

### Implementation
- i18n library: `i18next` + `react-i18next` + `expo-localization`
- Translation files in `src/constants/i18n/{lang}.json`
- Device locale auto-detected via `expo-localization`
- User can override in SettingsScreen
- Date/number formatting uses `Intl` API with detected locale
- INR formatting: `new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`

---

## Folder Structure

```
mobile/
├── app.json                          # Expo config (bundleId, scheme, permissions)
├── package.json
├── tsconfig.json
├── babel.config.js                   # NativeWind + Reanimated setup
├── metro.config.js
├── .env.example                      # EXPO_PUBLIC_API_URL, EXPO_PUBLIC_STRIPE_KEY
├── assets/
│   ├── images/                       # app icon, splash, placeholder images
│   ├── fonts/                        # custom fonts (Inter, Poppins)
│   └── animations/                   # Lottie JSON files
└── src/
    ├── api/
    │   ├── client.ts                 # Axios instance + interceptors
    │   ├── auth.api.ts
    │   ├── users.api.ts
    │   ├── creators.api.ts
    │   ├── content.api.ts
    │   ├── destinations.api.ts
    │   ├── products.api.ts
    │   ├── services.api.ts
    │   ├── bookings.api.ts
    │   ├── orders.api.ts
    │   ├── trips.api.ts
    │   ├── messages.api.ts
    │   ├── savedItems.api.ts
    │   ├── notifications.api.ts
    │   ├── search.api.ts
    │   └── reviews.api.ts
    ├── components/
    │   ├── common/
    │   │   ├── LoadingSkeleton.tsx
    │   │   ├── EmptyState.tsx
    │   │   ├── ErrorBoundary.tsx
    │   │   ├── PriceTag.tsx
    │   │   ├── RatingStars.tsx
    │   │   ├── FilterChips.tsx
    │   │   ├── MediaGallery.tsx
    │   │   └── OfflineBanner.tsx
    │   ├── home/
    │   │   ├── HeroCarousel.tsx
    │   │   ├── QuickFilters.tsx
    │   │   └── SectionHeader.tsx
    │   ├── content/
    │   │   ├── StoryCard.tsx
    │   │   ├── ItineraryCard.tsx
    │   │   ├── ActivityCard.tsx
    │   │   └── DayTimeline.tsx
    │   ├── creator/
    │   │   ├── CreatorCard.tsx
    │   │   ├── CreatorHeader.tsx
    │   │   └── ServiceCard.tsx
    │   ├── booking/
    │   │   ├── BookingCalendar.tsx
    │   │   ├── TimeSlotPicker.tsx
    │   │   ├── BookingSummary.tsx
    │   │   └── PaymentSheet.tsx
    │   └── trip/
    │       ├── TripCard.tsx
    │       └── TripMemberChip.tsx
    ├── screens/
    │   ├── auth/
    │   │   ├── SplashScreen.tsx
    │   │   ├── WelcomeScreen.tsx
    │   │   ├── SignUpScreen.tsx
    │   │   ├── SignInScreen.tsx
    │   │   ├── ForgotPasswordScreen.tsx
    │   │   ├── ResetPasswordScreen.tsx
    │   │   └── ProfileSetupScreen.tsx
    │   ├── home/
    │   │   ├── HomeScreen.tsx
    │   │   ├── StoryDetailScreen.tsx
    │   │   ├── ItineraryDetailScreen.tsx
    │   │   ├── ActivityDetailScreen.tsx
    │   │   ├── CreatorProfileScreen.tsx
    │   │   └── ServiceDetailScreen.tsx
    │   ├── search/
    │   │   ├── SearchScreen.tsx
    │   │   ├── SearchResultsScreen.tsx
    │   │   ├── MapViewScreen.tsx
    │   │   └── FilterScreen.tsx
    │   ├── saved/
    │   │   ├── SavedScreen.tsx
    │   │   └── RecentlyViewedScreen.tsx
    │   ├── messages/
    │   │   ├── ConversationsScreen.tsx
    │   │   └── ChatScreen.tsx
    │   ├── profile/
    │   │   ├── ProfileScreen.tsx
    │   │   ├── EditProfileScreen.tsx
    │   │   ├── BookingHistoryScreen.tsx
    │   │   ├── MyTripsScreen.tsx
    │   │   ├── FollowingScreen.tsx
    │   │   ├── SettingsScreen.tsx
    │   │   └── SubscriptionScreen.tsx
    │   └── modals/
    │       ├── BookingFlowScreen.tsx
    │       ├── CreateTripModal.tsx
    │       ├── InviteTripMemberModal.tsx
    │       └── ReviewModal.tsx
    ├── navigation/
    │   ├── RootNavigator.tsx         # Auth vs Main conditional
    │   ├── AuthStack.tsx
    │   ├── MainTabNavigator.tsx      # Bottom tabs
    │   ├── DiscoveryStack.tsx        # Home tab stack
    │   ├── SearchStack.tsx
    │   ├── SavedStack.tsx
    │   ├── MessagesStack.tsx
    │   ├── ProfileStack.tsx
    │   └── types.ts                  # Navigation param types
    ├── store/
    │   ├── authStore.ts
    │   ├── cartStore.ts
    │   ├── offlineStore.ts
    │   └── settingsStore.ts
    ├── hooks/
    │   ├── useAuth.ts
    │   ├── useLocation.ts            # Expo Location wrapper
    │   ├── useSocket.ts              # Socket.io connection hook
    │   ├── useOffline.ts             # NetInfo + offline state
    │   ├── useInfiniteScroll.ts      # TanStack Query infinite
    │   └── useNotifications.ts      # Expo Notifications setup
    ├── utils/
    │   ├── formatters.ts             # INR formatting, date formatting
    │   ├── validators.ts             # Zod schemas for forms
    │   ├── analytics.ts              # Event tracking
    │   └── permissions.ts           # Expo permissions helpers
    ├── constants/
    │   ├── theme.ts                  # Colors, typography, spacing
    │   ├── config.ts                 # App constants, API URL
    │   ├── queryKeys.ts              # TanStack Query key factories
    │   └── i18n/
    │       ├── en.json
    │       ├── hi.json
    │       ├── ta.json
    │       ├── te.json
    │       ├── kn.json
    │       └── mr.json
    └── types/
        ├── api.types.ts              # API response types (mirrors backend DTOs)
        ├── navigation.types.ts       # Stack/tab param list types
        ├── store.types.ts            # Zustand store interface types
        └── ui.types.ts               # Component prop types
```

---

## Development Phases

### Phase 1 — Auth + Home + Content Browsing (2 weeks)
- [ ] Project setup: Expo SDK 51, TypeScript, NativeWind, React Navigation
- [ ] Auth stack (Splash, Welcome, SignUp, SignIn, ForgotPassword)
- [ ] Google SSO integration
- [ ] Zustand authStore + Axios client
- [ ] HomeScreen (hero carousel, story cards, quick filters)
- [ ] StoryDetailScreen
- [ ] ItineraryDetailScreen (overview + day-by-day tabs)
- [ ] ActivityDetailScreen
- [ ] TanStack Query setup with queryKeys

### Phase 2 — Creator Profiles + Destinations (1 week)
- [ ] CreatorProfileScreen (header, content tabs)
- [ ] SearchScreen + SearchResultsScreen
- [ ] FilterScreen modal
- [ ] Destination content grouping
- [ ] ProfileSetupScreen (travel preferences onboarding)
- [ ] Follow / Unfollow flow

### Phase 3 — Services + Bookings + Payment (2 weeks)
- [ ] ServiceDetailScreen
- [ ] BookingCalendar component (ServiceAvailability API integration)
- [ ] BookingFlowScreen (4-step wizard)
- [ ] Stripe React Native setup (INR, UPI)
- [ ] BookingHistoryScreen
- [ ] OrdersScreen

### Phase 4 — Trip Planner + Social Features (2 weeks)
- [ ] MyTripsScreen
- [ ] CreateTripModal
- [ ] TripDetailScreen (collaborative planning)
- [ ] SavedScreen with tabs
- [ ] RecentlyViewedScreen
- [ ] FollowingScreen
- [ ] ReviewModal

### Phase 5 — Messaging + Notifications (1 week)
- [ ] Socket.io client setup (useSocket hook)
- [ ] ConversationsScreen
- [ ] ChatScreen (real-time, read receipts)
- [ ] Expo Notifications setup + push token registration
- [ ] In-app notification panel

### Phase 6 — Offline + Map + Polish (1 week)
- [ ] MapViewScreen (react-native-maps, cluster markers)
- [ ] Offline caching (Expo FileSystem + AsyncStorage)
- [ ] NetInfo integration + offline banner
- [ ] Multi-language i18n setup (en + hi initial)
- [ ] Performance audit (FlatList optimization, image caching)
- [ ] Error boundaries + crash reporting
- [ ] App Store / Play Store submission prep

---

## Permissions Required

| Permission | Platform | Use |
|---|---|---|
| CAMERA | iOS + Android | Profile photo capture |
| MEDIA_LIBRARY | iOS + Android | Image picker from gallery |
| LOCATION_WHEN_IN_USE | iOS + Android | Nearby experiences, map centering |
| NOTIFICATIONS | iOS | Push notification prompts |
| INTERNET | Android | Network requests |
| ACCESS_NETWORK_STATE | Android | Offline detection |

---

## Performance Targets

| Metric | Target |
|---|---|
| Time to Interactive (cold start) | < 3s |
| HomeScreen load | < 1.5s (with skeleton) |
| Image load (compressed) | < 500ms on 4G |
| Scroll FPS | 60fps on mid-range Android |
| Offline content access | < 100ms from cache |
| Message delivery | < 200ms (socket roundtrip) |
