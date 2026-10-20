import { withApi, ok } from "@/server/api/guard";
import { listCategories } from "@/server/repos/catalog";

export const GET = withApi({}, async () => {
  const categories = await listCategories();
  return ok({ total: categories.length, collections: categories });
});
