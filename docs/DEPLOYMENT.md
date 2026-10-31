# EKUSA Digital Platform - Deployment Guide

## Overview
This guide covers deploying the EKUSA Digital Platform to development, staging, and production environments.

## Prerequisites

### Required Tools
- Docker 24+ & Docker Compose 2+
- Node.js 20+ & Yarn 4+
- PostgreSQL 16 client tools
- kubectl (for Kubernetes deployment)
- AWS CLI / Cloud provider CLI

### Required Accounts
- Cloud provider (AWS/GCP/Azure/Render)
- Firebase project (FCM)
- S3-compatible storage (MinIO/AWS S3/Cloudflare R2)
- Domain name with DNS control
- SSL certificates (Let's Encrypt or purchased)

---

## Environment Variables

### Backend API (.env)
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/ekusa?schema=public

# Redis
REDIS_URL=redis://host:6379

# JWT
JWT_SECRET=your-256-bit-secret-key-here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Server
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://app.ekusa.example.com
ADMIN_URL=https://admin.ekusa.example.com

# S3/MinIO
S3_ENDPOINT=https://s3.example.com
S3_BUCKET=ekusa
S3_ACCESS_KEY=access-key
S3_SECRET_KEY=secret-key
S3_REGION=us-east-1

# Firebase (FCM)
FCM_SERVER_KEY=your-fcm-server-key
FCM_PROJECT_ID=your-firebase-project

# Email (optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@ekusa.example.com
SMTP_PASS=smtp-password
```

### Mobile App (app.config.js / eas.json)
```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://api.ekusa.example.com/api/v1",
      "fcmProjectId": "your-firebase-project"
    }
  }
}
```

### Admin Dashboard (.env)
```bash
VITE_API_URL=https://api.ekusa.example.com/api/v1
```

---

## Local Development

### 1. Start Infrastructure
```bash
docker-compose up -d postgres redis minio
```

### 2. Run Migrations
```bash
cd apps/api
yarn db:migrate
yarn db:seed
```

### 3. Start All Services
```bash
# Terminal 1: API
cd apps/api && yarn dev

# Terminal 2: Admin
cd apps/admin && yarn dev

# Terminal 3: Mobile
cd apps/mobile && yarn dev
```

### 4. Access Points
- API: http://localhost:3000/api/v1
- API Docs: http://localhost:3000/docs
- Admin: http://localhost:5173
- Mobile: Expo Go app or simulator
- MinIO Console: http://localhost:9001 (ekusa / ekusa_dev_password)

---

## Staging Deployment (Render Example)

### 1. Create Services on Render

#### PostgreSQL
- Plan: Starter or Standard
- Region: Closest to users
- Enable: Automatic backups, Point-in-time recovery

#### Redis
- Plan: Starter
- Region: Same as PostgreSQL

#### Web Service (API)
- Build Command: `cd apps/api && yarn install && yarn build`
- Start Command: `cd apps/api && yarn start:prod`
- Environment: Node.js
- Auto-Deploy: Yes (on main/staging branch)
- Health Check: `/api/v1/health`

#### Static Site (Admin)
- Build Command: `cd apps/admin && yarn install && yarn build`
- Publish Directory: `apps/admin/dist`
- Environment: Static
- Auto-Deploy: Yes

### 2. Configure Environment Variables
Add all variables from `.env` to each service in Render dashboard.

### 3. Custom Domains
- API: `api-staging.ekusa.example.com`
- Admin: `admin-staging.ekusa.example.com`
- SSL: Automatic (Let's Encrypt)

### 4. Database Migration
```bash
# Run via Render shell or CI/CD
cd apps/api && yarn db:migrate:deploy
```

---

## Production Deployment

### Option A: Render (Simpler)
Follow staging steps with:
- Higher tier plans (Pro/Business)
- Multiple regions for HA
- Custom health checks
- Zero-downtime deploys

### Option B: Kubernetes (EKS/GKE/AKS)

#### 1. Cluster Setup
```bash
# EKS example
eksctl create cluster \
  --name ekusa-prod \
  --region us-east-1 \
  --nodes 3 \
  --node-type t3.medium \
  --managed
```

#### 2. Install Operators
```bash
# Cert-manager for SSL
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# External DNS for DNS management
kubectl apply -f https://github.com/kubernetes-sigs/external-dns/releases/download/v0.13.0/external-dns.yaml

# Ingress NGINX
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.0/deploy/static/provider/aws/deploy.yaml
```

#### 3. Deploy with Helm/Kustomize
```yaml
# kustomization.yml example
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
  - namespace.yml
  - postgres.yml
  - redis.yml
  - api-deployment.yml
  - admin-deployment.yml
  - ingress.yml
  - secrets.yml
configMapGenerator:
  - name: api-config
    literals:
      - NODE_ENV=production
      - PORT=3000
secretGenerator:
  - name: api-secrets
    envs:
      - .env.production
```

#### 4. Database (Managed Recommended)
Use Cloud SQL (GCP), RDS (AWS), or Azure Database for PostgreSQL with:
- Multi-AZ deployment
- Read replicas
- Automated backups (30-day retention)
- Encryption at rest + in transit
- IAM authentication

#### 4. Object Storage
- AWS S3 + CloudFront CDN
- Or Cloudflare R2 (no egress fees)
- Bucket policies for private/public access

### 4. CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'yarn' }
      - run: yarn install --immutable
      - run: yarn build
      - run: yarn test
      - name: Deploy to Kubernetes
        uses: azure/k8s-set-context@v1
        with: { kubeconfig: ${{ secrets.KUBECONFIG }} }
      - run: kubectl apply -k overlays/production
```

---

## Database Migration Strategy

### Development
```bash
yarn db:migrate dev --name migration_name
```

### Staging/Production
```bash
# 1. Backup database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# 2. Apply migrations
yarn db:migrate deploy

# 3. Verify
yarn db:studio  # Check schema

# 4. Rollback plan (if needed)
# Manual SQL - Prisma doesn't support down migrations
```

### Zero-Downtime Migrations
1. **Additive only**: New columns/tables first
2. **Backfill**: Separate script for data migration
3. **Switch**: Code deploy using new columns
4. **Cleanup**: Remove old columns in next release

---

## Monitoring & Observability

### Health Checks
```bash
# API
GET /api/v1/health
# Response: { status: "ok", checks: { db: "ok", redis: "ok" } }

# Database
SELECT 1;

# Redis
PING
```

### Logging
- **Format**: JSON (Pino/Winston)
- **Levels**: error, warn, info, debug
- **Fields**: timestamp, level, service, traceId, userId, message
- **Aggregation**: Loki + Grafana or Datadog/CloudWatch

### Metrics (Prometheus)
```yaml
# Key metrics to alert on
- http_requests_total{status=~"5.."} > 1% for 5m
- db_connections_active > 80% of max
- redis_memory_used > 80% of max
- message_queue_lag > 1000 for 5m
- jwt_token_refresh_failures > 10/min
```

### Alerting Rules
| Alert | Condition | Severity |
|-------|-----------|----------|
| API Down | Health check fails 3x | Critical |
| High Error Rate | 5xx > 5% for 5m | Critical |
| DB Connections | > 90% pool | Warning |
| Queue Lag | > 1000 messages | Warning |
| Cert Expiry | < 30 days | Warning |

---

## Backup & Disaster Recovery

### Backup Schedule
| Component | Frequency | Retention | Method |
|-----------|-----------|-----------|--------|
| PostgreSQL | Daily 02:00 UTC | 30 days daily, 12 months monthly | pg_basebackup / Cloud provider |
| Redis | Hourly | 7 days | RDB + AOF |
| MinIO | Daily | 30 days | Cross-region replication |
| Config/Secrets | On change | Indefinite | Git / Secret manager |

### Recovery Procedures

#### Database Restore
```bash
# 1. Stop API
kubectl scale deployment api --replicas=0

# 2. Restore
pg_restore -d $DATABASE_URL backup_20240115.dump

# 3. Run migrations (if schema changed)
yarn db:migrate deploy

# 4. Start API
kubectl scale deployment api --replicas=3
```

#### Full Region Failover
1. DNS failover to secondary region (Route53/Cloud DNS health checks)
2. Promote read replica to primary
3. Update connection strings
4. Verify all services
5. Communicate status

### RTO/RPO Targets
| Scenario | RTO | RPO |
|----------|-----|-----|
| Single service restart | 2 min | 0 |
| Database restore | 30 min | 24 hours |
| Region failover | 15 min | 1 hour |
| Complete rebuild | 4 hours | 24 hours |

---

## Security Hardening Checklist

### Pre-Deployment
- [ ] All secrets in secret manager (not config maps)
- [ ] TLS 1.3 enforced everywhere
- [ ] Security headers configured (Helmet.js)
- [ ] Rate limiting enabled
- [ ] WAF rules for common attacks
- [ ] Container images scanned (Trivy)
- [ ] Dependencies audited (npm audit, Snyk)
- [ ] Penetration test completed

### Network
- [ ] Private subnets for DB/Redis
- [ ] NAT Gateway for egress
- [ ] Security groups: least privilege
- [ ] VPC Flow Logs enabled
- [ ] DDoS protection (Shield/Cloud Armor)

### Access Control
- [ ] IAM roles: least privilege
- [ ] MFA required for console access
- [ ] Bastion host for DB access
- [ ] Audit logging on all admin actions
- [ ] Key rotation scheduled

---

## Rollback Procedures

### Application Rollback
```bash
# Kubernetes
kubectl rollout undo deployment/api

# Render
# Click "Rollback" in dashboard to previous deploy
```

### Database Rollback
```bash
# 1. Restore from backup (see above)
# 2. If migration was additive-only, code rollback suffices
```

### Emergency Contacts
- **On-call**: +254-XXX-XXXXXX
- **DPO**: dpo@ekusa.ac.ke
- **Cloud Support**: AWS/GCP/Azure enterprise support

---

## Cost Optimization

### Right-Sizing
| Component | Dev | Staging | Production |
|-----------|-----|---------|------------|
| API CPU | 0.5 vCPU | 1 vCPU | 2 vCPU (HPA 2-10) |
| API Memory | 512MB | 1GB | 2GB |
| PostgreSQL | db.t3.micro | db.t3.small | db.r6g.xlarge (multi-AZ) |
| Redis | cache.t3.micro | cache.t3.small | cache.r6g.xlarge |
| MinIO | Local | 50GB | 500GB + CloudFront |

### Savings Plans
- 1-year reserved instances for steady-state (DB, Redis)
- Spot instances for batch jobs (if any)
- S3 Intelligent Tiering for object storage

---

## Checklist: Production Launch

### Code
- [ ] All tests passing (unit, integration, e2e)
- [ ] Security audit passed
- [ ] Performance benchmarks met (< 500ms p95)
- [ ] Feature flags for risky features

### Infrastructure
- [ ] DNS configured with health checks
- [ ] SSL certificates valid (90+ days)
- [ ] Monitoring dashboards created
- [ ] Alerting rules tested
- [ ] Backup restore tested this month
- [ ] Runbooks documented

### Operations
- [ ] On-call schedule published
- [ ] Incident response plan reviewed
- [ ] Stakeholder communication plan
- [ ] Rollback procedure tested

### Compliance
- [ ] DPIA completed
- [ ] Privacy policy accessible
- [ ] Terms of service accepted
- [ ] Data processing agreements signed
- [ ] ODPC notification (if required)

---

*Document Version: 1.0 | Last Updated: 2024-01-15*