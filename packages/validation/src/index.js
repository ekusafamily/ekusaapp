"use strict";
/**
 * EKUSA Digital Platform - Zod Validation Schemas
 * Shared validation schemas for API requests/responses across all packages
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiResponseSchema = exports.paginationQuerySchema = exports.auditLogQuerySchema = exports.notificationQuerySchema = exports.assignRoleSchema = exports.createRoleSchema = exports.assignLeaderSchema = exports.createLeadershipPositionSchema = exports.communityQuerySchema = exports.updateCommunityRequestSchema = exports.createCommunityRequestSchema = exports.pendingMessagesQuerySchema = exports.deviceRegistrationSchema = exports.blockUserRequestSchema = exports.deleteMessageRequestSchema = exports.acknowledgeMessageRequestSchema = exports.sendMessageRequestSchema = exports.createConversationRequestSchema = exports.welfareQuerySchema = exports.addWelfareUpdateSchema = exports.updateWelfareRequestSchema = exports.submitWelfareRequestSchema = exports.eventAttendanceRequestSchema = exports.registerForEventRequestSchema = exports.eventQuerySchema = exports.updateEventRequestSchema = exports.createEventRequestSchema = exports.announcementQuerySchema = exports.updateAnnouncementRequestSchema = exports.createAnnouncementRequestSchema = exports.announcementTargetSchema = exports.membershipApplicationListQuerySchema = exports.membershipReviewRequestSchema = exports.submitMembershipRequestSchema = exports.userSearchRequestSchema = exports.updateProfileRequestSchema = exports.authTokensSchema = exports.resetPasswordRequestSchema = exports.forgotPasswordRequestSchema = exports.loginRequestSchema = exports.registerRequestSchema = exports.base64Schema = exports.nonNegativeIntSchema = exports.positiveIntSchema = exports.dateTimeSchema = exports.uuidSchema = exports.passwordSchema = exports.phoneNumberSchema = exports.emailSchema = exports.usernameSchema = void 0;
exports.paginatedResponseSchema = void 0;
const zod_1 = require("zod");
// ============================================
// Primitive Validators
// ============================================
exports.usernameSchema = zod_1.z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');
exports.emailSchema = zod_1.z.string().email('Invalid email address');
exports.phoneNumberSchema = zod_1.z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format (E.164)');
exports.passwordSchema = zod_1.z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password must be at most 128 characters');
exports.uuidSchema = zod_1.z.string().uuid('Invalid UUID format');
exports.dateTimeSchema = zod_1.z.string().datetime({ offset: true });
exports.positiveIntSchema = zod_1.z.number().int().positive();
exports.nonNegativeIntSchema = zod_1.z.number().int().nonnegative();
exports.base64Schema = zod_1.z.string().base64('Must be valid base64');
// ============================================
// Auth Schemas
// ============================================
exports.registerRequestSchema = zod_1.z.object({
    username: exports.usernameSchema,
    email: exports.emailSchema.optional(),
    phoneNumber: exports.phoneNumberSchema.optional(),
    password: exports.passwordSchema,
}).strict();
exports.loginRequestSchema = zod_1.z.object({
    identifier: zod_1.z.string().min(1, 'Username or email is required'),
    password: zod_1.z.string().min(1, 'Password is required'),
}).strict();
exports.forgotPasswordRequestSchema = zod_1.z.object({
    email: exports.emailSchema,
}).strict();
exports.resetPasswordRequestSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Reset token is required'),
    password: exports.passwordSchema,
}).strict();
exports.authTokensSchema = zod_1.z.object({
    accessToken: zod_1.z.string(),
    refreshToken: zod_1.z.string(),
    expiresIn: zod_1.z.number().int().positive(),
});
// ============================================
// User & Profile Schemas
// ============================================
exports.updateProfileRequestSchema = zod_1.z.object({
    displayName: zod_1.z.string().min(1).max(100).optional(),
    bio: zod_1.z.string().max(500).optional(),
    avatarUrl: zod_1.z.string().url().optional().nullable(),
    campus: zod_1.z.string().max(100).optional(),
    course: zod_1.z.string().max(100).optional(),
    yearOfStudy: zod_1.z.number().int().min(1).max(10).optional().nullable(),
}).strict();
exports.userSearchRequestSchema = zod_1.z.object({
    query: zod_1.z.string().min(1).max(50),
    limit: zod_1.z.number().int().min(1).max(50).default(20),
    offset: zod_1.z.number().int().min(0).default(0),
}).strict();
// ============================================
// Membership Schemas
// ============================================
exports.submitMembershipRequestSchema = zod_1.z.object({
    registrationNumber: zod_1.z.string().min(1).max(50),
    campus: zod_1.z.string().min(1).max(100),
    course: zod_1.z.string().min(1).max(100),
    yearOfStudy: zod_1.z.coerce.number().int().min(1).max(10),
    contactInfo: zod_1.z.string().max(500).optional(),
}).strict();
exports.membershipReviewRequestSchema = zod_1.z.object({
    action: zod_1.z.enum(['approve', 'reject']),
    rejectionReason: zod_1.z.string().max(1000).optional(),
}).strict().refine((data) => data.action !== 'reject' || (data.rejectionReason && data.rejectionReason.length > 0), {
    message: 'Rejection reason is required when rejecting',
    path: ['rejectionReason'],
});
exports.membershipApplicationListQuerySchema = zod_1.z.object({
    status: zod_1.z.enum(['pending', 'verified', 'rejected', 'suspended', 'all']).default('pending'),
    campus: zod_1.z.string().optional(),
    page: zod_1.z.number().int().min(1).default(1),
    limit: zod_1.z.number().int().min(1).max(100).default(20),
    sortBy: zod_1.z.enum(['submittedAt', 'reviewedAt']).default('submittedAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
}).strict();
// ============================================
// Announcement Schemas
// ============================================
exports.announcementTargetSchema = zod_1.z.object({
    type: zod_1.z.enum([
        'everyone',
        'verified_members',
        'unverified_users',
        'campus',
        'committee',
        'leadership_role',
        'event_participants',
        'custom_group',
    ]),
    value: zod_1.z.string().min(1),
}).strict();
exports.createAnnouncementRequestSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200),
    body: zod_1.z.string().min(1).max(10000),
    category: zod_1.z.enum([
        'general',
        'urgent',
        'meeting',
        'event',
        'leadership',
        'welfare',
        'election',
        'administrative',
    ]),
    priority: zod_1.z.enum(['normal', 'important', 'urgent']).default('normal'),
    targets: zod_1.z.array(exports.announcementTargetSchema).min(1, 'At least one target is required'),
    scheduledAt: exports.dateTimeSchema.optional().nullable(),
    expiresAt: exports.dateTimeSchema.optional().nullable(),
    pinned: zod_1.z.boolean().default(false),
}).strict();
exports.updateAnnouncementRequestSchema = exports.createAnnouncementRequestSchema.partial().strict();
exports.announcementQuerySchema = zod_1.z.object({
    category: zod_1.z.enum([
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
    status: zod_1.z.enum(['draft', 'scheduled', 'published', 'archived', 'all']).default('published'),
    priority: zod_1.z.enum(['normal', 'important', 'urgent', 'all']).default('all'),
    page: zod_1.z.number().int().min(1).default(1),
    limit: zod_1.z.number().int().min(1).max(50).default(20),
    sortBy: zod_1.z.enum(['publishedAt', 'createdAt', 'priority']).default('publishedAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
}).strict();
// ============================================
// Event Schemas
// ============================================
const baseEventSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().min(1).max(10000),
    category: zod_1.z.enum([
        'meeting',
        'hike',
        'trip',
        'social',
        'sports',
        'academic',
        'cultural',
        'welfare',
    ]),
    venue: zod_1.z.string().min(1).max(500),
    startAt: exports.dateTimeSchema,
    endAt: exports.dateTimeSchema,
    registrationDeadline: exports.dateTimeSchema,
    capacity: zod_1.z.number().int().positive().optional().nullable(),
    eligibility: zod_1.z.string().max(500).optional().nullable(),
    registrationFee: zod_1.z.number().int().min(0).default(0),
}).strict();
exports.createEventRequestSchema = baseEventSchema.refine((data) => new Date(data.endAt) > new Date(data.startAt), { message: 'End time must be after start time', path: ['endAt'] }).refine((data) => new Date(data.registrationDeadline) <= new Date(data.startAt), { message: 'Registration deadline must be before or at event start', path: ['registrationDeadline'] });
exports.updateEventRequestSchema = baseEventSchema.partial().strict();
exports.eventQuerySchema = zod_1.z.object({
    category: zod_1.z.enum([
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
    status: zod_1.z.enum(['draft', 'published', 'cancelled', 'completed', 'archived', 'all']).default('published'),
    campus: zod_1.z.string().optional(),
    upcoming: zod_1.z.boolean().optional(),
    page: zod_1.z.number().int().min(1).default(1),
    limit: zod_1.z.number().int().min(1).max(50).default(20),
    sortBy: zod_1.z.enum(['startAt', 'createdAt', 'registrationDeadline']).default('startAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('asc'),
}).strict();
exports.registerForEventRequestSchema = zod_1.z.object({
    eventId: exports.uuidSchema,
}).strict();
exports.eventAttendanceRequestSchema = zod_1.z.object({
    eventId: exports.uuidSchema,
    userId: exports.uuidSchema,
    attendanceStatus: zod_1.z.enum(['present', 'absent', 'excused']),
}).strict();
// ============================================
// Welfare Schemas
// ============================================
exports.submitWelfareRequestSchema = zod_1.z.object({
    category: zod_1.z.enum([
        'personal',
        'emergency',
        'academic',
        'accommodation',
        'financial',
        'general',
        'other',
    ]),
    subject: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().min(1).max(5000),
}).strict();
exports.updateWelfareRequestSchema = zod_1.z.object({
    status: zod_1.z.enum([
        'submitted',
        'under_review',
        'in_progress',
        'awaiting_information',
        'resolved',
        'closed',
    ]).optional(),
    assignedOfficerId: exports.uuidSchema.optional().nullable(),
}).strict();
exports.addWelfareUpdateSchema = zod_1.z.object({
    message: zod_1.z.string().min(1).max(5000),
}).strict();
exports.welfareQuerySchema = zod_1.z.object({
    status: zod_1.z.enum([
        'submitted',
        'under_review',
        'in_progress',
        'awaiting_information',
        'resolved',
        'closed',
        'all',
    ]).default('all'),
    category: zod_1.z.enum([
        'personal',
        'emergency',
        'academic',
        'accommodation',
        'financial',
        'general',
        'other',
        'all',
    ]).default('all'),
    page: zod_1.z.number().int().min(1).default(1),
    limit: zod_1.z.number().int().min(1).max(50).default(20),
    sortBy: zod_1.z.enum(['createdAt', 'updatedAt']).default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
}).strict();
// ============================================
// Messaging Schemas
// ============================================
exports.createConversationRequestSchema = zod_1.z.object({
    recipientId: exports.uuidSchema, // for direct conversations
    // For groups:
    name: zod_1.z.string().min(1).max(100).optional(),
    description: zod_1.z.string().max(500).optional(),
    memberIds: zod_1.z.array(exports.uuidSchema).min(2).max(100).optional(),
}).strict().refine((data) => !!data.recipientId || (!!data.name && !!data.memberIds && data.memberIds.length >= 2), { message: 'Either recipientId (direct) or name + memberIds (group) required', path: ['recipientId'] });
exports.sendMessageRequestSchema = zod_1.z.object({
    conversationId: exports.uuidSchema,
    ciphertext: exports.base64Schema,
    protocolMetadata: exports.base64Schema,
    messageType: zod_1.z.enum(['text', 'image', 'file', 'voice', 'system']).default('text'),
}).strict();
exports.acknowledgeMessageRequestSchema = zod_1.z.object({
    messageId: exports.uuidSchema,
    conversationId: exports.uuidSchema,
}).strict();
exports.deleteMessageRequestSchema = zod_1.z.object({
    messageId: exports.uuidSchema,
    deleteForEveryone: zod_1.z.boolean().default(false),
}).strict();
exports.blockUserRequestSchema = zod_1.z.object({
    userId: exports.uuidSchema,
}).strict();
exports.deviceRegistrationSchema = zod_1.z.object({
    deviceName: zod_1.z.string().min(1).max(100),
    identityPublicKey: exports.base64Schema,
    registrationId: zod_1.z.number().int().positive(),
    pushToken: zod_1.z.string().optional(),
}).strict();
exports.pendingMessagesQuerySchema = zod_1.z.object({
    limit: zod_1.z.number().int().min(1).max(100).default(50),
    beforeMessageId: exports.uuidSchema.optional(),
}).strict();
// ============================================
// Community Schemas
// ============================================
exports.createCommunityRequestSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().min(1).max(2000),
    type: zod_1.z.enum([
        'general',
        'campus',
        'constituency',
        'committee',
        'interest',
        'event',
    ]),
    isPublic: zod_1.z.boolean().default(true),
    avatarUrl: zod_1.z.string().url().optional().nullable(),
}).strict();
exports.updateCommunityRequestSchema = exports.createCommunityRequestSchema.partial().strict();
exports.communityQuerySchema = zod_1.z.object({
    type: zod_1.z.enum([
        'general',
        'campus',
        'constituency',
        'committee',
        'interest',
        'event',
        'all',
    ]).default('all'),
    isPublic: zod_1.z.boolean().optional(),
    page: zod_1.z.number().int().min(1).default(1),
    limit: zod_1.z.number().int().min(1).max(50).default(20),
}).strict();
// ============================================
// Leadership Schemas
// ============================================
exports.createLeadershipPositionSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().max(500).optional(),
    order: zod_1.z.number().int().min(0),
    isActive: zod_1.z.boolean().default(true),
}).strict();
exports.assignLeaderSchema = zod_1.z.object({
    userId: exports.uuidSchema,
    positionId: exports.uuidSchema,
    startDate: exports.dateTimeSchema,
    endDate: exports.dateTimeSchema.optional().nullable(),
    contactInfo: zod_1.z.string().max(500).optional().nullable(),
}).strict();
// ============================================
// Roles & Permissions Schemas
// ============================================
exports.createRoleSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(50),
    displayName: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().max(500).optional(),
    permissions: zod_1.z.array(zod_1.z.string()).default([]),
}).strict();
exports.assignRoleSchema = zod_1.z.object({
    userId: exports.uuidSchema,
    roleId: exports.uuidSchema,
}).strict();
// ============================================
// Notification Schemas
// ============================================
exports.notificationQuerySchema = zod_1.z.object({
    category: zod_1.z.enum([
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
    unreadOnly: zod_1.z.boolean().default(false),
    page: zod_1.z.number().int().min(1).default(1),
    limit: zod_1.z.number().int().min(1).max(50).default(20),
}).strict();
// ============================================
// Audit Schemas
// ============================================
exports.auditLogQuerySchema = zod_1.z.object({
    adminUserId: exports.uuidSchema.optional(),
    action: zod_1.z.string().optional(),
    targetType: zod_1.z.string().optional(),
    targetId: exports.uuidSchema.optional(),
    startDate: exports.dateTimeSchema.optional(),
    endDate: exports.dateTimeSchema.optional(),
    page: zod_1.z.number().int().min(1).default(1),
    limit: zod_1.z.number().int().min(1).max(100).default(50),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
}).strict();
// ============================================
// Pagination & Common Response Schemas
// ============================================
exports.paginationQuerySchema = zod_1.z.object({
    page: zod_1.z.number().int().min(1).default(1),
    limit: zod_1.z.number().int().min(1).max(100).default(20),
}).strict();
const apiResponseSchema = (dataSchema) => zod_1.z.object({
    success: zod_1.z.boolean(),
    data: dataSchema.optional(),
    error: zod_1.z.object({
        code: zod_1.z.string(),
        message: zod_1.z.string(),
        details: zod_1.z.record(zod_1.z.unknown()).optional(),
    }).optional(),
    meta: zod_1.z.object({
        page: zod_1.z.number().int().optional(),
        limit: zod_1.z.number().int().optional(),
        total: zod_1.z.number().int().optional(),
        totalPages: zod_1.z.number().int().optional(),
    }).optional(),
});
exports.apiResponseSchema = apiResponseSchema;
const paginatedResponseSchema = (itemSchema) => zod_1.z.object({
    items: zod_1.z.array(itemSchema),
    page: zod_1.z.number().int(),
    limit: zod_1.z.number().int(),
    total: zod_1.z.number().int(),
    totalPages: zod_1.z.number().int(),
});
exports.paginatedResponseSchema = paginatedResponseSchema;
//# sourceMappingURL=index.js.map