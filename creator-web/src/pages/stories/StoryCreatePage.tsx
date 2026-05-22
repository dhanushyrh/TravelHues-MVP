import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Globe, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { storiesApi } from '@/api/stories.api';
import { destinationsApi } from '@/api/destinations.api';
import type { Destination } from '@/types';

export default function StoryCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    countryId: '',
    coverImageUrl: '',
  });

  const { data: countriesData, isLoading: loadingCountries } = useQuery({
    queryKey: ['countries'],
    queryFn: () => destinationsApi.listCountries(),
  });

  const countries: Destination[] = (countriesData as any)?.data?.data ??
    (countriesData as any)?.data ?? [];

  const createMutation = useMutation({
    mutationFn: () =>
      storiesApi.create({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        countryId: form.countryId,
        coverImageUrl: form.coverImageUrl.trim() || undefined,
      }),
    onSuccess: (res: any) => {
      const story = res.data;
      toast.success('Story created!');
      navigate({ to: '/stories/$storyId', params: { storyId: story.id } });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to create story');
    },
  });

  const isValid = form.title.trim().length > 0 && form.countryId.length > 0;

  return (
    <AppLayout>
      <div className="p-6 max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: '/stories' })}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">New Story</h1>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-lg text-sm text-primary-700">
            <BookOpen className="w-5 h-5 flex-shrink-0" />
            <span>
              A Story is a country-based collection. Add activities, stays, food places, travel
              tips, and content (YouTube/Instagram reels) related to that country.
            </span>
          </div>

          <div>
            <Label>Story Title *</Label>
            <Input
              className="mt-1"
              placeholder="e.g. Amazing Indonesia"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              maxLength={200}
            />
          </div>

          <div>
            <Label>Country *</Label>
            <Select
              value={form.countryId}
              onValueChange={(v) => setForm((f) => ({ ...f, countryId: v }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={loadingCountries ? 'Loading...' : 'Select a country'} />
              </SelectTrigger>
              <SelectContent>
                {countries.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-gray-400" />
                      {c.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Only countries enabled by admin are available.
            </p>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              className="mt-1"
              placeholder="Briefly describe what this story covers..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div>
            <Label>Cover Image URL</Label>
            <Input
              className="mt-1"
              placeholder="https://..."
              value={form.coverImageUrl}
              onChange={(e) => setForm((f) => ({ ...f, coverImageUrl: e.target.value }))}
            />
            {form.coverImageUrl && (
              <img
                src={form.coverImageUrl}
                alt="cover"
                className="mt-2 h-24 w-full object-cover rounded-lg border border-gray-200"
                onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
              />
            )}
          </div>

          <Button
            className="w-full"
            onClick={() => createMutation.mutate()}
            disabled={!isValid || createMutation.isPending}
          >
            {createMutation.isPending ? 'Creating...' : 'Create Story'}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
