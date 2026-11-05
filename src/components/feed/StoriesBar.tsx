'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useVelo } from '@/context/VeloContext';
import { Plus } from 'lucide-react';

export const StoriesBar: React.FC = () => {
  const router = useRouter();
  const { stories, currentUser } = useVelo();

  // Group active non-archived stories by authorId
  const activeStories = stories.filter((s) => !s.isArchived);
  const storiesByAuthor = activeStories.reduce((acc, story) => {
    if (!acc[story.authorId]) {
      acc[story.authorId] = [];
    }
    acc[story.authorId].push(story);
    return acc;
  }, {} as Record<string, typeof stories>);

  const myStories = currentUser ? storiesByAuthor[currentUser.id] || [] : [];
  const otherAuthorEntries = Object.entries(storiesByAuthor).filter(
    ([authorId]) => authorId !== currentUser?.id
  );

  const handleMyStoryClick = () => {
    if (myStories.length > 0) {
      router.push(`/story/${myStories[0].id}`);
    } else {
      router.push('/story/create');
    }
  };

  const handleAddStoryIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push('/story/create');
  };

  return (
    <div className="w-full px-4 py-4 border-b border-zinc-200 dark:border-white/[0.08] overflow-x-auto scrollbar-none select-none transition-colors">
      <div className="flex items-center gap-4">
        {/* Single Unified "Your Story" Circle */}
        <div
          onClick={handleMyStoryClick}
          className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
        >
          <div className="relative w-16 h-16 rounded-full flex items-center justify-center transition-transform group-hover:scale-105">
            {/* If user has story, render ring */}
            <div
              className={`w-full h-full rounded-full p-[2px] ${
                myStories.length > 0
                  ? 'ring-2 ring-sky-500 ring-offset-2 ring-offset-white dark:ring-offset-black'
                  : 'border border-zinc-300 dark:border-zinc-700'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'}
                alt="My Story"
                className="w-full h-full rounded-full object-cover"
              />
            </div>

            {/* Small subtle '+' icon button at bottom right */}
            <button
              type="button"
              onClick={handleAddStoryIconClick}
              title="Add story"
              className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-black flex items-center justify-center border-2 border-white dark:border-black shadow-sm hover:scale-110 transition-transform"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>

          <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 max-w-[68px] truncate text-center">
            Your Story
          </span>
        </div>

        {/* Other Active Stories */}
        {otherAuthorEntries.map(([authorId, authorStories]) => {
          const firstStory = authorStories[0];
          const author = firstStory.author;

          const isViewed = authorStories.every((s) =>
            s.viewers.some((v) => v.user.id === currentUser?.id)
          );

          return (
            <Link
              key={authorId}
              href={`/story/${firstStory.id}`}
              className="flex flex-col items-center gap-1.5 shrink-0 group"
            >
              <div
                className={`w-16 h-16 rounded-full p-[2px] transition-transform duration-200 group-hover:scale-105 ${
                  isViewed
                    ? 'ring-2 ring-zinc-300 dark:ring-zinc-700 ring-offset-2 ring-offset-white dark:ring-offset-black'
                    : 'ring-2 ring-sky-500 ring-offset-2 ring-offset-white dark:ring-offset-black'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={author.avatar}
                  alt={author.username}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 max-w-[68px] truncate text-center">
                {author.fullName.split(' ')[0]}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
