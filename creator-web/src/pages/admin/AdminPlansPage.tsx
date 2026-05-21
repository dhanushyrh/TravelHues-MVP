import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { adminPlansApi } from '@/api/admin.api';
import { cn, formatCurrency } from '@/lib/utils';

// ── Inline types ──────────────────────────────────────────────────────────────
type SubscriptionPlanType = 'creator_tier' | 'user_premium' | 'user_creator';
type BillingPeriod = 'monthly' | 'yearly';
type CreatorTier = 'basic' | 'pro' | 'premium';

interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  type: SubscriptionPlanType;
  billingPeriod: BillingPeriod;
  price: number;
  currency: string;
  creatorTier?: CreatorTier;
  maxProducts?: number | null;
  maxContent?: number | null;
  commissionRate?: number | null;
  trialDays?: number | null;
  isActive: boolean;
  createdAt: string;
}

// ── Zod schema ────────────────────────────────────────────────────────────────
const planSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['creator_tier', 'user_premium', 'user_creator'], { required_error: 'Type is required' }),
  billingPeriod: z.enum(['monthly', 'yearly'], { required_error: 'Billing period is required' }),
  price: z.coerce.number().min(0, 'Price must be >= 0'),
  currency: z.string().optional(),
  creatorTier: z.enum(['basic', 'pro', 'premium']).optional(),
  maxProducts: z.coerce.number().int().positive().nullable().optional(),
  maxContent: z.coerce.number().int().positive().nullable().optional(),
  commissionRate: z.coerce.number().min(0).max(100).nullable().optional(),
  trialDays: z.coerce.number().int().min(0).nullable().optional(),
  isActive: z.boolean().optional(),
});

type PlanFormValues = z.infer<typeof planSchema>;

// ── Toggle switch ─────────────────────────────────────────────────────────────
function ToggleSwitch({ isActive, onClick }: { isActive: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative inline-flex h-5 w-9 rounded-full transition-colors focus:outline-none',
        isActive ? 'bg-green-500' : 'bg-gray-300'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform mt-0.5',
          isActive ? 'translate-x-4' : 'translate-x-0.5'
        )}
      />
    </button>
  );
}

// ── Badge helpers ─────────────────────────────────────────────────────────────
const planTypeColors: Record<SubscriptionPlanType, string> = {
  creator_tier: 'bg-violet-100 text-violet-700',
  user_premium: 'bg-blue-100 text-blue-700',
  user_creator: 'bg-indigo-100 text-indigo-700',
};

const tierColors: Record<CreatorTier, string> = {
  basic: 'bg-gray-100 text-gray-600',
  pro: 'bg-amber-100 text-amber-700',
  premium: 'bg-emerald-100 text-emerald-700',
};

// ── Plan form ─────────────────────────────────────────────────────────────────
function PlanForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: {
  defaultValues?: Partial<PlanFormValues>;
  onSubmit: (data: PlanFormValues) => void;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      currency: 'INR',
      isActive: true,
      ...defaultValues,
    },
  });

  const planType = watch('type');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Name *</Label>
        <Input id="name" {...register('name')} className="mt-1" placeholder="e.g. Pro Monthly" />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          className="mt-1"
          rows={2}
          placeholder="Short description..."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Type *</Label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="creator_tier">Creator Tier</SelectItem>
                  <SelectItem value="user_premium">User Premium</SelectItem>
                  <SelectItem value="user_creator">User Creator</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>}
        </div>

        <div>
          <Label>Billing Period *</Label>
          <Controller
            name="billingPeriod"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.billingPeriod && <p className="text-red-500 text-xs mt-1">{errors.billingPeriod.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="price">Price *</Label>
          <Input
            id="price"
            type="number"
            min="0"
            step="0.01"
            {...register('price')}
            className="mt-1"
            placeholder="0"
          />
          {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
        </div>
        <div>
          <Label htmlFor="currency">Currency</Label>
          <Input id="currency" {...register('currency')} className="mt-1" placeholder="INR" />
        </div>
      </div>

      {planType === 'creator_tier' && (
        <div>
          <Label>Creator Tier</Label>
          <Controller
            name="creatorTier"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value ?? ''}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="maxProducts">Max Products</Label>
          <Input
            id="maxProducts"
            type="number"
            min="1"
            {...register('maxProducts')}
            className="mt-1"
            placeholder="∞"
          />
        </div>
        <div>
          <Label htmlFor="maxContent">Max Content</Label>
          <Input
            id="maxContent"
            type="number"
            min="1"
            {...register('maxContent')}
            className="mt-1"
            placeholder="∞"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="commissionRate">Commission Rate (%)</Label>
          <Input
            id="commissionRate"
            type="number"
            min="0"
            max="100"
            step="0.1"
            {...register('commissionRate')}
            className="mt-1"
            placeholder="e.g. 10"
          />
        </div>
        <div>
          <Label htmlFor="trialDays">Trial Days</Label>
          <Input
            id="trialDays"
            type="number"
            min="0"
            {...register('trialDays')}
            className="mt-1"
            placeholder="0"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="isActive"
          type="checkbox"
          {...register('isActive')}
          className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
        />
        <Label htmlFor="isActive">Active</Label>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ── Plan card row ─────────────────────────────────────────────────────────────
function PlanRow({
  plan,
  onToggle,
  onEdit,
  onDelete,
}: {
  plan: SubscriptionPlan;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-900">{plan.name}</p>
          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', planTypeColors[plan.type])}>
            {plan.type.replace('_', ' ')}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
            {plan.billingPeriod}
          </span>
          {plan.creatorTier && (
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', tierColors[plan.creatorTier])}>
              {plan.creatorTier}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
          <span className="font-semibold text-gray-800 text-sm">
            {formatCurrency(plan.price, plan.currency || 'INR')}
          </span>
          <span>
            Max products: {plan.maxProducts != null ? plan.maxProducts : '∞'}
          </span>
          <span>
            Max content: {plan.maxContent != null ? plan.maxContent : '∞'}
          </span>
          {plan.commissionRate != null && (
            <span>Commission: {plan.commissionRate}%</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <ToggleSwitch isActive={plan.isActive} onClick={onToggle} />
        <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 w-8 p-0">
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminPlansPage() {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SubscriptionPlan | null>(null);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: () => adminPlansApi.list(),
    select: (res) => {
      const d = res.data?.data ?? res.data;
      if (Array.isArray(d)) return d as SubscriptionPlan[];
      if (Array.isArray(d?.data)) return d.data as SubscriptionPlan[];
      return [] as SubscriptionPlan[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: PlanFormValues) => adminPlansApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] });
      setIsAddOpen(false);
      toast.success('Plan created');
    },
    onError: () => toast.error('Failed to create plan'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PlanFormValues> }) =>
      adminPlansApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] });
      setEditTarget(null);
      toast.success('Plan updated');
    },
    onError: () => toast.error('Failed to update plan'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => adminPlansApi.toggle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] });
      toast.success('Status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminPlansApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] });
      toast.success('Plan deleted');
    },
    onError: () => toast.error('Failed to delete plan'),
  });

  const handleDelete = (plan: SubscriptionPlan) => {
    if (window.confirm(`Delete plan "${plan.name}"? This cannot be undone.`)) {
      deleteMutation.mutate(plan.id);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage creator and user subscription plans.</p>
          </div>
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Plan
          </Button>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm bg-white rounded-lg border border-gray-200">
            No plans yet. Add your first plan.
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {plans.map((plan) => (
              <PlanRow
                key={plan.id}
                plan={plan}
                onToggle={() => toggleMutation.mutate(plan.id)}
                onEdit={() => setEditTarget(plan)}
                onDelete={() => handleDelete(plan)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Subscription Plan</DialogTitle>
          </DialogHeader>
          <PlanForm
            onSubmit={(data) => createMutation.mutate(data)}
            isSubmitting={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Plan</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <PlanForm
              defaultValues={{
                name: editTarget.name,
                description: editTarget.description,
                type: editTarget.type,
                billingPeriod: editTarget.billingPeriod,
                price: editTarget.price,
                currency: editTarget.currency,
                creatorTier: editTarget.creatorTier,
                maxProducts: editTarget.maxProducts,
                maxContent: editTarget.maxContent,
                commissionRate: editTarget.commissionRate,
                trialDays: editTarget.trialDays,
                isActive: editTarget.isActive,
              }}
              onSubmit={(data) => updateMutation.mutate({ id: editTarget.id, data })}
              isSubmitting={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
