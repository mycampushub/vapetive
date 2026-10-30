/**
 * Site-wide responsive audit — every major page at 320px (strictest)
 * and 360px, signed in as admin (so gated pages render too).
 */
import { execSync } from "node:child_process";
import { chromium } from "playwright-core";

const EXE = "/home/z/.cache/ms-playwright/chromium_headless_shell-1200/chrome-headless-shell-linux64/chrome-headless-shell";
const BASE = "http://localhost:3000";

const PAGES = [
  ["home", "/"],
  ["collections-index", "/collections"],
  ["collection", "/collections/heat-not-burn"],
  ["brand-index", "/brand"],
  ["brand", "/brand/iqos-iluma"],
  ["categories", "/categories"],
  ["product", "/products/iqos-iluma-amber"],
  ["cart", "/cart"],
  ["checkout", "/checkout"],
  ["discover", "/discover"],
  ["search", "/search?q=iqos"],
  ["saved", "/saved"],
  ["help", "/help"],
  ["faq", "/help/faq"],
  ["safety", "/safety"],
  ["compliance", "/compliance"],
  ["contact", "/contact"],
  ["about", "/about"],
  ["legal-terms", "/legal/terms"],
  ["sign-in", "/account/sign-in"],
  ["forgot-password", "/account/forgot-password"],
  ["admin-overview", "/admin"],
  ["admin-orders", "/admin/orders"],
  ["admin-customers", "/admin/customers"],
  ["admin-products", "/admin/catalog/products"],
  ["admin-media", "/admin/media"],
  ["admin-support", "/admin/support"],
  ["admin-settings", "/admin/settings"],
  ["admin-users", "/admin/users"],
  ["admin-roles", "/admin/roles"],
  ["admin-audit", "/admin/audit-log"],
];

function sessionToken() {
  const out = execSync(
    `curl -s -D - -o /dev/null -X POST ${BASE}/api/v1/auth/sign-in -H "content-type: application/json" ` +
    `-d '{"email":"admin@vapetive.example","password":"Admin#Vapetive2025"}' --max-time 20`,
    { encoding: "utf8" }
  );
  return out.match(/vapetive_session=([^;]+)/)[1];
}

const TOKEN = sessionToken();
const browser = await chromium.launch({ executablePath: EXE });
const problems = [];

for (const width of [320, 360]) {
  for (const [name, path] of PAGES) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    await context.addCookies([{ name: "vapetive_session", value: TOKEN, domain: "localhost", path: "/" }]);
    const page = await context.newPage();
    try {
      await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 60000 });
      await page.waitForTimeout(900);
      const m = await page.evaluate(() => {
        const doc = document.documentElement;
        return { sw: doc.scrollWidth, cw: doc.clientWidth };
      });
      if (m.sw > m.cw + 1) {
        const dump = await page.evaluate(() => {
          const cw = document.documentElement.clientWidth;
          const out = [];
          for (const el of document.querySelectorAll("body *")) {
            const r = el.getBoundingClientRect();
            if (r.right <= cw + 1 || r.width < 200) continue;
            let kidWide = false;
            for (const c of el.children) if (c.getBoundingClientRect().width > r.width - 2) kidWide = true;
            if (kidWide) continue;
            out.push(`<${el.tagName.toLowerCase()}> w=${Math.round(r.width)} R=${Math.round(r.right)} [${String(el.className).slice(0, 90)}] "${(el.textContent || "").trim().slice(0, 40)}"`);
          }
          return out.slice(0, 5);
        });
        problems.push(`${name} @${width}: sw=${m.sw} cw=${m.cw}`);
        console.log(`*** ${name} @${width}: OVERFLOW sw=${m.sw} cw=${m.cw}`);
        for (const d of dump) console.log(`      ${d}`);
      } else {
        console.log(`ok  ${name} @${width}`);
      }
    } catch (err) {
      console.log(`ERR ${name} @${width}: ${err.message.split("\n")[0].slice(0, 90)}`);
    }
    await context.close();
  }
}

await browser.close();
console.log(`\n=== ${problems.length} overflowing page(s) ===`);
