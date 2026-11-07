# EKUSA Digital Platform

> **Embu Kimathi University Student Association (EKUSA) Digital Platform**
> An integrated digital ecosystem for EKUSA members — official communications, membership management, events, welfare support, and secure private messaging.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![React Native](https://img.shields.io/badge/React%20Native-Expo-blue.svg)](https://expo.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-10-red.svg)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)

---

## 🎯 Product Vision

To create a central digital home for EKUSA where members can access association information, participate in activities, communicate securely, and remain connected regardless of their location.

### Core Principles
- **EKUSA First** — Home screen prioritizes association services
- **Open Registration, Controlled Membership** — Anyone can register; verified membership requires admin approval
- **Privacy by Design** — Private conversations are end-to-end encrypted, inaccessible to platform operators
- **Institutional Accountability** — Official communications have identifiable publishers and audit trails
- **Modular Architecture** — Separate modules for EKUSA services and messaging

---

## 🏗️ Architecture Overview

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
│  (Primary DB)   │  │  (Cache/Queue)  │
└─────────────────┘  └─────────────────┘
         │
         ▼
┌─────────────────┐
│  MinIO / S3     │
│  (Object Store) │
└─────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- **Docker** 24+ & **Docker Compose** 2+
- **Node.js** 20+ & **Yarn** 4+
- **Git**

### 1. Clone & Install
```bash
git clone https://github.com/ekusa/digital-platform.git
cd ekusa-digital-platform
yarn install
```

### 2. Start Infrastructure
```bash
docker-compose up -d postgres redis minio
```

### 3. Setup Database
```bash
cd apps/api
yarn db:migrate
yarn db:seed
```

### 4. Start Development Servers
```bash
# Terminal 1: Backend API (port 3000)
cd apps/api && yarn dev

# Terminal 2: Admin Dashboard (port 5173)
cd apps/admin && yarn dev

# Terminal 3: Mobile App (Expo)
cd apps/mobile && yarn dev
```

### 5. Access Points
| Service | URL |
|---------|-----|
| API | http://localhost:3000/api/v1 |
| API Docs (Swagger) | http://localhost:3000/docs |
| Admin Dashboard | http://localhost:5173 |
| Mobile App | Expo Go / Simulator |
| MinIO Console | http://localhost:9001 |

---

## 📁 Monorepo Structure

```
ekusa-platform/
├── apps/
│   ├── mobile/          # React Native (Expo) + TypeScript
│   │   ├── app/         # Expo Router screens
│   │   ├── components/  # Reusable UI components
│   │   ├── services/    # Crypto, notifications, storage
│   │   ├── stores/      # Zustand state management
│   │   └── constants/   # Design tokens
│   │
│   ├── admin/           # React + Vite + TypeScript
│   │   ├── src/
│   │   │   ├── pages/   # Admin modules (Dashboard, Members, etc.)
│   │   │   ├── components/  # Layout, ProtectedRoute
│   │   │   └── lib/     # API client
│   │   └── public/
│   │
│   └── api/             # NestJS + TypeScript
│       ├── src/
│       │   ├── auth/           # JWT, Argon2id, Passport
│       │   ├── users/          # Profiles, search
│       │   ├── membership/     # Applications, verification
│       │   ├── announcements/  # Official comms, FCM
│       │   ├── events/         # Events, registration
│       │   ├── welfare/        # Requests, case management
│       │   ├── messaging/      # E2EE, Signal Protocol
│       │   ├── community/      # Groups, posts
│       │   ├── leadership/     # Directory, positions
│       │   ├── roles/          # RBAC
│       │   ├── notifications/  # In-app + push
│       │   ├── audit/          # Admin action logs
│       │   ├── admin/          # Dashboard, settings
│       │   └── prisma/         # DB client, migrations
│       └── prisma/
│           └── schema.prisma   # Full DB schema
│
├── packages/
│   ├── shared-types/    # Shared TypeScript interfaces
│   ├── validation/      # Zod schemas for API contracts
│   └── api-client/      # TanStack Query + Axios client
│
├── infrastructure/
│   ├── docker/          # Docker Compose
│   └── deployment/      # Render/K8s configs
│
└── docs/
    ├── PRD.md           # Product Requirements Document
    ├── ARCHITECTURE.md  # Technical architecture
    ├── DATABASE.md      # Schema documentation
    ├── API.md           # REST API reference
    ├── SECURITY.md      # Security architecture
    └── DEPLOYMENT.md    # Deployment guide
```

---

## ✨ Key Features

### Mobile App (5-Tab Navigation)
| Tab | Features |
|-----|----------|
| **Home** | Announcements, upcoming events, quick actions, association updates |
| **Chats** | E2E encrypted 1-to-1 messaging, delivery/read receipts, block users |
| **Community** | Campus/constituency/committee groups, posts, moderation |
| **Events** | Calendar, registration, capacity management, attendance |
| **Profile** | Membership status, settings, privacy, security |

### Admin Dashboard
| Module | Capabilities |
|--------|--------------|
| **Dashboard** | Real-time stats, recent activity |
| **Members** | User management, status tracking |
| **Membership** | Application review, approve/reject with audit |
| **Announcements** | Create, target audiences, schedule, publish, analytics |
| **Events** | Create, manage registrations, record attendance |
| **Welfare** | Review requests, assign officers, track resolution |
| **Communities** | Create groups, moderate content |
| **Leadership** | Position management, assignments |
| **Roles** | RBAC configuration |
| **Audit Logs** | Immutable admin action history |
| **Settings** | Platform configuration |

### Backend API Modules
- **Auth**: JWT (15min access + 7d refresh), Argon2id, rate limiting
- **Users**: Profiles, avatar upload, username search
- **Membership**: Application workflow, verification, status sync
- **Announcements**: Audience targeting, FCM push, read tracking
- **Events**: Categories, capacity, eligibility, attendance
- **Welfare**: Confidential requests, officer assignment, updates
- **Messaging**: Signal Protocol E2EE, device registration, prekey bundles, message queue, WebSocket
- **Community**: Groups, membership, posts
- **Leadership**: Positions, assignments, directory
- **Roles**: Dynamic RBAC with audit trail
- **Notifications**: In-app + FCM push
- **Audit**: Immutable admin action logs

---

## 🔐 Security Highlights

- **End-to-End Encryption**: Signal Protocol (Double Ratchet) for private messages
- **Key Storage**: Android Keystore / iOS Secure Enclave / Expo SecureStore
- **Authentication**: JWT (15min) + rotating refresh tokens, Argon2id passwords
- **Authorization**: Dynamic RBAC with database-backed roles/permissions
- **Audit Trail**: Immutable logs for all administrative actions
- **Data Classification**: Institutional data (server) vs Private messages (client-only)
- **Compliance**: Kenyan Data Protection Act, 2019 aligned

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [PRD](docs/PRD.md) | Complete product requirements |
| [Architecture](docs/ARCHITECTURE.md) | Technical architecture & data flows |
| [Database](docs/DATABASE.md) | Full schema with ERD, indexes, migrations |
| [API Reference](docs/API.md) | Complete REST API + WebSocket docs |
| [Security](docs/SECURITY.md) | E2EE, RBAC, compliance, threat model |
| [Deployment](docs/DEPLOYMENT.md) | Dev/Staging/Prod deployment guides |

---

## 🧪 Testing

```bash
# Run all tests
yarn test

# Type checking
yarn typecheck

# Linting
yarn lint

# Format code
yarn format
```

### Test Structure
| Layer | Tool | Coverage Target |
|-------|------|-----------------|
| Unit (shared) | Vitest | 80%+ |
| Unit (API) | Vitest + Supertest | 80%+ |
| Integration | Testcontainers | Critical paths |
| E2E Mobile | Detox | Auth, Home, Chats, Events, Profile |
| E2E Admin | Playwright | Admin CRUD flows |
| Contract | Pact | API client ↔ API |

---

## 🚢 Deployment

### Environments
| Environment | Purpose | Deployment |
|-------------|---------|------------|
| **Development** | Local dev | Docker Compose |
| **Staging** | Pre-release testing | Render / K8s |
| **Production** | Live users | VPS (self-hosted), Render, EKS/GKE |

### Deploy to a VPS (self-hosted)

Tested on Ubuntu 22.04 LTS. The platform has three server-side pieces: the NestJS API, the Admin dashboard (served as a static build), and backing services (PostgreSQL + Redis via Docker Compose; in production these can be replaced by managed services such as Supabase — see `.env.example`). The mobile app is not hosted on the VPS; it ships through the app stores via Expo.

1. **Provision the server** — any VPS with 2 vCPU / 4 GB RAM (Hetzner, DigitalOcean, Lightsail, etc.). Point `api.yourdomain.com` and `admin.yourdomain.com` A-records at the server IP.

2. **Install dependencies**
   ```bash
   sudo apt update && sudo apt install -y docker.io docker-compose-plugin nginx certbot python3-certbot-nginx git
   sudo systemctl enable --now docker
   ```

3. **Clone and configure**
   ```bash
   git clone <repo-url> /opt/ekusa && cd /opt/ekusa
   cp .env.example .env   # fill in production values (DATABASE_URL, JWT_SECRET, Supabase, SMTP, FCM)
   ```

4. **Start backing services**
   ```bash
   docker compose up -d postgres redis   # MinIO is only needed if self-hosting object storage
   ```

5. **Build and run the API**
   ```bash
   docker build -f apps/api/Dockerfile -t ekusa-api:latest .
   docker run -d --name ekusa-api --restart unless-stopped --env-file .env -p 3000:3000 ekusa-api:latest
   docker run --rm --env-file .env --network host ekusa-api:latest npx prisma migrate deploy
   ```

6. **Build the Admin dashboard**
   ```bash
   cd apps/admin && yarn install && yarn build   # outputs dist/
   ```

7. **Reverse proxy + SSL (nginx)**
   ```nginx
   # /etc/nginx/sites-available/ekusa
   server {
     server_name api.yourdomain.com;
     location / {
       proxy_pass http://127.0.0.1:3000;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
     }
   }
   server {
     server_name admin.yourdomain.com;
     root /opt/ekusa/apps/admin/dist;
     index index.html;
     location / { try_files $uri $uri/ /index.html; }
   }
   ```
   ```bash
   sudo ln -s /etc/nginx/sites-available/ekusa /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   sudo certbot --nginx -d api.yourdomain.com -d admin.yourdomain.com
   ```

8. **Lock down the firewall** — expose only 22/80/443; keep PostgreSQL (5432) and Redis (6379) internal:
   ```bash
   sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable
   ```

9. **Updates** — `git pull`, rebuild the API image, then `docker stop ekusa-api && docker rm ekusa-api` and re-run step 5. Rebuild the admin bundle and reload nginx for frontend changes.

### Quick Deploy (Render)
1. Connect GitHub repo to Render
2. Create PostgreSQL, Redis, Web Service (API), Static Site (Admin)
3. Add environment variables
4. Configure custom domains + SSL
5. Run migrations: `yarn db:migrate deploy`

See [Deployment Guide](docs/DEPLOYMENT.md) for full details.

---

## 🛠️ Development Commands

```bash
# Root (monorepo)
yarn dev              # Start all dev servers
yarn build            # Build all packages
yarn lint             # Lint all packages
yarn typecheck        # Type check all packages
yarn test             # Test all packages
yarn format           # Prettier format

# Mobile
cd apps/mobile
yarn dev              # Expo dev server
yarn build:android    # EAS build Android
yarn build:ios        # EAS build iOS

# Admin
cd apps/admin
yarn dev              # Vite dev server
yarn build            # Production build

# API
cd apps/api
yarn dev              # NestJS watch mode
yarn build            # Production build
yarn db:migrate       # Run migrations
yarn db:studio        # Prisma Studio
yarn db:seed          # Seed database
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make changes with tests
4. Run `yarn lint && yarn typecheck && yarn test`
5. Submit a Pull Request

### Commit Convention
```
feat: add new announcement targeting
fix: resolve message queue duplication
docs: update API reference
refactor: simplify membership service
test: add welfare integration tests
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support & Contact

- **Product Issues**: [GitHub Issues](https://github.com/ekusa/digital-platform/issues)
- **Security**: security@ekusa.ac.ke (PGP key available)
- **Data Protection**: dpo@ekusa.ac.ke
- **General**: info@ekusa.ac.ke

---

## 🙏 Acknowledgations

- **EKUSA Leadership** for vision and requirements
- **Open Source Community** for the amazing tools:
  - [Expo](https://expo.dev/) · [NestJS](https://nestjs.com/) · [Prisma](https://www.prisma.io/)
  - [Signal Protocol](https://signal.org/docs/) · [TanStack Query](https://tanstack.com/query)
  - [Zod](https://zod.dev/) · [Zustand](https://zustand-demo.pmnd.rs/)
- **Kenyan Open Source Community** for inspiration

---

**Built with ❤️ for the EKUSA community**