# EKUSA Digital Platform - Database Schema Documentation

## Overview
PostgreSQL 16 database with Prisma ORM. All tables use `cuid()` for primary keys. Timestamps use `DateTime` with timezone.

## Entity Relationship Diagram

```
User (1) ────────── (1) Profile
  │                     │
  ├── (1) Membership ───┘
  │
  ├── (N) Device
  │
  ├── (N) ConversationMember ─── (M) Conversation ── (N) Message
  │                                           │
  │                                           └── (N) MessageQueue
  │                                           └── (N) DeliveryReceipt
  │
  ├── (N) EventRegistration ─── (N) Event
  │
  ├── (N) WelfareRequest ─── (N) WelfareUpdate
  │
  ├── (N) CommunityMember ─── (N) Community
  │
  ├── (N) UserRole ─── (N) Role ─── (N) RolePermission ─── (N) Permission
  │
  ├── (N) Notification
  │
  └── (N) AuditLog

Leader ── (N) LeadershipPosition
  │
  └── (N) User
```

## Core Tables

### users
Application accounts with authentication credentials.
| Column | Type | Constraints |
|--------|------|-------------|
| id | String | PK, cuid() |
| username | String | Unique, 3-30 chars, alphanumeric + underscore |
| email | String? | Unique, optional |
| phoneNumber | String? | Unique, E.164 format, optional |
| passwordHash | String | Argon2id |
| accountStatus | Enum | registered \| membership_pending \| verified_member \| rejected \| suspended \| deactivated |
| createdAt | DateTime | default now() |
| updatedAt | DateTime | auto-update |

### profiles
Public-facing profile information.
| Column | Type | Constraints |
|--------|------|-------------|
| userId | String | PK, FK → users.id |
| displayName | String | Required, max 100 |
| bio | String? | max 500 |
| avatarObjectKey | String? | S3 object key |
| campus | String? | max 100 |
| course | String? | max 100 |
| yearOfStudy | Int? | 1-10 |
| updatedAt | DateTime | auto-update |

### memberships
EKUSA membership applications and verification status.
| Column | Type | Constraints |
|--------|------|-------------|
| id | String | PK, cuid() |
| userId | String | Unique, FK → users.id |
| registrationNumber | String | Required, max 50 |
| campus | String | Required, max 100 |
| course | String | Required, max 100 |
| yearOfStudy | Int | Required, 1-10 |
| contactInfo | String? | max 500 |
| membershipStatus | Enum | none \| pending \| verified \| rejected \| suspended |
| submittedAt | DateTime | default now() |
| reviewedAt | DateTime? | |
| reviewedBy | String? | FK → users.id |
| rejectionReason | String? | max 1000 |

### devices
Registered devices for E2E messaging.
| Column | Type | Constraints |
|--------|------|-------------|
| id | String | PK, cuid() |
| userId | String | FK → users.id |
| deviceName | String | Required, max 100 |
| identityPublicKey | String | base64 encoded |
| registrationId | Int | Unique per user |
| pushToken | String? | FCM/Expo push token |
| deviceStatus | Enum | active \| inactive \| revoked |
| createdAt | DateTime | default now() |
| lastSeenAt | DateTime | default now() |

### pre_keys / signed_pre_keys
Signal Protocol pre-key bundles for asynchronous encryption.
| Column | Type | Constraints |
|--------|------|-------------|
| id | String | PK, cuid() |
| deviceId | String | FK → devices.id |
| keyId | Int | |
| publicKey | String | base64 |
| signature | String? | For signed prekeys (base64) |
| createdAt | DateTime | default now() |

## Permission Tables

### roles
Configurable roles (not hardcoded).
| Column | Type | Constraints |
|--------|------|-------------|
| id | String | PK, cuid() |
| name | String | Unique, slug format |
| displayName | String | Human readable |
| description | String? | |
| permissions | String[] | Array of permission strings |
| createdAt | DateTime | default now() |
| updatedAt | DateTime | auto-update |

### permissions
Individual permission definitions.
| Column | Type | Constraints |
|--------|------|-------------|
| id | String | PK, cuid() |
| name | String | Unique |
| description | String? | |
| createdAt | DateTime | default now() |

### user_roles
Many-to-many user ↔ role assignments.
| Column | Type | Constraints |
|--------|------|-------------|
| userId | String | PK, FK → users.id |
| roleId | String | PK, FK → roles.id |
| assignedBy | String | FK → users.id |
| assignedAt | DateTime | default now() |

### role_permissions
Many-to-many role ↔ permission mappings.
| Column | Type | Constraints |
|--------|------|-------------|
| roleId | String | PK, FK → roles.id |
| permissionId | String | PK, FK → permissions.id |

## Announcement Tables

### announcements
Official institutional announcements.
| Column | Type | Constraints |
|--------|------|-------------|
| id | String | PK, cuid() |
| title | String | Required, max 200 |
| body | String | Required, max 10000 |
| category | Enum | general \| urgent \| meeting \| event \| leadership \| welfare \| election \| administrative |
| priority | Enum | normal \| important \| urgent |
| publisherId | String | FK → users.id |
| status | Enum | draft \| scheduled \| published \| archived |
| publishedAt | DateTime? | |
| scheduledAt | DateTime? | |
| expiresAt | DateTime? | |
| pinned | Boolean | default false |
| createdAt | DateTime | default now() |
| updatedAt | DateTime | auto-update |

### announcement_targets
Audience targeting rules.
| Column | Type | Constraints |
|--------|------|-------------|
| id | String | PK, cuid() |
| announcementId | String | FK → announcements.id |
| targetType | Enum | everyone \| verified_members \| unverified_users \| campus \| committee \| leadership_role \| event_participants \| custom_group |
| targetValue | String | Context-dependent value |

### announcement_reads
Read tracking for analytics.
| Column | Type | Constraints |
|--------|------|-------------|
| id | String | PK, cuid() |
| announcementId | String | FK → announcements.id |
| userId | String | FK → users.id |
| firstOpenedAt | DateTime | default now() |
| lastOpenedAt | DateTime | default now() |
| **Unique** | | (announcementId, userId) |

## Event Tables

### events
Association activities and events.
| Column | Type | Constraints |
|--------|------|-------------|
| id | String | PK, cuid() |
| title | String | Required, max 200 |
| description | String | Required, max 10000 |
| category | Enum | meeting \| hike \| trip \| social \| sports \| academic \| cultural \| welfare |
| venue | String | Required, max 500 |
| startAt | DateTime | |
| endAt | DateTime | |
| registrationDeadline | DateTime | |
| capacity | Int? | Optional limit |
| eligibility | String? | e.g., "verified_members", "campus:embu" |
| registrationFee | Int | default 0 (cents/KES) |
| status | Enum | draft \| published \| cancelled \| completed \| archived |
| createdBy | String | FK → users.id |
| createdAt | DateTime | default now() |
| updatedAt | DateTime | auto-update |

### event_registrations
User event registrations with attendance tracking.
| Column | Type | Constraints |
|--------|------|-------------|
| id | String | PK, cuid() |
| eventId | String | FK → events.id |
| userId | String | FK → users.id |
| registrationStatus | Enum | registered \| cancelled \| waitlisted \| attended |
| registeredAt | DateTime | default now() |
| attendanceStatus | String? | present \| absent \| excused |
| **Unique** | | (eventId, userId) |

## Welfare Tables

### welfare_requests
Confidential member welfare requests.
| Column | Type | Constraints |
|--------|------|-------------|
| id | String | PK, cuid() |
| userId | String | FK → users.id |
| category | Enum | personal \| emergency \| academic \| accommodation \| financial \| general \| other |
| subject | String | Required, max 200 |
| description | String | Required, max 5000 |
| status | Enum | submitted \| under_review \| in_progress \| awaiting_information \| resolved \| closed |
| assignedOfficerId | String? | FK → users.id |
| createdAt | DateTime | default now() |
| updatedAt | DateTime | auto-update |
| closedAt | DateTime? | |

### welfare_updates
Officer updates on welfare requests.
| Column | Type | Constraints |
|--------|------|-------------|
| id | String | PK, cuid() |
| requestId | String | FK → welfare_requests.id |
| authorId | String | FK → users.id |
| message | String | Required, max 5000 |
| createdAt | DateTime | default now() |

## Messaging Tables (E2EE - No Plaintext!)

### conversations
Direct or group conversations.
| Column | Type | Constraints |
|--------|------|-------------|
| id | String | PK, cuid() |
| type | Enum | direct \| group |
| name | String? | For groups |
| description | String? | For groups |
| avatarObjectKey | String? | For groups |
| createdBy | String? | For groups, FK → users.id |
| createdAt | DateTime | default now() |
| updatedAt | DateTime | auto-update |

### conversation_members
Participants in conversations.
| Column | Type | Constraints |
|--------|------|-------------|
| id | String | PK, cuid() |
| conversationId | String | FK → conversations.id |
| userId | String | FK → users.id |
| deviceId | String? | FK → devices.id |
| joinedAt | DateTime | default now() |
| leftAt | DateTime? | |
| isAdmin | Boolean | default false |
| **Unique** | | (conversationId, userId, deviceId) |

### direct_conversation_pairs
Quick lookup for 1-to-1 conversations.
| Column | Type | Constraints |
|--------|------|-------------|
| id | String | PK, cuid() |
| user1Id | String | FK → users.id |
| user2Id | String | FK → users.id |
| conversationId | String | Unique, FK → conversations.id |
| **Unique** | | (user1Id, user2Id) |

### messages
**Encrypted only - no plaintext stored!**
| Column | Type | Constraints |
|--------|------|-------------|
| id | String | PK, cuid() |
| conversationId | String | FK → conversations.id |
| senderId | String | FK → users.id |
| senderDeviceId | String | FK → devices.id |
| recipientId | String? | For direct |
| recipientDeviceId | String? | For direct |
| ciphertext | String | base64 encrypted payload |
| protocolMetadata | String | base64 Signal Protocol metadata |
| messageType | Enum | text \| image \| file \| voice \| system \| deletion |
| status | Enum | pending \| sent \| delivered \| read \| failed |
| sentAt | DateTime | default now() |
| deliveredAt | DateTime? | |
| readAt | DateTime? | |
| deletedAt | DateTime? | |
| deleteForEveryone | Boolean | default false |

### message_queue
Pending encrypted messages awaiting delivery.
| Column | Type | Constraints |
|--------|------|-------------|
| id | String | PK, cuid() |
| dedupeKey | String | Unique, prevents duplicates |
| conversationId | String | FK → conversations.id |
| senderUserId | String | FK → users.id |
| senderDeviceId | String | FK → devices.id |
| recipientUserId | String | FK → users.id |
| recipientDeviceId | String? | |
| messageId | String | Unique, FK → messages.id |
| ciphertext | String | base64 |
| protocolMetadata | String | base64 |
| createdAt | DateTime | default now() |

### delivery_receipts
Delivery and read confirmations.
| Column | Type | Constraints |
|--------|------|-------------|
| id | String | PK, cuid() |
| messageId | String | Unique, FK → messages.id |
| conversationId | String | FK → conversations.id |
| senderUserId | String | FK → users.id |
| recipientUserId | String | FK → users.id |
| recipientDeviceId | String | FK → devices.id |
| deliveredAt | DateTime | default now() |
| readAt | DateTime? | |
| deletedAt | DateTime? | |

### blocked_users
User blocking for messaging.
| Column | Type | Constraints |
|--------|------|-------------|
| id | String | PK, cuid() |
| blockerId | String | FK → users.id |
| blockedId | String | FK → users.id |
| createdAt | DateTime | default now() |
| **Unique** | | (blockerId, blockedId) |

## Community Tables

### communities
EKUSA-oriented groups.
| Column | Type | Constraints |
|--------|------|-------------|
| id | String | PK, cuid() |
| name | String | Required, max 100 |
| description | String | Required, max 2000 |
| type | Enum | general \| campus \| constituency \| committee \| interest \| event |
| avatarObjectKey | String? | |
| isPublic | Boolean | default true |
| createdBy | String | FK → users.id |
| createdAt | DateTime | default now() |
| updatedAt | DateTime | auto-update |

### community_members
| Column | Type | Constraints |
|--------|------|-------------|
| id | String | PK, cuid() |
| communityId | String | FK → communities.id |
| userId | String | FK → users.id |
| role | Enum | member \| moderator \| admin |
| joinedAt | DateTime | default now() |
| **Unique** | | (communityId, userId) |

## Leadership Tables

### leadership_positions
| Column | Type | Constraints |
|--------|------|-------------|
| id | String | PK, cuid() |
| title | String | Required, max 100 |
| description | String? | max 500 |
| order | Int | default 0 |
| isActive | Boolean | default true |
| createdAt | DateTime | default now() |
| updatedAt | DateTime | auto-update |

### leaders
| Column | Type | Constraints |
|--------|------|-------------|
| id | String | PK, cuid() |
| userId | String | FK → users.id |
| positionId | String | FK → leadership_positions.id |
| startDate | DateTime | |
| endDate | DateTime? | |
| contactInfo | String? | max 500 |
| isActive | Boolean | default true |
| createdAt | DateTime | default now() |
| updatedAt | DateTime | auto-update |
| **Unique** | | (userId, positionId) |

## Notification Tables

### notifications
In-app notifications (separate from FCM push).
| Column | Type | Constraints |
|--------|------|-------------|
| id | String | PK, cuid() |
| userId | String | FK → users.id |
| category | Enum | announcement \| event_reminder \| event_registration \| membership_update \| welfare_update \| message \| group_activity \| admin_alert |
| priority | Enum | low \| normal \| high \| critical |
| title | String | Required |
| body | String | Required |
| data | Json? | Additional payload |
| read | Boolean | default false |
| sentAt | DateTime | default now() |
| readAt | DateTime? | |

## Audit Tables

### audit_logs
Immutable administrative action log.
| Column | Type | Constraints |
|--------|------|-------------|
| id | String | PK, cuid() |
| adminUserId | String | FK → users.id |
| action | String | e.g., "membership_approved" |
| targetType | String | e.g., "membership" |
| targetId | String | |
| changes | Json? | { field: { before, after } } |
| metadata | Json? | Request metadata |
| ipAddress | String? | |
| userAgent | String? | |
| createdAt | DateTime | default now() |

### auth_sessions
Refresh token tracking.
| Column | Type | Constraints |
|--------|------|-------------|
| id | String | PK, cuid() |
| userId | String | FK → users.id |
| refreshToken | String | Unique |
| userAgent | String? | |
| ipAddress | String? | |
| expiresAt | DateTime | |
| createdAt | DateTime | default now() |
| revokedAt | DateTime? | |

## Indexes (Key Performance)

```sql
-- Users
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_account_status ON users(account_status);

-- Memberships
CREATE INDEX idx_memberships_status ON memberships(membership_status);
CREATE INDEX idx_memberships_campus ON memberships(campus);

-- Announcements
CREATE INDEX idx_announcements_status_published ON announcements(status, published_at DESC);
CREATE INDEX idx_announcement_targets_type_value ON announcement_targets(target_type, target_value);

-- Events
CREATE INDEX idx_events_status_start ON events(status, start_at);
CREATE INDEX idx_event_registrations_user ON event_registrations(user_id);

-- Messages
CREATE INDEX idx_messages_conversation_sent ON messages(conversation_id, sent_at);
CREATE INDEX idx_message_queue_recipient_created ON message_queue(recipient_user_id, created_at);
CREATE INDEX idx_delivery_receipts_conversation_recipient ON delivery_receipts(conversation_id, recipient_user_id);

-- Welfare
CREATE INDEX idx_welfare_requests_user_status ON welfare_requests(user_id, status);
CREATE INDEX idx_welfare_requests_assigned ON welfare_requests(assigned_officer_id, status);

-- Notifications
CREATE INDEX idx_notifications_user_read_sent ON notifications(user_id, read, sent_at DESC);

-- Audit
CREATE INDEX idx_audit_logs_admin_created ON audit_logs(admin_user_id, created_at DESC);
CREATE INDEX idx_audit_logs_target ON audit_logs(target_type, target_id);
```

## Migration Strategy

1. **Development**: `prisma migrate dev` - creates migration files in `prisma/migrations/`
2. **Staging**: `prisma migrate deploy` - applies pending migrations
3. **Production**: `prisma migrate deploy` during maintenance window
4. **Rollback**: Manual SQL scripts (Prisma doesn't support down migrations)

## Backup & Recovery

- **Frequency**: Daily automated backups
- **Retention**: 30 days daily, 12 months monthly
- **Testing**: Monthly restore drills to staging
- **Point-in-time**: WAL archiving for 24h RPO