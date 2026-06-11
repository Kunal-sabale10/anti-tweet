"use client";
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { TweetFeedItem, MessageItem, NotificationItem } from '@/lib/types';

interface RealTimeContextType {
  newTweets: TweetFeedItem[];
  clearNewTweets: () => void;
  newMessages: MessageItem[];
  clearNewMessages: () => void;
  newNotifications: NotificationItem[];
  clearNewNotifications: () => void;
  unreadMessageCount: number;
  unreadNotificationCount: number;
  resetUnreadMessages: () => void;
  resetUnreadNotifications: () => void;
}

const RealTimeContext = createContext<RealTimeContextType | null>(null);

export function RealTimeProvider({ children }: { children: React.ReactNode }) {
  const [newTweets, setNewTweets] = useState<TweetFeedItem[]>([]);
  const [newMessages, setNewMessages] = useState<MessageItem[]>([]);
  const [newNotifications, setNewNotifications] = useState<NotificationItem[]>([]);
  
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const since = new Date().toISOString();
    const es = new EventSource(`/api/sync/stream?since=${encodeURIComponent(since)}`);
    esRef.current = es;

    es.onmessage = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data as string);
        if (data.type === 'tweets' && data.tweets && data.tweets.length > 0) {
          setNewTweets(prev => [...prev, ...data.tweets]);
        }
        if (data.type === 'messages' && data.messages && data.messages.length > 0) {
          setNewMessages(prev => [...prev, ...data.messages]);
          setUnreadMessageCount(prev => prev + data.messages.length);
        }
        if (data.type === 'notifications' && data.notifications && data.notifications.length > 0) {
          setNewNotifications(prev => [...prev, ...data.notifications]);
          setUnreadNotificationCount(prev => prev + data.notifications.length);
        }
      } catch { /* ignore */ }
    };

    es.onerror = () => { es.close(); };

    return () => { es.close(); };
  }, []);

  const clearNewTweets = () => setNewTweets([]);
  const clearNewMessages = () => setNewMessages([]);
  const clearNewNotifications = () => setNewNotifications([]);

  const resetUnreadMessages = () => setUnreadMessageCount(0);
  const resetUnreadNotifications = () => setUnreadNotificationCount(0);

  return (
    <RealTimeContext.Provider value={{
      newTweets, clearNewTweets,
      newMessages, clearNewMessages,
      newNotifications, clearNewNotifications,
      unreadMessageCount, unreadNotificationCount,
      resetUnreadMessages, resetUnreadNotifications
    }}>
      {children}
    </RealTimeContext.Provider>
  );
}

export function useRealTime() {
  const context = useContext(RealTimeContext);
  if (!context) throw new Error('useRealTime must be used within RealTimeProvider');
  return context;
}
