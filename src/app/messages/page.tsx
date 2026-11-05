'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useVelo } from '@/context/VeloContext';
import { Message, Conversation, User } from '@/types/velo';
import { formatTimeAgo, getBubbleThemeClasses } from '@/lib/utils';
import { VoiceRecorder } from '@/components/messages/VoiceRecorder';
import { VoicePlayer } from '@/components/messages/VoicePlayer';
import { MessagePhotoCarousel } from '@/components/messages/MessagePhotoCarousel';
import { MediaLightboxModal } from '@/components/common/MediaLightboxModal';
import { MobileBottomNav } from '@/components/layout/MobileNavigation';
import {
  Search,
  Send,
  Paperclip,
  Smile,
  Mic,
  MoreVertical,
  Info,
  Reply,
  X,
  FileText,
  Image as ImageIcon,
  Check,
  CheckCheck,
  ArrowLeft,
  Copy,
  Trash2,
  Edit2,
  ExternalLink,
  Download,
  User as UserIcon,
  SmilePlus,
} from 'lucide-react';

const EMOJI_CATEGORIES = [
  {
    name: 'Smileys',
    emojis: ['😊', '😂', '🔥', '✨', '🎉', '😎', '🙌', '😍', '🤔', '🥳', '🥺', '👏'],
  },
  {
    name: 'Gestures',
    emojis: ['👍', '👋', '✌️', '🤝', '🙏', '💪', '🫡', '👀', '💯', '🚀', '⚡', '💡'],
  },
  {
    name: 'Hearts',
    emojis: ['❤️', '💖', '🖤', '🤍', '💜', '💙', '💚', '💛', '🧡', '🤎', '💔', '❣️'],
  },
  {
    name: 'Vibes',
    emojis: ['🎵', '📸', '☕', '🍸', '⭐', '🌈', '🌙', '🌊', '🎨', '🎧', '🥑', '🍕'],
  },
];

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get('user');

  const {
    currentUser,
    conversations,
    messages,
    sendMessage,
    toggleMessageReaction,
    editMessage,
    deleteMessageForMe,
    deleteMessageForEveryone,
    setContactNickname,
    clearConversationMessages,
    deleteConversation,
    settings,
    showToast,
  } = useVelo();

  // Active conversation id (start empty on mobile so conversation list and bottom nav show)
  const [activeConvId, setActiveConvId] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!targetUserId && window.innerWidth >= 768 && conversations.length > 0 && !activeConvId) {
        setActiveConvId(conversations[0].id);
      }
    }
  }, [conversations, targetUserId, activeConvId]);

  // View mode in active chat area: 'chat' vs 'contact_info' (Full-screen view as requested in Point 9)
  const [viewMode, setViewMode] = useState<'chat' | 'contact_info'>('chat');

  // Input states
  const [inputText, setInputText] = useState('');
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [searchContact, setSearchContact] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<{
    name: string;
    size: string;
    url: string;
    type: string;
  } | null>(null);

  // Context Menu state (Point 10)
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    message: Message;
  } | null>(null);

  // Edit Message modal/state
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editingText, setEditingText] = useState('');

  // Lightbox carousel modal state
  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean;
    photos: string[];
    index: number;
  }>({
    isOpen: false,
    photos: [],
    index: 0,
  });

  // Contact Info states (Point 9)
  const [contactInfoTab, setContactInfoTab] = useState<'media' | 'links' | 'docs'>('media');
  const [nicknameInput, setNicknameInput] = useState('');
  const [isEditingNickname, setIsEditingNickname] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Switch if targetUserId exists
  useEffect(() => {
    if (targetUserId) {
      const existingConv = conversations.find((c) => c.participant.id === targetUserId);
      if (existingConv) {
        setActiveConvId(existingConv.id);
      }
    }
  }, [targetUserId, conversations]);

  const activeConversation = conversations.find((c) => c.id === activeConvId);
  const allActiveMessages = activeConvId ? messages[activeConvId] || [] : [];

  // Filter messages that have NOT been deleted for current user
  const activeMessages = allActiveMessages.filter(
    (m) => !(m.deletedFor || []).includes(currentUser?.id || '')
  );

  useEffect(() => {
    if (activeConversation) {
      setNicknameInput(activeConversation.customNickname || activeConversation.participant.fullName);
    }
  }, [activeConversation]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length, activeConvId, viewMode]);

  // Close context menu on window click
  useEffect(() => {
    const handleCloseMenu = () => setContextMenu(null);
    window.addEventListener('click', handleCloseMenu);
    return () => window.removeEventListener('click', handleCloseMenu);
  }, []);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && selectedPhotos.length === 0 && !selectedDoc) return;

    const urlMatch = inputText.match(/(https?:\/\/[^\s]+)/g);
    let linkPreview = undefined;
    if (urlMatch) {
      linkPreview = {
        url: urlMatch[0],
        title: 'External Resource',
        description: 'Explore the full link destination in external web viewport.',
      };
    }

    sendMessage(activeConvId, {
      text: inputText.trim(),
      replyTo: replyingToMessage
        ? {
            id: replyingToMessage.id,
            senderName:
              replyingToMessage.senderId === currentUser?.id
                ? 'You'
                : activeConversation?.customNickname || activeConversation?.participant.fullName || 'User',
            text: replyingToMessage.text || 'Attachment',
          }
        : undefined,
      photos: selectedPhotos.length > 0 ? selectedPhotos : undefined,
      document: selectedDoc || undefined,
      linkPreview,
    });

    setInputText('');
    setReplyingToMessage(null);
    setSelectedPhotos([]);
    setSelectedDoc(null);
  };

  const handleVoiceNoteSubmit = (voiceData: { url: string; duration: number }) => {
    sendMessage(activeConvId, {
      text: '',
      voiceNote: voiceData,
    });
    setIsRecordingVoice(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedPhotos((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeInKb = (file.size / 1024).toFixed(1);
    const sizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${sizeInKb} KB`;

    setSelectedDoc({
      name: file.name,
      size: sizeStr,
      url: URL.createObjectURL(file),
      type: file.name.split('.').pop() || 'doc',
    });
  };

  // Open context menu (Right click or tap)
  const handleOpenContextMenu = (e: React.MouseEvent, message: Message) => {
    e.preventDefault();
    e.stopPropagation();

    const clickX = Math.min(window.innerWidth - 220, e.clientX);
    const clickY = Math.min(window.innerHeight - 260, e.clientY);

    setContextMenu({
      x: clickX,
      y: clickY,
      message,
    });
  };

  const handleCopyMessage = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast('Copied to clipboard', 'success');
    }
  };

  const handleSaveEditedMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMessage || !editingText.trim()) return;

    editMessage(activeConvId, editingMessage.id, editingText.trim());
    setEditingMessage(null);
    setEditingText('');
  };

  const quickEmojis = ['❤️', '👍', '😂', '😮', '😢', '🔥'];

  // Media, Links, Docs lists for contact info page
  const mediaList: string[] = [];
  const linksList: { url: string; title: string }[] = [];
  const docsList: { name: string; size: string; url: string; type: string }[] = [];

  activeMessages.forEach((msg) => {
    if (msg.photos) mediaList.push(...msg.photos);
    if (msg.linkPreview) linksList.push(msg.linkPreview);
    if (msg.document) docsList.push(msg.document);
  });

  const filteredConversations = conversations.filter(
    (c) =>
      c.participant.fullName.toLowerCase().includes(searchContact.toLowerCase()) ||
      c.participant.username.toLowerCase().includes(searchContact.toLowerCase()) ||
      (c.customNickname && c.customNickname.toLowerCase().includes(searchContact.toLowerCase()))
  );

  return (
    <div className="w-full h-full flex overflow-hidden bg-white dark:bg-black transition-colors duration-300">
      {/* Column 1: Conversations List Panel */}
      <div
        className={`w-full md:w-80 xl:w-96 flex flex-col border-r border-zinc-200 dark:border-white/[0.08] bg-zinc-50/50 dark:bg-zinc-950/40 shrink-0 h-full overflow-hidden ${
          activeConvId ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="p-4 border-b border-zinc-200 dark:border-white/[0.08]">
          <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-3">
            Messages
          </h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
            <input
              type="text"
              value={searchContact}
              onChange={(e) => setSearchContact(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-white/[0.05] border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-zinc-200/60 dark:divide-white/[0.04] pb-24 md:pb-4">
          {filteredConversations.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-400">
              No conversations found
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = conv.id === activeConvId;
              const displayName = conv.customNickname || conv.participant.fullName;

              return (
                <button
                  key={conv.id}
                  onClick={() => {
                    setActiveConvId(conv.id);
                    setViewMode('chat');
                  }}
                  className={`w-full p-3.5 flex items-start gap-3 text-left transition-colors ${
                    isActive
                      ? 'bg-zinc-200/60 dark:bg-white/[0.08]'
                      : 'hover:bg-zinc-100/70 dark:hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={conv.participant.avatar}
                      alt={conv.participant.username}
                      className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-white/10"
                    />
                    {conv.participant.onlineStatus === 'online' && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-black" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {displayName}
                      </span>
                      {conv.lastMessage && (
                        <span className="text-[10px] text-zinc-400 shrink-0">
                          {formatTimeAgo(conv.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-500 truncate mt-0.5">
                      {conv.lastMessage?.text ||
                        (conv.lastMessage?.photos?.length ? 'Shared photos' : '') ||
                        (conv.lastMessage?.voiceNote ? 'Voice note' : 'Start chatting')}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Column 2: Main Space (Chat Room OR Full-Page Contact Info) */}
      {activeConversation ? (
        <div
          className={`flex-1 flex flex-col min-w-0 h-full relative overflow-hidden ${
            !activeConvId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* ===================== VIEW MODE 1: CHAT ROOM ===================== */}
          {viewMode === 'chat' && (
            <>
              {/* Chat Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-white/[0.08] bg-white/80 dark:bg-black/80 backdrop-blur-xl z-20">
                <div
                  onClick={() => setViewMode('contact_info')}
                  className="flex items-center gap-3 min-w-0 cursor-pointer group"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveConvId('');
                    }}
                    className="md:hidden p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-400"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeConversation.participant.avatar}
                    alt={activeConversation.participant.username}
                    className="w-9 h-9 rounded-full object-cover border border-zinc-200 dark:border-white/10 shrink-0"
                  />

                  <div className="min-w-0">
                    <h2 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:underline truncate leading-tight">
                      {activeConversation.customNickname || activeConversation.participant.fullName}
                    </h2>
                    <p className="text-[11px] text-zinc-400 truncate">
                      @{activeConversation.participant.username} • Tap for contact details
                    </p>
                  </div>
                </div>

                {/* Right Header Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setViewMode('contact_info')}
                    className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
                    title="View Contact Info"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeMessages.map((msg) => {
                  const isSender = msg.senderId === currentUser?.id;
                  const themeStyles = getBubbleThemeClasses(
                    settings.chatBubbleColor || 'zinc-dark',
                    isSender
                  );

                  return (
                    <div
                      key={msg.id}
                      onContextMenu={(e) => handleOpenContextMenu(e, msg)}
                      className={`flex flex-col group ${
                        isSender ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div
                        className={`relative max-w-sm sm:max-w-md md:max-w-lg p-3 rounded-2xl ${themeStyles.bubbleClass}`}
                      >
                        {/* Reply Banner */}
                        {msg.replyTo && (
                          <div className="mb-2 p-2 rounded-xl bg-black/10 dark:bg-white/10 text-xs border-l-2 border-current">
                            <span className="font-bold block opacity-90">
                              {msg.replyTo.senderName}
                            </span>
                            <span className="opacity-75 truncate block">
                              {msg.replyTo.text}
                            </span>
                          </div>
                        )}

                        {/* Multi-Photo Interactive Carousel with Lightbox on click */}
                        {msg.photos && msg.photos.length > 0 && (
                          <MessagePhotoCarousel
                            photos={msg.photos}
                            onPhotoClick={(idx) =>
                              setLightboxState({
                                isOpen: true,
                                photos: msg.photos || [],
                                index: idx,
                              })
                            }
                          />
                        )}

                        {/* Document */}
                        {msg.document && (
                          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-black/10 dark:bg-white/10 mb-2">
                            <FileText className="w-5 h-5 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold truncate">{msg.document.name}</p>
                              <p className="text-[10px] opacity-75">{msg.document.size}</p>
                            </div>
                            <a
                              href={msg.document.url}
                              download={msg.document.name}
                              className="p-1 hover:opacity-80"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        )}

                        {/* Link Preview */}
                        {msg.linkPreview && (
                          <a
                            href={msg.linkPreview.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block p-2 rounded-xl bg-black/10 dark:bg-white/10 mb-2 hover:opacity-90"
                          >
                            <p className="text-xs font-bold truncate flex items-center gap-1">
                              <span>{msg.linkPreview.title}</span>
                              <ExternalLink className="w-3 h-3" />
                            </p>
                            <p className="text-[10px] opacity-75 truncate">{msg.linkPreview.url}</p>
                          </a>
                        )}

                        {/* Voice Note Player */}
                        {msg.voiceNote && (
                          <VoicePlayer
                            url={msg.voiceNote.url}
                            duration={msg.voiceNote.duration}
                            isSender={isSender}
                          />
                        )}

                        {/* Text */}
                        {msg.text && (
                          <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line break-words">
                            {msg.text}
                          </p>
                        )}

                        {/* Footer: Timestamp & edited badge */}
                        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] opacity-60">
                          {msg.isEdited && <span>(edited)</span>}
                          <span>{formatTimeAgo(msg.createdAt)}</span>
                          {isSender && <CheckCheck className="w-3 h-3" />}
                        </div>

                        {/* Emoji Reactions Pill */}
                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                          <div className="absolute -bottom-2 right-2 flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 text-xs shadow-sm">
                            {Object.values(msg.reactions).map((emoji, eIdx) => (
                              <span key={eIdx}>{emoji}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Preview Banner */}
              {replyingToMessage && (
                <div className="px-4 py-2 bg-zinc-100 dark:bg-zinc-900 border-t border-zinc-200 dark:border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <Reply className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span className="truncate">
                      Replying to <b>{replyingToMessage.senderId === currentUser?.id ? 'yourself' : activeConversation.participant.fullName}</b>: {replyingToMessage.text || 'Attachment'}
                    </span>
                  </div>
                  <button type="button" onClick={() => setReplyingToMessage(null)}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Pending Attachments */}
              {(selectedPhotos.length > 0 || selectedDoc) && (
                <div className="px-4 py-2 border-t border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900 flex items-center gap-2 overflow-x-auto">
                  {selectedPhotos.map((photo, i) => (
                    <div key={i} className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setSelectedPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {selectedDoc && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-xs">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[120px]">{selectedDoc.name}</span>
                      <button type="button" onClick={() => setSelectedDoc(null)}>
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Input Controls Bar */}
              <div className="p-3 md:p-4 border-t border-zinc-200 dark:border-white/[0.08] bg-white/80 dark:bg-black/80 backdrop-blur-xl">
                {isRecordingVoice ? (
                  <VoiceRecorder
                    onSendVoiceNote={handleVoiceNoteSubmit}
                    onCancel={() => setIsRecordingVoice(false)}
                  />
                ) : (
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <label className="p-2 rounded-xl text-zinc-500 hover:text-black dark:hover:text-white cursor-pointer transition-colors">
                      <ImageIcon className="w-5 h-5" />
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>

                    <label className="p-2 rounded-xl text-zinc-500 hover:text-black dark:hover:text-white cursor-pointer transition-colors">
                      <Paperclip className="w-5 h-5" />
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.zip,.txt"
                        onChange={handleDocUpload}
                        className="hidden"
                      />
                    </label>

                    {/* Emoji shortcut button & floating categorized popover */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsEmojiPickerOpen((prev) => !prev)}
                        className={`p-2 rounded-xl transition-colors ${
                          isEmojiPickerOpen
                            ? 'text-zinc-900 dark:text-white bg-zinc-200/70 dark:bg-white/15'
                            : 'text-zinc-500 hover:text-black dark:hover:text-white'
                        }`}
                        title="Insert emoji"
                      >
                        <Smile className="w-5 h-5" />
                      </button>

                      {isEmojiPickerOpen && (
                        <div className="absolute bottom-12 left-0 z-50 w-72 sm:w-80 p-3 rounded-2xl bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl border border-zinc-200/80 dark:border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200/60 dark:border-white/[0.08]">
                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                              Emojis
                            </span>
                            <button
                              type="button"
                              onClick={() => setIsEmojiPickerOpen(false)}
                              className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="max-h-56 overflow-y-auto space-y-2.5 pr-1">
                            {EMOJI_CATEGORIES.map((cat) => (
                              <div key={cat.name}>
                                <p className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 mb-1">
                                  {cat.name}
                                </p>
                                <div className="grid grid-cols-6 gap-1">
                                  {cat.emojis.map((emoji) => (
                                    <button
                                      key={emoji}
                                      type="button"
                                      onClick={() => {
                                        setInputText((prev) => prev + emoji);
                                      }}
                                      className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-zinc-100 dark:hover:bg-white/10 text-base transition-transform active:scale-125"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Type a message or paste a link..."
                      className="flex-1 px-4 py-2.5 rounded-full bg-zinc-100 dark:bg-white/[0.05] border border-transparent focus:border-zinc-300 dark:focus:border-white/20 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 text-xs sm:text-sm focus:outline-none"
                    />

                    {inputText.trim() || selectedPhotos.length > 0 || selectedDoc ? (
                      <button
                        type="submit"
                        className="p-2.5 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-black hover:opacity-90 transition-all shadow-sm"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsRecordingVoice(true)}
                        className="p-2.5 rounded-full bg-zinc-100 dark:bg-white/[0.08] text-zinc-700 dark:text-zinc-300 hover:opacity-90 transition-all"
                        title="Record voice note"
                      >
                        <Mic className="w-4 h-4" />
                      </button>
                    )}
                  </form>
                )}
              </div>
            </>
          )}

          {/* ===================== VIEW MODE 2: FULL-PAGE CONTACT INFO ===================== */}
          {viewMode === 'contact_info' && (
            <div className="flex-1 flex flex-col h-full overflow-y-auto bg-white dark:bg-black">
              {/* Top Navigation */}
              <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3.5 border-b border-zinc-200 dark:border-white/[0.08] bg-white/80 dark:bg-black/80 backdrop-blur-xl">
                <button
                  type="button"
                  onClick={() => setViewMode('chat')}
                  className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-400"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Contact Information
                </h2>
              </div>

              {/* Profile Card & Nickname Editor */}
              <div className="max-w-2xl mx-auto w-full p-6 flex flex-col items-center text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeConversation.participant.avatar}
                  alt={activeConversation.participant.username}
                  className="w-24 h-24 rounded-full object-cover border-2 border-zinc-200 dark:border-white/10 mb-4 shadow-md"
                />

                {isEditingNickname ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setContactNickname(activeConversation.id, nicknameInput.trim());
                      setIsEditingNickname(false);
                    }}
                    className="flex items-center gap-2 mb-2"
                  >
                    <input
                      type="text"
                      value={nicknameInput}
                      onChange={(e) => setNicknameInput(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-white/20 bg-zinc-100 dark:bg-zinc-900 text-sm font-semibold text-center focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-black text-xs font-semibold"
                    >
                      Save
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                      {activeConversation.customNickname || activeConversation.participant.fullName}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsEditingNickname(true)}
                      className="p-1 text-zinc-400 hover:text-black dark:hover:text-white"
                      title="Edit custom contact alias"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <p className="text-xs text-zinc-500 mb-2">
                  @{activeConversation.participant.username}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-md leading-relaxed mb-4">
                  {activeConversation.participant.bio}
                </p>

                <div className="flex items-center gap-2 mb-6">
                  <Link
                    href={`/profile/${activeConversation.participant.username}`}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-zinc-300 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/5 text-xs font-semibold text-zinc-800 dark:text-zinc-200"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>View Public Profile</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      clearConversationMessages(activeConversation.id);
                      showToast('Messages cleared', 'info');
                    }}
                    className="px-4 py-2 rounded-full border border-rose-200 dark:border-rose-900/40 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-semibold"
                  >
                    Clear Chat History
                  </button>
                </div>

                {/* Full Width Media, Links, Docs Tabs */}
                <div className="w-full border-t border-zinc-200 dark:border-white/[0.08] pt-6">
                  <div className="flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl mb-6">
                    <button
                      type="button"
                      onClick={() => setContactInfoTab('media')}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                        contactInfoTab === 'media'
                          ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm'
                          : 'text-zinc-500 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      Media ({mediaList.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setContactInfoTab('links')}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                        contactInfoTab === 'links'
                          ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm'
                          : 'text-zinc-500 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      Links ({linksList.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setContactInfoTab('docs')}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                        contactInfoTab === 'docs'
                          ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm'
                          : 'text-zinc-500 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      Docs ({docsList.length})
                    </button>
                  </div>

                  {contactInfoTab === 'media' && (
                    <div>
                      {mediaList.length === 0 ? (
                        <p className="text-xs text-zinc-400 py-12">No media photos shared</p>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                          {mediaList.map((m, i) => (
                            <div
                              key={i}
                              onClick={() =>
                                setLightboxState({
                                  isOpen: true,
                                  photos: mediaList,
                                  index: i,
                                })
                              }
                              className="aspect-square rounded-2xl overflow-hidden bg-black/5 dark:bg-white/5 cursor-pointer"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={m}
                                alt="Shared media"
                                className="w-full h-full object-cover hover:scale-105 transition-transform"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {contactInfoTab === 'links' && (
                    <div className="space-y-2 text-left">
                      {linksList.length === 0 ? (
                        <p className="text-xs text-zinc-400 py-12 text-center">No links shared</p>
                      ) : (
                        linksList.map((lnk, i) => (
                          <a
                            key={i}
                            href={lnk.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors"
                          >
                            <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                              {lnk.url}
                            </span>
                            <ExternalLink className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          </a>
                        ))
                      )}
                    </div>
                  )}

                  {contactInfoTab === 'docs' && (
                    <div className="space-y-2 text-left">
                      {docsList.length === 0 ? (
                        <p className="text-xs text-zinc-400 py-12 text-center">No documents shared</p>
                      ) : (
                        docsList.map((doc, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08]"
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <FileText className="w-4 h-4 text-zinc-400 shrink-0" />
                              <div className="truncate">
                                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                  {doc.name}
                                </p>
                                <p className="text-[10px] text-zinc-500">{doc.size}</p>
                              </div>
                            </div>
                            <a
                              href={doc.url}
                              download={doc.name}
                              className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-white/10"
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
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 hidden md:flex items-center justify-center text-zinc-400 text-xs">
          Select a chat to begin messaging
        </div>
      )}

      {/* ===================== CONTEXT MENU (Point 10) ===================== */}
      {contextMenu && (
        <div
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-50 w-52 p-2 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/15 shadow-2xl animate-in fade-in select-none text-xs"
        >
          {/* Quick Reaction Emojis Row */}
          <div className="flex items-center justify-around pb-2 border-b border-zinc-200 dark:border-white/10 mb-1.5">
            {quickEmojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  toggleMessageReaction(activeConvId, contextMenu.message.id, emoji);
                  setContextMenu(null);
                }}
                className="hover:scale-125 transition-transform text-base"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Reply */}
          <button
            type="button"
            onClick={() => {
              setReplyingToMessage(contextMenu.message);
              setContextMenu(null);
            }}
            className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200 text-left"
          >
            <Reply className="w-3.5 h-3.5" />
            <span>Reply</span>
          </button>

          {/* Copy */}
          {contextMenu.message.text && (
            <button
              type="button"
              onClick={() => {
                handleCopyMessage(contextMenu.message.text);
                setContextMenu(null);
              }}
              className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200 text-left"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </button>
          )}

          {/* Edit (Own text messages only, disabled for voice notes) */}
          {contextMenu.message.senderId === currentUser?.id && contextMenu.message.text && !contextMenu.message.voiceNote && (
            <button
              type="button"
              onClick={() => {
                setEditingMessage(contextMenu.message);
                setEditingText(contextMenu.message.text);
                setContextMenu(null);
              }}
              className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200 text-left"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Message</span>
            </button>
          )}

          <div className="border-t border-zinc-200 dark:border-white/10 my-1" />

          {/* Delete for Me */}
          <button
            type="button"
            onClick={() => {
              deleteMessageForMe(activeConvId, contextMenu.message.id);
              setContextMenu(null);
            }}
            className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200 text-left"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete for me</span>
          </button>

          {/* Delete for Everyone (if sender) */}
          {contextMenu.message.senderId === currentUser?.id && (
            <button
              type="button"
              onClick={() => {
                deleteMessageForEveryone(activeConvId, contextMenu.message.id);
                setContextMenu(null);
              }}
              className="flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-xl hover:bg-rose-500/10 text-rose-500 text-left"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete for everyone</span>
            </button>
          )}
        </div>
      )}

      {/* ===================== EDIT MESSAGE MODAL ===================== */}
      {editingMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form
            onSubmit={handleSaveEditedMessage}
            className="w-full max-w-md p-5 rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/15 shadow-2xl"
          >
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3">
              Edit Message
            </h3>
            <textarea
              value={editingText}
              onChange={(e) => setEditingText(e.target.value)}
              rows={3}
              className="w-full p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none mb-4"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingMessage(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-black text-xs font-semibold"
              >
                Save Edit
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===================== FULLSCREEN MEDIA LIGHTBOX MODAL ===================== */}
      <MediaLightboxModal
        isOpen={lightboxState.isOpen}
        media={lightboxState.photos.map((url) => ({ url, type: 'image' }))}
        initialIndex={lightboxState.index}
        onClose={() => setLightboxState((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* ===================== MOBILE BOTTOM NAV ===================== */}
      {/* Visible on Mobile ONLY when viewing conversation list, hidden inside chat */}
      {!activeConvId && <MobileBottomNav />}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-zinc-400">Loading messages...</div>}>
      <MessagesContent />
    </Suspense>
  );
}
