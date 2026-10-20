import { PageContainer } from "@/components/layout/page-container";
import { CardGridSkeleton } from "@/components/shared/loading-indicator";

/** Route-level loading skeleton for /brand/<slug>. */
export default function BrandLoading() {
  return (
    <PageContainer>
      <div aria-busy="true" className="pb-20 pt-12">
        <div className="mb-10 space-y-3">
          <div className="skeleton-sheen h-3 w-40 rounded bg-white/[0.05]" />
          <div className="skeleton-sheen h-12 w-72 max-w-full rounded bg-white/[0.07]" />
          <div className="skeleton-sheen h-4 w-full max-w-xl rounded bg-white/[0.04]" />
          <div className="flex gap-2">
            <div className="skeleton-sheen h-8 w-28 rounded-full bg-white/[0.04]" />
            <div className="skeleton-sheen h-8 w-24 rounded-full bg-white/[0.04]" />
            <div className="skeleton-sheen h-8 w-28 rounded-full bg-white/[0.04]" />
          </div>
        </div>
        <CardGridSkeleton count={6} />
      </div>
    </PageContainer>
  );
}
