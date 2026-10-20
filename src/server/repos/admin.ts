/**
 * VAPETIVE — admin repository: dashboard aggregates, customers, RBAC lists,
 * audit queries, staff.
 */

import { getDb } from "@/server/db/client";
import { catalogCounts } from "@/server/repos/catalog";
import { mediaStats } from "@/server/repos/media";
import { listOrdersForUser } from "@/server/repos/orders";
import type { AdminCustomer, AdminRole, AuditEvent, AuditSeverity, OrderSummary, SupportTicket } from "@/types";

export interface AdminOverviewData {
  mediaAssets: number;
  catalogRecords: number;
  brands: number;
  customers: number;
  orders: number;
  openTickets: number;
  recentActivity: AuditEvent[];
}

export async function adminOverview(): Promise<AdminOverviewData> {
  const db = await getDb();
  const [counts, media, customerCount, orderCount, tickets, activity] = await Promise.all([
    catalogCounts(),
    mediaStats(),
    db.get<{ c: number }>(`SELECT COUNT(*) AS c FROM users`),
    db.get<{ c: number }>(`SELECT COUNT(*) AS c FROM orders`),
    db.get<{ c: number }>(
      `SELECT COUNT(*) AS c FROM tickets WHERE status IN ('open','pending')`
    ),
    db.all<Record<string, unknown>>(
      `SELECT * FROM audit_events ORDER BY at DESC LIMIT 5`
    ),
  ]);
  return {
    mediaAssets: media.total,
    catalogRecords: counts.products,
    brands: counts.brands,
    customers: customerCount?.c ?? 0,
    orders: orderCount?.c ?? 0,
    openTickets: tickets?.c ?? 0,
    recentActivity: activity.map(mapAudit),
  };
}

function mapAudit(row: Record<string, unknown>): AuditEvent {
  return {
    id: row.id as string,
    at: row.at as string,
    actor: row.actor_label as string,
    action: row.action as string,
    target: row.target_id as string,
    severity: row.severity as AuditSeverity,
    detail: row.detail as string,
    ip: (row.ip as string) ?? undefined,
  };
}

/* -------------------------------- customers ------------------------------- */

export async function adminCustomers(query: {
  search?: string;
  status?: AdminCustomer["status"] | "all";
} = {}): Promise<AdminCustomer[]> {
  const db = await getDb();
  const where: string[] = [`1 = 1`];
  const params: unknown[] = [];
  if (query.status && query.status !== "all") {
    where.push(`u.status = ?`);
    params.push(query.status);
  }
  if (query.search) {
    where.push(`(u.display_name LIKE ? OR u.email LIKE ?)`);
    const like = `%${query.search}%`;
    params.push(like, like);
  }

  const rows = await db.all<{
    id: string;
    display_name: string;
    email: string;
    status: string;
    created_at: string;
    orders_count: number;
    privacy_request: string | null;
    tickets_count: number;
    roles_count: number;
  }>(
    `SELECT u.id, u.display_name, u.email, u.status, u.created_at,
            (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS orders_count,
            (SELECT kind FROM privacy_requests pr WHERE pr.user_id = u.id AND pr.status != 'completed'
             ORDER BY pr.requested_at DESC LIMIT 1) AS privacy_request,
            (SELECT COUNT(*) FROM tickets t WHERE t.user_id = u.id) AS tickets_count,
            (SELECT COUNT(*) FROM user_roles ur WHERE ur.user_id = u.id) AS roles_count
     FROM users u
     WHERE ${where.join(" AND ")}
     ORDER BY u.created_at DESC`,
    params
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.display_name,
    email: row.email,
    status: row.status as AdminCustomer["status"],
    joinedAt: row.created_at,
    ordersCount: row.orders_count,
    privacyRequest: (row.privacy_request as AdminCustomer["privacyRequest"]) ?? null,
    supportTickets: row.tickets_count,
  }));
}

export async function adminCustomer(id: string): Promise<AdminCustomer | null> {
  const all = await adminCustomers();
  return all.find((c) => c.id === id) ?? null;
}

export async function setCustomerStatus(
  userId: string,
  status: AdminCustomer["status"]
): Promise<boolean> {
  const result = await (await getDb()).run(`UPDATE users SET status = ?, updated_at = ? WHERE id = ?`, [
    status,
    new Date().toISOString(),
    userId,
  ]);
  return result.changes > 0;
}

/* ---------------------------------- roles --------------------------------- */

export async function adminRoles(): Promise<AdminRole[]> {
  const db = await getDb();
  const rows = await db.all<{
    id: string;
    slug: string;
    name: string;
    description: string;
    is_system: number;
    permission_slugs: string | null;
    members: number;
  }>(
    `SELECT r.*, 
            (SELECT GROUP_CONCAT(permission_slug, ',') FROM role_permissions rp WHERE rp.role_id = r.id) AS permission_slugs,
            (SELECT COUNT(*) FROM user_roles ur WHERE ur.role_id = r.id) AS members
     FROM roles r ORDER BY r.name`
  );
  return rows.map((row) => ({
    id: row.slug,
    name: row.name,
    description: row.description,
    permissions: row.permission_slugs ? row.permission_slugs.split(",") : [],
    members: row.members,
    system: row.is_system === 1,
  }));
}

/* --------------------------------- audit ---------------------------------- */

export async function listAuditEvents(query: {
  severity?: AuditSeverity | "all";
  search?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<PaginatedLike<AuditEvent>> {
  const db = await getDb();
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, query.pageSize ?? 12));
  const where: string[] = [`1 = 1`];
  const params: unknown[] = [];
  if (query.severity && query.severity !== "all") {
    where.push(`severity = ?`);
    params.push(query.severity);
  }
  if (query.search) {
    where.push(`(action LIKE ? OR actor_label LIKE ? OR target_id LIKE ? OR detail LIKE ?)`);
    const like = `%${query.search}%`;
    params.push(like, like, like, like);
  }
  const whereSql = where.join(" AND ");
  const [totalRow, rows] = await Promise.all([
    db.get<{ c: number }>(`SELECT COUNT(*) AS c FROM audit_events WHERE ${whereSql}`, params),
    db.all<Record<string, unknown>>(
      `SELECT * FROM audit_events WHERE ${whereSql} ORDER BY at DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, (page - 1) * pageSize]
    ),
  ]);
  const total = totalRow?.c ?? 0;
  return {
    items: rows.map(mapAudit),
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  };
}

interface PaginatedLike<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/* ---------------------------------- staff --------------------------------- */

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  status: string;
  roles: string[];
  lastLoginAt: string | null;
  createdAt: string;
}

export async function listStaff(): Promise<StaffMember[]> {
  const db = await getDb();
  const rows = await db.all<{
    id: string;
    display_name: string;
    email: string;
    status: string;
    last_login_at: string | null;
    created_at: string;
    role_names: string | null;
  }>(
    `SELECT u.id, u.display_name, u.email, u.status, u.last_login_at, u.created_at,
            (SELECT GROUP_CONCAT(r.name, ', ') FROM user_roles ur JOIN roles r ON r.id = ur.role_id
             WHERE ur.user_id = u.id) AS role_names
     FROM users u
     WHERE EXISTS (SELECT 1 FROM user_roles ur2 WHERE ur2.user_id = u.id)
     ORDER BY u.created_at DESC`
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.display_name,
    email: row.email,
    status: row.status,
    roles: row.role_names ? row.role_names.split(", ") : [],
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
  }));
}

/** Customer detail bundle with REAL attribution: own orders + own tickets. */
export async function adminCustomerBundle(
  id: string
): Promise<{ customer: AdminCustomer; orders: OrderSummary[]; tickets: SupportTicket[] } | null> {
  const customer = await adminCustomer(id);
  if (!customer) return null;
  const db = await getDb();
  const [ordersPage, ticketRows] = await Promise.all([
    listOrdersForUser(customer.id, { pageSize: 3 }),
    db.all<Record<string, unknown>>(
      `SELECT * FROM tickets WHERE user_id = ? OR requester_email = ?
       ORDER BY updated_at DESC LIMIT 10`,
      [customer.id, customer.email]
    ),
  ]);
  const tickets = ticketRows.map((row) => ({
    id: row.id as string,
    reference: row.reference as string,
    subject: row.subject as string,
    category: row.category as string,
    status: row.status as SupportTicket["status"],
    priority: row.priority as SupportTicket["priority"],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    requester: row.requester_name as string,
    messages: [],
  }));
  return { customer, orders: ordersPage.items, tickets };
}
