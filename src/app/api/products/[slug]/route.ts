import { NextResponse } from "next/server";
import { getProduct } from "@/server/repos/catalog";

/**
 * Legacy read API (kept for compatibility) — backed by the D1 repository.
 * New integrations should use /api/v1/catalog/products/:slug.
 */

interface ProductRouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, { params }: ProductRouteContext): Promise<NextResponse> {
  try {
    const { slug } = await params;
    const item = await getProduct(slug);
    if (!item) {
      return NextResponse.json({ error: `No product found for slug "${slug}".` }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (error) {
    console.error("GET /api/products/[slug] failed:", error);
    return NextResponse.json({ error: "Unable to load product." }, { status: 500 });
  }
}
