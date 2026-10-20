import { z } from "zod";
import { withApi, ok, fail, ErrorCode } from "@/server/api/guard";
import { consumePasswordResetToken } from "@/server/repos/users";
import { revokeAllSessionsForUser } from "@/server/session";
import { logAudit } from "@/server/audit";

const bodySchema = z.object({
  token: z.string().min(10, "Reset token is required."),
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .max(128)
    .regex(/[a-zA-Z]/, "Include at least one letter.")
    .regex(/[0-9]/, "Include at least one number."),
});

export const POST = withApi(
  { rateLimit: { limit: 10, windowMs: 60 * 60 * 1000, key: "auth:reset" } },
  async ({ request, meta }) => {
    const body = bodySchema.parse(await request.json());
    const userId = await consumePasswordResetToken(body.token, body.password);
    if (!userId) {
      return fail(400, ErrorCode.VALIDATION_FAILED, "This reset link is invalid or has expired.", {
        fields: { token: "Invalid or expired token." },
      });
    }
    await revokeAllSessionsForUser(userId);
    await logAudit({
      actorType: "customer",
      actorId: userId,
      actorLabel: "account-owner",
      action: "auth.password_reset",
      targetType: "user",
      targetId: userId,
      detail: "Password reset completed; all sessions revoked",
      severity: "warning",
      ip: meta.ip,
    });
    return ok({ ok: true });
  }
);
