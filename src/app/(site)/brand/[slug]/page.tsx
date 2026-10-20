import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight, LayoutGrid, ScrollText } from "lucide-react";
import { RevealSection } from "@/components/atmosphere/reveal-section";
import { SectionAtmosphere } from "@/components/atmosphere/section-atmosphere";
import { PageContainer, SectionContainer } from "@/components/layout/page-container";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ItemGrid } from "@/components/shared/item-grid";
import { BRAND_ACCENT_GLOW, BRAND_ACCENT_HEX } from "@/components/shared/brand-card";
import { getBrandBySlugRepo, getBrandItems, getBrands, getProducts } from "@/server/data";
import { breadcrumbJsonLd, canonical, JsonLd } from "@/lib/seo";
import type { Brand } from "@/types";

interface BrandPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return (await getBrands()).map((brand) => ({ slug: brand.slug }));
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrandBySlugRepo(slug);
  if (!brand) return { title: "Brand not found", robots: { index: false, follow: false } };
  const count = (await getProducts()).filter((item) => item.brand.toLowerCase() === brand.name.toLowerCase()).length;
  return {
    title: `${brand.name} UAE — ${count} product${count === 1 ? "" : "s"} in stock`,
    description: `${brand.name} — ${brand.tagline}. ${brand.blurb} Authenticity-checked stock, AED pricing and UAE-wide delivery from the VAPETIVE Dubai warehouse.`,
    keywords: [`${brand.name} UAE`, `${brand.name} Dubai`, `buy ${brand.name} online`, "vape shop UAE"],
    ...canonical(`/brand/${brand.slug}`),
  };
}

/** Brand accent → SectionAtmosphere palette. */
const ACCENT_VARIANT: Record<Brand["accent"], "violet" | "ice" | "magenta"> = {
  violet: "violet",
  ice: "ice",
  magenta: "magenta",
};

const chipClass =
  "inline-flex items-center rounded-full border border-line bg-elevated/40 px-3 py-1.5 text-[0.75rem] leading-none text-muted-foreground";

export default async function BrandPage({ params }: BrandPageProps) {
  const { slug } = await params;
  // Server data facade — brand record and its featured-first catalog items.
  const brand = await getBrandBySlugRepo(slug);
  if (!brand) notFound();

  const accent = BRAND_ACCENT_HEX[brand.accent];
  const glow = BRAND_ACCENT_GLOW[brand.accent];
  // Brand items come back featured-first (shared catalog sort).
  const items = await getBrandItems(slug);

  return (
    <PageContainer width="default" className="pb-16 sm:pb-24">
      {/* BreadcrumbList rich result mirrors the visible trail. */}
      <JsonLd
        data={breadcrumbJsonLd([
          { label: "Home", href: "/" },
          { label: "Brands", href: "/brand" },
          { label: brand.name },
        ])}
      />
      <div className="pt-6">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Brands", href: "/brand" }, { label: brand.name }]}
        />
      </div>

      {/* Hero band */}
      <section className="relative">
        <SectionAtmosphere variant={ACCENT_VARIANT[brand.accent]} intensity={0.6} />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 z-0 h-72 w-[44rem] max-w-full -translate-x-1/2 opacity-50"
          style={{ background: `radial-gradient(closest-side, ${glow}, transparent 72%)` }}
        />
        <div className="relative z-10 flex flex-col gap-5 pt-10 sm:pt-14">
          <p className="flex items-center gap-3 text-label font-medium uppercase tracking-[0.22em] text-violet-soft">
            <span
              aria-hidden="true"
              className="anim-led size-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: accent, boxShadow: `0 0 8px ${glow}`, ["--dur" as string]: "2.4s" }}
            />
            Stocked by VAPETIVE
          </p>
          <h1
            className="max-w-3xl font-display text-h1 font-bold"
            style={{ color: accent, textShadow: `0 0 18px ${glow}, 0 0 56px ${glow}` }}
          >
            {brand.name}
          </h1>
          <p className="max-w-2xl text-lead text-muted-foreground">{brand.tagline}</p>
          <ul className="flex flex-wrap items-center gap-1.5" aria-label={`${brand.name} quick facts`}>
            <li className={chipClass}>{brand.origin}</li>
            <li className={chipClass}>est. {brand.established}</li>
            <li className={chipClass}>
              {items.length} {items.length === 1 ? "product" : "products"}
            </li>
          </ul>
        </div>
      </section>

      {/* Brand story */}
      <SectionContainer spacing="sm" className="pt-8">
        <p className="max-w-2xl text-[0.95rem] leading-relaxed text-foreground/85">{brand.description}</p>
      </SectionContainer>

      {/* Products by brand */}
      <SectionContainer spacing="sm" className="pt-0">
        <RevealSection>
          <h2 className="font-display text-h2 font-semibold text-foreground">
            Products by{" "}
            <span style={{ color: accent, textShadow: `0 0 16px ${glow}` }}>{brand.name}</span>
          </h2>
          <p className="mt-2 text-legal text-muted-foreground">
            {items.length} listings · authenticity-checked stock · AED pricing
          </p>
        </RevealSection>
        <div className="mt-8">
          <ItemGrid
            items={items}
            columns={3}
            emptyTitle={`No ${brand.name} products listed yet`}
            emptyBody="This brand's regional range is being curated — check the collections in the meantime."
          />
        </div>
      </SectionContainer>

      {/* Bottom CTA row */}
      <SectionContainer spacing="sm">
        <RevealSection>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/collections"
              className="group flex items-center justify-between gap-3 rounded-2xl border border-line bg-elevated/50 p-5 transition-colors hover:border-violet-glow/40 sm:p-6"
            >
              <span className="flex items-center gap-3">
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-line bg-white/[0.04]"
                  style={{ color: accent }}
                  aria-hidden="true"
                >
                  <LayoutGrid className="size-[1.1rem]" />
                </span>
                <span>
                  <span className="block font-display text-[1.05rem] font-semibold text-foreground">
                    Browse all collections
                  </span>
                  <span className="mt-0.5 block text-[0.78rem] text-muted-foreground">
                    Every product family we stock
                  </span>
                </span>
              </span>
              <ArrowRight
                className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
            <Link
              href="/about"
              className="group flex items-center justify-between gap-3 rounded-2xl border border-line bg-elevated/50 p-5 transition-colors hover:border-violet-glow/40 sm:p-6"
            >
              <span className="flex items-center gap-3">
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-line bg-white/[0.04]"
                  style={{ color: accent }}
                  aria-hidden="true"
                >
                  <ScrollText className="size-[1.1rem]" />
                </span>
                <span>
                  <span className="block font-display text-[1.05rem] font-semibold text-foreground">
                    About VAPETIVE
                  </span>
                  <span className="mt-0.5 block text-[0.78rem] text-muted-foreground">
                    How VAPETIVE curates and checks stock
                  </span>
                </span>
              </span>
              <ArrowUpRight
                className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </div>
        </RevealSection>
      </SectionContainer>
    </PageContainer>
  );
}
