import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowLeft, Mountain, Building, Map, Box, FileText } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { productsApi } from '../../api/products.api';

const PRODUCT_TYPES = [
  { id: 'activity', label: 'Activity', desc: 'Treks, experiences, tours', icon: Mountain },
  { id: 'stay', label: 'Stay', desc: 'Hotels, villas, guesthouses', icon: Building },
  { id: 'itinerary', label: 'Itinerary', desc: 'Day-by-day trip plans', icon: Map },
  { id: 'package', label: 'Package', desc: 'All-inclusive bundles', icon: Box },
  { id: 'visa_service', label: 'Visa Help', desc: 'Visa documentation service', icon: FileText },
];

const baseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.coerce.number().min(1, 'Price must be at least ₹1'),
});
type BaseForm = z.infer<typeof baseSchema>;

export default function NewProductPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<BaseForm>({
    resolver: zodResolver(baseSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => productsApi.create(data),
    onSuccess: () => { toast.success('Product created!'); navigate('/products'); },
    onError: () => toast.error('Failed to create product'),
  });

  const onSubmit = (data: BaseForm) => {
    if (!selectedType) return toast.error('Please select a product type');
    createMutation.mutate({ ...data, type: selectedType, isPublished: false });
  };

  if (!selectedType) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/products')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-semibold">Choose Product Type</h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PRODUCT_TYPES.map(({ id, label, desc, icon: Icon }) => (
            <button key={id} onClick={() => setSelectedType(id)}
              className="p-5 border-2 rounded-xl text-left hover:border-indigo-500 hover:bg-indigo-50 transition group">
              <Icon className="h-7 w-7 text-indigo-500 mb-3" />
              <p className="font-semibold">{label}</p>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setSelectedType(null)} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-semibold">
          New {PRODUCT_TYPES.find((t) => t.id === selectedType)?.label}
        </h1>
      </div>
      <Card>
        <CardHeader><CardTitle>Product Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input id="title" {...register('title')} placeholder="E.g. Sunrise Trek to Triund" className="mt-1" />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" {...register('description')} rows={4} placeholder="Describe what's included..." className="mt-1" />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
            </div>
            <div>
              <Label htmlFor="price">Price (₹) *</Label>
              <Input id="price" type="number" {...register('price')} placeholder="2500" className="mt-1" />
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={createMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                {createMutation.isPending ? 'Creating...' : 'Create Product (Draft)'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/products')}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
