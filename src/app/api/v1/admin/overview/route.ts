import { withApi, ok } from "@/server/api/guard";
import { adminOverview } from "@/server/repos/admin";
import { hasPermission } from "@/server/rbac";

export const GET = withApi({ requireAuth: true }, async ({ identity }) => {
  const overview = await adminOverview();
  // Scope the payload: aggregate ops numbers for any staff member, but audit
  // detail only for roles holding audit.read.
  return ok({
    ...overview,
    recentActivity: identity && hasPermission(identity.roles, "audit.read") ? overview.recentActivity : [],
  });
});
