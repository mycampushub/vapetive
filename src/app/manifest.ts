import type { MetadataRoute } from "next";

/**
 * PWA WEB APP MANIFEST
 * --------------------
 * Aligns the storefront with the existing /offline state page: name,
 * brand colours and icon set for installable sessions. Icons reuse the
 * logo SVG; theme colours match globals.css tokens.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vapetive — #1 Vape Shop in UAE for Instant Online Delivery",
    short_name: "Vapetive",
    description:
      "Shop authentic disposable vapes, pod systems and e-liquids with transparent AED pricing and age-verified UAE-wide delivery from Dubai.",
    id: "/",
    start_url: "/",
    display: "standalone",
    background_color: "#060409",
    theme_color: "#060409",
    lang: "en-AE",
    categories: ["shopping", "lifestyle"],
    icons: [
      {
        src: "/logo.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
