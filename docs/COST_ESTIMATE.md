# EKUSA Digital Platform - Infrastructure Cost Estimation

## Overview
This document provides a realistic operating budget in Kenyan Shillings (KES) for the EKUSA Digital Platform, comparing **Managed Supabase** and **Self-Hosted Supabase** across three operational phases.

*Exchange Rate Assumption*: 1 USD = 130 KES (January 2024 baseline).

---

## 1. Development & Testing Phase
*Goal: Local development and staging evaluation.*

| Service | Managed Supabase (Free Tier) | Self-Hosted Supabase (Local Docker) |
|---|---|---|
| Database | Free (500MB, paused after 1 week inactivity) | Free (Local PostgreSQL container) |
| Storage | Free (1GB) | Free (Local volume storage) |
| Backend API | Render Free Tier (Spin down on inactivity) | Local machine |
| Admin Portal | Render Free Tier | Local machine |
| Domain / DNS | Cloudflare Free | Cloudflare Free |
| **Total Monthly Cost** | **0 KES / $0** | **0 KES / $0** |

---

## 2. Initial Production Phase
*Goal: Launching the platform for ~5,000 university students with moderate activity.*

| Component | Service Provider | Managed Supabase (USD) | Self-Hosted Supabase (USD) |
|---|---|---|---|
| Database (PostgreSQL) | Supabase Pro Plan / VPS | $25.00 | $6.00 (Hetzner / DigitalOcean 2vCPU / 4GB VPS) |
| Object Storage | Supabase Storage (100GB) | Included in Pro | Included in VPS |
| Backend API | Render Web Service (Starter) | $7.00 | $7.00 |
| Admin Portal | Render Static Site | Free | Free |
| Domain & SSL | Cloudflare / NIC.KE | $1.50 (~200 KES) | $1.50 (~200 KES) |
| Transactional Email | Resend (Free/Pro) | $0.00 | $0.00 |
| Push Notifications | Firebase FCM | Free | Free |
| **Total Monthly Cost (USD)** | **$33.50** | **$14.50** |
| **Total Monthly Cost (KES)** | **~4,355 KES** | **~1,885 KES** |

---

## 3. Growing Production Phase
*Goal: Scaling to ~15,000+ students, heavy event registrations, and high message volume.*

| Component | Managed Supabase (USD) | Self-Hosted Supabase (USD) |
|---|---|---|
| Database (Scaled) | $25.00 + compute addons ($50) | $18.00 (8GB RAM VPS) |
| Storage & Bandwidth | $10.00 (Extra GBs) | Included in VPS |
| Backend API (Render Pro) | $25.00 | $25.00 |
| Admin Portal | Free | Free |
| Backups & Monitoring | Included / Datadog ($15) | $10.00 (Managed backups) |
| Domain & Email | $2.00 | $2.00 |
| **Total Monthly Cost (USD)** | **$102.00** | **$55.00** |
| **Total Monthly Cost (KES)** | **~13,260 KES** | **~7,150 KES** |

---

## 4. Managed vs. Self-Hosted Recommendation for EKUSA

### Recommendation: **Managed Supabase (Pro Plan)** for Initial Launch
While self-hosted Supabase on a $6/month VPS is technically cheaper, **Managed Supabase (Pro Plan at $25/month ~ 3,250 KES)** is strongly recommended for EKUSA because:
1. **Zero Maintenance**: Automated daily backups, point-in-time recovery, and security patches are handled entirely by Supabase.
2. **Student Association Continuity**: Student leadership changes annually. A managed platform ensures that incoming officials do not need advanced Linux server administration skills to keep the database and storage running.
3. **Built-in Scaling**: Seamlessly handles traffic spikes during university elections, exam periods, and major student events without manual VPS resizing.