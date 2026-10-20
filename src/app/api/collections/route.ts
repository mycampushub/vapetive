import { NextResponse } from "next/server";
import { listCategories } from "@/server/repos/catalog";

/**
 * Legacy read API (kept for compatibility) — backed by the D1 repository.
 */

export async function GET(): Promise<NextResponse> {
  try {
    const categories = await listCategories();
    return NextResponse.json({ total: categories.length, collections: categories });
  } catch (error) {
    console.error("GET /api/collections failed:", error);
    return NextResponse.json({ error: "Unable to list collections." }, { status: 500 });
  }
}
