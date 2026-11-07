/**
 * EKUSA Digital Platform - Zod Validation Schemas
 * Shared validation schemas for API requests/responses across all packages
 */
import { z } from 'zod';
export declare const usernameSchema: z.ZodString;
export declare const emailSchema: z.ZodString;
export declare const phoneNumberSchema: z.ZodString;
export declare const passwordSchema: z.ZodString;
export declare const uuidSchema: z.ZodString;
export declare const dateTimeSchema: z.ZodString;
export declare const positiveIntSchema: z.ZodNumber;
export declare const nonNegativeIntSchema: z.ZodNumber;
export declare const base64Schema: z.ZodString;
export declare const registerRequestSchema: z.ZodObject<{
    username: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    phoneNumber: z.ZodOptional<z.ZodString>;
    password: z.ZodString;
}, "strict", z.ZodTypeAny, {
    username: string;
    password: string;
    email?: string | undefined;
    phoneNumber?: string | undefined;
}, {
    username: string;
    password: string;
    email?: string | undefined;
    phoneNumber?: string | undefined;
}>;
export declare const loginRequestSchema: z.ZodObject<{
    identifier: z.ZodString;
    password: z.ZodString;
}, "strict", z.ZodTypeAny, {
    password: string;
    identifier: string;
}, {
    password: string;
    identifier: string;
}>;
export declare const forgotPasswordRequestSchema: z.ZodObject<{
    email: z.ZodString;
}, "strict", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const resetPasswordRequestSchema: z.ZodObject<{
    token: z.ZodString;
    password: z.ZodString;
}, "strict", z.ZodTypeAny, {
    password: string;
    token: string;
}, {
    password: string;
    token: string;
}>;
export declare const authTokensSchema: z.ZodObject<{
    accessToken: z.ZodString;
    refreshToken: z.ZodString;
    expiresIn: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}, {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}>;
export declare const updateProfileRequestSchema: z.ZodObject<{
    displayName: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodString>;
    avatarUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    campus: z.ZodOptional<z.ZodString>;
    course: z.ZodOptional<z.ZodString>;
    yearOfStudy: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, "strict", z.ZodTypeAny, {
    displayName?: string | undefined;
    bio?: string | undefined;
    campus?: string | undefined;
    course?: string | undefined;
    yearOfStudy?: number | null | undefined;
    avatarUrl?: string | null | undefined;
}, {
    displayName?: string | undefined;
    bio?: string | undefined;
    campus?: string | undefined;
    course?: string | undefined;
    yearOfStudy?: number | null | undefined;
    avatarUrl?: string | null | undefined;
}>;
export declare const userSearchRequestSchema: z.ZodObject<{
    query: z.ZodString;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    query: string;
    offset: number;
    limit: number;
}, {
    query: string;
    offset?: number | undefined;
    limit?: number | undefined;
}>;
export declare const submitMembershipRequestSchema: z.ZodObject<{
    registrationNumber: z.ZodString;
    campus: z.ZodString;
    course: z.ZodString;
    yearOfStudy: z.ZodNumber;
    contactInfo: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    campus: string;
    course: string;
    yearOfStudy: number;
    registrationNumber: string;
    contactInfo?: string | undefined;
}, {
    campus: string;
    course: string;
    yearOfStudy: number;
    registrationNumber: string;
    contactInfo?: string | undefined;
}>;
export declare const membershipReviewRequestSchema: z.ZodEffects<z.ZodObject<{
    action: z.ZodEnum<["approve", "reject"]>;
    rejectionReason: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    action: "approve" | "reject";
    rejectionReason?: string | undefined;
}, {
    action: "approve" | "reject";
    rejectionReason?: string | undefined;
}>, {
    action: "approve" | "reject";
    rejectionReason?: string | undefined;
}, {
    action: "approve" | "reject";
    rejectionReason?: string | undefined;
}>;
export declare const membershipApplicationListQuerySchema: z.ZodObject<{
    status: z.ZodDefault<z.ZodEnum<["pending", "verified", "rejected", "suspended", "all"]>>;
    campus: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodDefault<z.ZodEnum<["submittedAt", "reviewedAt"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strict", z.ZodTypeAny, {
    sortOrder: "asc" | "desc";
    status: "rejected" | "suspended" | "verified" | "pending" | "all";
    sortBy: "submittedAt" | "reviewedAt";
    limit: number;
    page: number;
    campus?: string | undefined;
}, {
    campus?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    status?: "rejected" | "suspended" | "verified" | "pending" | "all" | undefined;
    sortBy?: "submittedAt" | "reviewedAt" | undefined;
    limit?: number | undefined;
    page?: number | undefined;
}>;
export declare const announcementTargetSchema: z.ZodObject<{
    type: z.ZodEnum<["everyone", "verified_members", "unverified_users", "campus", "committee", "leadership_role", "event_participants", "custom_group"]>;
    value: z.ZodString;
}, "strict", z.ZodTypeAny, {
    type: "campus" | "everyone" | "verified_members" | "unverified_users" | "committee" | "leadership_role" | "event_participants" | "custom_group";
    value: string;
}, {
    type: "campus" | "everyone" | "verified_members" | "unverified_users" | "committee" | "leadership_role" | "event_participants" | "custom_group";
    value: string;
}>;
export declare const createAnnouncementRequestSchema: z.ZodObject<{
    title: z.ZodString;
    body: z.ZodString;
    category: z.ZodEnum<["general", "urgent", "meeting", "event", "leadership", "welfare", "election", "administrative"]>;
    priority: z.ZodDefault<z.ZodEnum<["normal", "important", "urgent"]>>;
    targets: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["everyone", "verified_members", "unverified_users", "campus", "committee", "leadership_role", "event_participants", "custom_group"]>;
        value: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        type: "campus" | "everyone" | "verified_members" | "unverified_users" | "committee" | "leadership_role" | "event_participants" | "custom_group";
        value: string;
    }, {
        type: "campus" | "everyone" | "verified_members" | "unverified_users" | "committee" | "leadership_role" | "event_participants" | "custom_group";
        value: string;
    }>, "many">;
    scheduledAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    expiresAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    pinned: z.ZodDefault<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    title: string;
    body: string;
    category: "event" | "general" | "urgent" | "meeting" | "leadership" | "welfare" | "election" | "administrative";
    priority: "urgent" | "normal" | "important";
    targets: {
        type: "campus" | "everyone" | "verified_members" | "unverified_users" | "committee" | "leadership_role" | "event_participants" | "custom_group";
        value: string;
    }[];
    pinned: boolean;
    expiresAt?: string | null | undefined;
    scheduledAt?: string | null | undefined;
}, {
    title: string;
    body: string;
    category: "event" | "general" | "urgent" | "meeting" | "leadership" | "welfare" | "election" | "administrative";
    targets: {
        type: "campus" | "everyone" | "verified_members" | "unverified_users" | "committee" | "leadership_role" | "event_participants" | "custom_group";
        value: string;
    }[];
    expiresAt?: string | null | undefined;
    priority?: "urgent" | "normal" | "important" | undefined;
    scheduledAt?: string | null | undefined;
    pinned?: boolean | undefined;
}>;
export declare const updateAnnouncementRequestSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    body: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodEnum<["general", "urgent", "meeting", "event", "leadership", "welfare", "election", "administrative"]>>;
    priority: z.ZodOptional<z.ZodDefault<z.ZodEnum<["normal", "important", "urgent"]>>>;
    targets: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["everyone", "verified_members", "unverified_users", "campus", "committee", "leadership_role", "event_participants", "custom_group"]>;
        value: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        type: "campus" | "everyone" | "verified_members" | "unverified_users" | "committee" | "leadership_role" | "event_participants" | "custom_group";
        value: string;
    }, {
        type: "campus" | "everyone" | "verified_members" | "unverified_users" | "committee" | "leadership_role" | "event_participants" | "custom_group";
        value: string;
    }>, "many">>;
    scheduledAt: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    expiresAt: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    pinned: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, "strict", z.ZodTypeAny, {
    expiresAt?: string | null | undefined;
    title?: string | undefined;
    body?: string | undefined;
    category?: "event" | "general" | "urgent" | "meeting" | "leadership" | "welfare" | "election" | "administrative" | undefined;
    priority?: "urgent" | "normal" | "important" | undefined;
    targets?: {
        type: "campus" | "everyone" | "verified_members" | "unverified_users" | "committee" | "leadership_role" | "event_participants" | "custom_group";
        value: string;
    }[] | undefined;
    scheduledAt?: string | null | undefined;
    pinned?: boolean | undefined;
}, {
    expiresAt?: string | null | undefined;
    title?: string | undefined;
    body?: string | undefined;
    category?: "event" | "general" | "urgent" | "meeting" | "leadership" | "welfare" | "election" | "administrative" | undefined;
    priority?: "urgent" | "normal" | "important" | undefined;
    targets?: {
        type: "campus" | "everyone" | "verified_members" | "unverified_users" | "committee" | "leadership_role" | "event_participants" | "custom_group";
        value: string;
    }[] | undefined;
    scheduledAt?: string | null | undefined;
    pinned?: boolean | undefined;
}>;
export declare const announcementQuerySchema: z.ZodObject<{
    category: z.ZodDefault<z.ZodEnum<["general", "urgent", "meeting", "event", "leadership", "welfare", "election", "administrative", "all"]>>;
    status: z.ZodDefault<z.ZodEnum<["draft", "scheduled", "published", "archived", "all"]>>;
    priority: z.ZodDefault<z.ZodEnum<["normal", "important", "urgent", "all"]>>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodDefault<z.ZodEnum<["publishedAt", "createdAt", "priority"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strict", z.ZodTypeAny, {
    sortOrder: "asc" | "desc";
    status: "all" | "draft" | "scheduled" | "published" | "archived";
    sortBy: "createdAt" | "priority" | "publishedAt";
    limit: number;
    page: number;
    category: "event" | "all" | "general" | "urgent" | "meeting" | "leadership" | "welfare" | "election" | "administrative";
    priority: "all" | "urgent" | "normal" | "important";
}, {
    sortOrder?: "asc" | "desc" | undefined;
    status?: "all" | "draft" | "scheduled" | "published" | "archived" | undefined;
    sortBy?: "createdAt" | "priority" | "publishedAt" | undefined;
    limit?: number | undefined;
    page?: number | undefined;
    category?: "event" | "all" | "general" | "urgent" | "meeting" | "leadership" | "welfare" | "election" | "administrative" | undefined;
    priority?: "all" | "urgent" | "normal" | "important" | undefined;
}>;
export declare const createEventRequestSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    category: z.ZodEnum<["meeting", "hike", "trip", "social", "sports", "academic", "cultural", "welfare"]>;
    venue: z.ZodString;
    startAt: z.ZodString;
    endAt: z.ZodString;
    registrationDeadline: z.ZodString;
    capacity: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    eligibility: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    registrationFee: z.ZodDefault<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    description: string;
    title: string;
    category: "meeting" | "welfare" | "hike" | "trip" | "social" | "sports" | "academic" | "cultural";
    venue: string;
    startAt: string;
    endAt: string;
    registrationDeadline: string;
    registrationFee: number;
    capacity?: number | null | undefined;
    eligibility?: string | null | undefined;
}, {
    description: string;
    title: string;
    category: "meeting" | "welfare" | "hike" | "trip" | "social" | "sports" | "academic" | "cultural";
    venue: string;
    startAt: string;
    endAt: string;
    registrationDeadline: string;
    capacity?: number | null | undefined;
    eligibility?: string | null | undefined;
    registrationFee?: number | undefined;
}>, {
    description: string;
    title: string;
    category: "meeting" | "welfare" | "hike" | "trip" | "social" | "sports" | "academic" | "cultural";
    venue: string;
    startAt: string;
    endAt: string;
    registrationDeadline: string;
    registrationFee: number;
    capacity?: number | null | undefined;
    eligibility?: string | null | undefined;
}, {
    description: string;
    title: string;
    category: "meeting" | "welfare" | "hike" | "trip" | "social" | "sports" | "academic" | "cultural";
    venue: string;
    startAt: string;
    endAt: string;
    registrationDeadline: string;
    capacity?: number | null | undefined;
    eligibility?: string | null | undefined;
    registrationFee?: number | undefined;
}>, {
    description: string;
    title: string;
    category: "meeting" | "welfare" | "hike" | "trip" | "social" | "sports" | "academic" | "cultural";
    venue: string;
    startAt: string;
    endAt: string;
    registrationDeadline: string;
    registrationFee: number;
    capacity?: number | null | undefined;
    eligibility?: string | null | undefined;
}, {
    description: string;
    title: string;
    category: "meeting" | "welfare" | "hike" | "trip" | "social" | "sports" | "academic" | "cultural";
    venue: string;
    startAt: string;
    endAt: string;
    registrationDeadline: string;
    capacity?: number | null | undefined;
    eligibility?: string | null | undefined;
    registrationFee?: number | undefined;
}>;
export declare const updateEventRequestSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodEnum<["meeting", "hike", "trip", "social", "sports", "academic", "cultural", "welfare"]>>;
    venue: z.ZodOptional<z.ZodString>;
    startAt: z.ZodOptional<z.ZodString>;
    endAt: z.ZodOptional<z.ZodString>;
    registrationDeadline: z.ZodOptional<z.ZodString>;
    capacity: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    eligibility: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    registrationFee: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
}, "strict", z.ZodTypeAny, {
    description?: string | undefined;
    title?: string | undefined;
    category?: "meeting" | "welfare" | "hike" | "trip" | "social" | "sports" | "academic" | "cultural" | undefined;
    venue?: string | undefined;
    startAt?: string | undefined;
    endAt?: string | undefined;
    registrationDeadline?: string | undefined;
    capacity?: number | null | undefined;
    eligibility?: string | null | undefined;
    registrationFee?: number | undefined;
}, {
    description?: string | undefined;
    title?: string | undefined;
    category?: "meeting" | "welfare" | "hike" | "trip" | "social" | "sports" | "academic" | "cultural" | undefined;
    venue?: string | undefined;
    startAt?: string | undefined;
    endAt?: string | undefined;
    registrationDeadline?: string | undefined;
    capacity?: number | null | undefined;
    eligibility?: string | null | undefined;
    registrationFee?: number | undefined;
}>;
export declare const eventQuerySchema: z.ZodObject<{
    category: z.ZodDefault<z.ZodEnum<["meeting", "hike", "trip", "social", "sports", "academic", "cultural", "welfare", "all"]>>;
    status: z.ZodDefault<z.ZodEnum<["draft", "published", "cancelled", "completed", "archived", "all"]>>;
    campus: z.ZodOptional<z.ZodString>;
    upcoming: z.ZodOptional<z.ZodBoolean>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodDefault<z.ZodEnum<["startAt", "createdAt", "registrationDeadline"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strict", z.ZodTypeAny, {
    sortOrder: "asc" | "desc";
    status: "all" | "draft" | "published" | "archived" | "cancelled" | "completed";
    sortBy: "createdAt" | "startAt" | "registrationDeadline";
    limit: number;
    page: number;
    category: "all" | "meeting" | "welfare" | "hike" | "trip" | "social" | "sports" | "academic" | "cultural";
    campus?: string | undefined;
    upcoming?: boolean | undefined;
}, {
    campus?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    status?: "all" | "draft" | "published" | "archived" | "cancelled" | "completed" | undefined;
    sortBy?: "createdAt" | "startAt" | "registrationDeadline" | undefined;
    limit?: number | undefined;
    page?: number | undefined;
    category?: "all" | "meeting" | "welfare" | "hike" | "trip" | "social" | "sports" | "academic" | "cultural" | undefined;
    upcoming?: boolean | undefined;
}>;
export declare const registerForEventRequestSchema: z.ZodObject<{
    eventId: z.ZodString;
}, "strict", z.ZodTypeAny, {
    eventId: string;
}, {
    eventId: string;
}>;
export declare const eventAttendanceRequestSchema: z.ZodObject<{
    eventId: z.ZodString;
    userId: z.ZodString;
    attendanceStatus: z.ZodEnum<["present", "absent", "excused"]>;
}, "strict", z.ZodTypeAny, {
    userId: string;
    eventId: string;
    attendanceStatus: "present" | "absent" | "excused";
}, {
    userId: string;
    eventId: string;
    attendanceStatus: "present" | "absent" | "excused";
}>;
export declare const submitWelfareRequestSchema: z.ZodObject<{
    category: z.ZodEnum<["personal", "emergency", "academic", "accommodation", "financial", "general", "other"]>;
    subject: z.ZodString;
    description: z.ZodString;
}, "strict", z.ZodTypeAny, {
    description: string;
    category: "general" | "academic" | "personal" | "emergency" | "accommodation" | "financial" | "other";
    subject: string;
}, {
    description: string;
    category: "general" | "academic" | "personal" | "emergency" | "accommodation" | "financial" | "other";
    subject: string;
}>;
export declare const updateWelfareRequestSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["submitted", "under_review", "in_progress", "awaiting_information", "resolved", "closed"]>>;
    assignedOfficerId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    status?: "submitted" | "under_review" | "in_progress" | "awaiting_information" | "resolved" | "closed" | undefined;
    assignedOfficerId?: string | null | undefined;
}, {
    status?: "submitted" | "under_review" | "in_progress" | "awaiting_information" | "resolved" | "closed" | undefined;
    assignedOfficerId?: string | null | undefined;
}>;
export declare const addWelfareUpdateSchema: z.ZodObject<{
    message: z.ZodString;
}, "strict", z.ZodTypeAny, {
    message: string;
}, {
    message: string;
}>;
export declare const welfareQuerySchema: z.ZodObject<{
    status: z.ZodDefault<z.ZodEnum<["submitted", "under_review", "in_progress", "awaiting_information", "resolved", "closed", "all"]>>;
    category: z.ZodDefault<z.ZodEnum<["personal", "emergency", "academic", "accommodation", "financial", "general", "other", "all"]>>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodDefault<z.ZodEnum<["createdAt", "updatedAt"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strict", z.ZodTypeAny, {
    sortOrder: "asc" | "desc";
    status: "all" | "submitted" | "under_review" | "in_progress" | "awaiting_information" | "resolved" | "closed";
    sortBy: "createdAt" | "updatedAt";
    limit: number;
    page: number;
    category: "all" | "general" | "academic" | "personal" | "emergency" | "accommodation" | "financial" | "other";
}, {
    sortOrder?: "asc" | "desc" | undefined;
    status?: "all" | "submitted" | "under_review" | "in_progress" | "awaiting_information" | "resolved" | "closed" | undefined;
    sortBy?: "createdAt" | "updatedAt" | undefined;
    limit?: number | undefined;
    page?: number | undefined;
    category?: "all" | "general" | "academic" | "personal" | "emergency" | "accommodation" | "financial" | "other" | undefined;
}>;
export declare const createConversationRequestSchema: z.ZodEffects<z.ZodObject<{
    recipientId: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    memberIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strict", z.ZodTypeAny, {
    recipientId: string;
    description?: string | undefined;
    name?: string | undefined;
    memberIds?: string[] | undefined;
}, {
    recipientId: string;
    description?: string | undefined;
    name?: string | undefined;
    memberIds?: string[] | undefined;
}>, {
    recipientId: string;
    description?: string | undefined;
    name?: string | undefined;
    memberIds?: string[] | undefined;
}, {
    recipientId: string;
    description?: string | undefined;
    name?: string | undefined;
    memberIds?: string[] | undefined;
}>;
export declare const sendMessageRequestSchema: z.ZodObject<{
    conversationId: z.ZodString;
    ciphertext: z.ZodString;
    protocolMetadata: z.ZodString;
    messageType: z.ZodDefault<z.ZodEnum<["text", "image", "file", "voice", "system"]>>;
}, "strict", z.ZodTypeAny, {
    conversationId: string;
    ciphertext: string;
    protocolMetadata: string;
    messageType: "text" | "image" | "file" | "voice" | "system";
}, {
    conversationId: string;
    ciphertext: string;
    protocolMetadata: string;
    messageType?: "text" | "image" | "file" | "voice" | "system" | undefined;
}>;
export declare const acknowledgeMessageRequestSchema: z.ZodObject<{
    messageId: z.ZodString;
    conversationId: z.ZodString;
}, "strict", z.ZodTypeAny, {
    conversationId: string;
    messageId: string;
}, {
    conversationId: string;
    messageId: string;
}>;
export declare const deleteMessageRequestSchema: z.ZodObject<{
    messageId: z.ZodString;
    deleteForEveryone: z.ZodDefault<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    messageId: string;
    deleteForEveryone: boolean;
}, {
    messageId: string;
    deleteForEveryone?: boolean | undefined;
}>;
export declare const blockUserRequestSchema: z.ZodObject<{
    userId: z.ZodString;
}, "strict", z.ZodTypeAny, {
    userId: string;
}, {
    userId: string;
}>;
export declare const deviceRegistrationSchema: z.ZodObject<{
    deviceName: z.ZodString;
    identityPublicKey: z.ZodString;
    registrationId: z.ZodNumber;
    pushToken: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    deviceName: string;
    identityPublicKey: string;
    registrationId: number;
    pushToken?: string | undefined;
}, {
    deviceName: string;
    identityPublicKey: string;
    registrationId: number;
    pushToken?: string | undefined;
}>;
export declare const pendingMessagesQuerySchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodNumber>;
    beforeMessageId: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    limit: number;
    beforeMessageId?: string | undefined;
}, {
    limit?: number | undefined;
    beforeMessageId?: string | undefined;
}>;
export declare const createCommunityRequestSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    type: z.ZodEnum<["general", "campus", "constituency", "committee", "interest", "event"]>;
    isPublic: z.ZodDefault<z.ZodBoolean>;
    avatarUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    description: string;
    name: string;
    type: "event" | "campus" | "committee" | "general" | "constituency" | "interest";
    isPublic: boolean;
    avatarUrl?: string | null | undefined;
}, {
    description: string;
    name: string;
    type: "event" | "campus" | "committee" | "general" | "constituency" | "interest";
    avatarUrl?: string | null | undefined;
    isPublic?: boolean | undefined;
}>;
export declare const updateCommunityRequestSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["general", "campus", "constituency", "committee", "interest", "event"]>>;
    isPublic: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    avatarUrl: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
}, "strict", z.ZodTypeAny, {
    description?: string | undefined;
    name?: string | undefined;
    type?: "event" | "campus" | "committee" | "general" | "constituency" | "interest" | undefined;
    avatarUrl?: string | null | undefined;
    isPublic?: boolean | undefined;
}, {
    description?: string | undefined;
    name?: string | undefined;
    type?: "event" | "campus" | "committee" | "general" | "constituency" | "interest" | undefined;
    avatarUrl?: string | null | undefined;
    isPublic?: boolean | undefined;
}>;
export declare const communityQuerySchema: z.ZodObject<{
    type: z.ZodDefault<z.ZodEnum<["general", "campus", "constituency", "committee", "interest", "event", "all"]>>;
    isPublic: z.ZodOptional<z.ZodBoolean>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    type: "event" | "campus" | "all" | "committee" | "general" | "constituency" | "interest";
    limit: number;
    page: number;
    isPublic?: boolean | undefined;
}, {
    type?: "event" | "campus" | "all" | "committee" | "general" | "constituency" | "interest" | undefined;
    limit?: number | undefined;
    page?: number | undefined;
    isPublic?: boolean | undefined;
}>;
export declare const createLeadershipPositionSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    order: z.ZodNumber;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    title: string;
    order: number;
    isActive: boolean;
    description?: string | undefined;
}, {
    title: string;
    order: number;
    description?: string | undefined;
    isActive?: boolean | undefined;
}>;
export declare const assignLeaderSchema: z.ZodObject<{
    userId: z.ZodString;
    positionId: z.ZodString;
    startDate: z.ZodString;
    endDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    contactInfo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    userId: string;
    startDate: string;
    positionId: string;
    contactInfo?: string | null | undefined;
    endDate?: string | null | undefined;
}, {
    userId: string;
    startDate: string;
    positionId: string;
    contactInfo?: string | null | undefined;
    endDate?: string | null | undefined;
}>;
export declare const createRoleSchema: z.ZodObject<{
    name: z.ZodString;
    displayName: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    permissions: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strict", z.ZodTypeAny, {
    name: string;
    displayName: string;
    permissions: string[];
    description?: string | undefined;
}, {
    name: string;
    displayName: string;
    description?: string | undefined;
    permissions?: string[] | undefined;
}>;
export declare const assignRoleSchema: z.ZodObject<{
    userId: z.ZodString;
    roleId: z.ZodString;
}, "strict", z.ZodTypeAny, {
    userId: string;
    roleId: string;
}, {
    userId: string;
    roleId: string;
}>;
export declare const notificationQuerySchema: z.ZodObject<{
    category: z.ZodDefault<z.ZodEnum<["announcement", "event_reminder", "event_registration", "membership_update", "welfare_update", "message", "group_activity", "admin_alert", "all"]>>;
    unreadOnly: z.ZodDefault<z.ZodBoolean>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    limit: number;
    page: number;
    category: "announcement" | "message" | "all" | "event_reminder" | "event_registration" | "membership_update" | "welfare_update" | "group_activity" | "admin_alert";
    unreadOnly: boolean;
}, {
    limit?: number | undefined;
    page?: number | undefined;
    category?: "announcement" | "message" | "all" | "event_reminder" | "event_registration" | "membership_update" | "welfare_update" | "group_activity" | "admin_alert" | undefined;
    unreadOnly?: boolean | undefined;
}>;
export declare const auditLogQuerySchema: z.ZodObject<{
    adminUserId: z.ZodOptional<z.ZodString>;
    action: z.ZodOptional<z.ZodString>;
    targetType: z.ZodOptional<z.ZodString>;
    targetId: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strict", z.ZodTypeAny, {
    sortOrder: "asc" | "desc";
    limit: number;
    page: number;
    action?: string | undefined;
    targetType?: string | undefined;
    targetId?: string | undefined;
    adminUserId?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
}, {
    action?: string | undefined;
    targetType?: string | undefined;
    targetId?: string | undefined;
    adminUserId?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    limit?: number | undefined;
    page?: number | undefined;
}>;
export declare const paginationQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    limit: number;
    page: number;
}, {
    limit?: number | undefined;
    page?: number | undefined;
}>;
export declare const apiResponseSchema: <T extends z.ZodTypeAny>(dataSchema: T) => z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        code: string;
        details?: Record<string, unknown> | undefined;
    }, {
        message: string;
        code: string;
        details?: Record<string, unknown> | undefined;
    }>>;
    meta: z.ZodOptional<z.ZodObject<{
        page: z.ZodOptional<z.ZodNumber>;
        limit: z.ZodOptional<z.ZodNumber>;
        total: z.ZodOptional<z.ZodNumber>;
        totalPages: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        total?: number | undefined;
        limit?: number | undefined;
        page?: number | undefined;
        totalPages?: number | undefined;
    }, {
        total?: number | undefined;
        limit?: number | undefined;
        page?: number | undefined;
        totalPages?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    success: z.ZodBoolean;
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        code: string;
        details?: Record<string, unknown> | undefined;
    }, {
        message: string;
        code: string;
        details?: Record<string, unknown> | undefined;
    }>>;
    meta: z.ZodOptional<z.ZodObject<{
        page: z.ZodOptional<z.ZodNumber>;
        limit: z.ZodOptional<z.ZodNumber>;
        total: z.ZodOptional<z.ZodNumber>;
        totalPages: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        total?: number | undefined;
        limit?: number | undefined;
        page?: number | undefined;
        totalPages?: number | undefined;
    }, {
        total?: number | undefined;
        limit?: number | undefined;
        page?: number | undefined;
        totalPages?: number | undefined;
    }>>;
}>, any> extends infer T_1 ? { [k in keyof T_1]: T_1[k]; } : never, z.baseObjectInputType<{
    success: z.ZodBoolean;
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        code: string;
        details?: Record<string, unknown> | undefined;
    }, {
        message: string;
        code: string;
        details?: Record<string, unknown> | undefined;
    }>>;
    meta: z.ZodOptional<z.ZodObject<{
        page: z.ZodOptional<z.ZodNumber>;
        limit: z.ZodOptional<z.ZodNumber>;
        total: z.ZodOptional<z.ZodNumber>;
        totalPages: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        total?: number | undefined;
        limit?: number | undefined;
        page?: number | undefined;
        totalPages?: number | undefined;
    }, {
        total?: number | undefined;
        limit?: number | undefined;
        page?: number | undefined;
        totalPages?: number | undefined;
    }>>;
}> extends infer T_2 ? { [k_1 in keyof T_2]: T_2[k_1]; } : never>;
export declare const paginatedResponseSchema: <T extends z.ZodTypeAny>(itemSchema: T) => z.ZodObject<{
    items: z.ZodArray<T, "many">;
    page: z.ZodNumber;
    limit: z.ZodNumber;
    total: z.ZodNumber;
    totalPages: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    items: T["_output"][];
    total: number;
    limit: number;
    page: number;
    totalPages: number;
}, {
    items: T["_input"][];
    total: number;
    limit: number;
    page: number;
    totalPages: number;
}>;
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
export type AcknowledgeMessageRequest = z.infer<typeof acknowledgeMessageRequestSchema>;
export type DeleteMessageRequest = z.infer<typeof deleteMessageRequestSchema>;
export type BlockUserRequest = z.infer<typeof blockUserRequestSchema>;
export type DeviceRegistration = z.infer<typeof deviceRegistrationSchema>;
export type PendingMessagesQuery = z.infer<typeof pendingMessagesQuerySchema>;
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
//# sourceMappingURL=index.d.ts.map