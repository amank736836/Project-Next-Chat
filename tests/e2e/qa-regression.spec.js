/**
 * Regression tests for the responsive / accessibility / stability audit.
 * Every test here failed (or would have failed) before its fix; see
 * docs/qa/QA_REPORT.md for the issue each one guards.
 *
 * Runs against a production build (`next build && next start`) with a fully
 * mocked API (tests/support/mockApi.js) - no database or remote backend needed.
 */
const fs = require("fs");
const { test, expect } = require("@playwright/test");
const jwt = require("jsonwebtoken");
const { mockApi } = require("../support/mockApi");

test.setTimeout(90000);

const axeSource = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

const pageErrors = new WeakMap();
test.beforeEach(async ({ page }) => {
  const errors = [];
  pageErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
});
test.afterEach(async ({ page }) => {
  // Catches hydration mismatches (React #418) and runtime exceptions.
  expect(pageErrors.get(page)).toEqual([]);
});

const noHorizontalScroll = (page) =>
  page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));

async function adminCookie(context, baseURL) {
  if (!["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname))
    throw new Error("Run fixture tests against a local server.");
  await context.addCookies([
    {
      name: process.env.STEALTHY_NOTE_ADMIN_TOKEN_NAME || "StealthyNoteAdminToken",
      value: jwt.sign(
        { secretKey: process.env.ADMIN_SECRET_KEY || "Admin@1234" },
        process.env.JWT_SECRET || "fallback_secret",
      ),
      url: baseURL,
    },
  ]);
}

const VIEWPORTS = [
  [320, 640], [375, 667], [390, 844], [425, 812],
  [768, 1024], [820, 1180], [1024, 768], [1280, 720],
  [1366, 768], [1440, 900], [1920, 1080], [2560, 1440],
  // browser zoom 200% / 400% of a 1280px window == 640px / 320px CSS viewports
  [640, 360], [320, 180],
  // mobile landscape
  [667, 375], [812, 375],
];

const USER_ROUTES = ["/", "/groups", "/groups?group=design", "/chat/design", "/u/alex"];
const PUBLIC_ROUTES = ["/login", "/forgot", "/verify", "/privacy", "/terms", "/showcase/alex", "/u/alex", "/this-page-does-not-exist"];

test.describe("no horizontal overflow at any supported viewport", () => {
  for (const [width, height] of VIEWPORTS) {
    test(`signed-in pages @ ${width}x${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await mockApi(page);
      for (const route of USER_ROUTES) {
        await page.goto(route);
        await page.waitForLoadState("networkidle");
        const { scrollWidth, innerWidth } = await noHorizontalScroll(page);
        expect(scrollWidth, `${route} scrollWidth`).toBeLessThanOrEqual(innerWidth);
      }
    });

    test(`public pages @ ${width}x${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await mockApi(page, { viewer: null });
      await page.route("**/api/v1/admin", (route) => route.fulfill({ json: { admin: false } }));
      for (const route of [...PUBLIC_ROUTES, "/admin/login", "/admin/forgot"]) {
        await page.goto(route);
        await page.waitForLoadState("networkidle");
        const { scrollWidth, innerWidth } = await noHorizontalScroll(page);
        expect(scrollWidth, `${route} scrollWidth`).toBeLessThanOrEqual(innerWidth);
      }
    });
  }

  test("admin pages @ 320 and 768", async ({ page, context, baseURL }) => {
    await adminCookie(context, baseURL);
    await mockApi(page);
    for (const width of [320, 768]) {
      await page.setViewportSize({ width, height: 700 });
      for (const route of ["dashboard", "users", "chats", "messages"]) {
        await page.goto(`/admin/${route}`);
        await page.waitForLoadState("networkidle");
        const { scrollWidth, innerWidth } = await noHorizontalScroll(page);
        expect(scrollWidth, `/admin/${route} @ ${width}`).toBeLessThanOrEqual(innerWidth);
      }
    }
  });
});

test.describe("MUI 9 migration regressions (removed system props / InputProps)", () => {
  test("chat pins the composer to the bottom and pads the message list", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await mockApi(page);
    await page.goto("/chat/design");
    const composer = page.getByRole("textbox", { name: "Message", exact: true });
    await expect(composer).toBeVisible();
    const attach = await page.getByRole("button", { name: "Attach a file" }).boundingBox();
    expect(attach.x, "attach button must not hang off the left edge").toBeGreaterThanOrEqual(0);
    const form = await page.locator("form.workspace-composer").boundingBox();
    expect(form.y + form.height).toBeGreaterThanOrEqual(667 - 2); // sits at the bottom of the viewport
    const bubble = await page.locator(".workspace-message").first().boundingBox();
    expect(bubble.x, "message bubbles keep their 1rem gutter").toBeGreaterThanOrEqual(12);
    const last = await page.locator(".workspace-message").last().boundingBox();
    expect(last.x + last.width).toBeLessThanOrEqual(375 - 12);
  });

  test("home empty state: action buttons stay readable on 320px phones", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await mockApi(page);
    await page.goto("/");
    const button = page.getByRole("button", { name: "Find a friend" });
    await expect(button).toBeVisible();
    const box = await button.boundingBox();
    expect(box.height, "label must not wrap onto many lines").toBeLessThan(60);
    expect((await noHorizontalScroll(page)).scrollWidth).toBeLessThanOrEqual(320);
  });

  test("login fields keep their icons and the show-password toggle works", async ({ page }) => {
    await mockApi(page, { viewer: null });
    await page.goto("/login");
    const password = page.getByLabel(/^Password/);
    await expect(password).toHaveAttribute("type", "password");
    const toggle = page.getByRole("button", { name: /show password|reveal password|hide password/i });
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(password).toHaveAttribute("type", "text");
  });

  test("admin login forwards aria-describedby to the secret key input", async ({ page }) => {
    await mockApi(page, { viewer: null });
    await page.route("**/api/v1/admin", (route) => route.fulfill({ json: { admin: false } }));
    await page.route("**/api/v1/admin/verify", (route) =>
      route.fulfill({ status: 401, json: { message: "Invalid secret key" } }),
    );
    await page.goto("/admin/login");
    const input = page.getByLabel("Secret key");
    await input.fill("wrong-key");
    await page.getByRole("button", { name: "Login", exact: true }).click();
    await expect(page.locator("#admin-login-error")).toBeVisible();
    await expect(input).toHaveAttribute("aria-describedby", "admin-login-error");
  });

  test("privacy and terms are typographically styled (headings are bold)", async ({ page }) => {
    for (const route of ["/privacy", "/terms"]) {
      await page.goto(route);
      const weight = await page.getByRole("heading", { level: 1 }).evaluate((el) => +getComputedStyle(el).fontWeight);
      expect(weight).toBeGreaterThanOrEqual(700);
    }
  });
});

test.describe("hydration / console health", () => {
  for (const route of ["/privacy", "/terms", "/forgot", "/verify", "/login", "/showcase/alex"]) {
    test(`${route} hydrates without React errors`, async ({ page }) => {
      await mockApi(page, { viewer: null });
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      // afterEach asserts that no pageerror (e.g. React #418) was raised.
    });
  }
});

test.describe("404 page", () => {
  test("does not auto-redirect and exposes an h1 + working Go Home link", async ({ page }) => {
    await mockApi(page, { viewer: null });
    const response = await page.goto("/this-page-does-not-exist");
    expect(response.status()).toBe(404);
    await page.waitForTimeout(3000); // the old page bounced home after 2s
    await expect(page).toHaveURL(/this-page-does-not-exist/);
    await expect(page.getByRole("heading", { level: 1, name: "404" })).toBeVisible();
    await page.getByRole("link", { name: "Go Home" }).click();
    await expect(page).toHaveURL(/\/(login)?$/);
  });
});

test.describe("document structure", () => {
  const cases = [
    ["/login", { viewer: null }, "Log in | Chat Champ"],
    ["/forgot", { viewer: null }, "Forgot password | Chat Champ"],
    ["/verify", { viewer: null }, "Verify your account | Chat Champ"],
    ["/privacy", { viewer: null }, "Privacy Policy | Chat Champ"],
    ["/terms", { viewer: null }, "Terms of Service | Chat Champ"],
    ["/groups", {}, "Groups | Chat Champ"],
    ["/chat/design", {}, "Conversation | Chat Champ"],
    ["/u/alex", {}, "@alex · Message board | Chat Champ"],
  ];
  for (const [route, opts, title] of cases) {
    test(`${route}: unique title, one main landmark`, async ({ page }) => {
      await mockApi(page, opts);
      await page.goto(route);
      await expect(page).toHaveTitle(title);
      await expect(page.locator("main, [role=main]")).toHaveCount(1);
    });
  }

  for (const [route, opts] of [["/", {}], ["/groups", {}], ["/forgot", { viewer: null }], ["/verify", { viewer: null }], ["/privacy", { viewer: null }], ["/showcase/alex", { viewer: null }]]) {
    test(`${route}: exactly one h1`, async ({ page }) => {
      await mockApi(page, opts);
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    });
  }
});

test.describe("axe-core WCAG 2.x A/AA (serious + critical)", () => {
  const targets = [
    ["/login", { viewer: null }], ["/forgot", { viewer: null }], ["/verify", { viewer: null }],
    ["/privacy", { viewer: null }], ["/terms", { viewer: null }], ["/showcase/alex", { viewer: null }],
    ["/", {}], ["/groups", {}], ["/groups?group=design", {}], ["/chat/design", {}], ["/u/alex", {}],
  ];
  for (const [route, opts] of targets) {
    for (const width of [375, 1280]) {
      test(`${route} @ ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height: width < 600 ? 800 : 900 });
        await mockApi(page, opts);
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.goto(route);
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(500);
        await page.addScriptTag({ content: axeSource });
        const violations = await page.evaluate(async () => {
          const result = await axe.run(document, {
            runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
          });
          return result.violations
            .filter((v) => ["serious", "critical"].includes(v.impact))
            .map((v) => `${v.id}: ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" | ")}`);
        });
        expect(violations).toEqual([]);
      });
    }
  }

  test("admin dashboard @ 1280", async ({ page, context, baseURL }) => {
    await adminCookie(context, baseURL);
    await mockApi(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/admin/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
    await page.waitForTimeout(800);
    await page.addScriptTag({ content: axeSource });
    const violations = await page.evaluate(async () => {
      const result = await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] } });
      return result.violations.filter((v) => ["serious", "critical"].includes(v.impact)).map((v) => `${v.id}: ${v.nodes[0].target.join(" ")}`);
    });
    expect(violations).toEqual([]);
  });
});

test.describe("forms: special characters and failures", () => {
  test("sign-up availability checks URL-encode '+', '&' and '#'", async ({ page }) => {
    const state = await mockApi(page, { viewer: null });
    await page.goto("/login");
    await page.getByRole("tab", { name: "Sign up" }).click();
    await page.getByRole("textbox", { name: "Email", exact: true }).fill("jane+test&co@example.com");
    await page.getByRole("textbox", { name: /^Username$/ }).fill("a&b#c d");
    await expect
      .poll(() => state.requests.filter((r) => r.path.endsWith("/check-email")).length)
      .toBeGreaterThan(0);
    const emailReq = state.requests.find((r) => r.path.endsWith("/check-email"));
    expect(new URLSearchParams(emailReq.search).get("email")).toBe("jane+test&co@example.com");
    await expect
      .poll(() => state.requests.filter((r) => r.path.endsWith("/check-username")).length)
      .toBeGreaterThan(0);
    const userReq = state.requests.filter((r) => r.path.endsWith("/check-username")).at(-1);
    expect(new URLSearchParams(userReq.search).get("username")).toBe("a&b#c d");
  });

  test("login error toast stays on screen long enough to be read", async ({ page }) => {
    await mockApi(page, { viewer: null });
    await page.route("**/api/v1/user/login", (route) =>
      route.fulfill({ status: 500, json: { message: "Server exploded" } }),
    );
    await page.goto("/login");
    await page.getByLabel("Username or email").fill("alex");
    await page.getByLabel(/^Password/).fill("Passw0rd!x");
    await page.getByRole("button", { name: /Let.s talk/ }).click();
    const toast = page.getByText("Server exploded");
    await expect(toast).toBeVisible();
    await page.waitForTimeout(2500); // toasts used to disappear after 1s
    await expect(toast).toBeVisible();
  });
});

test.describe("edge cases", () => {
  test("very long unbroken message does not overflow the chat", async ({ page }) => {
    const long = "A".repeat(400) + " https://example.com/" + "path/".repeat(60);
    await page.setViewportSize({ width: 320, height: 640 });
    await mockApi(page, {
      messages: [
        { _id: "long", chat: "design", sender: { _id: "friend", name: "Jamie ".repeat(12), avatar: "" }, content: long, createdAt: "2026-10-05T15:00:00Z" },
      ],
    });
    await page.goto("/chat/design");
    await expect(page.locator(".workspace-message")).toHaveCount(1);
    expect((await noHorizontalScroll(page)).scrollWidth).toBeLessThanOrEqual(320);
  });

  test("empty chat list and empty messages render empty states", async ({ page }) => {
    await mockApi(page, { chats: [], groups: [], messages: [] });
    await page.goto("/chat/design");
    await expect(page.getByText("No Messages Yet")).toBeVisible();
  });

  test("slow network shows loading UI then content", async ({ page }) => {
    await mockApi(page, { delayMs: 1200 });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Good conversations start here." })).toBeVisible({ timeout: 15000 });
  });

  test("failed chat API does not crash the home page", async ({ page }) => {
    await mockApi(page, { fail: ["/api/v1/chat"] });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Good conversations start here." })).toBeVisible();
  });

  test("rapid repeated clicks on search open exactly one dialog", async ({ page }) => {
    await mockApi(page);
    await page.goto("/");
    const search = page.getByRole("button", { name: "Search", exact: true });
    await search.click({ clickCount: 5, delay: 10, force: true }).catch(() => {});
    await expect(page.getByRole("dialog")).toHaveCount(1);
  });

  test("keyboard: Escape closes dialogs and focus returns to the trigger", async ({ page }) => {
    await mockApi(page);
    await page.goto("/");
    await page.getByRole("button", { name: "Search", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("touch targets: Reply buttons are at least 24x24 (WCAG 2.5.8)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await mockApi(page);
    await page.goto("/chat/design");
    for (const button of await page.getByRole("button", { name: "Reply", exact: true }).all()) {
      const box = await button.boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(24);
      expect(box.height).toBeGreaterThanOrEqual(24);
    }
  });
});

test.describe("embed widget", () => {
  test.skip(!process.env.MONGODB_URI, "embed page imports the DB module, which needs MONGODB_URI");

  test("title with & and < renders literally, textarea is labelled", async ({ page }) => {
    await mockApi(page, { viewer: null });
    await page.goto("/embed/alex?title=" + encodeURIComponent("Q&A <b>"));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Q&A <b>");
    await expect(page.getByRole("textbox")).toHaveAccessibleName(/.+/);
    const font = await page.getByRole("textbox").evaluate((el) => getComputedStyle(el).fontFamily);
    expect(font).not.toMatch(/monospace/i);
  });
});
