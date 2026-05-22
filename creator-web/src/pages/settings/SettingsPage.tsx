import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Eye,
  EyeOff,
  Save,
  Lock,
  Bell,
  Camera,
  MapPin,
  Globe,
  Instagram,
  Youtube,
  Twitter,
  ExternalLink,
  AlertTriangle,
  User,
  Shield,
  BookOpen,
  Video,
  Package,
  Users,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { creatorsApi } from '@/api/creators.api';
import { authApi } from '@/api/auth.api';
import { mediaApi } from '@/api/media.api';
import { storiesApi } from '@/api/stories.api';
import { useAuthStore } from '@/store/auth.store';
import { getInitials } from '@/lib/utils';
import type { CreatorProfile, DashboardStats } from '@/types';

// ── Schemas ──────────────────────────────────────────────────────────────────
const profileSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  displayName: z.string().min(1, 'Required').max(50),
  tagline: z.string().max(100).optional(),
  bio: z.string().max(1000).optional(),
  location: z.string().max(100).optional(),
  websiteUrl: z.string().url('Enter a valid URL').or(z.literal('')).optional(),
  instagram: z.string().url().or(z.literal('')).optional(),
  youtube: z.string().url().or(z.literal('')).optional(),
  twitter: z.string().url().or(z.literal('')).optional(),
  facebook: z.string().url().or(z.literal('')).optional(),
});
type ProfileFormData = z.infer<typeof profileSchema>;

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

// ── Tier badge styles ─────────────────────────────────────────────────────────
const TIER_STYLES: Record<string, string> = {
  basic: 'bg-gray-100 text-gray-700',
  pro: 'bg-blue-100 text-blue-700',
  premium: 'bg-amber-100 text-amber-700',
};

// ── Social icon map ───────────────────────────────────────────────────────────
function SocialIcon({ platform, url }: { platform: string; url?: string }) {
  if (!url) return null;
  const icons: Record<string, React.ReactNode> = {
    instagram: <Instagram className="w-4 h-4" />,
    youtube: <Youtube className="w-4 h-4" />,
    twitter: <Twitter className="w-4 h-4" />,
    facebook: <Globe className="w-4 h-4" />,
    websiteUrl: <Globe className="w-4 h-4" />,
  };
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
    >
      {icons[platform] ?? <Globe className="w-4 h-4" />}
    </a>
  );
}

// ── Profile Card (left sidebar) ───────────────────────────────────────────────
function ProfileCard({
  profile,
  dashStats,
  storiesCount,
  avatarPreview,
  onAvatarChange,
}: {
  profile?: CreatorProfile;
  dashStats?: DashboardStats;
  storiesCount: number;
  avatarPreview: string | null;
  onAvatarChange: (file: File, preview: string) => void;
}) {
  const { user } = useAuthStore();
  const initials = user ? getInitials(user.firstName, user.lastName) : 'U';
  const tier = profile?.creatorTier ?? 'basic';

  const socialLinks = profile?.socialLinks ?? {};

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden sticky top-6">
      {/* Cover gradient */}
      <div className="h-20 bg-gradient-to-br from-primary-400 to-primary-600" />

      {/* Avatar + upload */}
      <div className="px-5 pb-5">
        <div className="relative -mt-10 mb-3 w-fit">
          <Avatar className="w-20 h-20 ring-4 ring-white shadow-md">
            <AvatarImage src={avatarPreview || user?.avatarUrl || undefined} />
            <AvatarFallback className="text-2xl bg-primary-100 text-primary-700">
              {initials}
            </AvatarFallback>
          </Avatar>
          <label className="absolute bottom-0 right-0 w-6 h-6 bg-white rounded-full shadow border border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
            <Camera className="w-3.5 h-3.5 text-gray-600" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => onAvatarChange(file, ev.target?.result as string);
                reader.readAsDataURL(file);
              }}
            />
          </label>
        </div>

        {/* Name + tier */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h2 className="font-bold text-gray-900 text-lg leading-tight">
            {profile?.displayName || `${user?.firstName} ${user?.lastName}`}
          </h2>
          <Badge className={`text-xs capitalize flex-shrink-0 ${TIER_STYLES[tier]}`}>
            {tier}
          </Badge>
        </div>

        {/* Username slug */}
        {profile?.slug && (
          <p className="text-xs text-gray-400 mb-2 font-mono">travelhues.in/{profile.slug}</p>
        )}

        {/* Tagline */}
        {profile?.tagline && (
          <p className="text-sm text-gray-600 mb-3 leading-snug">{profile.tagline}</p>
        )}

        {/* Location */}
        {profile?.location && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
            <MapPin className="w-3.5 h-3.5" />
            {profile.location}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-1 mb-4 bg-gray-50 rounded-xl p-3">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-500 mb-0.5">
              <BookOpen className="w-3 h-3" />
            </div>
            <p className="text-base font-bold text-gray-900">{storiesCount}</p>
            <p className="text-xs text-gray-500">Stories</p>
          </div>
          <div className="text-center border-x border-gray-200">
            <div className="flex items-center justify-center gap-1 text-gray-500 mb-0.5">
              <Video className="w-3 h-3" />
            </div>
            <p className="text-base font-bold text-gray-900">{dashStats?.totalContent ?? 0}</p>
            <p className="text-xs text-gray-500">Content</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-500 mb-0.5">
              <Package className="w-3 h-3" />
            </div>
            <p className="text-base font-bold text-gray-900">{dashStats?.publishedProducts ?? 0}</p>
            <p className="text-xs text-gray-500">Products</p>
          </div>
        </div>

        {/* Followers */}
        {(dashStats?.followers ?? 0) > 0 && (
          <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
            <Users className="w-4 h-4 text-gray-400" />
            <span><strong className="text-gray-900">{dashStats?.followers}</strong> followers</span>
          </div>
        )}

        {/* Social links */}
        {Object.values(socialLinks).some(Boolean) && (
          <div className="flex gap-2 mb-4 flex-wrap">
            {(['instagram', 'youtube', 'twitter', 'facebook'] as const).map((p) => (
              <SocialIcon key={p} platform={p} url={socialLinks[p]} />
            ))}
            {profile?.websiteUrl && (
              <SocialIcon platform="websiteUrl" url={profile.websiteUrl} />
            )}
          </div>
        )}

        {/* View public profile */}
        <a
          href={`https://travelhues.in/${profile?.slug ?? ''}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View Public Profile
        </a>
      </div>
    </div>
  );
}

// ── Profile Edit Tab ──────────────────────────────────────────────────────────
function ProfileTab({
  profile,
  avatarFile,
  onSaved,
}: {
  profile?: CreatorProfile;
  avatarFile: File | null;
  onSaved: () => void;
}) {
  const { user, updateUser } = useAuthStore();

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      displayName: profile?.displayName || '',
      tagline: profile?.tagline || '',
      bio: profile?.bio || '',
      location: profile?.location || '',
      websiteUrl: profile?.websiteUrl || '',
      instagram: profile?.socialLinks?.instagram || '',
      youtube: profile?.socialLinks?.youtube || '',
      twitter: profile?.socialLinks?.twitter || '',
      facebook: profile?.socialLinks?.facebook || '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      let avatarUrl: string | undefined;
      if (avatarFile) {
        const res = await mediaApi.upload(avatarFile);
        avatarUrl = res.data?.data?.url;
      }

      const socialLinks: Record<string, string> = {};
      if (data.instagram) socialLinks.instagram = data.instagram;
      if (data.youtube) socialLinks.youtube = data.youtube;
      if (data.twitter) socialLinks.twitter = data.twitter;
      if (data.facebook) socialLinks.facebook = data.facebook;

      await creatorsApi.updateMyProfile({
        displayName: data.displayName,
        tagline: data.tagline,
        bio: data.bio,
        location: data.location,
        websiteUrl: data.websiteUrl || undefined,
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
      });

      updateUser({ firstName: data.firstName, lastName: data.lastName });
      if (avatarUrl) updateUser({ avatarUrl });
    },
    onSuccess: () => {
      toast.success('Profile saved');
      onSaved();
    },
    onError: () => toast.error('Failed to save profile'),
  });

  return (
    <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="space-y-6">
      {/* Name */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Personal Info</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>First Name</Label>
              <Input className="mt-1" {...register('firstName')} />
              {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <Label>Last Name</Label>
              <Input className="mt-1" {...register('lastName')} />
            </div>
          </div>

          <div>
            <Label>Email</Label>
            <Input className="mt-1 bg-gray-50 text-gray-500" value={user?.email || ''} disabled />
          </div>

          <div>
            <Label>Display Name</Label>
            <Input className="mt-1" placeholder="How you appear on TravelHues" {...register('displayName')} />
            {errors.displayName && <p className="text-xs text-red-500 mt-1">{errors.displayName.message}</p>}
          </div>

          <div>
            <Label>
              Headline
              <span className="text-gray-400 font-normal ml-1">· Short info within 100 characters</span>
            </Label>
            <Input className="mt-1" placeholder="Software Engineer | Adventure Photographer" {...register('tagline')} maxLength={100} />
          </div>

          <div>
            <Label>
              About Me
              <span className="text-gray-400 font-normal ml-1">· Brief about yourself</span>
            </Label>
            <Textarea className="mt-1" rows={4} placeholder="Tell your audience about yourself and your travel style..." {...register('bio')} />
          </div>

          <div>
            <Label>Location</Label>
            <Input className="mt-1" placeholder="e.g. Bengaluru, India" {...register('location')} />
          </div>
        </div>
      </section>

      <Separator />

      {/* Social Links */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-1">Social Links</h3>
        <p className="text-xs text-gray-400 mb-3">Links to your social life — shown on your public profile</p>
        <div className="space-y-3">
          {[
            { id: 'instagram', label: 'Instagram', icon: <Instagram className="w-4 h-4 text-pink-500" />, placeholder: 'https://instagram.com/yourhandle' },
            { id: 'youtube', label: 'YouTube', icon: <Youtube className="w-4 h-4 text-red-500" />, placeholder: 'https://youtube.com/@yourchannel' },
            { id: 'twitter', label: 'Twitter / X', icon: <Twitter className="w-4 h-4 text-gray-700" />, placeholder: 'https://twitter.com/yourhandle' },
            { id: 'facebook', label: 'Facebook', icon: <Globe className="w-4 h-4 text-blue-600" />, placeholder: 'https://facebook.com/yourpage' },
            { id: 'websiteUrl', label: 'Website', icon: <Globe className="w-4 h-4 text-gray-500" />, placeholder: 'https://yourwebsite.com' },
          ].map(({ id, label, icon, placeholder }) => (
            <div key={id} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0">
                {icon}
              </div>
              <div className="flex-1">
                <Label className="text-xs text-gray-500">{label}</Label>
                <Input
                  className="mt-0.5 h-8 text-sm"
                  type="url"
                  placeholder={placeholder}
                  {...register(id as keyof ProfileFormData)}
                />
                {errors[id as keyof ProfileFormData] && (
                  <p className="text-xs text-red-500 mt-0.5">{errors[id as keyof ProfileFormData]?.message}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="submit" disabled={updateMutation.isPending} className="px-6">
          {updateMutation.isPending ? (
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
      </div>
    </form>
  );
}

// ── Security Tab ──────────────────────────────────────────────────────────────
function SecurityTab() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { clearAuth } = useAuthStore();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      await authApi.resetPassword(data.currentPassword, data.newPassword);
    },
    onSuccess: () => {
      toast.success('Password changed successfully');
      reset();
    },
    onError: () => toast.error('Incorrect current password'),
  });

  return (
    <div className="space-y-8">
      {/* Change password */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Change Password</h3>
        <form
          onSubmit={handleSubmit((d) => changePasswordMutation.mutate(d))}
          className="space-y-4 max-w-md"
        >
          <div>
            <Label>Current Password</Label>
            <div className="relative mt-1">
              <Input type={showCurrent ? 'text' : 'password'} placeholder="••••••••" className="pr-10" {...register('currentPassword')} />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.currentPassword && <p className="text-xs text-red-500 mt-1">{errors.currentPassword.message}</p>}
          </div>

          <div>
            <Label>New Password</Label>
            <div className="relative mt-1">
              <Input type={showNew ? 'text' : 'password'} placeholder="••••••••" className="pr-10" {...register('newPassword')} />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.newPassword && <p className="text-xs text-red-500 mt-1">{errors.newPassword.message}</p>}
          </div>

          <div>
            <Label>Confirm New Password</Label>
            <div className="relative mt-1">
              <Input type={showConfirm ? 'text' : 'password'} placeholder="••••••••" className="pr-10" {...register('confirmPassword')} />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
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
      </section>

      <Separator />

      {/* Danger zone */}
      <section>
        <h3 className="text-sm font-semibold text-gray-700 mb-1">Account</h3>
        <p className="text-xs text-gray-400 mb-4">Manage your account status</p>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-900">Make Profile Hidden</p>
              <p className="text-xs text-gray-500 mt-0.5">Your profile won't be visible to other users</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>

          <div
            className="flex items-center justify-between p-4 rounded-xl border border-red-100 bg-red-50 cursor-pointer hover:bg-red-100 transition-colors"
            onClick={() => {
              if (confirm('Are you sure? This action cannot be undone and will permanently delete your account.')) {
                toast.error('Please contact support to delete your account.');
              }
            }}
          >
            <div>
              <p className="text-sm font-medium text-red-700">Delete Account</p>
              <p className="text-xs text-red-500 mt-0.5">This permanently deletes your account and can't be undone</p>
            </div>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>

          <button
            onClick={async () => {
              try { await authApi.logout(); } catch { }
              clearAuth();
              window.location.href = '/auth/login';
            }}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-left"
          >
            <p className="text-sm font-medium text-gray-700">Logout</p>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </section>
    </div>
  );
}

// ── Notifications Tab ─────────────────────────────────────────────────────────
function NotificationsTab() {
  const [settings, setSettings] = useState({
    newFollower: true,
    newPurchase: true,
    contentComments: false,
    weeklyDigest: true,
    productReviews: true,
    promotionalEmails: false,
  });

  const items: { key: keyof typeof settings; label: string; desc: string }[] = [
    { key: 'newFollower', label: 'New Follower', desc: 'When someone follows your profile' },
    { key: 'newPurchase', label: 'New Purchase', desc: 'When someone buys your product' },
    { key: 'contentComments', label: 'Content Comments', desc: 'When someone comments on your content' },
    { key: 'weeklyDigest', label: 'Weekly Digest', desc: "Summary of your week's performance" },
    { key: 'productReviews', label: 'Product Reviews', desc: 'When someone reviews your product' },
    { key: 'promotionalEmails', label: 'Promotional Emails', desc: 'Tips, offers, and platform updates' },
  ];

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-1">Email Notifications</h3>
      <p className="text-xs text-gray-400 mb-4">Manage what emails you receive from TravelHues.</p>
      <div className="space-y-1">
        {items.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between py-3 px-1">
            <div>
              <p className="text-sm font-medium text-gray-900">{label}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
            <button
              type="button"
              onClick={() => setSettings((p) => ({ ...p, [key]: !p[key] }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings[key] ? 'bg-primary-500' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${settings[key] ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <Button onClick={() => toast.success('Notification preferences saved')}>
          <Save className="w-4 h-4 mr-2" />
          Save Preferences
        </Button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const { data: profileRes, refetch: refetchProfile } = useQuery({
    queryKey: ['creator-profile'],
    queryFn: () => creatorsApi.getMyProfile(),
    select: (res) => (res.data?.data || res.data) as CreatorProfile,
  });

  const { data: dashRes } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => creatorsApi.getDashboard(),
    select: (res) => (res.data?.data || res.data) as DashboardStats,
  });

  const { data: storiesRes } = useQuery({
    queryKey: ['stories'],
    queryFn: () => storiesApi.list({ limit: 1 }),
  });
  const storiesCount = (storiesRes as any)?.data?.meta?.total ?? 0;

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Profile & Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your public profile and account preferences</p>
        </div>

        <div className="flex gap-6 items-start">
          {/* Left: Profile card */}
          <div className="w-64 flex-shrink-0">
            <ProfileCard
              profile={profileRes}
              dashStats={dashRes}
              storiesCount={storiesCount}
              avatarPreview={avatarPreview}
              onAvatarChange={(file, preview) => {
                setAvatarFile(file);
                setAvatarPreview(preview);
              }}
            />
          </div>

          {/* Right: Settings tabs */}
          <div className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-200 p-6">
            <Tabs defaultValue="profile">
              <TabsList className="mb-6 w-full justify-start gap-1 bg-gray-50 p-1 rounded-xl h-auto">
                <TabsTrigger value="profile" className="rounded-lg gap-1.5 text-sm">
                  <User className="w-4 h-4" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="security" className="rounded-lg gap-1.5 text-sm">
                  <Shield className="w-4 h-4" />
                  Security
                </TabsTrigger>
                <TabsTrigger value="notifications" className="rounded-lg gap-1.5 text-sm">
                  <Bell className="w-4 h-4" />
                  Notifications
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <ProfileTab
                  profile={profileRes}
                  avatarFile={avatarFile}
                  onSaved={() => {
                    refetchProfile();
                    setAvatarFile(null);
                  }}
                />
              </TabsContent>

              <TabsContent value="security">
                <SecurityTab />
              </TabsContent>

              <TabsContent value="notifications">
                <NotificationsTab />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
