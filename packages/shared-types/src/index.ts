/**
 * EKUSA Digital Platform - Shared TypeScript Types
 * Core domain types shared across mobile, admin, and API packages
 */

// ============================================
// User & Authentication Types
// ============================================

export type AccountStatus =
  | 'registered'
  | 'membership_pending'
  | 'verified_member'
  | 'rejected'
  | 'suspended'
  | 'deactivated';

export interface User {
  id: string;
  username: string;
  email?: string;
  phoneNumber?: string;
  passwordHash: string; // Never exposed in API responses
  accountStatus: AccountStatus;
  // Profile fields (returned by API, optional for display)
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  campus?: string;
  course?: string;
  yearOfStudy?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicUserProfile {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  campus?: string;
  course?: string;
  yearOfStudy?: number;
  membershipStatus: MembershipStatus;
  isVerifiedMember: boolean;
  createdAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

export interface RegisterRequest {
  username: string;
  email?: string;
  phoneNumber?: string;
  password: string;
}

export interface LoginRequest {
  identifier: string; // username or email
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

// ============================================
// Membership Types
// ============================================

export type MembershipStatus =
  | 'none'
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'suspended';

export interface MembershipApplication {
  id: string;
  userId: string;
  registrationNumber: string;
  campus: string;
  course: string;
  yearOfStudy: number;
  contactInfo?: string;
  membershipStatus: MembershipStatus;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string; // admin user ID
  rejectionReason?: string;
}

export interface SubmitMembershipRequest {
  registrationNumber: string;
  campus: string;
  course: string;
  yearOfStudy: number;
  contactInfo?: string;
}

export interface MembershipReviewRequest {
  action: 'approve' | 'reject';
  rejectionReason?: string;
}

// ============================================
// Announcement Types
// ============================================

export type AnnouncementCategory =
  | 'general'
  | 'urgent'
  | 'meeting'
  | 'event'
  | 'leadership'
  | 'welfare'
  | 'election'
  | 'administrative';

export type AnnouncementPriority = 'normal' | 'important' | 'urgent';

export type AnnouncementStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export type AnnouncementTargetType =
  | 'everyone'
  | 'verified_members'
  | 'unverified_users'
  | 'campus'
  | 'committee'
  | 'leadership_role'
  | 'event_participants'
  | 'custom_group';

export interface AnnouncementTarget {
  type: AnnouncementTargetType;
  value: string; // e.g., campus name, committee ID, etc.
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  publisherId: string;
  publisherName: string; // denormalized for display
  status: AnnouncementStatus;
  publishedAt?: Date;
  scheduledAt?: Date;
  expiresAt?: Date;
  pinned: boolean;
  targets: AnnouncementTarget[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAnnouncementRequest {
  title: string;
  body: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  targets: AnnouncementTarget[];
  scheduledAt?: Date;
  expiresAt?: Date;
  pinned?: boolean;
}

export interface AnnouncementReadReceipt {
  announcementId: string;
  userId: string;
  firstOpenedAt: Date;
  lastOpenedAt: Date;
}

export interface AnnouncementStats {
  totalRecipients: number;
  notifiedDevices: number;
  openedCount: number;
  readPercentage: number;
  unreadCount: number;
}

// ============================================
// Event Types
// ============================================

export type EventCategory =
  | 'meeting'
  | 'hike'
  | 'trip'
  | 'social'
  | 'sports'
  | 'academic'
  | 'cultural'
  | 'welfare';

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed' | 'archived';

export type RegistrationStatus = 'registered' | 'cancelled' | 'waitlisted' | 'attended';

export interface Event {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  venue: string;
  startAt: Date;
  endAt: Date;
  registrationDeadline: Date;
  capacity?: number;
  eligibility?: string; // e.g., "verified_members", "campus:embu"
  registrationFee: number; // in cents/KES
  status: EventStatus;
  pinned?: boolean;
  avatarObjectKey?: string; // S3/storage object key for event image
  registrationStatus?: RegistrationStatus; // current user's registration status
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  registrationStatus: RegistrationStatus;
  registeredAt: Date;
  attendanceStatus?: 'present' | 'absent' | 'excused';
}

export interface CreateEventRequest {
  title: string;
  description: string;
  category: EventCategory;
  venue: string;
  startAt: Date;
  endAt: Date;
  registrationDeadline: Date;
  capacity?: number;
  eligibility?: string;
  registrationFee: number;
}

export interface RegisterForEventRequest {
  eventId: string;
}

// ============================================
// Welfare Types
// ============================================

export type WelfareCategory =
  | 'personal'
  | 'emergency'
  | 'academic'
  | 'accommodation'
  | 'financial'
  | 'general'
  | 'other';

export type WelfareStatus =
  | 'submitted'
  | 'under_review'
  | 'in_progress'
  | 'awaiting_information'
  | 'resolved'
  | 'closed';

export interface WelfareRequest {
  id: string;
  userId: string;
  userName: string; // denormalized
  category: WelfareCategory;
  subject: string;
  description: string;
  status: WelfareStatus;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}

export interface WelfareUpdate {
  id: string;
  requestId: string;
  authorId: string;
  authorName: string;
  message: string;
  createdAt: Date;
}

export interface SubmitWelfareRequestRequest {
  category: WelfareCategory;
  subject: string;
  description: string;
}

export interface UpdateWelfareRequestRequest {
  status?: WelfareStatus;
  assignedOfficerId?: string;
}

export interface AddWelfareUpdateRequest {
  message: string;
}

// ============================================
// Messaging Types
// ============================================

export interface ConversationUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  lastSeenAt?: string | null;
}

export interface Conversation {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  otherUser?: ConversationUser | null;
  lastMessage?: MessageSummary | null;
  unreadCount: number;
}

export interface MessageSummary {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  status: MessageStatus;
  sentAt: Date;
}

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'seen' | 'failed';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  status: MessageStatus;
  sentAt: Date;
  deliveredAt?: Date | null;
  seenAt?: Date | null;
}

export interface BlockUserRequest {
  userId: string;
}

// ============================================
// Community Types
// ============================================

export type CommunityType =
  | 'general'
  | 'campus'
  | 'constituency'
  | 'committee'
  | 'interest'
  | 'event';

export interface Community {
  id: string;
  name: string;
  description: string;
  type: CommunityType;
  avatarUrl?: string;
  isPublic: boolean;
  memberCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunityMember {
  communityId: string;
  userId: string;
  role: 'member' | 'moderator' | 'admin';
  joinedAt: Date;
}

// ============================================
// Leadership Types
// ============================================

export interface LeadershipPosition {
  id: string;
  title: string;
  description?: string;
  order: number;
  isActive: boolean;
}

export interface Leader {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  positionId: string;
  positionTitle: string;
  startDate: Date;
  endDate?: Date;
  contactInfo?: string;
  isActive: boolean;
}

// ============================================
// Roles & Permissions
// ============================================

export type RoleName =
  | 'super_admin'
  | 'chairperson'
  | 'vice_chairperson'
  | 'secretary'
  | 'communication_officer'
  | 'treasurer'
  | 'welfare_officer'
  | 'event_coordinator'
  | 'membership_officer'
  | 'ordinary_member';

export type PermissionName =
  | 'publish_announcements'
  | 'approve_membership'
  | 'create_events'
  | 'manage_welfare'
  | 'manage_finances'
  | 'manage_admins'
  | 'view_audit_logs'
  | 'manage_settings'
  | 'manage_community'
  | 'manage_leadership';

export interface Role {
  id: string;
  name: RoleName;
  displayName: string;
  description?: string;
  permissions: PermissionName[];
}

export interface UserRole {
  userId: string;
  roleId: string;
  assignedBy: string;
  assignedAt: Date;
}

// ============================================
// Notification Types
// ============================================

export type NotificationCategory =
  | 'announcement'
  | 'event_reminder'
  | 'event_registration'
  | 'membership_update'
  | 'welfare_update'
  | 'message'
  | 'group_activity'
  | 'admin_alert';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

export interface Notification {
  id: string;
  userId: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  sentAt: Date;
  readAt?: Date;
}

// ============================================
// Audit Types
// ============================================

export interface AuditLog {
  id: string;
  adminUserId: string;
  adminUserName: string;
  action: string;
  targetType: string;
  targetId: string;
  changes?: Record<string, { before: unknown; after: unknown }>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ============================================
// Push Notification Payload
// ============================================

export interface FcmNotificationPayload {
  type: 'announcement' | 'message' | 'event' | 'membership' | 'welfare' | 'system';
  referenceId: string; // announcementId, messageId, eventId, etc.
  title: string;
  body: string;
  priority: 'normal' | 'high';
  data?: Record<string, string>;
}