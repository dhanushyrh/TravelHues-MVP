import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from '@tanstack/react-router';
import {
  ArrowLeft,
  Globe,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  Youtube,
  Instagram,
  ExternalLink,
  MapPin,
  Clock,
  Utensils,
  Bed,
  Map,
  ChevronRight,
  Video,
  Lightbulb,
  Edit2,
  MoreVertical,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { storiesApi } from '@/api/stories.api';
import { productsApi } from '@/api/products.api';
import { contentApi } from '@/api/content.api';
import { tipsApi } from '@/api/tips.api';
import type { Story, Product, Content, Tip } from '@/types';

// Activity-like product types
const ACTIVITY_TYPES = ['activity', 'stay', 'food'];
const ITINERARY_TYPES = ['itinerary', 'package'];

const TYPE_ICON: Record<string, React.ReactNode> = {
  activity: <MapPin className="w-3.5 h-3.5" />,
  stay: <Bed className="w-3.5 h-3.5" />,
  food: <Utensils className="w-3.5 h-3.5" />,
  itinerary: <Map className="w-3.5 h-3.5" />,
  package: <Map className="w-3.5 h-3.5" />,
};

const TYPE_LABEL: Record<string, string> = {
  activity: 'Activity',
  stay: 'Stay',
  food: 'Food Place',
  itinerary: 'Itinerary',
  package: 'Package',
  visa_service: 'Visa',
};

// ── Product card in grid ──────────────────────────────────────────────────────
function ProductGridCard({
  product,
  onRemove,
}: {
  product: Product;
  onRemove: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden group hover:shadow-md transition-shadow">
      <div className="relative h-32 bg-gradient-to-br from-gray-100 to-gray-200">
        {product.coverImageUrl ? (
          <img src={product.coverImageUrl} alt={product.title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            {TYPE_ICON[product.type] ?? <MapPin className="w-6 h-6" />}
          </div>
        )}
        {/* Remove button on hover */}
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
        >
          <X className="w-3 h-3" />
        </button>
        {/* Type badge */}
        <div className="absolute bottom-2 left-2">
          <Badge className="text-xs bg-white/90 text-gray-700 gap-1 py-0.5">
            {TYPE_ICON[product.type]}
            {TYPE_LABEL[product.type] ?? product.type}
          </Badge>
        </div>
      </div>
      <div className="p-3">
        <p className="font-medium text-sm text-gray-900 truncate">{product.title}</p>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
          {product.price > 0 && <span>₹{product.price}</span>}
          {(product as any).duration && (
            <>
              <span>·</span>
              <span className="flex items-center gap-0.5">
                <Clock className="w-3 h-3" />
                {(product as any).duration}h
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Dashed "Add" card ─────────────────────────────────────────────────────────
function AddCard({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center h-full min-h-[160px] rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:border-primary-400 hover:bg-primary-50 transition-colors group"
    >
      <div className="w-9 h-9 rounded-full bg-white border border-gray-200 group-hover:border-primary-300 group-hover:bg-primary-50 flex items-center justify-center mb-2 transition-colors">
        <Plus className="w-4 h-4 text-gray-500 group-hover:text-primary-600" />
      </div>
      <p className="text-sm font-medium text-gray-500 group-hover:text-primary-700">{label}</p>
    </button>
  );
}

// ── Pick products dialog ──────────────────────────────────────────────────────
function PickProductDialog({
  open,
  onClose,
  title,
  typeFilter,
  alreadyAdded,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  typeFilter: string[];
  alreadyAdded: string[];
  onSelect: (id: string) => void;
}) {
  const [search, setSearch] = useState('');

  const { data } = useQuery({
    queryKey: ['my-products'],
    queryFn: () => productsApi.list({ limit: 100 }),
    enabled: open,
  });
  const allProducts: Product[] = (data as any)?.data?.data ?? [];
  const available = allProducts.filter(
    (p) => typeFilter.includes(p.type) && !alreadyAdded.includes(p.id),
  );
  const filtered = available.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()),
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
          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                {available.length === 0
                  ? 'No products available. Create one from the Products page.'
                  : 'No results found.'}
              </p>
            ) : (
              filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onSelect(p.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-left transition-colors border border-transparent hover:border-gray-200"
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-500">
                    {TYPE_ICON[p.type] ?? <MapPin className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.title}</p>
                    <p className="text-xs text-gray-500 capitalize">{TYPE_LABEL[p.type] ?? p.type}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
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

// ── Content / Tips section (collapsed at bottom) ──────────────────────────────
function ExtraSection({
  storyId,
  storyContent,
  storyTips,
}: {
  storyId: string;
  storyContent: Content[];
  storyTips: Tip[];
}) {
  const queryClient = useQueryClient();
  const [addContentOpen, setAddContentOpen] = useState(false);
  const [addTipsOpen, setAddTipsOpen] = useState(false);
  const [embedDialogOpen, setEmbedDialogOpen] = useState(false);
  const [embedUrl, setEmbedUrl] = useState('');
  const [expanded, setExpanded] = useState(false);

  const removeContentMutation = useMutation({
    mutationFn: (id: string) => storiesApi.removeContent(storyId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['story', storyId] }),
  });
  const removeTipMutation = useMutation({
    mutationFn: (id: string) => storiesApi.removeTip(storyId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['story', storyId] }),
  });

  const { data: myContent } = useQuery({
    queryKey: ['my-content'],
    queryFn: () => contentApi.list({ limit: 100 }),
    enabled: addContentOpen,
  });
  const { data: myTips } = useQuery({
    queryKey: ['my-tips'],
    queryFn: () => tipsApi.list({ limit: 100 }),
    enabled: addTipsOpen,
  });

  const allContent: Content[] = (myContent as any)?.data?.data ?? [];
  const allTips: Tip[] = (myTips as any)?.data?.data ?? [];
  const availableContent = allContent.filter((c) => !storyContent.some((s) => s.id === c.id));
  const availableTips = allTips.filter((t) => !storyTips.some((s) => s.id === t.id));

  const addContentMutation = useMutation({
    mutationFn: (id: string) => storiesApi.addContent(storyId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story', storyId] });
      setAddContentOpen(false);
    },
  });
  const addTipMutation = useMutation({
    mutationFn: (id: string) => storiesApi.addTip(storyId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story', storyId] });
      setAddTipsOpen(false);
    },
  });

  const handleEmbedAdd = () => {
    const isYoutube = embedUrl.includes('youtube.com') || embedUrl.includes('youtu.be');
    const isInstagram = embedUrl.includes('instagram.com');
    if (!isYoutube && !isInstagram) { toast.error('Only YouTube and Instagram URLs supported'); return; }
    contentApi.create({ title: isYoutube ? 'YouTube Reel' : 'Instagram Reel', type: 'reel', embedUrl, embedType: isYoutube ? 'youtube' : 'instagram' } as any)
      .then((res: any) => {
        addContentMutation.mutate(res.data?.id ?? res.data?.data?.id);
        setEmbedDialogOpen(false);
        setEmbedUrl('');
      })
      .catch(() => toast.error('Failed to add embed'));
  };

  const totalExtra = storyContent.length + storyTips.length;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Video className="w-4 h-4 text-gray-400" />
          Content & Tips
          {totalExtra > 0 && (
            <Badge variant="secondary" className="text-xs">{totalExtra}</Badge>
          )}
        </div>
        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50">
          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Reels & Photos</span>
              <div className="flex gap-1.5">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEmbedDialogOpen(true)}>
                  <Youtube className="w-3 h-3 mr-1" /> Embed
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAddContentOpen(true)}>
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
            </div>
            {storyContent.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">No content added yet</p>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {storyContent.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs">
                    {(c as any).embedType === 'youtube' ? <Youtube className="w-3 h-3 text-red-500" /> :
                      (c as any).embedType === 'instagram' ? <Instagram className="w-3 h-3 text-pink-500" /> :
                      <Video className="w-3 h-3 text-gray-400" />}
                    <span className="max-w-[120px] truncate text-gray-700">{c.title}</span>
                    <button onClick={() => removeContentMutation.mutate(c.id)} className="text-gray-400 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tips */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Travel Tips</span>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAddTipsOpen(true)}>
                <Plus className="w-3 h-3 mr-1" /> Add Tip
              </Button>
            </div>
            {storyTips.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">No tips added yet</p>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {storyTips.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs">
                    <Lightbulb className="w-3 h-3 text-amber-500" />
                    <span className="max-w-[120px] truncate text-gray-700">{t.title}</span>
                    <button onClick={() => removeTipMutation.mutate(t.id)} className="text-gray-400 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add dialogs */}
      <Dialog open={addContentOpen} onOpenChange={setAddContentOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Content</DialogTitle></DialogHeader>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {availableContent.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">No content available.</p>
            ) : (
              availableContent.map((c) => (
                <button key={c.id} onClick={() => addContentMutation.mutate(c.id)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm">
                  {c.title}
                </button>
              ))
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAddContentOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addTipsOpen} onOpenChange={setAddTipsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Travel Tip</DialogTitle></DialogHeader>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {availableTips.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">No tips available.</p>
            ) : (
              availableTips.map((t) => (
                <button key={t.id} onClick={() => addTipMutation.mutate(t.id)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm">
                  <p className="font-medium">{t.title}</p>
                  <p className="text-xs text-gray-500 capitalize">{t.category}</p>
                </button>
              ))
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAddTipsOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={embedDialogOpen} onOpenChange={setEmbedDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add YouTube / Instagram Embed</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div className="flex gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><Youtube className="w-3.5 h-3.5 text-red-500" />YouTube Shorts</span>
              <span className="flex items-center gap-1.5"><Instagram className="w-3.5 h-3.5 text-pink-500" />Instagram Reels</span>
            </div>
            <Input placeholder="https://youtube.com/shorts/... or https://instagram.com/reel/..." value={embedUrl} onChange={(e) => setEmbedUrl(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmbedDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEmbedAdd} disabled={!embedUrl.trim()}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function StoryDetailPage() {
  const { storyId } = useParams({ from: '/stories/$storyId' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [metaForm, setMetaForm] = useState({ title: '', description: '' });
  const [addActivityOpen, setAddActivityOpen] = useState(false);
  const [addItineraryOpen, setAddItineraryOpen] = useState(false);

  const { data: storyData, isLoading } = useQuery({
    queryKey: ['story', storyId],
    queryFn: () => storiesApi.getById(storyId),
    enabled: !!storyId,
  });
  const story = (storyData as any)?.data as Story | undefined;

  const updateMutation = useMutation({
    mutationFn: (data: Partial<{ title: string; description: string }>) =>
      storiesApi.update(storyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story', storyId] });
      toast.success('Story updated');
      setIsEditingMeta(false);
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => storiesApi.togglePublish(storyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story', storyId] });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });

  const addProductMutation = useMutation({
    mutationFn: (productId: string) => storiesApi.addProduct(storyId, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story', storyId] });
      setAddActivityOpen(false);
      setAddItineraryOpen(false);
      toast.success('Added to story');
    },
  });

  const removeProductMutation = useMutation({
    mutationFn: (productId: string) => storiesApi.removeProduct(storyId, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story', storyId] });
    },
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto p-6 space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!story) {
    return <AppLayout><div className="p-6 text-center text-gray-500">Story not found.</div></AppLayout>;
  }

  const allProducts = story.products ?? [];
  const activityProducts = allProducts.filter((p) => ACTIVITY_TYPES.includes(p.type));
  const itineraryProducts = allProducts.filter((p) => ITINERARY_TYPES.includes(p.type));
  const storyContent = story.content ?? [];
  const storyTips = story.tips ?? [];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <button
            onClick={() => navigate({ to: '/stories' })}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            All Stories
          </button>

          <div className="flex items-center gap-2">
            <Button
              variant={story.isPublished ? 'outline' : 'default'}
              size="sm"
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
            >
              {story.isPublished ? (
                <><EyeOff className="w-4 h-4 mr-1.5" />Unpublish</>
              ) : (
                <><Eye className="w-4 h-4 mr-1.5" />Publish</>
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  setMetaForm({ title: story.title, description: story.description ?? '' });
                  setIsEditingMeta(true);
                }}>
                  <Edit2 className="w-4 h-4 mr-2" />Edit details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Hero image */}
        <div className="mx-6 rounded-2xl overflow-hidden h-56 bg-gradient-to-br from-primary-200 to-primary-400 relative">
          {story.coverImageUrl ? (
            <img src={story.coverImageUrl} alt={story.title} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-primary-700">
              <Globe className="w-12 h-12 opacity-40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={`text-xs ${story.isPublished ? 'bg-green-500' : 'bg-gray-500'} text-white border-0`}>
                {story.isPublished ? 'Published' : 'Draft'}
              </Badge>
              {story.country && (
                <Badge className="text-xs bg-white/20 text-white border-0 backdrop-blur-sm">
                  <Globe className="w-3 h-3 mr-1" />
                  {story.country.name}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          {/* Title + description */}
          {isEditingMeta ? (
            <div className="mb-5 space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div>
                <Label>Story Title</Label>
                <Input
                  className="mt-1 text-lg font-semibold"
                  value={metaForm.title}
                  onChange={(e) => setMetaForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div>
                <Label>About this Story</Label>
                <Textarea
                  className="mt-1"
                  rows={3}
                  value={metaForm.description}
                  onChange={(e) => setMetaForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Describe the overview of the journey..."
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => updateMutation.mutate(metaForm)} disabled={updateMutation.isPending}>
                  <Save className="w-3.5 h-3.5 mr-1.5" />Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditingMeta(false)}>
                  <X className="w-3.5 h-3.5 mr-1" />Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="mb-5">
              <h1 className="text-2xl font-bold text-gray-900">{story.title}</h1>
              {story.description && (
                <p className="text-gray-600 text-sm mt-2 leading-relaxed">{story.description}</p>
              )}
            </div>
          )}

          {/* Stats row — inspired by Figma */}
          <div className="flex items-center gap-5 mb-6 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary-500" />
              <strong className="text-gray-900">{activityProducts.length}</strong>
              <span>Activities</span>
            </div>
            <div className="w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-1.5">
              <Map className="w-4 h-4 text-primary-500" />
              <strong className="text-gray-900">{itineraryProducts.length}</strong>
              <span>Itineraries</span>
            </div>
            {storyContent.length > 0 && (
              <>
                <div className="w-px h-4 bg-gray-200" />
                <div className="flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-gray-400" />
                  <strong className="text-gray-900">{storyContent.length}</strong>
                  <span>Content</span>
                </div>
              </>
            )}
          </div>

          {/* Activity / Itinerary tabs */}
          <Tabs defaultValue="activity" className="mb-6">
            <TabsList className="bg-transparent border-b border-gray-200 rounded-none p-0 h-auto w-full justify-start gap-0 mb-5">
              <TabsTrigger
                value="activity"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-500 data-[state=active]:text-primary-700 data-[state=active]:bg-transparent px-4 pb-2 pt-0 text-sm font-medium text-gray-500 bg-transparent shadow-none"
              >
                Activity
                {activityProducts.length > 0 && (
                  <span className="ml-1.5 text-xs bg-primary-100 text-primary-700 rounded-full px-1.5 py-0.5">
                    {activityProducts.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="itinerary"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-500 data-[state=active]:text-primary-700 data-[state=active]:bg-transparent px-4 pb-2 pt-0 text-sm font-medium text-gray-500 bg-transparent shadow-none"
              >
                Itinerary
                {itineraryProducts.length > 0 && (
                  <span className="ml-1.5 text-xs bg-primary-100 text-primary-700 rounded-full px-1.5 py-0.5">
                    {itineraryProducts.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Activity tab */}
            <TabsContent value="activity">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {/* Dashed add card first */}
                <AddCard label="Add Activity" onClick={() => setAddActivityOpen(true)} />
                {activityProducts.map((p) => (
                  <ProductGridCard
                    key={p.id}
                    product={p}
                    onRemove={() => removeProductMutation.mutate(p.id)}
                  />
                ))}
              </div>
            </TabsContent>

            {/* Itinerary tab */}
            <TabsContent value="itinerary">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                <AddCard label="Add Itinerary" onClick={() => setAddItineraryOpen(true)} />
                {itineraryProducts.map((p) => (
                  <ProductGridCard
                    key={p.id}
                    product={p}
                    onRemove={() => removeProductMutation.mutate(p.id)}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Content & Tips — collapsible extra section */}
          <ExtraSection
            storyId={storyId}
            storyContent={storyContent}
            storyTips={storyTips}
          />
        </div>
      </div>

      {/* Pick Activity dialog */}
      <PickProductDialog
        open={addActivityOpen}
        onClose={() => setAddActivityOpen(false)}
        title="Add Activity to Story"
        typeFilter={ACTIVITY_TYPES}
        alreadyAdded={allProducts.map((p) => p.id)}
        onSelect={(id) => addProductMutation.mutate(id)}
      />

      {/* Pick Itinerary dialog */}
      <PickProductDialog
        open={addItineraryOpen}
        onClose={() => setAddItineraryOpen(false)}
        title="Add Itinerary to Story"
        typeFilter={ITINERARY_TYPES}
        alreadyAdded={allProducts.map((p) => p.id)}
        onSelect={(id) => addProductMutation.mutate(id)}
      />
    </AppLayout>
  );
}
