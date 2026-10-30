/**
 * Trace the ancestor chain of the first overview card on /account at 360px:
 * print each ancestor's clientWidth + display + grid template to find where
 * the ~815px width is born.
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

const chain = await page.evaluate(() => {
  const section = document.querySelector('section[aria-labelledby="overview-profile-heading"]');
  if (!section) return [{ info: "section not found" }];
  const rows = [];
  // 1) the section's OWN min-content width (clone, width:min-content)
  const clone = section.cloneNode(true);
  const sandbox = document.createElement("div");
  sandbox.style.cssText = "position:absolute;left:-99999px;top:0;width:min-content;visibility:hidden";
  sandbox.appendChild(clone);
  document.body.appendChild(sandbox);
  const minContent = sandbox.getBoundingClientRect().width;
  sandbox.remove();
  rows.push({ info: `PROFILE CARD min-content = ${Math.round(minContent)}px` });

  // 2) ancestor chain
  let el = section;
  while (el && el !== document.documentElement) {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    rows.push({
      tag: el.tagName.toLowerCase(),
      cls: (typeof el.className === "string" ? el.className : "").slice(0, 110),
      w: Math.round(r.width),
      disp: cs.display,
      gtc: cs.gridTemplateColumns,
      minW: cs.minWidth,
      ovx: cs.overflowX,
    });
    el = el.parentElement;
  }
  return rows;
});

for (const r of chain) {
  if (r.info) { console.log(`>>> ${r.info}`); continue; }
  console.log(`<${r.tag}> w=${r.w} disp=${r.disp} gtc="${r.gtc}" minW=${r.minW} ovx=${r.ovx}\n    cls: ${r.cls}`);
}
await browser.close();
console.log("DONE");
