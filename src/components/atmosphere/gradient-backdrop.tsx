/**
 * GradientBackdrop — static layered page background (server component).
 * Subtle violet/ice field + vignette. Never intercepts events.
 */
export function GradientBackdrop({ variant = "page" }: { variant?: "page" | "account" | "admin" }) {
  const bg =
    variant === "admin"
      ? "radial-gradient(120% 90% at 80% -10%, rgba(139,92,246,0.07), transparent 55%)"
      : variant === "account"
        ? "radial-gradient(110% 70% at 12% -8%, rgba(139,92,246,0.16), transparent 52%), radial-gradient(90% 60% at 100% 110%, rgba(111,214,242,0.1), transparent 55%)"
        : "radial-gradient(120% 80% at 70% -10%, rgba(139,92,246,0.14), transparent 55%), radial-gradient(90% 60% at 0% 110%, rgba(111,214,242,0.08), transparent 55%)";

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-20"
      style={{
        background: `linear-gradient(180deg, #060409 0%, #0a0712 42%, #060409 100%)`,
      }}
    >
      <div className="absolute inset-0" style={{ background: bg }} />
      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(140% 110% at 50% 45%, transparent 55%, rgba(0,0,0,0.42) 100%)" }}
      />
    </div>
  );
}
