# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies fresh
RUN npm ci

# Generate Prisma client for Linux
RUN npx prisma generate

# Copy source files
COPY . .

# Build frontend
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy Prisma files and generate client for this platform
COPY prisma ./prisma/
RUN npx prisma generate

# Copy built frontend from builder
COPY --from=builder /app/dist ./dist

# Copy server files
COPY server ./server
COPY tsconfig.json ./

# Install tsx for running TypeScript
RUN npm install tsx

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Start server
CMD ["npx", "tsx", "server/index.ts"]
