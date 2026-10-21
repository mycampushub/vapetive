import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SectionAtmosphere } from "@/components/atmosphere/section-atmosphere";
import { getCategories, getCategoryBySlugRepo, getProducts } from "@/server/data";
import { breadcrumbJsonLd, canonical, JsonLd } from "@/lib/seo";
import { CategorySortControl } from "./sort-control";

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return (await getCategories()).map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlugRepo(slug);
  // notFound() in metadata (head-blocking) — see products/[slug] note; a
  // streamed-body notFound() would be softened to a 200 by loading.tsx.
  if (!category) notFound();
  const items = (await getProducts()).filter((item) => item.categorySlug === category.slug);
  return {
    title: `${category.name} UAE — Browse ${items.length} products`,
    description: `${category.description} Shop ${items.length} ${category.name.toLowerCase()} from the UAE's leading vape brands — AED pricing, freshness-sealed stock and UAE-wide delivery from Dubai.`,
    ...canonical(`/collections/${category.slug}`),
  };
}

/** Collection detail — every stocked product on one category shelf. */
export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlugRepo(slug);
  if (!category) notFound();

  const items = (await getProducts()).filter((item) => item.categorySlug === category.slug);

  return (
    <section className="relative">
      <SectionAtmosphere variant="violet" intensity={0.45} />
      {/* BreadcrumbList rich result mirrors the visible trail. */}
      <JsonLd
        data={breadcrumbJsonLd([
          { label: "Home", href: "/" },
          { label: "Collections", href: "/collections" },
          { label: category.name },
        ])}
      />
      <PageContainer className="relative z-10">
        <div className="pt-6">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Collections", href: "/collections" },
              { label: category.name },
            ]}
          />
        </div>

        <header className="max-w-2xl pb-10 pt-8">
          <p className="text-label font-medium uppercase tracking-[0.22em] text-violet-soft">Shop collection</p>
          <h1 className="pt-3 text-h1 font-bold">{category.name}</h1>
          <p className="pt-4 text-lead text-muted-foreground">{category.longDescription ?? category.description}</p>
          <div className="flex flex-wrap items-center gap-2 pt-6">
            <span className="inline-flex min-h-9 items-center rounded-full border border-line bg-elevated/45 px-3.5 text-[0.8rem] text-muted-foreground">
              {items.length} {items.length === 1 ? "product" : "products"}
            </span>
            <span className="inline-flex min-h-9 items-center rounded-full border border-line bg-elevated/45 px-3.5 text-[0.8rem] text-muted-foreground">
              Multiple brands
            </span>
          </div>
        </header>

        <CategorySortControl items={items} />

        <div className="flex py-14">
          <Link
            href="/collections"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-5 text-sm text-muted-foreground transition-colors hover:border-violet-glow/50 hover:text-foreground"
            aria-label="Back to all collections"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to collections
          </Link>
        </div>
      </PageContainer>
    </section>
  );
}
