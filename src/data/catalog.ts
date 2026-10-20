import type { CatalogCategory, CatalogItem, ItemVariant } from "@/types";

/**
 * PRODUCT CATALOG
 * -------------------
 * VAPETIVE is a UAE vape shop: every record below belongs to one of
 * the stocked brands (src/data/brands.ts). Images reuse the locally
 * generated product art pool by device type. In production these records
 * come from D1 via catalogService and media from R2.
 *
 * NOTE: device names, specifications and prices are sample data for the
 * prototype ordering flow — they do not represent verified claims.
 */

export const CATALOG_CATEGORIES: CatalogCategory[] = [
  {
    id: "cat-disposables",
    slug: "disposable-vapes",
    name: "Disposable Vapes",
    description: "Sealed, ready-to-use devices — no refilling, no charging.",
    longDescription:
      "Every big-name sealed device in one place — Elf Bar, Lost Mary, Geek Bar, Vozol, Tugboat, HQD, Fummo, Yuoto, Stig, Maskking, Silvaper and Al Fakher. Filter by brand, puff count and flavour, with authenticity-checked stock on every unit.",
    itemCount: 31,
    featured: true,
    accent: "violet",
  },
  {
    id: "cat-pods",
    slug: "pod-systems",
    name: "Pod Systems",
    description: "Refillable and pre-filled pod platforms for everyday carrying.",
    longDescription:
      "Refillable and pre-filled pod platforms from Elf Bar, Geek Bar, Lost Mary and Vozol — fast USB-C charging, balanced airflow and leak-conscious engineering for dependable daily use.",
    itemCount: 4,
    featured: true,
    accent: "ice",
  },
  {
    id: "cat-liquids",
    slug: "e-liquids",
    name: "E-Liquids",
    description: "Freebase, salt nicotine and shortfill formulations.",
    longDescription:
      "House-favourite bottled flavours from the brands you came for — Al Fakher salts, VGOD Cubano freebase and Silvaper salt lines, with batch documentation and child-resistant packaging.",
    itemCount: 3,
    featured: true,
    accent: "magenta",
  },
  {
    id: "cat-kits",
    slug: "advanced-kits",
    name: "Advanced Kits",
    description: "Starter and mod-class kits for experienced users.",
    longDescription:
      "Variable-output and starter kits for users who want more control — VGOD's mech heritage and Geek Bar's Wenax platform, with configurable power delivery and replaceable coils.",
    itemCount: 2,
    accent: "violet",
  },
  {
    id: "cat-accessories",
    slug: "coils-accessories",
    name: "Coils & Accessories",
    description: "Genuine pods, coils and care essentials per platform.",
    longDescription:
      "Genuine replacement pods and coils matched to their platforms — ELFA Pro pods, Lost Mary 4-in-1 pods and Wenax Q2 coils. Verify your device before ordering.",
    itemCount: 3,
    accent: "ice",
  },
];

/* ------------------------- image pools --------------------------- */

const IMG = {
  disposable: ["/products/aura-700.jpg", "/products/dune-pro-2500.jpg"],
  disposable2: ["/products/aura-700-2.jpg", "/products/dune-pro-2500-2.jpg"],
  pod: ["/products/halo-pod-kit.jpg", "/products/eclipse-pod-kit.jpg"],
  pod2: ["/products/halo-pod-kit-2.jpg", "/products/eclipse-pod-kit-2.jpg"],
  liquid: ["/products/sirocco-salt-30.jpg", "/products/nebula-freebase-30.jpg", "/products/zephyr-shortfill-60.jpg"],
  kit: ["/products/obsidian-80w-kit.jpg", "/products/cirrus-aio.jpg"],
  kit2: ["/products/obsidian-80w-kit-2.jpg"],
  accessory: ["/products/mesh-coil-5pack.jpg", "/products/type-c-cable.jpg", "/products/drip-tip-set.jpg"],
} as const;

/* --------------------------- factories ---------------------------- */

const F = (id: string, label: string, swatch: string, available = true): ItemVariant => ({
  id,
  label,
  type: "flavor",
  swatch,
  available,
});
const C = (id: string, label: string, swatch: string, available = true): ItemVariant => ({
  id,
  label,
  type: "color",
  swatch,
  available,
});
const N = (id: string, label: string, available = true): ItemVariant => ({ id, label, type: "nicotine", available });
const CAP = (id: string, label: string, available = true): ItemVariant => ({ id, label, type: "capacity", available });

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

const deviceSpecs = (entries: Array<[string, string]>) => [
  { title: "Device", entries: entries.map(([label, value]) => ({ label, value })) },
];
const liquidSpecs = (entries: Array<[string, string]>) => [
  { title: "Liquid", entries: entries.map(([label, value]) => ({ label, value })) },
];

export const CATALOG_ITEMS: CatalogItem[] = [
  /* ------------------------- AL FAKHER ------------------------- */
  P({
    slug: "al-fakher-crown-bar-pro-8000",
    name: "Crown Bar Pro 8000",
    brand: "Al Fakher Vape",
    categorySlug: "disposable-vapes",
    model: "CB-Pro-8000",
    tagline: "The flavour house's flagship — 8000 draws of shisha-grade flavour.",
    description:
      "Crown Bar Pro distils decades of Al Fakher flavour craft into an 8000-draw device. A soft-touch shell, mesh coil and anti-dry-hit wicking keep the double-apple and mint profiles smooth from first draw to last, with the crown-embossed finish the brand is known for.",
    price: 65,
    images: [IMG.disposable[0], IMG.disposable2[0]],
    specs: deviceSpecs([
      ["Puff capacity (approx.)", "Up to 8000 draws"],
      ["E-liquid capacity", "18 ml"],
      ["Battery", "650 mAh, USB-C rechargeable"],
      ["Coil", "1.0 Ω mesh"],
      ["Nicotine strength", "20 mg/ml salt"],
    ]),
    variants: [
      F("v-af1", "Double Apple", "#a8763e"),
      F("v-af2", "Mint", "#6fd6f2"),
      F("v-af3", "Watermelon Mint", "#86efac"),
      F("v-af4", "Blueberry Gum", "#8b5cf6"),
    ],
    featured: true,
    nicotineStrength: "20 mg/ml",
    relatedSlugs: ["al-fakher-crown-bar-x-12000", "al-fakher-salt-30ml"],
  }),
  P({
    slug: "al-fakher-crown-bar-x-12000",
    name: "Crown Bar X 12000",
    brand: "Al Fakher Vape",
    categorySlug: "disposable-vapes",
    model: "CBX-12000",
    tagline: "Twelve thousand draws, LED tank window, crown finish.",
    description:
      "The X extends the Crown Bar line to 12000 draws with a 20 ml tank, LED e-liquid and battery windows and a turbo-charged mesh coil. Classic shisha flavour profiles, modern hardware.",
    price: 85,
    images: [IMG.disposable[1], IMG.disposable2[1]],
    specs: deviceSpecs([
      ["Puff capacity (approx.)", "Up to 12000 draws"],
      ["E-liquid capacity", "20 ml"],
      ["Battery", "650 mAh, USB-C rechargeable"],
      ["Displays", "LED e-liquid + battery indicators"],
      ["Nicotine strength", "20 mg/ml salt"],
    ]),
    variants: [F("v-afx1", "Two Apple Ice", "#a8763e"), F("v-afx2", "Grape Mint", "#8b5cf6"), F("v-afx3", "Lemon Mint", "#fbbf24")],
    isNew: true,
    nicotineStrength: "20 mg/ml",
    relatedSlugs: ["al-fakher-crown-bar-pro-8000", "al-fakher-salt-30ml"],
  }),

  /* -------------------------- ELF BAR -------------------------- */
  P({
    slug: "elf-bar-bc5000",
    name: "Elf Bar BC5000",
    brand: "Elf Bar",
    categorySlug: "disposable-vapes",
    model: "BC5000",
    tagline: "The icon. 5000 draws of the world's most copied flavour range.",
    description:
      "The device that defined the modern disposable: a palm-sized quad-rectangle shell, draw-activated mesh coil and the candy-shelf flavour list everyone knows. QDUO wicking keeps flavour consistent across all 5000 draws.",
    price: 45,
    compareAtPrice: 55,
    images: [IMG.disposable[0], IMG.disposable2[0]],
    specs: deviceSpecs([
      ["Puff capacity (approx.)", "Up to 5000 draws"],
      ["E-liquid capacity", "13 ml"],
      ["Battery", "650 mAh, USB-C rechargeable"],
      ["Coil", "1.2 Ω mesh"],
      ["Nicotine strength", "20 mg/ml salt"],
    ]),
    variants: [
      F("v-eb1", "Blue Razz Ice", "#6fd6f2"),
      F("v-eb2", "Mango Peach", "#fbbf24"),
      F("v-eb3", "Kiwi Passion Guava", "#86efac"),
      F("v-eb4", "Watermelon Ice", "#fda4af"),
    ],
    featured: true,
    nicotineStrength: "20 mg/ml",
    relatedSlugs: ["elf-bar-cr5000", "elf-bar-elfa-pro"],
  }),
  P({
    slug: "elf-bar-cr5000",
    name: "Elf Bar CR5000",
    brand: "Elf Bar",
    categorySlug: "disposable-vapes",
    model: "CR5000",
    tagline: "The bottle-shaped sibling with a softer, airier draw.",
    description:
      "CR5000 wraps the same 5000-draw formula in a curved bottle shell with a quilted finish and a noticeably airier MTL draw. A quartz-drip mouthpiece keeps the flavour clean.",
    price: 50,
    images: [IMG.disposable[1], IMG.disposable2[1]],
    specs: deviceSpecs([
      ["Puff capacity (approx.)", "Up to 5000 draws"],
      ["E-liquid capacity", "13 ml"],
      ["Battery", "650 mAh, USB-C rechargeable"],
      ["Mouthpiece", "Quartz drip tip"],
      ["Nicotine strength", "20 mg/ml salt"],
    ]),
    variants: [F("v-ec1", "Strawberry Mango", "#f87171"), F("v-ec2", "Blue Razz Lemon", "#93c5fd"), F("v-ec3", "Peach Mango", "#fbbf24")],
    nicotineStrength: "20 mg/ml",
    relatedSlugs: ["elf-bar-bc5000", "elf-bar-pi9000"],
  }),
  P({
    slug: "elf-bar-pi9000",
    name: "Elf Bar Pi9000",
    brand: "Elf Bar",
    categorySlug: "disposable-vapes",
    model: "PI9000",
    tagline: "9000 draws, ten-tier battery ring, candy-shop flavour.",
    description:
      "Pi9000 scales the family to 9000 draws with a 22 ml tank and a ten-segment LED battery ring. Mesh coil tuning leans sweet — the sakura grape and pina colada profiles are the standouts.",
    price: 65,
    images: [IMG.disposable[0], IMG.disposable2[1]],
    specs: deviceSpecs([
      ["Puff capacity (approx.)", "Up to 9000 draws"],
      ["E-liquid capacity", "22 ml"],
      ["Battery", "650 mAh, USB-C rechargeable"],
      ["Display", "10-segment battery ring"],
      ["Nicotine strength", "20 mg/ml salt"],
    ]),
    variants: [F("v-ep1", "Sakura Grape", "#d75fd4"), F("v-ep2", "Pina Colada", "#fde68a"), F("v-ep3", "Blueberry Sour Raspberry", "#8b5cf6")],
    isNew: true,
    nicotineStrength: "20 mg/ml",
    relatedSlugs: ["elf-bar-bc5000", "elf-bar-elfa-pro"],
  }),

  /* ------------------------- LOST MARY ------------------------- */
  P({
    slug: "lost-mary-mo20000-pro",
    name: "Lost Mary MO20000 Pro",
    brand: "Lost Mary",
    categorySlug: "disposable-vapes",
    model: "MO20000-Pro",
    tagline: "Turbo mode, animated display, twenty thousand draws.",
    description:
      "MO20000 Pro is Lost Mary's flagship: a dual-mesh coil with switchable Smooth and Turbo modes, an animated eye display and 20000 draws of the brand's layered fruit flavour. USB-C fast charge keeps the 800 mAh cell ahead of the tank.",
    price: 95,
    images: [IMG.disposable[1], IMG.disposable2[0]],
    specs: deviceSpecs([
      ["Puff capacity (approx.)", "Up to 20000 draws"],
      ["Modes", "Smooth / Turbo (dual mesh)"],
      ["E-liquid capacity", "18 ml"],
      ["Battery", "800 mAh, USB-C rechargeable"],
      ["Display", "Animated colour screen"],
      ["Nicotine strength", "20 mg/ml salt"],
    ]),
    variants: [F("v-lm1", "Mango Twist", "#fbbf24"), F("v-lm2", "Watermelon Ice", "#fda4af"), F("v-lm3", "Blue Razz Cherry", "#6fd6f2")],
    featured: true,
    isNew: true,
    nicotineStrength: "20 mg/ml",
    relatedSlugs: ["lost-mary-mt15000-turbo", "lost-mary-4in1-pod-kit"],
  }),
  P({
    slug: "lost-mary-mt15000-turbo",
    name: "Lost Mary MT15000 Turbo",
    brand: "Lost Mary",
    categorySlug: "disposable-vapes",
    model: "MT15000",
    tagline: "The turbo tank — 15000 draws with a mode switch.",
    description:
      "MT15000 pairs a 17 ml tank with the signature turbo switch: Smooth mode sips for longevity, Turbo mode doubles the vapour for cloud-heavy sessions. A transparent tank window shows exactly how much is left.",
    price: 75,
    images: [IMG.disposable[0], IMG.disposable2[1]],
    specs: deviceSpecs([
      ["Puff capacity (approx.)", "Up to 15000 draws"],
      ["Modes", "Smooth / Turbo"],
      ["E-liquid capacity", "17 ml"],
      ["Battery", "650 mAh, USB-C rechargeable"],
      ["Nicotine strength", "20 mg/ml salt"],
    ]),
    variants: [F("v-lmt1", "Winter Mint", "#6fd6f2"), F("v-lmt2", "Rainbow Sherbet", "#d75fd4"), F("v-lmt3", "Strawberry Kiwi", "#f87171")],
    nicotineStrength: "20 mg/ml",
    relatedSlugs: ["lost-mary-mo20000-pro", "lost-mary-os5000"],
  }),
  P({
    slug: "lost-mary-os5000",
    name: "Lost Mary OS5000",
    brand: "Lost Mary",
    categorySlug: "disposable-vapes",
    model: "OS5000",
    tagline: "The bottle-shaped classic with charged flavour.",
    description:
      "OS5000 put Lost Mary on the map — a sculpted bottle shell, 13 ml of juice and the brand's characterful flavour list. Simple, dependable and endlessly re-orderable.",
    price: 50,
    images: [IMG.disposable[1], IMG.disposable2[1]],
    specs: deviceSpecs([
      ["Puff capacity (approx.)", "Up to 5000 draws"],
      ["E-liquid capacity", "13 ml"],
      ["Battery", "650 mAh, USB-C rechargeable"],
      ["Nicotine strength", "20 mg/ml salt"],
    ]),
    variants: [F("v-lo1", "Blue Razz Ice", "#6fd6f2"), F("v-lo2", "Cherry Peach Lemonade", "#fda4af"), F("v-lo3", "Clear", "#e5e7eb")],
    nicotineStrength: "20 mg/ml",
    relatedSlugs: ["lost-mary-mt15000-turbo", "lost-mary-mo20000-pro"],
  }),

  /* -------------------------- GEEK BAR ------------------------- */
  P({
    slug: "geek-bar-pulse-x",
    name: "Geek Bar Pulse X 25000",
    brand: "Geek Bar",
    categorySlug: "disposable-vapes",
    model: "Pulse-X",
    tagline: "25,000 draws, dual mesh, full animated screen.",
    description:
      "Pulse X tops the Pulse line: 25 ml of juice, dual mesh coils, a switchable Pulse mode and a full-colour animated screen showing battery, juice and mode. The most engineered disposable on the market.",
    price: 95,
    images: [IMG.disposable[0], IMG.disposable2[0]],
    specs: deviceSpecs([
      ["Puff capacity (approx.)", "Up to 25000 draws"],
      ["Modes", "Standard / Pulse"],
      ["E-liquid capacity", "25 ml"],
      ["Battery", "820 mAh, USB-C fast charge"],
      ["Display", "Full animated colour screen"],
      ["Nicotine strength", "20 mg/ml salt"],
    ]),
    variants: [F("v-gp1", "Miami Mint", "#6fd6f2"), F("v-gp2", "Blue Razz Ice", "#93c5fd"), F("v-gp3", "Meta Moon", "#d75fd4")],
    featured: true,
    isNew: true,
    nicotineStrength: "20 mg/ml",
    relatedSlugs: ["geek-bar-pulse-15000", "geek-bar-wenax-q2"],
  }),
  P({
    slug: "geek-bar-pulse-15000",
    name: "Geek Bar Pulse 15000",
    brand: "Geek Bar",
    categorySlug: "disposable-vapes",
    model: "Pulse-15000",
    tagline: "The original Pulse — 15000 draws with boost mode.",
    description:
      "The device that made screens standard: 16 ml tank, Pulse boost mode and a crisp display tracking every draw. Flavour stays geekily consistent thanks to dual airflow chambers.",
    price: 80,
    images: [IMG.disposable[1], IMG.disposable2[1]],
    specs: deviceSpecs([
      ["Puff capacity (approx.)", "Up to 15000 draws"],
      ["Modes", "Standard / Pulse"],
      ["E-liquid capacity", "16 ml"],
      ["Battery", "650 mAh, USB-C rechargeable"],
      ["Nicotine strength", "20 mg/ml salt"],
    ]),
    variants: [F("v-g15k1", "Watermelon Ice", "#fda4af"), F("v-g15k2", "Pink Lemonade", "#f9a8d4"), F("v-g15k3", "Tropical Rainbow", "#86efac")],
    nicotineStrength: "20 mg/ml",
    relatedSlugs: ["geek-bar-pulse-x", "geek-bar-wenax-q2"],
  }),

  /* --------------------------- VOZOL --------------------------- */
  P({
    slug: "vozol-star-12000",
    name: "Vozol Star 12000",
    brand: "Vozol",
    categorySlug: "disposable-vapes",
    model: "Star-12000",
    tagline: "Gear-texture shell, LED juice window, 12000 draws.",
    description:
      "Star 12000 wraps a 18 ml tank in Vozol's signature gear-texture shell with an LED window for liquid and battery. The 1.0 Ω mesh coil is tuned for a tight, quiet MTL draw.",
    price: 70,
    images: [IMG.disposable[0], IMG.disposable2[1]],
    specs: deviceSpecs([
      ["Puff capacity (approx.)", "Up to 12000 draws"],
      ["E-liquid capacity", "18 ml"],
      ["Battery", "650 mAh, USB-C rechargeable"],
      ["Shell", "Gear-texture anti-slip"],
      ["Nicotine strength", "20 mg/ml salt"],
    ]),
    variants: [F("v-vs1", "Rainbow Blast", "#d75fd4"), F("v-vs2", "Cool Mint", "#6fd6f2"), F("v-vs3", "Peach Mango Guava", "#fbbf24")],
    featured: true,
    nicotineStrength: "20 mg/ml",
    relatedSlugs: ["vozol-gear-10000", "vozol-v-mate-e"],
  }),
  P({
    slug: "vozol-gear-10000",
    name: "Vozol Gear 10000",
    brand: "Vozol",
    categorySlug: "disposable-vapes",
    model: "Gear-10000",
    tagline: "The everyday Gear — 10000 draws, compact shell.",
    description:
      "Gear 10000 compresses the Vozol formula into a pocket-friendlier shell: 15 ml tank, 650 mAh cell and the same gear-texture grip. A smart LED keeps battery status honest.",
    price: 60,
    images: [IMG.disposable[1], IMG.disposable2[0]],
    specs: deviceSpecs([
      ["Puff capacity (approx.)", "Up to 10000 draws"],
      ["E-liquid capacity", "15 ml"],
      ["Battery", "650 mAh, USB-C rechargeable"],
      ["Nicotine strength", "20 mg/ml salt"],
    ]),
    variants: [F("v-vg1", "Power Bull", "#f59e0b"), F("v-vg2", "Strawberry Kiwi", "#f87171"), F("v-vg3", "Orange Mango", "#fbbf24")],
    nicotineStrength: "20 mg/ml",
    relatedSlugs: ["vozol-star-12000", "vozol-vista-20000"],
  }),
  P({
    slug: "vozol-vista-20000",
    name: "Vozol Vista 20000",
    brand: "Vozol",
    categorySlug: "disposable-vapes",
    model: "Vista-20000",
    tagline: "Twenty thousand draws with a panoramic LED display.",
    description:
      "Vista 20000 is Vozol's big tank flagship — 24 ml of juice, dual mesh coil and a wraparound LED display tracking juice and battery in real time. Eco mode stretches the cell between charges.",
    price: 95,
    images: [IMG.disposable[0], IMG.disposable2[0]],
    specs: deviceSpecs([
      ["Puff capacity (approx.)", "Up to 20000 draws"],
      ["E-liquid capacity", "24 ml"],
      ["Battery", "850 mAh, USB-C rechargeable"],
      ["Display", "Wraparound LED"],
      ["Nicotine strength", "20 mg/ml salt"],
    ]),
    variants: [F("v-vv1", "Mango Passion", "#fbbf24"), F("v-vv2", "Polar Ice", "#6fd6f2"), F("v-vv3", "Green Apple", "#86efac")],
    isNew: true,
    nicotineStrength: "20 mg/ml",
    relatedSlugs: ["vozol-star-12000", "vozol-gear-10000"],
  }),

  /* -------------------------- TUGBOAT -------------------------- */
  P({
    slug: "tugboat-evo-4500",
    name: "Tugboat Evo 4500",
    brand: "Tugboat Vape",
    categorySlug: "disposable-vapes",
    model: "Evo-4500",
    tagline: "The UAE's default first vape — 4500 honest draws.",
    description:
      "Evo 4500 is the little tug that could: a compact 10 ml shell, smooth restricted draw and the flavour list every UAE vaper knows by heart. Dependable, inexpensive and endlessly re-ordered.",
    price: 40,
    compareAtPrice: 49,
    images: [IMG.disposable[1], IMG.disposable2[1]],
    specs: deviceSpecs([
      ["Puff capacity (approx.)", "Up to 4500 draws"],
      ["E-liquid capacity", "10 ml"],
      ["Battery", "650 mAh, USB-C rechargeable"],
      ["Coil", "1.0 Ω mesh"],
      ["Nicotine strength", "20 mg/ml salt"],
    ]),
    variants: [F("v-te1", "Purple Rain", "#8b5cf6"), F("v-te2", "Cool Mint", "#6fd6f2"), F("v-te3", "Watermelon", "#fda4af")],
    featured: true,
    nicotineStrength: "20 mg/ml",
    relatedSlugs: ["tugboat-ultra-6000", "tugboat-mega-8000"],
  }),
  P({
    slug: "tugboat-ultra-6000",
    name: "Tugboat Ultra 6000",
    brand: "Tugboat Vape",
    categorySlug: "disposable-vapes",
    model: "Ultra-6000",
    tagline: "Six thousand draws, bigger hull, same no-fuss draw.",
    description:
      "Ultra 6000 scales the Evo formula with a 13 ml tank and a mesh coil tuned for cooler vapour. USB-C charging and a battery light keep it simple.",
    price: 55,
    images: [IMG.disposable[0], IMG.disposable2[1]],
    specs: deviceSpecs([
      ["Puff capacity (approx.)", "Up to 6000 draws"],
      ["E-liquid capacity", "13 ml"],
      ["Battery", "650 mAh, USB-C rechargeable"],
      ["Nicotine strength", "20 mg/ml salt"],
    ]),
    variants: [F("v-tu1", "Grape Ice", "#8b5cf6"), F("v-tu2", "Banana Ice", "#fde68a"), F("v-tu3", "Blue Razz", "#93c5fd")],
    nicotineStrength: "20 mg/ml",
    relatedSlugs: ["tugboat-evo-4500", "tugboat-mega-8000"],
  }),
  P({
    slug: "tugboat-mega-8000",
    name: "Tugboat Mega 8000",
    brand: "Tugboat Vape",
    categorySlug: "disposable-vapes",
    model: "Mega-8000",
    tagline: "The biggest hull in the fleet — 8000 draws.",
    description:
      "Mega 8000 gives the Tugboat draw a long-range tank: 18 ml of juice, rechargeable cell and a soft-touch finish. Flavours lean candy-forward with a cool finish.",
    price: 65,
    images: [IMG.disposable[1], IMG.disposable2[0]],
    specs: deviceSpecs([
      ["Puff capacity (approx.)", "Up to 8000 draws"],
      ["E-liquid capacity", "18 ml"],
      ["Battery", "650 mAh, USB-C rechargeable"],
      ["Nicotine strength", "20 mg/ml salt"],
    ]),
    variants: [F("v-tm1", "Rainbow Candy", "#d75fd4"), F("v-tm2", "Mango Peach", "#fbbf24"), F("v-tm3", "Fresh Mint", "#6fd6f2")],
    isNew: true,
    nicotineStrength: "20 mg/ml",
    relatedSlugs: ["tugboat-evo-4500", "tugboat-ultra-6000"],
  }),

  /* ---------------------------- HQD ---------------------------- */
  P({
    slug: "hqd-cuvie-plus",
    name: "HQD Cuvie Plus",
    brand: "HQD Vape",
    categorySlug: "disposable-vapes",
    model: "Cuvie-Plus",
    tagline: "The pocket icon, upsized — 1200 smooth draws.",
    description:
      "Cuvie Plus is the stick that made HQD a household name in the UAE: slim, silent and reliably smooth with 5 ml of salt nicotine juice. No buttons, no charging — just draw.",
    price: 35,
    compareAtPrice: 42,
    images: [IMG.disposable[0], IMG.disposable2[0]],
    specs: deviceSpecs([
      ["Puff capacity (approx.)", "Up to 1200 draws"],
      ["E-liquid capacity", "5 ml"],
      ["Battery", "950 mAh sealed cell"],
      ["Firing", "Draw-activated"],
      ["Nicotine strength", "20 mg/ml salt"],
    ]),
    variants: [F("v-hc1", "Ice Mint", "#6fd6f2"), F("v-hc2", "Lychee", "#fda4af"), F("v-hc3", "Strawberry Banana", "#fbbf24")],
    featured: true,
    nicotineStrength: "20 mg/ml",
    relatedSlugs: ["hqd-cuvie-box", "hqd-ultima-pro"],
  }),
  P({
    slug: "hqd-cuvie-box",
    name: "HQD Cuvie Box",
    brand: "HQD Vape",
    categorySlug: "disposable-vapes",
    model: "Cuvie-Box",
    tagline: "Cuvie comfort with a 5500-draw box tank.",
    description:
      "Cuvie Box keeps the family's smooth draw and scales everything else: a 15 ml tank, rechargeable cell and a soft rectangular shell that survives pockets.",
    price: 55,
    images: [IMG.disposable[1], IMG.disposable2[1]],
    specs: deviceSpecs([
      ["Puff capacity (approx.)", "Up to 5500 draws"],
      ["E-liquid capacity", "15 ml"],
      ["Battery", "650 mAh, USB-C rechargeable"],
      ["Nicotine strength", "20 mg/ml salt"],
    ]),
    variants: [F("v-hb1", "Black Ice", "#6fd6f2"), F("v-hb2", "Passionfruit", "#fbbf24"), F("v-hb3", "Peach Mango", "#fda4af")],
    nicotineStrength: "20 mg/ml",
    relatedSlugs: ["hqd-cuvie-plus", "hqd-ultima-pro"],
  }),
  P({
    slug: "hqd-ultima-pro",
    name: "HQD Ultima Pro 7000",
    brand: "HQD Vape",
    categorySlug: "disposable-vapes",
    model: "Ultima-Pro",
    tagline: "Seven thousand draws with dual-mesh flavour.",
    description:
      "Ultima Pro is HQD's long-haul flagship — an 18 ml tank, dual mesh coil and LED battery indicator in an anodised shell. The draw stays characteristically quiet and smooth.",
    price: 60,
    images: [IMG.disposable[0], IMG.disposable2[1]],
    specs: deviceSpecs([
      ["Puff capacity (approx.)", "Up to 7000 draws"],
      ["E-liquid capacity", "18 ml"],
      ["Battery", "650 mAh, USB-C rechargeable"],
      ["Coil", "Dual mesh"],
      ["Nicotine strength", "20 mg/ml salt"],
    ]),
    variants: [F("v-hu1", "Blueberry Razz", "#93c5fd"), F("v-hu2", "Lemon Mint", "#fde68a"), F("v-hu3", "Vanilla Cola", "#a8763e")],
    nicotineStrength: "20 mg/ml",
    relatedSlugs: ["hqd-cuvie-plus", "hqd-cuvie-box"],
  }),

  /* --------------------------- FUMMO --------------------------- */
  P({
    slug: "fummo-king-6000",
    name: "Fummo King 6000",
    brand: "Fummo Vape",
    categorySlug: "disposable-vapes",
    model: "King-6000",
    tagline: "Marathon 6000 draws with a velvet-smooth salt draw.",
    description:
      "Fummo King is a 6000-draw workhorse: 14 ml tank, rechargeable cell and a coil tuned for a soft, consistent salt hit. Bright anodised shells make it easy to spot in a crowded drawer.",
    price: 50,
    compareAtPrice: 60,
    images: [IMG.disposable[1], IMG.disposable2[0]],
    specs: deviceSpecs([
      ["Puff capacity (approx.)", "Up to 6000 draws"],
      ["E-liquid capacity", "14 ml"],
      ["Battery", "650 mAh, USB-C rechargeable"],
      ["Nicotine strength", "20 mg/ml salt"],
    ]),
    variants: [F("v-fk1", "Grape Ice", "#8b5cf6"), F("v-fk2", "Mint", "#6fd6f2"), F("v-fk3", "Mango Ice", "#fbbf24")],
    featured: true,
    nicotineStrength: "20 mg/ml",
    relatedSlugs: ["fummo-star-8000", "yuoto-thanos-5000"],
  }),
  P({
    slug: "fummo-star-8000",
    name: "Fummo Star 8000",
    brand: "Fummo Vape",
    categorySlug: "disposable-vapes",
    model: "Star-8000",
    tagline: "Eight thousand draws, star-cut shell, cool finish.",
    description:
      "Star 8000 extends the King formula with an 18 ml tank and a faceted star-cut shell. The flavour list leans fruit-with-cool — strawberry watermelon leads the pack.",
    price: 60,
    images: [IMG.disposable[0], IMG.disposable2[1]],
    specs: deviceSpecs([
      ["Puff capacity (approx.)", "Up to 8000 draws"],
      ["E-liquid capacity", "18 ml"],
      ["Battery", "650 mAh, USB-C rechargeable"],
      ["Nicotine strength", "20 mg/ml salt"],
    ]),
    variants: [F("v-fs1", "Strawberry Watermelon", "#fda4af"), F("v-fs2", "Blueberry Sour Raspberry", "#93c5fd"), F("v-fs3", "Fresh Mint", "#6fd6f2")],
    nicotineStrength: "20 mg/ml",
    relatedSlugs: ["fummo-king-6000", "vozol-gear-10000"],
  }),

  /* --------------------------- YUOTO --------------------------- */
  P({
    slug: "yuoto-thanos-5000",
    name: "Yuoto Thanos 5000",
    brand: "Yuoto Vape",
    categorySlug: "disposable-vapes",
    model: "Thanos-5000",
    tagline: "Gem-cut shell, 14 ml tank, five thousand draws.",
    description:
      "Thanos 5000 is the jewel of the Yuoto line — a faceted shell that catches the light, a 14 ml tank and a smooth restricted draw. LED charge feedback keeps the cell honest.",
    price: 50,
    images: [IMG.disposable[1], IMG.disposable2[1]],
    specs: deviceSpecs([
      ["Puff capacity (approx.)", "Up to 5000 draws"],
      ["E-liquid capacity", "14 ml"],
      ["Battery", "650 mAh, USB-C rechargeable"],
      ["Nicotine strength", "20 mg/ml salt"],
    ]),
    variants: [F("v-yt1", "Lush Ice", "#86efac"), F("v-yt2", "Strawberry Watermelon", "#fda4af"), F("v-yt3", "Energy Ice", "#fbbf24")],
    nicotineStrength: "20 mg/ml",
    relatedSlugs: ["yuoto-luscant-3000", "yuoto-5"],
  }),
  P({
    slug: "yuoto-luscant-3000",
    name: "Yuoto Luscant 3000",
    brand: "Yuoto Vape",
    categorySlug: "disposable-vapes",
    model: "Luscant-3000",
    tagline: "Dancing LED base, 3000 sweet draws.",
    description:
      "Luscant lights up as you vape — a dancing LED base under a compact 8 ml shell. The draw is classic Yuoto: soft, sweet and consistent to the end.",
    price: 40,
    images: [IMG.disposable[0], IMG.disposable2[0]],
    specs: deviceSpecs([
      ["Puff capacity (approx.)", "Up to 3000 draws"],
      ["E-liquid capacity", "8 ml"],
      ["Battery", "1200 mAh sealed cell"],
      ["Extras", "Dancing LED base"],
      ["Nicotine strength", "20 mg/ml salt"],
    ]),
    variants: [F("v-yl1", "Watermelon Bubble Gum", "#fda4af"), F("v-yl2", "Peach Ice", "#fbbf24"), F("v-yl3", "Pink Lemonade", "#f9a8d4")],
    nicotineStrength: "20 mg/ml",
    relatedSlugs: ["yuoto-thanos-5000", "yuoto-5"],
  }),
  P({
    slug: "yuoto-5",
    name: "Yuoto 5",
    brand: "Yuoto Vape",
    categorySlug: "disposable-vapes",
    model: "YT-5",
    tagline: "The little five — 2500 draws, pocket-priced.",
    description:
      "Yuoto 5 is the brand's entry hero: 2500 draws, a slim soft-touch shell and the flavour list that made the line famous. The cheapest way to find out why Yuoto re-orders so well.",
    price: 35,
    images: [IMG.disposable[1], IMG.disposable2[0]],
    specs: deviceSpecs([
      ["Puff capacity (approx.)", "Up to 2500 draws"],
      ["E-liquid capacity", "7 ml"],
      ["Battery", "900 mAh sealed cell"],
      ["Nicotine strength", "20 mg/ml salt"],
    ]),
    variants: [F("v-y51", "Blueberry Ice", "#93c5fd"), F("v-y52", "Double Apple", "#a8763e"), F("v-y53", "Classic Cola", "#a16207")],
    nicotineStrength: "20 mg/ml",
    relatedSlugs: ["yuoto-thanos-5000", "yuoto-luscant-3000"],
  }),

  /* ------------------------- VGOD STIG ------------------------- */
  P({
    slug: "vgod-stig-original",
    name: "VGOD Stig Original",
    brand: "VGOD Stig",
    categorySlug: "disposable-vapes",
    model: "Stig-Original",
    tagline: "The original premium disposable — 320 punchy draws.",
    description:
      "The Stig started it all: VGOD's compact sealed stick with tobacco-grade flavour concentration. Mighty Mint and Lush Ice remain two of the most imitated profiles in the industry.",
    price: 25,
    compareAtPrice: 30,
    images: [IMG.disposable[0], IMG.disposable2[1]],
    specs: deviceSpecs([
      ["Puff capacity (approx.)", "Up to 320 draws"],
      ["E-liquid capacity", "1.2 ml"],
      ["Battery", "320 mAh sealed cell"],
      ["Nicotine strength", "50 mg/ml salt"],
    ]),
    variants: [F("v-vs01", "Mighty Mint", "#6fd6f2"), F("v-vs02", "Lush Ice", "#86efac"), F("v-vs03", "Cubano Black", "#a8763e")],
    featured: true,
    nicotineStrength: "50 mg/ml",
    relatedSlugs: ["vgod-stig-xl", "vgod-cubano-60ml"],
  }),
  P({
    slug: "vgod-stig-xl",
    name: "VGOD Stig XL",
    brand: "VGOD Stig",
    categorySlug: "disposable-vapes",
    model: "Stig-XL",
    tagline: "The Stig draw, stretched to 2500 draws.",
    description:
      "Stig XL keeps the original's tight, punchy draw and scales the tank to 6 ml with USB-C recharging. Mango Bomb and Purple Bomb carry the trick-legend heritage.",
    price: 45,
    images: [IMG.disposable[1], IMG.disposable2[0]],
    specs: deviceSpecs([
      ["Puff capacity (approx.)", "Up to 2500 draws"],
      ["E-liquid capacity", "6 ml"],
      ["Battery", "1000 mAh, USB-C rechargeable"],
      ["Nicotine strength", "50 mg/ml salt"],
    ]),
    variants: [F("v-vsxl1", "Mango Bomb", "#fbbf24"), F("v-vsxl2", "Purple Bomb", "#8b5cf6"), F("v-vsxl3", "Tropical Mango", "#fda4af")],
    isNew: true,
    nicotineStrength: "50 mg/ml",
    relatedSlugs: ["vgod-stig-original", "vgod-cubano-60ml"],
  }),

  /* ------------------------- MASKKING -------------------------- */
  P({
    slug: "maskking-high-pro",
    name: "Maskking High Pro",
    brand: "Maskking Vape",
    categorySlug: "disposable-vapes",
    model: "High-Pro",
    tagline: "Silky MTL draw, 2500 draws, quietly premium.",
    description:
      "High Pro is the region's silky-draw benchmark: a soft airflow, matte soft-touch shell and consistent salt delivery across 2500 draws. Understated and endlessly re-ordered.",
    price: 45,
    images: [IMG.disposable[0], IMG.disposable2[0]],
    specs: deviceSpecs([
      ["Puff capacity (approx.)", "Up to 2500 draws"],
      ["E-liquid capacity", "8 ml"],
      ["Battery", "1000 mAh sealed cell"],
      ["Finish", "Soft-touch matte"],
      ["Nicotine strength", "20 mg/ml salt"],
    ]),
    variants: [F("v-mh1", "Cool Mint", "#6fd6f2"), F("v-mh2", "Mango", "#fbbf24"), F("v-mh3", "Lychee Ice", "#fda4af")],
    nicotineStrength: "20 mg/ml",
    relatedSlugs: ["maskking-high-gt", "maskking-epic-7000"],
  }),
  P({
    slug: "maskking-high-gt",
    name: "Maskking High GT",
    brand: "Maskking Vape",
    categorySlug: "disposable-vapes",
    model: "High-GT",
    tagline: "The GT upgrade — 3500 draws, turbo airflow.",
    description:
      "High GT adds a turbo airflow ring and a bigger 10 ml tank to the High formula. Grape Ice and Watermelon Bomb are the house favourites.",
    price: 50,
    compareAtPrice: 58,
    images: [IMG.disposable[1], IMG.disposable2[1]],
    specs: deviceSpecs([
      ["Puff capacity (approx.)", "Up to 3500 draws"],
      ["E-liquid capacity", "10 ml"],
      ["Battery", "1200 mAh sealed cell"],
      ["Airflow", "Adjustable ring"],
      ["Nicotine strength", "20 mg/ml salt"],
    ]),
    variants: [F("v-mg1", "Watermelon Bomb", "#fda4af"), F("v-mg2", "Grape Ice", "#8b5cf6"), F("v-mg3", "Cola Ice", "#a16207")],
    nicotineStrength: "20 mg/ml",
    relatedSlugs: ["maskking-high-pro", "maskking-epic-7000"],
  }),
  P({
    slug: "maskking-epic-7000",
    name: "Maskking Epic 7000",
    brand: "Maskking Vape",
    categorySlug: "disposable-vapes",
    model: "Epic-7000",
    tagline: "Epic capacity — 7000 draws with a mesh tank.",
    description:
      "Epic 7000 scales the silky Maskking draw to a 20 ml mesh-coil tank with USB-C recharging and a battery window. The flagship of the High family.",
    price: 60,
    images: [IMG.disposable[0], IMG.disposable2[1]],
    specs: deviceSpecs([
      ["Puff capacity (approx.)", "Up to 7000 draws"],
      ["E-liquid capacity", "20 ml"],
      ["Battery", "650 mAh, USB-C rechargeable"],
      ["Nicotine strength", "20 mg/ml salt"],
    ]),
    variants: [F("v-me1", "Strawberry Kiwi", "#f87171"), F("v-me2", "Blue Razz", "#93c5fd"), F("v-me3", "Honeydew", "#86efac")],
    isNew: true,
    nicotineStrength: "20 mg/ml",
    relatedSlugs: ["maskking-high-pro", "maskking-high-gt"],
  }),

  /* ------------------------- SILVAPER -------------------------- */
  P({
    slug: "silvaper-sprite-7000",
    name: "Silvaper Sprite 7000",
    brand: "Silvaper Vape",
    categorySlug: "disposable-vapes",
    model: "Sprite-7000",
    tagline: "Homegrown UAE flavour house — 7000 light draws.",
    description:
      "Sprite 7000 is Silvaper's flagship: a lightweight silver-accented shell, 18 ml tank and Gulf-tuned flavours from Mango Tango to Polar Mint. Smooth, airy and easy to carry all day.",
    price: 55,
    images: [IMG.disposable[1], IMG.disposable2[0]],
    specs: deviceSpecs([
      ["Puff capacity (approx.)", "Up to 7000 draws"],
      ["E-liquid capacity", "18 ml"],
      ["Battery", "650 mAh, USB-C rechargeable"],
      ["Nicotine strength", "20 mg/ml salt"],
    ]),
    variants: [F("v-ss1", "Mango Tango", "#fbbf24"), F("v-ss2", "Berry Blast", "#8b5cf6"), F("v-ss3", "Polar Mint", "#6fd6f2")],
    nicotineStrength: "20 mg/ml",
    relatedSlugs: ["silvaper-max-4500", "silvaper-salt-30ml"],
  }),
  P({
    slug: "silvaper-max-4500",
    name: "Silvaper Max 4500",
    brand: "Silvaper Vape",
    categorySlug: "disposable-vapes",
    model: "Max-4500",
    tagline: "Compact Max hull with double-apple heritage.",
    description:
      "Max 4500 packs the Sprite flavour range into a 12 ml compact shell. Double Apple and Sweet Tobacco nod to the region's shisha roots.",
    price: 45,
    images: [IMG.disposable[0], IMG.disposable2[1]],
    specs: deviceSpecs([
      ["Puff capacity (approx.)", "Up to 4500 draws"],
      ["E-liquid capacity", "12 ml"],
      ["Battery", "650 mAh, USB-C rechargeable"],
      ["Nicotine strength", "20 mg/ml salt"],
    ]),
    variants: [F("v-sm1", "Double Apple", "#a8763e"), F("v-sm2", "Blue Slush", "#93c5fd"), F("v-sm3", "Sweet Tobacco", "#a16207")],
    nicotineStrength: "20 mg/ml",
    relatedSlugs: ["silvaper-sprite-7000", "silvaper-salt-30ml"],
  }),

  /* ------------------------ POD SYSTEMS ------------------------ */
  P({
    slug: "elf-bar-elfa-pro",
    name: "Elf Bar ELFA Pro Pod Kit",
    brand: "Elf Bar",
    categorySlug: "pod-systems",
    model: "ELFA-Pro",
    tagline: "The BC5000 flavour lab, now refillable.",
    description:
      "ELFA Pro is Elf Bar's pre-filled pod platform: a rechargeable aluminium battery stick and snap-in 2 ml pods with mesh coils and the famous flavour list. Swap flavours in seconds.",
    price: 55,
    images: [IMG.pod[0], IMG.pod2[0]],
    specs: deviceSpecs([
      ["Battery", "500 mAh, USB-C rechargeable"],
      ["Pod capacity", "2 ml pre-filled (swap-and-go)"],
      ["Coil", "1.1 Ω mesh (in pod)"],
      ["Chassis", "Aluminium, pocket-sized"],
    ]),
    variants: [
      F("v-epf1", "Blue Razz pods", "#6fd6f2"),
      F("v-epf2", "Cherry pods", "#f87171"),
      F("v-epf3", "Menthol pods", "#bae6fd"),
      F("v-epf4", "Watermelon pods", "#fda4af"),
    ],
    featured: true,
    nicotineStrength: "20 mg/ml",
    relatedSlugs: ["elf-bar-elfa-pro-pods-2pack", "elf-bar-bc5000"],
  }),
  P({
    slug: "geek-bar-wenax-q2",
    name: "Geek Bar Wenax Q2 Pod Kit",
    brand: "Geek Bar",
    categorySlug: "pod-systems",
    model: "Wenax-Q2",
    tagline: "Refillable Wenax engineering in a slimmer shell.",
    description:
      "Wenax Q2 pairs a 1000 mAh cell with 3 ml refillable pods and replaceable Q2 coils. Adjustable airflow and three output levels make it the tinkerer's everyday pod.",
    price: 89,
    images: [IMG.pod[1], IMG.pod2[1]],
    specs: deviceSpecs([
      ["Battery", "1000 mAh, USB-C"],
      ["Pod capacity", "3 ml refillable"],
      ["Coil support", "Q2 0.6 / 0.8 / 1.2 Ω (replaceable)"],
      ["Output", "3 levels"],
      ["Airflow", "Adjustable"],
    ]),
    variants: [C("v-gw1", "Classic Black", "#17171d"), C("v-gw2", "Space Grey", "#94a3b8"), C("v-gw3", "Aurora Green", "#34d399")],
    featured: true,
    relatedSlugs: ["geek-bar-wenax-q2-coils-5pack", "geek-bar-pulse-x"],
  }),
  P({
    slug: "vozol-v-mate-e",
    name: "Vozol V-Mate E Pod Kit",
    brand: "Vozol",
    categorySlug: "pod-systems",
    model: "V-Mate-E",
    tagline: "Gear-grade build, refillable 2.5 ml pod.",
    description:
      "V-Mate E brings Vozol's hardware discipline to refillables: an 800 mAh cell, 2.5 ml top-fill pod and the brand's gear-texture grip. A smart LED reports charge status at a glance.",
    price: 69,
    images: [IMG.pod[0], IMG.pod2[1]],
    specs: deviceSpecs([
      ["Battery", "800 mAh, USB-C"],
      ["Pod capacity", "2.5 ml refillable, top-fill"],
      ["Coil", "1.0 Ω mesh (in pod)"],
      ["Shell", "Gear-texture anti-slip"],
    ]),
    variants: [C("v-vm1", "Midnight Black", "#111118"), C("v-vm2", "Arctic Ice", "#6fd6f2"), C("v-vm3", "Cherry Pink", "#fda4af")],
    relatedSlugs: ["vozol-star-12000", "vozol-gear-10000"],
  }),
  P({
    slug: "lost-mary-4in1-pod-kit",
    name: "Lost Mary 4-in-1 Pod Kit",
    brand: "Lost Mary",
    categorySlug: "pod-systems",
    model: "4-in-1",
    tagline: "Four pre-filled pods, one rotating bay.",
    description:
      "The 4-in-1 holds four 2 ml pods in a rotating bay — spin the dial to switch flavours without carrying four devices. Prefilled pods keep the flavour-lab experience zero-fuss.",
    price: 65,
    images: [IMG.pod[1], IMG.pod2[0]],
    specs: deviceSpecs([
      ["Battery", "850 mAh, USB-C rechargeable"],
      ["Pods", "4 × 2 ml pre-filled (rotating bay)"],
      ["Coil", "1.1 Ω mesh (in pod)"],
      ["Nicotine strength", "20 mg/ml salt"],
    ]),
    variants: [
      F("v-l4b", "Blue Edition", "#6fd6f2"),
      F("v-l4p", "Purple Edition", "#8b5cf6"),
      F("v-l4r", "Red Edition", "#f87171"),
    ],
    isNew: true,
    featured: true,
    nicotineStrength: "20 mg/ml",
    relatedSlugs: ["lost-mary-4in1-pods-2pack", "lost-mary-mo20000-pro"],
  }),

  /* -------------------------- E-LIQUIDS ------------------------ */
  P({
    slug: "al-fakher-salt-30ml",
    name: "Al Fakher Salt 30 ml",
    brand: "Al Fakher Vape",
    categorySlug: "e-liquids",
    model: "AF-SALT-30",
    tagline: "The shisha canon in a bottle, salt-nicotine smooth.",
    description:
      "Al Fakher's bottled salts carry the house profiles — Two Apple, Mint, Melon — into any refillable pod. Balanced 50/50 blends with the brand's famously clean sweetness.",
    price: 59,
    images: [IMG.liquid[0]],
    specs: liquidSpecs([
      ["Volume", "30 ml PET bottle, child-resistant cap"],
      ["Nicotine strengths", "10 / 20 mg/ml salt"],
      ["VG/PG ratio", "50/50"],
    ]),
    variants: [
      F("v-afs1", "Two Apple", "#a8763e"),
      F("v-afs2", "Mint", "#6fd6f2"),
      F("v-afs3", "Melon Ice", "#86efac"),
      N("v-afs-n1", "10 mg/ml"),
      N("v-afs-n2", "20 mg/ml"),
    ],
    featured: true,
    nicotineStrength: "10–20 mg/ml",
    relatedSlugs: ["al-fakher-crown-bar-pro-8000", "silvaper-salt-30ml"],
  }),
  P({
    slug: "vgod-cubano-60ml",
    name: "VGOD Cubano 60 ml",
    brand: "VGOD Stig",
    categorySlug: "e-liquids",
    model: "Cubano-60",
    tagline: "The legendary cigar blend, freebase bottled.",
    description:
      "Cubano is VGOD's flagship freebase line — rich cigar notes wrapped in vanilla and spice, aged for a smooth throat hit. The blend that turned trick legends into a flavour house.",
    price: 85,
    images: [IMG.liquid[1]],
    specs: liquidSpecs([
      ["Volume", "60 ml PET bottle"],
      ["Nicotine strengths", "0 / 3 / 6 mg/ml freebase"],
      ["VG/PG ratio", "70/30"],
    ]),
    variants: [
      F("v-gc1", "Cubano Black", "#a8763e"),
      F("v-gc2", "Cubano Silver", "#e5e7eb"),
      F("v-gc3", "Cubano Gold", "#fbbf24"),
      N("v-gc-n1", "0 mg/ml"),
      N("v-gc-n2", "3 mg/ml"),
      N("v-gc-n3", "6 mg/ml"),
    ],
    featured: true,
    nicotineStrength: "0–6 mg/ml",
    relatedSlugs: ["vgod-stig-original", "vgod-pro-mech-2"],
  }),
  P({
    slug: "silvaper-salt-30ml",
    name: "Silvaper Salt 30 ml",
    brand: "Silvaper Vape",
    categorySlug: "e-liquids",
    model: "SP-SALT-30",
    tagline: "Gulf-palate salts from the homegrown house.",
    description:
      "Silvaper's bottled salt line distils the Sprite flavour range for refillable pods — Blue Slush, Berry Menthol and a surprisingly faithful Classic Tobacco.",
    price: 49,
    images: [IMG.liquid[2]],
    specs: liquidSpecs([
      ["Volume", "30 ml PET bottle, child-resistant cap"],
      ["Nicotine strengths", "10 / 20 mg/ml salt"],
      ["VG/PG ratio", "50/50"],
    ]),
    variants: [
      F("v-sp1", "Blue Slush", "#93c5fd"),
      F("v-sp2", "Berry Menthol", "#8b5cf6"),
      F("v-sp3", "Classic Tobacco", "#a8763e"),
      N("v-sp-n1", "10 mg/ml"),
      N("v-sp-n2", "20 mg/ml"),
    ],
    isNew: true,
    nicotineStrength: "10–20 mg/ml",
    relatedSlugs: ["silvaper-sprite-7000", "al-fakher-salt-30ml"],
  }),

  /* ------------------------ ADVANCED KITS ---------------------- */
  P({
    slug: "vgod-pro-mech-2",
    name: "VGOD Pro Mech 2 Kit",
    brand: "VGOD Stig",
    categorySlug: "advanced-kits",
    model: "Pro-Mech-2",
    tagline: "The trick legend's mech, refined for daily carry.",
    description:
      "The Pro Mech 2 pairs VGOD's competition heritage with modern safety: a hybrid mechanical-style body, hard-hitting parallel 18650 platform and the TrickTank sub-ohm system. For experienced users who understand mech-adjacent hardware.",
    price: 349,
    images: [IMG.kit[0], IMG.kit2[0]],
    specs: deviceSpecs([
      ["Platform", "Hybrid mech-style, single 18650 (sold separately)"],
      ["Tank", "TrickTank 5 ml, bottom airflow"],
      ["Coil support", "0.15 / 0.2 Ω trick coils"],
      ["Chassis", "Brass-contact alloy, engraved panels"],
    ]),
    variants: [C("v-gm1", "Gunmetal", "#475569"), C("v-gm2", "Matte Black", "#17171d"), C("v-gm3", "Chrome", "#e5e7eb")],
    featured: true,
    relatedSlugs: ["vgod-cubano-60ml", "vgod-stig-xl"],
  }),
  P({
    slug: "geek-bar-wenax-m2",
    name: "Geek Bar Wenax M2 Starter Kit",
    brand: "Geek Bar",
    categorySlug: "advanced-kits",
    model: "Wenax-M2",
    tagline: "A proper first kit — adjustable, forgiving, cheap to run.",
    description:
      "The Wenax M2 is the ideal step up from disposables: a 1200 mAh cell, 3 ml refillable pod, replaceable coils and three power levels with smart draw detection. Everything a beginner needs, nothing they don't.",
    price: 99,
    images: [IMG.kit[1], IMG.kit[0]],
    specs: deviceSpecs([
      ["Battery", "1200 mAh, USB-C"],
      ["Pod capacity", "3 ml refillable"],
      ["Coil support", "M-series 0.6 / 0.8 / 1.2 Ω"],
      ["Output", "3 levels + smart draw detection"],
    ]),
    variants: [C("v-wm1", "Iridescent Chrome", "#c7d2fe"), C("v-wm2", "Ink Black", "#17171d")],
    relatedSlugs: ["geek-bar-wenax-q2", "al-fakher-salt-30ml"],
  }),

  /* -------------------- COILS & ACCESSORIES -------------------- */
  P({
    slug: "elf-bar-elfa-pro-pods-2pack",
    name: "ELFA Pro Replacement Pods (2-Pack)",
    brand: "Elf Bar",
    categorySlug: "coils-accessories",
    sku: "MKT-ELFA-POD2",
    tagline: "Snap-in mesh pods for the ELFA Pro battery.",
    description:
      "Genuine ELFA Pro pre-filled pods with integrated 1.1 Ω mesh coils — snap in and vape. Two pods per sealed pack with authenticity QR.",
    price: 35,
    images: [IMG.accessory[0]],
    specs: [
      {
        title: "Pack",
        entries: [
          { label: "Contents", value: "2 pre-filled pods per pack" },
          { label: "Pod capacity", value: "2 ml each" },
          { label: "Nicotine strength", value: "20 mg/ml salt" },
          { label: "Authenticity", value: "QR code on pack" },
        ],
      },
    ],
    variants: [
      F("v-epp1", "Blue Razz", "#6fd6f2"),
      F("v-epp2", "Cherry", "#f87171"),
      F("v-epp3", "Menthol", "#bae6fd"),
      F("v-epp4", "Watermelon", "#fda4af"),
    ],
    nicotineStrength: "20 mg/ml",
    relatedSlugs: ["elf-bar-elfa-pro", "elf-bar-bc5000"],
  }),
  P({
    slug: "geek-bar-wenax-q2-coils-5pack",
    name: "Wenax Q2 Coils (5-Pack)",
    brand: "Geek Bar",
    categorySlug: "coils-accessories",
    sku: "MKT-WENAX-C5",
    tagline: "Genuine Q2 mesh heads, five to a pack.",
    description:
      "Genuine replacement Q2 coils for the Wenax Q2 pod system. Pick the resistance that matches your draw — 0.6 Ω for cloudier restricted-lung, 1.2 Ω for classic MTL.",
    price: 39,
    images: [IMG.accessory[0]],
    specs: [
      {
        title: "Pack",
        entries: [
          { label: "Contents", value: "5 coils per sealed pack" },
          { label: "Resistances", value: "0.6 / 0.8 / 1.2 Ω" },
          { label: "Platform", value: "Geek Bar Wenax Q2" },
        ],
      },
    ],
    variants: [CAP("v-wc1", "0.6 Ω"), CAP("v-wc2", "0.8 Ω"), CAP("v-wc3", "1.2 Ω")],
    relatedSlugs: ["geek-bar-wenax-q2", "geek-bar-wenax-m2"],
  }),
  P({
    slug: "lost-mary-4in1-pods-2pack",
    name: "Lost Mary 4-in-1 Replacement Pods (2-Pack)",
    brand: "Lost Mary",
    categorySlug: "coils-accessories",
    sku: "MKT-LM4-POD2",
    tagline: "Keep all four bays full — genuine 4-in-1 pods.",
    description:
      "Genuine pre-filled pods for the Lost Mary 4-in-1 rotating-bay kit. Two sealed pods per pack in the brand's edition flavour families.",
    price: 45,
    images: [IMG.accessory[2]],
    specs: [
      {
        title: "Pack",
        entries: [
          { label: "Contents", value: "2 pre-filled pods per pack" },
          { label: "Pod capacity", value: "2 ml each" },
          { label: "Nicotine strength", value: "20 mg/ml salt" },
          { label: "Platform", value: "Lost Mary 4-in-1" },
        ],
      },
    ],
    variants: [
      F("v-lmp1", "Blue Edition", "#6fd6f2"),
      F("v-lmp2", "Purple Edition", "#8b5cf6"),
      F("v-lmp3", "Red Edition", "#f87171"),
    ],
    nicotineStrength: "20 mg/ml",
    relatedSlugs: ["lost-mary-4in1-pod-kit", "lost-mary-mo20000-pro"],
  }),
];

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
