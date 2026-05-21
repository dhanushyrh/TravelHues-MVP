import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Store,
  Globe,
  ExternalLink,
  Package,
  Star,
  Edit2,
  Eye,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { creatorsApi } from '@/api/creators.api';
import { productsApi } from '@/api/products.api';
import { useAuthStore } from '@/store/auth.store';
import { formatCurrency, getInitials } from '@/lib/utils';
import type { CreatorProfile, Product } from '@/types';

export default function StorefrontPage() {
  const { user } = useAuthStore();
  const [previewMode, setPreviewMode] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['creator-profile'],
    queryFn: () => creatorsApi.getMyProfile(),
    select: (res) => (res.data?.data || res.data) as CreatorProfile,
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products', 'published'],
    queryFn: () => productsApi.list(),
    select: (res) => {
      const d = res.data?.data || res.data;
      const arr = Array.isArray(d) ? d : (d?.data ?? []) as Product[];
      return arr.filter((p: Product) => p.isPublished);
    },
  });

  const initials = user ? getInitials(user.firstName, user.lastName) : 'U';
  const storefrontUrl = profile ? `https://travelhues.com/@${profile.displayName?.toLowerCase().replace(/\s+/g, '')}` : '';

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Storefront</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Your public creator page — how fans see you
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
              <Eye className="w-4 h-4 mr-2" />
              {previewMode ? 'Edit Mode' : 'Preview'}
            </Button>
            {storefrontUrl && (
              <Button variant="outline" asChild>
                <a href={storefrontUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Live
                </a>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — Profile card */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardContent className="p-6">
                {profileLoading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Skeleton className="w-20 h-20 rounded-full" />
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center gap-3">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={user?.avatarUrl} />
                      <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        {profile?.displayName || `${user?.firstName} ${user?.lastName}`}
                      </h2>
                      {profile?.isVerified && (
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-xs text-yellow-600 font-medium">Verified Creator</span>
                        </div>
                      )}
                    </div>

                    {profile?.tagline && (
                      <p className="text-sm text-gray-500 italic">&ldquo;{profile.tagline}&rdquo;</p>
                    )}

                    {profile?.bio && (
                      <p className="text-sm text-gray-600 leading-relaxed">{profile.bio}</p>
                    )}

                    {profile?.location && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Globe className="w-3 h-3" />
                        {profile.location}
                      </div>
                    )}

                    <Badge variant="secondary" className="capitalize">
                      {profile?.creatorTier || 'basic'} tier
                    </Badge>

                    {/* Social links */}
                    {profile?.socialLinks && Object.keys(profile.socialLinks).length > 0 && (
                      <>
                        <Separator className="w-full" />
                        <div className="flex flex-wrap justify-center gap-2">
                          {Object.entries(profile.socialLinks).map(([platform, url]) => (
                            <a
                              key={platform}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 hover:text-primary-600 capitalize"
                            >
                              {platform}
                            </a>
                          ))}
                        </div>
                      </>
                    )}

                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <a href="/settings">
                        <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                        Edit Profile
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Specialties */}
            {profile?.specialties && profile.specialties.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Specialties</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.specialties.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 bg-indigo-50 text-primary-700 rounded-full text-xs font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right — Products */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Store className="w-4 h-4 text-primary-500" />
                  Published Products
                </CardTitle>
                <CardDescription>
                  Products visible to your audience on your storefront
                </CardDescription>
              </CardHeader>
              <CardContent>
                {productsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 rounded-lg" />
                    ))}
                  </div>
                ) : products && products.length > 0 ? (
                  <div className="space-y-3">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="w-14 h-14 rounded-lg bg-gray-200 flex-shrink-0 overflow-hidden">
                          {product.coverImageUrl ? (
                            <img
                              src={product.coverImageUrl}
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {product.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="secondary" className="text-xs capitalize">
                              {product.type}
                            </Badge>
                            <span className="text-xs font-semibold text-gray-700">
                              {formatCurrency(product.price)}
                            </span>
                          </div>
                        </div>
                        <Badge variant="success" className="flex-shrink-0">
                          Published
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Store className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm font-medium">No published products</p>
                    <p className="text-gray-400 text-xs mt-1">
                      Publish products to show them on your storefront
                    </p>
                    <Button className="mt-4" size="sm" asChild>
                      <a href="/products">Go to Products</a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
