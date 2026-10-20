import { z } from "zod";
import { withApi, ok, fail, ErrorCode } from "@/server/api/guard";
import { getDb } from "@/server/db/client";
import { getProduct } from "@/server/repos/catalog";
import { aedToFils, filsToAED } from "@/server/money";
import { logAudit } from "@/server/audit";

interface ProductAdminRow {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  compare_at_cents: number | null;
  is_featured: number;
  is_new: number;
  editorial_availability: string | null;
  published_at: string | null;
  version: number;
}

async function loadProduct(id: string): Promise<ProductAdminRow | null> {
  const db = await getDb();
  return db.get<ProductAdminRow>(
    `SELECT id, slug, name, price_cents, compare_at_cents, is_featured, is_new,
            editorial_availability, published_at, version
     FROM products WHERE id = ? OR slug = ?`,
    [id, id]
  );
}

export const GET = withApi({ requirePermission: "catalog.read" }, async ({ params }) => {
  const row = await loadProduct(params.id);
  if (!row) return fail(404, ErrorCode.NOT_FOUND, "No product found.");
  const detail = await getProduct(row.slug);
  return ok({
    ...detail,
    price: filsToAED(row.price_cents),
    compareAtPrice: row.compare_at_cents === null ? null : filsToAED(row.compare_at_cents),
    featured: row.is_featured === 1,
    isNew: row.is_new === 1,
    availability: row.editorial_availability === "unavailable" ? "unavailable" : detail?.availability,
    published: row.published_at !== null,
    version: row.version,
  });
});

const patchSchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  tagline: z.string().trim().min(2).max(240).optional(),
  description: z.string().trim().min(2).max(4000).optional(),
  model: z.string().trim().max(80).nullable().optional(),
  price: z.number().min(0).max(100000).optional(),
  compareAtPrice: z.number().min(0).max(100000).nullable().optional(),
  featured: z.boolean().optional(),
  isNew: z.boolean().optional(),
  setOutOfStock: z.boolean().optional(),
  clearOutOfStock: z.boolean().optional(),
  restockQty: z.number().int().min(0).max(9999).optional(),
  publish: z.boolean().optional(),
  expectedVersion: z.number().int().min(1).optional(),
});

/**
 * PATCH /api/v1/admin/products/:id — update price/stock/flags/publish state.
 * Optimistic concurrency via expectedVersion when provided.
 */
export const PATCH = withApi(
  { requirePermission: "catalog.write" },
  async ({ request, params, identity, meta }) => {
    const body = patchSchema.parse(await request.json());
    const db = await getDb();
    const row = await loadProduct(params.id);
    if (!row) return fail(404, ErrorCode.NOT_FOUND, "No product found.");

    if (body.expectedVersion !== undefined && body.expectedVersion !== row.version) {
      return fail(
        409,
        ErrorCode.CONFLICT,
        "This product was just edited by someone else — reload and try again."
      );
    }

    const before = {
      price: filsToAED(row.price_cents),
      compareAtPrice: row.compare_at_cents === null ? null : filsToAED(row.compare_at_cents),
      featured: row.is_featured === 1,
      isNew: row.is_new === 1,
      editorialOutOfStock: row.editorial_availability === "unavailable",
      published: row.published_at !== null,
    };

    const statements: Array<{ sql: string; params?: unknown[] }> = [];

    if (body.name !== undefined) {
      statements.push({ sql: `UPDATE products SET name = ? WHERE id = ?`, params: [body.name, row.id] });
    }
    if (body.tagline !== undefined) {
      statements.push({ sql: `UPDATE products SET tagline = ? WHERE id = ?`, params: [body.tagline, row.id] });
    }
    if (body.description !== undefined) {
      statements.push({ sql: `UPDATE products SET description = ? WHERE id = ?`, params: [body.description, row.id] });
    }
    if (body.model !== undefined) {
      statements.push({ sql: `UPDATE products SET model = ? WHERE id = ?`, params: [body.model, row.id] });
    }
    if (body.price !== undefined) {
      statements.push({ sql: `UPDATE products SET price_cents = ? WHERE id = ?`, params: [aedToFils(body.price), row.id] });
    }
    if (body.compareAtPrice !== undefined) {
      statements.push({
        sql: `UPDATE products SET compare_at_cents = ? WHERE id = ?`,
        params: [body.compareAtPrice === null ? null : aedToFils(body.compareAtPrice), row.id],
      });
    }
    if (body.featured !== undefined) {
      statements.push({ sql: `UPDATE products SET is_featured = ? WHERE id = ?`, params: [body.featured ? 1 : 0, row.id] });
    }
    if (body.isNew !== undefined) {
      statements.push({ sql: `UPDATE products SET is_new = ? WHERE id = ?`, params: [body.isNew ? 1 : 0, row.id] });
    }
    if (body.setOutOfStock) {
      statements.push({ sql: `UPDATE products SET editorial_availability = 'unavailable' WHERE id = ?`, params: [row.id] });
    }
    if (body.clearOutOfStock) {
      statements.push({ sql: `UPDATE products SET editorial_availability = NULL WHERE id = ?`, params: [row.id] });
    }
    if (body.restockQty !== undefined) {
      statements.push({
        sql: `UPDATE inventory SET qty_on_hand = ?, updated_at = ? WHERE product_id = ? AND variant_id = ''`,
        params: [body.restockQty, new Date().toISOString(), row.id],
      });
      statements.push({
        sql: `INSERT INTO inventory (product_id, variant_id, qty_on_hand, qty_reserved, updated_at)
              VALUES (?, '', ?, 0, ?)
              ON CONFLICT(product_id, variant_id) DO UPDATE SET qty_on_hand = excluded.qty_on_hand`,
        params: [row.id, body.restockQty, new Date().toISOString()],
      });
    }
    if (body.publish !== undefined) {
      statements.push({
        sql: `UPDATE products SET published_at = ?, updated_at = ? WHERE id = ?`,
        params: [body.publish ? new Date().toISOString() : null, new Date().toISOString(), row.id],
      });
    }
    statements.push({
      sql: `UPDATE products SET version = version + 1, updated_at = ? WHERE id = ?`,
      params: [new Date().toISOString(), row.id],
    });

    await db.batch(statements);

    // Keep the search index in sync with editorial fields.
    if (body.name !== undefined || body.tagline !== undefined || body.description !== undefined) {
      const fts = await db.get<{ name: string; brand: string; tagline: string; description: string; keywords: string | null }>(
        `SELECT p.name, b.name AS brand, p.tagline, p.description, p.keywords
         FROM products p JOIN brands b ON b.id = p.brand_id WHERE p.id = ?`,
        [row.id]
      );
      if (fts) {
        await db.run(
          `INSERT INTO product_fts (product_id, name, brand, tagline, description, keywords)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(product_id) DO UPDATE SET name = excluded.name, brand = excluded.brand,
             tagline = excluded.tagline, description = excluded.description`,
          [row.id, fts.name, fts.brand, fts.tagline, fts.description, fts.keywords ?? ""]
        );
      }
    }

    await logAudit({
      actorType: "admin",
      actorId: identity!.user.id,
      actorLabel: identity!.user.displayName,
      action: "product.update",
      targetType: "product",
      targetId: row.slug,
      detail: `Updated ${row.name}`,
      before,
      after: body,
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    const fresh = await loadProduct(row.id);
    return ok({
      price: fresh ? filsToAED(fresh.price_cents) : undefined,
      compareAtPrice: fresh ? (fresh.compare_at_cents === null ? null : filsToAED(fresh.compare_at_cents)) : undefined,
      featured: fresh?.is_featured === 1,
      isNew: fresh?.is_new === 1,
      editorialOutOfStock: fresh?.editorial_availability === "unavailable",
      published: fresh?.published_at !== null,
      version: fresh?.version ?? 1,
    });
  }
);
