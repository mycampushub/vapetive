import { withApi, ok } from "@/server/api/guard";
import { searchProducts, suggestProducts } from "@/server/repos/catalog";

export const GET = withApi({}, async ({ request }) => {
  const q = (new URL(request.url).searchParams.get("q") ?? "").trim();
  if (!q) {
    return ok({ query: "", items: { items: [], total: 0, page: 1, pageSize: 24, hasMore: false }, suggestions: [] });
  }
  const [items, suggestions] = await Promise.all([
    searchProducts(q, 24),
    suggestProducts(q, 6),
  ]);
  return ok({ query: q, items, suggestions });
});
