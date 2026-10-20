"use client";

import { useEffect, useState } from "react";
import { UserPlus, Users } from "lucide-react";
import { DataTable, type Column } from "@/components/shared/admin-primitives";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PrototypeNotice } from "@/components/shared/prototype-notice";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/lib/format";

/**
 * Illustrative staff roster — built inline from the live role names. Real admin
 * accounts live in the identity tables; these placeholder rows do not exist in
 * the database and cannot sign in.
 */
interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "invited" | "suspended";
  lastActive: string;
}

function buildUsers(roles: string[]): AdminUser[] {
  const [superAdmin = "Super administrator", contentAdmin = "Content administrator", catalog = "Catalog editor", support = "Support administrator", compliance = "Compliance reviewer"] = roles;
  return [
    { id: "adm-001", name: "Nour Qasimi", email: "nour@vapetive.example", role: superAdmin, status: "active", lastActive: "2025-01-13T18:42:00+04:00" },
    { id: "adm-002", name: "Layla Mansour", email: "layla@vapetive.example", role: contentAdmin, status: "active", lastActive: "2025-01-13T16:10:00+04:00" },
    { id: "adm-003", name: "Maya Rahal", email: "maya@vapetive.example", role: support, status: "active", lastActive: "2025-01-12T20:31:00+04:00" },
    { id: "adm-004", name: "Yusuf Karim", email: "yusuf@vapetive.example", role: catalog, status: "invited", lastActive: "2025-01-11T14:48:00+04:00" },
    { id: "adm-005", name: "Omar Sabbagh", email: "omar@vapetive.example", role: compliance, status: "suspended", lastActive: "2024-12-30T09:05:00+04:00" },
  ];
}

function StatusCell({ status }: { status: AdminUser["status"] }) {
  if (status === "active") return <StatusBadge tone="success">Active</StatusBadge>;
  if (status === "invited") return <StatusBadge tone="warning">Invited</StatusBadge>;
  return <StatusBadge tone="error">Suspended</StatusBadge>;
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2.5" aria-hidden="true">
      <div className="skeleton-sheen h-11 rounded-xl border border-line bg-white/[0.02]" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-sheen h-14 rounded-xl border border-line bg-white/[0.02]" />
      ))}
    </div>
  );
}

export function UsersView({ roles }: { roles: string[] }) {
  const { toast } = useToast();
  const [state, setState] = useState<"loading" | "error" | "ready">("loading");

  useEffect(() => {
    const timer = setTimeout(() => setState("ready"), 240);
    return () => clearTimeout(timer);
  }, []);

  const users = buildUsers(roles);

  const columns: Column<AdminUser>[] = [
    {
      key: "name",
      header: "Name",
      cell: (u) => (
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line bg-gradient-to-br from-violet-glow/25 to-ice/15 text-[0.7rem] font-bold text-foreground" aria-hidden="true">
            {u.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
          </span>
          <div>
            <p className="font-medium text-foreground">{u.name}</p>
            <p className="text-[0.76rem] text-muted-foreground">{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: "role", header: "Role", cell: (u) => <span className="text-muted-foreground">{u.role}</span> },
    { key: "status", header: "Status", cell: (u) => <StatusCell status={u.status} /> },
    {
      key: "lastActive",
      header: "Last active",
      cell: (u) => <span className="text-muted-foreground">{formatDateTime(u.lastActive)}</span>,
    },
  ];

  const onInvite = () => {
    toast({
      title: "Invitations are not sent yet",
      description: "Admin invitations are not wired into this console yet — no email is sent and no account is created.",
    });
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-violet-soft">System</p>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Users</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Staff accounts with console access. Roles come from the RBAC tables and are enforced on every admin API
            request.
          </p>
        </div>
        <Button onClick={onInvite}>
          <UserPlus className="size-4" aria-hidden="true" />
          Invite admin
        </Button>
      </header>

      <PrototypeNotice>
        This roster is illustrative — the people shown are placeholders, not database records, and cannot sign in.
        Live staff accounts are managed in the identity tables.
      </PrototypeNotice>

      {state === "loading" && <TableSkeleton />}
      {state === "error" && (
        <ErrorState title="Users unavailable" body="The staff roster could not be loaded." onRetry={() => setState("ready")} />
      )}
      {state === "ready" && users.length === 0 && (
        <EmptyState icon={Users} title="No admin users" body="No admin users to show." />
      )}
      {state === "ready" && users.length > 0 && (
        <DataTable
          columns={columns}
          rows={users}
          caption="Administrators with role, status and last-active time"
          mobileCard={(u) => (
            <div className="rounded-2xl border border-line bg-elevated/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{u.name}</p>
                  <p className="truncate text-[0.78rem] text-muted-foreground">{u.email}</p>
                </div>
                <StatusCell status={u.status} />
              </div>
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[0.78rem] text-muted-foreground">
                <span>{u.role}</span>
                <span>Active {formatDateTime(u.lastActive)}</span>
              </div>
            </div>
          )}
        />
      )}
    </div>
  );
}
