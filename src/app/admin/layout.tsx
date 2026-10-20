import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/shared/admin-shell";
import { getCurrentIdentity } from "@/server/auth-context";
import { getUserPermissionSet, isStaff } from "@/server/rbac";

/**
 * Admin layout — wraps every console route with the AdminShell
 * (collapsible sidebar, topbar, breadcrumbs, chrome footer) and enforces
 * the staff gate server-side: any session holding at least one role passes;
 * everyone else is redirected to sign-in with a return path.
 * The admin design language is calm and information-dense; the cinematic
 * atmosphere of the public site intentionally stops here.
 *
 * SEO: the console is operation-only — it is excluded from indexing
 * here (metadata) and in robots.txt.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    redirect("/account/sign-in?next=%2Fadmin");
  }
  const roles = await getUserPermissionSet(identity.user.id);
  if (!isStaff(roles)) {
    redirect("/account?denied=admin");
  }
  return <AdminShell>{children}</AdminShell>;
}
