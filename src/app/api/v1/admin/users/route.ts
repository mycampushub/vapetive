import { withApi, ok } from "@/server/api/guard";
import { listStaff } from "@/server/repos/admin";
import { adminRoles } from "@/server/repos/admin";

export const GET = withApi({ requirePermission: "staff.manage" }, async () => {
  const [staff, roles] = await Promise.all([listStaff(), adminRoles()]);
  return ok({ staff, roles });
});
