# scripts/ — operational tooling

Everything here is **developer/operator tooling** that runs under the Bun CLI
(or shell) OUTSIDE the Next.js app — it is never bundled into the site, never
served, and never imported by `src/` at runtime. This separation is
deliberate: app code (`src/`) must not carry one-off maintenance jobs, and
seed/migration tooling must not ship to the edge worker. The only allowed
dependency direction is `scripts/* → src/server/*` (shared repos, ids, money,
password) — never the reverse, with one exception: `src/data/*` mock content
is seed-only input and must not be imported by runtime code either.

| File | Purpose | npm script |
| --- | --- | --- |
| `seed.ts` | One-time idempotent import of the typed mock catalog/content (`src/data/*`) into the local SQLite DB. Idempotent re-run; `--reset` drops the DB first. | `db:seed`, `db:seed:reset` |
| `export-d1-seed.ts` | Turns the seeded local DB into Cloudflare deploy artifacts: `scripts/seed-d1.sql` + `scripts/seed-kv/*.json` (gitignored — they embed content + the admin password hash). | `db:seed:export` |
| `kv-remote.ts` | Applies `scripts/seed-kv/*.json` to the Workers KV `SETTINGS` binding. | `db:seed:kv:remote` |
| `admin-password.ts` | Verify / reset the production admin password hash. `verify` reads the remote hash from stdin (wrangler JSON) or `--hash`; `set` writes `db/set-admin-password.sql` for one surgical remote UPDATE. Mirrors `src/server/password.ts` exactly. | `admin:password:verify`, `admin:password:set`, `admin:password:set:remote` |
| `smoke-keying.ts` | Luminance-keys the `smoke-src/*.png` plates into the transparent smoke overlays in `public/smoke/` (runtime assets for the atmosphere engine). | `assets:smoke` |
| `generate-images.sh` | One-shot z-ai CLI generator for the proprietary `public/products/*`, `public/brand/*` and `og-image.jpg` assets (skip-if-exists; kept as provenance for how the art was produced). | — |
| `smoke-src/` | Source plates consumed by `smoke-keying.ts`. | — |

Deleted from this folder during the master audit:

- `dev-keeper.sh` — sandbox-only dev-server babysitter; no value in the
  shipped project.

## Applying a D1 dump remotely

```bash
bun run db:migrate:remote      # schema migrations first
bun run db:seed:export         # regenerate artifacts from your local DB
bun run db:seed:remote         # wrangler d1 execute DB --remote --file scripts/seed-d1.sql
bun run db:seed:kv:remote      # settings KV documents
```

⚠ Re-running the seed dump RESETS the remote tables to local content — it is
a bootstrap/demo-reset tool, not a merge tool. See
`docs/CLOUDFLARE-DEPLOYMENT.md` for the full production flow.
