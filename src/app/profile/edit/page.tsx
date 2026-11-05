'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useVelo } from '@/context/VeloContext';
import { fileToBase64 } from '@/lib/utils';
import { compressImage, saveMediaBlob, getMediaBlob } from '@/lib/mediaStorage';
import { VideoPlayer } from '@/components/common/VideoPlayer';
import {
  ArrowLeft,
  Camera,
  Link as LinkIcon,
  Check,
  Globe,
} from 'lucide-react';

export default function EditProfilePage() {
  const router = useRouter();
  const { currentUser, updateProfile, showToast } = useVelo();

  // Form states initialized with currentUser
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [banner, setBanner] = useState(currentUser?.banner || '');
  const [bannerType, setBannerType] = useState<'image' | 'video'>(
    currentUser?.bannerType || 'image'
  );
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string>('');

  useEffect(() => {
    if (currentUser?.bannerType === 'video' && currentUser?.banner) {
      if (currentUser.banner.startsWith('http') || currentUser.banner.startsWith('data:')) {
        setBannerPreviewUrl(currentUser.banner);
      } else {
        const idbKey = currentUser.banner.startsWith('idb:')
          ? currentUser.banner.replace('idb:', '')
          : `user_banner_video_${currentUser.id}`;
        getMediaBlob(idbKey).then((blob) => {
          if (blob && blob instanceof Blob) {
            setBannerPreviewUrl(URL.createObjectURL(blob));
          } else if (typeof blob === 'string') {
            setBannerPreviewUrl(blob);
          }
        });
      }
    }
  }, [currentUser?.id, currentUser?.banner, currentUser?.bannerType]);

  // 3 distinct link input states
  const [link1Label, setLink1Label] = useState(currentUser?.links?.[0]?.label || 'Portfolio / Work');
  const [link1Url, setLink1Url] = useState(currentUser?.links?.[0]?.url || '');

  const [link2Label, setLink2Label] = useState(currentUser?.links?.[1]?.label || 'GitHub / Project');
  const [link2Url, setLink2Url] = useState(currentUser?.links?.[1]?.url || '');

  const [link3Label, setLink3Label] = useState(currentUser?.links?.[2]?.label || 'Newsletter / Blog');
  const [link3Url, setLink3Url] = useState(currentUser?.links?.[2]?.url || '');

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 400, 400, 0.85);
      setAvatar(compressed);
    } catch {
      try {
        const b64 = await fileToBase64(file);
        setAvatar(b64);
      } catch {
        showToast('Failed to load avatar image', 'error');
      }
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const isVideo = file.type.startsWith('video');
      if (isVideo) {
        const videoKey = `user_banner_video_${currentUser?.id || Date.now()}`;
        await saveMediaBlob(videoKey, file);
        const objUrl = URL.createObjectURL(file);
        setBanner(`idb:${videoKey}`);
        setBannerPreviewUrl(objUrl);
        setBannerType('video');
      } else {
        const compressed = await compressImage(file, 1200, 675, 0.82);
        setBanner(compressed);
        setBannerPreviewUrl(compressed);
        setBannerType('image');
      }
    } catch {
      try {
        const isVideo = file.type.startsWith('video');
        const b64 = await fileToBase64(file);
        setBanner(b64);
        setBannerType(isVideo ? 'video' : 'image');
      } catch {
        showToast('Failed to load banner media', 'error');
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !fullName.trim()) {
      showToast('Full Name and Username cannot be empty', 'error');
      return;
    }

    const links = [
      { id: 'lnk_1', label: link1Label.trim(), url: link1Url.trim() },
      { id: 'lnk_2', label: link2Label.trim(), url: link2Url.trim() },
      { id: 'lnk_3', label: link3Label.trim(), url: link3Url.trim() },
    ].filter((l) => l.url.length > 0);

    updateProfile({
      fullName: fullName.trim(),
      username: username.trim().toLowerCase(),
      bio: bio.trim(),
      avatar,
      banner,
      bannerType,
      links,
    });

    showToast('Profile updated successfully', 'success');
    router.push(`/profile/${username.trim().toLowerCase()}`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-zinc-200 dark:border-white/[0.08]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2.5 rounded-full border border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-100 dark:hover:bg-white/[0.06] text-zinc-600 dark:text-zinc-300 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight">
              Edit Profile
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Customize your identity, banner, and external links
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          type="button"
          className="flex items-center gap-2 px-5 py-2 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 font-semibold text-xs tracking-wide transition-all shadow-sm"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Save Changes</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Banner & Avatar Card */}
        <div className="rounded-3xl overflow-hidden border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-zinc-950/40 backdrop-blur-xl shadow-sm">
          {/* Banner Media Box */}
          <div className="relative h-44 sm:h-52 w-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
            {bannerType === 'video' ? (
              <VideoPlayer
                src={bannerPreviewUrl || banner}
                className="w-full h-full object-cover"
                autoPlay={true}
                loop={true}
                muted={true}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={bannerPreviewUrl || banner}
                alt="Banner preview"
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
              <label className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs font-medium cursor-pointer transition-colors shadow-sm">
                <Camera className="w-3.5 h-3.5" />
                <span>Change Banner (Photo / Video)</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleBannerUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Avatar Section */}
          <div className="px-6 pb-6 pt-2">
            <div className="relative -mt-16 mb-3 inline-block">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-zinc-950 bg-zinc-200 dark:bg-zinc-800 shadow-md group relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatar}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                  <Camera className="w-5 h-5 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Hover over your avatar or banner to replace media files.
            </p>
          </div>
        </div>

        {/* Basic Information Card */}
        <div className="p-6 rounded-3xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-zinc-950/40 backdrop-blur-xl shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Basic Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-white/20 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">
                  @
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-white/20 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Write a brief introduction about yourself..."
                className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-white/20 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* 3 Separate Link Inputs Card */}
        <div className="p-6 rounded-3xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-zinc-950/40 backdrop-blur-xl shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Profile Links (3 Distinct Channels)
            </h2>
          </div>

          {/* Link 1 */}
          <div className="p-4 rounded-2xl bg-zinc-50/70 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/[0.05] space-y-2">
            <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
              Link 1 • Primary Channel
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <input
                type="text"
                value={link1Label}
                onChange={(e) => setLink1Label(e.target.value)}
                placeholder="Label (e.g. Portfolio)"
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-white/20"
              />
              <input
                type="url"
                value={link1Url}
                onChange={(e) => setLink1Url(e.target.value)}
                placeholder="https://yourportfolio.com"
                className="sm:col-span-2 px-3.5 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-white/20"
              />
            </div>
          </div>

          {/* Link 2 */}
          <div className="p-4 rounded-2xl bg-zinc-50/70 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/[0.05] space-y-2">
            <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
              Link 2 • Code or Work
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <input
                type="text"
                value={link2Label}
                onChange={(e) => setLink2Label(e.target.value)}
                placeholder="Label (e.g. GitHub)"
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-white/20"
              />
              <input
                type="url"
                value={link2Url}
                onChange={(e) => setLink2Url(e.target.value)}
                placeholder="https://github.com/..."
                className="sm:col-span-2 px-3.5 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-white/20"
              />
            </div>
          </div>

          {/* Link 3 */}
          <div className="p-4 rounded-2xl bg-zinc-50/70 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/[0.05] space-y-2">
            <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
              Link 3 • Newsletter or Social
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <input
                type="text"
                value={link3Label}
                onChange={(e) => setLink3Label(e.target.value)}
                placeholder="Label (e.g. Newsletter)"
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-white/20"
              />
              <input
                type="url"
                value={link3Url}
                onChange={(e) => setLink3Url(e.target.value)}
                placeholder="https://substack.com/..."
                className="sm:col-span-2 px-3.5 py-2 rounded-xl bg-white dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-white/20"
              />
            </div>
          </div>
        </div>

        {/* Bottom Save Button */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-3 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 font-semibold text-sm transition-all shadow-sm"
          >
            Save Profile Changes
          </button>
        </div>
      </form>
    </div>
  );
}
