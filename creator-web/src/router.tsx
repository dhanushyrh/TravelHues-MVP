import React from 'react';
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import { useAuthStore } from '@/store/auth.store';
import LoginPage from '@/pages/auth/LoginPage';
import AcceptInvitePage from '@/pages/auth/AcceptInvitePage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import OnboardingPage from '@/pages/onboarding/OnboardingPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import ContentPage from '@/pages/content/ContentPage';
import ProductsPage from '@/pages/products/ProductsPage';
import NewProductPage from '@/pages/products/NewProductPage';
import StorefrontPage from '@/pages/storefront/StorefrontPage';
import SettingsPage from '@/pages/settings/SettingsPage';

// ── Auth guard ────────────────────────────────────────────────────────────────
function requireAuth() {
  const { isAuthenticated } = useAuthStore.getState();
  if (!isAuthenticated) {
    throw redirect({ to: '/auth/login' });
  }
}

// ── Root route ────────────────────────────────────────────────────────────────
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// ── Auth routes ───────────────────────────────────────────────────────────────
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/login',
  component: LoginPage,
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) {
      throw redirect({ to: '/dashboard' });
    }
  },
});

const acceptInviteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/accept-invite',
  component: AcceptInvitePage,
  validateSearch: (search: Record<string, unknown>) => ({
    token: (search.token as string) || '',
  }),
});

const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/forgot-password',
  component: ForgotPasswordPage,
});

// ── Onboarding ────────────────────────────────────────────────────────────────
const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/onboarding',
  component: OnboardingPage,
  beforeLoad: requireAuth,
});

// ── Root redirect ─────────────────────────────────────────────────────────────
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/dashboard' });
  },
  component: () => null,
});

// ── Protected routes ──────────────────────────────────────────────────────────
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: DashboardPage,
  beforeLoad: requireAuth,
});

const contentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/content',
  component: ContentPage,
  beforeLoad: requireAuth,
});

const productsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/products',
  component: ProductsPage,
  beforeLoad: requireAuth,
});

const newProductRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/products/new',
  component: NewProductPage,
  beforeLoad: requireAuth,
});

const storefrontRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/storefront',
  component: StorefrontPage,
  beforeLoad: requireAuth,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
  beforeLoad: requireAuth,
});

// ── Router ────────────────────────────────────────────────────────────────────
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  acceptInviteRoute,
  forgotPasswordRoute,
  onboardingRoute,
  dashboardRoute,
  contentRoute,
  productsRoute,
  newProductRoute,
  storefrontRoute,
  settingsRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

// Register types for type-safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
