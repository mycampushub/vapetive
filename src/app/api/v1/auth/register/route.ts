import { z } from "zod";
import { withApi, ok, fail, ErrorCode, created } from "@/server/api/guard";
import { registerUser, createEmailVerificationToken } from "@/server/repos/users";
import { verifyTurnstile } from "@/server/turnstile";
import { enqueue } from "@/server/jobs";
import { logAudit } from "@/server/audit";

const bodySchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .max(128)
    .regex(/[a-zA-Z]/, "Include at least one letter.")
    .regex(/[0-9]/, "Include at least one number."),
  displayName: z.string().trim().min(2, "Enter your name.").max(80),
  phone: z.string().trim().max(24).optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.").optional(),
  marketingOptIn: z.boolean().optional(),
  turnstileToken: z.string().optional(),
});

export const POST = withApi(
  { rateLimit: { limit: 10, windowMs: 60 * 60 * 1000, key: "auth:register" } },
  async ({ request, meta }) => {
    const body = bodySchema.parse(await request.json());

    const bot = await verifyTurnstile(body.turnstileToken, meta.ip ?? undefined);
    if (!bot) {
      return fail(400, ErrorCode.VALIDATION_FAILED, "Captcha verification failed. Please try again.");
    }

    const result = await registerUser({
      email: body.email,
      password: body.password,
      displayName: body.displayName,
      phone: body.phone,
      dateOfBirth: body.dateOfBirth,
      marketingOptIn: body.marketingOptIn,
    });

    if (!result.ok) {
      return fail(409, ErrorCode.CONFLICT, "An account with this email already exists.", {
        fields: { email: "This email is already registered." },
      });
    }

    const token = await createEmailVerificationToken(result.userId);
    await enqueue("email.send", {
      to: body.email,
      subject: "Verify your VAPETIVE account",
      text: `Welcome to VAPETIVE! Verify your email with this token: ${token}`,
    });
    await logAudit({
      actorType: "customer",
      actorId: result.userId,
      actorLabel: body.displayName,
      action: "auth.register",
      targetType: "user",
      targetId: result.userId,
      detail: "Account registered",
      ip: meta.ip,
      userAgent: meta.userAgent,
    });

    return created({ email: body.email, verificationRequired: true });
  }
);
