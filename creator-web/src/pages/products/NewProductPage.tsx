import React, { useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
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
  UtensilsCrossed,
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
import { LocationSearch, type LocationValue } from '@/components/ui/LocationSearch';
import { OpeningHoursEditor } from '@/components/ui/OpeningHoursEditor';
import {
  ItineraryBuilder,
  type ItineraryDetailsValue,
} from '@/components/products/ItineraryBuilder';
import { productsApi } from '@/api/products.api';
import { mediaApi } from '@/api/media.api';

// ── Product types ─────────────────────────────────────────────────────────────
type ProductType = 'activity' | 'stay' | 'itinerary' | 'package' | 'visa' | 'food';

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
    id: 'food' as ProductType,
    label: 'Food Place',
    desc: 'Restaurants, cafes, and food experiences',
    icon: UtensilsCrossed,
    colorClass: 'border-rose-200 hover:border-rose-400 hover:bg-rose-50',
    iconClass: 'text-rose-500',
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

// ── Form schema ───────────────────────────────────────────────────────────────
const productFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.coerce.number().min(1, 'Price must be at least ₹1'),
  // Activity
  duration: z.coerce.number().optional(),
  difficulty: z.string().optional(),
  groupSize: z.coerce.number().optional(),
  meetingPoint: z.string().optional(),
  website: z.string().optional(),
  phoneNumber: z.string().optional(),
  priceRange: z.string().optional(),
  subCategory: z.string().optional(),
  ageGroup: z.string().optional(),
  affiliateLink: z.string().optional(),
  estimatedCost: z.string().optional(),
  // Stay
  propertyType: z.string().optional(),
  starRating: z.coerce.number().optional(),
  // Food
  cuisine: z.string().optional(),
  // Package
  // Visa
  fromCountry: z.string().optional(),
  toCountry: z.string().optional(),
  visaType: z.string().optional(),
  processingTime: z.string().optional(),
  successRate: z.coerce.number().optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

// ── Tag chip helper ───────────────────────────────────────────────────────────
function TagChips({
  tags,
  input,
  onInputChange,
  onAdd,
  onRemove,
  placeholder,
}: {
  tags: string[];
  input: string;
  onInputChange: (v: string) => void;
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
  placeholder: string;
}) {
  const commit = () => {
    const v = input.trim();
    if (v && !tags.includes(v)) onAdd(v);
    onInputChange('');
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } }}
        />
        <Button type="button" variant="outline" size="sm" onClick={commit}>Add</Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span key={t} className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-full text-xs text-gray-700 cursor-pointer" onClick={() => onRemove(t)}>
              {t}<X className="w-3 h-3" />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Toggle pill ───────────────────────────────────────────────────────────────
function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
        value ? 'bg-[#E8342A]/10 border-[#E8342A]/40 text-[#E8342A]' : 'bg-gray-50 border-gray-200 text-gray-500'
      }`}
    >
      <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${value ? 'border-[#E8342A] bg-[#E8342A]' : 'border-gray-300'}`}>
        {value && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
      </span>
      {label}
    </button>
  );
}

// ── ProductForm ───────────────────────────────────────────────────────────────
function ProductForm({ type }: { type: ProductType }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Activity / Stay / Food — shared location & hours
  const [activityLocation, setActivityLocation] = useState<LocationValue | null>(null);
  const [activityHours, setActivityHours] = useState<Record<string, string>>({});
  const [seasonality, setSeasonality] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [amenityInput, setAmenityInput] = useState('');
  const [stayLocation, setStayLocation] = useState<LocationValue | null>(null);
  const [stayHours, setStayHours] = useState<Record<string, string>>({});
  const [foodLocation, setFoodLocation] = useState<LocationValue | null>(null);
  const [foodHours, setFoodHours] = useState<Record<string, string>>({});
  const [foodFeatures, setFoodFeatures] = useState<string[]>([]);
  const [foodFeatureInput, setFoodFeatureInput] = useState('');
  const [hasDineIn, setHasDineIn] = useState(true);
  const [hasTakeaway, setHasTakeaway] = useState(false);
  const [hasDelivery, setHasDelivery] = useState(false);

  // Itinerary
  const [itineraryDetails, setItineraryDetails] = useState<ItineraryDetailsValue>({
    days: [{ dayNumber: 1, title: 'Day 1', activities: [] }],
  });

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
  });

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
      let thumbnailUrl: string | undefined;
      if (coverFile) {
        const res = await mediaApi.upload(coverFile);
        thumbnailUrl = res.data?.data?.url;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: Record<string, any> = {
        type,
        title: data.title,
        description: data.description,
        price: data.price,
        isPublished: false,
        ...(thumbnailUrl ? { thumbnailUrl } : {}),
        ...(tags.length > 0 ? { tags } : {}),
      };

      if (type === 'activity') {
        payload.activityDetails = {
          durationHours: data.duration,
          maxGroupSize: data.groupSize,
          difficultyLevel: data.difficulty,
          meetingPoint: data.meetingPoint,
          website: data.website,
          phoneNumber: data.phoneNumber,
          priceRange: data.priceRange,
          subCategory: data.subCategory,
          ageGroup: data.ageGroup,
          affiliateLink: data.affiliateLink,
          estimatedCost: data.estimatedCost,
          seasonality: seasonality.length ? seasonality : undefined,
          address: activityLocation?.address,
          latitude: activityLocation?.latitude,
          longitude: activityLocation?.longitude,
          osmId: activityLocation?.osmId,
          openingHours: Object.keys(activityHours).length ? activityHours : undefined,
        };
      } else if (type === 'stay') {
        payload.stayDetails = {
          propertyType: data.propertyType,
          amenities: amenities.length ? amenities : undefined,
          website: data.website,
          phoneNumber: data.phoneNumber,
          priceRange: data.priceRange,
          address: stayLocation?.address,
          latitude: stayLocation?.latitude,
          longitude: stayLocation?.longitude,
          osmId: stayLocation?.osmId,
          openingHours: Object.keys(stayHours).length ? stayHours : undefined,
        };
      } else if (type === 'itinerary') {
        payload.itineraryDetails = {
          ...itineraryDetails,
          totalDays: itineraryDetails.totalDays ?? itineraryDetails.days?.length,
          days: (itineraryDetails.days ?? []).map((day, i) => ({ ...day, dayNumber: i + 1 })),
        };
      } else if (type === 'food') {
        payload.foodPlaceDetails = {
          cuisine: data.cuisine,
          priceRange: data.priceRange,
          website: data.website,
          phoneNumber: data.phoneNumber,
          hasDineIn,
          hasTakeaway,
          hasDelivery,
          features: foodFeatures.length ? foodFeatures : undefined,
          address: foodLocation?.address,
          latitude: foodLocation?.latitude,
          longitude: foodLocation?.longitude,
          osmId: foodLocation?.osmId,
          openingHours: Object.keys(foodHours).length ? foodHours : undefined,
        };
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
            <Label>Title <span className="text-red-500">*</span></Label>
            <Input placeholder="e.g. Sunrise Trek to Triund" {...register('title')} />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Description <span className="text-red-500">*</span></Label>
            <Textarea rows={4} placeholder="Describe what's included, what to expect..." {...register('description')} />
            {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Price (₹) <span className="text-red-500">*</span></Label>
            <Input type="number" min="1" placeholder="2500" {...register('price')} />
            {errors.price && <p className="text-xs text-red-500">{errors.price.message}</p>}
          </div>

          {/* Cover image */}
          <div className="space-y-1.5">
            <Label>Cover Image</Label>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault(); setIsDragging(false);
                const file = e.dataTransfer.files[0];
                if (file?.type.startsWith('image/')) handleCoverChange(file);
              }}
              className={`border-2 border-dashed rounded-lg overflow-hidden transition-colors ${isDragging ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-primary-300'}`}
            >
              {coverPreview ? (
                <div className="relative">
                  <img src={coverPreview} alt="Cover preview" className="w-full h-40 object-cover" />
                  <button type="button" onClick={() => { setCoverFile(null); setCoverPreview(null); }} className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center hover:bg-white">
                    <X className="w-4 h-4 text-gray-700" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-2 py-8">
                  <Upload className="w-6 h-6 text-gray-400" />
                  <span className="text-sm text-gray-500">Drag & drop or <span className="text-primary-500 font-medium">click to upload</span></span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleCoverChange(file); }} />
                </label>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label>Tags</Label>
            <TagChips
              tags={tags} input={tagInput}
              onInputChange={setTagInput}
              onAdd={(v) => setTags([...tags, v])}
              onRemove={(v) => setTags(tags.filter((t) => t !== v))}
              placeholder="Add tag and press Enter..."
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Activity ─────────────────────────────────────────────────────────── */}
      {type === 'activity' && (
        <Card>
          <CardHeader><CardTitle className="text-base">Activity Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <LocationSearch
              label="Meeting Point / Location"
              placeholder="Search for meeting point or activity venue…"
              value={activityLocation}
              onChange={setActivityLocation}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Duration (hours)</Label>
                <Input type="number" min="0.5" step="0.5" placeholder="4" {...register('duration')} />
              </div>
              <div className="space-y-1.5">
                <Label>Max Group Size</Label>
                <Input type="number" min="1" placeholder="10" {...register('groupSize')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Sub Category</Label>
                <Select onValueChange={(v) => setValue('subCategory', v)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trekking">Trekking</SelectItem>
                    <SelectItem value="water_sports">Water Sports</SelectItem>
                    <SelectItem value="cultural">Cultural</SelectItem>
                    <SelectItem value="adventure">Adventure</SelectItem>
                    <SelectItem value="wildlife">Wildlife</SelectItem>
                    <SelectItem value="city_tour">City Tour</SelectItem>
                    <SelectItem value="food_tour">Food Tour</SelectItem>
                    <SelectItem value="photography">Photography</SelectItem>
                    <SelectItem value="wellness">Wellness & Spa</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="nightlife">Nightlife</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Difficulty</Label>
                <Select onValueChange={(v) => setValue('difficulty', v)}>
                  <SelectTrigger><SelectValue placeholder="Select difficulty" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="challenging">Challenging</SelectItem>
                    <SelectItem value="extreme">Extreme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Age Group</Label>
                <Select onValueChange={(v) => setValue('ageGroup', v)}>
                  <SelectTrigger><SelectValue placeholder="Select age group" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_ages">All Ages</SelectItem>
                    <SelectItem value="kids_friendly">Kids Friendly (5+)</SelectItem>
                    <SelectItem value="teens_up">Teens &amp; Up (13+)</SelectItem>
                    <SelectItem value="adults_only">Adults Only (18+)</SelectItem>
                    <SelectItem value="seniors_ok">Seniors OK</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Estimated Cost</Label>
                <Input placeholder="e.g. ₹1,500–₹3,000 per person" {...register('estimatedCost')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Best Seasons</Label>
              <div className="flex flex-wrap gap-2">
                {['Jan–Mar', 'Apr–Jun', 'Jul–Sep', 'Oct–Dec', 'All Year'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSeasonality((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])}
                    className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                      seasonality.includes(s)
                        ? 'bg-primary-500 border-primary-500 text-white'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-primary-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Physical Meeting Point</Label>
              <Input placeholder="e.g. Dharamshala Bus Stand, Gate 3" {...register('meetingPoint')} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Reference Website</Label>
                <Input placeholder="https://..." {...register('website')} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input placeholder="+91 98765 43210" {...register('phoneNumber')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Affiliate / Booking Link</Label>
              <Input placeholder="https://affiliate.example.com/activity?ref=..." {...register('affiliateLink')} />
            </div>

            <div className="space-y-1.5">
              <Label>Price Range</Label>
              <Select onValueChange={(v) => setValue('priceRange', v)}>
                <SelectTrigger><SelectValue placeholder="Select price range" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="$">$ · Budget</SelectItem>
                  <SelectItem value="$$">$$ · Mid-range</SelectItem>
                  <SelectItem value="$$$">$$$ · Premium</SelectItem>
                  <SelectItem value="$$$$">$$$$ · Luxury</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <OpeningHoursEditor value={activityHours} onChange={setActivityHours} />
          </CardContent>
        </Card>
      )}

      {/* ── Stay ─────────────────────────────────────────────────────────────── */}
      {type === 'stay' && (
        <Card>
          <CardHeader><CardTitle className="text-base">Stay Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <LocationSearch
              label="Property Address"
              placeholder="Search for hotel, villa, or property…"
              value={stayLocation}
              onChange={setStayLocation}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Property Type</Label>
                <Select onValueChange={(v) => setValue('propertyType', v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
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
                <Select onValueChange={(v) => setValue('starRating', Number(v))}>
                  <SelectTrigger><SelectValue placeholder="Stars" /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={String(n)}>{'⭐'.repeat(n)} ({n} star{n > 1 ? 's' : ''})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Amenities</Label>
              <TagChips
                tags={amenities} input={amenityInput}
                onInputChange={setAmenityInput}
                onAdd={(v) => setAmenities([...amenities, v])}
                onRemove={(v) => setAmenities(amenities.filter((a) => a !== v))}
                placeholder="e.g. Swimming Pool"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Website</Label>
                <Input placeholder="https://..." {...register('website')} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input placeholder="+91 98765 43210" {...register('phoneNumber')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Price Range</Label>
              <Select onValueChange={(v) => setValue('priceRange', v)}>
                <SelectTrigger><SelectValue placeholder="Select price range" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="$">$ · Budget</SelectItem>
                  <SelectItem value="$$">$$ · Mid-range</SelectItem>
                  <SelectItem value="$$$">$$$ · Premium</SelectItem>
                  <SelectItem value="$$$$">$$$$ · Luxury</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <OpeningHoursEditor value={stayHours} onChange={setStayHours} />
          </CardContent>
        </Card>
      )}

      {/* ── Itinerary ─────────────────────────────────────────────────────────── */}
      {type === 'itinerary' && (
        <ItineraryBuilder value={itineraryDetails} onChange={setItineraryDetails} />
      )}

      {/* ── Food Place ────────────────────────────────────────────────────────── */}
      {type === 'food' && (
        <Card>
          <CardHeader><CardTitle className="text-base">Food Place Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <LocationSearch
              label="Restaurant / Café Location"
              placeholder="Search for restaurant or food place…"
              value={foodLocation}
              onChange={setFoodLocation}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Cuisine Type</Label>
                <Input placeholder="e.g. Indian, Italian, Thai" {...register('cuisine')} />
              </div>
              <div className="space-y-1.5">
                <Label>Price Range</Label>
                <Select onValueChange={(v) => setValue('priceRange', v)}>
                  <SelectTrigger><SelectValue placeholder="Select price range" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="$">$ · Under ₹300</SelectItem>
                    <SelectItem value="$$">$$ · ₹300–700</SelectItem>
                    <SelectItem value="$$$">$$$ · ₹700–1500</SelectItem>
                    <SelectItem value="$$$$">$$$$ · ₹1500+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Website</Label>
                <Input placeholder="https://..." {...register('website')} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input placeholder="+91 98765 43210" {...register('phoneNumber')} />
              </div>
            </div>

            {/* Service options */}
            <div className="space-y-1.5">
              <Label>Service Options</Label>
              <div className="flex flex-wrap gap-2">
                <Toggle value={hasDineIn} onChange={setHasDineIn} label="Dine-in" />
                <Toggle value={hasTakeaway} onChange={setHasTakeaway} label="Takeaway" />
                <Toggle value={hasDelivery} onChange={setHasDelivery} label="Delivery" />
              </div>
            </div>

            {/* Features */}
            <div className="space-y-1.5">
              <Label>Features</Label>
              <TagChips
                tags={foodFeatures} input={foodFeatureInput}
                onInputChange={setFoodFeatureInput}
                onAdd={(v) => setFoodFeatures([...foodFeatures, v])}
                onRemove={(v) => setFoodFeatures(foodFeatures.filter((f) => f !== v))}
                placeholder="e.g. Rooftop, Live Music, Vegan Options"
              />
            </div>

            <OpeningHoursEditor value={foodHours} onChange={setFoodHours} />
          </CardContent>
        </Card>
      )}

      {/* ── Package ───────────────────────────────────────────────────────────── */}
      {type === 'package' && (
        <Card>
          <CardHeader><CardTitle className="text-base">Package Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Duration (days)</Label>
                <Input type="number" min="1" placeholder="7" {...register('duration')} />
              </div>
              <div className="space-y-1.5">
                <Label>Max Group Size</Label>
                <Input type="number" min="1" placeholder="15" {...register('groupSize')} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Visa ─────────────────────────────────────────────────────────────── */}
      {type === 'visa' && (
        <Card>
          <CardHeader><CardTitle className="text-base">Visa Service Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>From Country <span className="text-red-500">*</span></Label>
                <Input placeholder="e.g. India" {...register('fromCountry')} />
              </div>
              <div className="space-y-1.5">
                <Label>To Country <span className="text-red-500">*</span></Label>
                <Input placeholder="e.g. Thailand" {...register('toCountry')} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Visa Type</Label>
              <Input placeholder="e.g. Tourist Visa, Business Visa" {...register('visaType')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Processing Time</Label>
                <Input placeholder="e.g. 3–5 business days" {...register('processingTime')} />
              </div>
              <div className="space-y-1.5">
                <Label>Success Rate (%)</Label>
                <Input type="number" min="0" max="100" placeholder="95" {...register('successRate')} />
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
              Creating…
            </span>
          ) : (
            'Create Product (Draft)'
          )}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate({ to: '/products' })}>
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
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => selectedType ? setSelectedType(null) : navigate({ to: '/products' })}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedType ? `New ${PRODUCT_TYPES.find((t) => t.id === selectedType)?.label}` : 'Choose Product Type'}
            </h1>
            {!selectedType && (
              <p className="text-gray-500 text-sm mt-0.5">What kind of product do you want to create?</p>
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
