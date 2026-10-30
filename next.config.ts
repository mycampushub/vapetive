import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  /**
   * Image optimization MUST stay off for this deployment target.
   *
   * On Cloudflare Workers (OpenNext) `/_next/image` can serve build-time
   * static assets, but its upstream self-fetch of DYNAMIC routes (the media
   * API at /api/v1/media/*) fails — a Worker cannot subrequest its own
   * hostname — and the optimizer answers 404 "upstream response is
   * invalid". Admin-uploaded product photos therefore rendered as
   * "Image unavailable" for visitors while the admin library (which
   * bypasses the optimizer) showed them fine.
   *
   * The optimizer was pass-through-only on Workers anyway (original bytes
   * were served un-re-encoded), so nothing is lost: every media URL is
   * verified to serve directly (R2 binding / media_blobs fallback /
   * static assets) and Cloudflare's CDN still caches responses.
   */
  images: { unoptimized: true },
  experimental: {
    // Tree-shake barrel imports (lucide-react is imported across many
    // islands) — smaller client bundles, faster first paint.
    optimizePackageImports: ["lucide-react", "framer-motion", "@radix-ui/react-slot"],
  },
  async rewrites() {
    return [
      {
        // Media URL compatibility — afterFiles (default) so real static
        // files in public/uploads keep winning locally, while any
        // /uploads/<key> URL without a static file (e.g. rows exported
        // from a local-era database and applied to D1) resolves through
        // the media API instead of 404ing: the route reads the same key
        // from R2 on Workers and from public/uploads in the sandbox.
        source: "/uploads/:path*",
        destination: "/api/v1/media/:path*",
      },
    ];
  },
  async headers() {
    return [
      {
        // Baseline hardening (QA audit Task 26). A nonce-based CSP is the
        // follow-up once the deploy target is fixed; these ship now.
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
    ];
  },
};

export default nextConfig;
