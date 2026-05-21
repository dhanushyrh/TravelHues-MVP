import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, CreditCard, Mail, Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { adminDestinationsApi, adminPlansApi, adminInvitesApi } from '@/api/admin.api';

interface InviteStats {
  total: number;
  pending: number;
  used: number;
  revoked: number;
  expired: number;
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  isLoading,
}: {
  label: string;
  value: string | number;
  sub?: string;
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
            {sub && !isLoading && (
              <p className="text-xs text-gray-400 mt-1">{sub}</p>
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

export default function AdminDashboardPage() {
  const { data: destinationsData, isLoading: isLoadingDest } = useQuery({
    queryKey: ['admin', 'destinations', 'count'],
    queryFn: () => adminDestinationsApi.list({ limit: 1 }),
    select: (res) => res.data?.data ?? res.data,
  });

  const { data: activeDest, isLoading: isLoadingActiveDest } = useQuery({
    queryKey: ['admin', 'destinations', 'active-count'],
    queryFn: () => adminDestinationsApi.list({ limit: 1 }),
    select: (res) => {
      const d = res.data?.data ?? res.data;
      return d?.meta?.total ?? 0;
    },
  });

  const { data: plansData, isLoading: isLoadingPlans } = useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: () => adminPlansApi.list(),
    select: (res) => res.data?.data ?? res.data,
  });

  const { data: inviteStats, isLoading: isLoadingInvites } = useQuery({
    queryKey: ['admin', 'invites', 'stats'],
    queryFn: () => adminInvitesApi.stats(),
    select: (res) => (res.data?.data ?? res.data) as InviteStats,
  });

  const totalDestinations = destinationsData?.meta?.total ?? destinationsData?.total ?? 0;
  const totalPlans = Array.isArray(plansData) ? plansData.length : (plansData?.data?.length ?? 0);
  const activePlans = Array.isArray(plansData)
    ? plansData.filter((p: { isActive?: boolean }) => p.isActive).length
    : 0;

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Overview of your platform.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Destinations"
            value={totalDestinations}
            icon={Globe}
            color="bg-blue-50 text-blue-600"
            isLoading={isLoadingDest}
          />
          <StatCard
            label="Active Destinations"
            value={activeDest ?? 0}
            icon={MapPin}
            color="bg-green-50 text-green-600"
            isLoading={isLoadingActiveDest}
          />
          <StatCard
            label="Subscription Plans"
            value={totalPlans}
            sub={activePlans ? `${activePlans} active` : undefined}
            icon={CreditCard}
            color="bg-purple-50 text-purple-600"
            isLoading={isLoadingPlans}
          />
          <StatCard
            label="Creator Invites"
            value={inviteStats?.total ?? 0}
            sub={inviteStats ? `${inviteStats.pending} pending · ${inviteStats.used} used` : undefined}
            icon={Mail}
            color="bg-orange-50 text-orange-600"
            isLoading={isLoadingInvites}
          />
        </div>

        {/* Invite breakdown */}
        {!isLoadingInvites && inviteStats && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Pending', count: inviteStats.pending, color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
              { label: 'Used', count: inviteStats.used, color: 'bg-green-50 text-green-700 border-green-200' },
              { label: 'Revoked', count: inviteStats.revoked, color: 'bg-red-50 text-red-700 border-red-200' },
              { label: 'Expired', count: inviteStats.expired, color: 'bg-gray-50 text-gray-600 border-gray-200' },
            ].map(({ label, count, color }) => (
              <div key={label} className={`rounded-lg border px-4 py-3 ${color}`}>
                <p className="text-xs font-medium">{label}</p>
                <p className="text-2xl font-bold mt-0.5">{count}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
