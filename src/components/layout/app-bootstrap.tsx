"use client";

import { useEffect, useRef } from "react";
import { hydrateCartFromServer } from "@/services/cart";
import { hydrateAuthFromServer, useAuth } from "@/services/account";
import { hydrateSavedItemsFromServer } from "@/services/saved-items";

/**
 * APP BOOTSTRAP PROVIDER
 * ----------------------
 * Runs once per page load on the client: hydrates the auth store, the
 * server-backed cart, the saved-items store and the WhatsApp number from
 * the site config. Children render immediately — every consuming view has
 * its own hydrated/loading state.
 */
export function AppBootstrap({ children }: { children: React.ReactNode }) {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void (async () => {
      await hydrateAuthFromServer();
      const auth = useAuth.getState();
      await Promise.all([
        hydrateCartFromServer(),
        hydrateSavedItemsFromServer(Boolean(auth.user)),
      ]);
      void hydrateWhatsAppNumber();
    })();
  }, []);

  return <>{children}</>;
}

/** Pull the WhatsApp number from site settings (KV-backed) once per session. */
let whatsappLoaded = false;
async function hydrateWhatsAppNumber(): Promise<void> {
  if (whatsappLoaded) return;
  whatsappLoaded = true;
  try {
    const response = await fetch("/api/v1/site/settings", { headers: { accept: "application/json" } });
    if (!response.ok) return;
    const body = (await response.json()) as { data: { contact?: { whatsapp?: string } } };
    const whatsapp = body.data?.contact?.whatsapp;
    if (whatsapp) {
      const { setWhatsAppNumber } = await import("@/services/whatsapp");
      setWhatsAppNumber(whatsapp);
    }
  } catch {
    // Keep the compiled-in default.
  }
}
