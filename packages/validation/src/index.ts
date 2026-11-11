/**
 * EKUSA Digital Platform - Zod Validation Schemas
 * Shared validation schemas for API requests/responses across all packages
 */

import { z } from 'zod';

// ============================================
// Primitive Validators
// ============================================

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');

export const emailSchema = z.string().email('Invalid email address');

export const phoneNumberSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format (E.164)');

export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(128, 'Password must be at most 128 characters');

export const uuidSchema = z.string().uuid('Invalid UUID format');

export const dateTimeSchema = z.string().datetime({ offset: true });

export const positiveIntSchema = z.number().int().positive();

export const nonNegativeIntSchema = z.number().int().nonnegative();

export const base64Schema = z.string().base64('Must be valid base64');

// ============================================
// Auth Schemas
// ============================================

export const registerRequestSchema = z.object({
  username: usernameSchema,
  email: emailSchema.optional(),
  phoneNumber: phoneNumberSchema.optional(),
  password: passwordSchema,
}).strict();

export const loginRequestSchema = z.object({
  identifier: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
}).strict();

export const forgotPasswordRequestSchema = z.object({
  email: emailSchema,
}).strict();

export const resetPasswordRequestSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
}).strict();

export const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number().int().positive(),
});

// ============================================
// User & Profile Schemas
// ============================================

export const updateProfileRequestSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  campus: z.string().max(100).optional(),
  course: z.string().max(100).optional(),
  yearOfStudy: z.number().int().min(1).max(10).optional().nullable(),
}).strict();

export const userSearchRequestSchema = z.object({
  query: z.string().min(1).max(50),
  limit: z.number().int().min(1).max(50).default(20),
  offset: z.number().int().min(0).default(0),
}).strict();

// ============================================
// Membership Schemas
// ============================================

export const submitMembershipRequestSchema = z.object({
  registrationNumber: z.string().min(1).max(50),
  campus: z.string().min(1).max(100),
  course: z.string().min(1).max(100),
  yearOfStudy: z.coerce.number().int().min(1).max(10),
  contactInfo: z.string().max(500).optional(),
}).strict();

export const membershipReviewRequestSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().max(1000).optional(),
}).strict().refine(
  (data) => data.action !== 'reject' || (data.rejectionReason && data.rejectionReason.length > 0),
  {
    message: 'Rejection reason is required when rejecting',
    path: ['rejectionReason'],
  }
);

export const membershipApplicationListQuerySchema = z.object({
  status: z.enum(['pending', 'verified', 'rejected', 'suspended', 'all']).default('pending'),
  campus: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['submittedAt', 'reviewedAt']).default('submittedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
}).strict();

// ============================================
// Announcement Schemas
// ============================================

export const announcementTargetSchema = z.object({
  type: z.enum([
    'everyone',
    'verified_members',
    'unverified_users',
    'campus',
    'committee',
    'leadership_role',
    'event_participants',
    'custom_group',
  ]),
  value: z.string().min(1),
}).strict();

export const createAnnouncementRequestSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
  category: z.enum([
    'general',
    'urgent',
    'meeting',
    'event',
    'leadership',
    'welfare',
    'election',
    'administrative',
  ]),
  priority: z.enum(['normal', 'important', 'urgent']).default('normal'),
  targets: z.array(announcementTargetSchema).min(1, 'At least one target is required'),
  scheduledAt: dateTimeSchema.optional().nullable(),
  expiresAt: dateTimeSchema.optional().nullable(),
  pinned: z.boolean().default(false),
}).strict();

export const updateAnnouncementRequestSchema = createAnnouncementRequestSchema.partial().strict();

export const announcementQuerySchema = z.object({
  category: z.enum([
    'general',
    'urgent',
    'meeting',
    'event',
    'leadership',
    'welfare',
    'election',
    'administrative',
    'all',
  ]).default('all'),
  status: z.enum(['draft', 'scheduled', 'published', 'archived', 'all']).default('published'),
  priority: z.enum(['normal', 'important', 'urgent', 'all']).default('all'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
  sortBy: z.enum(['publishedAt', 'createdAt', 'priority']).default('publishedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
}).strict();

// ============================================
// Event Schemas
// ============================================

const baseEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(10000),
  category: z.enum([
    'meeting',
    'hike',
    'trip',
    'social',
    'sports',
    'academic',
    'cultural',
    'welfare',
  ]),
  venue: z.string().min(1).max(500),
  startAt: dateTimeSchema,
  endAt: dateTimeSchema,
  registrationDeadline: dateTimeSchema,
  capacity: z.number().int().positive().optional().nullable(),
  eligibility: z.string().max(500).optional().nullable(),
  registrationFee: z.number().int().min(0).default(0),
}).strict();

export const createEventRequestSchema = baseEventSchema.refine(
  (data) => new Date(data.endAt) > new Date(data.startAt),
  { message: 'End time must be after start time', path: ['endAt'] }
).refine(
  (data) => new Date(data.registrationDeadline) <= new Date(data.startAt),
  { message: 'Registration deadline must be before or at event start', path: ['registrationDeadline'] }
);

export const updateEventRequestSchema = baseEventSchema.partial().strict();

export const eventQuerySchema = z.object({
  category: z.enum([
    'meeting',
    'hike',
    'trip',
    'social',
    'sports',
    'academic',
    'cultural',
    'welfare',
    'all',
  ]).default('all'),
  status: z.enum(['draft', 'published', 'cancelled', 'completed', 'archived', 'all']).default('published'),
  campus: z.string().optional(),
  upcoming: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
  sortBy: z.enum(['startAt', 'createdAt', 'registrationDeadline']).default('startAt'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
}).strict();

export const registerForEventRequestSchema = z.object({
  eventId: uuidSchema,
}).strict();

export const eventAttendanceRequestSchema = z.object({
  eventId: uuidSchema,
  userId: uuidSchema,
  attendanceStatus: z.enum(['present', 'absent', 'excused']),
}).strict();

// ============================================
// Welfare Schemas
// ============================================

export const submitWelfareRequestSchema = z.object({
  category: z.enum([
    'personal',
    'emergency',
    'academic',
    'accommodation',
    'financial',
    'general',
    'other',
  ]),
  subject: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
}).strict();

export const updateWelfareRequestSchema = z.object({
  status: z.enum([
    'submitted',
    'under_review',
    'in_progress',
    'awaiting_information',
    'resolved',
    'closed',
  ]).optional(),
  assignedOfficerId: uuidSchema.optional().nullable(),
}).strict();

export const addWelfareUpdateSchema = z.object({
  message: z.string().min(1).max(5000),
}).strict();

export const welfareQuerySchema = z.object({
  status: z.enum([
    'submitted',
    'under_review',
    'in_progress',
    'awaiting_information',
    'resolved',
    'closed',
    'all',
  ]).default('all'),
  category: z.enum([
    'personal',
    'emergency',
    'academic',
    'accommodation',
    'financial',
    'general',
    'other',
    'all',
  ]).default('all'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
}).strict();

// ============================================
// Messaging Schemas
// ============================================

export const createConversationRequestSchema = z.object({
  recipientId: uuidSchema,
}).strict();

export const sendMessageRequestSchema = z.object({
  conversationId: uuidSchema,
  content: z.string().min(1).max(4000),
}).strict();

export const blockUserRequestSchema = z.object({
  userId: uuidSchema,
}).strict();

// ============================================
// Community Schemas
// ============================================

export const createCommunityRequestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(2000),
  type: z.enum([
    'general',
    'campus',
    'constituency',
    'committee',
    'interest',
    'event',
  ]),
  isPublic: z.boolean().default(true),
  avatarUrl: z.string().url().optional().nullable(),
}).strict();

export const updateCommunityRequestSchema = createCommunityRequestSchema.partial().strict();

export const communityQuerySchema = z.object({
  type: z.enum([
    'general',
    'campus',
    'constituency',
    'committee',
    'interest',
    'event',
    'all',
  ]).default('all'),
  isPublic: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
}).strict();

// ============================================
// Leadership Schemas
// ============================================

export const createLeadershipPositionSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  order: z.number().int().min(0),
  isActive: z.boolean().default(true),
}).strict();

export const assignLeaderSchema = z.object({
  userId: uuidSchema,
  positionId: uuidSchema,
  startDate: dateTimeSchema,
  endDate: dateTimeSchema.optional().nullable(),
  contactInfo: z.string().max(500).optional().nullable(),
}).strict();

// ============================================
// Roles & Permissions Schemas
// ============================================

export const createRoleSchema = z.object({
  name: z.string().min(1).max(50),
  displayName: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string()).default([]),
}).strict();

export const assignRoleSchema = z.object({
  userId: uuidSchema,
  roleId: uuidSchema,
}).strict();

// ============================================
// Notification Schemas
// ============================================

export const notificationQuerySchema = z.object({
  category: z.enum([
    'announcement',
    'event_reminder',
    'event_registration',
    'membership_update',
    'welfare_update',
    'message',
    'group_activity',
    'admin_alert',
    'all',
  ]).default('all'),
  unreadOnly: z.boolean().default(false),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
}).strict();

// ============================================
// Audit Schemas
// ============================================

export const auditLogQuerySchema = z.object({
  adminUserId: uuidSchema.optional(),
  action: z.string().optional(),
  targetType: z.string().optional(),
  targetId: uuidSchema.optional(),
  startDate: dateTimeSchema.optional(),
  endDate: dateTimeSchema.optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
}).strict();

// ============================================
// Pagination & Common Response Schemas
// ============================================

export const paginationQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
}).strict();

export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.record(z.unknown()).optional(),
    }).optional(),
    meta: z.object({
      page: z.number().int().optional(),
      limit: z.number().int().optional(),
      total: z.number().int().optional(),
      totalPages: z.number().int().optional(),
    }).optional(),
  });

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  });

// ============================================
// Type Exports (inferred from schemas)
// ============================================

export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;
export type AuthTokens = z.infer<typeof authTokensSchema>;

export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;
export type UserSearchRequest = z.infer<typeof userSearchRequestSchema>;

export type SubmitMembershipRequest = z.infer<typeof submitMembershipRequestSchema>;
export type MembershipReviewRequest = z.infer<typeof membershipReviewRequestSchema>;
export type MembershipApplicationListQuery = z.infer<typeof membershipApplicationListQuerySchema>;

export type AnnouncementTarget = z.infer<typeof announcementTargetSchema>;
export type CreateAnnouncementRequest = z.infer<typeof createAnnouncementRequestSchema>;
export type UpdateAnnouncementRequest = z.infer<typeof updateAnnouncementRequestSchema>;
export type AnnouncementQuery = z.infer<typeof announcementQuerySchema>;

export type CreateEventRequest = z.infer<typeof createEventRequestSchema>;
export type UpdateEventRequest = z.infer<typeof updateEventRequestSchema>;
export type EventQuery = z.infer<typeof eventQuerySchema>;
export type RegisterForEventRequest = z.infer<typeof registerForEventRequestSchema>;
export type EventAttendanceRequest = z.infer<typeof eventAttendanceRequestSchema>;

export type SubmitWelfareRequest = z.infer<typeof submitWelfareRequestSchema>;
export type UpdateWelfareRequest = z.infer<typeof updateWelfareRequestSchema>;
export type AddWelfareUpdate = z.infer<typeof addWelfareUpdateSchema>;
export type WelfareQuery = z.infer<typeof welfareQuerySchema>;

export type CreateConversationRequest = z.infer<typeof createConversationRequestSchema>;
export type SendMessageRequest = z.infer<typeof sendMessageRequestSchema>;
export type BlockUserRequest = z.infer<typeof blockUserRequestSchema>;

export type CreateCommunityRequest = z.infer<typeof createCommunityRequestSchema>;
export type UpdateCommunityRequest = z.infer<typeof updateCommunityRequestSchema>;
export type CommunityQuery = z.infer<typeof communityQuerySchema>;

export type CreateLeadershipPositionRequest = z.infer<typeof createLeadershipPositionSchema>;
export type AssignLeaderRequest = z.infer<typeof assignLeaderSchema>;

export type CreateRoleRequest = z.infer<typeof createRoleSchema>;
export type AssignRoleRequest = z.infer<typeof assignRoleSchema>;

export type NotificationQuery = z.infer<typeof notificationQuerySchema>;

export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;