import type { MediaAsset } from "@/types";

/**
 * SEED MEDIA METADATA
 * -------------------
 * Seed-only fixture consumed by scripts/seed.ts to populate the
 * media_assets table. Entries reference the local /public assets used by
 * the site itself; runtime media reads/writes go through
 * src/server/repos/media.ts and /api/v1/admin/media.
 */
export const MEDIA_ASSETS: MediaAsset[] = [
  { id: "med-01", name: "aura-700.jpg", type: "image", format: "JPEG", sizeLabel: "184 KB", dimensions: "1024 × 1024", folder: "products", uploadedAt: "2025-01-10", alt: "Aura 700 disposable device on dark background", url: "/products/aura-700.jpg", status: "ready" },
  { id: "med-02", name: "aura-700-2.jpg", type: "image", format: "JPEG", sizeLabel: "171 KB", dimensions: "1024 × 1024", folder: "products", uploadedAt: "2025-01-10", alt: "Aura 700 flavour line-up", url: "/products/aura-700-2.jpg", status: "ready" },
  { id: "med-03", name: "dune-pro-2500.jpg", type: "image", format: "JPEG", sizeLabel: "196 KB", dimensions: "1024 × 1024", folder: "products", uploadedAt: "2025-01-10", alt: "Dune Pro 2500 device", url: "/products/dune-pro-2500.jpg", status: "ready" },
  { id: "med-04", name: "halo-pod-kit.jpg", type: "image", format: "JPEG", sizeLabel: "178 KB", dimensions: "1024 × 1024", folder: "products", uploadedAt: "2025-01-10", alt: "Halo Pod Kit alloy body", url: "/products/halo-pod-kit.jpg", status: "ready" },
  { id: "med-05", name: "sirocco-salt-30.jpg", type: "image", format: "JPEG", sizeLabel: "142 KB", dimensions: "1024 × 1024", folder: "products", uploadedAt: "2025-01-10", alt: "Sirocco Salt 30 ml bottle", url: "/products/sirocco-salt-30.jpg", status: "ready" },
  { id: "med-06", name: "obsidian-80w-kit.jpg", type: "image", format: "JPEG", sizeLabel: "203 KB", dimensions: "1024 × 1024", folder: "products", uploadedAt: "2025-01-10", alt: "Obsidian 80W mod with tank", url: "/products/obsidian-80w-kit.jpg", status: "ready" },
  { id: "med-07", name: "atelier.jpg", type: "image", format: "JPEG", sizeLabel: "264 KB", dimensions: "1600 × 1000", folder: "brand", uploadedAt: "2025-01-09", alt: "Inside the VAPETIVE shop, abstract", url: "/brand/atelier.jpg", status: "ready" },
  { id: "med-08", name: "craft.jpg", type: "image", format: "JPEG", sizeLabel: "248 KB", dimensions: "1600 × 1000", folder: "brand", uploadedAt: "2025-01-09", alt: "Brand-wall photography, abstract", url: "/brand/craft.jpg", status: "ready" },
  { id: "med-09", name: "consumer-information.pdf", type: "document", format: "PDF", sizeLabel: "88 KB", folder: "legal", uploadedAt: "2025-01-08", url: "#", status: "ready" },
  { id: "med-10", name: "brand-film-storyboard.mp4", type: "video", format: "MP4", sizeLabel: "42 MB", dimensions: "1920 × 1080", folder: "brand", uploadedAt: "2025-01-07", url: "#", status: "processing" },
];
