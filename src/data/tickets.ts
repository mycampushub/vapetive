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
    subject: "Flavour strength — Amber vs Rich Regular",
    category: "Product question",
    status: "open",
    priority: "normal",
    createdAt: "2025-01-10T08:12:00+04:00",
    updatedAt: "2025-01-11T15:40:00+04:00",
    requester: "A. Rahman",
    messages: [
      { id: "m1", author: "A. Rahman", role: "customer", body: "I prefer a strong toasted tobacco note. Is Amber stronger than Rich Regular, or roughly the same?", at: "2025-01-10T08:12:00+04:00" },
      { id: "m2", author: "Maya (Support)", role: "agent", body: "Rich Regular is the boldest toasted profile in the range; Amber sits just below it — smoother with a slightly nutty finish. For full strength, start with Rich Regular.", at: "2025-01-11T15:40:00+04:00" },
    ],
    internalNotes: [{ id: "n1", author: "Maya (Support)", body: "Awaiting customer confirmation before closing.", at: "2025-01-11T15:41:00+04:00" }],
  },
  {
    id: "tkt-002",
    reference: "SUP-1040",
    subject: "Delivery status — VD-20250118-000003",
    category: "Delivery",
    status: "pending",
    priority: "high",
    createdAt: "2025-01-09T11:30:00+04:00",
    updatedAt: "2025-01-10T09:02:00+04:00",
    requester: "S. Patel",
    messages: [
      { id: "m1", author: "S. Patel", role: "customer", body: "My order shows 'in transit' since 18 January. Can you check?", at: "2025-01-09T11:30:00+04:00" },
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
      { id: "m1", author: "M. Haddad", role: "customer", body: "Loved the Purple Wave sticks and the click-capsule Oasis Pearl — any chance of more Pearl editions in stock?", at: "2025-01-02T17:55:00+04:00" },
      { id: "m2", author: "Maya (Support)", body: "Wonderful to hear — passed to the buying team.", at: "2025-01-03T10:12:00+04:00", role: "agent" },
    ],
  },
  {
    id: "tkt-005",
    reference: "SUP-1032",
    subject: "Holder battery care — IQOS ILUMA",
    category: "Safety",
    status: "closed",
    priority: "normal",
    createdAt: "2024-12-27T13:10:00+04:00",
    updatedAt: "2024-12-27T16:45:00+04:00",
    requester: "D. Kim",
    messages: [
      { id: "m1", author: "D. Kim", role: "customer", body: "How should I care for the ILUMA holder battery — is overnight charging in the pocket charger safe?", at: "2024-12-27T13:10:00+04:00" },
      { id: "m2", author: "Omar (Support)", role: "agent", body: "Yes — the holder stops charging at full and each session auto-stops. Wipe the cap contacts occasionally and keep it out of direct sunlight; the safety hub has the full care checklist.", at: "2024-12-27T16:45:00+04:00" },
    ],
  },
];
