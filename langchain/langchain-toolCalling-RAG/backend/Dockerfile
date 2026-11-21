# Stage 1: Build NestJS application
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy configuration and source files
COPY tsconfig*.json nest-cli.json ./
COPY src/ ./src/

# Compile TypeScript to dist
RUN npm run build

# Stage 2: Production runtime
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled files from builder
COPY --from=builder /app/dist ./dist

# Use node user for security
USER node

EXPOSE 5000

CMD ["node", "dist/main"]
