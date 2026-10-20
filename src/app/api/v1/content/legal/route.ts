import { withApi, ok } from "@/server/api/guard";
import { listLegalDocuments } from "@/server/repos/content";

export const GET = withApi({}, async () => {
  const documents = await listLegalDocuments();
  return ok({ total: documents.length, documents });
});
