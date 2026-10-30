/* Cart with a colour variant + desktop screenshot of the variant UI. */
import { chromium } from "playwright-core";

const EXE = "/home/z/.cache/ms-playwright/chromium_headless_shell-1200/chrome-headless-shell-linux64/chrome-headless-shell";
const BASE = "http://localhost:3000";
const session = process.env.VAP_SESSION;

const browser = await chromium.launch({ executablePath: EXE, args: ["--no-sandbox"] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
await context.addCookies([{ name: "vapetive_session", value: session, domain: "localhost", path: "/" }]);
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));

await page.goto(`${BASE}/products/iqos-iluma-amber`, { waitUntil: "networkidle" });
const ageBtn = page.locator("button", { hasText: /18 or older/i }).first();
if (await ageBtn.count()) { await ageBtn.click(); await page.waitForTimeout(300); }

// Pick Crimson (colour) then add to cart
await page.locator("button", { hasText: "Crimson" }).first().click();
await page.waitForTimeout(400);
await page.screenshot({ path: "/tmp/product-variant-desktop.png", fullPage: false });
await page.locator("button", { hasText: "Add to cart" }).first().click();
await page.waitForTimeout(900);

await page.goto(`${BASE}/cart`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
const cartText = await page.evaluate(() => document.querySelector("main")?.textContent?.replace(/\s+/g, " ").slice(0, 500) ?? "");
console.log("cart page text:", cartText.slice(0, 300));
console.log("contains Crimson:", cartText.includes("Crimson"));
console.log("page errors:", JSON.stringify(errors.slice(0, 5)));
await page.screenshot({ path: "/tmp/cart-variant.png", fullPage: false });
await browser.close();
console.log("CART VERIFY DONE");
