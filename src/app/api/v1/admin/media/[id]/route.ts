import { withApi, ok, fail, ErrorCode } from "@/server/api/guard";
import { softDeleteMedia } from "@/server/repos/media";
import { logAudit } from "@/server/audit";

export const DELETE = withApi(
  { requirePermission: "media.write" },
  async ({ params, identity, meta }) => {
    const removed = await softDeleteMedia(params.id);
    if (!removed) return fail(404, ErrorCode.NOT_FOUND, "No media asset found.");
    await logAudit({
      actorType: "admin",
      actorId: identity!.user.id,
      actorLabel: identity!.user.displayName,
      action: "media.delete",
      targetType: "media",
      targetId: params.id,
      severity: "warning",
      detail: "Media asset moved to trash",
      ip: meta.ip,
    });
    return ok({ ok: true });
  }
);
