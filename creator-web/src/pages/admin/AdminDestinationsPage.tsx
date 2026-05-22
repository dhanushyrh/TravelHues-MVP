import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Search, Pencil, Trash2, X } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
import { adminDestinationsApi } from '@/api/admin.api';
import { cn } from '@/lib/utils';

// ── Inline types ──────────────────────────────────────────────────────────────
interface Destination {
  id: string;
  name: string;
  type: 'country' | 'city' | 'region';
  parentId?: string;
  parentName?: string;
  parent?: { id: string; name: string; type: string };
  continent?: string;
  countryCode?: string;
  currency?: string;
  timezone?: string;
  bestTimeToVisit?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

// ── Zod schema ────────────────────────────────────────────────────────────────
const destinationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['country', 'city'], { required_error: 'Type is required' }),
  parentId: z.string().optional(),
  continent: z.string().optional(),
  countryCode: z.string().optional(),
  currency: z.string().optional(),
  timezone: z.string().optional(),
  bestTimeToVisit: z.string().optional(),
  description: z.string().optional(),
});

type DestinationFormValues = z.infer<typeof destinationSchema>;

type ActiveFilter = 'all' | 'active' | 'inactive';

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

// ── Destination form ──────────────────────────────────────────────────────────
function DestinationForm({
  defaultValues,
  countries,
  onSubmit,
  isSubmitting,
}: {
  defaultValues?: Partial<DestinationFormValues>;
  countries: Destination[];
  onSubmit: (data: DestinationFormValues) => void;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<DestinationFormValues>({
    resolver: zodResolver(destinationSchema),
    defaultValues: {
      type: 'country',
      ...defaultValues,
    },
  });

  const selectedType = watch('type');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Name *</Label>
        <Input id="name" {...register('name')} className="mt-1" placeholder="e.g. India" />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>

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
                <SelectItem value="country">Country</SelectItem>
                <SelectItem value="city">City</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>}
      </div>

      {selectedType === 'city' && (
        <div>
          <Label>Parent Country</Label>
          <Controller
            name="parentId"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value ?? ''}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      )}

      {selectedType === 'country' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="continent">Continent</Label>
            <Input id="continent" {...register('continent')} className="mt-1" placeholder="Asia" />
          </div>
          <div>
            <Label htmlFor="countryCode">Country Code</Label>
            <Input id="countryCode" {...register('countryCode')} className="mt-1" placeholder="IN" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="currency">Currency</Label>
          <Input id="currency" {...register('currency')} className="mt-1" placeholder="INR" />
        </div>
        <div>
          <Label htmlFor="timezone">Timezone</Label>
          <Input id="timezone" {...register('timezone')} className="mt-1" placeholder="Asia/Kolkata" />
        </div>
      </div>

      <div>
        <Label htmlFor="bestTimeToVisit">Best Time to Visit</Label>
        <Input
          id="bestTimeToVisit"
          {...register('bestTimeToVisit')}
          className="mt-1"
          placeholder="October to March"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          className="mt-1"
          rows={3}
          placeholder="Short description..."
        />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ── Destination row ───────────────────────────────────────────────────────────
function DestinationRow({
  destination,
  onToggle,
  onEdit,
  onDelete,
}: {
  destination: Destination;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const parentName = destination.parent?.name ?? destination.parentName ?? '—';

  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{destination.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">{parentName}</p>
      </div>
      <span
        className={cn(
          'text-xs px-2 py-0.5 rounded-full font-medium',
          destination.isActive
            ? 'bg-green-50 text-green-700'
            : 'bg-gray-100 text-gray-500'
        )}
      >
        {destination.isActive ? 'Active' : 'Inactive'}
      </span>
      <div className="flex items-center gap-3 flex-shrink-0">
        <ToggleSwitch isActive={destination.isActive} onClick={onToggle} />
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

// ── Tab panel ─────────────────────────────────────────────────────────────────
function DestinationTabPanel({
  type,
  search,
  activeFilter,
  countries,
  onEditDestination,
}: {
  type: 'country' | 'city';
  search: string;
  activeFilter: ActiveFilter;
  countries: Destination[];
  onEditDestination: (dest: Destination) => void;
}) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'destinations', type, search, activeFilter],
    queryFn: () =>
      adminDestinationsApi.list({
        type,
        search: search || undefined,
        limit: 100,
        ...(activeFilter !== 'all' ? { includeInactive: activeFilter === 'inactive' ? 'true' : 'false' } : { includeInactive: 'true' }),
      }),
    select: (res) => {
      const d = res.data?.data ?? res.data;
      let list: Destination[] = [];
      if (Array.isArray(d)) list = d as Destination[];
      else if (Array.isArray(d?.data)) list = d.data as Destination[];

      if (activeFilter === 'active') return list.filter((x) => x.isActive);
      if (activeFilter === 'inactive') return list.filter((x) => !x.isActive);
      return list;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => adminDestinationsApi.toggle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'destinations'] });
      toast.success('Status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDestinationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'destinations'] });
      toast.success('Destination deleted');
    },
    onError: () => toast.error('Failed to delete destination'),
  });

  const handleDelete = (dest: Destination) => {
    if (window.confirm(`Delete "${dest.name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(dest.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2 mt-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        No {type === 'country' ? 'countries' : 'cities'} found
        {search ? ` matching "${search}"` : ''}
        {activeFilter !== 'all' ? ` (${activeFilter} only)` : ''}.
      </div>
    );
  }

  return (
    <div className="mt-4 bg-white rounded-lg border border-gray-200 overflow-hidden">
      {data.map((dest) => (
        <DestinationRow
          key={dest.id}
          destination={dest}
          onToggle={() => toggleMutation.mutate(dest.id)}
          onEdit={() => onEditDestination(dest)}
          onDelete={() => handleDelete(dest)}
        />
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminDestinationsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'country' | 'city'>('country');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Destination | null>(null);

  const handleTabChange = (v: string) => {
    setActiveTab(v as 'country' | 'city');
    setSearch('');
    setActiveFilter('all');
  };

  // Fetch all countries (for parent selects in city form)
  const { data: countries = [] } = useQuery({
    queryKey: ['admin', 'destinations', 'country', '', 'all'],
    queryFn: () => adminDestinationsApi.list({ type: 'country', limit: 500, includeInactive: 'true' }),
    select: (res) => {
      const d = res.data?.data ?? res.data;
      if (Array.isArray(d)) return d as Destination[];
      if (Array.isArray(d?.data)) return d.data as Destination[];
      return [] as Destination[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: DestinationFormValues) => adminDestinationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'destinations'] });
      setIsAddOpen(false);
      toast.success('Destination created');
    },
    onError: () => toast.error('Failed to create destination'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DestinationFormValues> }) =>
      adminDestinationsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'destinations'] });
      setEditTarget(null);
      toast.success('Destination updated');
    },
    onError: () => toast.error('Failed to update destination'),
  });

  const hasFilters = search || activeFilter !== 'all';

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Destinations</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage countries and cities.</p>
          </div>
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Destination
          </Button>
        </div>

        {/* Search + Filter row */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={`Search ${activeTab === 'country' ? 'countries' : 'cities'}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v as ActiveFilter)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active only</SelectItem>
              <SelectItem value="inactive">Inactive only</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearch(''); setActiveFilter('all'); }}
              className="text-gray-500 hover:text-gray-700 px-2"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="country">Countries</TabsTrigger>
            <TabsTrigger value="city">Cities</TabsTrigger>
          </TabsList>

          {(['country', 'city'] as const).map((type) => (
            <TabsContent key={type} value={type}>
              <DestinationTabPanel
                type={type}
                search={search}
                activeFilter={activeFilter}
                countries={countries}
                onEditDestination={setEditTarget}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Destination</DialogTitle>
          </DialogHeader>
          <DestinationForm
            countries={countries}
            onSubmit={(data) => createMutation.mutate(data)}
            isSubmitting={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Destination</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <DestinationForm
              defaultValues={{
                name: editTarget.name,
                type: editTarget.type as 'country' | 'city',
                parentId: editTarget.parentId,
                continent: editTarget.continent,
                countryCode: editTarget.countryCode,
                currency: editTarget.currency,
                timezone: editTarget.timezone,
                bestTimeToVisit: editTarget.bestTimeToVisit,
                description: editTarget.description,
              }}
              countries={countries}
              onSubmit={(data) => updateMutation.mutate({ id: editTarget.id, data })}
              isSubmitting={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
