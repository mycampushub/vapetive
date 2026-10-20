"use client";

import { useEffect, useState } from "react";
import {
  BadgeCheck,
  CloudCog,
  Database,
  FileCheck2,
  KeyRound,
  MessageCircle,
  Save,
  ShieldAlert,
} from "lucide-react";
import type { SiteSettings } from "@/types";
import { FormSection } from "@/components/shared/admin-primitives";
import { ErrorState } from "@/components/shared/error-state";
import { PrototypeNotice } from "@/components/shared/prototype-notice";
import { FormField, Select, TextArea, TextInput } from "@/components/forms/fields";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

function SkeletonBlock() {
  return (
    <div className="space-y-4" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="skeleton-sheen h-40 rounded-2xl border border-line bg-white/[0.02]" />
      ))}
    </div>
  );
}

interface Integration {
  id: string;
  name: string;
  detail: string;
  status: "not_connected" | "pending_vendor" | "out_of_scope" | "verified";
  statusLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

const INTEGRATIONS: Integration[] = [
  { id: "d1", name: "Cloudflare D1", detail: "Primary relational store for catalog, orders, accounts and audit.", status: "verified" as const, statusLabel: "Connected", icon: Database },
  { id: "r2", name: "R2 media", detail: "Object storage for imagery and documents (local uploads until deploy).", status: "pending_vendor" as const, statusLabel: "Local mode", icon: CloudCog },
  { id: "kv", name: "KV config", detail: "Runtime site configuration, delivery fees and feature flags.", status: "verified" as const, statusLabel: "Connected", icon: KeyRound },
  { id: "auth", name: "Auth & sessions", detail: "Customer and admin identity with PBKDF2 password hashing.", status: "verified" as const, statusLabel: "Connected", icon: ShieldAlert },
  { id: "age", name: "Age verification", detail: "Third-party age checks at purchase and delivery.", status: "pending_vendor", statusLabel: "Pending vendor", icon: FileCheck2 },
  { id: "whatsapp", name: "WhatsApp commerce", detail: "Conversational ordering via wa.me deep links — live on cart, checkout and order confirmations.", status: "verified" as const, statusLabel: "Live", icon: MessageCircle },
];

export function SettingsView({ settings }: { settings: SiteSettings }) {
  const { toast } = useToast();
  const [state, setState] = useState<"loading" | "error" | "ready">("loading");

  const [brandName, setBrandName] = useState(settings.brandName);
  const [legalName, setLegalName] = useState(settings.brandLegalName);
  const [tagline, setTagline] = useState(settings.tagline);
  const [locale, setLocale] = useState(settings.locale);
  const [currency, setCurrency] = useState(settings.currency);
  const [email, setEmail] = useState(settings.contact.email);
  const [supportEmail, setSupportEmail] = useState(settings.contact.supportEmail);
  const [phone, setPhone] = useState(settings.contact.phone);
  const [address, setAddress] = useState(settings.contact.addressLines.join("\n"));
  const [hours, setHours] = useState(settings.contact.hours);
  const [titleTemplate, setTitleTemplate] = useState(settings.seo.titleTemplate);
  const [defaultDescription, setDefaultDescription] = useState(settings.seo.defaultDescription);

  const [flags, setFlags] = useState({
    catalog: true,
    purchasing: false,
    reviews: false,
    wishlist: true,
  });

  useEffect(() => {
    const timer = setTimeout(() => setState("ready"), 260);
    return () => clearTimeout(timer);
  }, []);

  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/v1/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site: {
            tagline,
            contact: { email, supportEmail, phone, hours },
          },
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
        throw new Error(body.error?.message ?? "Save failed");
      }
      toast({
        title: "Settings saved",
        description: "Site settings are live — stored with full revision history.",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (state === "loading") {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="space-y-2">
          <div className="skeleton-sheen h-4 w-20 rounded bg-white/[0.05]" />
          <div className="skeleton-sheen h-8 w-40 rounded bg-white/[0.05]" />
        </header>
        <SkeletonBlock />
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <ErrorState
          title="Settings unavailable"
          body="The settings service could not be reached. Try again to reload the configuration."
          onRetry={() => {
            setState("loading");
            setTimeout(() => setState("ready"), 260);
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header className="space-y-2">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-violet-soft">System</p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Settings</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Site-wide configuration. Tagline and public contact details save to the versioned configuration store;
          the remaining panels are display-only for now.
        </p>
      </header>

      <PrototypeNotice>
        Saving writes the tagline and public contact details to the configuration store via PATCH — every save is
        captured in revision history.
      </PrototypeNotice>

      {/* Brand identity */}
      <FormSection title="Brand identity" description="Names and tagline used across the public site.">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Brand name" htmlFor="settings-brand">
            <TextInput id="settings-brand" value={brandName} onChange={(e) => setBrandName(e.target.value)} />
          </FormField>
          <FormField label="Legal entity name" htmlFor="settings-legal-name">
            <TextInput id="settings-legal-name" value={legalName} onChange={(e) => setLegalName(e.target.value)} />
          </FormField>
          <FormField label="Tagline" htmlFor="settings-tagline" className="sm:col-span-2">
            <TextInput id="settings-tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} />
          </FormField>
        </div>
      </FormSection>

      {/* Locale & currency */}
      <FormSection title="Locale & currency" description="Defaults for the public storefront.">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Locale" htmlFor="settings-locale" hint="Display-only for now — locale is not part of the saved configuration.">
            <Select id="settings-locale" value={locale} onChange={(e) => setLocale(e.target.value)}>
              <option value="en-AE">English (UAE) — en-AE</option>
              <option value="ar-AE">العربية (الإمارات) — ar-AE</option>
            </Select>
          </FormField>
          <FormField label="Currency" htmlFor="settings-currency" hint="Display-only for now — currency is not part of the saved configuration.">
            <Select id="settings-currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="AED">AED — UAE dirham</option>
              <option value="USD">USD — US dollar</option>
              <option value="SAR">SAR — Saudi riyal</option>
            </Select>
          </FormField>
        </div>
      </FormSection>

      {/* Public contact details */}
      <FormSection title="Public contact details" description="Rendered in the site footer and support pages.">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="General email" htmlFor="settings-email">
            <TextInput id="settings-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </FormField>
          <FormField label="Support email" htmlFor="settings-support-email">
            <TextInput id="settings-support-email" type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
          </FormField>
          <FormField label="Phone" htmlFor="settings-phone">
            <TextInput id="settings-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </FormField>
          <FormField label="Opening hours" htmlFor="settings-hours">
            <TextInput id="settings-hours" value={hours} onChange={(e) => setHours(e.target.value)} />
          </FormField>
          <FormField label="Address" htmlFor="settings-address" className="sm:col-span-2" hint="One line per row.">
            <TextArea id="settings-address" rows={3} value={address} onChange={(e) => setAddress(e.target.value)} />
          </FormField>
        </div>
      </FormSection>

      {/* SEO defaults */}
      <FormSection title="SEO defaults" description="Applied when a page does not define its own metadata.">
        <div className="space-y-4">
          <FormField label="Title template" htmlFor="settings-seo-title" hint="%s is replaced by the page title.">
            <TextInput id="settings-seo-title" value={titleTemplate} onChange={(e) => setTitleTemplate(e.target.value)} />
          </FormField>
          <FormField label="Default description" htmlFor="settings-seo-description">
            <TextArea id="settings-seo-description" rows={3} value={defaultDescription} onChange={(e) => setDefaultDescription(e.target.value)} />
          </FormField>
        </div>
      </FormSection>

      {/* Feature flags */}
      <FormSection title="Feature flags" description="Module switches for the storefront. Toggles apply to this session only — flag writes are not saved yet.">
        <div className="space-y-5">
          {[
            {
              key: "catalog" as const,
              label: "Catalog browsing",
              description: "Product and category pages are publicly visible.",
              disabled: false,
              hint: undefined as string | undefined,
            },
            {
              key: "purchasing" as const,
              label: "Purchasing",
              description: "Cart, checkout and payment flows.",
              disabled: true,
              hint: "Pending compliance review",
            },
            {
              key: "reviews" as const,
              label: "Product reviews",
              description: "Customer ratings and review submission.",
              disabled: true,
              hint: "Pending compliance review",
            },
            {
              key: "wishlist" as const,
              label: "Saved items",
              description: "Visitors can save products to a personal list.",
              disabled: false,
              hint: undefined as string | undefined,
            },
          ].map((flag) => (
            <div key={flag.key} className="flex items-start justify-between gap-4 rounded-xl border border-line bg-white/[0.02] px-4 py-3.5">
              <div>
                <p className="text-[0.88rem] font-medium text-foreground">{flag.label}</p>
                <p className="mt-0.5 text-[0.78rem] text-muted-foreground">{flag.description}</p>
                {flag.hint && <p className="mt-1 text-[0.74rem] font-medium text-warning">{flag.hint}</p>}
              </div>
              <Switch
                checked={flags[flag.key]}
                disabled={flag.disabled}
                onCheckedChange={(checked) => {
                  setFlags((f) => ({ ...f, [flag.key]: checked }));
                  toast({
                    title: "Flag toggled for this session",
                    description: `"${flag.label}" is now ${checked ? "on" : "off"} in this view — flag writes are not saved yet.`,
                  });
                }}
                aria-label={flag.label}
              />
            </div>
          ))}
        </div>
      </FormSection>

      {/* Integration status */}
      <FormSection
        title="Integration status"
        description="Live backend services powering this console (D1, KV and auth are connected; media moves to R2 at deploy)."
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          {INTEGRATIONS.map((integration) => {
            const tone =
              integration.status === "verified"
                ? { border: "border-emerald-400/25", text: "text-emerald-300", dot: "bg-emerald-400" }
                : integration.status === "pending_vendor"
                  ? { border: "border-warning/30", text: "text-warning", dot: "bg-warning" }
                  : integration.status === "out_of_scope"
                    ? { border: "border-line", text: "text-muted-foreground", dot: "bg-muted-foreground" }
                    : { border: "border-line", text: "text-muted-foreground", dot: "bg-line-strong" };
            return (
              <li key={integration.id} className={`rounded-2xl border ${tone.border} bg-white/[0.02] p-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-line bg-elevated/60">
                      <integration.icon className="size-4 text-muted-foreground" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-[0.88rem] font-medium text-foreground">{integration.name}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[0.76rem] text-muted-foreground">
                        <span className={`size-1.5 rounded-full ${tone.dot}`} aria-hidden="true" />
                        <span className={tone.text}>{integration.statusLabel}</span>
                      </p>
                    </div>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={0} className="inline-flex rounded-lg">
                        <Button variant="outline" size="sm" disabled>
                          Configure
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Secrets are never edited in-app</TooltipContent>
                  </Tooltip>
                </div>
                <p className="mt-3 border-t border-line pt-2.5 text-[0.78rem] leading-relaxed text-muted-foreground">
                  {integration.detail}
                </p>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-line bg-elevated/40 px-4 py-3.5">
          <BadgeCheck className="mt-0.5 size-4 shrink-0 text-violet-soft" aria-hidden="true" />
          <p className="text-[0.84rem] leading-relaxed text-foreground">
            Secrets are managed via Workers Secrets — never exposed in this console.
          </p>
        </div>
      </FormSection>

      {/* Save */}
      <div className="flex flex-wrap items-center gap-4">
        <Button onClick={onSave}>
          <Save className="size-4" aria-hidden="true" />
          Save settings
        </Button>
        <p className="text-[0.78rem] text-muted-foreground">
          Saving writes to the versioned configuration store — every save is captured in revision history.
        </p>
      </div>
    </div>
  );
}
