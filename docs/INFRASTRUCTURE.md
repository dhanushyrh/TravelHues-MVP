# TravelHues MVP — Infrastructure Plan

## Table of Contents

1. [Service Overview](#service-overview)
2. [Docker Compose Setup](#docker-compose-setup)
3. [Service Ports & Networking](#service-ports--networking)
4. [Volume Management](#volume-management)
5. [Environment Variables Strategy](#environment-variables-strategy)
6. [Local Development Setup](#local-development-setup)
7. [MinIO Bucket Configuration](#minio-bucket-configuration)
8. [Nginx Configuration](#nginx-configuration)
9. [Production Deployment](#production-deployment)
10. [Backup Strategy](#backup-strategy)
11. [Monitoring & Observability](#monitoring--observability)

---

## Service Overview

| Service | Image | Role | Dev Port |
|---|---|---|---|
| `postgres` | postgres:16-alpine | Primary relational database | 5432 |
| `redis` | redis:7-alpine | Cache, queues, sessions | 6379 |
| `minio` | minio/minio:latest | S3-compatible object storage | 9000/9001 |
| `mailhog` | mailhog/mailhog:latest | Email capture (dev only) | 1025/8025 |
| `backend` | node:20-alpine (custom) | NestJS API server | 3000 |
| `creator-web` | node:20-alpine (custom) | React Vite dev server | 5173 |
| `nginx` | nginx:alpine | Reverse proxy (optional in dev) | 80/443 |

---

## Docker Compose Setup

### Base Compose File

```yaml
# docker-compose.yml — shared base definitions

version: '3.9'

x-common-env: &common-env
  NODE_ENV: ${NODE_ENV:-development}
  TZ: UTC

services:

  # ─────────────────────────────────────────────
  # PostgreSQL — Primary Database
  # ─────────────────────────────────────────────
  postgres:
    image: postgres:16-alpine
    container_name: travelhues-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-travelhues}
      POSTGRES_USER: ${POSTGRES_USER:-travelhues}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-travelhues_dev_secret}
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./infrastructure/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-travelhues} -d ${POSTGRES_DB:-travelhues}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    networks:
      - travelhues-network

  # ─────────────────────────────────────────────
  # Redis — Cache & Queue Backend
  # ─────────────────────────────────────────────
  redis:
    image: redis:7-alpine
    container_name: travelhues-redis
    restart: unless-stopped
    command: >
      redis-server
      --requirepass ${REDIS_PASSWORD:-redis_dev_secret}
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru
      --appendonly yes
      --appendfilename redis.aof
    volumes:
      - redis_data:/data
    ports:
      - "${REDIS_PORT:-6379}:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD:-redis_dev_secret}", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    networks:
      - travelhues-network

  # ─────────────────────────────────────────────
  # MinIO — S3-Compatible Object Storage
  # ─────────────────────────────────────────────
  minio:
    image: minio/minio:latest
    container_name: travelhues-minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-minioadmin_dev_secret}
      MINIO_SITE_NAME: travelhues-local
    volumes:
      - minio_data:/data
    ports:
      - "${MINIO_API_PORT:-9000}:9000"
      - "${MINIO_CONSOLE_PORT:-9001}:9001"
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 30s
      timeout: 20s
      retries: 3
    networks:
      - travelhues-network

  # ─────────────────────────────────────────────
  # MinIO Init — Creates buckets on first run
  # ─────────────────────────────────────────────
  minio-init:
    image: minio/mc:latest
    container_name: travelhues-minio-init
    depends_on:
      minio:
        condition: service_healthy
    entrypoint: >
      /bin/sh -c "
      mc alias set local http://minio:9000 ${MINIO_ROOT_USER:-minioadmin} ${MINIO_ROOT_PASSWORD:-minioadmin_dev_secret};
      mc mb --ignore-existing local/travelhues-public;
      mc mb --ignore-existing local/travelhues-media;
      mc mb --ignore-existing local/travelhues-private;
      mc mb --ignore-existing local/travelhues-uploads;
      mc anonymous set download local/travelhues-public;
      mc anonymous set download local/travelhues-media;
      echo 'MinIO buckets initialized successfully';
      "
    networks:
      - travelhues-network

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  minio_data:
    driver: local

networks:
  travelhues-network:
    driver: bridge
    name: travelhues-network
```

---

### Development Override

```yaml
# docker-compose.dev.yml — Development services (extends base)

version: '3.9'

services:

  # ─────────────────────────────────────────────
  # MailHog — Email Capture (Dev Only)
  # ─────────────────────────────────────────────
  mailhog:
    image: mailhog/mailhog:latest
    container_name: travelhues-mailhog
    restart: unless-stopped
    ports:
      - "1025:1025"    # SMTP
      - "8025:8025"    # Web UI
    networks:
      - travelhues-network

  # ─────────────────────────────────────────────
  # NestJS Backend — Hot Reload Dev Server
  # ─────────────────────────────────────────────
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    container_name: travelhues-backend
    restart: unless-stopped
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://${POSTGRES_USER:-travelhues}:${POSTGRES_PASSWORD:-travelhues_dev_secret}@postgres:5432/${POSTGRES_DB:-travelhues}
      REDIS_URL: redis://:${REDIS_PASSWORD:-redis_dev_secret}@redis:6379
      MINIO_ENDPOINT: minio
      MINIO_PORT: 9000
      MINIO_USE_SSL: false
      MINIO_ACCESS_KEY: ${MINIO_ROOT_USER:-minioadmin}
      MINIO_SECRET_KEY: ${MINIO_ROOT_PASSWORD:-minioadmin_dev_secret}
      SMTP_HOST: mailhog
      SMTP_PORT: 1025
      SMTP_SECURE: false
      JWT_SECRET: ${JWT_SECRET:-dev_jwt_secret_change_in_prod}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET:-dev_refresh_secret_change_in_prod}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
      STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET}
      APP_URL: http://localhost:3000
      STORAGE_PROVIDER: minio
      BUCKET_PUBLIC: travelhues-public
      BUCKET_MEDIA: travelhues-media
      BUCKET_PRIVATE: travelhues-private
      BUCKET_UPLOADS: travelhues-uploads
      MINIO_PUBLIC_URL: http://localhost:9000
    volumes:
      - ./backend/src:/app/src:cached        # Mount src for hot reload
      - ./backend/package.json:/app/package.json:ro
      - backend_node_modules:/app/node_modules
    ports:
      - "3000:3000"
      - "9229:9229"    # Node.js debugger
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      minio-init:
        condition: service_completed_successfully
    command: npm run start:dev
    networks:
      - travelhues-network

  # ─────────────────────────────────────────────
  # Creator Web — Vite HMR Dev Server
  # ─────────────────────────────────────────────
  creator-web:
    build:
      context: ./creator-web
      dockerfile: Dockerfile.dev
    container_name: travelhues-creator-web
    restart: unless-stopped
    environment:
      VITE_API_BASE_URL: http://localhost:3000/api/v1
      VITE_STRIPE_PUBLISHABLE_KEY: ${STRIPE_PUBLISHABLE_KEY}
    volumes:
      - ./creator-web/src:/app/src:cached
      - ./creator-web/public:/app/public:cached
      - creator_web_node_modules:/app/node_modules
    ports:
      - "5173:5173"
    command: npm run dev -- --host 0.0.0.0
    networks:
      - travelhues-network

volumes:
  backend_node_modules:
  creator_web_node_modules:
```

---

### Production Compose

```yaml
# docker-compose.prod.yml

version: '3.9'

services:

  # ─────────────────────────────────────────────
  # Nginx — Reverse Proxy with TLS
  # ─────────────────────────────────────────────
  nginx:
    image: nginx:alpine
    container_name: travelhues-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infrastructure/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./infrastructure/nginx/conf.d:/etc/nginx/conf.d:ro
      - certbot_certs:/etc/letsencrypt:ro
      - ./creator-web/dist:/var/www/creator-app:ro
    depends_on:
      - backend
    networks:
      - travelhues-network

  # ─────────────────────────────────────────────
  # NestJS Backend — Production Build
  # ─────────────────────────────────────────────
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: production
    container_name: travelhues-backend
    restart: always
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}          # Managed DB external URL
      REDIS_URL: ${REDIS_URL}                # Managed Redis external URL
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
      STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET}
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
      AWS_REGION: ${AWS_REGION:-us-east-1}
      STORAGE_PROVIDER: s3
      BUCKET_PUBLIC: ${S3_BUCKET_PUBLIC}
      BUCKET_MEDIA: ${S3_BUCKET_MEDIA}
      BUCKET_PRIVATE: ${S3_BUCKET_PRIVATE}
      SENDGRID_API_KEY: ${SENDGRID_API_KEY}
      APP_URL: ${APP_URL}
      SENTRY_DSN: ${SENTRY_DSN}
    deploy:
      replicas: 2
      restart_policy:
        condition: on-failure
        max_attempts: 3
    networks:
      - travelhues-network

  # Certbot for Let's Encrypt certificate renewal
  certbot:
    image: certbot/certbot
    volumes:
      - certbot_certs:/etc/letsencrypt
      - certbot_webroot:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"

volumes:
  certbot_certs:
  certbot_webroot:
```

---

### Dockerfiles

#### Backend Dockerfile

```dockerfile
# backend/Dockerfile

# ─── Development Stage ───────────────────────────────────────────────────────
FROM node:20-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000 9229
CMD ["npm", "run", "start:dev"]

# ─── Build Stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# ─── Production Stage ────────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/main.js"]
```

#### Backend Dockerfile.dev

```dockerfile
# backend/Dockerfile.dev

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache python3 make g++ # For native modules

COPY package*.json ./
RUN npm ci

# Source mounted as volume at runtime
EXPOSE 3000 9229
```

#### Creator Web Dockerfile

```dockerfile
# creator-web/Dockerfile

# ─── Build Stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

ARG VITE_API_BASE_URL
ARG VITE_STRIPE_PUBLISHABLE_KEY

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ─── Production Stage (served by Nginx) ──────────────────────────────────────
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## Service Ports & Networking

### Development Port Map

| Service | Container Port | Host Port | Access URL |
|---|---|---|---|
| PostgreSQL | 5432 | 5432 | `postgresql://travelhues:***@localhost:5432/travelhues` |
| Redis | 6379 | 6379 | `redis://:***@localhost:6379` |
| MinIO API | 9000 | 9000 | `http://localhost:9000` |
| MinIO Console | 9001 | 9001 | `http://localhost:9001` |
| MailHog SMTP | 1025 | 1025 | `smtp://localhost:1025` |
| MailHog Web UI | 8025 | 8025 | `http://localhost:8025` |
| NestJS Backend | 3000 | 3000 | `http://localhost:3000` |
| Node.js Debugger | 9229 | 9229 | `ws://localhost:9229` |
| Creator Web | 5173 | 5173 | `http://localhost:5173` |
| Nginx (optional) | 80/443 | 80/443 | `http://localhost` |

### Internal Docker Network

All containers communicate over `travelhues-network` bridge network using service names as hostnames:

```
backend → postgres:5432
backend → redis:6379
backend → minio:9000
backend → mailhog:1025
creator-web → (backend via host or nginx proxy)
```

**Important:** Internal container communication never uses `localhost` — always service name.

---

## Volume Management

### Volume Definitions

| Volume | Purpose | Size Estimate | Backup Required |
|---|---|---|---|
| `postgres_data` | PostgreSQL data directory | Grows with data | YES — critical |
| `redis_data` | Redis RDB + AOF persistence | Small (< 1 GB) | Nice-to-have |
| `minio_data` | All uploaded files | Can be large (tens of GB) | YES — user content |
| `backend_node_modules` | Node.js dependencies (dev only) | ~500 MB | NO — reproducible |
| `creator_web_node_modules` | Node.js dependencies (dev only) | ~300 MB | NO — reproducible |

### Clearing Volumes (Development Reset)

```bash
# Stop everything and remove volumes (DESTRUCTIVE — use with caution)
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v

# Remove only the database volume (re-runs migrations on next start)
docker volume rm travelhues-mvp_postgres_data

# Remove only MinIO storage
docker volume rm travelhues-mvp_minio_data
```

### Inspecting Volumes

```bash
# Check disk usage of all volumes
docker system df -v

# Inspect a specific volume
docker volume inspect travelhues-mvp_postgres_data
```

---

## Environment Variables Strategy

### File Structure

```
/
├── .env                  # Shared defaults (committed, no secrets)
├── .env.local            # Local overrides (NOT committed, in .gitignore)
├── .env.development      # Dev-specific vars (committed, no secrets)
├── .env.staging          # Staging vars (NOT committed — use CI/CD secrets)
├── .env.production       # Production vars (NOT committed — use CI/CD secrets)
└── .env.example          # Template with all required vars (committed)
```

### `.env.example` — Complete Variable Reference

```bash
# ─── App ──────────────────────────────────────────────────────────────────────
APP_ENV=development
APP_URL=http://localhost:3000
APP_PORT=3000

# ─── Database ─────────────────────────────────────────────────────────────────
POSTGRES_DB=travelhues
POSTGRES_USER=travelhues
POSTGRES_PASSWORD=CHANGE_ME_IN_PRODUCTION
POSTGRES_PORT=5432
# OR use full connection string (production)
DATABASE_URL=

# ─── Redis ────────────────────────────────────────────────────────────────────
REDIS_PASSWORD=CHANGE_ME_IN_PRODUCTION
REDIS_PORT=6379
# OR full URL (production)
REDIS_URL=

# ─── JWT ──────────────────────────────────────────────────────────────────────
# Generate with: openssl rand -base64 64
JWT_SECRET=CHANGE_ME_TO_RANDOM_64_CHAR_STRING
JWT_REFRESH_SECRET=CHANGE_ME_TO_DIFFERENT_RANDOM_64_CHAR_STRING
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d

# ─── MinIO / S3 ───────────────────────────────────────────────────────────────
STORAGE_PROVIDER=minio   # or 's3' in production
# MinIO (development)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=CHANGE_ME_IN_PRODUCTION
MINIO_PUBLIC_URL=http://localhost:9000
# S3 (production)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
# Bucket names
BUCKET_PUBLIC=travelhues-public
BUCKET_MEDIA=travelhues-media
BUCKET_PRIVATE=travelhues-private
BUCKET_UPLOADS=travelhues-uploads

# ─── Stripe ───────────────────────────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_test_CHANGE_ME
STRIPE_PUBLISHABLE_KEY=pk_test_CHANGE_ME
STRIPE_WEBHOOK_SECRET=whsec_CHANGE_ME
STRIPE_PLATFORM_FEE_BASIC=10        # Percentage
STRIPE_PLATFORM_FEE_PRO=7
STRIPE_PLATFORM_FEE_PREMIUM=5

# ─── Email ────────────────────────────────────────────────────────────────────
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=noreply@travelhues.com
EMAIL_FROM_NAME=TravelHues
# Production SendGrid
SENDGRID_API_KEY=

# ─── OAuth ────────────────────────────────────────────────────────────────────
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
APPLE_TEAM_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=

# ─── Creator Web ──────────────────────────────────────────────────────────────
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_CHANGE_ME

# ─── Monitoring (production) ──────────────────────────────────────────────────
SENTRY_DSN=
DATADOG_API_KEY=
```

### Secret Management

**Development:** Secrets in `.env.local` (gitignored). Team members copy `.env.example` to `.env.local` and fill in dev values.

**CI/CD (Staging/Production):** Secrets stored in:
- **Railway:** Environment variable management in Railway dashboard
- **Render:** Environment Groups in Render dashboard
- **AWS:** AWS Secrets Manager + Parameter Store
- **GitHub Actions:** Repository or Environment Secrets for CI

**Never commit:**
- `.env.local`
- `.env.staging`
- `.env.production`
- Any file containing real API keys, passwords, or tokens

---

## Local Development Setup

### Prerequisites

```bash
# Required tools
docker --version          # Docker 24+
docker compose version    # Docker Compose v2.x
node --version            # Node.js 20+
npm --version             # npm 10+
git --version

# Optional but recommended
stripe --version          # Stripe CLI for webhook forwarding
```

### First-Time Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-org/travelhues-mvp.git
cd travelhues-mvp

# 2. Copy environment file and fill in your values
cp .env.example .env.local
# Edit .env.local with your Stripe test keys and secrets

# 3. Install dependencies for all workspaces
npm install                   # If using npm workspaces
# OR
cd backend && npm install && cd ..
cd creator-web && npm install && cd ..

# 4. Start infrastructure services (DB, Redis, MinIO, MailHog)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres redis minio minio-init mailhog

# 5. Wait for health checks to pass
docker compose ps

# 6. Run database migrations
cd backend
npm run migration:run

# 7. Seed development data
npm run seed:dev

# 8. Start the backend (hot reload)
npm run start:dev
# Backend available at http://localhost:3000

# 9. In another terminal, start the creator web app
cd creator-web
npm run dev
# Web app available at http://localhost:5173

# 10. Set up Stripe webhook forwarding (in another terminal)
stripe listen --forward-to http://localhost:3000/api/v1/payments/webhooks/stripe
# Copy the webhook signing secret and set STRIPE_WEBHOOK_SECRET in .env.local
```

### Daily Development Workflow

```bash
# Start all services at once (run in background)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# View logs for specific service
docker compose logs -f backend
docker compose logs -f postgres

# Stop all services (keeps volumes)
docker compose down

# Reset database (drop + re-migrate + re-seed)
npm run db:reset --prefix backend

# Generate a new migration after changing an entity
npm run migration:generate --prefix backend -- -n AddNewField

# Run pending migrations
npm run migration:run --prefix backend
```

### Useful Development URLs

| URL | Service |
|---|---|
| `http://localhost:3000/api/v1` | NestJS API root |
| `http://localhost:3000/api/docs` | Swagger UI (dev only) |
| `http://localhost:3000/health` | Health check |
| `http://localhost:5173` | Creator web app |
| `http://localhost:8025` | MailHog — catch all emails |
| `http://localhost:9001` | MinIO Console (admin: minioadmin) |

### NPM Scripts Reference

```json
// backend/package.json
{
  "scripts": {
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "build": "nest build",
    "start:prod": "node dist/main",
    "migration:generate": "typeorm migration:generate -d src/database/data-source.ts",
    "migration:run": "typeorm migration:run -d src/database/data-source.ts",
    "migration:revert": "typeorm migration:revert -d src/database/data-source.ts",
    "migration:show": "typeorm migration:show -d src/database/data-source.ts",
    "seed:dev": "ts-node src/database/seeds/dev.seed.ts",
    "db:reset": "npm run migration:revert && npm run migration:run && npm run seed:dev",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\"",
    "format": "prettier --write \"src/**/*.ts\""
  }
}
```

---

## MinIO Bucket Configuration

### Bucket Policies

```json
// Public read policy for travelhues-public and travelhues-media
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::travelhues-public/*",
                   "arn:aws:s3:::travelhues-media/*"]
    }
  ]
}
```

```json
// Private policy for travelhues-private (no public access)
{
  "Version": "2012-10-17",
  "Statement": []
}
// Access only via presigned URLs generated by backend
```

### CORS Configuration (for direct browser uploads)

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "POST"],
    "AllowedOrigins": [
      "http://localhost:5173",
      "https://app.travelhues.com"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### Storage Key Naming Convention

```
{bucket}/{purpose}/{userId_or_creatorId}/{uuid}.{ext}

travelhues-public/
  ├── avatars/{userId}/{uuid}.webp
  ├── storefronts/{creatorId}/logo-{uuid}.webp
  ├── storefronts/{creatorId}/banner-{uuid}.webp
  └── tags/{tagSlug}-{uuid}.webp

travelhues-media/
  └── portfolio/{creatorId}/{portfolioId}/{uuid}.jpg
  └── portfolio/{creatorId}/{portfolioId}/{uuid}.mp4

travelhues-private/
  └── products/{creatorId}/{productId}/{uuid}.pdf
  └── products/{creatorId}/{productId}/{uuid}.zip

travelhues-uploads/
  └── temp/{userId}/{uuid}.{ext}   ← cleaned up after confirm/24h TTL
```

---

## Nginx Configuration

### Development (Optional)

In development, Nginx is optional. Most developers access services directly on their ports. Nginx is included for testing production-like routing locally.

```nginx
# infrastructure/nginx/conf.d/dev.conf

server {
    listen 80;
    server_name localhost;

    # API
    location /api/ {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        client_max_body_size 600M;
    }

    # Creator web app
    location / {
        proxy_pass http://creator-web:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";  # WebSocket for Vite HMR
    }
}
```

### Production Configuration

```nginx
# infrastructure/nginx/conf.d/production.conf

# Redirect HTTP → HTTPS
server {
    listen 80;
    server_name travelhues.com app.travelhues.com api.travelhues.com;
    return 301 https://$host$request_uri;
}

# API subdomain
server {
    listen 443 ssl http2;
    server_name api.travelhues.com;

    ssl_certificate /etc/letsencrypt/live/travelhues.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/travelhues.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy strict-origin-when-cross-origin;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    # Stripe webhook — no rate limiting, raw body required
    location = /api/v1/payments/webhooks/stripe {
        proxy_pass http://backend:3000;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_read_timeout 30s;
    }

    # Rate limiting for auth endpoints
    location /api/v1/auth/ {
        limit_req zone=auth_zone burst=5 nodelay;
        proxy_pass http://backend:3000;
        include /etc/nginx/conf.d/proxy_params.conf;
    }

    # General API
    location /api/ {
        limit_req zone=api_zone burst=50 nodelay;
        proxy_pass http://backend:3000;
        include /etc/nginx/conf.d/proxy_params.conf;
        client_max_body_size 600M;
        proxy_read_timeout 120s;
    }
}

# Creator web app
server {
    listen 443 ssl http2;
    server_name app.travelhues.com;

    ssl_certificate /etc/letsencrypt/live/travelhues.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/travelhues.com/privkey.pem;

    root /var/www/creator-app;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    gzip_min_length 1000;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|webp|svg|ico|woff2|woff|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }
}

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=auth_zone:10m rate=2r/m;
limit_req_zone $binary_remote_addr zone=api_zone:20m rate=60r/m;
```

```nginx
# infrastructure/nginx/conf.d/proxy_params.conf

proxy_http_version 1.1;
proxy_set_header Connection "";
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_buffering off;
proxy_cache off;
```

---

## Production Deployment

### Recommended Platforms for MVP

#### Option A: Railway (Recommended for MVP)

Railway supports Docker Compose deployments and managed Postgres + Redis.

**Services to deploy on Railway:**
1. **PostgreSQL** — Railway Postgres plugin (managed, automatic backups)
2. **Redis** — Railway Redis plugin (managed)
3. **Backend** — Docker container from `backend/Dockerfile`
4. **Creator Web** — Docker container (static files served by Nginx inside container)
5. **MinIO** → **Replace with AWS S3** (Railway doesn't have S3-compatible storage)

**Deployment steps:**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# Deploy backend
railway up --service backend

# Set environment variables
railway vars set DATABASE_URL=postgresql://... STRIPE_SECRET_KEY=sk_live_...
```

#### Option B: Render

Similar to Railway. Use Render's managed PostgreSQL and Redis.

**Backend:** Web Service → Docker deployment  
**Creator Web:** Static Site → build from `creator-web/` with `npm run build`  
**Database:** Render Postgres (managed)  
**Redis:** Render Redis (managed)

#### Option C: AWS (Scalable Future Path)

For scale beyond Railway/Render:

| AWS Service | Replaces |
|---|---|
| RDS for PostgreSQL | Docker postgres |
| ElastiCache for Redis | Docker redis |
| S3 + CloudFront | MinIO |
| ECS Fargate | Docker containers |
| ALB (Application Load Balancer) | Nginx |
| SES | MailHog / SendGrid |
| ECR | Docker Hub / local registry |
| CloudWatch | Local logs |

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml

name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: cd backend && npm ci
      - run: cd backend && npm run lint
      - run: cd backend && npm run test

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Railway
        uses: railwayapp/railway-deploy@v3
        with:
          service: backend
          token: ${{ secrets.RAILWAY_TOKEN }}

  deploy-creator-web:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd creator-web && npm ci
      - run: cd creator-web && npm run build
        env:
          VITE_API_BASE_URL: ${{ vars.VITE_API_BASE_URL }}
          VITE_STRIPE_PUBLISHABLE_KEY: ${{ secrets.VITE_STRIPE_PUBLISHABLE_KEY }}
      # Deploy to Render static site / Railway
      - name: Deploy to Railway
        uses: railwayapp/railway-deploy@v3
        with:
          service: creator-web
          token: ${{ secrets.RAILWAY_TOKEN }}

  run-migrations:
    needs: deploy-backend
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cd backend && npm ci
      - run: npm run migration:run --prefix backend
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Production Pre-Deployment Checklist

```
Infrastructure:
  [ ] Managed PostgreSQL provisioned and URL saved to secrets
  [ ] Managed Redis provisioned and URL saved to secrets
  [ ] S3 buckets created (public, media, private, uploads) with correct policies
  [ ] CloudFront distribution in front of public/media S3 buckets
  [ ] Stripe webhook endpoint registered for production domain
  [ ] SSL certificates issued (Let's Encrypt or ACM)
  [ ] DNS records pointing to deployment (A record for API + app subdomains)

Environment Variables:
  [ ] JWT_SECRET and JWT_REFRESH_SECRET generated (openssl rand -base64 64)
  [ ] STRIPE_SECRET_KEY set to live key (sk_live_...)
  [ ] STRIPE_WEBHOOK_SECRET set from Stripe dashboard webhook endpoint
  [ ] SENDGRID_API_KEY configured and from-address verified
  [ ] GOOGLE_CLIENT_ID / APPLE_TEAM_ID for OAuth

Application:
  [ ] TypeORM synchronize: false in production config
  [ ] All migrations run on production DB before first deploy
  [ ] Seed subscription plans to DB (npm run seed:plans:prod)
  [ ] Health check endpoints responding
  [ ] Sentry DSN configured for error tracking
  [ ] Rate limiting values adjusted for production traffic expectations
```

---

## Backup Strategy

### PostgreSQL Backups

**Development:** Not required (local only)

**Production:**

```bash
# Automated daily backup via cron job or Railway's built-in backup
# Manual backup script:

#!/bin/bash
# scripts/backup-postgres.sh

BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="travelhues_${DATE}.sql.gz"

mkdir -p $BACKUP_DIR

pg_dump $DATABASE_URL | gzip > "${BACKUP_DIR}/${FILENAME}"

# Upload to S3 backup bucket
aws s3 cp "${BACKUP_DIR}/${FILENAME}" "s3://travelhues-backups/postgres/${FILENAME}"

# Keep only last 30 days locally
find $BACKUP_DIR -mtime +30 -delete

echo "Backup complete: ${FILENAME}"
```

**Retention Policy:**
| Backup Type | Frequency | Retention |
|---|---|---|
| Daily snapshot | Every 24 hours | 30 days |
| Weekly snapshot | Every Sunday | 3 months |
| Monthly snapshot | 1st of month | 1 year |
| Pre-deployment | Before every production deploy | 14 days |

### S3/MinIO Backups

**Production (AWS S3):**
- Enable S3 Versioning on `travelhues-private` bucket (product files)
- Enable S3 Cross-Region Replication to backup region bucket
- S3 Object Expiration rules for `travelhues-uploads` (24-hour auto-delete)

**MinIO (Development):** Volume is ephemeral — don't store anything in dev MinIO you can't re-upload.

### Restore Procedures

```bash
# Restore PostgreSQL from backup
gunzip -c backup_file.sql.gz | psql $DATABASE_URL

# Verify restore
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM orders;"
```

---

## Monitoring & Observability

### Health Check Endpoints

```typescript
// GET /health  → { status: 'ok', timestamp: '...' }
// GET /health/db → { status: 'ok', latency: 2 }
// GET /health/redis → { status: 'ok', latency: 1 }
// GET /health/storage → { status: 'ok', provider: 'minio' }
```

**Implementation:** `@nestjs/terminus` with TypeORM, Redis, and HTTP indicators.

### Logging Strategy

**Development:** Console output with colors (Winston `console` transport)

**Production:** Structured JSON logs (Winston `json` format) written to stdout, ingested by platform log aggregator (Railway Logs / Datadog / CloudWatch).

```typescript
// Log format
{
  "timestamp": "2026-05-21T10:30:00.000Z",
  "level": "info",
  "message": "POST /api/v1/orders 201 45ms",
  "requestId": "req-uuid",
  "userId": "user-uuid",
  "method": "POST",
  "path": "/api/v1/orders",
  "statusCode": 201,
  "duration": 45
}
```

**Log Levels:**
| Level | When |
|---|---|
| `error` | Unhandled exceptions, 5xx responses, critical failures |
| `warn` | Degraded functionality, rate limit hits, slow queries |
| `info` | All HTTP requests, job completions, webhook events |
| `debug` | SQL queries (dev only), cache hit/miss |

### Error Tracking (Sentry)

```bash
npm install @sentry/node @sentry/nestjs
```

Configure in `main.ts` before any module initialization. Captures:
- Unhandled exceptions
- Slow transactions (> 1s)
- Custom events (failed payments, etc.)

### Key Metrics to Track

| Metric | Alert Threshold |
|---|---|
| API p95 latency | > 500ms |
| API error rate (5xx) | > 1% |
| PostgreSQL connection pool usage | > 80% |
| Redis memory usage | > 200MB |
| Queue job failure rate | > 5% |
| Disk usage (MinIO/S3) | > 80% |
| Stripe webhook processing failures | > 0 (alert immediately) |
