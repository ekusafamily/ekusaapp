# EKUSA Digital Platform - Deployment Architecture

## 1. System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                        Cloudflare DNS                        │
│             (app.ekusa.ac.ke | admin.ekusa.ac.ke)            │
└──────────────────────────────┬───────────────────────────────┘
                               │ HTTPS / TLS 1.3
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    Render Cloud Platform                     │
│  ┌──────────────────────────────┐ ┌───────────────────────┐  │
│  │ Backend API Web Service      │ │ Admin Dashboard       │  │
│  │ (NestJS + TypeScript)        │ │ (React + Vite SPA)    │  │
│  └──────────────┬───────────────┘ └───────────┬───────────┘  │
└─────────────────┼───────────────────────────┼──────────────┘
                  │                           │
                  ▼                           ▼
┌───────────────────────────────────┐ ┌────────────────────────┐
│         Supabase Platform         │ │   External Services    │
│  ┌─────────────────────────────┐  │ │  ┌───────────────────┐ │
│  │ PostgreSQL 16 + PgBouncer   │  │ │  │ Firebase FCM      │ │
│  └─────────────────────────────┘  │ │  │ (Push Notifs)     │ │
│  ┌─────────────────────────────┐  │ │  └───────────────────┘ │
│  │ Supabase Storage (Buckets)  │  │ │  ┌───────────────────┐ │
│  └─────────────────────────────┘  │ │  │ Resend / SMTP     │ │
│  ┌─────────────────────────────┐  │ │  │ (Transactional)   │ │
│  │ Supabase Realtime           │  │ │  └───────────────────┘ │
│  └─────────────────────────────┘  │ └────────────────────────┘
└───────────────────────────────────┘
                  ▲
                  │ HTTPS / WSS
┌─────────────────┴─────────────────┐
│        Mobile App (Android)       │
│      (React Native + Expo)        │
└───────────────────────────────────┘
```

---

## 2. Infrastructure Decisions

### Why Render + Supabase?
1. **Affordability**: Both platforms offer generous free tiers for development/testing and highly predictable, low-cost scaling for production (ideal for a student association budget).
2. **Managed Reliability**: Supabase provides fully managed PostgreSQL with automated backups, point-in-time recovery, and built-in object storage.
3. **Developer Velocity**: NestJS modular architecture deploys seamlessly as a Render Web Service, while the React Admin dashboard deploys instantly as a Render Static Site.
4. **No Infrastructure Overhead**: Eliminates the complexity of managing Kubernetes clusters, manual S3 buckets, or self-hosted database replication.

---

## 3. Service Interactions

### A. Mobile App ↔ Backend API
- **Transport**: HTTPS (REST API) and WSS (WebSocket Gateway for real-time messaging).
- **Authentication**: Bearer JWT in `Authorization` header, obtained via `/auth/login`.
- **Data Sync**: React Query with local MMKV/AsyncStorage persistence for offline-first resilience.

### B. Admin Dashboard ↔ Backend API
- **Transport**: HTTPS (REST API).
- **Authentication**: Bearer JWT with strict RBAC guards (`RolesGuard`).
- **Audit Logging**: Every administrative action (membership approval, announcement publishing) is recorded in `audit_logs`.

### C. Backend API ↔ Supabase PostgreSQL
- **Connection**: Prisma ORM via Supabase connection pooler (PgBouncer on port 6543) to prevent connection exhaustion.
- **Migrations**: Version-controlled Prisma migrations applied via CI/CD deployment hooks.

### D. Backend API ↔ Supabase Storage
- **Uploads**: Profile avatars, event posters, and verification documents are uploaded via multer through the API and stored in Supabase Storage buckets.
- **Security**: Private buckets use signed URLs generated with expiration timeouts.

---

## 4. Authentication & Authorization Architecture

### Authentication Flow
1. User registers or logs in via `/auth/register` or `/auth/login`.
2. Backend verifies credentials against hashed passwords (`Argon2id`).
3. Backend issues an **Access Token** (15-minute lifespan) and a **Refresh Token** (7-day lifespan, stored securely).
4. Mobile app stores tokens in **Expo SecureStore**; admin portal stores them in secure HTTP-only cookies or local storage.

### Authorization & Membership Verification
- **Open Registration**: Anyone can create an account and apply for EKUSA membership.
- **Admin Control**: Only authorized administrators (`Membership Officer`, `Super Admin`) can review and approve/reject membership applications.
- **RLS & Guards**: Backend routes are protected by JWT auth guards and role-based guards. Database-level constraints ensure users cannot modify their own membership status.