import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import {
  Plus,
  Globe,
  Compass,
  Map,
  Package,
  Video,
  ArrowUpRight,
  BookOpen,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AppLayout } from '@/components/layout/AppLayout';
import { creatorsApi } from '@/api/creators.api';
import { storiesApi } from '@/api/stories.api';
import { productsApi } from '@/api/products.api';
import { useAuthStore } from '@/store/auth.store';
import { formatCurrency, formatNumber } from '@/lib/utils';
import type { DashboardStats, Story, Product } from '@/types';

// ── Hero stat pill ─────────────────────────────────────────────────────────────
function StatPill({
  icon: Icon,
  label,
  value,
  color,
  isLoading,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  isLoading?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 px-5 py-4 flex-1 min-w-0">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        {isLoading ? (
          <Skeleton className="h-6 w-12 mb-0.5" />
        ) : (
          <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
        )}
        <p className="text-xs text-gray-500 truncate">{label}</p>
      </div>
    </div>
  );
}

// ── Story card (horizontal scroll) ────────────────────────────────────────────
function StoryScrollCard({ story, onClick }: { story: Story; onClick: () => void }) {
  const productCount = story.products?.length ?? 0;
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-44 rounded-2xl overflow-hidden border border-gray-100 bg-white hover:shadow-md transition-shadow text-left"
    >
      <div className="relative h-28 bg-gradient-to-br from-primary-100 to-primary-200">
        {story.coverImageUrl ? (
          <img src={story.coverImageUrl} alt={story.title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Globe className="w-8 h-8 text-primary-400" />
          </div>
        )}
        <div className="absolute bottom-2 left-2">
          <Badge
            variant={story.isPublished ? 'default' : 'secondary'}
            className="text-xs px-1.5 py-0.5"
          >
            {story.isPublished ? 'Live' : 'Draft'}
          </Badge>
        </div>
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-gray-900 truncate">{story.title}</p>
        {story.country && (
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
            <Globe className="w-3 h-3" />
            {story.country.name}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-1">{productCount} activities</p>
      </div>
    </button>
  );
}

// ── New Story dashed card ──────────────────────────────────────────────────────
function NewStoryCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-44 h-[168px] rounded-2xl border-2 border-dashed border-gray-200 hover:border-primary-300 hover:bg-primary-50/30 transition-colors flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-primary-500"
    >
      <div className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-primary-100 flex items-center justify-center">
        <Plus className="w-5 h-5" />
      </div>
      <span className="text-xs font-medium">New Story</span>
    </button>
  );
}

// ── Product mini card ──────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<string, { color: string; icon: React.ElementType }> = {
  activity: { color: 'bg-orange-50 text-orange-500', icon: Compass },
  stay: { color: 'bg-blue-50 text-blue-500', icon: Map },
  itinerary: { color: 'bg-purple-50 text-purple-500', icon: Map },
  food: { color: 'bg-rose-50 text-rose-500', icon: Package },
  package: { color: 'bg-green-50 text-green-500', icon: Package },
  visa: { color: 'bg-pink-50 text-pink-500', icon: Globe },
};

function ProductRow({ product }: { product: Product }) {
  const cfg = TYPE_CONFIG[product.type] ?? { color: 'bg-gray-100 text-gray-500', icon: Package };
  const Icon = cfg.icon;
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
        {product.coverImageUrl ? (
          <img src={product.coverImageUrl} alt="" className="w-9 h-9 rounded-xl object-cover" />
        ) : (
          <Icon className="w-4 h-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{product.title}</p>
        <p className="text-xs text-gray-400 capitalize">{product.type}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-gray-900">{formatCurrency(Number(product.price))}</p>
        <Badge variant={product.isPublished ? 'default' : 'secondary'} className="text-xs mt-0.5">
          {product.isPublished ? 'Live' : 'Draft'}
        </Badge>
      </div>
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────
function SectionHeader({ title, to, onNavigate }: { title: string; to: string; onNavigate: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      <button
        onClick={onNavigate}
        className="flex items-center gap-1 text-xs font-medium text-primary-500 hover:text-primary-600"
      >
        View all <ArrowUpRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: dashData, isLoading: dashLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => creatorsApi.getDashboard(),
    select: (res) => (res.data?.data || res.data) as DashboardStats,
  });

  const { data: storiesData, isLoading: storiesLoading } = useQuery({
    queryKey: ['stories'],
    queryFn: () => storiesApi.list({ limit: 10 }),
    select: (res): Story[] => (res as any)?.data?.data ?? (res as any)?.data ?? [],
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products', 'dashboard'],
    queryFn: () => productsApi.list({ limit: 6 }),
    select: (res): Product[] => (res as any)?.data?.data ?? (res as any)?.data ?? [],
  });

  const firstName = user?.firstName ?? 'Creator';
  const stories = storiesData ?? [];
  const products = productsData ?? [];

  const activitiesCount = products.filter((p) => ['activity', 'stay', 'food'].includes(p.type)).length;
  const itinerariesCount = products.filter((p) => ['itinerary', 'package'].includes(p.type)).length;

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-8">

        {/* ── Greeting ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hi, {firstName} 👋</h1>
            <p className="text-sm text-gray-500 mt-0.5">Here's what's happening with your profile.</p>
          </div>
          <Button onClick={() => navigate({ to: '/stories/new' })}>
            <Plus className="w-4 h-4 mr-2" />
            New Story
          </Button>
        </div>

        {/* ── Stats row ─────────────────────────────────────────────────────── */}
        <div className="flex gap-3 overflow-x-auto pb-1">
          <StatPill
            icon={BookOpen}
            label="Stories"
            value={storiesLoading ? '—' : stories.length}
            color="bg-primary-50 text-primary-500"
            isLoading={storiesLoading}
          />
          <StatPill
            icon={Compass}
            label="Activities"
            value={productsLoading ? '—' : formatNumber(activitiesCount)}
            color="bg-orange-50 text-orange-500"
            isLoading={productsLoading}
          />
          <StatPill
            icon={Map}
            label="Itineraries"
            value={productsLoading ? '—' : formatNumber(itinerariesCount)}
            color="bg-purple-50 text-purple-500"
            isLoading={productsLoading}
          />
          <StatPill
            icon={Users}
            label="Followers"
            value={dashLoading ? '—' : formatNumber(dashData?.followers ?? 0)}
            color="bg-blue-50 text-blue-500"
            isLoading={dashLoading}
          />
          <StatPill
            icon={TrendingUp}
            label="Revenue"
            value={dashLoading ? '—' : formatCurrency(dashData?.revenueThisMonth ?? 0)}
            color="bg-green-50 text-green-500"
            isLoading={dashLoading}
          />
        </div>

        {/* ── Stories ───────────────────────────────────────────────────────── */}
        <div>
          <SectionHeader
            title="Your Stories"
            to="/stories"
            onNavigate={() => navigate({ to: '/stories' })}
          />
          {storiesLoading ? (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="flex-shrink-0 w-44 h-[168px] rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2">
              <NewStoryCard onClick={() => navigate({ to: '/stories/new' })} />
              {stories.map((story) => (
                <StoryScrollCard
                  key={story.id}
                  story={story}
                  onClick={() => navigate({ to: '/stories/$storyId', params: { storyId: story.id } })}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Two-column: Products + Content ────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Products */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <SectionHeader
              title="Products"
              to="/products"
              onNavigate={() => navigate({ to: '/products' })}
            />
            {productsLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-9 h-9 rounded-xl" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-36" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div>
                {products.slice(0, 5).map((p) => (
                  <ProductRow key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No products yet</p>
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() => navigate({ to: '/products/new' })}
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Add Product
                </Button>
              </div>
            )}
          </div>

          {/* Recent Content */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <SectionHeader
              title="Recent Content"
              to="/content"
              onNavigate={() => navigate({ to: '/content' })}
            />
            {dashLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-16 h-12 rounded-xl" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-36" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : dashData?.recentContent && dashData.recentContent.length > 0 ? (
              <div className="space-y-1">
                {dashData.recentContent.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0"
                  >
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-16 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Video className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                      <Badge variant="secondary" className="text-xs capitalize mt-0.5">
                        {item.type}
                      </Badge>
                    </div>
                    <Badge
                      variant={item.isPublished ? 'default' : 'secondary'}
                      className="flex-shrink-0 text-xs"
                    >
                      {item.isPublished ? 'Live' : 'Draft'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <Video className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No content yet</p>
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() => navigate({ to: '/content' })}
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Upload Content
                </Button>
              </div>
            )}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
