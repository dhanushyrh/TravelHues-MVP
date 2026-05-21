# TravelHues MVP

> Travel content & commerce platform — Instagram meets Airbnb meets Pinterest, built for authentic travel creators and explorers.

## What is TravelHues?

**Creators** upload travel reels, photos, and tips organised by country. They list products — itineraries, activities, stays, visa help, packages — and offer bookable services through their storefront.

**Users** discover country-level travel content, save what they love, plan personal trips, invite travel partners, and book directly from creators.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        TRAVELHUES MVP                           │
├────────────────┬───────────────────┬────────────────────────────┤
│  Mobile App    │   Creator Web     │       Backend API          │
│  React Native  │   React + Vite    │       NestJS               │
│  Expo          │   Tailwind +      │       PostgreSQL            │
│                │   shadcn/ui       │       Redis + BullMQ       │
│  iOS & Android │   Creator tools,  │       MinIO (S3)           │
│  Discovery     │   Analytics,      │       Stripe (INR)         │
│  Trip planner  │   Storefront mgmt │       Socket.io            │
└────────────────┴───────────────────┴────────────────────────────┘
         │                │                       │
         └────────────────┴───────────────────────┘
                          │ REST API + WebSocket
                    ┌─────┴──────┐
                    │  Postgres  │  Redis  │  MinIO  │
                    └────────────┘
```

---

## Quick Start (Local Dev with Docker)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) ≥ 4.x
- [Node.js](https://nodejs.org/) ≥ 20 (for local development outside Docker)

### 1. Clone and configure

```bash
git clone https://github.com/dhanushyrh/travelhues-mvp.git
cd TravelHues-MVP
cp backend/.env.example backend/.env
```

### 2. Start all services

```bash
docker compose up -d
```

### 3. Check everything is running

```bash
docker compose ps
```

---

## Service URLs

| Service | URL | Credentials |
|---|---|---|
| **Backend API** | http://localhost:3000/api/v1 | — |
| **Swagger Docs** | http://localhost:3000/api | — |
| **Adminer (DB GUI)** | http://localhost:8080 | user: `travelhues` / pass: `travelhues_secret` |
| **MinIO Console** | http://localhost:9001 | user: `minioadmin` / pass: `minioadmin123` |
| **MailHog (Dev Email)** | http://localhost:8025 | — |
| **Redis** | localhost:6379 | — |
| **PostgreSQL** | localhost:5432 | db: `travelhues_db` |

---

## Project Structure

```
TravelHues-MVP/
├── backend/                    # NestJS API
│   ├── src/
│   │   ├── common/             # Guards, decorators, interceptors, filters
│   │   ├── config/             # Config factory, DB config, Joi validation
│   │   ├── database/
│   │   │   └── entities/       # 28 TypeORM entities
│   │   └── modules/
│   │       ├── auth/           # JWT + Google OAuth + refresh tokens
│   │       ├── users/
│   │       ├── creators/
│   │       ├── destinations/   # Countries, cities, regions
│   │       ├── content/        # Reels & photos (with likes, comments)
│   │       ├── tips/           # Creator travel tips
│   │       ├── products/       # Activities, Stays, Itineraries, Packages, Visa
│   │       ├── trips/          # User trip planning + collaboration
│   │       ├── orders/         # Product orders
│   │       ├── payments/       # Stripe webhook handler
│   │       ├── subscriptions/  # Creator tiers + user plans
│   │       ├── media/          # File upload → MinIO/S3
│   │       ├── notifications/
│   │       └── reviews/
│   ├── Dockerfile
│   └── package.json            # BullMQ, Stripe, TypeORM, Passport, etc.
├── docs/
│   ├── entities.json           # All entities with CreateDto/UpdateDto/ResponseDto
│   ├── ARCHITECTURE.md
│   ├── BACKEND_PLAN.md
│   ├── MOBILE_APP_PLAN.md      # React Native + Expo screen map
│   ├── CREATOR_WEB_APP_PLAN.md # Tailwind + shadcn/ui dashboard
│   ├── ADDITIONAL_ENTITIES.md  # Service, Booking, Conversation, Message
│   ├── INFRASTRUCTURE.md
│   └── API_DESIGN.md
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Backend Tech Stack

| Concern | Technology |
|---|---|
| Framework | NestJS 10 + TypeScript |
| ORM | TypeORM + PostgreSQL 16 |
| Auth | JWT (access 15m + refresh 7d) + Google OAuth |
| Job Queues | BullMQ + Redis 7 |
| File Storage | MinIO (dev) / AWS S3 (prod) |
| Payments | Stripe (INR) |
| Validation | class-validator + class-transformer |
| API Docs | Swagger / OpenAPI |
| Email (dev) | MailHog |

---

## Development Workflow

```bash
# View logs
docker compose logs -f backend

# Run migrations
docker compose exec backend npm run migration:run

# Generate a migration
docker compose exec backend npm run migration:generate --name=AddCreatorTier

# Restart just the backend after code changes
docker compose restart backend

# Stop everything
docker compose down

# Reset database (destructive)
docker compose down -v
```

---

## Roadmap

See `docs/BACKEND_PLAN.md` for the phased development plan:

- **Phase 1** — Auth, Users, Creators, Destinations
- **Phase 2** — Content (reels/photos), Tips
- **Phase 3** — Products, Orders, Payments (Stripe)
- **Phase 4** — Trip planner + collaboration
- **Phase 5** — Subscriptions, Services, Bookings
- **Phase 6** — Messaging (Socket.io), Notifications
- **Phase 7** — Analytics, Search, Mobile polish

---

## Mobile App

React Native + Expo. See `docs/MOBILE_APP_PLAN.md`.

## Creator Web App

React + Vite + Tailwind + shadcn/ui. See `docs/CREATOR_WEB_APP_PLAN.md`.
