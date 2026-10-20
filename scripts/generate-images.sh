#!/bin/bash
# VAPETIVE — batch brand imagery generation
# Runs z-ai image CLI with concurrency 5, retries each failure once.
mkdir -p /home/z/my-project/public/products /home/z/my-project/public/brand

STYLE="premium product photography, luxury tech brand aesthetic, dark near-black background with subtle violet and cyan rim lighting, soft wisps of vapor smoke, centered composition, studio lighting, high quality, detailed, no text, no watermark"

gen() {
  local prompt="$1"; local out="$2"; local size="${3:-1024x1024}"
  [ -s "$out" ] && { echo "SKIP: $out"; return 0; }
  for attempt in 1 2; do
    if z-ai image -p "$prompt" -o "$out" -s "$size" >/dev/null 2>&1 && [ -s "$out" ]; then
      echo "OK: $out"
      return 0
    fi
    sleep 2
  done
  echo "FAIL: $out"
}

P=/home/z/my-project/public/products
B=/home/z/my-project/public/brand

# ---- Products (batch 1) ----
gen "sleek compact disposable vape device, matte black with soft-touch finish and violet accent ring, $STYLE" "$P/aura-700.jpg" &
gen "two compact disposable vape devices lying parallel, mint green and amber finishes, matte black bodies, $STYLE" "$P/aura-700-2.jpg" &
gen "tall curved disposable vape device with liquid level window, matte black and violet gradient finish, $STYLE" "$P/dune-pro-2500.jpg" &
gen "back view of tall curved disposable vape device showing airflow details, dark metallic finish, $STYLE" "$P/dune-pro-2500-2.jpg" &
gen "refillable pod vape system with anodised aluminium frame and transparent e-liquid pod, graphite color, $STYLE" "$P/halo-pod-kit.jpg" &
wait
# ---- Products (batch 2) ----
gen "pod vape system in violet anodised aluminium with USB-C port visible, three quarter view, $STYLE" "$P/halo-pod-kit-2.jpg" &
gen "slim pod vape device with lanyard loop and pressurised sealed pod, obsidian black, minimal design, $STYLE" "$P/eclipse-pod-kit.jpg" &
gen "slim pod vape device in warm sand color beside its charging cable, desert tones, $STYLE" "$P/eclipse-pod-kit-2.jpg" &
gen "e-liquid bottle 30ml, frosted glass with violet gradient label panel, child-resistant cap, $STYLE" "$P/nebula-freebase-30.jpg" &
gen "e-liquid bottle 30ml with green-teal gradient panel and dropper-style cap, $STYLE" "$P/sirocco-salt-30.jpg" &
wait
# ---- Products (batch 3) ----
gen "shortfill e-liquid bottle 60ml, deep blue gradient glass, oversized cap, $STYLE" "$P/zephyr-shortfill-60.jpg" &
gen "box mod vape kit with carbon fiber panels and small OLED screen, next to refillable tank, $STYLE" "$P/obsidian-80w-kit.jpg" &
gen "box mod vape kit in polished chrome finish, dramatic side lighting, $STYLE" "$P/obsidian-80w-kit-2.jpg" &
gen "all-in-one vape device, brushed steel body with rotary airflow collar, cylindrical, $STYLE" "$P/cirrus-aio.jpg" &
gen "five metal mesh vape coils arranged in a row on dark surface, macro detail, $STYLE" "$P/mesh-coil-5pack.jpg" &
wait
# ---- Products (batch 4) + brand + og ----
gen "three resin drip tips in violet swirl and graphite, in magnetic presentation case, macro photography, $STYLE" "$P/drip-tip-set.jpg" &
gen "braided nylon USB-C cable coiled elegantly, aluminium connectors, dark background, $STYLE" "$P/type-c-cable.jpg" &
gen "abstract dark luxury interior of a design atelier, swirling violet and ice-blue smoke in air, glass vessels and sketches on table, cinematic mood, editorial photography, high quality" "$B/atelier.jpg" 1344x768 &
gen "macro abstract of liquid blending in glass laboratory vessel, violet and cyan fluid art on black background, cinematic, high quality" "$B/craft.jpg" 1344x768 &
wait
gen "cinematic abstract wide banner, elegant violet and ice-blue smoke wisps flowing horizontally across near-black background, premium minimal, high quality, no text" "/home/z/my-project/public/og-image.jpg" 1440x720 &

wait
echo "ALL DONE"
