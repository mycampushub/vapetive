import { z } from "zod";
import { withApi, ok, fail, ErrorCode } from "@/server/api/guard";
import { consumeEmailVerificationToken, findUserByEmail, createEmailVerificationToken } from "@/server/repos/users";
import { enqueue } from "@/server/jobs";

const bodySchema = z.object({
  token: z.string().min(10).optional(),
  email: z.string().email().optional(),
});

/** POST /auth/verify-email — confirm a token, or resend when only email given. */
export const POST = withApi(
  // The resend path triggers real emails — it must never be an open relay.
  { rateLimit: { limit: 5, windowMs: 15 * 60 * 1000, key: "auth:verify-email" } },
  async ({ request }) => {
  const body = bodySchema.parse(await request.json());

  if (body.token) {
    const valid = await consumeEmailVerificationToken(body.token);
    if (!valid) {
      return fail(400, ErrorCode.VALIDATION_FAILED, "This verification link is invalid or has expired.");
    }
    return ok({ verified: true });
  }

  if (body.email) {
    const user = await findUserByEmail(body.email);
    if (user && !user.email_verified_at) {
      const token = await createEmailVerificationToken(user.id);
      await enqueue("email.send", {
        to: user.email,
        subject: "Verify your VAPETIVE account",
        text: `Verify your email with this token: ${token}`,
      });
    }
    return ok({ sent: true });
  }

  return fail(422, ErrorCode.VALIDATION_FAILED, "Provide a token or an email address.");
  }
);
