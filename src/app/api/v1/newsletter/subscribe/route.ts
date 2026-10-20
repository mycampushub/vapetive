import { z } from "zod";
import { withApi, ok } from "@/server/api/guard";
import { getDb } from "@/server/db/client";
import { newId } from "@/server/ids";
import { enqueue } from "@/server/jobs";
import { verifyTurnstile } from "@/server/turnstile";

const bodySchema = z.object({
  email: z.string().email("Enter a valid email address."),
  source: z.string().max(60).optional(),
  turnstileToken: z.string().optional(),
});

/** POST /api/v1/newsletter/subscribe — double opt-in subscription. */
export const POST = withApi(
  { rateLimit: { limit: 5, windowMs: 60 * 60 * 1000, key: "newsletter" } },
  async ({ request }) => {
    const body = bodySchema.parse(await request.json());
    const bot = await verifyTurnstile(body.turnstileToken);
    if (!bot) {
      return ok({ received: false });
    }

    const db = await getDb();
    const email = body.email.trim().toLowerCase();
    await db.run(
      `INSERT INTO newsletter_subscribers (id, email, status, source, created_at)
       VALUES (?, ?, 'pending', ?, ?)
       ON CONFLICT(email) DO UPDATE SET status = 'pending', source = excluded.source`,
      [newId("nws"), email, body.source ?? "site", new Date().toISOString()]
    );
    await enqueue("email.send", {
      to: email,
      subject: "Confirm your VAPETIVE newsletter subscription",
      text: "Confirm your subscription to receive VAPETIVE product news. (Demo pipeline — confirmation link lands here.)",
    });

    return ok({ received: true, message: "Almost there — check your inbox to confirm." });
  }
);
