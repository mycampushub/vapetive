import { z } from "zod";
import { withApi, ok } from "@/server/api/guard";
import { findUserByEmail, createPasswordResetToken } from "@/server/repos/users";
import { enqueue } from "@/server/jobs";
import { logAudit } from "@/server/audit";
import { APP_ENV } from "@/server/env";

const bodySchema = z.object({
  email: z.string().email("Enter a valid email address."),
});

export const POST = withApi(
  { rateLimit: { limit: 5, windowMs: 60 * 60 * 1000, key: "auth:forgot" } },
  async ({ request, meta }) => {
    const body = bodySchema.parse(await request.json());

    // Uniform response regardless of account existence (anti-enumeration).
    let devToken: string | undefined;
    const user = await findUserByEmail(body.email);
    if (user) {
      const token = await createPasswordResetToken(user.id);
      await enqueue("email.send", {
        to: user.email,
        subject: "Reset your VAPETIVE password",
        text: `Reset your password with this token (valid for 1 hour): ${token}`,
      });
      await logAudit({
        actorType: "customer",
        actorId: user.id,
        actorLabel: user.email,
        action: "auth.password_reset_requested",
        targetType: "user",
        targetId: user.id,
        detail: "Reset link requested",
        ip: meta.ip,
      });
      // Local development convenience ONLY: expose the token so the reset
      // flow is testable without an email provider. Preview/staging do not
      // get it — a leaked token there is a password-takeover vector.
      if (APP_ENV === "development") devToken = token;
    }

    return ok({
      message: "If an account exists for this email, a reset link is on its way.",
      ...(devToken ? { devToken } : {}),
    });
  }
);
