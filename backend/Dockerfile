# 🐳 Vision SaaS Backend - Production Dockerfile
FROM node:24-alpine AS builder

WORKDIR /app

# Install build dependencies (for native modules if any)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Final stage
FROM node:24-alpine

WORKDIR /app

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Copy source code
COPY . .

# Environment defaults
ENV NODE_ENV=production
ENV PORT=5001

# Expose port
EXPOSE 5001

# Start the application
CMD ["node", "src/server.js"]
