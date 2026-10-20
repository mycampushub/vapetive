import { NextResponse } from "next/server";
import { listBrands, brandItemCounts } from "@/server/repos/catalog";

/**
 * Legacy read API (kept for compatibility) — backed by the D1 repository.
 */

export async function GET(): Promise<NextResponse> {
  try {
    const [brands, counts] = await Promise.all([listBrands(), brandItemCounts()]);
    return NextResponse.json({
      total: brands.length,
      brands: brands.map((brand) => ({ ...brand, productCount: counts[brand.slug] ?? 0 })),
    });
  } catch (error) {
    console.error("GET /api/brands failed:", error);
    return NextResponse.json({ error: "Unable to list brands." }, { status: 500 });
  }
}
