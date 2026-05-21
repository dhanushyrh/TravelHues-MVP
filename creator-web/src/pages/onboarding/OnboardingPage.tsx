import React, { useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Globe, ChevronRight, ChevronLeft, X, Upload, Check, SkipForward } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { creatorsApi } from '@/api/creators.api';
import { mediaApi } from '@/api/media.api';
import type { OnboardingData } from '@/types';

const SPECIALTIES = [
  'Photography',
  'Adventure Travel',
  'Luxury Travel',
  'Budget Travel',
  'Food & Culture',
  'Family Travel',
  'Solo Travel',
  'Nature & Wildlife',
  'Urban Exploration',
  'Beach & Islands',
];

// Step schemas
const step1Schema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(50),
  tagline: z.string().max(100, 'Tagline must be 100 characters or less').optional(),
  bio: z.string().max(500, 'Bio must be 500 characters or less').optional(),
  location: z.string().max(100).optional(),
});

const step3Schema = z.object({
  instagram: z.string().url('Enter a valid URL').or(z.literal('')).optional(),
  youtube: z.string().url('Enter a valid URL').or(z.literal('')).optional(),
  twitter: z.string().url('Enter a valid URL').or(z.literal('')).optional(),
  website: z.string().url('Enter a valid URL').or(z.literal('')).optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step3Data = z.infer<typeof step3Schema>;

const TOTAL_STEPS = 4;

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 data
  const step1Form = useForm<Step1Data>({ resolver: zodResolver(step1Schema) });

  // Step 2 data
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [destinations, setDestinations] = useState<string[]>([]);
  const [destinationInput, setDestinationInput] = useState('');

  // Step 3 data
  const step3Form = useForm<Step3Data>({ resolver: zodResolver(step3Schema) });

  // Step 4 data
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const progressValue = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100;

  // Step 1 submit
  const handleStep1Next = step1Form.handleSubmit(() => {
    setCurrentStep(2);
  });

  const toggleSpecialty = (specialty: string) => {
    setSpecialties((prev) =>
      prev.includes(specialty) ? prev.filter((s) => s !== specialty) : [...prev, specialty]
    );
  };

  const addDestination = () => {
    const val = destinationInput.trim();
    if (val && !destinations.includes(val)) {
      setDestinations([...destinations, val]);
    }
    setDestinationInput('');
  };

  const removeDestination = (d: string) => {
    setDestinations(destinations.filter((x) => x !== d));
  };

  const handleStep3Next = step3Form.handleSubmit(() => {
    setCurrentStep(4);
  });

  const handleAvatarChange = useCallback((file: File) => {
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        handleAvatarChange(file);
      }
    },
    [handleAvatarChange]
  );

  const handleComplete = async (skipAvatar = false) => {
    setIsSubmitting(true);
    try {
      let avatarUrl: string | undefined;

      if (!skipAvatar && avatarFile) {
        setIsUploading(true);
        const uploadRes = await mediaApi.upload(avatarFile);
        avatarUrl = uploadRes.data?.data?.url;
        setIsUploading(false);
      }

      const step1Data = step1Form.getValues();
      const step3Data = step3Form.getValues();

      const socialLinks: Record<string, string> = {};
      if (step3Data.instagram) socialLinks.instagram = step3Data.instagram;
      if (step3Data.youtube) socialLinks.youtube = step3Data.youtube;
      if (step3Data.twitter) socialLinks.twitter = step3Data.twitter;

      const onboardingData: OnboardingData = {
        displayName: step1Data.displayName,
        tagline: step1Data.tagline,
        bio: step1Data.bio,
        location: step1Data.location,
        specialties,
        destinations,
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
        websiteUrl: step3Data.website || undefined,
        avatarUrl,
      };

      await creatorsApi.completeOnboarding(onboardingData);
      toast.success('Profile setup complete! Welcome to TravelHues.');
      navigate({ to: '/dashboard' });
    } catch {
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">TravelHues</span>
          </div>
          <span className="text-sm text-gray-500">
            Step {currentStep} of {TOTAL_STEPS}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white px-6 pb-4 border-b border-gray-100">
        <div className="max-w-2xl mx-auto">
          <Progress value={progressValue} className="h-2 mt-2" />
          <div className="flex justify-between mt-2">
            {['Profile', 'Specialties', 'Socials', 'Photo'].map((label, i) => (
              <span
                key={label}
                className={`text-xs font-medium ${
                  i + 1 <= currentStep ? 'text-primary-600' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* STEP 1 */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Welcome! Let's set up your creator profile
            </h2>
            <p className="text-gray-500 text-sm mb-6">Tell your audience who you are.</p>

            <form onSubmit={handleStep1Next} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="displayName">
                  Display Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="displayName"
                  placeholder="e.g. Wanderlust Jane"
                  {...step1Form.register('displayName')}
                />
                {step1Form.formState.errors.displayName && (
                  <p className="text-xs text-red-500">
                    {step1Form.formState.errors.displayName.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tagline">
                  Tagline
                  <span className="text-gray-400 font-normal ml-1">(max 100 chars)</span>
                </Label>
                <Input
                  id="tagline"
                  placeholder="e.g. Exploring the world one adventure at a time"
                  {...step1Form.register('tagline')}
                />
                {step1Form.formState.errors.tagline && (
                  <p className="text-xs text-red-500">
                    {step1Form.formState.errors.tagline.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bio">
                  Bio
                  <span className="text-gray-400 font-normal ml-1">(max 500 chars)</span>
                </Label>
                <Textarea
                  id="bio"
                  placeholder="Tell your audience about yourself and your travel style..."
                  rows={4}
                  {...step1Form.register('bio')}
                />
                {step1Form.formState.errors.bio && (
                  <p className="text-xs text-red-500">{step1Form.formState.errors.bio.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g. Mumbai, India"
                  {...step1Form.register('location')}
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit">
                  Continue
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2 */}
        {currentStep === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">What do you create?</h2>
            <p className="text-gray-500 text-sm mb-6">
              Select your travel specialties and primary destinations.
            </p>

            <div className="space-y-6">
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                  Specialties
                </Label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTIES.map((specialty) => (
                    <button
                      key={specialty}
                      type="button"
                      onClick={() => toggleSpecialty(specialty)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        specialties.includes(specialty)
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      {specialties.includes(specialty) && (
                        <Check className="w-3 h-3 inline mr-1" />
                      )}
                      {specialty}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                  Primary Destinations
                </Label>
                <div className="flex gap-2 mb-3">
                  <Input
                    placeholder="e.g. Bali, Indonesia"
                    value={destinationInput}
                    onChange={(e) => setDestinationInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addDestination();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addDestination}>
                    Add
                  </Button>
                </div>
                {destinations.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {destinations.map((d) => (
                      <span
                        key={d}
                        className="flex items-center gap-1 px-3 py-1 bg-indigo-50 text-primary-700 rounded-full text-sm font-medium"
                      >
                        {d}
                        <button
                          type="button"
                          onClick={() => removeDestination(d)}
                          className="hover:text-primary-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-6">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button onClick={() => setCurrentStep(3)}>
                Continue
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {currentStep === 3 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Connect your socials</h2>
            <p className="text-gray-500 text-sm mb-6">
              All optional — add as many as you'd like.
            </p>

            <form onSubmit={handleStep3Next} className="space-y-4">
              {[
                { id: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourhandle' },
                { id: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@yourchannel' },
                { id: 'twitter', label: 'Twitter / X', placeholder: 'https://twitter.com/yourhandle' },
                { id: 'website', label: 'Website', placeholder: 'https://yourwebsite.com' },
              ].map(({ id, label, placeholder }) => (
                <div key={id} className="space-y-1.5">
                  <Label htmlFor={id}>{label}</Label>
                  <Input
                    id={id}
                    type="url"
                    placeholder={placeholder}
                    {...step3Form.register(id as keyof Step3Data)}
                  />
                  {step3Form.formState.errors[id as keyof Step3Data] && (
                    <p className="text-xs text-red-500">
                      {step3Form.formState.errors[id as keyof Step3Data]?.message}
                    </p>
                  )}
                </div>
              ))}

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(2)}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <Button type="submit">
                  Continue
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 4 */}
        {currentStep === 4 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Upload your profile photo</h2>
            <p className="text-gray-500 text-sm mb-6">Optional — you can add this later.</p>

            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                isDragging
                  ? 'border-primary-400 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
              }`}
            >
              {avatarPreview ? (
                <div className="flex flex-col items-center gap-4">
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                  />
                  <p className="text-sm text-gray-500">{avatarFile?.name}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <Upload className="w-7 h-7 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Drag & drop or{' '}
                      <span className="text-primary-500">click to upload</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 5MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAvatarChange(file);
                    }}
                  />
                </label>
              )}
            </div>

            <div className="flex justify-between pt-6">
              <Button variant="outline" onClick={() => setCurrentStep(3)}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => handleComplete(true)}
                  disabled={isSubmitting}
                >
                  <SkipForward className="w-4 h-4 mr-1" />
                  Skip for now
                </Button>
                <Button onClick={() => handleComplete(false)} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {isUploading ? 'Uploading...' : 'Saving...'}
                    </span>
                  ) : (
                    'Complete Setup'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
