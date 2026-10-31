# EKUSA Digital Platform - API Documentation

## Overview
RESTful API with JSON request/response format. All endpoints under `/api/v1`.

**Base URL**: `https://api.ekusa.example.com/api/v1` (production) / `http://localhost:3000/api/v1` (development)

**Authentication**: Bearer token (JWT) in Authorization header
```
Authorization: Bearer <access_token>
```

**Content-Type**: `application/json` (except file uploads: `multipart/form-data`)

## Error Response Format
All errors follow a consistent structure:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable description",
    "details": {}
  }
}
```

Common error codes:
- `UNAUTHORIZED` (401) - Invalid or missing token
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `CONFLICT` (409) - Duplicate resource
- `VALIDATION_ERROR` (400) - Invalid input
- `RATE_LIMITED` (429) - Too many requests
- `INTERNAL_ERROR` (500) - Server error

## Pagination
List endpoints accept:
- `page` (default: 1)
- `limit` (default: 20, max: 100)

Response includes:
```json
{
  "items": [...],
  "page": 1,
  "limit": 20,
  "total": 150,
  "totalPages": 8
}
```

---

## Authentication Endpoints

### Register Account
`POST /auth/register`

**Request:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "phoneNumber": "+254700000000",
  "password": "SecurePass123!"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "username": "john_doe", "accountStatus": "registered", ... },
    "tokens": {
      "accessToken": "eyJ...",
      "refreshToken": "uuid...",
      "expiresIn": 900
    }
  }
}
```

### Login
`POST /auth/login`

**Request:**
```json
{
  "identifier": "john_doe",
  "password": "SecurePass123!"
}
```

**Response (200):** Same as register.

### Refresh Token
`POST /auth/refresh`

**Request:**
```json
{ "refreshToken": "uuid..." }
```

**Response (200):** New token pair.

### Logout
`POST /auth/logout`

**Request:**
```json
{ "refreshToken": "uuid..." }
```

### Forgot Password
`POST /auth/password/forgot`
```json
{ "email": "john@example.com" }
```

### Reset Password
`POST /auth/password/reset`
```json
{ "token": "reset_token", "password": "NewPass123!" }
```

### Get Current User
`GET /auth/me` (requires auth)

---

## User Endpoints

### Get Current User Profile
`GET /users/me`

### Update Profile
`PATCH /users/me`
```json
{
  "displayName": "John Doe",
  "bio": "Student leader",
  "avatarUrl": "https://...",
  "campus": "Embu Main Campus",
  "course": "Computer Science",
  "yearOfStudy": 3
}
```

### Get Public Profile
`GET /users/:username`

### Search Users (for chat discovery)
`POST /users/search`
```json
{
  "query": "john",
  "limit": 20,
  "offset": 0
}
```

### Upload Avatar
`POST /users/me/avatar` (multipart/form-data)
- Field: `avatar` (image file, max 5MB, JPEG/PNG/WebP)

---

## Membership Endpoints

### Submit Application
`POST /membership/apply` (requires auth)
```json
{
  "registrationNumber": "EKU/2021/12345",
  "campus": "Embu Main Campus",
  "course": "Computer Science",
  "yearOfStudy": 3,
  "contactInfo": "+254700000000"
}
```

### View Own Status
`GET /membership/me` (requires auth)

### Admin: List Applications
`GET /admin/memberships` (requires: membership_officer+)
Query params: `status`, `campus`, `page`, `limit`, `sortBy`, `sortOrder`

### Admin: View Application
`GET /admin/memberships/:id` (requires: membership_officer+)

### Admin: Approve
`PATCH /admin/memberships/:id/approve` (requires: membership_officer+)

### Admin: Reject
`PATCH /admin/memberships/:id/reject` (requires: membership_officer+)
```json
{ "rejectionReason": "Invalid registration number" }
```

---

## Announcement Endpoints

### List Announcements
`GET /announcements` (requires auth)
Query params: `category`, `status`, `priority`, `page`, `limit`, `sortBy`, `sortOrder`

Returns audience-filtered announcements based on user's membership, campus, roles.

### Get Announcement
`GET /announcements/:id` (requires auth)

### Mark as Read
`POST /announcements/:id/read` (requires auth)

### Admin: List All
`GET /admin/announcements` (requires: communication_officer+)

### Admin: Create
`POST /admin/announcements` (requires: communication_officer+)
```json
{
  "title": "Important Notice",
  "body": "Full announcement text...",
  "category": "urgent",
  "priority": "urgent",
  "targets": [
    { "type": "verified_members", "value": "" },
    { "type": "campus", "value": "Embu Main Campus" }
  ],
  "scheduledAt": "2024-01-15T10:00:00Z",
  "expiresAt": "2024-02-15T10:00:00Z",
  "pinned": true
}
```

### Admin: Update Draft
`PATCH /admin/announcements/:id` (requires: communication_officer+)

### Admin: Publish
`POST /admin/announcements/:id/publish` (requires: communication_officer+)

### Admin: Archive
`POST /admin/announcements/:id/archive` (requires: communication_officer+)

### Admin: Get Stats
`GET /admin/announcements/:id/stats` (requires: communication_officer+)

---

## Event Endpoints

### List Events
`GET /events` (requires auth)
Query params: `category`, `status`, `campus`, `upcoming`, `page`, `limit`

### Get Event
`GET /events/:id` (requires auth)

### Register
`POST /events/:id/register` (requires auth)

### Cancel Registration
`DELETE /events/:id/register` (requires auth)

### Admin: List Events
`GET /admin/events` (requires: event_coordinator+)

### Admin: Create
`POST /admin/events` (requires: event_coordinator+)
```json
{
  "title": "Annual Hike",
  "description": "Mt. Kenya hike...",
  "category": "hike",
  "venue": "Mt. Kenya Base Camp",
  "startAt": "2024-03-15T08:00:00Z",
  "endAt": "2024-03-15T16:00:00Z",
  "registrationDeadline": "2024-03-10T23:59:00Z",
  "capacity": 50,
  "eligibility": "verified_members",
  "registrationFee": 0
}
```

### Admin: Update
`PATCH /admin/events/:id` (requires: event_coordinator+)

### Admin: Participants
`GET /admin/events/:id/participants` (requires: event_coordinator+)

### Admin: Record Attendance
`PATCH /admin/events/:id/attendance` (requires: event_coordinator+)
```json
{
  "userId": "user_id",
  "attendanceStatus": "present"
}
```

---

## Welfare Endpoints

### Submit Request
`POST /welfare/requests` (requires auth)
```json
{
  "category": "emergency",
  "subject": "Medical emergency",
  "description": "Need assistance with hospital bills..."
}
```

### View Own Requests
`GET /welfare/requests/me` (requires auth)

### Admin: List Requests
`GET /admin/welfare/requests` (requires: welfare_officer+)

### Admin: Update Request
`PATCH /admin/welfare/requests/:id` (requires: welfare_officer+)
```json
{
  "status": "in_progress",
  "assignedOfficerId": "officer_user_id"
}
```

### Admin: Add Update
`POST /admin/welfare/requests/:id/updates` (requires: welfare_officer+)
```json
{ "message": "Contacted hospital, payment arranged." }
```

---

## Messaging Endpoints (E2EE)

### Device Registration
`POST /devices` (requires auth)
```json
{
  "deviceName": "John's Phone",
  "identityPublicKey": "base64...",
  "registrationId": 12345,
  "pushToken": "expo_push_token..."
}
```

### Get PreKey Bundle
`GET /devices/:userId/prekey-bundle` (requires auth)

### List Conversations
`GET /conversations` (requires auth)

### Create Conversation
`POST /conversations` (requires auth)
```json
// Direct message:
{ "recipientId": "user_id" }

// Group:
{ "name": "Study Group", "description": "CS students", "memberIds": ["id1", "id2"] }
```

### Get Conversation
`GET /conversations/:id` (requires auth)

### Send Encrypted Message
`POST /messages` (requires auth)
```json
{
  "conversationId": "conv_id",
  "ciphertext": "base64_encrypted_payload",
  "protocolMetadata": "base64_signal_metadata",
  "messageType": "text"
}
```

### Get Pending Messages (Long-poll)
`GET /messages/pending` (requires auth)
Query params: `limit`, `beforeMessageId`

### Acknowledge Delivery
`POST /messages/acknowledge` (requires auth)
```json
{ "messageId": "msg_id", "conversationId": "conv_id" }
```

### Delete Message
`POST /messages/:id/delete` (requires auth)
```json
{ "deleteForEveryone": true }
```

### Block User
`POST /users/:id/block` (requires auth)

---

## Community Endpoints

### List Communities
`GET /communities` (requires auth)
Query params: `type`, `isPublic`, `page`, `limit`

### Get Community
`GET /communities/:id` (requires auth)

### Join Community
`POST /communities/:id/join` (requires auth)

### Leave Community
`POST /communities/:id/leave` (requires auth)

### Admin: Create
`POST /admin/communities` (requires: communication_officer+)

### Admin: Update
`PATCH /admin/communities/:id` (requires: communication_officer+)

---

## Leadership Endpoints

### Get Directory
`GET /leadership` (requires auth)

### Get Positions
`GET /leadership/positions` (requires auth)

### Admin: Create Position
`POST /admin/leadership/positions` (requires: super_admin)

### Admin: Assign Leader
`POST /admin/leadership` (requires: super_admin)
```json
{
  "userId": "user_id",
  "positionId": "position_id",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2025-01-01T00:00:00Z",
  "contactInfo": "chairperson@ekusa.ac.ke"
}
```

---

## Roles & Permissions (Super Admin Only)

### List Roles
`GET /admin/roles`

### Create Role
`POST /admin/roles`
```json
{
  "name": "event_coordinator",
  "displayName": "Event Coordinator",
  "description": "Manages events",
  "permissions": ["create_events", "manage_registrations"]
}
```

### Assign Role
`POST /admin/user-roles`
```json
{ "userId": "user_id", "roleId": "role_id" }
```

### Revoke Role
`DELETE /admin/user-roles/:userId/:roleId`

---

## Notification Endpoints

### List Notifications
`GET /notifications` (requires auth)
Query params: `category`, `unreadOnly`, `page`, `limit`

### Mark Read
`POST /notifications/:id/read` (requires auth)

### Mark All Read
`POST /notifications/read-all` (requires auth)

---

## Admin Dashboard Endpoints

### Dashboard Stats
`GET /admin/dashboard` (requires any admin role)

### Settings
`GET /admin/settings` (requires: super_admin)
`PATCH /admin/settings` (requires: super_admin)

---

## Audit Endpoints

### List Audit Logs
`GET /admin/audit` (requires: super_admin)
Query params: `adminUserId`, `action`, `targetType`, `targetId`, `startDate`, `endDate`, `page`, `limit`

---

## WebSocket Gateway

**Namespace**: `/messaging`

**Connection**: Authenticate with JWT token in handshake auth or query param.

**Events:**
- `joinConversation` - `{ conversationId }`
- `leaveConversation` - `{ conversationId }`
- `typing` - `{ conversationId, isTyping }`

**Server Events:**
- `newMessage` - Encrypted message payload
- `messageDelivered` - `{ messageId, conversationId }`
- `messageRead` - `{ messageId, conversationId }`
- `userTyping` - `{ conversationId, userId, isTyping }`
- `notification` - In-app notification

---

## Rate Limits

| Endpoint Category | Limit |
|-------------------|-------|
| Auth (register, login) | 10/min/IP |
| Auth (refresh) | 30/min/user |
| General API | 100/min/user |
| Messaging (send) | 30/min/user |
| File upload | 10/min/user |

Exceeding returns 429 with `Retry-After` header.

---

## Versioning

API version in URL path: `/api/v1/`
Breaking changes → new version `/api/v2/`
Deprecation notice: 6 months via `Sunset` header and developer communications.