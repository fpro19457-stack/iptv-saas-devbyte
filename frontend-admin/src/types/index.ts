export interface User {
  id: string;
  username: string;
  fullName?: string;
  email?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'EXPIRED';
  expiresAt?: string;
  maxDevices: number;
  pin?: string;
  createdAt: string;
  packs?: Pack[];
  activeSessions?: number;
}

export interface Admin {
  id: string;
  username: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN';
}

export interface Channel {
  id: string;
  number: number;
  name: string;
  logoUrl?: string;
  streamUrl: string;
  streamUrlBackup?: string;
  category: string;
  isAdult: boolean;
  quality: 'SD' | 'HD' | 'FHD';
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  packChannels?: { packId: string; pack: Pack }[];
}

export interface Pack {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  isActive: boolean;
  channels?: Channel[];
  userCount?: number;
}

export interface Session {
  id: string;
  user: { username: string; fullName?: string };
  channel?: { id: string; name: string; logoUrl?: string };
  deviceName?: string;
  deviceType: 'TV' | 'BROWSER' | 'MOBILE' | 'UNKNOWN';
  ipAddress?: string;
  lastSeen: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId?: string;
  user?: { username: string; fullName?: string };
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'DANGER';
  isRead: boolean;
  createdAt: string;
}

export interface Metrics {
  totalUsers: {
    active: number;
    suspended: number;
    trial: number;
    expired: number;
  };
  newUsersThisMonth: number;
  activeSessions: number;
  popularChannels: { channel: Channel; viewCount: number }[];
  distributionByStatus: {
    active: number;
    suspended: number;
    trial: number;
    expired: number;
  };
  recentActivity: {
    user: { username: string; fullName?: string };
    channel?: { name: string; logoUrl?: string };
    action: string;
    ipAddress?: string;
    createdAt: string;
  }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}