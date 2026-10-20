"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { FormError, FormField, FormSuccess, PasswordInput } from "@/components/forms/fields";
import { LoadingIndicator } from "@/components/shared/loading-indicator";
import { accountService } from "@/services/account";
import { useToast } from "@/hooks/use-toast";
import { PASSWORD_HINT, passwordSchema } from "@/lib/validation";

const resetSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string().min(1, "Confirm your new password."),
});

type FieldErrors = Partial<Record<"password" | "confirmPassword", string>>;

export function ResetPasswordView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    if (!token) {
      setError("This reset link is invalid or has expired. Request a fresh reset email and try again.");
      return;
    }

    const parsed = resetSchema.safeParse({ password, confirmPassword });
    const nextErrors: FieldErrors = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "");
        if ((key === "password" || key === "confirmPassword") && !nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }
    }
    if (!nextErrors.confirmPassword && password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      const result = await accountService.resetPassword(token, password);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setSuccess(result.message);
      toast({
        title: "Password updated",
        description: "Sign in with your new password.",
      });
      // Give the confirmation a beat to land, then hand off to sign-in.
      window.setTimeout(() => router.push("/account/sign-in"), 1200);
    } catch {
      setError("The password could not be updated. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass rounded-3xl p-6 shadow-2xl shadow-violet-glow/5 sm:p-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="font-display text-h2 font-bold text-foreground">Set a new password</h1>
        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
          Choose a new password for your account. Reset links expire for security — request a fresh one if this link
          has timed out.
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        <FormField
          label="New password"
          htmlFor="reset-password"
          hint={PASSWORD_HINT}
          error={fieldErrors.password}
          required
        >
          <PasswordInput
            id="reset-password"
            autoComplete="new-password"
            placeholder="••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            invalid={Boolean(fieldErrors.password)}
          />
        </FormField>

        <FormField label="Confirm new password" htmlFor="reset-confirm" error={fieldErrors.confirmPassword} required>
          <PasswordInput
            id="reset-confirm"
            autoComplete="new-password"
            placeholder="••••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            invalid={Boolean(fieldErrors.confirmPassword)}
          />
        </FormField>

        {error && <FormError>{error}</FormError>}
        {success && <FormSuccess>{success}</FormSuccess>}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-primary font-medium text-primary-foreground transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <LoadingIndicator label="Updating password" size="sm" className="text-primary-foreground/90" />
          ) : (
            "Update password"
          )}
        </button>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/account/sign-in" className="font-medium text-foreground underline-offset-4 transition-colors hover:text-violet-soft hover:underline">
            Back to sign-in
          </Link>
        </p>
      </form>
    </div>
  );
}
