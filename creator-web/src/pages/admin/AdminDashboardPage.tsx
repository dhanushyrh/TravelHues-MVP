import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { MapPin, CreditCard, Mail, Users, UserCheck, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { adminStatsApi, adminInvitesApi } from '@/api/admin.api';

interface PlatformStats {
  totalUsers: number;
  totalCreators: number;
  totalDestinations: number;
  totalPlans: number;
  pendingInvites: number;
}

interface InviteStats {
  total: number;
  pending: number;
  used: number;
  revoked: number;
  expired: number;
}

function StatCard({
  label, value, sub, icon: Icon, color, isLoading, onClick,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; isLoading?: boolean; onClick?: () => void;
}) {
  return (
    <Card className={onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-24 mt-1" />
            ) : (
              <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
            )}
            {sub && !isLoading && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
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
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminStatsApi.get(),
    select: (res) => (res.data?.data ?? res.data) as PlatformStats,
  });

  const { data: inviteStats, isLoading: isLoadingInvites } = useQuery({
    queryKey: ['admin', 'invites', 'stats'],
    queryFn: () => adminInvitesApi.stats(),
    select: (res) => (res.data?.data ?? res.data) as InviteStats,
  });

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Platform overview</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <StatCard
            label="Total Users"
            value={stats?.totalUsers ?? 0}
            icon={Users}
            color="bg-blue-50 text-blue-600"
            isLoading={isLoading}
            onClick={() => navigate({ to: '/admin/users' })}
          />
          <StatCard
            label="Creators"
            value={stats?.totalCreators ?? 0}
            icon={UserCheck}
            color="bg-purple-50 text-purple-600"
            isLoading={isLoading}
            onClick={() => navigate({ to: '/admin/creators' })}
          />
          <StatCard
            label="Destinations"
            value={stats?.totalDestinations ?? 0}
            sub="Active only"
            icon={MapPin}
            color="bg-green-50 text-green-600"
            isLoading={isLoading}
            onClick={() => navigate({ to: '/admin/destinations' })}
          />
          <StatCard
            label="Active Plans"
            value={stats?.totalPlans ?? 0}
            icon={CreditCard}
            color="bg-amber-50 text-amber-600"
            isLoading={isLoading}
            onClick={() => navigate({ to: '/admin/plans' })}
          />
          <StatCard
            label="Pending Invites"
            value={stats?.pendingInvites ?? 0}
            icon={Mail}
            color="bg-orange-50 text-orange-600"
            isLoading={isLoading}
            onClick={() => navigate({ to: '/admin/invites' })}
          />
        </div>

        {/* Invite breakdown */}
        {!isLoadingInvites && inviteStats && (
          <Card className="mb-6">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-700">Invite Breakdown</p>
                <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/admin/invites' })}>
                  Manage <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
            </CardContent>
          </Card>
        )}

        {/* Quick actions */}
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm" onClick={() => navigate({ to: '/admin/users' })}>
                <Users className="w-4 h-4 mr-2" /> Manage Users
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate({ to: '/admin/creators' })}>
                <UserCheck className="w-4 h-4 mr-2" /> Manage Creators
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate({ to: '/admin/invites' })}>
                <Mail className="w-4 h-4 mr-2" /> Send Invite
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate({ to: '/admin/destinations' })}>
                <MapPin className="w-4 h-4 mr-2" /> Destinations
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
