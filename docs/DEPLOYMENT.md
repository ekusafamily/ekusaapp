# EKUSA Digital Platform - Deployment Guide

## Overview
This guide covers deploying the EKUSA Digital Platform to development, staging, and production environments using **Render** for application hosting and **Supabase** for managed PostgreSQL and Object Storage.

---

## 1. Prerequisites & Tech Stack
- **Backend API**: NestJS + TypeScript (Hosted on Render Web Service)
- **Database & Storage**: Supabase PostgreSQL 16 & Supabase Storage
- **Admin Portal**: React + Vite (Hosted on Render Static Site)
- **Mobile App**: React Native / Expo (Built via EAS Build)
- **DNS & SSL**: Cloudflare

---

## 2. Environment Variables Setup
Copy `.env.example` to `.env` and configure your production values:

```bash
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://app.ekusa.ac.ke
ADMIN_URL=https://admin.ekusa.ac.ke

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database (Supabase PostgreSQL via PgBouncer)
DATABASE_URL=postgresql://postgres.your-ref:password@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.your-ref:password@aws-0-eu-central-1.pooler.supabase.com:5432/postgres

# Auth
JWT_SECRET=your-256-bit-jwt-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

---

## 3. Local Development

### 1. Install Dependencies
```bash
corepack enable
yarn install
```

### 2. Run Database Migrations & Seeding
```bash
cd apps/api
yarn db:migrate
yarn db:seed
```

### 3. Start Development Servers
```bash
# API Backend
cd apps/api && yarn dev

# Admin Portal
cd apps/admin && yarn dev

# Mobile App
cd apps/mobile && yarn dev
```

---

## 4. Production Deployment (Render + Supabase)

### A. Supabase Database & Storage Setup
1. Create a project on [Supabase](https://supabase.com).
2. Note your connection strings (Pooled and Direct).
3. Create Storage buckets: `avatars`, `documents`, `events`.
4. Run Prisma migrations against your Supabase database:
   ```bash
   cd apps/api
   DATABASE_URL="your-supabase-pooled-url" DIRECT_URL="your-supabase-direct-url" yarn db:migrate:deploy
   ```

### B. Render Web Service (Backend API)
1. Connect your GitHub repository to Render.
2. Create a new **Web Service**:
   - **Root Directory**: `apps/api`
   - **Build Command**: `yarn install && yarn build`
   - **Start Command**: `yarn start:prod`
   - **Environment Variables**: Add all variables from `.env`.
3. Deploy and verify health check at `/api/v1/health`.

### C. Render Static Site (Admin Dashboard)
1. Create a new **Static Site** on Render:
   - **Root Directory**: `apps/admin`
   - **Build Command**: `yarn install && yarn build`
   - **Publish Directory**: `apps/admin/dist`
   - **Environment Variables**: `VITE_API_URL=https://api.ekusa.ac.ke/api/v1`
2. Deploy and map custom domain: `admin.ekusa.ac.ke`.

---

## 5. Mobile App Building (EAS Build)

1. Install EAS CLI: `npm install -g eas-cli`
2. Configure project: `eas login` then `eas project:init`
3. Build for Android:
   ```bash
   cd apps/mobile
   eas build --platform android --profile production
   ```

---

## 6. Backup & Disaster Recovery (Supabase)
- **Database**: Supabase automatically performs daily backups and maintains Point-in-Time Recovery (PITR) for Pro plans.
- **Storage**: Objects uploaded to Supabase Storage are replicated and backed up natively.
- **RTO / RPO**: RTO < 30 minutes, RPO < 24 hours.