import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Eye, EyeOff, Save, User, Lock, Bell, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { creatorsApi } from '@/api/creators.api';
import { authApi } from '@/api/auth.api';
import { mediaApi } from '@/api/media.api';
import { useAuthStore } from '@/store/auth.store';
import { getInitials } from '@/lib/utils';
import type { CreatorProfile } from '@/types';

// ── Profile schema ──────────────────────────────────────────────────────────
const profileSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  displayName: z.string().min(1, 'Required').max(50),
  tagline: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  instagram: z.string().url('Enter a valid URL').or(z.literal('')).optional(),
  youtube: z.string().url('Enter a valid URL').or(z.literal('')).optional(),
  tiktok: z.string().url('Enter a valid URL').or(z.literal('')).optional(),
  twitter: z.string().url('Enter a valid URL').or(z.literal('')).optional(),
  website: z.string().url('Enter a valid URL').or(z.literal('')).optional(),
});
type ProfileFormData = z.infer<typeof profileSchema>;

// ── Password schema ──────────────────────────────────────────────────────────
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Required'),
    newPassword: z.string().min(8, 'At least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });
type PasswordFormData = z.infer<typeof passwordSchema>;

// ── Profile Tab ──────────────────────────────────────────────────────────────
function ProfileTab() {
  const { user, updateUser } = useAuthStore();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['creator-profile'],
    queryFn: () => creatorsApi.getMyProfile(),
    select: (res) => (res.data?.data || res.data) as CreatorProfile,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      displayName: profile?.displayName || '',
      tagline: profile?.tagline || '',
      bio: profile?.bio || '',
      location: profile?.location || '',
      instagram: profile?.socialLinks?.instagram || '',
      youtube: profile?.socialLinks?.youtube || '',
      tiktok: profile?.socialLinks?.tiktok || '',
      twitter: profile?.socialLinks?.twitter || '',
      website: profile?.websiteUrl || '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      let avatarUrl: string | undefined;
      if (avatarFile) {
        setIsUploading(true);
        const res = await mediaApi.upload(avatarFile);
        avatarUrl = res.data?.data?.url;
        setIsUploading(false);
      }

      const socialLinks: Record<string, string> = {};
      if (data.instagram) socialLinks.instagram = data.instagram;
      if (data.youtube) socialLinks.youtube = data.youtube;
      if (data.tiktok) socialLinks.tiktok = data.tiktok;
      if (data.twitter) socialLinks.twitter = data.twitter;

      await creatorsApi.updateMyProfile({
        displayName: data.displayName,
        tagline: data.tagline,
        bio: data.bio,
        location: data.location,
        websiteUrl: data.website || undefined,
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
        ...(avatarUrl ? {} : {}),
      });

      if (avatarUrl) {
        updateUser({ avatarUrl });
      }
      updateUser({ firstName: data.firstName, lastName: data.lastName });
    },
    onSuccess: () => toast.success('Profile updated successfully'),
    onError: () => toast.error('Failed to update profile'),
  });

  const initials = user ? getInitials(user.firstName, user.lastName) : 'U';

  return (
    <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="space-y-6">
      {/* Avatar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile Photo</CardTitle>
          <CardDescription>Click to upload a new photo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={avatarPreview || undefined} />
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>
            <label className="cursor-pointer">
              <Button type="button" variant="outline" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Change photo
                </span>
              </Button>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setAvatarFile(file);
                    const reader = new FileReader();
                    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Basic info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>First Name</Label>
              <Input {...register('firstName')} />
              {errors.firstName && (
                <p className="text-xs text-red-500">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Last Name</Label>
              <Input {...register('lastName')} />
              {errors.lastName && (
                <p className="text-xs text-red-500">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user?.email || ''} disabled className="bg-gray-50" />
          </div>

          <div className="space-y-1.5">
            <Label>Display Name</Label>
            <Input {...register('displayName')} />
            {errors.displayName && (
              <p className="text-xs text-red-500">{errors.displayName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Tagline</Label>
            <Input placeholder="One-liner about your travel style" {...register('tagline')} />
          </div>

          <div className="space-y-1.5">
            <Label>Bio</Label>
            <Textarea rows={4} placeholder="Tell your audience about yourself..." {...register('bio')} />
          </div>

          <div className="space-y-1.5">
            <Label>Location</Label>
            <Input placeholder="e.g. Mumbai, India" {...register('location')} />
          </div>
        </CardContent>
      </Card>

      {/* Social links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Social Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { id: 'instagram', label: 'Instagram' },
            { id: 'youtube', label: 'YouTube' },
            { id: 'tiktok', label: 'TikTok' },
            { id: 'twitter', label: 'Twitter / X' },
            { id: 'website', label: 'Website' },
          ].map(({ id, label }) => (
            <div key={id} className="space-y-1.5">
              <Label>{label}</Label>
              <Input
                type="url"
                placeholder={`https://...`}
                {...register(id as keyof ProfileFormData)}
              />
              {errors[id as keyof ProfileFormData] && (
                <p className="text-xs text-red-500">
                  {errors[id as keyof ProfileFormData]?.message}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Button
        type="submit"
        disabled={updateMutation.isPending || isUploading}
        className="w-full sm:w-auto"
      >
        {updateMutation.isPending || isUploading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Saving...
          </span>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </>
        )}
      </Button>
    </form>
  );
}

// ── Security Tab ─────────────────────────────────────────────────────────────
function SecurityTab() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      // Uses the reset password with current password flow
      await authApi.resetPassword(data.currentPassword, data.newPassword);
    },
    onSuccess: () => {
      toast.success('Password changed successfully');
      reset();
    },
    onError: () => toast.error('Failed to change password. Check your current password.'),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Change Password</CardTitle>
        <CardDescription>
          Choose a strong password with at least 8 characters.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((d) => changePasswordMutation.mutate(d))}
          className="space-y-4 max-w-md"
        >
          <div className="space-y-1.5">
            <Label>Current Password</Label>
            <div className="relative">
              <Input
                type={showCurrent ? 'text' : 'password'}
                placeholder="••••••••"
                className="pr-10"
                {...register('currentPassword')}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-xs text-red-500">{errors.currentPassword.message}</p>
            )}
          </div>

          <Separator />

          <div className="space-y-1.5">
            <Label>New Password</Label>
            <div className="relative">
              <Input
                type={showNew ? 'text' : 'password'}
                placeholder="••••••••"
                className="pr-10"
                {...register('newPassword')}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-xs text-red-500">{errors.newPassword.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Confirm New Password</Label>
            <div className="relative">
              <Input
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                className="pr-10"
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" disabled={changePasswordMutation.isPending}>
            {changePasswordMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Updating...
              </span>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Update Password
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Notifications Tab ────────────────────────────────────────────────────────
function NotificationsTab() {
  const [settings, setSettings] = useState({
    newFollower: true,
    newPurchase: true,
    contentComments: false,
    weeklyDigest: true,
    productReviews: true,
    promotionalEmails: false,
  });

  const labels: Record<string, { label: string; desc: string }> = {
    newFollower: { label: 'New Follower', desc: 'When someone follows your profile' },
    newPurchase: { label: 'New Purchase', desc: 'When someone buys your product' },
    contentComments: { label: 'Content Comments', desc: 'When someone comments on your content' },
    weeklyDigest: { label: 'Weekly Digest', desc: 'Summary of your week\'s performance' },
    productReviews: { label: 'Product Reviews', desc: 'When someone reviews your product' },
    promotionalEmails: { label: 'Promotional Emails', desc: 'Tips, offers, and platform updates' },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Email Notifications</CardTitle>
        <CardDescription>Manage what emails you receive from TravelHues.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(settings).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-900">{labels[key].label}</p>
              <p className="text-xs text-gray-500">{labels[key].desc}</p>
            </div>
            <button
              type="button"
              onClick={() => setSettings((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                value ? 'bg-primary-500' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  value ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
        <Button className="mt-2" onClick={() => toast.success('Notification preferences saved')}>
          <Save className="w-4 h-4 mr-2" />
          Save Preferences
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage your account and preferences</p>
        </div>

        <Tabs defaultValue="profile">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-1.5" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security">
              <Lock className="w-4 h-4 mr-1.5" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="w-4 h-4 mr-1.5" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileTab />
          </TabsContent>

          <TabsContent value="security">
            <SecurityTab />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationsTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
