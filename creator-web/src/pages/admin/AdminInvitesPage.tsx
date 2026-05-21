import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Copy, Trash2, Mail } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { adminInvitesApi } from '@/api/admin.api';
import { cn } from '@/lib/utils';

// ── Inline types ──────────────────────────────────────────────────────────────
type InviteStatus = 'pending' | 'used' | 'revoked' | 'expired';

interface CreatorInvite {
  id: string;
  email: string;
  token: string;
  status: InviteStatus;
  expiresAt: string;
  createdAt: string;
  notes?: string;
}

interface InviteStats {
  total: number;
  pending: number;
  used: number;
  revoked: number;
  expired: number;
}

interface InviteListResponse {
  data: CreatorInvite[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

// ── Zod schema ────────────────────────────────────────────────────────────────
const inviteSchema = z.object({
  email: z.string().email('Enter a valid email'),
  notes: z.string().optional(),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

// ── Status badge ──────────────────────────────────────────────────────────────
const statusStyles: Record<InviteStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  used: 'bg-green-100 text-green-700',
  revoked: 'bg-red-100 text-red-700',
  expired: 'bg-gray-100 text-gray-500',
};

function StatusBadge({ status }: { status: InviteStatus }) {
  return (
    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full capitalize', statusStyles[status])}>
      {status}
    </span>
  );
}

// ── Date formatter ────────────────────────────────────────────────────────────
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Invite row ────────────────────────────────────────────────────────────────
function InviteRow({
  invite,
  onRevoke,
  onCopyLink,
}: {
  invite: CreatorInvite;
  onRevoke: () => void;
  onCopyLink: () => void;
}) {
  const isPending = invite.status === 'pending';

  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-900">{invite.email}</p>
          <StatusBadge status={invite.status} />
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
          <span>Created: {formatDate(invite.createdAt)}</span>
          <span>Expires: {formatDate(invite.expiresAt)}</span>
          {invite.notes && (
            <span className="italic text-gray-400">{invite.notes}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {isPending && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCopyLink}
              className="h-8 gap-1.5 text-xs text-gray-600"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy Link
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRevoke}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminInvitesPage() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: invitesData, isLoading: isLoadingInvites } = useQuery({
    queryKey: ['admin', 'invites'],
    queryFn: () => adminInvitesApi.list({ limit: 100 }),
    select: (res) => {
      const d = res.data?.data ?? res.data;
      if (Array.isArray(d)) return { data: d as CreatorInvite[], meta: { total: d.length } } as InviteListResponse;
      return d as InviteListResponse;
    },
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['admin', 'invites', 'stats'],
    queryFn: () => adminInvitesApi.stats(),
    select: (res) => (res.data?.data ?? res.data) as InviteStats,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: InviteFormValues) => adminInvitesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'invites'] });
      setIsAddOpen(false);
      reset();
      toast.success('Invite sent');
    },
    onError: () => toast.error('Failed to create invite'),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => adminInvitesApi.revoke(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'invites'] });
      toast.success('Invite revoked');
    },
    onError: () => toast.error('Failed to revoke invite'),
  });

  const handleRevoke = (invite: CreatorInvite) => {
    if (window.confirm(`Revoke invite for ${invite.email}?`)) {
      revokeMutation.mutate(invite.id);
    }
  };

  const handleCopyLink = (invite: CreatorInvite) => {
    const link = `${window.location.origin}/auth/accept-invite?token=${invite.token}`;
    navigator.clipboard.writeText(link).then(
      () => toast.success('Link copied to clipboard'),
      () => toast.error('Failed to copy link')
    );
  };

  const invites = invitesData?.data ?? [];

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Creator Invites</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage invitations for new creators.</p>
          </div>
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Invite
          </Button>
        </div>

        {/* Stats chips */}
        {!isLoadingStats && stats && (
          <div className="flex items-center gap-2 flex-wrap mb-6">
            {[
              { label: 'Total', count: stats.total, color: 'bg-gray-100 text-gray-700' },
              { label: 'Pending', count: stats.pending, color: 'bg-yellow-100 text-yellow-700' },
              { label: 'Used', count: stats.used, color: 'bg-green-100 text-green-700' },
              { label: 'Revoked', count: stats.revoked, color: 'bg-red-100 text-red-700' },
              { label: 'Expired', count: stats.expired, color: 'bg-gray-100 text-gray-500' },
            ].map(({ label, count, color }) => (
              <span key={label} className={cn('text-xs font-medium px-3 py-1 rounded-full', color)}>
                {label}: {count}
              </span>
            ))}
          </div>
        )}

        {/* List */}
        {isLoadingInvites ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
          </div>
        ) : invites.length === 0 ? (
          <div className="text-center py-16 text-gray-400 bg-white rounded-lg border border-gray-200">
            <Mail className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No invites yet. Create your first invite.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {invites.map((invite) => (
              <InviteRow
                key={invite.id}
                invite={invite}
                onRevoke={() => handleRevoke(invite)}
                onCopyLink={() => handleCopyLink(invite)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Invite Dialog */}
      <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) reset(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Invite</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                className="mt-1"
                placeholder="creator@example.com"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                className="mt-1"
                rows={2}
                placeholder="Optional notes about this invite..."
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Sending...' : 'Send Invite'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
