/**
 * Find ALL elements ≥600px wide at 360px viewport on /account — the true
 * fixed-width culprit — plus the grid containers' computed templates.
 */
import { execSync } from "node:child_process";
import { chromium } from "playwright-core";

const EXE = "/home/z/.cache/ms-playwright/chromium_headless_shell-1200/chrome-headless-shell-linux64/chrome-headless-shell";
const BASE = "http://localhost:3000";

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
const context = await browser.newContext({ viewport: { width: 360, height: 844 } });
await context.addCookies([{ name: "vapetive_session", value: TOKEN, domain: "localhost", path: "/" }]);
const page = await context.newPage();
await page.goto(`${BASE}/account`, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(1500);

const report = await page.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.width < 600) continue;
    const cs = getComputedStyle(el);
    out.push({
      tag: el.tagName.toLowerCase(),
      cls: (typeof el.className === "string" ? el.className : "").slice(0, 130),
      w: Math.round(r.width), x: Math.round(r.left), right: Math.round(r.right),
      disp: cs.display, gtc: cs.gridTemplateColumns, pos: cs.position,
      text: (el.textContent || "").trim().slice(0, 70),
    });
  }
  return out;
});

for (const r of report) {
  console.log(`<${r.tag}> w=${r.w} x=${r.x}->${r.right} disp=${r.disp} pos=${r.pos} gtc="${r.gtc}"\n   cls: ${r.cls}\n   txt: "${r.text}"\n`);
}
await browser.close();
console.log("DONE");
