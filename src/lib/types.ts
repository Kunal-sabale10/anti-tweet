import type { Language } from '@/lib/i18n';

export interface SessionPayload {
  userId: string;
  email?: string | null;
  iat?: number;
  exp?: number;
}

export interface LoginSessionData {
  browserType: string;
  osType: string;
  deviceCat: string;
  ipAddress: string;
}

export interface ApiErrorResponse {
  error?: string;
}

export interface AuthSuccessResponse {
  success?: boolean;
  redirect?: string;
}

export interface LoginOtpResponse extends AuthSuccessResponse {
  requiresOtp?: boolean;
  userId?: string;
  sessionData?: LoginSessionData;
}

export interface SettingsUser {
  email: string | null;
  phone: string | null;
  language: Language;
  notificationPref: boolean;
  subscription?: string;
  username?: string | null;
  displayName?: string | null;
  bio?: string | null;
  dmPrivacy?: string;
  tweetPrivacy?: string;
}

export interface TweetFeedItem {
  id: string;
  content: string | null;
  audioUrl: string | null;
  imageUrl: string | null;
  createdAt: string;
  likeCount: number;
  replyCount: number;
  retweetCount: number;
  bookmarkCount: number;
  likedByMe: boolean;
  retweetedByMe: boolean;
  bookmarkedByMe: boolean;
  isFollowersOnly: boolean;
  isQuote: boolean;
  viewCount: number;
  retweetOfId: string | null;
  retweetOf?: TweetFeedItem | null;
  user?: {
    id: string;
    email: string;
    username: string | null;
    displayName: string | null;
    avatar: string | null;
    subscription?: string | null;
  } | null;
}

export interface NotificationItem {
  id: string;
  type: string;
  read: boolean;
  createdAt: string;
  fromUser: {
    id: string;
    email: string;
    username: string | null;
    displayName: string | null;
    avatar: string | null;
  };
  tweetId: string | null;
  previewText: string | null;
}

export interface ReplyItem {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
    username: string | null;
    displayName: string | null;
    avatar: string | null;
  };
}

export interface PublicUser {
  id: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
  avatar: string | null;
  banner: string | null;
  bio: string | null;
  isOnline: boolean;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  followsMe: boolean;
  dmPrivacy: string;
  subscription: string | null;
  loginSessions?: {
    id: string;
    browserType: string | null;
    os: string | null;
    deviceCat: string | null;
    ipAddress: string | null;
    loggedInAt: string;
  }[];
}

export interface ConversationItem {
  id: string;
  otherUser: {
    id: string;
    email: string | null;
    username: string | null;
    displayName: string | null;
    avatar: string | null;
  };
  lastMessage?: {
    content: string;
    createdAt: string;
    senderId: string;
  } | null;
  unreadCount: number;
}

export interface MessageItem {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  readAt: string | null;
}
