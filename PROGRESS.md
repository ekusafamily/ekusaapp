# EKUSA Digital Platform — Development Progress Log

> **Version:** 1.001
> **Last Updated:** 2026-11-01
> **Branch:** `main`
> **Last Commit:** `a84a456` — feat: switch to standalone FCM V1, push db schema, add seed and firebase-admin

---

## Version History

| Version | Date | Description |
| :--- | :--- | :--- |
| 1.001 | 2026-11-01 | Environment setup, FCM V1 integration, database schema push, super admin seed |

---

## Project Overview

**EKUSA Digital Platform** — Embu Kimathi University Student Association integrated digital ecosystem.

**Monorepo Structure:**
```
EKUSA/
├── apps/
│   ├── api/          # NestJS backend (REST + WebSocket)
│   ├── admin/        # React + Vite admin dashboard
│   └── mobile/       # React Native (Expo) mobile app
├── packages/
│   ├── api-client/   # Shared Axios + TanStack Query client
│   ├── shared-types/ # TypeScript types shared across apps
│   └── validation/   # Zod validation schemas
├── .env              # Active environment config (gitignored)
├── .env.example      # Template for environment setup
├── firebase-service-account.json  # Firebase Admin key (gitignored)
└── PROGRESS.md       # This file
```

**Tech Stack:**
- **Backend API:** NestJS 10, Prisma 5, PostgreSQL (Supabase), Argon2id, JWT, Socket.io
- **Admin Dashboard:** React, Vite, TanStack Query, Axios
- **Mobile App:** React Native 0.74, Expo 51, Expo Router, Zustand, TanStack Query
- **Database:** Supabase PostgreSQL (`aws-0-eu-west-1.pooler.supabase.com`)
- **Storage:** Supabase Storage (`ekusa-storage` bucket, public)
- **Push Notifications:** Firebase Cloud Messaging V1 (standalone, no Expo relay)
- **Email:** Resend (SMTP)
- **Package Manager:** Yarn 4 (Berry) workspaces + Turborepo

---

## Session 1.001 — What Was Done

### Environment Setup

All environment variables in `.env` are now fully configured:

| Variable | Status | Notes |
| :--- | :--- | :--- |
| `NODE_ENV` | `development` | Ready |
| `PORT` | `3000` | Ready |
| `FRONTEND_URL` | `http://localhost:8081` | Expo Metro dev |
| `ADMIN_URL` | `http://localhost:5173` | Vite dev server |
| `SUPABASE_URL` | Set | Project: `qqhbbdtyvqtfolxfugxs` |
| `SUPABASE_ANON_KEY` | Set | Ready |
| `SUPABASE_SERVICE_ROLE_KEY` | Set | Ready |
| `DATABASE_URL` | Set | Supabase session pooler port 6543, URL-encoded password |
| `DIRECT_URL` | Set | Supabase session pooler port 5432 (used for migrations) |
| `JWT_SECRET` | Set | UUID-based secret |
| `JWT_ACCESS_EXPIRY` | `15m` | Ready |
| `JWT_REFRESH_EXPIRY` | `7d` | Ready |
| `FCM_PROJECT_ID` | `studio-3365759448-2f271` | Ready |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | `./firebase-service-account.json` | Key file present locally (gitignored) |
| `SMTP_HOST` | `smtp.resend.com` | Ready |
| `SMTP_PASS` | Set | Resend API key (`re_...`) |
| `EMAIL_FROM` | `onboarding@resend.dev` | Dev testing only — change to `noreply@ekusa.ac.ke` for production after verifying domain in Resend |
| `STORAGE_PROVIDER` | `supabase` | Ready |
| `SUPABASE_STORAGE_BUCKET` | `ekusa-storage` | Bucket exists and is public |

> **Note:** `EXPO_PROJECT_ID` is no longer needed as the app uses standalone FCM V1 instead of Expo's push relay.

---

### Firebase Cloud Messaging V1 (Standalone)

Switched from Expo push token relay to direct Firebase Cloud Messaging API V1.

**Why:** Firebase deprecated the legacy API. FCM V1 uses a Service Account for auth, not a static server key.

**Changes made:**
- `apps/mobile/app.json` — Added `"googleServicesFile": "./google-services.json"` to android config
- `apps/mobile/google-services.json` — Downloaded from Firebase Console (gitignored); copied to `android/app/`
- `apps/mobile/android/build.gradle` — Added `com.google.gms:google-services:4.4.2` classpath
- `apps/mobile/android/app/build.gradle` — Applied `com.google.gms.google-services` plugin at bottom
- `apps/mobile/app/services/notificationService.ts` — Switched from `getExpoPushTokenAsync()` to `getDevicePushTokenAsync()` for native FCM tokens
- `apps/api/src/notifications/notifications.service.ts` — Full `firebase-admin` integration:
  - Initializes via `firebase-admin/app` and `firebase-admin/messaging` on module start
  - Reads service account from `FIREBASE_SERVICE_ACCOUNT_PATH` env var
  - Sends real FCM V1 multicast push to registered device tokens
- `firebase-service-account.json` — Firebase Admin SDK private key (gitignored, present locally)

**Sensitive files (gitignored, not in repo):**
```
firebase-service-account.json          ← Backend FCM auth key
apps/mobile/google-services.json       ← Android FCM config
apps/mobile/android/app/google-services.json
```

---

### Database Schema — Prisma DB Push

**Schema location:** `apps/api/prisma/schema.prisma`

**Change:** Added `directUrl = env("DIRECT_URL")` to the datasource block to support session pooler on port 5432 for Prisma migrations (the direct URL at `db.qqhbbdtyvqtfolxfugxs.supabase.co:5432` was unreachable from this environment).

**Executed:** `npx prisma db push --schema apps/api/prisma/schema.prisma`

All tables are now live in Supabase. Key tables:
- `users`, `profiles`, `memberships`
- `roles`, `permissions`, `user_roles`, `role_permissions`
- `announcements`, `announcement_reads`
- `events`, `event_registrations`
- `welfare_requests`, `welfare_updates`
- `conversations`, `conversation_members`, `messages`
- `communities`, `community_members`
- `leaders`, `devices`, `notifications`
- `auth_sessions`, `audit_logs`, `blocked_users`
- `direct_conversation_pairs`

**Current DB state:**
- Users: 1 (super admin)
- Roles: 4 (`super_admin`, `chairperson`, `secretary`, `treasurer`, `ordinary_member`)
- Permissions: 10
- RolePermissions: 21 (links between roles and permissions)

---

### Database Seed

**File:** `apps/api/prisma/seed.ts`

**Run command:**
```bash
npx ts-node apps/api/prisma/seed.ts
```

Seeds:
1. All 10 system permissions
2. Standard roles with permission assignments
3. Super Admin user + profile + role assignment

**Super Admin Credentials (initial):**

| Field | Value |
| :--- | :--- |
| Username | `superadmin` |
| Email | `admin@ekusa.ac.ke` |
| Password | `AdminPassword@2026!` |
| Phone | `+254700000000` |
| Role | `super_admin` (all permissions) |
| Status | `verified_member` |

> **Action required:** Change the super admin password immediately after first login.

---

### Supabase Storage

- Bucket `ekusa-storage` exists and is **public**.
- `file_size_limit`: 1 MB
- `allowed_mime_types`: `image/*`

> If the platform needs to store documents (PDF welfare forms, event attachments), the MIME type allowlist and size limit should be updated in the Supabase dashboard.

---

## What Needs To Be Done Next

### Immediate / Before First Run

- [ ] **Verify Prisma migrations remain in sync** — If the schema changes, run `npx prisma db push --schema apps/api/prisma/schema.prisma` again, or use `prisma migrate dev` if migrations directory is initialized.
- [ ] **Create `apps/admin/.env`** — The admin dashboard requires `VITE_API_URL=http://localhost:3000/api/v1` for development. Currently it falls back to that default via `import.meta.env.VITE_API_URL`.
- [ ] **Physical device API URL** — If testing on a real Android phone over Wi-Fi, update `packages/api-client/src/index.ts` line 16 to use the machine's local IP instead of `10.0.2.2` (which only works for the Android emulator).

### Before Production

- [ ] **Resend domain verification** — Add and verify `ekusa.ac.ke` in [Resend Dashboard](https://resend.com/domains), then change `EMAIL_FROM=noreply@ekusa.ac.ke` in `.env`.
- [ ] **Change Super Admin password** — Log into the admin dashboard and change `AdminPassword@2026!`.
- [ ] **Set `NODE_ENV=production`** in the production `.env`.
- [ ] **URL-encode the database password** in `DATABASE_URL` and `DIRECT_URL` — Currently done (the `@`, `$` characters are encoded as `%40`, `%24`). Verify this stays correct if password changes.
- [ ] **Supabase Storage MIME types** — Update allowed MIME types to include `application/pdf` and increase file size limit if documents need to be stored.
- [ ] **FRONTEND_URL / ADMIN_URL** — Set to actual production domain names in the production `.env`.
- [ ] **Seed additional roles** — Run `npx ts-node apps/api/prisma/seed.ts` after deploying to production to initialize roles and permissions.
- [ ] **Set up Prisma migrations directory** — Run `npx prisma migrate dev --name init --schema apps/api/prisma/schema.prisma` to formalize migrations tracking.

### Feature Development Backlog (Not Yet Started)

- [ ] **Email service integration** — Wire up Resend SMTP to `apps/api/src/auth/auth.service.ts` for email verification on registration and password reset flows.
- [ ] **Membership approval flow** — Admin dashboard UI to approve/reject pending membership applications.
- [ ] **Event registration** — Mobile and admin UIs for event creation and attendee registration.
- [ ] **Welfare request UI** — Mobile form submission and admin triage view.
- [ ] **Community groups** — UI for browsing, joining, and posting in community groups.
- [ ] **End-to-end encrypted messaging** — WebSocket messaging gateway (`apps/api/src/messaging/messaging.gateway.ts`) is wired up; client-side encryption layer needs implementation.
- [ ] **Leadership management** — Admin interface for publishing leadership roster.
- [ ] **Announcement broadcasting** — Admin UI for composing and targeting announcements by audience type.
- [ ] **Audit log viewer** — Admin dashboard table for inspecting all admin actions.
- [ ] **iOS support** — FCM configuration and `GoogleService-Info.plist` for iOS builds.

---

## Key File Locations

| Purpose | Path |
| :--- | :--- |
| Environment config | [`.env`](c:/Android studio/EKUSA/.env) |
| Environment template | [`.env.example`](c:/Android studio/EKUSA/.env.example) |
| Prisma schema | [`apps/api/prisma/schema.prisma`](c:/Android studio/EKUSA/apps/api/prisma/schema.prisma) |
| Database seed | [`apps/api/prisma/seed.ts`](c:/Android studio/EKUSA/apps/api/prisma/seed.ts) |
| NestJS app module | [`apps/api/src/app.module.ts`](c:/Android studio/EKUSA/apps/api/src/app.module.ts) |
| Auth service | [`apps/api/src/auth/auth.service.ts`](c:/Android studio/EKUSA/apps/api/src/auth/auth.service.ts) |
| Notifications service | [`apps/api/src/notifications/notifications.service.ts`](c:/Android studio/EKUSA/apps/api/src/notifications/notifications.service.ts) |
| Mobile notification service | [`apps/mobile/app/services/notificationService.ts`](c:/Android studio/EKUSA/apps/mobile/app/services/notificationService.ts) |
| Admin API client config | [`apps/admin/src/lib/apiClient.ts`](c:/Android studio/EKUSA/apps/admin/src/lib/apiClient.ts) |
| Shared API client | [`packages/api-client/src/index.ts`](c:/Android studio/EKUSA/packages/api-client/src/index.ts) |
| Shared types | [`packages/shared-types/src/index.ts`](c:/Android studio/EKUSA/packages/shared-types/src/index.ts) |

---

## Running the Project Locally

```bash
# Install all dependencies
yarn install

# Start the API (from repo root)
yarn workspace @ekusa/api dev

# Start the Admin dashboard (from repo root)
yarn workspace @ekusa/admin dev

# Start the Mobile app (from repo root)
yarn workspace @ekusa/mobile dev

# Push Prisma schema to DB (run from repo root)
npx prisma db push --schema apps/api/prisma/schema.prisma

# Seed the database (run from repo root)
npx ts-node apps/api/prisma/seed.ts

# Run API build check
yarn workspace @ekusa/api build

# Run typechecks
yarn workspace @ekusa/api typecheck
yarn workspace @ekusa/admin typecheck
yarn workspace @ekusa/mobile typecheck
```

---

## Repository

- **GitHub:** `https://github.com/ekusafamily/ekusaapp.git`
- **Branch:** `main`
- **Version Tag:** `v1.001`
