import { chromium } from "playwright-core";

const EXE = "/home/z/.cache/ms-playwright/chromium_headless_shell-1200/chrome-headless-shell-linux64/chrome-headless-shell";
const BASE = "http://localhost:3000";
const URL = `${BASE}/products/iqos-iluma-amber`;

const browser = await chromium.launch({ executablePath: EXE, args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await ctx.newPage();

await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });

// 18+ age gate — mounts after hydration, so wait for it explicitly
try {
  const gate = page.getByRole("button", { name: /18 or older/i }).first();
  await gate.waitFor({ state: "visible", timeout: 8000 });
  await gate.click();
  await page.waitForTimeout(800);
  console.log("age gate accepted");
} catch {
  console.log("no age gate appeared");
}

async function mainImageSrc() {
  return page.evaluate(() => {
    const imgs = [...document.querySelectorAll('img[alt*="— image"]')];
    const el = imgs.find((i) => i.getBoundingClientRect().width > 200);
    if (!el) return null;
    const u = new URL(el.src, location.origin);
    return decodeURIComponent(u.searchParams.get("url") ?? el.src);
  });
}

const results = [];
const label = async (t) => results.push(t);

await page.waitForTimeout(1000);
await label(`default main image: ${await mainImageSrc()}`);
await page.screenshot({ path: "/tmp/shot-default.png" });

// Click the Crimson colour pill
const crimson = page.getByRole("button", { name: /Crimson/i }).first();
if (await crimson.count()) {
  await crimson.click();
  await page.waitForTimeout(900);
  await label(`after Crimson:  ${await mainImageSrc()}`);
  await page.screenshot({ path: "/tmp/shot-crimson.png" });
} else {
  await label("!! Crimson pill NOT FOUND");
}

// Click Midnight Blue
const blue = page.getByRole("button", { name: /Midnight Blue/i }).first();
if (await blue.count()) {
  await blue.click();
  await page.waitForTimeout(900);
  await label(`after MidnBlue:  ${await mainImageSrc()}`);
  await page.screenshot({ path: "/tmp/shot-blue.png" });
} else {
  await label("!! Midnight Blue pill NOT FOUND");
}

// Click Japan origin
const japan = page.getByRole("button", { name: /^Japan/i }).first();
if (await japan.count()) {
  await japan.click();
  await page.waitForTimeout(900);
  await label(`after Japan:    ${await mainImageSrc()}`);
  await page.screenshot({ path: "/tmp/shot-japan.png" });
} else {
  await label("!! Japan pill NOT FOUND");
}

// Click Indonesia origin
const indonesia = page.getByRole("button", { name: /^Indonesia/i }).first();
if (await indonesia.count()) {
  await indonesia.click();
  await page.waitForTimeout(900);
  await label(`after Indonesia: ${await mainImageSrc()}`);
  await page.screenshot({ path: "/tmp/shot-indonesia.png" });
} else {
  await label("!! Indonesia pill NOT FOUND");
}

// Overflow check at mobile width too
await page.setViewportSize({ width: 375, height: 800 });
await page.waitForTimeout(700);
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
await label(`mobile 375px overflow: ${overflow}px`);
await page.screenshot({ path: "/tmp/shot-mobile.png" });

console.log(results.join("\n"));
await browser.close();
