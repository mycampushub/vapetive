import type { AdminCustomer, AdminRole, AuditEvent, ComplianceRecord } from "@/types";

/**
 * MOCK COMPLIANCE RECORDS
 * -----------------------
 * Document inventory for the compliance module. Statuses intentionally
 * mix verified / pending / missing / expired so every UI state is
 * exercised. Presence of this data does not establish compliance.
 */

export const COMPLIANCE_RECORDS: ComplianceRecord[] = [
  {
    id: "cmp-001",
    area: "Product safety",
    title: "Nicotine content test reports",
    description: "Per-batch laboratory reports verifying declared nicotine strength for all e-liquid SKUs.",
    status: "verified",
    lastReviewed: "2024-12-18",
    expiresAt: "2025-06-18",
    owner: "Quality",
    documents: [{ id: "cd-1", title: "Batch test summary Q4-2024", type: "pdf" }],
  },
  {
    id: "cmp-002",
    area: "Packaging",
    title: "Child-resistant closure certification (ISO 8317)",
    description: "Certification for all e-liquid bottles and sealed device outer packaging.",
    status: "verified",
    lastReviewed: "2024-11-02",
    expiresAt: "2026-11-01",
    owner: "Packaging",
    documents: [{ id: "cd-2", title: "ISO 8317 certificate", type: "pdf" }],
  },
  {
    id: "cmp-003",
    area: "Notifications",
    title: "EU CE notification records (ECID)",
    description: "Notification identifiers for all SKUs sold into EU markets.",
    status: "verified",
    lastReviewed: "2025-01-04",
    owner: "Regulatory",
    documents: [{ id: "cd-3", title: "ECID register", type: "web" }],
  },
  {
    id: "cmp-004",
    area: "UAE market",
    title: "UAQ/ESMA conformity file",
    description: "Federal conformity documentation for devices distributed in the UAE.",
    status: "pending",
    lastReviewed: "2024-10-20",
    owner: "Regulatory",
    documents: [],
  },
  {
    id: "cmp-005",
    area: "Marketing",
    title: "Advertising claims review log",
    description: "Sign-off log ensuring no unapproved health claims appear on site or packaging.",
    status: "verified",
    lastReviewed: "2025-01-09",
    expiresAt: "2025-04-09",
    owner: "Compliance",
    documents: [{ id: "cd-4", title: "Claims review log", type: "pdf" }],
  },
  {
    id: "cmp-006",
    area: "Age verification",
    title: "Age-verification provider assessment",
    description: "Vendor and DPIA assessment for the future age-verification integration.",
    status: "missing",
    owner: "Compliance",
    documents: [],
  },
  {
    id: "cmp-007",
    area: "Product safety",
    title: "Battery transport declaration (UN 38.3)",
    description: "Transport test summary for lithium cells shipped as cargo.",
    status: "expired",
    lastReviewed: "2023-12-01",
    expiresAt: "2024-12-01",
    owner: "Logistics",
    documents: [{ id: "cd-5", title: "UN 38.3 summary (2023)", type: "pdf" }],
  },
];

/* ---------------------------- Admin users -------------------------- */

export const ADMIN_CUSTOMERS: AdminCustomer[] = [
  { id: "cus-001", name: "Amira Rahman", email: "amira.r@example.com", status: "active", joinedAt: "2024-03-14", ordersCount: 7, privacyRequest: null, supportTickets: 1 },
  { id: "cus-002", name: "Sana Patel", email: "sana.p@example.com", status: "active", joinedAt: "2024-05-02", ordersCount: 3, privacyRequest: null, supportTickets: 2 },
  { id: "cus-003", name: "Joseph Okafor", email: "j.okafor@example.com", status: "active", joinedAt: "2024-06-21", ordersCount: 12, privacyRequest: "access", supportTickets: 3 },
  { id: "cus-004", name: "Minji Kim", email: "minji.k@example.com", status: "suspended", joinedAt: "2024-08-09", ordersCount: 1, privacyRequest: null, supportTickets: 0 },
  { id: "cus-005", name: "Maya Haddad", email: "maya.h@example.com", status: "active", joinedAt: "2024-09-30", ordersCount: 5, privacyRequest: null, supportTickets: 4 },
  { id: "cus-006", name: "Omar Farsi", email: "omar.f@example.com", status: "pending", joinedAt: "2025-01-02", ordersCount: 0, privacyRequest: null, supportTickets: 1 },
  { id: "cus-007", name: "Layla Ibrahim", email: "layla.i@example.com", status: "active", joinedAt: "2025-01-04", ordersCount: 2, privacyRequest: "deletion", supportTickets: 0 },
  { id: "cus-008", name: "Daniel Cho", email: "d.cho@example.com", status: "active", joinedAt: "2025-01-07", ordersCount: 0, privacyRequest: null, supportTickets: 0 },
];

export const ADMIN_ROLES: AdminRole[] = [
  {
    id: "role-super",
    name: "Super administrator",
    description: "Full access to every module, including roles and settings. Proposed role — not yet enforced by a backend.",
    permissions: ["catalog.*", "media.*", "orders.*", "customers.*", "support.*", "settings.*", "users.*", "audit.read"],
    members: 1,
    system: true,
  },
  {
    id: "role-media",
    name: "Media administrator",
    description: "Manages the media library and product imagery. Proposed role — not yet enforced by a backend.",
    permissions: ["media.*", "catalog.read"],
    members: 2,
    system: false,
  },
  {
    id: "role-catalog",
    name: "Catalog editor",
    description: "Manages categories, brands, products, variants and availability metadata.",
    permissions: ["catalog.*", "media.read"],
    members: 3,
    system: false,
  },
  {
    id: "role-support",
    name: "Support administrator",
    description: "Handles tickets, customer lookups and escalation.",
    permissions: ["support.*", "customers.read", "orders.read"],
    members: 4,
    system: false,
  },
  {
    id: "role-compliance",
    name: "Compliance reviewer",
    description: "Reviews product conformity records and safety documentation.",
    permissions: ["compliance.*", "catalog.read"],
    members: 1,
    system: false,
  },
];

export const AUDIT_EVENTS: AuditEvent[] = [
  { id: "aud-014", at: "2025-01-13T18:42:00+04:00", actor: "maya@vapetive.example", action: "media.uploaded", target: "dune-pro-hero.jpg", severity: "info", detail: "Simulated upload — R2 integration pending.", ip: "94.200.x.x" },
  { id: "aud-013", at: "2025-01-13T16:10:00+04:00", actor: "layla@vapetive.example", action: "catalog.product_updated", target: "Dune Pro 2500", severity: "info", detail: "Availability changed to in_stock." },
  { id: "aud-012", at: "2025-01-13T11:05:00+04:00", actor: "system", action: "compliance.expired_detected", target: "UN 38.3 summary (2023)", severity: "critical", detail: "Battery transport declaration expired on 2024-12-01." },
  { id: "aud-011", at: "2025-01-12T20:31:00+04:00", actor: "omar@vapetive.example", action: "support.ticket_escalated", target: "SUP-1040", severity: "warning", detail: "Courier response pending > 24h." },
  { id: "aud-010", at: "2025-01-12T09:12:00+04:00", actor: "nour@vapetive.example", action: "catalog.brand_updated", target: "Elf Bar", severity: "info", detail: "Featured flag toggled for the storefront wall." },
  { id: "aud-009", at: "2025-01-11T14:48:00+04:00", actor: "layla@vapetive.example", action: "catalog.category_created", target: "Coils & Accessories", severity: "info", detail: "Category published with 3 items." },
  { id: "aud-008", at: "2025-01-11T10:02:00+04:00", actor: "unknown", action: "auth.failed_sign_in", target: "admin", severity: "warning", detail: "3 failed attempts from new device.", ip: "45.13.x.x" },
  { id: "aud-007", at: "2025-01-10T18:20:00+04:00", actor: "maya@vapetive.example", action: "media.uploaded", target: "aura-700-2.jpg", severity: "info", detail: "Simulated upload — R2 integration pending." },
  { id: "aud-006", at: "2025-01-09T13:19:00+04:00", actor: "nour@vapetive.example", action: "settings.updated", target: "SEO defaults", severity: "info", detail: "Title template adjusted." },
  { id: "aud-005", at: "2025-01-08T17:55:00+04:00", actor: "omar@vapetive.example", action: "customer.privacy_request", target: "J. Okafor", severity: "critical", detail: "Data-access request opened; SLA clock started." },
];
