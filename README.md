# VAPETIVE

The UAE's #1 vape shop for instant online delivery — a full-stack Next.js 16
(App Router) ecommerce: authentic disposable vapes, pod systems and e-liquids
with transparent AED pricing, age-verified UAE-wide delivery and COD / card-on-
delivery checkout.

## Stack

- **Next.js 16 + TypeScript (strict)** — App Router, RSC-first, route handlers under `/api/v1`
- **SQLite data layer** — D1-shaped schema (`migrations/`), runtime-adaptive driver (`node:sqlite` under Node, `bun:sqlite` under Bun, Cloudflare D1 via binding injection on Workers). Repos live in `src/server/repos/*`
- **Auth & RBAC** — PBKDF2 (50k, tuned for Cloudflare Workers' CPU budget) password hashing, opaque signed session cookies, permission slugs enforced on every admin API route
- **Commerce core** — server-authoritative cart/pricing/inventory, idempotent checkout (Idempotency-Key), conditional-UPDATE stock reservation, coupons, audited order state machine (COD settles on delivery)
- **Tailwind CSS 4 + shadcn/ui + framer-motion** — dark violet theme, motion with reduced-motion support
- **Background work** — job outbox (`job_queue`) with email delivery via Resend when configured, maintenance sweep for expired sessions/tokens/carts

## Getting started

```bash
bun install
bun run db:seed          # idempotent seed (catalog, users, orders, coupons)
bun run dev              # http://localhost:3000
```

Seed admin: `admin@vapetive.example / Admin#Vapetive2025` (change before any
shared deployment — see `.env.example` for `ADMIN_EMAIL`/`ADMIN_PASSWORD`).

## Scripts

| Command | Purpose |
| --- | --- |
| `bun run dev` | Dev server on :3000 |
| `bun run lint` | ESLint |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run db:seed` | Idempotent seed |
| `bun run db:seed:reset` | Drop the local DB and re-seed |

## Deployment

The runtime schema and repository layer are Cloudflare-portable by design:
the same SQL runs on D1 through the binding injection point
(`src/server/db/client.ts`), media uploads switch to the R2 binding, and the
job queue is designed for Cloudflare Queues (binding commented until consumers ship; currently drained by the in-process sweep + waitUntil). See
`docs/BACKEND-ARCHITECTURE.md` (§16 deploy wiring, §17 rollout) and
`docs/CLOUDFLARE-DEPLOYMENT.md`. Pre-launch environment checklist:
`docs/QA-AUDIT.md` ("Deployment readiness").
