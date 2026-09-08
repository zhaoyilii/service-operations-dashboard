# Service Operations Dashboard

A small full-stack application for tracking service health and operational incidents. It is designed as a portfolio project that is compact enough to explain end-to-end while still demonstrating a production-shaped TypeScript workflow.

## What it includes

- Service and incident CRUD with linked records
- Search, status/severity filters, and server-side pagination
- Dashboard summary and responsive tables/forms
- Shared Zod validation for browser and API contracts
- Fastify REST/JSON API with memory and PostgreSQL stores
- SvelteKit frontend styled with Tailwind CSS
- Vitest unit/API tests and Playwright desktop/mobile smoke tests
- pnpm workspace, Docker Compose, database migration, and GitHub Actions CI

## Quick start

Requirements: Node.js 22+ and pnpm 10+.

```bash
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173). The API runs at `http://localhost:3001` and uses seeded in-memory data by default.

## PostgreSQL mode

```bash
docker compose up -d postgres
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/service_ops
pnpm db:migrate
pnpm dev
```

The schema is in `apps/api/sql/001_init.sql`. PostgreSQL starts empty so that CRUD behavior is easy to verify; seed data is supplied only by the in-memory demo store.

## Verification

```bash
pnpm check
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

## API map

| Method | Route | Purpose |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/summary` | Dashboard counters |
| GET/POST | `/api/services` | Paginated list/create |
| GET/PUT/DELETE | `/api/services/:id` | Read/update/delete |
| GET/POST | `/api/incidents` | Paginated list/create |
| GET/PUT/DELETE | `/api/incidents/:id` | Read/update/delete |

List routes accept `search`, `page`, and `pageSize`. Services also accept `status`; incidents accept `status`, `severity`, and `serviceId`.

## Design notes

The in-memory store makes the project immediately demoable and resets on restart. `PostgresStore` implements the same interface with parameterized SQL, so switching persistence does not affect route or UI code. A service with linked incidents returns HTTP 409 on deletion, preserving referential integrity rather than silently deleting incident history.
