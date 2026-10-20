import { withApi, ok } from "@/server/api/guard";
import { adminOverview } from "@/server/repos/admin";

export const GET = withApi({ requirePermission: "catalog.read" }, async () => {
  return ok(await adminOverview());
});
