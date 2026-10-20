"use client";

import { useMotionBoundary } from "./motion-boundary";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * SmokeTexture — REAL photographic smoke, keyed to transparency.
 *
 * Source PNGs (public/smoke/*) are white vapor with a luminance-keyed
 * alpha channel. The texture is tinted to an LED colour by painting a
 * solid colour and masking it with the PNG's alpha — so the smoke reads
 * as coloured neon vapor while keeping all photographic detail.
 * Screen blending melts it into the dark scene.
 *
 * Motion is pure CSS transform/opacity (drift/churn/fog keyframes) and
 * pauses off-screen via MotionBoundary; reduced motion parks it static.
 */

export type SmokeTextureAsset = "plume" | "wisps" | "column";

const ASSET_SRC: Record<SmokeTextureAsset, string> = {
  plume: "/smoke/smoke-plume.png",
  wisps: "/smoke/smoke-wisps.png",
  column: "/smoke/smoke-column.png",
};

export interface SmokeTextureProps {
  /** Which keyed PNG to use. */
  asset: SmokeTextureAsset;
  /** LED tint colour (any CSS colour). Omit for pure white vapor. */
  color?: string;
  /** Drift keyframe suffix (anim-<drift>). */
  drift?: "drift-a" | "drift-b" | "drift-c" | "churn-a" | "churn-b" | "fog-x";
  /** Animation duration seconds. */
  duration?: number;
  /** Animation delay seconds (negative desyncs). */
  delay?: number;
  /** Layer opacity 0..1. */
  opacity?: number;
  /** Box width/height in % of the hosting scene. */
  width: string;
  height?: string;
  /** Centre offset in % of the host. */
  x?: number;
  y?: number;
  /** Soften edges. */
  blur?: number;
  /** Mirror horizontally / vertically for variety. */
  flipX?: boolean;
  flipY?: boolean;
  className?: string;
}

export function SmokeTexture({
  asset,
  color,
  drift = "drift-a",
  duration = 44,
  delay = 0,
  opacity = 0.5,
  width,
  height,
  x = 0,
  y = 0,
  blur = 0,
  flipX = false,
  flipY = false,
  className,
}: SmokeTextureProps) {
  const { visible, preset } = useMotionBoundary();
  const prefersReduced = useReducedMotion();
  const reduced = preset === "reduced" || Boolean(prefersReduced);

  return (
    <div
      aria-hidden="true"
      className={cn(`anim-${drift} pointer-events-none absolute`, className)}
      style={{
        left: `${50 + x}%`,
        top: `${50 + y}%`,
        width,
        height: height ?? "auto",
        aspectRatio: asset === "column" ? "768 / 1344" : "1200 / 686",
        opacity: reduced ? Math.min(opacity, 0.2) : opacity,
        filter: blur > 0 ? `blur(${blur}px)` : undefined,
        mixBlendMode: "screen",
        transform: `translate(-50%, -50%) ${flipX ? "scaleX(-1)" : ""} ${flipY ? "scaleY(-1)" : ""}`.trim(),
        animationPlayState: reduced || !visible ? "paused" : "running",
        ["--dur" as string]: `${duration}s`,
        animationDelay: `${delay}s`,
      }}
    >
      {/* Colour layer masked by the smoke's alpha — LED-tinted vapor.
          Note: position/size are SEPARATE properties — mask-image does
          not accept the shorthand's position/size suffix. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: color ?? "#ffffff",
          WebkitMaskImage: `url("${ASSET_SRC[asset]}")`,
          WebkitMaskSize: "contain",
          WebkitMaskPosition: "center",
          WebkitMaskRepeat: "no-repeat",
          maskImage: `url("${ASSET_SRC[asset]}")`,
          maskSize: "contain",
          maskPosition: "center",
          maskRepeat: "no-repeat",
        }}
      />
    </div>
  );
}
