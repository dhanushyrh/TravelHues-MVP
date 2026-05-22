import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from '@tanstack/react-router';
import {
  ArrowLeft,
  Globe,
  MapPin,
  Package,
  Lightbulb,
  Video,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  Youtube,
  Instagram,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { storiesApi } from '@/api/stories.api';
import { productsApi } from '@/api/products.api';
import { tipsApi } from '@/api/tips.api';
import { contentApi } from '@/api/content.api';
import type { Story, Product, Tip, Content } from '@/types';

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  activity: 'Activity',
  stay: 'Stay',
  food: 'Food Place',
  itinerary: 'Itinerary',
  package: 'Package',
  visa_service: 'Visa Service',
};

export default function StoryDetailPage() {
  const { storyId } = useParams({ from: '/stories/$storyId' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [metaForm, setMetaForm] = useState({ title: '', description: '' });
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [addTipOpen, setAddTipOpen] = useState(false);
  const [addContentOpen, setAddContentOpen] = useState(false);
  const [embedDialogOpen, setEmbedDialogOpen] = useState(false);
  const [embedUrl, setEmbedUrl] = useState('');

  const { data: storyData, isLoading } = useQuery({
    queryKey: ['story', storyId],
    queryFn: () => storiesApi.getById(storyId),
    enabled: !!storyId,
  });

  const story = (storyData as any)?.data as Story | undefined;

  const { data: productsData } = useQuery({
    queryKey: ['my-products'],
    queryFn: () => productsApi.list({ limit: 100 }),
  });
  const allProducts: Product[] = (productsData as any)?.data?.data ?? [];

  const { data: tipsData } = useQuery({
    queryKey: ['my-tips'],
    queryFn: () => tipsApi.list({ limit: 100 }),
  });
  const allTips: Tip[] = (tipsData as any)?.data?.data ?? [];

  const { data: contentData } = useQuery({
    queryKey: ['my-content'],
    queryFn: () => contentApi.list({ limit: 100 }),
  });
  const allContent: Content[] = (contentData as any)?.data?.data ?? [];

  const updateMutation = useMutation({
    mutationFn: (data: Partial<{ title: string; description: string }>) =>
      storiesApi.update(storyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story', storyId] });
      toast.success('Story updated');
      setIsEditingMeta(false);
    },
    onError: () => toast.error('Failed to update story'),
  });

  const publishMutation = useMutation({
    mutationFn: () => storiesApi.togglePublish(storyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story', storyId] });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      toast.success(story?.isPublished ? 'Story unpublished' : 'Story published');
    },
  });

  const addProductMutation = useMutation({
    mutationFn: (productId: string) => storiesApi.addProduct(storyId, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story', storyId] });
      toast.success('Product added to story');
      setAddProductOpen(false);
    },
  });

  const removeProductMutation = useMutation({
    mutationFn: (productId: string) => storiesApi.removeProduct(storyId, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story', storyId] });
      toast.success('Product removed');
    },
  });

  const addTipMutation = useMutation({
    mutationFn: (tipId: string) => storiesApi.addTip(storyId, tipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story', storyId] });
      toast.success('Tip added to story');
      setAddTipOpen(false);
    },
  });

  const removeTipMutation = useMutation({
    mutationFn: (tipId: string) => storiesApi.removeTip(storyId, tipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story', storyId] });
      toast.success('Tip removed');
    },
  });

  const addContentMutation = useMutation({
    mutationFn: (contentId: string) => storiesApi.addContent(storyId, contentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story', storyId] });
      toast.success('Content added to story');
      setAddContentOpen(false);
    },
  });

  const removeContentMutation = useMutation({
    mutationFn: (contentId: string) => storiesApi.removeContent(storyId, contentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story', storyId] });
      toast.success('Content removed');
    },
  });

  const handleEmbedAdd = () => {
    if (!embedUrl.trim()) return;
    // Detect embed type and create content with embed
    const isYoutube = embedUrl.includes('youtube.com') || embedUrl.includes('youtu.be');
    const isInstagram = embedUrl.includes('instagram.com');
    if (!isYoutube && !isInstagram) {
      toast.error('Only YouTube and Instagram URLs are supported');
      return;
    }

    contentApi.create({
      title: isYoutube ? 'YouTube Reel' : 'Instagram Reel',
      type: 'reel',
      embedUrl,
      embedType: isYoutube ? 'youtube' : 'instagram',
    } as any).then((res: any) => {
      const newContent = res.data;
      addContentMutation.mutate(newContent.id);
      setEmbedDialogOpen(false);
      setEmbedUrl('');
    }).catch(() => toast.error('Failed to add embed'));
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-6 max-w-4xl mx-auto">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-40 w-full mb-4" />
          <Skeleton className="h-60 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!story) {
    return (
      <AppLayout>
        <div className="p-6 text-center text-gray-500">Story not found</div>
      </AppLayout>
    );
  }

  const storyProducts = story.products ?? [];
  const storyTips = story.tips ?? [];
  const storyContent = story.content ?? [];

  const availableProducts = allProducts.filter(
    (p) => !storyProducts.some((sp) => sp.id === p.id),
  );
  const availableTips = allTips.filter(
    (t) => !storyTips.some((st) => st.id === t.id),
  );
  const availableContent = allContent.filter(
    (c) => !storyContent.some((sc) => sc.id === c.id),
  );

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: '/stories' })}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            {isEditingMeta ? (
              <div className="flex items-center gap-2">
                <Input
                  value={metaForm.title}
                  onChange={(e) => setMetaForm((f) => ({ ...f, title: e.target.value }))}
                  className="text-lg font-bold h-9 max-w-xs"
                />
                <Button
                  size="sm"
                  onClick={() => updateMutation.mutate({ title: metaForm.title, description: metaForm.description })}
                  disabled={updateMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditingMeta(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1
                  className="text-2xl font-bold text-gray-900 truncate cursor-pointer hover:text-primary-600"
                  onClick={() => {
                    setMetaForm({ title: story.title, description: story.description ?? '' });
                    setIsEditingMeta(true);
                  }}
                >
                  {story.title}
                </h1>
                <Badge variant={story.isPublished ? 'default' : 'secondary'}>
                  {story.isPublished ? 'Published' : 'Draft'}
                </Badge>
              </div>
            )}
            {story.country && (
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                <Globe className="w-3.5 h-3.5" />
                {story.country.name}
              </div>
            )}
          </div>
          <Button
            variant={story.isPublished ? 'outline' : 'default'}
            size="sm"
            onClick={() => publishMutation.mutate()}
            disabled={publishMutation.isPending}
          >
            {story.isPublished ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Unpublish
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Publish
              </>
            )}
          </Button>
        </div>

        {/* Description (edit mode) */}
        {isEditingMeta && (
          <div className="mb-4">
            <Label>Description</Label>
            <Textarea
              value={metaForm.description}
              onChange={(e) => setMetaForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="mt-1"
              placeholder="Describe this story..."
            />
          </div>
        )}
        {!isEditingMeta && story.description && (
          <p className="text-gray-600 text-sm mb-6">{story.description}</p>
        )}

        {/* Tabs */}
        <Tabs defaultValue="products">
          <TabsList className="mb-4">
            <TabsTrigger value="products">
              <Package className="w-4 h-4 mr-1.5" />
              Products ({storyProducts.length})
            </TabsTrigger>
            <TabsTrigger value="tips">
              <Lightbulb className="w-4 h-4 mr-1.5" />
              Tips ({storyTips.length})
            </TabsTrigger>
            <TabsTrigger value="content">
              <Video className="w-4 h-4 mr-1.5" />
              Content ({storyContent.length})
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            <div className="flex justify-end mb-3">
              <Button size="sm" onClick={() => setAddProductOpen(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Add Product
              </Button>
            </div>
            {storyProducts.length === 0 ? (
              <EmptyState
                icon={<Package className="w-8 h-8 text-gray-300" />}
                message="No products added yet"
                action={{ label: 'Add Product', onClick: () => setAddProductOpen(true) }}
              />
            ) : (
              <div className="space-y-2">
                {storyProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{product.title}</p>
                      <p className="text-xs text-gray-500 capitalize">
                        {PRODUCT_TYPE_LABELS[product.type] ?? product.type}
                        {product.price ? ` · ₹${product.price}` : ''}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700 h-8 w-8"
                      onClick={() => removeProductMutation.mutate(product.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tips Tab */}
          <TabsContent value="tips">
            <div className="flex justify-end mb-3">
              <Button size="sm" onClick={() => setAddTipOpen(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Add Tip
              </Button>
            </div>
            {storyTips.length === 0 ? (
              <EmptyState
                icon={<Lightbulb className="w-8 h-8 text-gray-300" />}
                message="No tips added yet"
                action={{ label: 'Add Tip', onClick: () => setAddTipOpen(true) }}
              />
            ) : (
              <div className="space-y-2">
                {storyTips.map((tip) => (
                  <div
                    key={tip.id}
                    className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{tip.title}</p>
                      <p className="text-xs text-gray-500 capitalize">{tip.category}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700 h-8 w-8"
                      onClick={() => removeTipMutation.mutate(tip.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content">
            <div className="flex justify-end gap-2 mb-3">
              <Button size="sm" variant="outline" onClick={() => setEmbedDialogOpen(true)}>
                <Youtube className="w-4 h-4 mr-1" />
                Add YouTube / Instagram
              </Button>
              <Button size="sm" onClick={() => setAddContentOpen(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Add Content
              </Button>
            </div>
            {storyContent.length === 0 ? (
              <EmptyState
                icon={<Video className="w-8 h-8 text-gray-300" />}
                message="No content added yet"
                action={{ label: 'Add Content', onClick: () => setAddContentOpen(true) }}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {storyContent.map((item) => (
                  <ContentCard
                    key={item.id}
                    content={item}
                    onRemove={() => removeContentMutation.mutate(item.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Product Dialog */}
      <SelectItemDialog
        open={addProductOpen}
        onClose={() => setAddProductOpen(false)}
        title="Add Product to Story"
        items={availableProducts.map((p) => ({
          id: p.id,
          label: p.title,
          sublabel: PRODUCT_TYPE_LABELS[p.type] ?? p.type,
        }))}
        onSelect={(id) => addProductMutation.mutate(id)}
        emptyMessage="All your products are already added, or you have no products."
      />

      {/* Add Tip Dialog */}
      <SelectItemDialog
        open={addTipOpen}
        onClose={() => setAddTipOpen(false)}
        title="Add Tip to Story"
        items={availableTips.map((t) => ({
          id: t.id,
          label: t.title,
          sublabel: t.category,
        }))}
        onSelect={(id) => addTipMutation.mutate(id)}
        emptyMessage="All your tips are already added, or you have no tips."
      />

      {/* Add Content Dialog */}
      <SelectItemDialog
        open={addContentOpen}
        onClose={() => setAddContentOpen(false)}
        title="Add Content to Story"
        items={availableContent.map((c) => ({
          id: c.id,
          label: c.title,
          sublabel: c.type,
        }))}
        onSelect={(id) => addContentMutation.mutate(id)}
        emptyMessage="All your content is already added, or you have no content."
      />

      {/* Embed URL Dialog */}
      <Dialog open={embedDialogOpen} onOpenChange={setEmbedDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add YouTube / Instagram Embed</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-3 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <Youtube className="w-4 h-4 text-red-500" />
                YouTube Shorts / Reels
              </div>
              <div className="flex items-center gap-1.5">
                <Instagram className="w-4 h-4 text-pink-500" />
                Instagram Reels
              </div>
            </div>
            <div>
              <Label>Video URL</Label>
              <Input
                className="mt-1"
                placeholder="https://youtube.com/shorts/... or https://instagram.com/reel/..."
                value={embedUrl}
                onChange={(e) => setEmbedUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmbedDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEmbedAdd} disabled={!embedUrl.trim()}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

// Shared helper components

function EmptyState({
  icon,
  message,
  action,
}: {
  icon: React.ReactNode;
  message: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
      {icon}
      <p className="text-sm text-gray-500 mt-2">{message}</p>
      {action && (
        <Button size="sm" variant="outline" className="mt-3" onClick={action.onClick}>
          <Plus className="w-4 h-4 mr-1" />
          {action.label}
        </Button>
      )}
    </div>
  );
}

function SelectItemDialog({
  open,
  onClose,
  title,
  items,
  onSelect,
  emptyMessage,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  items: { id: string; label: string; sublabel?: string }[];
  onSelect: (id: string) => void;
  emptyMessage: string;
}) {
  const [search, setSearch] = useState('');
  const filtered = items.filter(
    (i) =>
      i.label.toLowerCase().includes(search.toLowerCase()) ||
      (i.sublabel && i.sublabel.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="max-h-72 overflow-y-auto space-y-1">
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">{emptyMessage}</p>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.id}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => onSelect(item.id)}
                >
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  {item.sublabel && (
                    <p className="text-xs text-gray-500 capitalize">{item.sublabel}</p>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ContentCard({
  content,
  onRemove,
}: {
  content: Content & { embedUrl?: string; embedType?: string };
  onRemove: () => void;
}) {
  const isEmbed = !!(content as any).embedUrl;
  const embedType = (content as any).embedType;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {isEmbed ? (
        <div className="p-3 bg-gray-50 flex items-center gap-2">
          {embedType === 'youtube' ? (
            <Youtube className="w-5 h-5 text-red-500 flex-shrink-0" />
          ) : (
            <Instagram className="w-5 h-5 text-pink-500 flex-shrink-0" />
          )}
          <a
            href={(content as any).embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline truncate flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {(content as any).embedUrl}
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </a>
        </div>
      ) : content.thumbnailUrl ? (
        <img
          src={content.thumbnailUrl}
          alt={content.title}
          className="w-full h-24 object-cover"
        />
      ) : (
        <div className="h-24 bg-gray-100 flex items-center justify-center">
          <Video className="w-6 h-6 text-gray-400" />
        </div>
      )}
      <div className="p-2 flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{content.title}</p>
          <p className="text-xs text-gray-500 capitalize">{content.type}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-red-500 hover:text-red-700 h-7 w-7 flex-shrink-0"
          onClick={onRemove}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
