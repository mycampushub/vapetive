/* Visitor-side verification: color/origin selection swaps the gallery image. */
import { chromium } from "playwright-core";

const EXE = "/home/z/.cache/ms-playwright/chromium_headless_shell-1200/chrome-headless-shell-linux64/chrome-headless-shell";
const BASE = "http://localhost:3000";

const session = process.env.VAP_SESSION;
if (!session) { console.error("VAP_SESSION not set"); process.exit(1); }

const browser = await chromium.launch({ executablePath: EXE, args: ["--no-sandbox"] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
await context.addCookies([{ name: "vapetive_session", value: session, domain: "localhost", path: "/" }]);
const page = await context.newPage();

const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 160)); });
page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));

await page.goto(`${BASE}/products/iqos-iluma-amber`, { waitUntil: "networkidle" });

// Age gate
const ageBtn = page.locator("button", { hasText: /18 or older/i }).first();
if (await ageBtn.count()) { await ageBtn.click(); await page.waitForTimeout(400); }

const mainSrc = () => page.evaluate(() => {
  const imgs = [...document.querySelectorAll("button[aria-label^='Zoom image'] img")];
  return imgs[0]?.getAttribute("src") ?? null;
});
const groupTitles = () => page.evaluate(() =>
  [...document.querySelectorAll("legend")].map((l) => l.textContent.trim())
);

console.log("groups:", JSON.stringify(await groupTitles()));
console.log("initial main image:", await mainSrc());

// Click "Midnight Blue" colour pill
await page.locator("button", { hasText: "Midnight Blue" }).first().click();
await page.waitForTimeout(600);
console.log("after Midnight Blue:", await mainSrc());

// Click "Crimson"
await page.locator("button", { hasText: "Crimson" }).first().click();
await page.waitForTimeout(600);
console.log("after Crimson:", await mainSrc());

// Click "Japan" origin pill (Indonesia is auto-selected on load — a no-op)
await page.locator("button", { hasText: "Japan" }).first().click();
await page.waitForTimeout(600);
console.log("after Japan:", await mainSrc());

// Back to a colour — Crimson photo returns
await page.locator("button", { hasText: "Crimson" }).first().click();
await page.waitForTimeout(600);
console.log("back to Crimson:", await mainSrc());

// Thumbnails reflect the promoted image too
const thumbs = await page.evaluate(() =>
  [...document.querySelectorAll("button[aria-label^='View image'] img")].map((i) => i.getAttribute("src"))
);
console.log("thumbs after selection:", JSON.stringify(thumbs));

// Add to cart → toast shows the variant label
await page.locator("button", { hasText: "Add to cart" }).first().click();
await page.waitForTimeout(800);
const toastText = await page.evaluate(() => document.querySelector("[role='status'], [aria-live='polite']")?.textContent ?? "(no toast)");
console.log("toast:", toastText.slice(0, 120));

// Overflow check at mobile width
await page.setViewportSize({ width: 320, height: 800 });
await page.waitForTimeout(500);
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
console.log("320px overflow px:", overflow);

console.log("console errors:", JSON.stringify(errors.slice(0, 5)));
await page.screenshot({ path: "/tmp/verify-product-mobile.png", fullPage: false });
await browser.close();
console.log("VISITOR VERIFY DONE");
