import type { Brand } from "@/types";

/**
 * BRAND DIRECTORY
 * ---------------------------
 * VAPETIVE is a UAE shop, not a device maker. These are the
 * brands stocked on the storefront — every catalog product belongs
 * to exactly one of them and gets its own landing page at /brand/<slug>.
 *
 * The catalog currently stocks the IQOS ILUMA heat-not-burn line only.
 * Brand copy is sample marketing text for the prototype.
 */

export const BRANDS: Brand[] = [
  {
    id: "brn-iqos-iluma",
    slug: "iqos-iluma",
    name: "IQOS ILUMA",
    tagline: "Heat-not-burn tobacco, made for ILUMA only",
    blurb: "Tobacco sticks heated, never burned — exclusively for IQOS ILUMA devices.",
    description:
      "IQOS ILUMA is heated tobacco done differently: induction heating warms the tobacco inside each stick instead of burning it, so there is no ash, no smoke and no lighter. Every stick in the Vapetive range is prepared exclusively for the IQOS ILUMA system, with flavour families spanning smooth toasted tobaccos, cooling menthols and click-capsule Pearl editions sourced across Uzbekistan, Tajikistan, Kazakhstan, Indonesia, Japan and duty-free channels.",
    origin: "Multi-origin",
    established: "2021",
    accent: "ice",
    featured: true,
  },
];

export const brandBySlug = (slug: string) => BRANDS.find((b) => b.slug === slug);
export const brandByName = (name: string) => BRANDS.find((b) => b.name.toLowerCase() === name.toLowerCase());
