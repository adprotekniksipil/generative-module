# ─── Stage 1: Dependencies ────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

# Install native build tools for better-sqlite3
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json* ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

RUN npm ci

# ─── Stage 2: Build ──────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Limit memory for build — VPS 1GB harus build di lokal/CI, bukan di VPS
ENV NODE_OPTIONS="--max-old-space-size=768"
ENV NEXT_TELEMETRY_DISABLED=1

RUN npx prisma generate
RUN npm run build

# ─── Stage 3: Production (minimal image) ─────────────────
FROM node:22-alpine AS runner
WORKDIR /app

# Runtime deps only
RUN apk add --no-cache libstdc++

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy ONLY standalone build (minimal footprint ~60MB vs ~200MB full)
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=builder /app/lib/generated ./lib/generated

# SQLite data directory
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/app/data/prod.db"

# Limit runtime memory — hemat untuk VPS 1GB
ENV NODE_OPTIONS="--max-old-space-size=384"

CMD ["node", "server.js"]
