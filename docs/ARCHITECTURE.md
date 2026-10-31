# EKUSA Digital Platform - Architecture Overview

## High-Level Architecture

```
┌─────────────────┐     ┌─────────────────┐
│  Mobile App     │     │  Admin Dashboard│
│  (React Native) │     │  (React + Vite) │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
┌─────────────────────────────────────────┐
│            API Gateway (NestJS)         │
│  ┌─────────────┐ ┌───────────────────┐  │
│  │ REST API    │ │ WebSocket Gateway │  │
│  └─────────────┘ └───────────────────┘  │
└────────┬────────────────────┬────────────┘
         │                    │
         ▼                    ▼
┌─────────────────┐  ┌─────────────────┐
│  PostgreSQL     │  │  Redis          │
│  (Primary DB)   │  │  (Cache/Sessions)│
└─────────────────┘  └─────────────────┘
         │
         ▼
┌─────────────────┐
│  MinIO / S3     │
│  (Object Store) │
└─────────────────┘
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| Mobile | React Native (Expo) + TypeScript |
| Admin Web | React 18 + Vite + TypeScript |
| API | NestJS 10 + TypeScript |
| Database | PostgreSQL 16 + Prisma ORM |
| Cache/Queue | Redis 7 |
| Object Storage | MinIO (S3-compatible) |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| Real-time | Socket.IO (WebSocket) |
| Authentication | JWT (Access + Refresh) + Argon2id |
| E2E Encryption | Signal Protocol (libsignal) |

## Monorepo Structure

```
ekusa-platform/
├── apps/
│   ├── mobile/          # Expo React Native app
│   ├── admin/           # Vite React admin dashboard
│   └── api/             # NestJS backend
├── packages/
│   ├── shared-types/    # Shared TypeScript interfaces
│   ├── validation/      # Zod validation schemas
│   └── api-client/      # TanStack Query API client
├── infrastructure/
│   ├── docker/          # Docker Compose for local dev
│   └── deployment/      # Production deployment configs
└── docs/                # Documentation
```

## Module Architecture (Backend)

Each domain is a separate NestJS module following the PRD Section 10.3:

```
src/
├── auth/               # Authentication & authorization
├── users/              # User profiles & search
├── membership/         # Membership applications & verification
├── announcements/      # Official announcements with audience targeting
├── events/             # Event management & registration
├── welfare/            # Welfare requests & case management
├── messaging/          # E2E encrypted private messaging
├── community/          # Community groups & posts
├── leadership/         # Leadership directory
├── roles/              # RBAC roles & permissions
├── notifications/      # Push & in-app notifications
├── audit/              # Administrative audit logging
├── admin/              # Dashboard aggregates & settings
└── prisma/             # Database client & migrations
```

## Data Flow Examples

### 1. User Registration & Login
```
Mobile App → POST /api/v1/auth/register → Auth Service → Prisma → PostgreSQL
                    ↓
            JWT Access + Refresh Tokens
                    ↓
            Secure Storage (Mobile) / HttpOnly Cookie (Web)
```

### 2. Announcement Publishing
```
Admin Dashboard → POST /api/v1/admin/announcements → Announcements Service
                    ↓
            Audience Resolution (roles, campus, membership)
                    ↓
            FCM Push Notifications → Mobile Devices
                    ↓
            Mobile App fetches full announcement via GET /api/v1/announcements/:id
```

### 3. E2E Encrypted Messaging
```
Sender Device → Encrypt with Signal Protocol → POST /api/v1/messages
                    ↓
            Message Queue (encrypted) → PostgreSQL
                    ↓
            WebSocket / Long-poll → Recipient Device
                    ↓
            Recipient decrypts locally → Acknowledge → Queue entry removed
```

### 4. Event Registration
```
Mobile App → POST /api/v1/events/:id/register → Events Service
                    ↓
            Capacity & Eligibility Checks → Prisma Transaction
                    ↓
            Confirmation Notification → User
                    ↓
            Admin Dashboard → GET /api/v1/admin/events/:id/participants
```

## Security Boundaries

| Boundary | Protection |
|----------|------------|
| Transport | TLS 1.3 (HTTPS/WSS) |
| Authentication | JWT with short-lived access tokens (15min) + rotating refresh tokens |
| Authorization | RBAC guards on every controller, permission checks in services |
| Private Messages | End-to-end encryption (Signal Protocol) - server never sees plaintext |
| Passwords | Argon2id hashing (memory-hard) |
| Admin Actions | Audit logging with immutable records |
| File Uploads | Signed URLs, type validation, size limits |
| Rate Limiting | Per-IP and per-user limits on auth endpoints |

## Scalability Considerations

- **Stateless API**: Horizontal scaling via container orchestration
- **WebSocket**: Redis adapter for multi-instance Socket.IO
- **Database**: Read replicas for query-heavy endpoints (announcements, events)
- **Caching**: Redis for session data, rate limits, and frequent queries
- **Message Queue**: PostgreSQL-based queue with idempotency for messaging
- **Object Storage**: CDN-backed S3 for avatars and attachments

## Deployment Topology

### Development
- Docker Compose with all services locally
- Hot reload for mobile (Expo), admin (Vite), API (NestJS watch)

### Staging/Production
- **API**: Containerized (Docker) on Render/Cloud Run/K8s
- **Database**: Managed PostgreSQL (Cloud SQL, RDS, or self-hosted with replication)
- **Redis**: Managed Redis (Cloud Memorystore, ElastiCache)
- **MinIO**: Self-hosted or S3-compatible (AWS S3, Cloudflare R2)
- **Mobile**: EAS Build → Play Store / TestFlight
- **Admin**: Static build → CDN (Netlify, Vercel, Cloudflare Pages)
- **Monitoring**: Prometheus + Grafana, structured JSON logs

## Future Extensibility

- **Multi-device messaging**: Extend device registration & session management
- **Voice/Video calls**: WebRTC signaling via WebSocket gateway
- **Online voting**: Separate high-security module with cryptographic audit trail
- **Analytics**: Event streaming to data warehouse (BigQuery, ClickHouse)
- **Internationalization**: i18n keys in shared-types, translation files per locale