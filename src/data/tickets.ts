import type { SupportTicket } from "@/types";

/**
 * MOCK SUPPORT TICKETS
 * --------------------
 * Sample tickets for the admin support-management interface only.
 */

export const SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: "tkt-001",
    reference: "SUP-1041",
    subject: "Coil compatibility question — Geek Bar Pulse X",
    category: "Product question",
    status: "open",
    priority: "normal",
    createdAt: "2025-01-10T08:12:00+04:00",
    updatedAt: "2025-01-11T15:40:00+04:00",
    requester: "A. Rahman",
    messages: [
      { id: "m1", author: "A. Rahman", role: "customer", body: "Is the Geek Bar Pulse X dual mesh coil the same in both power modes? Asking because I use lighter 50/PG style liquids.", at: "2025-01-10T08:12:00+04:00" },
      { id: "m2", author: "Maya (Support)", role: "agent", body: "Yes — the Pulse X uses one dual mesh coil; Standard mode keeps it cooler so lighter profiles stay crisp and the coil life is slightly longer.", at: "2025-01-11T15:40:00+04:00" },
    ],
    internalNotes: [{ id: "n1", author: "Maya (Support)", body: "Awaiting customer confirmation before closing.", at: "2025-01-11T15:41:00+04:00" }],
  },
  {
    id: "tkt-002",
    reference: "SUP-1040",
    subject: "Delivery status — MRG-2418-0228",
    category: "Delivery",
    status: "pending",
    priority: "high",
    createdAt: "2025-01-09T11:30:00+04:00",
    updatedAt: "2025-01-10T09:02:00+04:00",
    requester: "S. Patel",
    messages: [
      { id: "m1", author: "S. Patel", role: "customer", body: "My order shows 'in transit' since 29 December. Can you check?", at: "2025-01-09T11:30:00+04:00" },
      { id: "m2", author: "System", role: "system", body: "Courier tracking requested — response pending.", at: "2025-01-09T11:35:00+04:00" },
    ],
  },
  {
    id: "tkt-003",
    reference: "SUP-1039",
    subject: "Privacy data-access request",
    category: "Privacy",
    status: "open",
    priority: "urgent",
    createdAt: "2025-01-08T14:22:00+04:00",
    updatedAt: "2025-01-08T14:22:00+04:00",
    requester: "J. Okafor",
    messages: [
      { id: "m1", author: "J. Okafor", role: "customer", body: "I would like a copy of the personal data stored on my account.", at: "2025-01-08T14:22:00+04:00" },
    ],
  },
  {
    id: "tkt-004",
    reference: "SUP-1036",
    subject: "Thank-you + flavour suggestion",
    category: "Feedback",
    status: "resolved",
    priority: "low",
    createdAt: "2025-01-02T17:55:00+04:00",
    updatedAt: "2025-01-03T10:12:00+04:00",
    requester: "M. Haddad",
    messages: [
      { id: "m1", author: "M. Haddad", role: "customer", body: "Loved the Al Fakher Crown Bar Pro 8000 — please stock more double apple disposables!", at: "2025-01-02T17:55:00+04:00" },
      { id: "m2", author: "Maya (Support)", body: "Wonderful to hear — passed to the buying team.", at: "2025-01-03T10:12:00+04:00", role: "agent" },
    ],
  },
  {
    id: "tkt-005",
    reference: "SUP-1032",
    subject: "Battery safety question — VGOD Pro Mech 2",
    category: "Safety",
    status: "closed",
    priority: "normal",
    createdAt: "2024-12-27T13:10:00+04:00",
    updatedAt: "2024-12-27T16:45:00+04:00",
    requester: "D. Kim",
    messages: [
      { id: "m1", author: "D. Kim", role: "customer", body: "Which 18650 cells are safe for the VGOD Pro Mech 2?", at: "2024-12-27T13:10:00+04:00" },
      { id: "m2", author: "Omar (Support)", role: "agent", body: "Any high-drain 20 A+ 18650 with an intact wrap. The safety hub lists exactly what to look for before installing a cell.", at: "2024-12-27T16:45:00+04:00" },
    ],
  },
];
