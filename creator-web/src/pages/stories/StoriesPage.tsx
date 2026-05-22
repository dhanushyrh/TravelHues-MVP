import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Plus, BookOpen, Globe, Eye, Trash2, Edit2, MoreVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { storiesApi } from '@/api/stories.api';
import type { Story } from '@/types';

export default function StoriesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Story | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['stories'],
    queryFn: () => storiesApi.list({ limit: 50 }),
  });

  const stories: Story[] = (data as any)?.data?.data ?? (data as any)?.data ?? [];

  const publishMutation = useMutation({
    mutationFn: (id: string) => storiesApi.togglePublish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      toast.success('Story updated');
    },
    onError: () => toast.error('Failed to update story'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => storiesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      toast.success('Story deleted');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to delete story'),
  });

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stories</h1>
            <p className="text-sm text-gray-500 mt-1">
              Create country-based story folders with activities, stays, food, tips, and content.
            </p>
          </div>
          <Button onClick={() => navigate({ to: '/stories/new' })}>
            <Plus className="w-4 h-4 mr-2" />
            New Story
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : stories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-700">No stories yet</h3>
            <p className="text-sm text-gray-500 mt-1 mb-6">
              Create your first story by selecting a country and adding your experiences.
            </p>
            <Button onClick={() => navigate({ to: '/stories/new' })}>
              <Plus className="w-4 h-4 mr-2" />
              Create Story
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                onEdit={() => navigate({ to: '/stories/$storyId', params: { storyId: story.id } })}
                onTogglePublish={() => publishMutation.mutate(story.id)}
                onDelete={() => setDeleteTarget(story)}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Story</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 py-2">
            Are you sure you want to delete "{deleteTarget?.title}"? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

interface StoryCardProps {
  story: Story;
  onEdit: () => void;
  onTogglePublish: () => void;
  onDelete: () => void;
}

function StoryCard({ story, onEdit, onTogglePublish, onDelete }: StoryCardProps) {
  const productCount = story.products?.length ?? 0;
  const tipCount = story.tips?.length ?? 0;
  const contentCount = story.content?.length ?? 0;

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={onEdit}
    >
      <div className="relative h-32 bg-gradient-to-br from-primary-100 to-primary-200">
        {story.coverImageUrl ? (
          <img
            src={story.coverImageUrl}
            alt={story.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Globe className="w-10 h-10 text-primary-400" />
          </div>
        )}
        <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 bg-white/80 hover:bg-white">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onTogglePublish}>
                <Eye className="w-4 h-4 mr-2" />
                {story.isPublished ? 'Unpublish' : 'Publish'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="absolute bottom-2 left-2">
          <Badge
            variant={story.isPublished ? 'default' : 'secondary'}
            className="text-xs"
          >
            {story.isPublished ? 'Published' : 'Draft'}
          </Badge>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate">{story.title}</h3>
        {story.country && (
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            <Globe className="w-3 h-3" />
            {story.country.name}
          </p>
        )}
        <div className="flex gap-3 mt-3 text-xs text-gray-500">
          <span>{productCount} products</span>
          <span>{tipCount} tips</span>
          <span>{contentCount} content</span>
        </div>
      </div>
    </div>
  );
}
