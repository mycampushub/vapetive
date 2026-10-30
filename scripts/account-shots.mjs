/**
 * Visual + overflow audit across the account area.
 * Screenshots at mobile widths; measures overflow; saves to /tmp/account-shots/.
 */
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright-core";

const EXE = "/home/z/.cache/ms-playwright/chromium_headless_shell-1200/chrome-headless-shell-linux64/chrome-headless-shell";
const BASE = "http://localhost:3000";
const OUT = "/tmp/account-shots";
mkdirSync(OUT, { recursive: true });

const PAGES = [
  ["account", "/account"],
  ["orders", "/account/orders"],
  ["saved", "/account/saved"],
  ["security", "/account/security"],
  ["profile", "/account/profile"],
  ["preferences", "/account/preferences"],
];
const WIDTHS = [320, 360];

function sessionToken() {
  const out = execSync(
    `curl -s -D - -o /dev/null -X POST ${BASE}/api/v1/auth/sign-in -H "content-type: application/json" ` +
    `-d '{"email":"admin@vapetive.example","password":"Admin#Vapetive2025"}' --max-time 20`,
    { encoding: "utf8" }
  );
  const m = out.match(/vapetive_session=([^;]+)/);
  if (!m) throw new Error("no session cookie");
  return m[1];
}

const TOKEN = sessionToken();
const browser = await chromium.launch({ executablePath: EXE });

for (const width of WIDTHS) {
  for (const [name, path] of PAGES) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, deviceScaleFactor: 2 });
    await context.addCookies([{ name: "vapetive_session", value: TOKEN, domain: "localhost", path: "/" }]);
    const page = await context.newPage();
    try {
      await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 60000 });
      await page.waitForTimeout(1500);
      const m = await page.evaluate(() => {
        const doc = document.documentElement;
        return { scrollW: doc.scrollWidth, clientW: doc.clientWidth };
      });
      const flag = m.scrollW > m.clientW + 1 ? `*** OVERFLOW ${m.scrollW - m.clientW}px ***` : "ok";
      console.log(`${name} @${width}: scrollW=${m.scrollW} clientW=${m.clientW} ${flag}`);
      await page.screenshot({ path: `${OUT}/${name}-${width}.png`, fullPage: true });
    } catch (err) {
      console.log(`${name} @${width}: ERROR ${err.message.split("\n")[0]}`);
    }
    await context.close();
  }
}

// Loading-state capture of /account at 360 (before data resolves)
{
  const context = await browser.newContext({ viewport: { width: 360, height: 844 }, deviceScaleFactor: 2 });
  await context.addCookies([{ name: "vapetive_session", value: TOKEN, domain: "localhost", path: "/" }]);
  const page = await context.newPage();
  await page.goto(`${BASE}/account`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(250);
  const m = await page.evaluate(() => {
    const doc = document.documentElement;
    return { scrollW: doc.scrollWidth, clientW: doc.clientWidth };
  });
  console.log(`account-loading @360: scrollW=${m.scrollW} clientW=${m.clientW} ${m.scrollW > m.clientW + 1 ? "*** OVERFLOW ***" : "ok"}`);
  await page.screenshot({ path: `${OUT}/account-loading-360.png`, fullPage: true });
  await context.close();
}

await browser.close();
console.log("DONE");
