import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import {
  Video,
  Users,
  Package,
  TrendingUp,
  Plus,
  Upload,
  Store,
  Eye,
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AppLayout } from '@/components/layout/AppLayout';
import { creatorsApi } from '@/api/creators.api';
import { useAuthStore } from '@/store/auth.store';
import { formatCurrency, formatNumber } from '@/lib/utils';
import type { DashboardStats } from '@/types';

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  isLoading,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  isLoading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-24 mt-1" />
            ) : (
              <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
            )}
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => creatorsApi.getDashboard(),
    select: (res) => (res.data?.data || res.data) as DashboardStats,
  });

  const displayName = user ? `${user.firstName} ${user.lastName}` : 'Creator';

  const stats = [
    {
      label: 'Total Content',
      value: isLoading ? '—' : formatNumber(data?.totalContent ?? 0),
      icon: Video,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Followers',
      value: isLoading ? '—' : formatNumber(data?.followers ?? 0),
      icon: Users,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      label: 'Products Published',
      value: isLoading ? '—' : formatNumber(data?.publishedProducts ?? 0),
      icon: Package,
      color: 'bg-orange-50 text-orange-600',
    },
    {
      label: 'Revenue This Month',
      value: isLoading ? '—' : formatCurrency(data?.revenueThisMonth ?? 0),
      icon: TrendingUp,
      color: 'bg-green-50 text-green-600',
    },
  ];

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {displayName}!
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Here&apos;s what&apos;s happening with your content.
            </p>
          </div>
          <Button onClick={() => navigate({ to: '/content' })}>
            <Plus className="w-4 h-4 mr-2" />
            Add Content
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} isLoading={isLoading} />
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => navigate({ to: '/content' })}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Content
              </Button>
              <Button variant="outline" onClick={() => navigate({ to: '/products/new' })}>
                <Package className="w-4 h-4 mr-2" />
                Add Product
              </Button>
              <Button variant="outline" onClick={() => navigate({ to: '/storefront' })}>
                <Store className="w-4 h-4 mr-2" />
                Edit Storefront
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Content */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Content</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: '/content' })}
                className="text-primary-500 hover:text-primary-600 hover:bg-primary-50"
              >
                View all
                <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="w-16 h-12 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : data?.recentContent && data.recentContent.length > 0 ? (
              <div className="space-y-3">
                {data.recentContent.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-16 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Video className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <Badge variant="secondary" className="text-xs capitalize">
                          {item.type}
                        </Badge>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Eye className="w-3 h-3" />
                          {formatNumber(item.viewCount)}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={item.isPublished ? 'success' : 'outline'}
                      className="flex-shrink-0"
                    >
                      {item.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <Video className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm font-medium">No content yet</p>
                <p className="text-gray-400 text-xs mt-1">
                  Upload your first piece of content to get started
                </p>
                <Button
                  className="mt-4"
                  size="sm"
                  onClick={() => navigate({ to: '/content' })}
                >
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  Upload Content
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
