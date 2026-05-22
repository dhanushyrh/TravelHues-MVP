import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Trash2, ChevronLeft, ChevronRight, BadgeCheck, Package, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { adminCreatorsApi } from '@/api/admin.api';

const TIERS = ['basic', 'pro', 'premium'] as const;
type Tier = typeof TIERS[number];

const tierBadge: Record<Tier, string> = {
  basic: 'bg-gray-100 text-gray-600 border-gray-200',
  pro: 'bg-blue-100 text-blue-700 border-blue-200',
  premium: 'bg-amber-100 text-amber-700 border-amber-200',
};

export default function AdminCreatorsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'creators', search, tierFilter, page],
    queryFn: () => adminCreatorsApi.list({ search: search || undefined, tier: tierFilter || undefined, page, limit: 20 }),
    select: (res) => res.data?.data ?? res.data,
  });

  const creators: any[] = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, totalPages: 1 };

  const verifyMutation = useMutation({
    mutationFn: (id: string) => adminCreatorsApi.toggleVerified(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'creators'] }); toast.success('Verification updated'); },
    onError: () => toast.error('Failed to update'),
  });

  const tierMutation = useMutation({
    mutationFn: ({ id, tier }: { id: string; tier: string }) => adminCreatorsApi.updateTier(id, tier),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'creators'] }); toast.success('Tier updated'); },
    onError: () => toast.error('Failed to update tier'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminCreatorsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'creators'] }); toast.success('Creator deleted'); setConfirmDelete(null); },
    onError: () => toast.error('Failed to delete'),
  });

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Creators</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage creator profiles, tiers, and verification</p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Select value={tierFilter} onValueChange={(v) => { setTierFilter(v === 'all' ? '' : v); setPage(1); }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All tiers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tiers</SelectItem>
              {TIERS.map((t) => (
                <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-gray-400">Loading...</div>
            ) : creators.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">No creators found</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-3 text-left">Creator</th>
                    <th className="px-4 py-3 text-left">Tier</th>
                    <th className="px-4 py-3 text-left">Verified</th>
                    <th className="px-4 py-3 text-left">Stats</th>
                    <th className="px-4 py-3 text-left">Onboarded</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {creators.map((c: any) => (
                    <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {c.profileImageUrl ? (
                            <img src={c.profileImageUrl} className="w-8 h-8 rounded-full object-cover flex-shrink-0" alt="" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-gray-500">
                              {c.displayName?.[0]?.toUpperCase() ?? '?'}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{c.displayName}</p>
                            <p className="text-xs text-gray-500">{c.user?.email ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={c.creatorTier}
                          onValueChange={(tier) => tierMutation.mutate({ id: c.id, tier })}
                        >
                          <SelectTrigger className={`h-7 w-28 text-xs border font-medium capitalize ${tierBadge[c.creatorTier as Tier] ?? tierBadge.basic}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIERS.map((t) => (
                              <SelectItem key={t} value={t} className="text-xs capitalize">{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => verifyMutation.mutate(c.id)}
                          className={`flex items-center gap-1.5 text-xs font-medium transition-colors px-2.5 py-1 rounded-full border ${
                            c.isVerified
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <BadgeCheck className="w-3.5 h-3.5" />
                          {c.isVerified ? 'Verified' : 'Unverified'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Package className="w-3 h-3" />{c.totalProducts ?? 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />{c.totalContent ?? 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${c.isOnboardingComplete ? 'text-green-600' : 'text-gray-400'}`}>
                          {c.isOnboardingComplete ? '✓ Complete' : '✗ Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setConfirmDelete({ id: c.id, name: c.displayName })}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">{meta.total} creators total</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="flex items-center text-sm text-gray-600 px-2">{page} / {meta.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page === meta.totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete creator profile?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 mt-2">
            This removes <strong>{confirmDelete?.name}</strong>'s creator profile. Their user account remains. This cannot be undone.
          </p>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
