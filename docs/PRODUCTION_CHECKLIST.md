# EKUSA Digital Platform - Production Checklist

## Phase 1: Infrastructure & Supabase Setup
- [ ] Create Supabase production project
- [ ] Record Supabase Project URL, anon key, and service role key
- [ ] Configure Supabase database password and PgBouncer connection string
- [ ] Set up automated daily backups and point-in-time recovery in Supabase
- [ ] Create Supabase Storage buckets (`avatars`, `documents`, `events`) with appropriate public/private rules
- [ ] Configure Supabase Storage Row Level Security (RLS) policies

## Phase 2: Backend API (Render)
- [ ] Create Render Web Service for NestJS API
- [ ] Configure build command: `cd apps/api && yarn install && yarn build`
- [ ] Configure start command: `cd apps/api && yarn start:prod`
- [ ] Set all environment variables in Render dashboard (including `DATABASE_URL` with PgBouncer)
- [ ] Configure health check endpoint: `/api/v1/health`
- [ ] Bind custom domain: `api.ekusa.ac.ke` with automatic SSL

## Phase 3: Admin Dashboard (Render)
- [ ] Create Render Static Site for Admin Portal
- [ ] Configure build command: `cd apps/admin && yarn install && yarn build`
- [ ] Configure publish directory: `apps/admin/dist`
- [ ] Set environment variable `VITE_API_URL=https://api.ekusa.ac.ke/api/v1`
- [ ] Bind custom domain: `admin.ekusa.ac.ke` with automatic SSL

## Phase 4: Database & Seeding
- [ ] Run Prisma production migrations: `yarn workspace @ekusa/api db:migrate:deploy`
- [ ] Seed initial roles and super admin account: `yarn workspace @ekusa/api db:seed`
- [ ] Verify database indexes and connection pool stability

## Phase 5: Mobile App (Expo / EAS)
- [ ] Configure `app.json` / `eas.json` with production API URL (`https://api.ekusa.ac.ke/api/v1`)
- [ ] Configure Firebase Cloud Messaging (FCM) credentials for Android push notifications
- [ ] Build production Android APK/AAB via EAS Build: `eas build --platform android`
- [ ] Test push notifications and E2EE messaging on physical device

## Phase 6: Security & Compliance Verification
- [ ] Verify JWT secret is strong (256-bit random string)
- [ ] Verify service-role keys are never exposed in frontend/mobile builds
- [ ] Verify CORS settings allow only production frontend and admin domains
- [ ] Test RBAC guards and membership verification workflow
- [ ] Review Kenyan Data Protection Act, 2019 consent and privacy notices

## Phase 7: Launch & Monitoring
- [ ] Perform end-to-end smoke test (Register → Apply Membership → Publish Announcement → Register Event)
- [ ] Enable uptime monitoring (Render health checks + UptimeRobot)
- [ ] Verify audit logs capture administrative actions correctly
- [ ] Announce platform launch to EKUSA members