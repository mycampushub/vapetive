import { withApi, ok } from "@/server/api/guard";
import { listComplianceRecords } from "@/server/repos/content";

export const GET = withApi({}, async () => {
  const records = await listComplianceRecords();
  return ok({ total: records.length, records });
});
