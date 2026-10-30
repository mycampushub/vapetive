/**
 * Overflow audit for /account — loads the page signed-in at several
 * viewport widths and reports document-level horizontal scroll plus
 * the specific elements that extend past the viewport.
 *
 * Run: cd /tmp && bun /home/z/my-project/scripts/overflow-audit.mjs
 * (playwright-core is installed in /tmp/node_modules)
 */
import { execSync } from "node:child_process";
import { chromium } from "playwright-core";

const EXE = "/home/z/.cache/ms-playwright/chromium_headless_shell-1200/chrome-headless-shell-linux64/chrome-headless-shell";
const BASE = "http://localhost:3000";
const WIDTHS = [360, 390, 430, 768, 1024, 1280, 1440];

/** Sign in via curl (playwright-core under bun fails to parse Set-Cookie) and return the session token. */
function sessionToken() {
  const out = execSync(
    `curl -s -D - -o /dev/null -X POST ${BASE}/api/v1/auth/sign-in -H "content-type: application/json" ` +
    `-d '{"email":"admin@vapetive.example","password":"Admin#Vapetive2025"}' --max-time 20`,
    { encoding: "utf8" }
  );
  const m = out.match(/vapetive_session=([^;]+)/);
  if (!m) throw new Error("no session cookie in sign-in response");
  return m[1];
}

const TOKEN = sessionToken();
console.log("signed in, token acquired");
const browser = await chromium.launch({ executablePath: EXE });

for (const width of WIDTHS) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  await context.addCookies([{ name: "vapetive_session", value: TOKEN, domain: "localhost", path: "/" }]);
  const page = await context.newPage();
  await page.goto(`${BASE}/account`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1200);

  const result = await page.evaluate(() => {
    const doc = document.documentElement;
    const scrollW = doc.scrollWidth;
    const clientW = doc.clientWidth;
    const overflowX = scrollW - clientW;
    const offenders = [];
    if (overflowX > 1) {
      const all = document.querySelectorAll("*");
      for (const el of all) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && (r.right > clientW + 1 || r.left < -1)) {
          // skip elements inside a genuinely scrollable container
          let p = el.parentElement, scrollable = false;
          while (p) {
            const s = getComputedStyle(p);
            if (/(auto|scroll)/.test(s.overflowX) && p.scrollWidth > p.clientWidth + 1) { scrollable = true; break; }
            p = p.parentElement;
          }
          if (scrollable) continue;
          offenders.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className && typeof el.className === "string") ? el.className.slice(0, 160) : "",
            text: (el.textContent || "").trim().slice(0, 60),
            left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width),
          });
        }
      }
    }
    return { scrollW, clientW, overflowX, offenders: offenders.slice(0, 12) };
  });

  console.log(`\n=== width ${width}px ===`);
  console.log(`scrollWidth=${result.scrollW} clientWidth=${result.clientW} overflowX=${result.overflowX}px ${result.overflowX > 1 ? "*** HORIZONTAL SCROLL ***" : "ok"}`);
  for (const o of result.offenders) {
    console.log(`  <${o.tag}> [${o.cls}] w=${o.width} L=${o.left} R=${o.right} text="${o.text}"`);
  }
  await context.close();
}

await browser.close();
console.log("\nDONE");
