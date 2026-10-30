/* Legacy product (static origin) + admin editor variant management. */
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
page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));

/* ---- legacy product: static origin pill still shows ---- */
await page.goto(`${BASE}/products/iqos-iluma-silver`, { waitUntil: "networkidle" });
const ageBtn = page.locator("button", { hasText: /18 or older/i }).first();
if (await ageBtn.count()) { await ageBtn.click(); await page.waitForTimeout(300); }
const groups = await page.evaluate(() => [...document.querySelectorAll("legend")].map((l) => l.textContent.trim()));
const originPill = await page.locator("span", { hasText: "Uzbekistan" }).count();
console.log("legacy groups:", JSON.stringify(groups), "| static origin pill count:", originPill);

/* ---- admin editor ---- */
await page.goto(`${BASE}/admin/catalog/products/prd_mvu58llrd344c47763f0be83f9ee`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.locator("button[role='tab']", { hasText: "Variants" }).click();
await page.waitForTimeout(400);

const sectionTitles = await page.evaluate(() =>
  [...document.querySelectorAll("[role='tabpanel'][data-state='active'] h3, [role='tabpanel'][data-state='active'] h2")].map((h) => h.textContent.trim())
);
console.log("variant sections:", JSON.stringify(sectionTitles));

// Count existing color rows
const colorInputs = await page.locator("input[type='color']").count();
console.log("swatch inputs before:", colorInputs);

// Add a colour
await page.locator("button", { hasText: "Add colour" }).first().click();
await page.waitForTimeout(300);
const newLabel = page.locator("input[id^='new_'][id$='-label']").last();
await newLabel.fill("Forest Green");
const swatchInput = page.locator("input[id^='new_'][id$='-swatch']").last();
await swatchInput.fill("#166534");

// Add an origin
await page.locator("button", { hasText: "Add origin" }).first().click();
await page.waitForTimeout(300);
const newOrigin = page.locator("input[id^='new_'][id$='-label']").last();
await newOrigin.fill("Vietnam");

// Save
await page.locator("button", { hasText: /^Save/i }).first().click();
await page.waitForTimeout(2500);
console.log("save toast:", (await page.evaluate(() => document.querySelector("[role='status'], [aria-live='polite']")?.textContent ?? "(none)")).slice(0, 90));

// Verify persistence via API
const res = await fetch(`${BASE}/api/v1/catalog/products/iqos-iluma-amber`);
const data = (await res.json()).data;
console.log("persisted variants:", JSON.stringify(data.variants.map((v) => `${v.type}:${v.label}${v.swatch ? ":" + v.swatch : ""}`)));

// Remove the test colour again to leave clean state
const crimsonInfo = data.variants.find((v) => v.label === "Forest Green");
if (crimsonInfo) {
  const del = await fetch(`${BASE}/api/v1/admin/products/prd_mvu58llrd344c47763f0be83f9ee`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", cookie: `vapetive_session=${session}` },
    body: JSON.stringify({ variantDeletes: [crimsonInfo.id] }),
  });
  console.log("cleanup Forest Green:", del.status);
}

console.log("page errors:", JSON.stringify(errors.slice(0, 5)));
await browser.close();
console.log("ADMIN VERIFY DONE");
