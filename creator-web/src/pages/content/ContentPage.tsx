import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Video, Image, Grid3X3, Eye, Heart, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { contentApi } from '../../api/content.api';

const TYPE_ICONS: Record<string, React.ElementType> = { reel: Video, photo: Image, carousel: Grid3X3 };

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState('all');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['my-content', activeTab],
    queryFn: () => contentApi.getMyContent({ type: activeTab === 'all' ? undefined : activeTab }).then((r) => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contentApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['my-content'] }); toast.success('Content deleted'); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Content</h1>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" /> Upload Content
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="reel">Reels</TabsTrigger>
          <TabsTrigger value="photo">Photos</TabsTrigger>
          <TabsTrigger value="carousel">Carousel</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : !data?.data?.length ? (
        <div className="text-center py-16 text-muted-foreground">
          <Video className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No content yet. Upload your first reel or photo!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.data.map((item: any) => {
            const TypeIcon = TYPE_ICONS[item.type] ?? Image;
            return (
              <Card key={item.id} className="overflow-hidden group">
                <div className="relative bg-gray-100 h-40 flex items-center justify-center">
                  {item.thumbnailUrl ? (
                    <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <TypeIcon className="h-8 w-8 text-gray-400" />
                  )}
                  <button
                    onClick={() => deleteMutation.mutate(item.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <CardContent className="pt-3 pb-3">
                  <p className="font-medium text-sm truncate">{item.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-xs">{item.type}</Badge>
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{item.viewCount ?? 0}</span>
                    <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{item.likeCount ?? 0}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
