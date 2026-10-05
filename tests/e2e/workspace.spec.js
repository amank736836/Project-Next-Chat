const { test, expect } = require("@playwright/test");
const jwt = require("jsonwebtoken");

test.setTimeout(90000);

// Browser-only fixtures: no auth bypass, sample data, or test routes ship in the app.
const user = {
  _id: "me",
  name: "Alex Morgan",
  username: "alex",
  email: "alex@example.test",
  createdAt: "2024-01-01",
  avatar: { url: "" },
  isAcceptingMessage: true,
};
const friend = { _id: "friend", name: "Jamie Chen", avatar: "" };
const groups = [
  {
    _id: "design",
    name: "Design collective",
    avatar: [],
    groupChat: true,
    members: ["me", "friend"],
  },
];
const chats = [
  ...groups,
  {
    _id: "friend",
    name: "Jamie Chen",
    avatar: [],
    groupChat: false,
    members: ["friend", "me"],
  },
];
const messages = [
  {
    _id: "m1",
    chat: "design",
    sender: friend,
    content: "Hey! Ready to share some ideas for our next project?",
    createdAt: "2026-10-05T15:00:00Z",
  },
  {
    _id: "m2",
    chat: "design",
    sender: user,
    content: "Absolutely. I have a few concepts I would love your thoughts on.",
    createdAt: "2026-10-05T15:01:00Z",
  },
];

const pageErrors = new WeakMap();
test.afterEach(async ({ page }) => {
  expect(pageErrors.get(page)).toEqual([]);
});

test.beforeEach(async ({ page }) => {
  const errors = [];
  pageErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let body = { success: true };
    if (path === "/api/v1/user/me") body = { user, notificationCount: 2 };
    else if (path === "/api/v1/chat") body = { chats };
    else if (path === "/api/v1/chat/group") body = { groups };
    else if (path.startsWith("/api/v1/chat/message/"))
      body = { messages, totalPages: 1 };
    else if (path.startsWith("/api/v1/chat/"))
      body = { chat: { ...groups[0], creator: "me", members: [user, friend] } };
    else if (path === "/api/v1/user/friends") body = { friends: [friend] };
    else if (path === "/api/v1/user/search") body = { users: [friend] };
    else if (path === "/api/v1/user/notifications") body = { allRequests: [] };
    else if (path === "/api/v1/admin") body = { admin: true };
    else if (path === "/api/v1/admin/stats")
      body = {
        stats: {
          totalUsers: 1248,
          totalChats: 368,
          totalMessages: 14286,
          singleChatCount: 281,
          groupChatCount: 87,
          last7DaysMessages: [18, 42, 29, 63, 52, 79, 94],
        },
      };
    else if (path === "/api/v1/admin/users")
      body = {
        users: [
          user,
          { ...user, _id: "jamie", name: "Jamie Chen", username: "jamie" },
        ],
      };
    else if (path === "/api/v1/admin/chats")
      body = {
        chats: [{ ...groups[0], creator: user, members: [user, friend] }],
      };
    else if (path === "/api/v1/admin/messages")
      body = {
        messages: messages.map((message) => ({
          ...message,
          attachments: [],
          groupChat: true,
        })),
      };
    await route.fulfill({ json: body });
  });
});

async function noOverflow(page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}

test("desktop workspace: search, filters, and group creation dialog", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Good conversations start here." }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Find a conversation" })
    .fill("Jamie");
  await expect(page.getByRole("link", { name: /Jamie Chen/ })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Design collective/ }),
  ).toHaveCount(0);
  await page.getByRole("textbox", { name: "Find a conversation" }).fill("");
  await page.getByRole("button", { name: "Groups", exact: true }).click();
  await expect(page.getByRole("link", { name: /Jamie Chen/ })).toHaveCount(0);
  await page
    .getByRole("button", { name: "Create a group", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Create a New Group" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Group Name").fill("Weekend plans");
  await dialog.getByRole("button", { name: "Add Jamie Chen" }).click();
  await expect(
    dialog.getByRole("button", { name: "Create Group" }),
  ).toBeEnabled();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await noOverflow(page);
});

test("group details: rename, member controls, and safe delete cancellation", async ({
  page,
}) => {
  await page.goto("/groups?group=design");
  await expect(
    page.getByRole("heading", { name: "Design collective" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Rename group" }).click();
  await page.getByRole("textbox", { name: "Group name" }).fill(" ");
  await expect(
    page.getByRole("button", { name: "Save group name" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Remove Alex Morgan" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Add member", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Add Member" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Submit Changes" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Delete group", exact: true }).click();
  await page.getByRole("button", { name: "Keep group" }).click();
  await expect(
    page.getByRole("heading", { name: "Design collective" }),
  ).toBeVisible();
  await noOverflow(page);
});

test("mobile chat: reply composer remains visible and drawer navigates", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/chat/design");
  await expect(
    page.getByText(messages[0].content, { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Reply", exact: true })
    .first()
    .click();
  await expect(page.getByText("Replying to Jamie Chen")).toBeVisible();
  const composer = page.getByRole("textbox", { name: "Message", exact: true });
  await composer.fill("Great idea!");
  const bounds = await composer.boundingBox();
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(812);
  await noOverflow(page);
  await page.getByRole("button", { name: "Open conversations" }).click();
  await expect(
    page.getByRole("textbox", { name: "Find a conversation" }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Find a conversation" })
    .fill("Jamie");
  await expect(page.getByRole("link", { name: /Jamie Chen/ })).toBeVisible();
});

test("mobile groups and reduced-motion empty state", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 812 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/groups");
  await expect(
    page.getByRole("heading", { name: "A place for your people." }),
  ).toBeVisible();
  expect(
    await page
      .locator(".workspace-conversation-art-front")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  await page.getByRole("button", { name: "Your groups", exact: true }).click();
  await page.getByRole("link", { name: /Design collective/ }).click();
  await expect(
    page.getByRole("heading", { name: "Design collective" }),
  ).toBeVisible();
  await noOverflow(page);
});

test("admin overview and all searchable directories", async ({
  page,
  context,
  baseURL,
}) => {
  // Sign only a local test session; use matching test env values if configured.
  if (!["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname))
    throw new Error("Run fixture tests on a local test server.");
  const token = jwt.sign(
    { secretKey: process.env.ADMIN_SECRET_KEY || "Admin@1234" },
    process.env.JWT_SECRET || "fallback_secret",
  );
  await context.addCookies([
    {
      name:
        process.env.STEALTHY_NOTE_ADMIN_TOKEN_NAME || "StealthyNoteAdminToken",
      value: token,
      url: baseURL,
    },
  ]);
  await page.goto("/admin/dashboard");
  await expect(
    page.getByRole("heading", { name: "Dashboard", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "View details" })).toHaveCount(3);
  await page.getByRole("button", { name: "Refresh overview" }).click();
  for (const [route, heading] of [
    ["users", "All Users"],
    ["chats", "All Chats"],
    ["messages", "All Messages"],
  ]) {
    await page.goto(`/admin/${route}`);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    await expect(page.getByRole("grid", { name: heading })).toBeVisible();
    await page
      .getByRole("textbox", { name: "Search records" })
      .fill("not-a-record");
    await expect(
      page.getByRole("status").filter({ hasText: "0 matching records" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Clear search" }).click();
    await noOverflow(page);
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole("button", { name: "Open admin navigation" }).click();
  await expect(
    page.getByRole("button", { name: "Close admin navigation" }).last(),
  ).toBeVisible();
});
