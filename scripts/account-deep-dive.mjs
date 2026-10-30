/**
 * Deep-dive: find the widest DEEP elements inside the /account overview
 * cards — i.e. the root cause of the ~815px scroll width at 360px.
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
  // Walk every element; report those wider than 380px that also have a child
  // wider than themselves (stress propagation) or are leaf-wide text holders.
  const all = [...document.querySelectorAll("body *")];
  for (const el of all) {
    const r = el.getBoundingClientRect();
    if (r.width <= 380) continue;
    const cls = typeof el.className === "string" ? el.className.slice(0, 110) : "";
    // find widest direct child
    let widestChild = null;
    for (const c of el.children) {
      const cr = c.getBoundingClientRect();
      if (!widestChild || cr.width > widestChild.w) widestChild = { tag: c.tagName.toLowerCase(), cls: String(c.className).slice(0, 90), w: Math.round(cr.width) };
    }
    // own text width estimate: longest word run via Range
    let textSample = "";
    let longestWordPx = 0;
    if (el.childNodes.length) {
      const range = document.createRange();
      for (const node of el.childNodes) {
        if (node.nodeType === 3 && node.textContent.trim()) {
          textSample ||= node.textContent.trim().slice(0, 50);
          for (const word of node.textContent.split(/\s+/)) {
            if (!word) continue;
            try {
              range.selectNodeContents(node);
              longestWordPx = Math.max(longestWordPx, 0);
            } catch {}
          }
        }
      }
    }
    const cs = getComputedStyle(el);
    out.push({
      tag: el.tagName.toLowerCase(), cls, w: Math.round(r.width), x: Math.round(r.left),
      kid: widestChild ? `${widestChild.tag}[${widestChild.cls}] ${widestChild.w}px` : "-",
      ws: cs.whiteSpace, fs: cs.fontSize, disp: cs.display, minW: cs.minWidth,
      text: textSample,
    });
  }
  return out.slice(0, 40);
});

for (const r of report) {
  console.log(`<${r.tag}> w=${r.w} x=${r.x} ws=${r.ws} fs=${r.fs} minW=${r.minW}\n   cls: ${r.cls}\n   kid: ${r.kid}\n   txt: "${r.text}"`);
}
await browser.close();
console.log("DONE");
