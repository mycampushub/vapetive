import { PageContainer } from "@/components/layout/page-container";
import { CardGridSkeleton } from "@/components/shared/loading-indicator";

/** Route-level loading skeleton for product detail pages. */
export default function ProductLoading() {
  return (
    <PageContainer>
      <div aria-busy="true" className="pb-20 pt-10">
        <div className="skeleton-sheen mb-8 h-3 w-64 max-w-full rounded bg-white/[0.05]" />
        <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          <div className="skeleton-sheen aspect-square w-full rounded-2xl border border-line bg-elevated/40" />
          <div className="space-y-4">
            <div className="skeleton-sheen h-4 w-24 rounded bg-white/[0.05]" />
            <div className="skeleton-sheen h-10 w-3/4 rounded bg-white/[0.07]" />
            <div className="skeleton-sheen h-4 w-full max-w-md rounded bg-white/[0.04]" />
            <div className="skeleton-sheen h-8 w-32 rounded bg-white/[0.06]" />
          </div>
        </div>
        <div className="mt-14">
          <p className="sr-only">Loading related products</p>
          <CardGridSkeleton count={4} />
        </div>
      </div>
    </PageContainer>
  );
}
