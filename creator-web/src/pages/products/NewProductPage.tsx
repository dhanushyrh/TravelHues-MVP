import React, { useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Compass,
  MapPin,
  FileText,
  Briefcase,
  Globe2,
  Upload,
  X,
  Plus,
  Trash2,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { productsApi } from '@/api/products.api';
import { mediaApi } from '@/api/media.api';

// ── Product types ─────────────────────────────────────────────────────────────
type ProductType = 'activity' | 'stay' | 'itinerary' | 'package' | 'visa';

const PRODUCT_TYPES = [
  {
    id: 'activity' as ProductType,
    label: 'Activity',
    desc: 'Guided treks, experiences, and tours',
    icon: Compass,
    colorClass: 'border-orange-200 hover:border-orange-400 hover:bg-orange-50',
    iconClass: 'text-orange-500',
  },
  {
    id: 'stay' as ProductType,
    label: 'Stay',
    desc: 'Hotels, villas, and guesthouses',
    icon: MapPin,
    colorClass: 'border-blue-200 hover:border-blue-400 hover:bg-blue-50',
    iconClass: 'text-blue-500',
  },
  {
    id: 'itinerary' as ProductType,
    label: 'Itinerary',
    desc: 'Detailed day-by-day trip plans',
    icon: FileText,
    colorClass: 'border-purple-200 hover:border-purple-400 hover:bg-purple-50',
    iconClass: 'text-purple-500',
  },
  {
    id: 'package' as ProductType,
    label: 'Package',
    desc: 'All-inclusive travel bundles',
    icon: Briefcase,
    colorClass: 'border-green-200 hover:border-green-400 hover:bg-green-50',
    iconClass: 'text-green-500',
  },
  {
    id: 'visa' as ProductType,
    label: 'Visa Help',
    desc: 'Visa documentation assistance',
    icon: Globe2,
    colorClass: 'border-pink-200 hover:border-pink-400 hover:bg-pink-50',
    iconClass: 'text-pink-500',
  },
];

// ── Unified form schema (all fields, required ones vary by type) ───────────────
const productFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.coerce.number().min(1, 'Price must be at least ₹1'),
  // Activity
  duration: z.coerce.number().optional(),
  difficulty: z.string().optional(),
  groupSize: z.coerce.number().optional(),
  meetingPoint: z.string().optional(),
  // Stay
  propertyType: z.string().optional(),
  starRating: z.coerce.number().optional(),
  address: z.string().optional(),
  // Itinerary
  totalDays: z.coerce.number().optional(),
  highlights: z.string().optional(),
  days: z
    .array(z.object({ title: z.string(), description: z.string() }))
    .optional(),
  // Package (uses duration, groupSize from above)
  // Visa
  fromCountry: z.string().optional(),
  toCountry: z.string().optional(),
  visaType: z.string().optional(),
  processingTime: z.string().optional(),
  successRate: z.coerce.number().optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

// ── ProductForm component ─────────────────────────────────────────────────────
function ProductForm({ type }: { type: ProductType }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [amenityInput, setAmenityInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues:
      type === 'itinerary'
        ? { days: [{ title: 'Day 1', description: '' }] }
        : {},
  });

  const {
    fields: dayFields,
    append: addDay,
    remove: removeDay,
  } = useFieldArray({ control, name: 'days' });

  const handleCoverChange = useCallback((file: File) => {
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setCoverPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const createMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created successfully!');
      navigate({ to: '/products' });
    },
    onError: () => toast.error('Failed to create product'),
  });

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    try {
      let coverImageUrl: string | undefined;
      if (coverFile) {
        const res = await mediaApi.upload(coverFile);
        coverImageUrl = res.data?.data?.url;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: Record<string, any> = {
        type,
        title: data.title,
        description: data.description,
        price: data.price,
        isPublished: false,
        ...(coverImageUrl ? { coverImageUrl } : {}),
        ...(tags.length > 0 ? { tags } : {}),
      };

      if (type === 'activity') {
        if (data.duration) payload.duration = data.duration;
        if (data.difficulty) payload.difficulty = data.difficulty;
        if (data.groupSize) payload.groupSize = data.groupSize;
        if (data.meetingPoint) payload.meetingPoint = data.meetingPoint;
      } else if (type === 'stay') {
        if (data.propertyType) payload.propertyType = data.propertyType;
        if (data.starRating) payload.starRating = data.starRating;
        if (data.address) payload.address = data.address;
        if (amenities.length > 0) payload.amenities = amenities;
      } else if (type === 'itinerary') {
        if (data.totalDays) payload.totalDays = data.totalDays;
        if (data.highlights)
          payload.highlights = data.highlights.split(',').map((s) => s.trim()).filter(Boolean);
        if (data.days)
          payload.days = data.days.map((day, i) => ({ day: i + 1, ...day }));
      } else if (type === 'package') {
        if (data.duration) payload.duration = data.duration;
        if (data.groupSize) payload.groupSize = data.groupSize;
      } else if (type === 'visa') {
        payload.fromCountry = data.fromCountry;
        payload.toCountry = data.toCountry;
        if (data.visaType) payload.visaType = data.visaType;
        if (data.processingTime) payload.processingTime = data.processingTime;
        if (data.successRate) payload.successRate = data.successRate;
      }

      await createMutation.mutateAsync(payload);
    } catch {
      // handled in mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeConfig = PRODUCT_TYPES.find((t) => t.id === type)!;
  const TypeIcon = typeConfig.icon;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Base details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TypeIcon className={`w-5 h-5 ${typeConfig.iconClass}`} />
            {typeConfig.label} Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>
              Title <span className="text-red-500">*</span>
            </Label>
            <Input placeholder="e.g. Sunrise Trek to Triund" {...register('title')} />
            {errors.title && (
              <p className="text-xs text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              rows={4}
              placeholder="Describe what's included, what to expect..."
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>
              Price (₹) <span className="text-red-500">*</span>
            </Label>
            <Input type="number" min="1" placeholder="2500" {...register('price')} />
            {errors.price && (
              <p className="text-xs text-red-500">{errors.price.message}</p>
            )}
          </div>

          {/* Cover image */}
          <div className="space-y-1.5">
            <Label>Cover Image</Label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files[0];
                if (file?.type.startsWith('image/')) handleCoverChange(file);
              }}
              className={`border-2 border-dashed rounded-lg overflow-hidden transition-colors ${
                isDragging
                  ? 'border-primary-400 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300'
              }`}
            >
              {coverPreview ? (
                <div className="relative">
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    className="w-full h-40 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCoverFile(null);
                      setCoverPreview(null);
                    }}
                    className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center hover:bg-white"
                  >
                    <X className="w-4 h-4 text-gray-700" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-2 py-8">
                  <Upload className="w-6 h-6 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    Drag & drop or{' '}
                    <span className="text-primary-500 font-medium">click to upload</span>
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCoverChange(file);
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const val = tagInput.trim();
                    if (val && !tags.includes(val)) setTags([...tags, val]);
                    setTagInput('');
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const val = tagInput.trim();
                  if (val && !tags.includes(val)) setTags([...tags, val]);
                  setTagInput('');
                }}
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-full text-xs text-gray-700"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => setTags(tags.filter((x) => x !== t))}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activity-specific */}
      {type === 'activity' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Duration (hours)</Label>
                <Input
                  type="number"
                  min="0.5"
                  step="0.5"
                  placeholder="4"
                  {...register('duration')}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Group Size</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="10"
                  {...register('groupSize')}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Difficulty</Label>
              <Select onValueChange={(v) => setValue('difficulty', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="challenging">Challenging</SelectItem>
                  <SelectItem value="extreme">Extreme</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Meeting Point</Label>
              <Input
                placeholder="e.g. Dharamshala Bus Stand"
                {...register('meetingPoint')}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stay-specific */}
      {type === 'stay' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stay Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Property Type</Label>
                <Select onValueChange={(v) => setValue('propertyType', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hotel">Hotel</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="resort">Resort</SelectItem>
                    <SelectItem value="guesthouse">Guesthouse</SelectItem>
                    <SelectItem value="hostel">Hostel</SelectItem>
                    <SelectItem value="camping">Camping</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Star Rating</Label>
                <Select
                  onValueChange={(v) => setValue('starRating', Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Stars" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {'⭐'.repeat(n)} ({n} star{n > 1 ? 's' : ''})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input placeholder="Full property address" {...register('address')} />
            </div>
            <div className="space-y-1.5">
              <Label>Amenities</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Swimming Pool"
                  value={amenityInput}
                  onChange={(e) => setAmenityInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = amenityInput.trim();
                      if (val && !amenities.includes(val))
                        setAmenities([...amenities, val]);
                      setAmenityInput('');
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const val = amenityInput.trim();
                    if (val && !amenities.includes(val))
                      setAmenities([...amenities, val]);
                    setAmenityInput('');
                  }}
                >
                  Add
                </Button>
              </div>
              {amenities.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {amenities.map((a) => (
                    <Badge
                      key={a}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() =>
                        setAmenities(amenities.filter((x) => x !== a))
                      }
                    >
                      {a} <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Itinerary-specific */}
      {type === 'itinerary' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Itinerary Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>
                Total Days <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                min="1"
                placeholder="7"
                {...register('totalDays')}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Highlights (comma-separated)</Label>
              <Input
                placeholder="e.g. Taj Mahal, Jaipur Palace, Varanasi Ghats"
                {...register('highlights')}
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Day-by-Day Plan</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    addDay({ title: `Day ${dayFields.length + 1}`, description: '' })
                  }
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Day
                </Button>
              </div>
              {dayFields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-4 border border-gray-200 rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary-600">
                      Day {index + 1}
                    </span>
                    {dayFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDay(index)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <Input
                    placeholder="Day title (e.g. Arrival in Delhi)"
                    {...register(`days.${index}.title`)}
                  />
                  <Textarea
                    rows={2}
                    placeholder="What happens this day..."
                    {...register(`days.${index}.description`)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Package-specific */}
      {type === 'package' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Package Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Duration (days)</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="7"
                  {...register('duration')}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Max Group Size</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="15"
                  {...register('groupSize')}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visa-specific */}
      {type === 'visa' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Visa Service Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>
                  From Country <span className="text-red-500">*</span>
                </Label>
                <Input placeholder="e.g. India" {...register('fromCountry')} />
              </div>
              <div className="space-y-1.5">
                <Label>
                  To Country <span className="text-red-500">*</span>
                </Label>
                <Input placeholder="e.g. Thailand" {...register('toCountry')} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Visa Type</Label>
              <Input
                placeholder="e.g. Tourist Visa, Business Visa"
                {...register('visaType')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Processing Time</Label>
                <Input
                  placeholder="e.g. 3-5 business days"
                  {...register('processingTime')}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Success Rate (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="95"
                  {...register('successRate')}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 pb-6">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating...
            </span>
          ) : (
            'Create Product (Draft)'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate({ to: '/products' })}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function NewProductPage() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<ProductType | null>(null);

  return (
    <AppLayout>
      <div className="p-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() =>
              selectedType
                ? setSelectedType(null)
                : navigate({ to: '/products' })
            }
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedType
                ? `New ${PRODUCT_TYPES.find((t) => t.id === selectedType)?.label}`
                : 'Choose Product Type'}
            </h1>
            {!selectedType && (
              <p className="text-gray-500 text-sm mt-0.5">
                What kind of product do you want to create?
              </p>
            )}
          </div>
        </div>

        {!selectedType ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PRODUCT_TYPES.map(({ id, label, desc, icon: Icon, colorClass, iconClass }) => (
              <button
                key={id}
                onClick={() => setSelectedType(id)}
                className={`p-6 border-2 rounded-xl text-left transition-all group ${colorClass}`}
              >
                <Icon className={`w-8 h-8 mb-3 ${iconClass}`} />
                <p className="font-semibold text-gray-900">{label}</p>
                <p className="text-sm text-gray-500 mt-1">{desc}</p>
              </button>
            ))}
          </div>
        ) : (
          <ProductForm type={selectedType} />
        )}
      </div>
    </AppLayout>
  );
}
