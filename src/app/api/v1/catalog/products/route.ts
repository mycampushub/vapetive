import { withApi, ok } from "@/server/api/guard";
import { listProducts } from "@/server/repos/catalog";
import type { SortKey } from "@/lib/catalog-sort";

export const GET = withApi({}, async ({ request }) => {
  const { searchParams } = new URL(request.url);
  const page = await listProducts({
    categorySlug: searchParams.get("collection") ?? searchParams.get("category") ?? undefined,
    brandSlug: searchParams.get("brand") ?? undefined,
    query: searchParams.get("q") ?? undefined,
    sort: (searchParams.get("sort") as SortKey | null) ?? undefined,
    availability: (searchParams.get("availability") as "in_stock" | "all" | null) ?? undefined,
    page: Number(searchParams.get("page") ?? 1) || 1,
    pageSize: Number(searchParams.get("pageSize") ?? 9) || 9,
  });
  return ok(page, {
    pagination: {
      page: page.page,
      pageSize: page.pageSize,
      total: page.total,
      hasMore: page.hasMore,
    },
  });
});
