# ── Stage 1: Install dependencies ──
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn .yarn
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/validation/package.json packages/validation/
COPY apps/api/package.json apps/api/

RUN corepack enable && yarn install --immutable

# ── Stage 2: Build ──
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages ./packages

COPY tsconfig.base.json ./
COPY packages/ packages/
COPY apps/api/ apps/api/

WORKDIR /app/apps/api
RUN npx prisma generate
RUN npx nest build

# ── Stage 3: Production image ──
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nestjs

EXPOSE 3000

CMD ["node", "dist/apps/api/src/main"]

