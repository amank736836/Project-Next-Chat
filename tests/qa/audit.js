/**
 * Exploratory QA sweep (not part of the CI suite).
 *
 *   QA_BASE_URL=http://localhost:3000 PW_CHROMIUM_PATH=/tmp/chromium \
 *   JWT_SECRET=qa ADMIN_SECRET_KEY=qa-admin node tests/qa/audit.js [--shots] [--axe]
 *
 * Visits every route at every requested viewport against a fully mocked API and
 * records: horizontal overflow (+ offending elements), console/page errors,
 * failed requests, broken images, small touch targets, tiny text, clipped
 * text, and (optionally) axe-core WCAG violations. Writes JSON + screenshots to
 * qa-artifacts/ (git-ignored).
 */
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const { chromium } = require("@playwright/test");
const { mockApi } = require("../support/mockApi");

const BASE = process.env.QA_BASE_URL || "http://localhost:3000";
const OUT = process.env.QA_OUT || path.join(__dirname, "../../qa-artifacts");
const SHOTS = process.argv.includes("--shots");
const AXE = process.argv.includes("--axe");
const only = (process.argv.find((a) => a.startsWith("--only=")) || "").slice(7);
const vpOnly = (process.argv.find((a) => a.startsWith("--vp=")) || "").slice(5);

const VIEWPORTS = [
  [320, 640], [375, 667], [390, 844], [425, 812],
  [768, 1024], [820, 1180], [1024, 768],
  [1280, 720], [1366, 768], [1440, 900], [1920, 1080], [2560, 1440],
];

const ROUTES = [
  { name: "login", url: "/login", auth: "anon" },
  { name: "forgot", url: "/forgot", auth: "anon" },
  { name: "verify", url: "/verify", auth: "anon" },
  { name: "privacy", url: "/privacy", auth: "anon" },
  { name: "terms", url: "/terms", auth: "anon" },
  { name: "not-found", url: "/definitely-missing", auth: "anon", noRedirectWait: true },
  { name: "admin-login", url: "/admin/login", auth: "anon" },
  { name: "admin-forgot", url: "/admin/forgot", auth: "anon" },
  { name: "public-profile", url: "/u/alex", auth: "anon" },
  { name: "showcase", url: "/showcase/alex", auth: "anon" },
  { name: "embed", url: "/embed/alex", auth: "anon" },
  { name: "home", url: "/", auth: "user" },
  { name: "groups", url: "/groups", auth: "user" },
  { name: "group-detail", url: "/groups?group=design", auth: "user" },
  { name: "chat", url: "/chat/design", auth: "user" },
  { name: "board", url: "/board", auth: "user" },
  { name: "own-profile", url: "/u/alex", auth: "user" },
  { name: "admin-dashboard", url: "/admin/dashboard", auth: "admin" },
  { name: "admin-users", url: "/admin/users", auth: "admin" },
  { name: "admin-chats", url: "/admin/chats", auth: "admin" },
  { name: "admin-messages", url: "/admin/messages", auth: "admin" },
];

const inPage = () => {
  const vw = window.innerWidth;
  const doc = document.documentElement;
  const out = { vw, scrollWidth: doc.scrollWidth, bodyScrollWidth: document.body.scrollWidth, scrollHeight: doc.scrollHeight };
  const sel = (el) => {
    let s = el.tagName.toLowerCase();
    if (el.id) s += "#" + el.id;
    const cls = typeof el.className === "string" ? el.className.trim().split(/\s+/).filter((c) => !c.startsWith("css-")).slice(0, 2) : [];
    if (cls.length) s += "." + cls.join(".");
    const al = el.getAttribute("aria-label");
    if (al) s += `[aria-label="${al.slice(0, 30)}"]`;
    const t = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 30);
    if (t && el.children.length < 2) s += ` "${t}"`;
    return s;
  };
  const clippedByAncestor = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (/(hidden|auto|scroll|clip)/.test(cs.overflowX)) {
        const r = p.getBoundingClientRect();
        if (r.right <= vw + 1) return true;
      }
      if (cs.position === "fixed") return false;
    }
    return false;
  };
  const visible = (el, r, cs) => r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && cs.opacity !== "0";
  const overflowing = [];
  const small = [];
  const tiny = [];
  const clipped = [];
  const brokenImgs = [];
  const noAlt = [];
  for (const el of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (!visible(el, r, cs)) continue;
    if ((r.right > vw + 1 || r.left < -1) && cs.position !== "fixed" && !clippedByAncestor(el) && overflowing.length < 12)
      overflowing.push({ el: sel(el), left: Math.round(r.left), right: Math.round(r.right) });
    const interactive = el.matches('a[href],button,input:not([type=hidden]),select,textarea,[role=button],[role=link],[role=tab],[role=menuitem],[role=checkbox],[tabindex]:not([tabindex="-1"])');
    if (interactive && (r.width < 24 || r.height < 24) && !(el.tagName === "A" && cs.display === "inline"))
      if (small.length < 15) small.push({ el: sel(el), w: Math.round(r.width), h: Math.round(r.height) });
    if (el.childNodes.length && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) {
      const fs = parseFloat(cs.fontSize);
      if (fs < 12 && tiny.length < 10) tiny.push({ el: sel(el), fs });
      if ((cs.overflow === "hidden" || cs.overflowX === "hidden") && el.scrollWidth > el.clientWidth + 2 && cs.textOverflow !== "ellipsis" && el.clientWidth > 0 && clipped.length < 10)
        clipped.push({ el: sel(el), sw: el.scrollWidth, cw: el.clientWidth });
    }
    if (el.tagName === "IMG") {
      if (el.complete && el.naturalWidth === 0 && el.currentSrc) brokenImgs.push(el.currentSrc.slice(0, 80));
      if (!el.hasAttribute("alt")) noAlt.push(sel(el));
    }
  }
  out.overflowing = overflowing;
  out.small = small;
  out.tiny = tiny;
  out.clipped = clipped;
  out.brokenImgs = brokenImgs;
  out.noAlt = noAlt;
  out.h1 = document.querySelectorAll("h1").length;
  out.main = document.querySelectorAll("main,[role=main]").length;
  out.title = document.title;
  out.lang = doc.lang;
  return out;
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const exe = process.env.PW_CHROMIUM_PATH;
  const browser = await chromium.launch({
    executablePath: exe || undefined,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const adminToken = jwt.sign({ secretKey: process.env.ADMIN_SECRET_KEY || "Admin@1234" }, process.env.JWT_SECRET || "fallback_secret");
  const axeSrc = AXE ? fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8") : "";
  const results = [];
  for (const [w, h] of VIEWPORTS) {
    if (vpOnly && String(w) !== vpOnly) continue;
    for (const route of ROUTES) {
      if (only && route.name !== only) continue;
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: w < 1024, isMobile: false });
      if (route.auth === "admin")
        await ctx.addCookies([{ name: process.env.STEALTHY_NOTE_ADMIN_TOKEN_NAME || "StealthyNoteAdminToken", value: adminToken, url: BASE }]);
      const page = await ctx.newPage();
      const errors = [];
      const failed = [];
      page.on("pageerror", (e) => errors.push("pageerror: " + e.message.slice(0, 200)));
      // /_vercel/* scripts only exist on Vercel hosting: environment noise.
      const noise = (t) => t.includes("/_vercel/") || t.includes("Failed to load resource") || t.includes("Socket server URL is not configured");
      page.on("console", (m) => {
        if (["error", "warning"].includes(m.type()) && !noise(m.text())) errors.push(`${m.type()}: ${m.text().slice(0, 200)}`);
      });
      page.on("requestfailed", (r) => !noise(r.url()) && failed.push(`${r.method()} ${r.url().slice(0, 100)} ${r.failure()?.errorText}`));
      page.on("response", (r) => {
        if (r.status() >= 400 && !noise(r.url()) && !(r.url().endsWith("/api/v1/user/me") && r.status() === 401)) failed.push(`${r.status()} ${r.request().method()} ${r.url().slice(0, 100)}`);
      });
      await mockApi(page, { viewer: route.auth === "user" || route.auth === "admin" ? undefined : null });
      if (route.auth === "anon") await page.route("**/api/v1/admin", (r) => r.fulfill({ json: { admin: false } }));
      let status = 0;
      try {
        const resp = await page.goto(BASE + route.url, { waitUntil: "load", timeout: 30000 });
        status = resp?.status() || 0;
        await page.waitForTimeout(route.noRedirectWait ? 300 : 1200);
        const m = await page.evaluate(inPage);
        m.status = status;
        m.finalUrl = page.url().replace(BASE, "");
        if (AXE) {
          await page.addScriptTag({ content: axeSrc });
          m.axe = await page.evaluate(async () => {
            const r = await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] } });
            return r.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) }));
          });
        }
        if (SHOTS) {
          const dir = path.join(OUT, "shots", String(w));
          fs.mkdirSync(dir, { recursive: true });
          await page.screenshot({ path: path.join(dir, `${route.name}.png`), fullPage: true, animations: "disabled" });
        }
        results.push({ vp: w, route: route.name, auth: route.auth, errors: [...new Set(errors)], failed: [...new Set(failed)], ...m });
      } catch (e) {
        results.push({ vp: w, route: route.name, fatal: e.message.slice(0, 200), errors, failed });
      }
      await ctx.close();
    }
    process.stderr.write(`done ${w}\n`);
  }
  await browser.close();
  fs.writeFileSync(path.join(OUT, `audit${only ? "-" + only : ""}${vpOnly ? "-" + vpOnly : ""}.json`), JSON.stringify(results, null, 1));
  // Summary
  for (const r of results) {
    const flags = [];
    if (r.fatal) flags.push("FATAL " + r.fatal);
    if (r.scrollWidth > r.vw) flags.push(`H-SCROLL ${r.scrollWidth}>${r.vw}`);
    if (r.overflowing?.length) flags.push(`overflowing:${r.overflowing.length}`);
    if (r.status >= 400) flags.push(`HTTP ${r.status}`);
    if (r.errors?.length) flags.push(`console:${r.errors.length}`);
    if (r.failed?.length) flags.push(`failed:${r.failed.length}`);
    if (r.brokenImgs?.length) flags.push("broken-img");
    if (r.clipped?.length) flags.push(`clipped:${r.clipped.length}`);
    if (flags.length) console.log(`${r.vp}\t${r.route}\t${flags.join(" | ")}`);
  }
})();
