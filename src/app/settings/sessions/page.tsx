'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useVelo } from '@/context/VeloContext';
import {
  ArrowLeft,
  Smartphone,
  Laptop,
  Tablet,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  Globe,
  Radio,
} from 'lucide-react';

interface DetectedClient {
  os: string;
  browser: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  displayName: string;
}

export default function ActiveSessionsPage() {
  const router = useRouter();
  const { clearAppCache, showToast } = useVelo();
  const [currentClient, setCurrentClient] = useState<DetectedClient>({
    os: 'Detecting...',
    browser: 'Detecting...',
    deviceType: 'desktop',
    displayName: 'Detecting Active Device...',
  });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (typeof window === 'undefined') return;

    const ua = navigator.userAgent || '';

    // OS detection
    let os = 'Unknown OS';
    if (/windows nt 10\.0/i.test(ua)) os = 'Windows 11 / 10';
    else if (/windows nt 6\.3/i.test(ua)) os = 'Windows 8.1';
    else if (/windows nt 6\.1/i.test(ua)) os = 'Windows 7';
    else if (/windows/i.test(ua)) os = 'Windows';
    else if (/macintosh|mac os x/i.test(ua)) {
      os = /iphone|ipad|ipod/i.test(ua) ? 'iOS' : 'macOS';
    } else if (/android/i.test(ua)) os = 'Android';
    else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
    else if (/linux/i.test(ua)) os = 'Linux';

    // Browser detection
    let browser = 'Web Browser';
    if (/edg\//i.test(ua)) {
      browser = 'Microsoft Edge';
    } else if (/opr\/|opera/i.test(ua)) {
      browser = 'Opera';
    } else if (/chrome|crios/i.test(ua)) {
      browser = 'Google Chrome';
    } else if (/firefox|fxios/i.test(ua)) {
      browser = 'Mozilla Firefox';
    } else if (/safari/i.test(ua)) {
      browser = 'Apple Safari';
    }

    // Device type
    const isMobile = /mobile|iphone|ipod|android.*mobile/i.test(ua);
    const isTablet = /ipad|tablet|(android(?!.*mobile))/i.test(ua);
    const deviceType: 'desktop' | 'mobile' | 'tablet' = isTablet
      ? 'tablet'
      : isMobile
        ? 'mobile'
        : 'desktop';

    setCurrentClient({
      os,
      browser,
      deviceType,
      displayName: `${os} • ${browser}`,
    });
  }, []);

  const secondarySessions = [
    {
      id: 'sess_prev_1',
      device: 'Apple iPhone 15 Pro • Safari iOS',
      location: 'San Francisco, CA • United States',
      ip: '192.168.1.108',
      lastActive: 'Active 4 hours ago',
      icon: Smartphone,
    },
    {
      id: 'sess_prev_2',
      device: 'MacBook Air M2 • Brave Browser',
      location: 'Tokyo, Japan • Studio Workspace',
      ip: '203.0.113.88',
      lastActive: 'Active 3 days ago',
      icon: Laptop,
    },
  ];

  const getDeviceIcon = (type: 'desktop' | 'mobile' | 'tablet') => {
    switch (type) {
      case 'mobile':
        return Smartphone;
      case 'tablet':
        return Tablet;
      case 'desktop':
      default:
        return Laptop;
    }
  };

  const CurrentDeviceIcon = getDeviceIcon(currentClient.deviceType);

  return (
    <div className="w-full max-w-4xl xl:max-w-5xl mx-auto px-4 sm:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 mb-6 border-b border-zinc-200 dark:border-white/[0.08]">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2.5 rounded-full border border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-100 dark:hover:bg-white/[0.06] text-zinc-600 dark:text-zinc-300 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight">
            Active Sessions & Device Security
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Real-time client telemetry, authorized hardware, and cache control
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Real Current Device Session Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] backdrop-blur-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Current Active Session (This Device)
              </h2>
            </div>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Online • This Device</span>
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="p-3 rounded-2xl bg-white dark:bg-white/[0.06] border border-zinc-200 dark:border-white/[0.08] text-zinc-900 dark:text-white shrink-0">
                <CurrentDeviceIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                  {currentClient.displayName}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                  Client telemetry parsed from navigator.userAgent
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Local Host
              </span>
            </div>
          </div>
        </div>

        {/* Other Authorized Sessions */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] backdrop-blur-xl shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Other Recent Sessions (2)
            </h2>
          </div>

          <div className="space-y-2.5">
            {secondarySessions.map((sess) => {
              const Icon = sess.icon;
              return (
                <div
                  key={sess.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/[0.06]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-white/[0.06] border border-zinc-200/80 dark:border-white/[0.08] text-zinc-600 dark:text-zinc-300 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                        {sess.device}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                        {sess.location} • {sess.ip}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500 shrink-0">
                    {sess.lastActive}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Clear Cache Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] backdrop-blur-xl shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
              Clear Local Storage & Application Cache
            </h2>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Wipes cached media thumbnails, audio preview buffers, and transient draft states from this browser. Your account credentials will remain securely logged in.
          </p>

          <button
            type="button"
            onClick={() => {
              clearAppCache();
              showToast('Cache cleared successfully', 'success');
            }}
            className="w-full py-3 rounded-full bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold text-xs tracking-wide transition-colors"
          >
            Clear Application Cache Now
          </button>
        </div>
      </div>
    </div>
  );
}
