"use client";

import { useMemo } from "react";
import { Globe } from "lucide-react";
import { RadioGroup } from "@/components/forms/fields";
import type { ItemVariant } from "@/types";
import { cn } from "@/lib/utils";

const GROUP_ORDER: Array<{ type: ItemVariant["type"]; label: string }> = [
  { type: "flavor", label: "Flavour" },
  { type: "color", label: "Colour" },
  { type: "capacity", label: "Option" },
  { type: "nicotine", label: "Nicotine strength" },
];

/** Selection state shape: group type → selected variant id. */
export type VariantSelection = Record<string, string>;

/** First available variant per group — the default selection. */
export function initialVariantSelection(variants: ItemVariant[]): VariantSelection {
  const initial: VariantSelection = {};
  for (const { type } of GROUP_ORDER) {
    const firstAvailable = variants.find((v) => v.type === type && v.available);
    if (firstAvailable) initial[type] = firstAvailable.id;
  }
  return initial;
}

/**
 * The cart line's variant: the first selected group in GROUP_ORDER
 * (flavour beats colour beats capacity beats nicotine).
 */
export function primaryVariantId(selection: VariantSelection): string | null {
  for (const { type } of GROUP_ORDER) {
    const id = selection[type];
    if (id) return id;
  }
  return null;
}

/**
 * VariantPicker — variant selection for a record's variants. Controlled:
 * selection state lives in ProductOrderActions so "Add to cart" always
 * agrees with what the user sees. Unavailable options are disabled with
 * an explanatory tooltip.
 */
export function VariantPicker({
  variants,
  value,
  onChange,
  origin,
}: {
  variants: ItemVariant[];
  value: VariantSelection;
  onChange: (next: VariantSelection) => void;
  /** Product origin (country/line of manufacture) — rendered as its own
   *  "Origin" group right after Flavour: label in the legend, value as a
   *  selected-style pill below (mirrors the Flavour group exactly). */
  origin?: string;
}) {
  const groups = useMemo(
    () =>
      GROUP_ORDER.map(({ type, label }) => ({
        type,
        label,
        options: variants.filter((v) => v.type === type),
      })).filter((group) => group.options.length > 0),
    [variants]
  );

  if (groups.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line-strong px-4 py-3 text-[0.82rem] text-muted-foreground">
        This product ships in a single configuration.
      </p>
    );
  }

  return (
    <div role="group" aria-label="Product options" className="space-y-5">
      {groups.map((group) => {
        if (group.type === "nicotine") {
          return (
            <RadioGroup
              key={group.type}
              name={`variant-${group.type}`}
              label={group.label}
              value={value[group.type] ?? ""}
              onChange={(next) => onChange({ ...value, [group.type]: next })}
              options={group.options.map((v) => ({
                value: v.id,
                label: v.label,
                description: v.available ? v.meta : (v.meta ?? "Currently unavailable"),
              }))}
            />
          );
        }

        const hasUnavailable = group.options.some((v) => !v.available);
        const showOrigin = group.type === "flavor" && Boolean(origin);
        return (
          <div
            key={group.type}
            className={cn(
              "grid gap-5",
              // Side by side at every width: flavour column hugs its pill,
              // origin takes the rest (its long value wraps inside the pill).
              // From sm up the split is the approved equal 50/50.
              showOrigin && "grid-cols-[auto_minmax(0,1fr)] sm:grid-cols-2",
            )}
          >
            <fieldset className="space-y-2.5">
              <legend className="text-[0.82rem] font-medium text-foreground">{group.label}</legend>
              <div role="group" aria-label={group.label} className="flex flex-wrap gap-2">
              {group.options.map((variant) => {
                const isSelected = value[group.type] === variant.id;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    aria-pressed={isSelected}
                    disabled={!variant.available}
                    title={
                      variant.available
                        ? variant.label
                        : `${variant.label} — ${variant.meta ?? "currently unavailable"}`
                    }
                    onClick={() => onChange({ ...value, [group.type]: variant.id })}
                    className={cn(
                      "inline-flex min-h-10 items-center gap-2.5 rounded-full border px-4 text-[0.82rem] font-medium transition-colors",
                      isSelected
                        ? "border-violet-glow bg-violet-glow/15 text-foreground"
                        : "border-line text-muted-foreground hover:border-line-strong hover:text-foreground",
                      !variant.available && "cursor-not-allowed line-through opacity-45 hover:border-line hover:text-muted-foreground"
                    )}
                  >
                    {variant.swatch && (
                      <span
                        aria-hidden="true"
                        className="size-3.5 shrink-0 rounded-full border border-white/20"
                        style={{ backgroundColor: variant.swatch }}
                      />
                    )}
                    {variant.label}
                  </button>
                );
              })}
            </div>
            {hasUnavailable && (
              <p className="text-[0.72rem] text-muted-foreground">Struck-through options are currently unavailable.</p>
            )}
            </fieldset>

            {/* Origin — mirrors the Flavour group (same legend style, value as a
                selected-style pill below; static attribute, so a span not a button).
                Shares the grid row with Flavour on sm+; stacks beneath on mobile. */}
            {showOrigin && (
              <fieldset className="space-y-2.5">
                <legend className="text-[0.82rem] font-medium text-foreground">Origin</legend>
                <div role="group" aria-label="Origin" className="flex flex-wrap gap-2">
                  <span
                    title={`Origin: ${origin}`}
                    className="inline-flex min-h-10 cursor-default items-center gap-2.5 rounded-full border border-violet-glow bg-violet-glow/15 px-4 py-2 text-[0.82rem] font-medium leading-snug text-foreground"
                  >
                    <Globe className="size-3.5 shrink-0 text-violet-soft" aria-hidden="true" />
                    {origin}
                  </span>
                </div>
              </fieldset>
            )}
          </div>
        );
      })}
    </div>
  );
}
