# EKUSA Digital Platform - Security Architecture

## Security Principles

1. **Defense in Depth** - Multiple layers of security controls
2. **Least Privilege** - Minimum permissions required
3. **Privacy by Design** - E2EE for private messages, data minimization
4. **Audit Everything** - Immutable logs for all admin actions
5. **Secure by Default** - Secure configurations out of the box

---

## Authentication & Authorization

### Password Security
- **Algorithm**: Argon2id (memory-hard, resistant to GPU/ASIC)
- **Parameters**: memory=64MB, iterations=3, parallelism=1
- **Minimum Length**: 8 characters
- **Requirements**: Uppercase, lowercase, number, special character
- **Breach Checking**: Check against HaveIBeenPwned API (k-anonymity)

### Token Management
| Token Type | Lifetime | Storage | Rotation |
|------------|----------|---------|----------|
| Access Token | 15 minutes | Memory (mobile) / HttpOnly Cookie (web) | N/A |
| Refresh Token | 7 days | Secure Storage (mobile) / HttpOnly Cookie (web) | Rotated on use |
| Password Reset | 1 hour | Database (hashed) | Single-use |

### JWT Claims
```json
{
  "sub": "user_id",
  "username": "john_doe",
  "accountStatus": "verified_member",
  "iat": 1700000000,
  "exp": 1700000900,
  "jti": "unique_token_id"
}
```

### Role-Based Access Control (RBAC)
- **Roles**: Configurable in database (not hardcoded)
- **Permissions**: Fine-grained strings (e.g., `publish_announcements`)
- **Assignment**: User ↔ Role many-to-many with audit trail
- **Evaluation**: Guards on controllers + service-level checks
- **Super Admin**: Bypasses all permission checks (audited)

### Session Security
- Concurrent session limit: 5 devices per user
- Device fingerprinting for anomaly detection
- Automatic revocation on password change
- Geo-velocity checks for suspicious logins

---

## End-to-End Encryption (E2EE)

### Protocol: Signal Protocol (Double Ratchet)
- **Library**: libsignal-protocol-typescript / @signalapp/libsignal-client
- **Curve**: Curve25519 (X25519 for key agreement)
- **Hash**: SHA-256
- **AEAD**: AES-256-GCM
- **MAC**: HMAC-SHA256

### Key Management

#### Identity Keys (Long-term)
- Generated on first app install
- Stored in **Android Keystore** / **iOS Secure Enclave** / **Expo SecureStore**
- Never leave device in plaintext
- Public key uploaded to server for key discovery

#### PreKeys (Ephemeral)
- **Signed PreKey**: Rotated weekly, signed by identity key
- **One-time PreKeys**: Batch of 100, consumed on use
- Server stores public portions only
- Regenerated when bundle depletes

#### Session Keys (Per-conversation)
- Derived via Double Ratchet from initial key exchange
- **Chain Keys**: Advanced per message
- **Message Keys**: One-time per message
- Deleted when conversation deleted

### Device Registration Flow
```
1. App generates Identity Key Pair (Curve25519)
2. App generates Registration ID (random 16-bit)
3. App generates Signed PreKey + signature
4. App generates 100 One-time PreKeys
5. POST /devices { identityPublicKey, registrationId, signedPreKey, preKeys }
6. Server stores public keys, returns success
```

### Message Encryption Flow
```
Sender:
1. Fetch recipient's PreKey Bundle from server
2. Derive session (if new) or load existing
3. Encrypt plaintext with session cipher
4. POST /messages { ciphertext, protocolMetadata }
5. Server queues for each recipient device

Recipient:
1. GET /messages/pending (long-poll/WebSocket)
2. Decrypt with local session
3. Store plaintext in encrypted local DB (SQLCipher)
4. POST /messages/acknowledge
5. Server removes from queue
```

### Group Messaging (Future - MLS)
- Current: Sender encrypts individually for each member
- Future: Message Layer Security (MLS) for efficient group encryption
- Migration path: Signal → MLS when group feature released

### Key Compromise Recovery
1. User detects compromise (device loss, malware)
2. App generates new Identity Key Pair
3. POST /devices with new keys (server marks old revoked)
4. All existing sessions invalidated
5. Contacts receive key change notification
6. New sessions established on next message

### Backup & Recovery (NOT in MVP)
- **MVP**: No cloud backup of private keys
- **User Education**: Clear warning on first chat
- **Future**: Encrypted backup to user-controlled cloud (Google Drive/iCloud) with user-held passphrase

---

## Data Classification

### Institutional Data (Server-Stored, Access-Controlled)
| Category | Examples | Retention | Encryption |
|----------|----------|-----------|------------|
| Authentication | Password hashes, refresh tokens | 7 years | Argon2id / AES-256 at rest |
| Membership | Applications, verification records | 10 years | AES-256 at rest |
| Announcements | Official communications | 7 years | AES-256 at rest |
| Events | Event details, registrations, attendance | 7 years | AES-256 at rest |
| Welfare | Requests, updates, assignments | 10 years | AES-256 at rest + column-level for sensitive |
| Community | Groups, posts, membership | 5 years | AES-256 at rest |
| Leadership | Positions, assignments | Permanent | AES-256 at rest |
| Audit Logs | Administrative actions | 7 years | Append-only, AES-256 at rest |

### Private Data (Client-Side Only)
| Category | Storage | Backup |
|----------|---------|--------|
| Private Messages | SQLCipher (Android) / Core Data + CryptoKit (iOS) | None (MVP) |
| Encryption Keys | Android Keystore / iOS Secure Enclave | None |
| Draft Messages | Local encrypted storage | None |
| Message Media | Encrypted local files | None |

### Data Flow Rules
```
┌─────────────────────────────────────────────────────────────┐
│                  INSTITUTIONAL DATA                         │
│  Mobile App ↔ HTTPS ↔ API ↔ PostgreSQL (encrypted at rest) │
│  Admin Dashboard ↔ HTTPS ↔ API ↔ PostgreSQL                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ✗ NEVER MIX
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    PRIVATE MESSAGE DATA                      │
│  Sender Device → Encrypt → HTTPS → API → Queue (ciphertext) │
│  Queue → HTTPS → Recipient Device → Decrypt → Local DB     │
│  Server NEVER sees plaintext                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Network Security

### Transport Security
- **TLS 1.3** mandatory for all connections
- **HSTS** with 1-year max-age, includeSubDomains, preload
- **Certificate Pinning** for mobile app (public key pinning)
- **mTLS** for inter-service communication (future)

### API Security
- **Rate Limiting**: Token bucket per user/IP
- **Input Validation**: Zod schemas on all endpoints
- **Output Encoding**: Context-aware (JSON, HTML, URL)
- **Security Headers**: Helmet.js (CSP, X-Frame-Options, etc.)

### CORS Policy
```
Allowed Origins: 
  - https://admin.ekusa.example.com
  - exp://192.168.x.x:8081 (Expo dev)
  - Capacitor/Ionic app origins

Methods: GET, POST, PATCH, DELETE, OPTIONS
Headers: Content-Type, Authorization, X-Requested-With
Credentials: true
Max-Age: 86400
```

### WebSocket Security
- Same authentication as REST (JWT in handshake)
- Per-conversation room authorization
- Message rate limiting per socket
- Automatic disconnect on token expiry

---

## Infrastructure Security

### Database
- **Encryption at Rest**: AES-256 (PostgreSQL TDE or volume encryption)
- **Encryption in Transit**: TLS 1.3 for all connections
- **Access Control**: Role-based, least privilege
- **Auditing**: pgaudit for all DML on sensitive tables
- **Backups**: Encrypted, tested monthly

### Redis
- **AUTH**: Strong password
- **TLS**: Enabled
- **Network**: Private VPC only
- **Eviction**: allkeys-lru for cache, no eviction for sessions

### Object Storage (MinIO/S3)
- **Bucket Policies**: Private by default
- **Presigned URLs**: Short expiry (15 min) for uploads/downloads
- **Content-Type Validation**: Strict allowlist
- **Size Limits**: 5MB avatars, 50MB documents
- **Virus Scanning**: ClamAV on upload (future)

### Container Security
- **Base Images**: Distroless or Alpine with minimal packages
- **Non-root User**: All containers run as non-root
- **Read-only Root FS**: Where possible
- **Capabilities**: Dropped all, only required added
- **Image Scanning**: Trivy in CI/CD

### Secrets Management
- **Development**: .env.local (gitignored)
- **Production**: External secret manager (AWS Secrets Manager, HashiCorp Vault, or Kubernetes Secrets)
- **Rotation**: Quarterly for service accounts, immediate on compromise
- **Access**: Principle of least privilege per service

---

## Kenyan Data Protection Act, 2019 Compliance

### Data Controller
**Embu Kimathi University Student Association (EKUSA)**
- Physical address: Embu, Kenya
- Contact: dpo@ekusa.ac.ke

### Lawful Basis
| Processing Activity | Lawful Basis |
|---------------------|--------------|
| Account registration | Contract (Terms of Service) |
| Membership verification | Legal obligation (EKUSA constitution) |
| Announcements | Legitimate interest (member communication) |
| Event registration | Contract |
| Welfare requests | Vital interests / Consent |
| Private messaging | Consent (explicit opt-in) |
| Analytics | Legitimate interest (anonymized) |

### Data Subject Rights Implementation
| Right | Implementation |
|-------|----------------|
| Access | `GET /users/me` + data export endpoint |
| Rectification | `PATCH /users/me` + admin correction workflow |
| Erasure | Account deletion request → 30-day grace → cascade delete |
| Portability | JSON export of all user data |
| Restriction | Account suspension flag |
| Objection | Opt-out flags for non-essential processing |
| Automated Decisions | None currently (human review for membership) |

### Data Retention Schedule
| Data Category | Retention | Disposal |
|---------------|-----------|----------|
| Account data | Account lifetime + 7 years | Secure deletion |
| Membership records | 10 years post-membership | Anonymization |
| Messages (institutional) | 7 years | Secure deletion |
| Private messages | Device only (user-controlled) | User deletes |
| Welfare records | 10 years post-resolution | Anonymization |
| Audit logs | 7 years | Secure deletion |
| Backups | 30 days daily, 12 months monthly | Encrypted deletion |

### Data Breach Notification
1. **Detection**: Automated alerts + manual reports
2. **Assessment**: DPO evaluates within 24 hours
3. **Notification to ODPC**: Within 72 hours (if risk to rights)
4. **Notification to Users**: Without undue delay (high risk)
5. **Documentation**: Breach register maintained

### Cross-Border Transfers
- **Primary**: Kenya (local data centers)
- **Backup**: EU (adequacy decision) or SCCs
- **Cloud Providers**: Only with DPA + appropriate safeguards

---

## Secure Development Lifecycle

### Code Security
- **SAST**: ESLint security rules + Semgrep in CI
- **Dependency Scanning**: npm audit + Snyk/Dependabot
- **Secrets Detection**: GitLeaks in pre-commit + CI
- **Code Review**: Mandatory for all PRs, security-focused review for auth/crypto

### Testing
- **Unit Tests**: 80%+ coverage for security-critical modules
- **Integration Tests**: Auth flows, permission checks
- **Penetration Testing**: Annual by certified firm
- **Bug Bounty**: Private program for critical vulnerabilities

### Incident Response
1. **Preparation**: Runbooks, contact tree, forensic readiness
2. **Detection**: SIEM alerts, user reports, threat intel
3. **Containment**: Network isolation, credential rotation
4. **Eradication**: Root cause removal, patching
5. **Recovery**: Verified restore, monitoring
6. **Lessons Learned**: Post-incident review within 2 weeks

---

## Compliance Checklist

- [x] Data Protection Impact Assessment (DPIA) completed
- [x] Privacy Policy published and accessible
- [x] Terms of Service with explicit consent for messaging
- [x] Data Processing Agreements with all subprocessors
- [x] Records of Processing Activities (ROPA) maintained
- [x] Data Protection Officer appointed
- [x] Staff training on data protection
- [x] Incident response plan tested
- [x] Vendor security assessments completed
- [ ] Annual compliance audit scheduled
- [ ] Certification to ISO 27001 (future)

---

## Threat Model Summary

| Threat | Likelihood | Impact | Mitigations |
|--------|------------|--------|-------------|
| Credential Stuffing | High | Medium | Rate limiting, MFA for admin, breach monitoring |
| SQL Injection | Low | High | Parameterized queries (Prisma), input validation |
| XSS | Low | Medium | CSP, output encoding, React auto-escaping |
| CSRF | Low | Medium | SameSite cookies, origin checks |
| Man-in-the-Middle | Low | High | TLS 1.3, cert pinning, HSTS |
| Key Compromise | Low | High | Hardware keystore, rotation, key change notifications |
| Insider Threat | Low | High | Audit logs, least privilege, MFA for admin |
| Data Exfiltration | Low | High | E2EE for messages, DLP on exports, access logging |
| DoS/DDoS | Medium | Medium | Rate limiting, WAF, auto-scaling |
| Supply Chain | Low | High | Dependency scanning, lockfiles, verified builds |

---

## Security Contacts

- **DPO**: dpo@ekusa.ac.ke
- **Security Team**: security@ekusa.ac.ke
- **Bug Bounty**: security@ekusa.ac.ke (PGP key on website)
- **Incident Hotline**: +254-XXX-XXXXXX (24/7 for critical)

---

*Document Version: 1.0 | Last Updated: 2024-01-15 | Classification: Internal*