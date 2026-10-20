import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Brand mark — vapor-diamond monogram + wordmark.
 * Pure SVG + type; no image dependency.
 *
 * Rendered inside client components (header, mobile sheet, admin shell,
 * auth screens), so it stays synchronous: server callers that already
 * hold site settings pass `brandName` explicitly; everyone else gets the
 * compiled-in brand default.
 */
export function Logo({
  className,
  compact = false,
  brandName = "VAPETIVE",
}: {
  className?: string;
  compact?: boolean;
  brandName?: string;
}) {
  return (
    <Link
      href="/"
      aria-label={`${brandName} — home`}
      className={cn("group inline-flex items-center gap-2.5", className)}
    >
      <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true" className="shrink-0">
        <defs>
          <linearGradient id="logo-grad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#a78bfa" />
            <stop offset="0.55" stopColor="#8b5cf6" />
            <stop offset="1" stopColor="#6fd6f2" />
          </linearGradient>
        </defs>
        <path
          d="M16 2.5 28.5 16 16 29.5 3.5 16 16 2.5Z"
          stroke="url(#logo-grad)"
          strokeWidth="1.6"
          fill="rgba(139,92,246,0.08)"
          className="transition-all duration-500 group-hover:fill-[rgba(139,92,246,0.2)]"
        />
        <path d="M16 9.5 21.5 16 16 22.5 10.5 16 16 9.5Z" fill="url(#logo-grad)" opacity="0.9" />
        <circle cx="25.4" cy="6.6" r="1.5" fill="#9fe3f7" opacity="0.9" />
      </svg>
      {!compact && (
        <span className="font-display text-[1.05rem] font-bold tracking-[0.32em] text-foreground">
          {brandName}
        </span>
      )}
    </Link>
  );
}
