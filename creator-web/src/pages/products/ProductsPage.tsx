import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import {
  Plus,
  Package,
  Pencil,
  Trash2,
  MapPin,
  Compass,
  FileText,
  Briefcase,
  Globe2,
  MoreVertical,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { productsApi } from '@/api/products.api';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/types';

const TYPE_ICONS: Record<string, React.ElementType> = {
  activity: Compass,
  stay: MapPin,
  itinerary: FileText,
  package: Briefcase,
  visa: Globe2,
};

const TYPE_COLORS: Record<string, string> = {
  activity: 'bg-orange-50 text-orange-700 border-orange-100',
  stay: 'bg-blue-50 text-blue-700 border-blue-100',
  itinerary: 'bg-purple-50 text-purple-700 border-purple-100',
  package: 'bg-green-50 text-green-700 border-green-100',
  visa: 'bg-pink-50 text-pink-700 border-pink-100',
};

function ProductRow({
  product,
  onDelete,
  onTogglePublish,
}: {
  product: Product;
  onDelete: (id: string) => void;
  onTogglePublish: (p: Product) => void;
}) {
  const Icon = TYPE_ICONS[product.type] || Package;

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-sm transition-shadow">
      <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
        {product.coverImageUrl ? (
          <img
            src={product.coverImageUrl}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon className="w-6 h-6 text-gray-400" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{product.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${
              TYPE_COLORS[product.type] || 'bg-gray-50 text-gray-700'
            }`}
          >
            <Icon className="w-3 h-3 mr-1" />
            {product.type}
          </span>
          <span className="text-sm font-semibold text-gray-700">
            {formatCurrency(product.price)}
          </span>
          <span className="text-xs text-gray-400">{product.totalSold} sold</span>
        </div>
      </div>

      <Badge variant={product.isPublished ? 'success' : 'outline'} className="flex-shrink-0">
        {product.isPublished ? 'Published' : 'Draft'}
      </Badge>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onTogglePublish(product)}>
            <Pencil className="w-4 h-4 mr-2" />
            {product.isPublished ? 'Unpublish' : 'Publish'}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600"
            onClick={() => onDelete(product.id)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default function ProductsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', activeTab],
    queryFn: () =>
      productsApi.list({ type: activeTab === 'all' ? undefined : activeTab }),
    select: (res) => {
      const d = res.data?.data || res.data;
      return (Array.isArray(d) ? d : (d?.data ?? [])) as Product[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted');
    },
    onError: () => toast.error('Failed to delete product'),
  });

  const toggleMutation = useMutation({
    mutationFn: (p: Product) =>
      p.isPublished ? productsApi.unpublish(p.id) : productsApi.publish(p.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated');
    },
    onError: () => toast.error('Failed to update product'),
  });

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Products</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Activities, stays, itineraries, packages, and visa services
            </p>
          </div>
          <Button onClick={() => navigate({ to: '/products/new' })}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="stay">Stay</TabsTrigger>
            <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
            <TabsTrigger value="package">Package</TabsTrigger>
            <TabsTrigger value="visa">Visa</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="space-y-3">
            {products.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                onDelete={(id) => deleteMutation.mutate(id)}
                onTogglePublish={(p) => toggleMutation.mutate(p)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No products yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Create your first product to start earning
            </p>
            <Button className="mt-4" onClick={() => navigate({ to: '/products/new' })}>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
