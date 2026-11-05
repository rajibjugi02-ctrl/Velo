'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Conversation, Message } from '@/types/velo';
import { useVelo } from '@/context/VeloContext';
import {
  X,
  Edit2,
  Check,
  Image as ImageIcon,
  Link2,
  FileText,
  ExternalLink,
  Download,
  User,
} from 'lucide-react';

interface ContactInfoDrawerProps {
  conversation: Conversation;
  messages: Message[];
  isOpen: boolean;
  onClose: () => void;
}

export const ContactInfoDrawer: React.FC<ContactInfoDrawerProps> = ({
  conversation,
  messages,
  isOpen,
  onClose,
}) => {
  const { setContactNickname } = useVelo();
  const [activeTab, setActiveTab] = useState<'media' | 'links' | 'docs'>('media');
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(
    conversation.customNickname || conversation.participant.fullName
  );

  if (!isOpen) return null;

  const handleSaveNickname = (e: React.FormEvent) => {
    e.preventDefault();
    if (nicknameInput.trim()) {
      setContactNickname(conversation.id, nicknameInput.trim());
      setIsEditingNickname(false);
    }
  };

  // Collect all media, links, and documents sent in this conversation
  const mediaList: string[] = [];
  const linksList: { url: string; title: string; desc?: string }[] = [];
  const docsList: { name: string; size: string; url: string; type: string }[] = [];

  messages.forEach((msg) => {
    if (msg.photos && msg.photos.length > 0) {
      mediaList.push(...msg.photos);
    }
    if (msg.linkPreview) {
      linksList.push({
        url: msg.linkPreview.url,
        title: msg.linkPreview.title,
        desc: msg.linkPreview.description,
      });
    }
    if (msg.document) {
      docsList.push(msg.document);
    }
  });

  return (
    <div className="fixed inset-y-0 right-0 w-80 md:w-96 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl border-l border-zinc-200 dark:border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 text-zinc-900 dark:text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-white/10">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
          Contact Information
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Profile Overview & Editable Nickname */}
      <div className="p-5 flex flex-col items-center text-center border-b border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.01]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={conversation.participant.avatar}
          alt={conversation.participant.username}
          className="w-20 h-20 rounded-full object-cover border-2 border-zinc-200 dark:border-white/20 mb-3 shadow-lg"
        />

        {/* Custom Nickname Edit Form */}
        {isEditingNickname ? (
          <form onSubmit={handleSaveNickname} className="flex items-center gap-1.5 my-1">
            <input
              type="text"
              value={nicknameInput}
              onChange={(e) => setNicknameInput(e.target.value)}
              className="px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-white/10 border border-zinc-200 dark:border-white/20 text-xs font-bold text-zinc-900 dark:text-white text-center focus:outline-none focus:border-zinc-400"
              autoFocus
            />
            <button
              type="submit"
              className="p-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-black hover:opacity-90"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-1.5">
            <h4 className="text-base font-bold text-zinc-900 dark:text-white leading-tight">
              {conversation.customNickname || conversation.participant.fullName}
            </h4>
            <button
              onClick={() => setIsEditingNickname(true)}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              title="Edit custom contact nickname"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          @{conversation.participant.username}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 line-clamp-2 px-2">
          {conversation.participant.bio}
        </p>

        <Link
          href={`/profile/${conversation.participant.username}`}
          className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-800 dark:text-white transition-colors"
        >
          <User className="w-3.5 h-3.5" />
          <span>View Full Profile</span>
        </Link>
      </div>

      {/* Tabs: Media, Links, Docs */}
      <div className="flex p-2 gap-1 border-b border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.02]">
        <button
          onClick={() => setActiveTab('media')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'media'
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-black shadow-sm'
              : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
            }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Media ({mediaList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('links')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'links'
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-black shadow-sm'
              : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
            }`}
        >
          <Link2 className="w-3.5 h-3.5" />
          <span>Links ({linksList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('docs')}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'docs'
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-black shadow-sm'
              : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
            }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Docs ({docsList.length})</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* Media Grid */}
        {activeTab === 'media' && (
          <div>
            {mediaList.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-500">
                No shared photos or videos in this chat yet.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {mediaList.map((imgUrl, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-xl overflow-hidden border border-white/10 bg-black/40 group relative"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgUrl}
                      alt="Shared media"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Links List */}
        {activeTab === 'links' && (
          <div className="space-y-2">
            {linksList.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-500">
                No links shared in this conversation.
              </div>
            ) : (
              linksList.map((item, i) => (
                <a
                  key={i}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group"
                >
                  <Link2 className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white group-hover:text-sky-400 truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                      {item.url}
                    </p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-500 group-hover:text-white shrink-0" />
                </a>
              ))
            )}
          </div>
        )}

        {/* Docs List */}
        {activeTab === 'docs' && (
          <div className="space-y-2">
            {docsList.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-500">
                No documents shared in this conversation.
              </div>
            ) : (
              docsList.map((doc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">
                        {doc.name}
                      </p>
                      <p className="text-[10px] text-neutral-400">
                        {doc.size} • {doc.type.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <a
                    href={doc.url}
                    download={doc.name}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

