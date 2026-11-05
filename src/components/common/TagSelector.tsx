'use client';

import React, { useState } from 'react';
import { User } from '@/types/velo';
import { useVelo } from '@/context/VeloContext';
import { Search, Check, X, Tag } from 'lucide-react';

interface TagSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUsers: User[];
  onToggleUser: (user: User) => void;
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  isOpen,
  onClose,
  selectedUsers,
  onToggleUser,
}) => {
  const { allUsers, currentUser } = useVelo();
  const [activeTab, setActiveTab] = useState<'following' | 'others'>('following');
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  // Filter out current user
  const otherUsers = allUsers.filter((u) => u.id !== currentUser?.id);

  // Tab 1: Following (users where isFollowing === true)
  const followingUsers = otherUsers.filter((u) => u.isFollowing);

  // Tab 2: Others (users where isFollowing === false or undefined)
  const nonFollowingUsers = otherUsers.filter((u) => !u.isFollowing);

  const displayedUsers = (activeTab === 'following' ? followingUsers : nonFollowingUsers).filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-950 backdrop-blur-2xl border border-zinc-200 dark:border-white/[0.08] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
              Tag People
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Tags Pills */}
        {selectedUsers.length > 0 && (
          <div className="flex items-center gap-1.5 p-3 overflow-x-auto border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-white/[0.02]">
            {selectedUsers.map((user) => (
              <span
                key={user.id}
                className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-900 text-white dark:bg-white dark:text-black shrink-0 shadow-sm"
              >
                @{user.username}
                <button
                  type="button"
                  onClick={() => onToggleUser(user)}
                  className="opacity-70 hover:opacity-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* 2 Category Tabs: Following vs Others */}
        <div className="flex p-2 gap-2 border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50/50 dark:bg-white/[0.02]">
          <button
            type="button"
            onClick={() => setActiveTab('following')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'following'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-black shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04]'
            }`}
          >
            Following ({followingUsers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('others')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'others'
                ? 'bg-zinc-900 text-white dark:bg-white dark:text-black shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04]'
            }`}
          >
            Others ({nonFollowingUsers.length})
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-zinc-200 dark:border-white/[0.08]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] text-zinc-900 dark:text-white placeholder:text-zinc-400 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-white/20"
            />
          </div>
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {displayedUsers.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">
              No users found in this category
            </div>
          ) : (
            displayedUsers.map((user) => {
              const isSelected = selectedUsers.some((u) => u.id === user.id);
              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => onToggleUser(user)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-2xl border text-left transition-colors ${
                    isSelected
                      ? 'bg-zinc-100 dark:bg-white/[0.08] border-zinc-300 dark:border-white/20'
                      : 'border-transparent hover:bg-zinc-50 dark:hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-9 h-9 rounded-full object-cover border border-zinc-200 dark:border-white/10"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                        {user.fullName}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                        @{user.username}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-black border-transparent'
                        : 'border-zinc-300 dark:border-white/20'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Done Button */}
        <div className="p-3 border-t border-zinc-200 dark:border-white/[0.08]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 font-semibold text-xs tracking-wide transition-all shadow-sm"
          >
            Done Tagging ({selectedUsers.length} Selected)
          </button>
        </div>
      </div>
    </div>
  );
};
