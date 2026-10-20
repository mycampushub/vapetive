import { LoadingIndicator } from "@/components/shared/loading-indicator";

/**
 * Generic route-level loading state — covers the server-rendered pages that
 * read live data (home, collections index, faq, about, compliance, contact,
 * legal) which don't ship their own specialised skeletons. Pages with
 * bespoke skeletons (discover, search, PDP, brand, collections/[slug])
 * override this file locally.
 */
export default function SiteLoading() {
  return (
    <div className="flex min-h-[60svh] items-center justify-center" role="status" aria-live="polite">
      <LoadingIndicator label="Loading" />
    </div>
  );
}
