import type { CatalogCategory, CatalogItem, ItemVariant } from "@/types";

/**
 * PRODUCT CATALOG
 * -------------------
 * VAPETIVE's catalog is currently the IQOS ILUMA heat-not-burn tobacco
 * stick line only — one product per flavour, seeded into D1 by
 * scripts/seed.ts (this file is seed-only: runtime app code must never
 * import it). Images reuse the locally generated product art pool.
 * In production these records come from D1 via catalogService and media
 * from R2.
 *
 * NOTE: prices and specifications are sample data for the prototype
 * ordering flow — they do not represent verified claims.
 */

export const CATALOG_CATEGORIES: CatalogCategory[] = [
  {
    id: "cat-heat-not-burn",
    slug: "heat-not-burn",
    name: "Heat-Not-Burn Sticks",
    description: "Tobacco sticks heated, never burned — made for IQOS ILUMA.",
    longDescription:
      "Heat-not-burn tobacco sticks prepared exclusively for the IQOS ILUMA system — real tobacco, heated by induction instead of burned. Browse the full flavour range across the multi-origin, Indonesia and Japan lines, from smooth toasted tobaccos to cooling menthols and click-capsule Pearl editions.",
    itemCount: 36,
    featured: true,
    accent: "ice",
  },
];

/* ------------------------- image pools --------------------------- */

const IMG = {
  iluma: ["/products/iqos-stick-pack.jpg", "/products/iqos-stick-duo.jpg", "/products/iqos-stick-device.jpg"],
} as const;

/* --------------------------- factories ---------------------------- */

const F = (id: string, label: string, swatch: string, available = true): ItemVariant => ({
  id,
  label,
  type: "flavor",
  swatch,
  available,
});

type ProductSeed = Omit<
  CatalogItem,
  "id" | "sku" | "warnings" | "conformity" | "documents" | "availability" | "ageRestricted"
> &
  Partial<Pick<CatalogItem, "sku" | "availability">>;

let seq = 0;
const P = (seed: ProductSeed): CatalogItem => {
  seq += 1;
  const n = String(seq).padStart(3, "0");
  return {
    id: `itm-${seed.slug}`,
    sku: seed.sku ?? `MKT-${n}`,
    warnings: [],
    conformity: [],
    documents: [],
    availability: "in_stock",
    ageRestricted: seed.categorySlug !== "coils-accessories" || seed.slug.includes("pods"),
    ...seed,
  };
};

export const CATALOG_ITEMS: CatalogItem[] = [];

/* --------------------- IQOS ILUMA (heat-not-burn) --------------------- */

/**
 * IQOS ILUMA heat-not-burn tobacco sticks — one product per flavour.
 *
 * Imported from the supplier product list ("Made For IQOS ILUMA ONLY",
 * origin lines: multi-origin duty free, Indonesia, Japan). Every product
 * is a single-variant product: the one variant is the flavour itself.
 * Titles are "brand + flavour"; where the same flavour name appears in
 * more than one origin line (Purple Wave, Oasis Pearl, Sun Pearl), the
 * origin is appended to the title to keep products distinguishable.
 * Supplier typos (Puple Wave, Puple Menthol, Eartly, sbtle, Freshnes,
 * Tazakystan, Indoensia…) are normalised here on purpose.
 */

const ILUMA_ORIGIN = {
  multi: "Uzbekistan, Tajikistan, Kazakhstan, Indonesia & Duty Free",
  indonesia: "Indonesia",
  japan: "Japan",
} as const;

const ILUMA_STICKS: Array<{
  flavour: string;
  profile: string;
  swatch: string;
  origin: keyof typeof ILUMA_ORIGIN;
  /** Appended to title/slug when the same flavour exists in another origin line. */
  originSuffix?: string;
  /** Homepage collection preview picks featured items first. */
  featured?: boolean;
}> = [
  // Line 1 — multi-origin duty-free line (Uzbekistan, Tajikistan, Kazakhstan, Indonesia & Duty Free)
  { flavour: "Amber", profile: "Smooth creamy tobacco with light woody and nutty notes", swatch: "#b45309", origin: "multi", featured: true },
  { flavour: "Silver", profile: "Mild tobacco with subtle herbal notes", swatch: "#9ca3af", origin: "multi" },
  { flavour: "Yellow", profile: "Mellow toasted tobacco with a citrus twist", swatch: "#facc15", origin: "multi" },
  { flavour: "Purple Wave", profile: "Fruity menthol with forest berry", swatch: "#a855f7", origin: "multi", featured: true },
  { flavour: "Zing Wave", profile: "Cool menthol with citrus and spicy herbal notes", swatch: "#f97316", origin: "multi" },
  { flavour: "Turquoise", profile: "Fresh menthol and citrus", swatch: "#14b8a6", origin: "multi" },
  { flavour: "Summer Wave", profile: "Sweet peach with floral menthol freshness", swatch: "#fb923c", origin: "multi" },
  { flavour: "Twilight Pearl", profile: "Full-bodied toasted tobacco with malty notes; click for cooling blueberry with menthol", swatch: "#6d28d9", origin: "multi", featured: true },
  { flavour: "Starling Pearl", profile: "Tobacco base; click for green apple with menthol", swatch: "#84cc16", origin: "multi" },
  { flavour: "Tidal Pearl", profile: "Click-activated dual tobacco and menthol format", swatch: "#38bdf8", origin: "multi" },
  { flavour: "Province Pearl", profile: "Full-bodied toasted tobacco with malty notes; click for cooling grape with menthol", swatch: "#7c3aed", origin: "multi" },
  // Line 2 — Indonesia
  { flavour: "Sienna", profile: "Rich, woody tobacco with subtle tea notes", swatch: "#a0522d", origin: "indonesia", featured: true },
  { flavour: "Bronze", profile: "Rich tobacco with cocoa and dried fruit", swatch: "#92400e", origin: "indonesia" },
  { flavour: "Black Green", profile: "Earthy tobacco with green notes, bold and lively", swatch: "#14532d", origin: "indonesia" },
  { flavour: "Bright Wave", profile: "Mellow tobacco with green fruit and menthol cooling", swatch: "#a3e635", origin: "indonesia" },
  { flavour: "Purple Wave", profile: "Dark berries, grape and crisp menthol", swatch: "#7e22ce", origin: "indonesia", originSuffix: "Indonesia" },
  { flavour: "Blue", profile: "Deep, cooling menthol", swatch: "#2563eb", origin: "indonesia" },
  { flavour: "Green", profile: "Balanced and cooling; mild menthol over a gentle tobacco base", swatch: "#16a34a", origin: "indonesia" },
  { flavour: "Oasis Pearl", profile: "Crisp menthol coolness; crush the capsule for a tropical, juicy aroma", swatch: "#2dd4bf", origin: "indonesia", originSuffix: "Indonesia", featured: true },
  { flavour: "Sun Pearl", profile: "Refined menthol with exotic fruit", swatch: "#f59e0b", origin: "indonesia", originSuffix: "Indonesia" },
  { flavour: "Yugen", profile: "Rich, floral tobacco from the Dimension Series", swatch: "#d946ef", origin: "indonesia" },
  { flavour: "Apprecity", profile: "Rich, creamy tobacco from the Dimensions Series", swatch: "#fcd34d", origin: "indonesia" },
  { flavour: "Golden Edition", profile: "Mellow, warm tobacco", swatch: "#eab308", origin: "indonesia", featured: true },
  // Line 3 — Japan
  { flavour: "Black Menthol", profile: "Strong, cold menthol", swatch: "#1e293b", origin: "japan", featured: true },
  { flavour: "Purple Menthol", profile: "Classic style menthol", swatch: "#9333ea", origin: "japan" },
  { flavour: "Ruby Regular", profile: "Non-menthol regular tobacco", swatch: "#dc2626", origin: "japan" },
  { flavour: "Oasis Pearl", profile: "Crisp menthol coolness; crush the capsule for a tropical, juicy aroma", swatch: "#2dd4bf", origin: "japan", originSuffix: "Japan" },
  { flavour: "Sun Pearl", profile: "Refined menthol with exotic fruit", swatch: "#f59e0b", origin: "japan", originSuffix: "Japan" },
  { flavour: "Black Purple Menthol", profile: "Frosty menthol with forest berry", swatch: "#581c87", origin: "japan" },
  { flavour: "Mint", profile: "Classic mint-style menthol", swatch: "#6ee7b7", origin: "japan" },
  { flavour: "Menthol", profile: "Classic menthol", swatch: "#10b981", origin: "japan" },
  { flavour: "Rich Regular", profile: "Rich, full-bodied regular tobacco", swatch: "#78350f", origin: "japan", featured: true },
  { flavour: "Regular", profile: "Classic non-menthol tobacco", swatch: "#57534e", origin: "japan" },
  { flavour: "Smooth Regular", profile: "Smooth, mild regular tobacco", swatch: "#a8a29e", origin: "japan" },
  { flavour: "Balance Regular", profile: "Balanced regular tobacco", swatch: "#d6d3d1", origin: "japan" },
  { flavour: "Warm Regular", profile: "Warm regular tobacco", swatch: "#b45309", origin: "japan" },
];

const ilumaSlug = (flavour: string, suffix?: string) =>
  `iqos-iluma-${[flavour, suffix]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}`;

const ilumaSpecs = (profile: string, origin: string) => [
  {
    title: "Tobacco Stick",
    entries: [
      { label: "Format", value: "Heat-not-burn tobacco stick" },
      { label: "Sticks per pack", value: "20" },
      { label: "Flavour profile", value: profile },
      { label: "Compatibility", value: "IQOS ILUMA devices only" },
      { label: "Origin", value: origin },
    ],
  },
];

ILUMA_STICKS.forEach((stick, index) => {
  const origin = ILUMA_ORIGIN[stick.origin];
  CATALOG_ITEMS.push(
    P({
      slug: ilumaSlug(stick.flavour, stick.originSuffix),
      name: `IQOS ILUMA ${stick.flavour}${stick.originSuffix ? ` (${stick.originSuffix})` : ""}`,
      brand: "IQOS ILUMA",
      categorySlug: "heat-not-burn",
      sku: `IQS-${String(index + 1).padStart(3, "0")}`,
      tagline: `${stick.profile}.`,
      description: `${stick.profile}. Heat-not-burn tobacco sticks prepared exclusively for IQOS ILUMA devices — the tobacco is heated, never burned, for consistent flavour with no ash and no lighter. Pack of 20 tobacco sticks.`,
      price: 45,
      images: [IMG.iluma[index % IMG.iluma.length], IMG.iluma[(index + 1) % IMG.iluma.length]],
      specs: ilumaSpecs(stick.profile, origin),
      variants: [F(`v-ii${index + 1}`, stick.flavour, stick.swatch)],
      origin,
      featured: stick.featured,
    })
  );
});

/* --------------------- derived helpers --------------------------- */

/** Auto-fill relatedSlugs for records that don't declare any: same brand first, then same category. */
for (const item of CATALOG_ITEMS) {
  if (!item.relatedSlugs?.length) {
    const sameBrand = CATALOG_ITEMS.filter((o) => o.slug !== item.slug && o.brand === item.brand);
    const sameCategory = CATALOG_ITEMS.filter((o) => o.slug !== item.slug && o.categorySlug === item.categorySlug);
    item.relatedSlugs = [...sameBrand, ...sameCategory].slice(0, 4).map((o) => o.slug);
  }
}

export const catalogCategoriesBySlug = (slug: string) => CATALOG_CATEGORIES.find((c) => c.slug === slug);
export const catalogItemBySlug = (slug: string) => CATALOG_ITEMS.find((i) => i.slug === slug);
