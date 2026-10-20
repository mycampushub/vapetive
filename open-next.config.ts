/**
 * VAPETIVE — OpenNext Cloudflare adapter configuration.
 *
 * Consumed by `opennextjs-cloudflare build` (bun run cf:build/preview/deploy).
 * The R2 incremental cache keeps ISR/prerender cache entries across isolates
 * and deploys instead of per-isolate memory. Binding name must match
 * wrangler.toml (NEXT_INC_CACHE_R2_BUCKET).
 */

import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
});
