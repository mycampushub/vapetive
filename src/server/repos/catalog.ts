/**
 * VAPETIVE — catalog repository (products, categories, brands, search).
 *
 * Maps D1 rows onto the exact UI contracts in src/types (CatalogItem,
 * CatalogCategory, Brand, Paginated). All list endpoints hydrate child
 * collections (images/variants/specs/faqs/related) in bounded IN queries —
 * no N+1 per item.
 */

import { getDb } from "@/server/db/client";
import type {
  Availability,
  Brand,
  CatalogCategory,
  CatalogItem,
  ConformityInfo,
  DocumentRef,
  ItemVariant,
  Paginated,
  SpecificationGroup,
} from "@/types";
import type { SortKey } from "@/lib/catalog-sort";
import { filsToAED } from "@/server/money";

/* ------------------------------ row mappers ------------------------------ */

interface ProductRow {
  id: string;
  slug: string;
  name: string;
  brand_id: string;
  category_id: string;
  sku: string;
  model: string | null;
  tagline: string;
  description: string;
  price_cents: number;
  compare_at_cents: number | null;
  editorial_availability: string | null;
  low_stock_threshold: number;
  is_featured: number;
  is_new: number;
  nicotine_strength: string | null;
  age_restricted: number;
  origin: string | null;
  compatibility_json: string | null;
  conformity_json: string | null;
  warnings_json: string | null;
  published_at: string | null;
  brand_name: string;
  category_slug: string;
  available_qty: number | null;
  variant_unavailable: number | null;
}

function deriveAvailability(row: ProductRow): Availability {
  if (row.editorial_availability === "unavailable") return "unavailable";
  const qty = row.available_qty ?? 0;
  if (qty <= 0) return "out_of_stock";
  if (qty <= row.low_stock_threshold) return "low_stock";
  return "in_stock";
}

function parseJsonArray<T>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

/* --------------------------- child hydration ----------------------------- */

async function hydrate(rows: ProductRow[]): Promise<CatalogItem[]> {
  if (rows.length === 0) return [];
  const db = await getDb();
  const ids = rows.map((r) => r.id);
  const placeholders = ids.map(() => "?").join(",");

  const [imageRows, variantRows, groupRows, faqRows, relatedRows] = await Promise.all([
    db.all<{ product_id: string; url: string; alt: string | null }>(
      `SELECT pi.product_id, m.url, pi.alt
       FROM product_images pi JOIN media_assets m ON m.id = pi.media_asset_id
       WHERE pi.product_id IN (${placeholders})
       ORDER BY pi.product_id, pi.position`,
      ids
    ),
    db.all<{
      id: string;
      product_id: string;
      label: string;
      type: string;
      swatch: string | null;
      meta: string | null;
      available: number;
      price_delta_cents: number;
    }>(
      `SELECT id, product_id, label, type, swatch, meta, available, price_delta_cents
       FROM product_variants WHERE product_id IN (${placeholders}) ORDER BY product_id, position`,
      ids
    ),
    db.all<{ id: string; product_id: string; title: string; label: string; value: string }>(
      `SELECT g.id, g.product_id, g.title, e.label, e.value
       FROM product_spec_groups g
       JOIN product_spec_entries e ON e.group_id = g.id
       WHERE g.product_id IN (${placeholders})
       ORDER BY g.product_id, g.position, e.position`,
      ids
    ),
    db.all<{ product_id: string; question: string; answer: string }>(
      `SELECT product_id, question, answer FROM product_faqs
       WHERE product_id IN (${placeholders}) ORDER BY product_id, position`,
      ids
    ),
    db.all<{ product_id: string; slug: string }>(
      `SELECT r.product_id, p.slug FROM product_related r
       JOIN products p ON p.id = r.related_product_id
       WHERE r.product_id IN (${placeholders}) ORDER BY r.product_id, r.position`,
      ids
    ),
  ]);

  const imagesBy = new Map<string, string[]>();
  for (const img of imageRows) {
    const list = imagesBy.get(img.product_id) ?? [];
    list.push(img.url);
    imagesBy.set(img.product_id, list);
  }

  const variantsBy = new Map<string, ItemVariant[]>();
  for (const v of variantRows) {
    const list = variantsBy.get(v.product_id) ?? [];
    list.push({
      id: v.id,
      label: v.label,
      type: v.type as ItemVariant["type"],
      swatch: v.swatch ?? undefined,
      available: v.available === 1,
      meta: v.meta ?? undefined,
      ...(v.price_delta_cents !== 0 ? { priceDelta: filsToAED(v.price_delta_cents) } : {}),
    });
    variantsBy.set(v.product_id, list);
  }

  const specsBy = new Map<string, SpecificationGroup[]>();
  const groupsByProduct = new Map<string, Map<string, SpecificationGroup>>();
  for (const g of groupRows) {
    let groups = groupsByProduct.get(g.product_id);
    if (!groups) {
      groups = new Map();
      groupsByProduct.set(g.product_id, groups);
    }
    let group = groups.get(g.id);
    if (!group) {
      group = { title: g.title, entries: [] };
      groups.set(g.id, group);
    }
    group.entries.push({ label: g.label, value: g.value });
  }
  for (const [productId, groups] of groupsByProduct) {
    specsBy.set(productId, [...groups.values()]);
  }

  const faqsBy = new Map<string, Array<{ question: string; answer: string }>>();
  for (const f of faqRows) {
    const list = faqsBy.get(f.product_id) ?? [];
    list.push({ question: f.question, answer: f.answer });
    faqsBy.set(f.product_id, list);
  }

  const relatedBy = new Map<string, string[]>();
  for (const r of relatedRows) {
    const list = relatedBy.get(r.product_id) ?? [];
    list.push(r.slug);
    relatedBy.set(r.product_id, list);
  }

  return rows.map((row) => {
    const item: CatalogItem = {
      id: row.id,
      slug: row.slug,
      name: row.name,
      brand: row.brand_name,
      categorySlug: row.category_slug,
      sku: row.sku,
      model: row.model ?? undefined,
      tagline: row.tagline,
      description: row.description,
      price: filsToAED(row.price_cents),
      compareAtPrice: row.compare_at_cents === null ? undefined : filsToAED(row.compare_at_cents),
      images: imagesBy.get(row.id) ?? [],
      specs: specsBy.get(row.id) ?? [],
      variants: variantsBy.get(row.id) ?? [],
      compatibility: parseJsonArray<string>(row.compatibility_json).length
        ? parseJsonArray<string>(row.compatibility_json)
        : undefined,
      origin: row.origin ?? undefined,
      conformity: parseJsonArray<ConformityInfo>(row.conformity_json),
      warnings: parseJsonArray<string>(row.warnings_json),
      documents: [] as DocumentRef[],
      availability: deriveAvailability(row),
      featured: row.is_featured === 1,
      isNew: row.is_new === 1,
      nicotineStrength: row.nicotine_strength ?? undefined,
      ageRestricted: row.age_restricted === 1,
      faqs: faqsBy.get(row.id),
      relatedSlugs: relatedBy.get(row.id),
    };
    return item;
  });
}

/* ------------------------------- categories ------------------------------ */

export async function listCategories(): Promise<CatalogCategory[]> {
  const db = await getDb();
  const rows = await db.all<{
    id: string;
    slug: string;
    name: string;
    description: string;
    long_description: string | null;
    image_url: string | null;
    accent: string;
    featured: number;
    item_count: number;
  }>(
    `SELECT c.*, m.url AS image_url,
            (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS item_count
     FROM categories c LEFT JOIN media_assets m ON m.id = c.image_media_id
     ORDER BY c.position, c.name`
  );
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    longDescription: row.long_description ?? undefined,
    image: row.image_url ?? undefined,
    itemCount: row.item_count,
    featured: row.featured === 1,
    accent: row.accent as CatalogCategory["accent"],
  }));
}

export async function getCategory(slug: string): Promise<CatalogCategory | null> {
  const categories = await listCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}

/* --------------------------------- brands -------------------------------- */

export async function listBrands(): Promise<Brand[]> {
  const db = await getDb();
  const rows = await db.all<{
    id: string;
    slug: string;
    name: string;
    tagline: string;
    blurb: string;
    description: string;
    origin: string | null;
    established: string | null;
    accent: string;
    featured: number;
  }>(`SELECT * FROM brands ORDER BY position, name`);
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    blurb: row.blurb,
    description: row.description,
    origin: row.origin ?? "",
    established: row.established ?? "",
    accent: row.accent as Brand["accent"],
    featured: row.featured === 1,
  }));
}

export async function getBrand(slug: string): Promise<Brand | null> {
  const brands = await listBrands();
  return brands.find((b) => b.slug === slug) ?? null;
}

export async function brandItemCounts(): Promise<Record<string, number>> {
  const db = await getDb();
  const rows = await db.all<{ slug: string; count: number }>(
    `SELECT b.slug, COUNT(p.id) AS count FROM brands b
     LEFT JOIN products p ON p.brand_id = b.id
     GROUP BY b.id ORDER BY b.position`
  );
  return Object.fromEntries(rows.map((r) => [r.slug, r.count]));
}

/* -------------------------------- products ------------------------------- */

const SELECT_PRODUCT = `
  SELECT p.*, b.name AS brand_name, c.slug AS category_slug,
         (
           SELECT COALESCE(SUM(iv.qty_on_hand - iv.qty_reserved), 0)
           FROM inventory iv WHERE iv.product_id = p.id
         ) AS available_qty,
         (SELECT COUNT(*) FROM product_variants pv
           WHERE pv.product_id = p.id AND pv.available = 0) AS variant_unavailable
  FROM products p
  JOIN brands b ON b.id = p.brand_id
  JOIN categories c ON c.id = p.category_id
`;

const SORT_SQL: Record<SortKey, string> = {
  featured: `p.is_featured DESC, p.published_at DESC, p.name ASC`,
  "price-asc": `p.price_cents ASC, p.name ASC`,
  "price-desc": `p.price_cents DESC, p.name ASC`,
  newest: `p.published_at DESC, p.name ASC`,
  "name-asc": `p.name COLLATE NOCASE ASC`,
  "name-desc": `p.name COLLATE NOCASE DESC`,
};

export interface CatalogQueryInput {
  categorySlug?: string;
  brandSlug?: string;
  query?: string;
  sort?: SortKey;
  availability?: CatalogItem["availability"] | "all";
  page?: number;
  pageSize?: number;
}

export async function listProducts(query: CatalogQueryInput = {}): Promise<Paginated<CatalogItem>> {
  const db = await getDb();
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, query.pageSize ?? 9));

  const where: string[] = [`p.published_at IS NOT NULL`];
  const params: unknown[] = [];

  if (query.categorySlug) {
    where.push(`c.slug = ?`);
    params.push(query.categorySlug);
  }
  if (query.brandSlug) {
    where.push(`b.slug = ?`);
    params.push(query.brandSlug);
  }
  if (query.availability && query.availability !== "all") {
    const STOCK = `(SELECT COALESCE(SUM(iv.qty_on_hand - iv.qty_reserved), 0)
                    FROM inventory iv WHERE iv.product_id = p.id)`;
    if (query.availability === "in_stock") {
      where.push(`p.editorial_availability IS NULL AND ${STOCK} > p.low_stock_threshold`);
    } else if (query.availability === "low_stock") {
      where.push(
        `p.editorial_availability IS NULL AND ${STOCK} > 0 AND ${STOCK} <= p.low_stock_threshold`
      );
    } else if (query.availability === "out_of_stock") {
      where.push(`p.editorial_availability IS NULL AND ${STOCK} <= 0`);
    } else if (query.availability === "unavailable") {
      where.push(`p.editorial_availability = 'unavailable'`);
    }
  }
  if (query.query && query.query.trim()) {
    // External-content FTS: resolve ids through the content table via rowid.
    where.push(
      `p.id IN (
         SELECT c.product_id FROM product_fts_idx f
         JOIN product_fts c ON c.rowid = f.rowid
         WHERE product_fts_idx MATCH ?
       )`
    );
    params.push(ftsQuery(query.query.trim()));
  }

  const whereSql = where.join(" AND ");
  // Whitelist the sort key — an unknown value must never reach ORDER BY.
  const sortKey: SortKey = query.sort && query.sort in SORT_SQL ? query.sort : "featured";

  const [totalRow] = await Promise.all([
    db.get<{ count: number }>(
      `SELECT COUNT(*) AS count FROM products p
       JOIN brands b ON b.id = p.brand_id
       JOIN categories c ON c.id = p.category_id
       WHERE ${whereSql}`,
      params
    ),
  ]);
  const total = totalRow?.count ?? 0;

  const rows = await db.all<ProductRow>(
    `${SELECT_PRODUCT} WHERE ${whereSql} ORDER BY ${SORT_SQL[sortKey]} LIMIT ? OFFSET ?`,
    [...params, pageSize, (page - 1) * pageSize]
  );

  const items = await hydrate(rows);
  return {
    items,
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  };
}

export async function getProduct(slug: string): Promise<CatalogItem | null> {
  const db = await getDb();
  const row = await db.get<ProductRow>(`${SELECT_PRODUCT} WHERE p.slug = ?`, [slug]);
  if (!row) return null;
  const [item] = await hydrate([row]);
  return item ?? null;
}

export async function getRelatedProducts(slug: string): Promise<CatalogItem[]> {
  const item = await getProduct(slug);
  if (!item?.relatedSlugs?.length) return [];
  return getProductsBySlugs(item.relatedSlugs);
}

export async function getProductsBySlugs(slugs: string[]): Promise<CatalogItem[]> {
  if (slugs.length === 0) return [];
  const db = await getDb();
  const unique = [...new Set(slugs)];
  // Chunked IN lists — D1 caps one statement at 100 bound parameters, and a
  // large cart can exceed that.
  const items: CatalogItem[] = [];
  for (let i = 0; i < unique.length; i += 90) {
    const chunk = unique.slice(i, i + 90);
    const placeholders = chunk.map(() => "?").join(",");
    const rows = await db.all<ProductRow>(
      `${SELECT_PRODUCT} WHERE p.slug IN (${placeholders})`,
      chunk
    );
    items.push(...(await hydrate(rows)));
  }
  const order = new Map(slugs.map((s, i) => [s, i]));
  return items.sort((a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0));
}

export async function getProductsByIds(ids: string[]): Promise<CatalogItem[]> {
  if (ids.length === 0) return [];
  const db = await getDb();
  const items: CatalogItem[] = [];
  for (let i = 0; i < ids.length; i += 90) {
    const chunk = ids.slice(i, i + 90);
    const placeholders = chunk.map(() => "?").join(",");
    const rows = await db.all<ProductRow>(`${SELECT_PRODUCT} WHERE p.id IN (${placeholders})`, chunk);
    items.push(...(await hydrate(rows)));
  }
  const order = new Map(ids.map((s, i) => [s, i]));
  return items.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

/** FTS query builder: quote each term so user input cannot inject FTS syntax. */
function ftsQuery(input: string): string {
  const terms = input
    .split(/\s+/)
    .map((t) => t.replace(/["'()*:^]/g, "").trim())
    .filter(Boolean)
    .slice(0, 6);
  if (terms.length === 0) return '""';
  return terms.map((t) => `"${t}"*`).join(" AND ");
}

export async function searchProducts(
  query: string,
  pageSize = 24
): Promise<Paginated<CatalogItem>> {
  return listProducts({ query, pageSize, page: 1, sort: "featured" });
}

export interface Suggestion {
  slug: string;
  name: string;
  brand: string;
  category: string;
}

export async function suggestProducts(partial: string, limit = 6): Promise<Suggestion[]> {
  const trimmed = partial.trim();
  if (!trimmed) return [];
  const result = await listProducts({ query: trimmed, pageSize: limit, page: 1 });
  return result.items.map((item) => ({
    slug: item.slug,
    name: item.name,
    brand: item.brand,
    category: item.categorySlug,
  }));
}

export async function allProductSlugs(): Promise<Array<{ slug: string; updated_at: string }>> {
  const db = await getDb();
  return db.all<{ slug: string; updated_at: string }>(
    `SELECT slug, updated_at FROM products WHERE published_at IS NOT NULL`
  );
}

export async function catalogCounts(): Promise<{ products: number; brands: number; categories: number }> {
  const db = await getDb();
  const [p] = await Promise.all([db.get<{ c: number }>(`SELECT COUNT(*) AS c FROM products`)]);
  const [b] = await Promise.all([db.get<{ c: number }>(`SELECT COUNT(*) AS c FROM brands`)]);
  const [c] = await Promise.all([db.get<{ c: number }>(`SELECT COUNT(*) AS c FROM categories`)]);
  return { products: p?.c ?? 0, brands: b?.c ?? 0, categories: c?.c ?? 0 };
}

/** Admin editor lookup: product by database id or slug. */
export async function getProductByIdOrSlug(idOrSlug: string): Promise<CatalogItem | null> {
  const db = await getDb();
  const row = await db.get<{ slug: string }>(
    `SELECT slug FROM products WHERE id = ? OR slug = ?`,
    [idOrSlug, idOrSlug]
  );
  if (!row) return null;
  return getProduct(row.slug);
}
