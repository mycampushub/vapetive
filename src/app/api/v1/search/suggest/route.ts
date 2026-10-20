import { withApi, ok } from "@/server/api/guard";
import { suggestProducts } from "@/server/repos/catalog";

export const GET = withApi({}, async ({ request }) => {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  const suggestions = await suggestProducts(q, 6);
  return ok({ suggestions });
});
