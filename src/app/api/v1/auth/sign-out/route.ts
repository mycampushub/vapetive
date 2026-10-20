import { NextResponse } from "next/server";
import { withApi } from "@/server/api/guard";
import { revokeSession } from "@/server/session";
import { clearSessionCookie } from "@/server/api/http";
import { logAudit } from "@/server/audit";

export const POST = withApi({}, async ({ identity, meta }) => {
  if (identity) {
    await revokeSession(identity.sessionId);
    await logAudit({
      actorType: "customer",
      actorId: identity.user.id,
      actorLabel: identity.user.displayName,
      action: "auth.sign_out",
      targetType: "user",
      targetId: identity.user.id,
      detail: "Signed out",
      ip: meta.ip,
    });
  }
  const response = NextResponse.json({ data: { ok: true } });
  clearSessionCookie(response);
  return response;
});
