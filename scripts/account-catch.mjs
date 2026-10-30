/**
 * Catch the EPISODIC 815px overflow on /account: keep the page open,
 * re-measure every 300ms for 25s, and at the moment of overflow dump
 * the widest elements + their ancestor chain.
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

await page.goto(`${BASE}/account`, { waitUntil: "domcontentloaded", timeout: 60000 });

let caught = 0;
for (let t = 0; t < 250; t++) {
  const m = await page.evaluate(() => {
    const doc = document.documentElement;
    return { sw: doc.scrollWidth, cw: doc.clientWidth };
  });
  if (m.sw > m.cw + 1) {
    caught++;
    const dump = await page.evaluate(() => {
      const lines = [];
      const cw = document.documentElement.clientWidth;
      for (const el of document.querySelectorAll("body *")) {
        const r = el.getBoundingClientRect();
        if (r.width < 500 || r.right <= cw + 1) continue;
        // deepest 3 with big width
        let hasBigKid = false;
        for (const c of el.children) if (c.getBoundingClientRect().width > r.width - 2) hasBigKid = true;
        lines.push({
          deep: !hasBigKid,
          tag: el.tagName.toLowerCase(),
          cls: (typeof el.className === "string" ? el.className : "").slice(0, 120),
          w: Math.round(r.width), x: Math.round(r.left), right: Math.round(r.right),
          text: (el.textContent || "").trim().slice(0, 60),
        });
      }
      return lines;
    });
    console.log(`\n### t=${t * 0.3}s OVERFLOW sw=${m.sw} cw=${m.cw}`);
    for (const d of dump.filter((d) => d.deep).slice(0, 6)) {
      console.log(`  DEEP <${d.tag}> w=${d.w} ${d.x}->${d.right} [${d.cls}] "${d.text}"`);
    }
    if (caught >= 3) break;
  }
  await page.waitForTimeout(300);
}

console.log(`\ncaught ${caught} overflow sample(s) in 75s window`);
await browser.close();
console.log("DONE");
