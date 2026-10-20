import { NextResponse } from "next/server";
import { searchProducts, suggestProducts } from "@/server/repos/catalog";

/**
 * Legacy read API (kept for compatibility) — backed by the D1 repository.
 */

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const q = (new URL(request.url).searchParams.get("q") ?? "").trim();
    if (!q) {
      return NextResponse.json({ query: "", items: { items: [], total: 0, page: 1, pageSize: 24, hasMore: false }, suggestions: [] });
    }
    const [items, suggestions] = await Promise.all([searchProducts(q, 24), suggestProducts(q, 6)]);
    return NextResponse.json({ query: q, items, suggestions });
  } catch (error) {
    console.error("GET /api/search failed:", error);
    return NextResponse.json({ error: "Unable to run search." }, { status: 500 });
  }
}
