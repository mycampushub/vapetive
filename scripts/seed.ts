/**
 * VAPETIVE — database seed script.
 *
 * One-time (idempotent) import of the typed mock catalog/content into the
 * backend schema. This is the only place allowed to import `src/data/*` —
 * runtime app code must never touch it.
 *
 * Usage:
 *   bun scripts/seed.ts           # idempotent upsert
 *   bun scripts/seed.ts --reset   # drop the local DB file first
 *
 * Money: mock whole-dirham prices are converted to fils (×100).
 */

import { existsSync, unlinkSync } from "node:fs";
import path from "node:path";
import { getLocalDb, closeLocalDb } from "../src/server/db/local";
import { newId } from "../src/server/ids";
import { aedToFils } from "../src/server/money";
import { hashPassword, unusablePasswordHash } from "../src/server/password";
import { ROLE_SEED, PERMISSION_SLUGS } from "../src/server/rbac";

import { CATALOG_CATEGORIES, CATALOG_ITEMS } from "../src/data/catalog";
import { BRANDS } from "../src/data/brands";
import { SITE_SETTINGS } from "../src/data/site-settings";
import { NAVIGATION_ITEMS } from "../src/data/navigation";
import { LEGAL_DOCUMENTS } from "../src/data/legal";
import { COMPLIANCE_RECORDS, ADMIN_CUSTOMERS, AUDIT_EVENTS } from "../src/data/compliance";
import { MEDIA_ASSETS } from "../src/data/account";
import { SUPPORT_TICKETS } from "../src/data/tickets";
import { FAQS } from "../src/app/(site)/help/faq/faqs";

const RESET = process.argv.includes("--reset");
const DB_FILE = path.join(process.cwd(), "db", "vapetive.db");

if (RESET && existsSync(DB_FILE)) {
  unlinkSync(DB_FILE);
  console.log("• removed existing database");
}

const db = (await getLocalDb()).raw();
const now = new Date().toISOString();

function upsert(table: string, key: string, row: Record<string, unknown>): void {
  const keys = Object.keys(row);
  const cols = keys.join(", ");
  const placeholders = keys.map(() => "?").join(", ");
  const updates = keys
    .filter((k) => k !== key)
    .map((k) => `${k} = excluded.${k}`)
    .join(", ");
  db.prepare(
    `INSERT INTO ${table} (${cols}) VALUES (${placeholders})
     ON CONFLICT(${key}) DO UPDATE SET ${updates}`
  ).run(...Object.values(row));
}

/* --------------------------------- settings -------------------------------- */

console.log("• settings");
const kv = db.prepare(
  `INSERT INTO kv_store (key, value_json, updated_at) VALUES (?, ?, ?)
   ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at`
);
kv.run("settings:site", JSON.stringify(SITE_SETTINGS), now);
kv.run(
  "settings:delivery",
  JSON.stringify({ freeThresholdFils: 20000, standardFeeFils: 2500, expressFeeFils: 3500 }),
  now
);
kv.run("settings:features", JSON.stringify({ maintenance: false, checkoutEnabled: true }), now);

/* --------------------------------- coupons --------------------------------- */

console.log("• coupons");
const COUPONS = [
  {
    code: "WELCOME10",
    type: "percent",
    value: 10,
    min_subtotal_cents: 10000,
    starts_at: null,
    ends_at: null,
    usage_limit: null,
    per_user_limit: 1,
    active: 1,
  },
  {
    code: "AED20OFF",
    type: "fixed",
    value: 2000,
    min_subtotal_cents: 20000,
    starts_at: null,
    ends_at: null,
    usage_limit: 500,
    per_user_limit: null,
    active: 1,
  },
] as const;
for (const coupon of COUPONS) {
  upsert("coupons", "code", { id: newId("cpn"), ...coupon, created_at: now });
}

/* ---------------------------------- media ---------------------------------- */

console.log("• media assets");
const mediaIdByUrl = new Map<string, string>();
for (const asset of MEDIA_ASSETS) {
  if (asset.url === "#") continue;
  const id = newId("med");
  const existing = db.prepare(`SELECT id FROM media_assets WHERE url = ?`).get(asset.url) as
    | { id: string }
    | undefined;
  if (existing) {
    mediaIdByUrl.set(asset.url, existing.id);
    continue;
  }
  const type = asset.type;
  const sizeBytes = asset.sizeLabel?.includes("MB")
    ? parseFloat(asset.sizeLabel) * 1024 * 1024
    : asset.sizeLabel?.includes("KB")
      ? parseFloat(asset.sizeLabel) * 1024
      : 0;
  upsert("media_assets", "url", {
    id,
    filename: asset.name,
    folder: asset.folder,
    type,
    mime: type === "image" ? "image/jpeg" : type === "video" ? "video/mp4" : "application/pdf",
    size_bytes: Math.round(sizeBytes),
    width: asset.dimensions ? parseInt(asset.dimensions.split("×")[0]) : null,
    height: asset.dimensions ? parseInt(asset.dimensions.split("×")[1]) : null,
    alt: asset.alt ?? null,
    status: asset.status,
    r2_key: asset.url,
    url: asset.url,
    uploaded_at: `${asset.uploadedAt}T09:00:00.000Z`,
  });
  mediaIdByUrl.set(asset.url, id);
}

function ensureMediaForUrl(url: string): string | null {
  if (!url) return null;
  const known = mediaIdByUrl.get(url);
  if (known) return known;
  const existing = db.prepare(`SELECT id FROM media_assets WHERE url = ?`).get(url) as
    | { id: string }
    | undefined;
  if (existing) {
    mediaIdByUrl.set(url, existing.id);
    return existing.id;
  }
  const id = newId("med");
  upsert("media_assets", "url", {
    id,
    filename: url.split("/").pop() ?? url,
    folder: url.startsWith("/brand") ? "brand" : "products",
    type: /\.(mp4|webm)$/i.test(url) ? "video" : "image",
    mime: /\.(mp4|webm)$/i.test(url) ? "video/mp4" : "image/jpeg",
    size_bytes: 0,
    width: null,
    height: null,
    alt: null,
    status: "ready",
    r2_key: url,
    url,
    uploaded_at: now,
  });
  mediaIdByUrl.set(url, id);
  return id;
}

/* ---------------------------------- brands --------------------------------- */

console.log("• brands");
const brandIdByName = new Map<string, string>();
BRANDS.forEach((brand, index) => {
  const existing = db.prepare(`SELECT id FROM brands WHERE slug = ?`).get(brand.slug) as
    | { id: string }
    | undefined;
  const id = existing?.id ?? newId("brd");
  brandIdByName.set(brand.name, id);
  upsert("brands", "slug", {
    id,
    slug: brand.slug,
    name: brand.name,
    tagline: brand.tagline,
    blurb: brand.blurb,
    description: brand.description,
    origin: brand.origin,
    established: brand.established,
    accent: brand.accent,
    featured: brand.featured ? 1 : 0,
    position: index,
    created_at: now,
    updated_at: now,
  });
});

/* -------------------------------- categories -------------------------------- */

console.log("• categories");
const categoryIdBySlug = new Map<string, string>();
CATALOG_CATEGORIES.forEach((category, index) => {
  const existing = db.prepare(`SELECT id FROM categories WHERE slug = ?`).get(category.slug) as
    | { id: string }
    | undefined;
  const id = existing?.id ?? newId("cat");
  categoryIdBySlug.set(category.slug, id);
  const imageMediaId = category.image ? ensureMediaForUrl(category.image) : null;
  upsert("categories", "slug", {
    id,
    slug: category.slug,
    name: category.name,
    description: category.description,
    long_description: category.longDescription ?? null,
    image_media_id: imageMediaId,
    accent: category.accent,
    featured: category.featured ? 1 : 0,
    position: index,
    created_at: now,
    updated_at: now,
  });
});

/* --------------------------------- products --------------------------------- */

console.log(`• products (${CATALOG_ITEMS.length})`);
const productIdBySlug = new Map<string, string>();

for (const item of CATALOG_ITEMS) {
  const existing = db.prepare(`SELECT id FROM products WHERE slug = ?`).get(item.slug) as
    | { id: string }
    | undefined;
  const id = existing?.id ?? newId("prd");
  productIdBySlug.set(item.slug, id);

  const brandId = brandIdByName.get(item.brand);
  if (!brandId) throw new Error(`Brand "${item.brand}" not found for product ${item.slug}`);
  const categoryId = categoryIdBySlug.get(item.categorySlug);
  if (!categoryId) throw new Error(`Category "${item.categorySlug}" not found for product ${item.slug}`);

  // Stock policy derived from the mock availability (fils: AED × 100).
  const qty = item.availability === "low_stock" ? 3 : item.availability === "in_stock" ? 40 : 0;

  upsert("products", "slug", {
    id,
    slug: item.slug,
    name: item.name,
    brand_id: brandId,
    category_id: categoryId,
    sku: item.sku,
    model: item.model ?? null,
    tagline: item.tagline,
    description: item.description,
    price_cents: aedToFils(item.price),
    compare_at_cents: item.compareAtPrice ? aedToFils(item.compareAtPrice) : null,
    currency: "AED",
    editorial_availability: item.availability === "unavailable" ? "unavailable" : null,
    low_stock_threshold: 5,
    is_featured: item.featured ? 1 : 0,
    is_new: item.isNew ? 1 : 0,
    nicotine_strength: item.nicotineStrength ?? null,
    age_restricted: item.ageRestricted ? 1 : 0,
    origin: item.origin ?? null,
    compatibility_json: item.compatibility ? JSON.stringify(item.compatibility) : null,
    conformity_json: item.conformity ? JSON.stringify(item.conformity) : null,
    warnings_json: item.warnings ? JSON.stringify(item.warnings) : null,
    keywords: [item.name, item.brand, item.categorySlug, item.sku, item.model ?? ""]
      .join(", ")
      .toLowerCase(),
    published_at: now,
    created_at: now,
    updated_at: now,
    version: 1,
  });

  // Children: rebuild (seed is the catalog source of truth).
  db.prepare(`DELETE FROM product_images WHERE product_id = ?`).run(id);
  db.prepare(`DELETE FROM product_variants WHERE product_id = ?`).run(id);
  db.prepare(`DELETE FROM product_spec_groups WHERE product_id = ?`).run(id);
  db.prepare(`DELETE FROM product_faqs WHERE product_id = ?`).run(id);
  db.prepare(`DELETE FROM product_documents WHERE product_id = ?`).run(id);

  item.images.forEach((url, position) => {
    const mediaId = ensureMediaForUrl(url);
    if (!mediaId) return;
    db.prepare(
      `INSERT INTO product_images (id, product_id, media_asset_id, alt, position) VALUES (?, ?, ?, ?, ?)`
    ).run(newId("img"), id, mediaId, item.images[0] === url ? item.name : null, position);
  });

  item.variants.forEach((variant, position) => {
    db.prepare(
      `INSERT INTO product_variants (id, product_id, label, type, swatch, meta, available, position)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      variant.id,
      id,
      variant.label,
      variant.type,
      variant.swatch ?? null,
      variant.meta ?? null,
      variant.available ? 1 : 0,
      position
    );
  });

  item.specs.forEach((group, gPosition) => {
    const groupId = newId("spg");
    db.prepare(
      `INSERT INTO product_spec_groups (id, product_id, title, position) VALUES (?, ?, ?, ?)`
    ).run(groupId, id, group.title, gPosition);
    group.entries.forEach((entry, ePosition) => {
      db.prepare(
        `INSERT INTO product_spec_entries (id, group_id, label, value, position) VALUES (?, ?, ?, ?, ?)`
      ).run(newId("spe"), groupId, entry.label, entry.value, ePosition);
    });
  });

  (item.faqs ?? []).forEach((faq, position) => {
    db.prepare(
      `INSERT INTO product_faqs (id, product_id, question, answer, position) VALUES (?, ?, ?, ?, ?)`
    ).run(newId("pfq"), id, faq.question, faq.answer, position);
  });

  (item.documents ?? []).forEach((doc) => {
    db.prepare(
      `INSERT INTO product_documents (id, product_id, title, type, href, note) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(newId("pdc"), id, doc.title, doc.type, doc.href ?? null, doc.note ?? null);
  });

  // Inventory (product-level row).
  db.prepare(
    `INSERT INTO inventory (product_id, variant_id, qty_on_hand, qty_reserved, updated_at)
     VALUES (?, '', ?, 0, ?)
     ON CONFLICT(product_id, variant_id) DO UPDATE SET qty_on_hand = excluded.qty_on_hand, updated_at = excluded.updated_at`
  ).run(id, qty, now);

  // FTS row (index maintained by triggers).
  db.prepare(
    `INSERT INTO product_fts (product_id, name, brand, tagline, description, keywords)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(product_id) DO UPDATE SET name = excluded.name, brand = excluded.brand,
       tagline = excluded.tagline, description = excluded.description, keywords = excluded.keywords`
  ).run(id, item.name, item.brand, item.tagline, item.description, [item.name, item.brand, item.categorySlug, item.sku].join(" ").toLowerCase());
}

// Related products (pass 2 — all products now exist).
for (const item of CATALOG_ITEMS) {
  const productId = productIdBySlug.get(item.slug);
  if (!productId) continue;
  db.prepare(`DELETE FROM product_related WHERE product_id = ?`).run(productId);
  (item.relatedSlugs ?? []).forEach((slug, position) => {
    const relatedId = productIdBySlug.get(slug);
    if (!relatedId) return;
    db.prepare(
      `INSERT OR IGNORE INTO product_related (product_id, related_product_id, position) VALUES (?, ?, ?)`
    ).run(productId, relatedId, position);
  });
}

/* ------------------------- catalog sync (declarative purge) ------------------------- */

/**
 * The data files above are the catalog source of truth: drop everything
 * the seed no longer declares so re-running the seed converges the DB
 * to the seed (old products/brands/categories/media/demo-order lines
 * disappear instead of lingering as orphans).
 */
console.log("• catalog sync (purge non-seed rows)");

// 1. Demo orders are rebuilt from the definitions below every run, so
//    their line items always reference products that exist. Payments
//    (and their refunds) RESTRICT order deletion — clear them first.
const seededOrderFilter = `meta_json LIKE '%"seeded":true%'`;
db.prepare(
  `DELETE FROM refunds WHERE payment_id IN (SELECT p.id FROM payments p JOIN orders o ON o.id = p.order_id WHERE o.${seededOrderFilter})`
).run();
db.prepare(
  `DELETE FROM payments WHERE order_id IN (SELECT id FROM orders WHERE ${seededOrderFilter})`
).run();
const purgedOrders = db
  .prepare(`DELETE FROM orders WHERE ${seededOrderFilter}`)
  .run(); // remaining children (items, events, addresses, documents) CASCADE

// 2. Products that are no longer declared (children + cart/save/inventory rows CASCADE;
//    order_items.product_id is SET NULL and keeps its snapshot columns).
const seedSlugs = CATALOG_ITEMS.map((item) => item.slug);
const productPlaceholders = seedSlugs.map(() => "?").join(", ");
const purgedProducts = db
  .prepare(
    `DELETE FROM products WHERE slug NOT IN (${productPlaceholders})`
  )
  .run(...seedSlugs);

// 3. FTS rows orphaned by the product purge (triggers keep the index in step).
db.prepare(`DELETE FROM product_fts WHERE product_id NOT IN (SELECT id FROM products)`).run();

// 4. Brands / categories with no remaining declaration (products are gone,
//    so the RESTRICT foreign keys are satisfied).
const brandSlugs = BRANDS.map((brand) => brand.slug);
const purgedBrands = db
  .prepare(`DELETE FROM brands WHERE slug NOT IN (${brandSlugs.map(() => "?").join(", ")})`)
  .run(...brandSlugs);
const categorySlugs = CATALOG_CATEGORIES.map((category) => category.slug);
const purgedCategories = db
  .prepare(`DELETE FROM categories WHERE slug NOT IN (${categorySlugs.map(() => "?").join(", ")})`)
  .run(...categorySlugs);

// 5. Product-folder media no longer referenced by any catalog row (keeps
//    brand/legal library samples; files in public/ or R2 are untouched).
const purgedMedia = db
  .prepare(
    `DELETE FROM media_assets
     WHERE folder = 'products'
       AND id NOT IN (SELECT media_asset_id FROM product_images)
       AND id NOT IN (SELECT image_media_id FROM categories WHERE image_media_id IS NOT NULL)
       AND id NOT IN (SELECT logo_media_id FROM brands WHERE logo_media_id IS NOT NULL)`
  )
  .run();

console.log(
  `  purge: ${purgedProducts.changes} products, ${purgedBrands.changes} brands, ${purgedCategories.changes} categories, ${purgedMedia.changes} media, ${purgedOrders.changes} demo orders rebuilt`
);

/* -------------------------------- navigation -------------------------------- */

console.log("• navigation");
for (const item of NAVIGATION_ITEMS) {
  const existing = db.prepare(`SELECT id FROM navigation_items WHERE id = ?`).get(item.id) as
    | { id: string }
    | undefined;
  const id = existing?.id ?? item.id;
  upsert("navigation_items", "id", {
    id,
    location: item.location,
    label: item.label,
    href: item.href,
    description: item.description ?? null,
    icon: item.icon ?? null,
    badge: item.badge ?? null,
    sort_order: item.sortOrder,
    enabled: item.enabled ? 1 : 0,
    updated_at: now,
  });
}

/* ----------------------------- legal & compliance ---------------------------- */

console.log("• legal documents");
for (const doc of LEGAL_DOCUMENTS) {
  const existing = db.prepare(`SELECT id FROM legal_documents WHERE slug = ?`).get(doc.slug) as
    | { id: string }
    | undefined;
  const id = existing?.id ?? newId("leg");
  upsert("legal_documents", "slug", {
    id,
    slug: doc.slug,
    title: doc.title,
    version: doc.version,
    effective_date: doc.effectiveDate,
    last_updated: doc.lastUpdated,
    summary: doc.summary,
    status: "published",
    published_at: now,
    updated_at: now,
  });
  db.prepare(`DELETE FROM legal_sections WHERE document_id = ?`).run(id);
  doc.sections.forEach((section, position) => {
    db.prepare(
      `INSERT INTO legal_sections (id, document_id, heading, body_json, list_json, position)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      newId("lgs"),
      id,
      section.heading,
      JSON.stringify(section.paragraphs),
      section.list ? JSON.stringify(section.list) : null,
      position
    );
  });
}

console.log("• compliance records");
for (const record of COMPLIANCE_RECORDS) {
  const existing = db.prepare(`SELECT id FROM compliance_records WHERE id = ?`).get(record.id) as
    | { id: string }
    | undefined;
  upsert("compliance_records", "id", {
    id: existing?.id ?? record.id,
    area: record.area,
    title: record.title,
    description: record.description,
    status: record.status,
    last_reviewed: record.lastReviewed ?? null,
    expires_at: record.expiresAt ?? null,
    owner: record.owner ?? null,
    created_at: now,
    updated_at: now,
  });
}

/* ----------------------------------- FAQs ----------------------------------- */

console.log(`• faqs (${FAQS.length})`);
db.prepare(`DELETE FROM faqs`).run();
FAQS.forEach((faq, index) => {
  db.prepare(
    `INSERT INTO faqs (id, category, question, answer, position, updated_at) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(faq.id, faq.category, faq.question, faq.answer, index, now);
});

/* ------------------------------- RBAC + staff ------------------------------- */

console.log("• roles & permissions");
for (const slug of PERMISSION_SLUGS) {
  db.prepare(
    `INSERT INTO permissions (slug, description) VALUES (?, ?)
     ON CONFLICT(slug) DO UPDATE SET description = excluded.description`
  ).run(slug, slug.replace(".", " — "));
}
for (const role of ROLE_SEED) {
  const existing = db.prepare(`SELECT id FROM roles WHERE slug = ?`).get(role.slug) as
    | { id: string }
    | undefined;
  const id = existing?.id ?? newId("rol");
  upsert("roles", "slug", {
    id,
    slug: role.slug,
    name: role.name,
    description: role.description,
    is_system: 1,
  });
  db.prepare(`DELETE FROM role_permissions WHERE role_id = ?`).run(id);
  const permissions = role.permissions === "*" ? [...PERMISSION_SLUGS] : role.permissions;
  for (const permission of permissions) {
    db.prepare(
      `INSERT OR IGNORE INTO role_permissions (role_id, permission_slug) VALUES (?, ?)`
    ).run(id, permission);
  }
}

console.log("• staff & demo customers");
async function ensureUser(input: {
  email: string;
  displayName: string;
  password?: string;
  roleSlugs?: string[];
  status?: string;
  phone?: string;
}): Promise<string> {
  const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get(input.email) as
    | { id: string }
    | undefined;
  let userId = existing?.id;
  if (!userId) {
    userId = newId("usr");
    const passwordHash = input.password
      ? await hashPassword(input.password)
      : await unusablePasswordHash();
    db.prepare(
      `INSERT INTO users (id, email, password_hash, display_name, phone, status, locale, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'en-AE', ?, ?)`
    ).run(userId, input.email, passwordHash, input.displayName, input.phone ?? null, input.status ?? "active", now, now);
    db.prepare(`INSERT INTO user_preferences (user_id, updated_at) VALUES (?, ?)`).run(userId, now);
  } else if (input.password) {
    const passwordHash = await hashPassword(input.password);
    db.prepare(`UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?`).run(
      passwordHash,
      now,
      userId
    );
  }
  for (const slug of input.roleSlugs ?? []) {
    const role = db.prepare(`SELECT id FROM roles WHERE slug = ?`).get(slug) as { id: string } | undefined;
    if (role) {
      db.prepare(
        `INSERT OR IGNORE INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, ?)`
      ).run(userId, role.id, now);
    }
  }
  return userId;
}

const adminUserId = await ensureUser({
  email: process.env.ADMIN_EMAIL ?? "admin@vapetive.example",
  displayName: "Vapetive Admin",
  password: process.env.ADMIN_PASSWORD ?? "Admin#Vapetive2025",
  roleSlugs: ["super-admin"],
});

const demoCustomerIds: string[] = [];
for (const customer of ADMIN_CUSTOMERS.slice(0, 4)) {
  const userId = await ensureUser({
    email: customer.email,
    displayName: customer.name,
    status: customer.status === "pending" ? "pending" : customer.status,
  });
  demoCustomerIds.push(userId);
}

/* -------------------------------- demo orders ------------------------------- */

console.log("• demo orders");
const demoOrders = [
  {
    reference: "VD-20250112-000001",
    customerIndex: 0,
    status: "delivered",
    placedAt: "2025-01-12T08:24:00.000Z",
    items: [
      { slug: "iqos-iluma-amber", variantLabel: "Amber" as string | null, qty: 2 },
      { slug: "iqos-iluma-black-menthol", variantLabel: "Black Menthol" as string | null, qty: 1 },
    ],
    deliveryMethod: "standard",
    paymentMethod: "cash-on-delivery",
  },
  {
    reference: "VD-20250115-000002",
    customerIndex: 1,
    status: "shipped",
    placedAt: "2025-01-15T11:02:00.000Z",
    items: [{ slug: "iqos-iluma-twilight-pearl", variantLabel: "Twilight Pearl" as string | null, qty: 1 }],
    deliveryMethod: "express",
    paymentMethod: "card-on-delivery",
  },
  {
    reference: "VD-20250118-000003",
    customerIndex: 2,
    status: "processing",
    placedAt: "2025-01-18T15:41:00.000Z",
    items: [
      { slug: "iqos-iluma-purple-wave", variantLabel: "Purple Wave" as string | null, qty: 1 },
      { slug: "iqos-iluma-golden-edition", variantLabel: "Golden Edition" as string | null, qty: 3 },
    ],
    deliveryMethod: "standard",
    paymentMethod: "cash-on-delivery",
  },
];

const demoCustomerRows = demoCustomerIds.map((id) =>
  db.prepare(`SELECT * FROM users WHERE id = ?`).get(id) as
    | { id: string; email: string; display_name: string; phone: string | null }
    | undefined
);

for (const demo of demoOrders) {
  const existing = db.prepare(`SELECT id FROM orders WHERE reference = ?`).get(demo.reference);
  if (existing) continue;
  const customer = demoCustomerRows[demo.customerIndex];
  if (!customer) continue;

  const orderId = newId("ord");
  let subtotalFils = 0;
  const lineItems = demo.items
    .map((item) => {
      const productId = productIdBySlug.get(item.slug);
      if (!productId) return null;
      const product = db.prepare(`SELECT * FROM products WHERE id = ?`).get(productId) as
        | { id: string; name: string; sku: string; price_cents: number }
        | undefined;
      if (!product) return null;
      const brandRow = db.prepare(`SELECT b.name FROM products p JOIN brands b ON b.id = p.brand_id WHERE p.id = ?`).get(productId) as { name: string } | undefined;
      const lineTotal = product.price_cents * item.qty;
      subtotalFils += lineTotal;
      const imageRow = db.prepare(
        `SELECT m.url FROM product_images pi JOIN media_assets m ON m.id = pi.media_asset_id WHERE pi.product_id = ? LIMIT 1`
      ).get(productId) as { url: string } | undefined;
      return {
        productId,
        productName: product.name,
        variantLabel: item.variantLabel,
        brandName: brandRow?.name ?? "",
        sku: product.sku,
        imageUrl: imageRow?.url ?? null,
        unitPriceCents: product.price_cents,
        qty: item.qty,
        lineTotalCents: lineTotal,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const deliveryFeeFils = demo.deliveryMethod === "express" ? 3500 : subtotalFils >= 20000 ? 0 : 2500;
  const totalFils = subtotalFils + deliveryFeeFils;
  const itemCount = lineItems.reduce((sum, item) => sum + item.qty, 0);

  db.prepare(
    `INSERT INTO orders
      (id, reference, user_id, email, phone, full_name, delivery_method, payment_method,
       payment_status, status, subtotal_cents, delivery_fee_cents, discount_cents, total_cents,
       currency, placed_at, created_at, updated_at, meta_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'cod_pending', ?, ?, ?, 0, ?, 'AED', ?, ?, ?, '{"seeded":true}')`
  ).run(
    orderId,
    demo.reference,
    customer.id,
    customer.email,
    customer.phone ?? "+971500000000",
    customer.display_name,
    demo.deliveryMethod,
    demo.paymentMethod,
    demo.status,
    subtotalFils,
    deliveryFeeFils,
    totalFils,
    demo.placedAt,
    demo.placedAt,
    demo.placedAt
  );

  db.prepare(
    `INSERT INTO order_addresses (id, order_id, type, full_name, phone, emirate, city, street)
     VALUES (?, ?, 'shipping', ?, ?, 'Dubai', 'Dubai', 'Al Wasl Road 12')`
  ).run(newId("oad"), orderId, customer.display_name, customer.phone ?? "+971500000000");

  for (const item of lineItems) {
    db.prepare(
      `INSERT INTO order_items
        (id, order_id, product_id, variant_id, product_name, variant_label, brand_name, sku,
         image_url, unit_price_cents, qty, line_total_cents)
       VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      newId("oit"),
      orderId,
      item.productId,
      item.productName,
      item.variantLabel,
      item.brandName,
      item.sku,
      item.imageUrl,
      item.unitPriceCents,
      item.qty,
      item.lineTotalCents
    );
  }

  const flow = ["placed", "confirmed", "processing", "packed", "shipped", "delivered"];
  const upto = flow.indexOf(demo.status);
  for (let i = 0; i <= upto; i += 1) {
    db.prepare(
      `INSERT INTO order_events (id, order_id, type, from_status, to_status, message, actor, at)
       VALUES (?, ?, 'status_change', ?, ?, ?, 'system', ?)`
    ).run(
      newId("oev"),
      orderId,
      i === 0 ? null : flow[i - 1],
      flow[i],
      i === 0 ? "Order received" : `Status updated to ${flow[i]}`,
      demo.placedAt
    );
  }

  db.prepare(
    `INSERT INTO payments (id, order_id, provider, amount_cents, currency, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'AED', 'cod_pending', ?, ?)`
  ).run(newId("pay"), orderId, demo.paymentMethod === "cash-on-delivery" ? "cod" : "card_on_delivery", totalFils, demo.placedAt, demo.placedAt);

  if (demo.status === "delivered") {
    db.prepare(
      `INSERT INTO age_verifications (id, order_id, method, status, verified_at, created_at)
       VALUES (?, ?, 'doorstep_emirates_id', 'verified', ?, ?)`
    ).run(newId("age"), orderId, demo.placedAt, demo.placedAt);
  }
}

/* ----------------------------- demo support tickets -------------------------- */

console.log(`• support tickets (${SUPPORT_TICKETS.length})`);
let ticketSeq = 0;
for (const ticket of SUPPORT_TICKETS) {
  const existing = db.prepare(`SELECT id FROM tickets WHERE id = ?`).get(ticket.id);
  if (existing) continue;
  ticketSeq += 1;
  db.prepare(
    `INSERT INTO tickets
      (id, reference, user_id, requester_name, requester_email, subject, category, status, priority, created_at, updated_at)
     VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    ticket.id,
    ticket.reference,
    ticket.requester,
    ticket.requester.toLowerCase().replace(/\s+/g, ".") + "@example.com",
    ticket.subject,
    ticket.category,
    ticket.status,
    ticket.priority,
    ticket.createdAt,
    ticket.updatedAt
  );
  for (const message of ticket.messages) {
    db.prepare(
      `INSERT INTO ticket_messages (id, ticket_id, author_type, author_id, author_label, body, created_at)
       VALUES (?, ?, ?, NULL, ?, ?, ?)`
    ).run(newId("tm"), ticket.id, message.role, message.author, message.body, message.at);
  }
  for (const note of ticket.internalNotes ?? []) {
    db.prepare(
      `INSERT INTO ticket_notes (id, ticket_id, author_id, body, created_at) VALUES (?, ?, 'system', ?, ?)`
    ).run(newId("tn"), ticket.id, note.body, note.at);
  }
}

/* -------------------------------- audit events ------------------------------- */

console.log("• audit events");
const seededAudit: Array<[string, string, string, string, string]> = [
  ["catalog.write", "product.publish", "Aura 700 restocked — 40 units on hand", "prd", "aura-700"],
  ["settings.write", "settings.update", "Free-delivery threshold kept at AED 200 for launch", "setting", "delivery"],
  ["media.write", "media.upload", "Brand film storyboard uploaded for review", "media", "brand-film-storyboard"],
  ["order.operate", "order.status", "VD-20250112-000001 delivered — ID verified at door", "order", "VD-20250112-000001"],
  ["staff.manage", "role.assign", "Super admin role assigned to Vapetive Admin", "user", "admin@vapetive.example"],
];
for (const [actorLabel, action, detail, targetType, targetId] of seededAudit) {
  const existing = db
    .prepare(`SELECT id FROM audit_events WHERE action = ? AND target_id = ?`)
    .get(action, targetId);
  if (existing) continue;
  db.prepare(
    `INSERT INTO audit_events
      (id, at, actor_type, actor_id, actor_label, action, target_type, target_id, severity, detail)
     VALUES (?, ?, 'admin', ?, ?, ?, ?, ?, 'info', ?)`
  ).run(newId("aud"), now, adminUserId, actorLabel, action, targetType, targetId, detail);
}

/* ---------------------------------- done ------------------------------------ */

const counts = {
  products: (db.prepare(`SELECT COUNT(*) AS c FROM products`).get() as { c: number }).c,
  brands: (db.prepare(`SELECT COUNT(*) AS c FROM brands`).get() as { c: number }).c,
  categories: (db.prepare(`SELECT COUNT(*) AS c FROM categories`).get() as { c: number }).c,
  media: (db.prepare(`SELECT COUNT(*) AS c FROM media_assets`).get() as { c: number }).c,
  users: (db.prepare(`SELECT COUNT(*) AS c FROM users`).get() as { c: number }).c,
  orders: (db.prepare(`SELECT COUNT(*) AS c FROM orders`).get() as { c: number }).c,
  tickets: (db.prepare(`SELECT COUNT(*) AS c FROM tickets`).get() as { c: number }).c,
  faqs: (db.prepare(`SELECT COUNT(*) AS c FROM faqs`).get() as { c: number }).c,
  legal: (db.prepare(`SELECT COUNT(*) AS c FROM legal_documents`).get() as { c: number }).c,
};
console.log("✓ seed complete:", counts);
console.log(`  admin sign-in: ${process.env.ADMIN_EMAIL ?? "admin@vapetive.example"} / ${process.env.ADMIN_PASSWORD ?? "Admin#Vapetive2025"}`);

closeLocalDb();
