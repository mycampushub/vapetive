"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Archive, ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { FormSection } from "@/components/shared/admin-primitives";
import { AvailabilityBadge, StatusBadge } from "@/components/shared/status-badge";
import { PrototypeNotice } from "@/components/shared/prototype-notice";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormField, Select, TextArea, TextInput } from "@/components/forms/fields";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Availability, CatalogItem, ItemVariant, SpecificationGroup } from "@/types";

/* ------------------------------ helpers --------------------------- */

function cloneItem(item: CatalogItem): CatalogItem {
  return {
    ...item,
    images: [...item.images],
    specs: item.specs.map((g) => ({ title: g.title, entries: g.entries.map((e) => ({ ...e })) })),
    variants: item.variants.map((v) => ({ ...v })),
    conformity: item.conformity.map((c) => ({ ...c })),
    warnings: [...item.warnings],
    documents: item.documents.map((d) => ({ ...d })),
  };
}

const CONFORMITY_OPTIONS: Array<{ value: ConformityStatus; label: string }> = [
  { value: "verified", label: "Verified" },
  { value: "pending", label: "Pending" },
  { value: "missing", label: "Missing" },
];

type ConformityStatus = CatalogItem["conformity"][number]["status"];

/* ------------------------------- view ----------------------------- */

export function ProductEditorView({ item }: { item: CatalogItem }) {
  const initial = useMemo(() => cloneItem(item), [item]);
  const [draft, setDraft] = useState<CatalogItem>(initial);
  const [status, setStatus] = useState<"draft" | "published">("published");
  const [availability, setAvailability] = useState<Availability>(item.availability);
  const [warningsText, setWarningsText] = useState(item.warnings.join("\n"));
  const [dirty, setDirty] = useState(false);
  const idCounter = useRef(0);
  const { toast } = useToast();

  const nextId = (prefix: string) => `${prefix}-new-${idCounter.current++}`;
  const touch = () => setDirty(true);

  /* ------- detail fields ------- */
  const patchDetail = (p: Partial<CatalogItem>) => {
    setDraft((d) => ({ ...d, ...p }));
    touch();
  };

  /* ------- variants ------- */
  const patchVariant = (id: string, p: Partial<ItemVariant>) => {
    setDraft((d) => ({ ...d, variants: d.variants.map((v) => (v.id === id ? { ...v, ...p } : v)) }));
    touch();
  };
  const removeVariant = (id: string) => {
    setDraft((d) => ({ ...d, variants: d.variants.filter((v) => v.id !== id) }));
    touch();
  };
  const addVariant = () => {
    const variant: ItemVariant = {
      id: nextId("var"),
      label: "New variant",
      type: draft.variants[0]?.type ?? "flavor",
      swatch: "#8b5cf6",
      available: true,
    };
    setDraft((d) => ({ ...d, variants: [...d.variants, variant] }));
    touch();
  };

  /* ------- specifications ------- */
  const patchSpecs = (groups: SpecificationGroup[]) => {
    setDraft((d) => ({ ...d, specs: groups }));
    touch();
  };

  /* ------- images ------- */
  const patchImage = (index: number, value: string) => {
    setDraft((d) => ({ ...d, images: d.images.map((img, i) => (i === index ? value : img)) }));
    touch();
  };
  const removeImage = (index: number) => {
    setDraft((d) => ({ ...d, images: d.images.filter((_, i) => i !== index) }));
    touch();
  };
  const addImage = () => {
    setDraft((d) => ({ ...d, images: [...d.images, `/products/${d.slug}-new.jpg`] }));
    touch();
  };

  /* ------- documents & conformity ------- */
  const patchDoc = (id: string, p: Partial<CatalogItem["documents"][number]>) => {
    setDraft((d) => ({ ...d, documents: d.documents.map((doc) => (doc.id === id ? { ...doc, ...p } : doc)) }));
    touch();
  };
  const removeDoc = (id: string) => {
    setDraft((d) => ({ ...d, documents: d.documents.filter((doc) => doc.id !== id) }));
    touch();
  };
  const addDoc = () => {
    setDraft((d) => ({
      ...d,
      documents: [...d.documents, { id: nextId("doc"), title: "New document", type: "pdf" as const }],
    }));
    touch();
  };
  const patchConformity = (index: number, p: Partial<CatalogItem["conformity"][number]>) => {
    setDraft((d) => ({ ...d, conformity: d.conformity.map((c, i) => (i === index ? { ...c, ...p } : c)) }));
    touch();
  };
  const removeConformity = (index: number) => {
    setDraft((d) => ({ ...d, conformity: d.conformity.filter((_, i) => i !== index) }));
    touch();
  };
  const addConformity = () => {
    setDraft((d) => ({
      ...d,
      conformity: [...d.conformity, { label: "New requirement", detail: "", status: "pending" as ConformityStatus }],
    }));
    touch();
  };

  /* ------- save (persisted via catalog API) ------- */
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    const warnings = warningsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    setDraft((d) => ({ ...d, warnings }));
    setSaving(true);
    try {
      const response = await fetch(`/api/v1/admin/products/${encodeURIComponent(item.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          tagline: draft.tagline,
          description: draft.description,
          model: draft.model ?? null,
          price: draft.price,
          compareAtPrice: draft.compareAtPrice ?? null,
          featured: draft.featured ?? false,
          isNew: draft.isNew ?? false,
          publish: status === "published",
          ...(availability === "unavailable" ? { setOutOfStock: true } : { clearOutOfStock: true }),
        }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
      if (!response.ok) throw new Error(body.error?.message ?? "Save failed");
      setDirty(false);
      toast({
        title: "Product saved",
        description: `${draft.name} persisted to the catalog — search and store pages update immediately.`,
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

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      {/* Header */}
      <header className="space-y-3">
        <Link
          href="/admin/catalog/products"
          className="inline-flex min-h-8 items-center gap-1.5 text-[0.8rem] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          All products
        </Link>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="font-display text-h2 font-bold tracking-tight text-foreground">{item.name}</h1>
          <AvailabilityBadge availability={availability} />
          <StatusBadge tone={status === "published" ? "success" : "neutral"}>
            {status === "published" ? "Published" : "Draft"}
          </StatusBadge>
          {dirty && (
            <span className="inline-flex items-center gap-1.5" title="You have unsaved changes">
              <span className="size-2 rounded-full bg-warning" aria-hidden="true" />
              <span className="text-[0.74rem] font-medium text-warning">Unsaved changes</span>
            </span>
          )}
        </div>
        <p className="max-w-2xl text-[0.82rem] text-muted-foreground">
          Catalog record <code className="font-mono text-[0.76rem]">{item.id}</code> · category{" "}
          <code className="font-mono text-[0.76rem]">{item.categorySlug}</code>
        </p>
      </header>

      <PrototypeNotice>Edits save to the catalog database via PATCH — pricing, copy, flags, publish state and stock update the storefront and search index on save.</PrototypeNotice>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Left: tabs */}
        <Tabs defaultValue="details">
          <TabsList className="h-auto min-h-9 w-full flex-wrap justify-start">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="variants">Variants ({draft.variants.length})</TabsTrigger>
            <TabsTrigger value="specs">Specifications ({draft.specs.length})</TabsTrigger>
            <TabsTrigger value="images">Images ({draft.images.length})</TabsTrigger>
            <TabsTrigger value="warnings">Warnings &amp; docs</TabsTrigger>
            <TabsTrigger value="conformity">Conformity ({draft.conformity.length})</TabsTrigger>
          </TabsList>

          {/* Details */}
          <TabsContent value="details" className="mt-4">
            <FormSection title="Details" description="Core identity fields shown on the public product page.">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Name" htmlFor="p-name">
                  <TextInput id="p-name" value={draft.name} onChange={(e) => patchDetail({ name: e.target.value })} />
                </FormField>
                <FormField label="Brand" htmlFor="p-brand">
                  <TextInput id="p-brand" value={draft.brand} onChange={(e) => patchDetail({ brand: e.target.value })} />
                </FormField>
                <FormField label="SKU" htmlFor="p-sku">
                  <TextInput id="p-sku" value={draft.sku} onChange={(e) => patchDetail({ sku: e.target.value })} className="font-mono" />
                </FormField>
                <FormField label="Model" htmlFor="p-model" hint="Optional chassis or model code.">
                  <TextInput id="p-model" value={draft.model ?? ""} onChange={(e) => patchDetail({ model: e.target.value })} className="font-mono" />
                </FormField>
                <FormField label="Tagline" htmlFor="p-tagline" className="sm:col-span-2">
                  <TextInput id="p-tagline" value={draft.tagline} onChange={(e) => patchDetail({ tagline: e.target.value })} />
                </FormField>
                <FormField label="Description" htmlFor="p-description" className="sm:col-span-2">
                  <TextArea id="p-description" rows={5} value={draft.description} onChange={(e) => patchDetail({ description: e.target.value })} />
                </FormField>
              </div>
            </FormSection>
          </TabsContent>

          {/* Variants */}
          <TabsContent value="variants" className="mt-4">
            <FormSection
              title="Variants"
              description="Swatch color, label and storefront availability per row — local state only."
              actions={
                <button
                  type="button"
                  onClick={addVariant}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line px-3.5 text-[0.8rem] font-medium text-muted-foreground transition-colors hover:border-violet-glow/50 hover:text-foreground"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  Add variant
                </button>
              }
            >
              <div className="space-y-2.5">
                {draft.variants.length === 0 && (
                  <p className="rounded-xl border border-dashed border-line-strong px-4 py-6 text-center text-[0.84rem] text-muted-foreground">
                    No variants — add one to represent flavors or finishes.
                  </p>
                )}
                {draft.variants.map((variant) => (
                  <div
                    key={variant.id}
                    className={cn(
                      "grid grid-cols-1 items-end gap-2.5 rounded-xl border border-line bg-white/[0.02] p-3 sm:grid-cols-[3.5rem_minmax(0,1fr)_auto_auto]",
                      !variant.available && "opacity-70"
                    )}
                  >
                    <FormField label="Swatch" htmlFor={`${variant.id}-swatch`}>
                      <input
                        id={`${variant.id}-swatch`}
                        type="color"
                        value={variant.swatch ?? "#8b5cf6"}
                        onChange={(e) => patchVariant(variant.id, { swatch: e.target.value })}
                        aria-label={`Swatch color for ${variant.label}`}
                        className="h-10 w-full cursor-pointer rounded-lg border border-line bg-transparent p-1"
                      />
                    </FormField>
                    <FormField label="Label" htmlFor={`${variant.id}-label`}>
                      <TextInput
                        id={`${variant.id}-label`}
                        value={variant.label}
                        onChange={(e) => patchVariant(variant.id, { label: e.target.value })}
                        className="h-10"
                      />
                    </FormField>
                    <div className="flex h-10 items-center gap-2">
                      <Switch
                        checked={variant.available}
                        onCheckedChange={(v) => patchVariant(variant.id, { available: v })}
                        aria-label={`Availability for ${variant.label}`}
                      />
                      <span className="text-[0.76rem] text-muted-foreground">{variant.available ? "Available" : "Hidden"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVariant(variant.id)}
                      aria-label={`Remove variant ${variant.label}`}
                      className="inline-flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-error/10 hover:text-error"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </FormSection>
          </TabsContent>

          {/* Specifications */}
          <TabsContent value="specs" className="mt-4 space-y-4">
            {draft.specs.map((group, gi) => (
              <FormSection
                key={gi}
                title={`Group ${gi + 1}`}
                actions={
                  <button
                    type="button"
                    onClick={() => patchSpecs(draft.specs.filter((_, i) => i !== gi))}
                    aria-label={`Remove specification group ${gi + 1}`}
                    className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-error/10 hover:text-error"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                }
              >
                <div className="space-y-3.5">
                  <FormField label="Group title" htmlFor={`spec-group-${gi}`}>
                    <TextInput
                      id={`spec-group-${gi}`}
                      value={group.title}
                      onChange={(e) => patchSpecs(draft.specs.map((g, i) => (i === gi ? { ...g, title: e.target.value } : g)))}
                    />
                  </FormField>
                  <div className="space-y-2.5">
                    {group.entries.map((entry, ei) => (
                      <div key={ei} className="grid grid-cols-1 items-end gap-2.5 rounded-xl border border-line bg-white/[0.02] p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_auto]">
                        <FormField label="Label" htmlFor={`spec-${gi}-${ei}-label`}>
                          <TextInput
                            id={`spec-${gi}-${ei}-label`}
                            value={entry.label}
                            onChange={(e) =>
                              patchSpecs(
                                draft.specs.map((g, i) =>
                                  i === gi ? { ...g, entries: g.entries.map((en, j) => (j === ei ? { ...en, label: e.target.value } : en)) } : g
                                )
                              )
                            }
                            className="h-10"
                          />
                        </FormField>
                        <FormField label="Value" htmlFor={`spec-${gi}-${ei}-value`}>
                          <TextInput
                            id={`spec-${gi}-${ei}-value`}
                            value={entry.value}
                            onChange={(e) =>
                              patchSpecs(
                                draft.specs.map((g, i) =>
                                  i === gi ? { ...g, entries: g.entries.map((en, j) => (j === ei ? { ...en, value: e.target.value } : en)) } : g
                                )
                              )
                            }
                            className="h-10"
                          />
                        </FormField>
                        <button
                          type="button"
                          onClick={() =>
                            patchSpecs(draft.specs.map((g, i) => (i === gi ? { ...g, entries: g.entries.filter((_, j) => j !== ei) } : g)))
                          }
                          aria-label={`Remove entry ${entry.label || ei + 1}`}
                          className="inline-flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-error/10 hover:text-error"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => patchSpecs(draft.specs.map((g, i) => (i === gi ? { ...g, entries: [...g.entries, { label: "", value: "" }] } : g)))}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line px-3.5 text-[0.8rem] font-medium text-muted-foreground transition-colors hover:border-violet-glow/50 hover:text-foreground"
                  >
                    <Plus className="size-3.5" aria-hidden="true" />
                    Add entry
                  </button>
                </div>
              </FormSection>
            ))}
            <button
              type="button"
              onClick={() => patchSpecs([...draft.specs, { title: "New group", entries: [{ label: "", value: "" }] }])}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-line px-4 text-sm font-medium text-foreground transition-colors hover:border-violet-glow/50"
            >
              <Plus className="size-4" aria-hidden="true" />
              Add specification group
            </button>
          </TabsContent>

          {/* Images */}
          <TabsContent value="images" className="mt-4">
            <FormSection title="Images" description="Ordered image paths; the first entry is the primary card image.">
              <div className="space-y-2.5">
                {draft.images.map((image, i) => (
                  <div key={`${image}-${i}`} className="grid grid-cols-1 items-end gap-2.5 rounded-xl border border-line bg-white/[0.02] p-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <FormField label={`Image ${i + 1}${i === 0 ? " (primary)" : ""}`} htmlFor={`img-${i}`}>
                      <TextInput
                        id={`img-${i}`}
                        value={image}
                        onChange={(e) => patchImage(i, e.target.value)}
                        className="h-10 font-mono text-[0.82rem]"
                      />
                    </FormField>
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      aria-label={`Remove image ${i + 1}`}
                      className="inline-flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-error/10 hover:text-error"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
                {draft.images.length === 0 && (
                  <p className="rounded-xl border border-dashed border-line-strong px-4 py-6 text-center text-[0.84rem] text-muted-foreground">
                    No image paths — add at least one primary image.
                  </p>
                )}
                <button
                  type="button"
                  onClick={addImage}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line px-3.5 text-[0.8rem] font-medium text-muted-foreground transition-colors hover:border-violet-glow/50 hover:text-foreground"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  Add image path
                </button>
                <p className="text-[0.78rem] text-warning">Image paths are stored as URLs — manage uploads in the media library. Local development mode: files are not uploaded to object storage yet.</p>
              </div>
            </FormSection>
          </TabsContent>

          {/* Warnings & documents */}
          <TabsContent value="warnings" className="mt-4 space-y-4">
            <FormSection title="Warnings" description="One warning per line — rendered in the public safety block.">
              <TextArea
                aria-label="Warnings, one per line"
                rows={6}
                value={warningsText}
                onChange={(e) => {
                  setWarningsText(e.target.value);
                  touch();
                }}
              />
            </FormSection>
            <FormSection
              title="Documents"
              description="PDFs and web references attached to the product page."
              actions={
                <button
                  type="button"
                  onClick={addDoc}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line px-3.5 text-[0.8rem] font-medium text-muted-foreground transition-colors hover:border-violet-glow/50 hover:text-foreground"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  Add document
                </button>
              }
            >
              <div className="space-y-2.5">
                {draft.documents.length === 0 && (
                  <p className="rounded-xl border border-dashed border-line-strong px-4 py-6 text-center text-[0.84rem] text-muted-foreground">
                    No documents attached.
                  </p>
                )}
                {draft.documents.map((doc) => (
                  <div key={doc.id} className="grid grid-cols-1 items-end gap-2.5 rounded-xl border border-line bg-white/[0.02] p-3 sm:grid-cols-[minmax(0,1.7fr)_8.5rem_auto]">
                    <FormField label="Title" htmlFor={`${doc.id}-title`}>
                      <TextInput
                        id={`${doc.id}-title`}
                        value={doc.title}
                        onChange={(e) => patchDoc(doc.id, { title: e.target.value })}
                        className="h-10"
                      />
                    </FormField>
                    <FormField label="Type" htmlFor={`${doc.id}-type`}>
                      <Select
                        id={`${doc.id}-type`}
                        value={doc.type}
                        onChange={(e) => patchDoc(doc.id, { type: e.target.value as "pdf" | "web" })}
                        className="h-10"
                      >
                        <option value="pdf">PDF</option>
                        <option value="web">Web</option>
                      </Select>
                    </FormField>
                    <button
                      type="button"
                      onClick={() => removeDoc(doc.id)}
                      aria-label={`Remove document ${doc.title}`}
                      className="inline-flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-error/10 hover:text-error"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </FormSection>
          </TabsContent>

          {/* Conformity */}
          <TabsContent value="conformity" className="mt-4">
            <FormSection
              title="Conformity"
              description="Regulatory requirements and their verification state — feeds the public compliance block."
              actions={
                <button
                  type="button"
                  onClick={addConformity}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line px-3.5 text-[0.8rem] font-medium text-muted-foreground transition-colors hover:border-violet-glow/50 hover:text-foreground"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  Add requirement
                </button>
              }
            >
              <div className="space-y-2.5">
                {draft.conformity.map((row, i) => (
                  <div
                    key={`${row.label}-${i}`}
                    className="grid grid-cols-1 items-end gap-2.5 rounded-xl border border-line bg-white/[0.02] p-3 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)_9.5rem_auto]"
                  >
                    <FormField label="Requirement" htmlFor={`conf-${i}-label`}>
                      <TextInput
                        id={`conf-${i}-label`}
                        value={row.label}
                        onChange={(e) => patchConformity(i, { label: e.target.value })}
                        className="h-10"
                      />
                    </FormField>
                    <FormField label="Detail" htmlFor={`conf-${i}-detail`}>
                      <TextInput
                        id={`conf-${i}-detail`}
                        value={row.detail ?? ""}
                        onChange={(e) => patchConformity(i, { detail: e.target.value })}
                        className="h-10"
                      />
                    </FormField>
                    <FormField label="Status" htmlFor={`conf-${i}-status`}>
                      <Select
                        id={`conf-${i}-status`}
                        value={row.status}
                        onChange={(e) => patchConformity(i, { status: e.target.value as ConformityStatus })}
                        className="h-10"
                      >
                        {CONFORMITY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                    <button
                      type="button"
                      onClick={() => removeConformity(i)}
                      aria-label={`Remove requirement ${row.label}`}
                      className="inline-flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-error/10 hover:text-error"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </FormSection>
          </TabsContent>
        </Tabs>

        {/* Right rail */}
        <aside aria-label="Product status controls" className="space-y-4 lg:sticky lg:top-24">
          <section className="space-y-3.5 rounded-2xl border border-line bg-elevated/50 p-5">
            <h2 className="font-display text-[1rem] font-semibold text-foreground">Status</h2>
            <FormField label="Publish status" htmlFor="p-status">
              <Select
                id="p-status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as "draft" | "published");
                  touch();
                }}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </Select>
            </FormField>
            <StatusBadge tone={status === "published" ? "success" : "neutral"}>
              {status === "published" ? "Published" : "Draft"}
            </StatusBadge>
            <button
              type="button"
              onClick={onSave}
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground transition-all hover:brightness-110"
            >
              <Save className="size-4" aria-hidden="true" />
              Save
            </button>
            <p className="text-[0.74rem] leading-relaxed text-muted-foreground">
              Saving persists to the catalog database and search index — storefront pages update immediately.
            </p>
          </section>

          <section className="space-y-3.5 rounded-2xl border border-line bg-elevated/50 p-5">
            <h2 className="font-display text-[1rem] font-semibold text-foreground">Availability</h2>
            <FormField label="Storefront availability" htmlFor="p-availability">
              <Select
                id="p-availability"
                value={availability}
                onChange={(e) => {
                  setAvailability(e.target.value as Availability);
                  touch();
                }}
              >
                <option value="in_stock">In stock</option>
                <option value="low_stock">Low stock</option>
                <option value="out_of_stock">Out of stock</option>
                <option value="unavailable">Unavailable</option>
              </Select>
            </FormField>
            <div>
              <p className="mb-1.5 text-[0.74rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Badge preview</p>
              <AvailabilityBadge availability={availability} />
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-error/30 bg-error/[0.04] p-5">
            <h2 className="font-display text-[1rem] font-semibold text-error">Danger zone</h2>
            <p className="text-[0.8rem] leading-relaxed text-muted-foreground">
              Archiving hides the product from every storefront surface and keeps its history for audit.
            </p>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="block">
                  <button
                    type="button"
                    disabled
                    title="Archiving is not available in this console yet"
                    className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-error/40 text-sm font-medium text-error"
                  >
                    <Archive className="size-4" aria-hidden="true" />
                    Archive product
                  </button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Archiving is not available in this console yet</TooltipContent>
            </Tooltip>
          </section>
        </aside>
      </div>
    </div>
  );
}
