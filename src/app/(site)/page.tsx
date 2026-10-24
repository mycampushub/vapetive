import type { Metadata } from "next";
import { BrandCollectionSection } from "@/components/homepage/brand-collection-section";
import { BrandIntroSection } from "@/components/homepage/brand-intro-section";
import { CollectionPreview } from "@/components/homepage/collection-preview";
import { CompanySection } from "@/components/homepage/company-section";
import { DiscoverSection } from "@/components/homepage/discover-section";
import { HeroSection } from "@/components/homepage/hero-section";
import { ProductCategoriesSection } from "@/components/homepage/product-categories-section";
import { SafetySection } from "@/components/homepage/safety-section";
import { SupportSection } from "@/components/homepage/support-section";
import { getBrands, getCategories, getProducts, getSettings } from "@/server/data";

export const metadata: Metadata = {
  title: "#1 Vape Shop in UAE for Instant Online Delivery",
  description:
    "Order heat-not-burn tobacco sticks online in the UAE from Vapetive — the #1 shop for instant delivery. Authentic IQOS ILUMA sticks across multi-origin, Indonesia and Japan lines, priced in AED and delivered UAE-wide from Dubai.",
};

/**
 * Homepage — electric section flow:
 * hero → products → categories → brand collection → discover →
 * the brand → company facts → compliance band → support.
 * Shell chrome (header, footer, bottom nav, ambient smoke) comes from
 * the (site) layout.
 */
export default async function HomePage() {
  const [products, brands, categories, settings] = await Promise.all([
    getProducts(),
    getBrands(),
    getCategories(),
    getSettings(),
  ]);

  return (
    <>
      {/* Hero-only smoke textures — React hoists these <link>s to <head>. */}
      <link rel="preload" as="image" href="/smoke/smoke-plume.png" />
      <link rel="preload" as="image" href="/smoke/smoke-column.png" />
      <HeroSection />
      <CollectionPreview CATALOG_ITEMS={products} />
      <ProductCategoriesSection CATALOG_CATEGORIES={categories} />
      <BrandCollectionSection BRANDS={brands} CATALOG_ITEMS={products} />
      <DiscoverSection />
      <BrandIntroSection />
      <CompanySection />
      <SafetySection />
      <SupportSection SITE_SETTINGS={settings} />
    </>
  );
}
