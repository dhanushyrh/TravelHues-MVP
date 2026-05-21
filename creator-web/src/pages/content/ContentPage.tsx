import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Upload,
  Video,
  ImageIcon,
  Layers,
  Eye,
  Heart,
  Plus,
  X,
  MoreVertical,
  Trash2,
  Edit2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { contentApi } from '@/api/content.api';
import { mediaApi } from '@/api/media.api';
import { formatNumber } from '@/lib/utils';
import type { Content } from '@/types';

const uploadSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  caption: z.string().max(500).optional(),
  type: z.enum(['reel', 'photo', 'carousel']),
  destination: z.string().optional(),
});

type UploadFormData = z.infer<typeof uploadSchema>;

const TYPE_ICONS: Record<string, React.ElementType> = {
  reel: Video,
  photo: ImageIcon,
  carousel: Layers,
};

function ContentCard({
  item,
  onDelete,
  onTogglePublish,
}: {
  item: Content;
  onDelete: (id: string) => void;
  onTogglePublish: (item: Content) => void;
}) {
  const Icon = TYPE_ICONS[item.type] || Video;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-video bg-gray-100 relative">
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon className="w-10 h-10 text-gray-300" />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="text-xs capitalize backdrop-blur-sm">
            <Icon className="w-3 h-3 mr-1" />
            {item.type}
          </Badge>
        </div>
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center hover:bg-white">
                <MoreVertical className="w-4 h-4 text-gray-600" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onTogglePublish(item)}>
                <Edit2 className="w-4 h-4 mr-2" />
                {item.isPublished ? 'Unpublish' : 'Publish'}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => onDelete(item.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Eye className="w-3 h-3" />
            {formatNumber(item.viewCount)}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Heart className="w-3 h-3" />
            {formatNumber(item.likeCount)}
          </span>
          <div className="ml-auto">
            <Badge variant={item.isPublished ? 'success' : 'outline'} className="text-xs">
              {item.isPublished ? 'Published' : 'Draft'}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContentPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { type: 'photo' },
  });

  const typeValue = watch('type');

  const { data: contentData, isLoading } = useQuery({
    queryKey: ['content', activeTab],
    queryFn: () =>
      contentApi.list({ type: activeTab === 'all' ? undefined : activeTab }),
    select: (res) => {
      const d = res.data?.data || res.data;
      return (Array.isArray(d) ? d : (d?.data ?? [])) as Content[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
      toast.success('Content deleted');
    },
    onError: () => toast.error('Failed to delete'),
  });

  const toggleMutation = useMutation({
    mutationFn: (item: Content) =>
      item.isPublished ? contentApi.unpublish(item.id) : contentApi.publish(item.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
      toast.success('Updated');
    },
    onError: () => toast.error('Failed to update'),
  });

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setMediaFile(file);
  }, []);

  const addTag = () => {
    const val = tagInput.trim();
    if (val && !tags.includes(val)) setTags([...tags, val]);
    setTagInput('');
  };

  const onSubmit = async (data: UploadFormData) => {
    setIsUploading(true);
    try {
      let mediaUrl: string | undefined;
      if (mediaFile) {
        const res = await mediaApi.upload(mediaFile);
        mediaUrl = res.data?.data?.url;
      }
      await contentApi.create({ ...data, tags, mediaUrl });
      queryClient.invalidateQueries({ queryKey: ['content'] });
      toast.success('Content uploaded!');
      setUploadOpen(false);
      reset();
      setTags([]);
      setMediaFile(null);
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Content</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Manage your reels, photos, and carousels
            </p>
          </div>
          <Button onClick={() => setUploadOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Content
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="reel">Reels</TabsTrigger>
            <TabsTrigger value="photo">Photos</TabsTrigger>
            <TabsTrigger value="carousel">Carousel</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-xl overflow-hidden">
                <Skeleton className="aspect-video" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : contentData && contentData.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {contentData.map((item) => (
              <ContentCard
                key={item.id}
                item={item}
                onDelete={(id) => deleteMutation.mutate(id)}
                onTogglePublish={(c) => toggleMutation.mutate(c)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Video className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No content yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Upload your first reel, photo, or carousel
            </p>
            <Button className="mt-4" onClick={() => setUploadOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Upload Content
            </Button>
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Content</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>
                Title <span className="text-red-500">*</span>
              </Label>
              <Input placeholder="e.g. Sunset at Santorini" {...register('title')} />
              {errors.title && (
                <p className="text-xs text-red-500">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Caption</Label>
              <Textarea
                placeholder="Write a caption..."
                rows={3}
                {...register('caption')}
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Content Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={typeValue}
                onValueChange={(v) =>
                  setValue('type', v as 'reel' | 'photo' | 'carousel')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reel">Reel</SelectItem>
                  <SelectItem value="photo">Photo</SelectItem>
                  <SelectItem value="carousel">Carousel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Destination</Label>
              <Input
                placeholder="e.g. Bali, Indonesia"
                {...register('destination')}
              />
            </div>

            {/* File Upload */}
            <div className="space-y-1.5">
              <Label>Media File</Label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragging
                    ? 'border-primary-400 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-300'
                }`}
              >
                {mediaFile ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{mediaFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setMediaFile(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="w-6 h-6 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      Drag & drop or{' '}
                      <span className="text-primary-500">click to upload</span>
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,video/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setMediaFile(f);
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
                      addTag();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="sm" onClick={addTag}>
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-700"
                    >
                      #{t}
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setUploadOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </span>
                ) : (
                  'Upload'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
