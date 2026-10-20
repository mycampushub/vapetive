import type { AdminCustomer, AdminRole, AuditEvent, OrderSummary, SupportTicket } from "@/types";

/**
 * ADMIN SERVICE (API-backed)
 * --------------------------
 * Every call requires a staff session (RBAC enforced server-side).
 */

const delay = 0;

export interface AdminOverview {
  mediaAssets: number;
  catalogRecords: number;
  brands: number;
  customers: number;
  orders: number;
  openTickets: number;
  recentActivity: AuditEvent[];
}

async function getData<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) {
    throw new Error(
      response.status === 401 || response.status === 403
        ? "Your session does not have access to this area."
        : `Request failed (${response.status})`
    );
  }
  const body = (await response.json()) as { data: T };
  return body.data;
}

export const adminService = {
  async overview(): Promise<AdminOverview> {
    void delay;
    return getData<AdminOverview>("/api/v1/admin/overview");
  },

  async customers(query: { search?: string; status?: AdminCustomer["status"] | "all" } = {}): Promise<AdminCustomer[]> {
    const params = new URLSearchParams();
    if (query.search) params.set("q", query.search);
    if (query.status) params.set("status", query.status);
    const data = await getData<{ items: AdminCustomer[] }>(`/api/v1/admin/customers?${params.toString()}`);
    return data.items;
  },

  async customer(id: string): Promise<AdminCustomer | null> {
    const customers = await this.customers();
    return customers.find((c) => c.id === id) ?? null;
  },

  async roles(): Promise<AdminRole[]> {
    const data = await getData<{ roles: AdminRole[] }>("/api/v1/admin/users");
    return data.roles;
  },

  async auditLog(query: { severity?: AuditEvent["severity"] | "all"; search?: string; page?: number; pageSize?: number } = {}): Promise<AuditEvent[]> {
    const params = new URLSearchParams();
    if (query.severity) params.set("severity", query.severity);
    if (query.search) params.set("q", query.search);
    params.set("page", String(query.page ?? 1));
    params.set("pageSize", String(query.pageSize ?? 24));
    const items = await getData<AuditEvent[]>(`/api/v1/admin/audit-log?${params.toString()}`);
    return items;
  },

  /** Order summaries for the admin orders table. */
  async orders(query: { status?: string; search?: string } = {}): Promise<OrderSummary[]> {
    const params = new URLSearchParams();
    if (query.status) params.set("status", query.status);
    if (query.search) params.set("q", query.search);
    params.set("pageSize", "48");
    const items = await getData<OrderSummary[]>(`/api/v1/admin/orders?${params.toString()}`);
    return items;
  },

  /** Tickets for the admin support screens. */
  async tickets(query: { status?: string; priority?: string; search?: string } = {}): Promise<SupportTicket[]> {
    const params = new URLSearchParams();
    if (query.status) params.set("status", query.status);
    if (query.priority) params.set("priority", query.priority);
    if (query.search) params.set("q", query.search);
    const data = await getData<{ items: SupportTicket[] }>(`/api/v1/admin/tickets?${params.toString()}`);
    return data.items;
  },
};
