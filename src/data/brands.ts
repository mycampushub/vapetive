import type { Brand } from "@/types";

/**
 * BRAND DIRECTORY
 * ---------------------------
 * VAPETIVE is a UAE vape shop, not a device maker. These are the
 * brands stocked on the storefront — every catalog product belongs
 * to exactly one of them and gets its own landing page at /brand/<slug>.
 *
 * Brand copy is sample marketing text for the prototype.
 */

export const BRANDS: Brand[] = [
  {
    id: "brn-al-fakher",
    slug: "al-fakher",
    name: "Al Fakher Vape",
    tagline: "The UAE's flavour house goes electric",
    blurb: "Legendary double-apple heritage, reborn as the Crown Bar series.",
    description:
      "Al Fakher built its name on decades of premium flavour craftsmanship in the UAE, and the vape line carries that DNA forward. The Crown Bar family pairs the house's famous shisha profiles — double apple, grape mint, lemon mint — with modern mesh coils and big-count tanks, finished in the brand's unmistakable gold-and-crown packaging.",
    origin: "Dubai, UAE",
    established: "1997",
    accent: "violet",
    featured: true,
  },
  {
    id: "brn-elf-bar",
    slug: "elf-bar",
    name: "Elf Bar",
    tagline: "The disposable that defined the category",
    blurb: "BC5000 and friends — the world's most recognised puff bar.",
    description:
      "Elf Bar turned the disposable vape into a global icon. The BC5000's palm-sized quad-rectangle shape and candy-shelf flavour range became the template the whole industry copied, and the line keeps evolving — CR and Pi series refine the draw, while ELFA Pro brings the same flavour lab to refillable pods.",
    origin: "Shenzhen, China",
    established: "2018",
    accent: "ice",
    featured: true,
  },
  {
    id: "brn-lost-mary",
    slug: "lost-mary",
    name: "Lost Mary",
    tagline: "Playful design, serious flavour labs",
    blurb: "MO, MT and OS series — turbo modes and candy-shop flavour.",
    description:
      "Lost Mary is the flavour-obsessed sibling of the Elf Bar family. Bottle-shaped OS devices, the bean-shaped MO line and the turbo-switching MT series all push juice flavour fidelity first — layered fruit profiles, QS-verified coils and design-forward shells that stand out in a sea of sticks.",
    origin: "Shenzhen, China",
    established: "2022",
    accent: "magenta",
    featured: true,
  },
  {
    id: "brn-geek-bar",
    slug: "geek-bar",
    name: "Geek Bar",
    tagline: "Pulse tech, screens and sky-high counts",
    blurb: "Pulse X power modes and the Wenax refillable family.",
    description:
      "Geek Bar put engineering muscle into disposables: the Pulse series introduced dual power modes, animated screens and up to 25,000 draws, while the Wenax pod family carries the brand's coil know-how into refillable territory. Big counts, bright displays and consistent mesh flavour are the house signature.",
    origin: "Shenzhen, China",
    established: "2015",
    accent: "violet",
    featured: true,
  },
  {
    id: "brn-vozol",
    slug: "vozol",
    name: "Vozol",
    tagline: "Gear-grade builds with turbo switches",
    blurb: "Star, Gear and Vista — big counts, clean coils.",
    description:
      "Vozol approaches disposables like gadgets: textured gear-texture shells, LED juice windows, eco-mode switches and mesh coils tuned for a tight MTL draw. The Star and Vista lines cover the 12,000–20,000 draw range while the V-Mate pods bring the same hardware discipline to refillable systems.",
    origin: "Shenzhen, China",
    established: "2020",
    accent: "ice",
    featured: true,
  },
  {
    id: "brn-tugboat",
    slug: "tugboat",
    name: "Tugboat Vape",
    tagline: "Small hulls, heavy clouds",
    blurb: "Evo and Ultra series — the UAE's everyday pocket vape.",
    description:
      "Tugboat earned its UAE following the honest way: dependable little devices at pocket-money prices. The Evo 4500 became a default recommendation for first-time vapers, and the newer Ultra and Mega hulls scale the same no-fuss draw up to 8000 draws without losing the brand's compact feel.",
    origin: "Malaysia",
    established: "2019",
    accent: "magenta",
    featured: true,
  },
  {
    id: "brn-hqd",
    slug: "hqd",
    name: "HQD Vape",
    tagline: "The Cuvie dynasty",
    blurb: "Pocket-sized icons from 300 to 7000 draws.",
    description:
      "HQD's Cuvie line is one of the most recognisable pocket vapes on the planet — the original stick-format Cuvie and its Plus sibling made 1200-draw disposables a UAE staple. Today the range spans from the tiny Cuvie to the Cuvie Box and Ultima Pro, all tuned for the smooth, quiet draw the brand is known for.",
    origin: "Shenzhen, China",
    established: "2016",
    accent: "violet",
  },
  {
    id: "brn-fummo",
    slug: "fummo",
    name: "Fummo Vape",
    tagline: "King-size tanks, smooth salt draw",
    blurb: "Fummo King and Star — 6000–8000 draw workhorses.",
    description:
      "Fummo focuses on the sweet spot of the UAE market: big e-liquid tanks, rechargeable USB-C cells and salt-nicotine draws that stay smooth from first to last puff. The King and Star series are spec'd for marathon use — 6000 to 8000 draws in brightly anodised shells.",
    origin: "Shenzhen, China",
    established: "2021",
    accent: "ice",
  },
  {
    id: "brn-yuoto",
    slug: "yuoto",
    name: "Yuoto Vape",
    tagline: "Playful shells, marathon cells",
    blurb: "Thanos, Luscant and the famous Yuoto 5.",
    description:
      "Yuoto made its name with personality — gem-cut Thanos shells, the dancing-LED Luscant and the endlessly clonable Yuoto 5. Under the playful exteriors sits serious hardware: large sealed cells, food-grade tanks and a draw calibrated for a satisfying restricted lung hit.",
    origin: "Shenzhen, China",
    established: "2020",
    accent: "magenta",
  },
  {
    id: "brn-vgod-stig",
    slug: "vgod-stig",
    name: "VGOD Stig",
    tagline: "Trick legends, sealed and simple",
    blurb: "The original Stig — Mighty Mint to Cubano heritage.",
    description:
      "VGOD built a global name on cloud competitions and trick vaping, then bottled that heritage into the Stig — the original premium disposable. The sealed line carries the brand's famous flavours: Mighty Mint, Lush Ice and the Cubano series, which also lives on as VGOD's freebase e-liquid line.",
    origin: "Los Angeles, USA",
    established: "2012",
    accent: "violet",
    featured: true,
  },
  {
    id: "brn-maskking",
    slug: "maskking",
    name: "Maskking Vape",
    tagline: "High series, silky draw",
    blurb: "High Pro and High GT — silky MTL with big tanks.",
    description:
      "Maskking's High series is tuned for the silky restricted-lung draw that UAE vapers favour: soft airflow, generous tanks and quietly premium finishes. The High Pro and High GT remain two of the most re-ordered disposables in the region, and the Epic line pushes capacity to 7000 draws.",
    origin: "Shenzhen, China",
    established: "2018",
    accent: "ice",
  },
  {
    id: "brn-silvaper",
    slug: "silvaper",
    name: "Silvaper Vape",
    tagline: "Homegrown UAE vapor, sleek and silver",
    blurb: "Sprite and Max series tuned for Gulf flavour palates.",
    description:
      "Silvaper is one of the UAE's homegrown vapor brands — sleek silver-accented devices with flavour ranges blended specifically for Gulf palates, from double apple to polar mint slush. The Sprite and Max series balance big puff counts with the brand's characteristic lightweight shells.",
    origin: "Dubai, UAE",
    established: "2021",
    accent: "magenta",
  },
];

export const brandBySlug = (slug: string) => BRANDS.find((b) => b.slug === slug);
export const brandByName = (name: string) => BRANDS.find((b) => b.name.toLowerCase() === name.toLowerCase());
