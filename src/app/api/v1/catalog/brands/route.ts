import { withApi, ok } from "@/server/api/guard";
import { listBrands, brandItemCounts } from "@/server/repos/catalog";

export const GET = withApi({}, async () => {
  const [brands, counts] = await Promise.all([listBrands(), brandItemCounts()]);
  return ok({
    total: brands.length,
    brands: brands.map((brand) => ({ ...brand, productCount: counts[brand.slug] ?? 0 })),
  });
});
