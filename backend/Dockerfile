# ── Stage 1: Builder ──────────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies first (layer caching)
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# ── Stage 2: Production ───────────────────────────────────────────
FROM node:18-alpine AS production

# Install Docker CLI for sandbox execution
RUN apk add --no-cache docker-cli

WORKDIR /app

# Copy only production dependencies and built app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./package.json

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "src/server.js"]
