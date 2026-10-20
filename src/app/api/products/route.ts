import { NextResponse } from "next/server";
import { listProducts } from "@/server/repos/catalog";
import type { SortKey } from "@/lib/catalog-sort";

/**
 * Legacy read API (kept for compatibility) — backed by the D1 repository.
 * New integrations should use /api/v1/catalog/products.
 */

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const page = await listProducts({
      brandSlug: searchParams.get("brand") ?? undefined,
      categorySlug: searchParams.get("collection") ?? undefined,
      query: searchParams.get("q") ?? undefined,
      sort: (searchParams.get("sort") as SortKey | null) ?? undefined,
      page: Number(searchParams.get("page") ?? 1) || 1,
      pageSize: Number(searchParams.get("pageSize") ?? 9) || 9,
    });
    return NextResponse.json(page);
  } catch (error) {
    console.error("GET /api/products failed:", error);
    return NextResponse.json({ error: "Unable to list products." }, { status: 500 });
  }
}
