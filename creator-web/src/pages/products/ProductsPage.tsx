import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Package, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { productsApi } from '../../api/products.api';

const TYPE_LABELS: Record<string, string> = {
  activity: 'Activity', stay: 'Stay', itinerary: 'Itinerary',
  package: 'Package', visa_service: 'Visa Help', digital_download: 'Download',
};

export default function ProductsPage() {
  const [activeType, setActiveType] = useState('all');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['my-products', activeType],
    queryFn: () => productsApi.getMyProducts({ type: activeType === 'all' ? undefined : activeType }).then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['my-products'] }); toast.success('Product deleted'); },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) => productsApi.update(id, { isPublished }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-products'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Products</h1>
        <Link to="/products/new">
          <Button className="bg-indigo-600 hover:bg-indigo-700"><Plus className="h-4 w-4 mr-2" />Add Product</Button>
        </Link>
      </div>

      <Tabs value={activeType} onValueChange={setActiveType}>
        <TabsList className="flex-wrap">
          {['all', 'activity', 'stay', 'itinerary', 'package', 'visa_service'].map((t) => (
            <TabsTrigger key={t} value={t}>{t === 'all' ? 'All' : TYPE_LABELS[t]}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
      ) : !data?.data?.length ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No products yet. Add your first product to start selling!</p>
          <Link to="/products/new"><Button className="mt-4 bg-indigo-600 hover:bg-indigo-700">Add Product</Button></Link>
        </div>
      ) : (
        <div className="space-y-3">
          {data.data.map((product: any) => (
            <div key={product.id} className="flex items-center gap-4 p-4 bg-white border rounded-lg hover:shadow-sm">
              {product.coverImageUrl ? (
                <img src={product.coverImageUrl} alt={product.title} className="w-14 h-14 rounded object-cover flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <Package className="h-6 w-6 text-indigo-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{product.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{TYPE_LABELS[product.type] ?? product.type}</Badge>
                  <span className="text-sm font-medium text-indigo-600">₹{Number(product.price).toLocaleString('en-IN')}</span>
                  <span className="text-xs text-muted-foreground">{product.totalSold ?? 0} sold</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleMutation.mutate({ id: product.id, isPublished: !product.isPublished })}>
                  {product.isPublished
                    ? <ToggleRight className="h-5 w-5 text-green-500" />
                    : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                </button>
                <button onClick={() => deleteMutation.mutate(product.id)} className="text-red-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
