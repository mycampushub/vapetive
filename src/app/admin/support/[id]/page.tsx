import type { Metadata } from "next";
import { getTicket } from "@/server/repos/support";
import { EmptyState } from "@/components/shared/empty-state";
import { TicketDetailView } from "./ticket-detail-view";

export const metadata: Metadata = {
  title: "Ticket detail",
};

export default async function AdminTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const key = decodeURIComponent(id);
  const ticket = await getTicket(key);

  if (!ticket) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <EmptyState
          title="Ticket not found"
          body={`No ticket matches "${key}". Try a ticket id or a reference such as TKT-2025-0001.`}
          actionLabel="Back to support"
          actionHref="/admin/support"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <TicketDetailView ticket={ticket} />
    </div>
  );
}
