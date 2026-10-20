import { withApi, ok } from "@/server/api/guard";
import { adminListOrders } from "@/server/repos/orders";

export const GET = withApi({ requirePermission: "orders.read" }, async ({ request }) => {
  const { searchParams } = new URL(request.url);
  const page = await adminListOrders({
    status: searchParams.get("status") ?? undefined,
    search: searchParams.get("q") ?? undefined,
    page: Number(searchParams.get("page") ?? 1) || 1,
    pageSize: Number(searchParams.get("pageSize") ?? 20) || 20,
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
