/**
 * VAPETIVE — cart repository. The server cart is the single source of truth
 * for pricing and availability; the client store is presentational.
 *
 * Carts are identified by an opaque token in a signed cookie (guests) and
 * attached to the user id once signed in (merge on sign-in).
 */

import { getDb } from "@/server/db/client";
import { newId } from "@/server/ids";
import { getDeliveryConfig } from "@/server/repos/settings";
import { filsToAED } from "@/server/money";
import { getProductsBySlugs } from "@/server/repos/catalog";
import type { CartDetail, CartLine, CartLineDetail, CartTotals, CatalogItem, DeliveryMethod, ItemVariant } from "@/types";

const MAX_QTY = 99;

export interface DeliveryMethodInfo {
  label: string;
  fee: number;
  eta: string;
}

export function deliveryFeeFor(subtotalFils: number, method: DeliveryMethod, config: { freeThresholdFils: number; standardFeeFils: number; expressFeeFils: number }): number {
  if (method === "express") return config.expressFeeFils;
  return subtotalFils >= config.freeThresholdFils ? 0 : config.standardFeeFils;
}

export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, DeliveryMethodInfo> = {
  standard: { label: "Standard delivery", fee: 25, eta: "Arrives in 2–4 days" },
  express: { label: "Express delivery", fee: 35, eta: "Arrives next day" },
};

/* ------------------------------ cart lifecycle ---------------------------- */

export interface CartRow {
  id: string;
  token: string;
  user_id: string | null;
  status: string;
}

export async function findCartByToken(token: string): Promise<CartRow | null> {
  const db = await getDb();
  return db.get<CartRow>(
    `SELECT id, token, user_id, status FROM carts WHERE token = ? AND status = 'active'`,
    [token]
  );
}

export async function findActiveCartForUser(userId: string): Promise<CartRow | null> {
  const db = await getDb();
  return db.get<CartRow>(
    `SELECT id, token, user_id, status FROM carts
     WHERE user_id = ? AND status = 'active'
     ORDER BY updated_at DESC LIMIT 1`,
    [userId]
  );
}

export async function createCart(userId?: string | null): Promise<CartRow> {
  const db = await getDb();
  const now = new Date().toISOString();
  const row: CartRow = {
    id: newId("cart"),
    token: newId("crt"),
    user_id: userId ?? null,
    status: "active",
  };
  await db.run(
    `INSERT INTO carts (id, token, user_id, status, created_at, updated_at, expires_at)
     VALUES (?, ?, ?, 'active', ?, ?, ?)`,
    [row.id, row.token, row.user_id, now, now, new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()]
  );
  return row;
}

/** Get the active cart for a token, or null. */
export async function getActiveCart(token: string | null, userId: string | null): Promise<CartRow | null> {
  if (token) {
    const byToken = await findCartByToken(token);
    if (byToken) return byToken;
  }
  if (userId) {
    return findActiveCartForUser(userId);
  }
  return null;
}

export async function touchCart(cartId: string): Promise<void> {
  await (await getDb()).run(`UPDATE carts SET updated_at = ? WHERE id = ?`, [new Date().toISOString(), cartId]);
}

/* --------------------------------- lines ---------------------------------- */

export async function getRawLines(cartId: string): Promise<CartLine[]> {
  const db = await getDb();
  const rows = await db.all<{ product_slug: string; variant_id: string; qty: number }>(
    `SELECT p.slug AS product_slug, ci.variant_id, ci.qty
     FROM cart_items ci JOIN products p ON p.id = ci.product_id
     WHERE ci.cart_id = ? ORDER BY ci.created_at`,
    [cartId]
  );
  return rows.map((row) => ({
    productSlug: row.product_slug,
    variantId: row.variant_id === "" ? null : row.variant_id,
    qty: row.qty,
  }));
}

export async function addLine(
  cartId: string,
  productId: string,
  variantId: string | null,
  qty: number
): Promise<void> {
  const db = await getDb();
  const safeQty = Math.min(MAX_QTY, Math.max(1, Math.round(qty)));
  // UPSERT: rapid double-adds (two POSTs before either resolves) must merge
  // instead of colliding on UNIQUE(cart_id, product_id, variant_id).
  await db.run(
    `INSERT INTO cart_items (id, cart_id, product_id, variant_id, qty, created_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(cart_id, product_id, variant_id)
     DO UPDATE SET qty = MIN(99, qty + excluded.qty)`,
    [newId("ci"), cartId, productId, variantId ?? "", safeQty, new Date().toISOString()]
  );
  await touchCart(cartId);
}

export async function setLineQty(
  cartId: string,
  productId: string,
  variantId: string | null,
  qty: number
): Promise<void> {
  const db = await getDb();
  if (qty < 1) {
    await removeLine(cartId, productId, variantId);
    return;
  }
  await db.run(
    `UPDATE cart_items SET qty = ? WHERE cart_id = ? AND product_id = ? AND variant_id = ?`,
    [Math.min(MAX_QTY, Math.round(qty)), cartId, productId, variantId ?? ""]
  );
  await touchCart(cartId);
}

export async function removeLine(
  cartId: string,
  productId: string,
  variantId: string | null
): Promise<void> {
  const db = await getDb();
  await db.run(
    `DELETE FROM cart_items WHERE cart_id = ? AND product_id = ? AND variant_id = ?`,
    [cartId, productId, variantId ?? ""]
  );
  await touchCart(cartId);
}

export async function clearCart(cartId: string): Promise<void> {
  const db = await getDb();
  await db.run(`DELETE FROM cart_items WHERE cart_id = ?`, [cartId]);
  await touchCart(cartId);
}

/* ------------------------------ cart resolution ---------------------------- */

const isProductBlocked = (availability: CatalogItem["availability"]): boolean =>
  availability === "out_of_stock" || availability === "unavailable";

export function resolveLine(
  product: CatalogItem,
  line: CartLine
): CartLineDetail | null {
  const variant: ItemVariant | null =
    line.variantId !== null
      ? (product.variants.find((v) => v.id === line.variantId) ?? null)
      : null;

  let blocked = isProductBlocked(product.availability);
  let blockedReason = blocked
    ? product.availability === "out_of_stock"
      ? "Out of stock"
      : "Currently unavailable"
    : undefined;

  if (!blocked && line.variantId !== null && !variant) {
    blocked = true;
    blockedReason = "Option no longer offered";
  }
  if (!blocked && variant && !variant.available) {
    blocked = true;
    blockedReason = variant.meta ?? "Currently unavailable";
  }

  // Variant price deltas are part of the authoritative price.
  const unitPrice = product.price + (variant?.priceDelta ?? 0);
  return {
    key: `${product.slug}:${variant?.id ?? "-"}`,
    product,
    variant,
    qty: line.qty,
    unitPrice,
    lineTotal: unitPrice * line.qty,
    blocked,
    blockedReason,
  };
}

export async function buildCartDetail(lines: CartLine[]): Promise<CartDetail> {
  const products = await getProductsBySlugs(lines.map((l) => l.productSlug));
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  const resolved: CartLineDetail[] = [];
  for (const line of lines) {
    const product = bySlug.get(line.productSlug);
    if (!product) continue; // stale lines are dropped silently
    const detail = resolveLine(product, line);
    if (detail) resolved.push(detail);
  }

  const config = await getDeliveryConfig();
  const purchasableFils = resolved
    .filter((line) => !line.blocked)
    .reduce((sum, line) => sum + Math.round(line.lineTotal * 100), 0);
  const totals: CartTotals = {
    subtotal: filsToAED(purchasableFils),
    deliveryFee: filsToAED(deliveryFeeFor(purchasableFils, "standard", config)),
    total: filsToAED(purchasableFils + deliveryFeeFor(purchasableFils, "standard", config)),
    itemCount: resolved.filter((l) => !l.blocked).reduce((sum, l) => sum + l.qty, 0),
  };

  return {
    lines: resolved,
    totals,
    hasBlocked: resolved.some((line) => line.blocked),
  };
}

export async function getCartDetailForCart(cartId: string): Promise<CartDetail> {
  const lines = await getRawLines(cartId);
  return buildCartDetail(lines);
}

/* ---------------------------------- merge ---------------------------------- */

/** Merge the guest cart into the user's active cart on sign-in. */
export async function mergeGuestCart(guestToken: string, userId: string): Promise<void> {
  const db = await getDb();
  const guest = await findCartByToken(guestToken);
  if (!guest) return;

  const userCart = await findActiveCartForUser(userId);
  if (userCart && userCart.id === guest.id) return; // already attached

  const guestLines = await getRawLines(guest.id);
  const target = userCart ?? (await createCart(userId));

  const products = await getProductsBySlugs(guestLines.map((l) => l.productSlug));
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  for (const line of guestLines) {
    const product = bySlug.get(line.productSlug);
    if (!product) continue;
    const variant =
      line.variantId !== null ? product.variants.find((v) => v.id === line.variantId) : null;
    if (line.variantId !== null && !variant) continue; // stale option
    await addLine(target.id, product.id, variant?.id ?? null, line.qty);
  }

  await db.batch([
    { sql: `UPDATE carts SET status = 'merged' WHERE id = ?`, params: [guest.id] },
    { sql: `DELETE FROM cart_items WHERE cart_id = ?`, params: [guest.id] },
    { sql: `UPDATE carts SET user_id = ? WHERE id = ?`, params: [userId, target.id] },
  ]);
}

/** Attach a cart to a user (used on sign-in when the cart belongs to nobody). */
export async function attachCartToUser(cartId: string, userId: string): Promise<void> {
  await (await getDb()).run(`UPDATE carts SET user_id = ? WHERE id = ?`, [userId, cartId]);
}
