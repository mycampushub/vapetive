import { withApi, ok } from "@/server/api/guard";
import { listProducts } from "@/server/repos/catalog";

export const GET = withApi({ requirePermission: "catalog.read" }, async ({ request }) => {
  const { searchParams } = new URL(request.url);
  const page = await listProducts({
    query: searchParams.get("q") ?? undefined,
    categorySlug: searchParams.get("category") ?? undefined,
    brandSlug: searchParams.get("brand") ?? undefined,
    page: Number(searchParams.get("page") ?? 1) || 1,
    pageSize: Number(searchParams.get("pageSize") ?? 48) || 48,
  });
  return ok(page.items, {
    pagination: {
      page: page.page,
      pageSize: page.pageSize,
      total: page.total,
      hasMore: page.hasMore,
    },
  });
});
