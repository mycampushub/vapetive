import { PageContainer } from "@/components/layout/page-container";
import { CardGridSkeleton } from "@/components/shared/loading-indicator";

/** Route-level loading skeleton for /collections/<slug>. */
export default function CollectionLoading() {
  return (
    <PageContainer>
      <div aria-busy="true" className="pb-20 pt-12">
        <div className="mb-10 space-y-3">
          <div className="skeleton-sheen h-3 w-44 rounded bg-white/[0.05]" />
          <div className="skeleton-sheen h-12 w-80 max-w-full rounded bg-white/[0.07]" />
          <div className="skeleton-sheen h-4 w-full max-w-xl rounded bg-white/[0.04]" />
        </div>
        <CardGridSkeleton count={8} />
      </div>
    </PageContainer>
  );
}
