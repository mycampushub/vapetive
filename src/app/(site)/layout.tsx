import { AppShell } from "@/components/layout/app-shell";
import { AppBootstrap } from "@/components/layout/app-bootstrap";
import { getFeatureFlags } from "@/server/repos/settings";
import { getCurrentIdentity } from "@/server/auth-context";
import { hasPermission } from "@/server/rbac";

/**
 * Public-site layout — wraps every public page (including account)
 * with the AppShell: gradient backdrop, ambient smoke, header,
 * sticky footer and mobile bottom navigation. The AppBootstrap provider
 * hydrates the client stores (auth, server cart, saved items, site
 * config) once per page load.
 *
 * Maintenance enforcement (QA audit Task 26): when the admin-toggled
 * `features.maintenance` flag is on, non-staff visitors get the offline
 * notice instead of storefront pages. Staff keep full access, and the
 * admin console lives outside this layout so it always stays reachable.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const flags = await getFeatureFlags();
  if (flags.maintenance) {
    const identity = await getCurrentIdentity();
    const isStaff = identity ? hasPermission(identity.roles, "catalog.read") : false;
    if (!isStaff) {
      return (
        <AppShell>
          <main
            id="main-content"
            className="flex min-h-[70svh] flex-col items-center justify-center px-6 py-24 text-center"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              VAPETIVE
            </p>
            <h1 className="mt-4 text-3xl font-semibold text-balance md:text-4xl">
              We are briefly offline for scheduled maintenance
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              Our store is being tuned behind the scenes. We will be back shortly —
              thank you for your patience.
            </p>
          </main>
        </AppShell>
      );
    }
  }

  return (
    <AppShell>
      <AppBootstrap>{children}</AppBootstrap>
    </AppShell>
  );
}
