const { test, expect } = require("@playwright/test");

test.setTimeout(90000);
const owner = {
  _id: "owner",
  name: "Alex Morgan",
  username: "alex",
  email: "alex@example.test",
  avatar: { url: "" },
  createdAt: "2024-01-01",
  isAcceptingMessage: true,
};
const pageErrors = new WeakMap();
test.beforeEach(async ({ page }) => {
  const errors = [];
  pageErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
});
test.afterEach(async ({ page }) => expect(pageErrors.get(page)).toEqual([]));

async function fixture(
  page,
  { viewer = owner, failQuestions = false, failSettings = false } = {},
) {
  const state = {
    failQuestions,
    failSettings,
    requests: [],
    priority: [
      { id: "popular-1", question: "What keeps you inspired?", askedCount: 8 },
    ],
    custom: [{ id: "custom-1", question: "What inspires your work?" }],
    answers: Array.from({ length: 6 }, (_, i) => ({
      id: `answer-${i}`,
      question: `Community question ${i + 1}`,
      answer: "A thoughtful answer, shared with the community.",
      itemType: "question",
      hiddenFromShowcase: i === 5,
    })),
  };
  await page.route("**/api/v1/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const method = req.method();
    const body = req.postDataJSON();
    state.requests.push({
      path: url.pathname,
      search: url.searchParams.toString(),
      method,
      body,
    });
    let data = { success: true };
    if (url.pathname.endsWith("/user/me")) {
      if (!viewer)
        return route.fulfill({
          status: 401,
          json: { message: "Please log in" },
        });
      data = { user: viewer };
    } else if (url.pathname.endsWith("/chat/questions")) {
      if (method === "GET") {
        if (state.failQuestions)
          return route.fulfill({
            status: 500,
            json: { message: "Unavailable" },
          });
        data = {
          success: true,
          suggestions: [
            "What is your favorite place to recharge?",
            "What are you learning lately?",
            "What made you smile today?",
          ],
          customQuestions: viewer?.username === "alex" ? state.custom : [],
          priorityQuestions: viewer?.username === "alex" ? state.priority : [],
          answered:
            viewer?.username === "alex"
              ? state.answers
              : state.answers.filter((item) => !item.hiddenFromShowcase),
          availableHosts: ["example.com", "journal.example.com"],
        };
      } else if (method === "PUT") {
        state.custom.push({ id: "custom-2", question: body.question });
      } else if (method === "DELETE") {
        state.custom = state.custom.filter(
          (item) => item.id !== body.questionId,
        );
      } else if (method === "PATCH") {
        state.answers = state.answers.map((item) =>
          item.id === body.itemId
            ? { ...item, hiddenFromShowcase: body.action === "hide" }
            : item,
        );
      }
    } else if (url.pathname.endsWith("/chat/ask-and-record")) {
      data = { success: true, messageSent: true, realtimeDelivered: false };
    } else if (url.pathname.endsWith("/widget/settings")) {
      if (state.failSettings)
        return route.fulfill({ status: 500, json: { message: "Unavailable" } });
      data = {
        success: true,
        settings: method === "PUT" ? body.settings : { sites: ["example.com"] },
      };
    } else if (url.pathname.endsWith("/chat")) data = { chats: [] };
    await route.fulfill({ json: data });
  });
  return state;
}

async function noOverflow(page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
async function capture(page, name) {
  if (process.env.BOARD_SCREENSHOTS) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: `${process.env.BOARD_SCREENSHOTS}/${name}.png`,
      fullPage: true,
      animations: "disabled",
    });
  }
}

test("owner overview, sharing, tabs, and question CRUD", async ({
  page,
  context,
}) => {
  const state = await fixture(page);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/u/alex");
  await expect(
    page.getByRole("heading", { name: "Let the conversation find you." }),
  ).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Your message" })).toHaveCount(
    0,
  );
  await page
    .getByRole("button", { name: "Copy board link", exact: true })
    .first()
    .click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toMatch(/\/u\/alex$/);
  await capture(page, "board-overview");
  await page
    .getByRole("button", { name: "What is your favorite place to recharge?" })
    .click();
  await expect(
    page.getByRole("tab", { name: "Questions", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByRole("textbox", { name: "Your question" }),
  ).toHaveValue("What is your favorite place to recharge?");
  await expect(
    page.getByRole("button", { name: "Save custom question" }),
  ).toBeDisabled();
  await page
    .getByRole("textbox", { name: "Your question" })
    .fill("What is your favorite place in Bengaluru?");
  await page.getByRole("button", { name: "Save custom question" }).click();
  await expect(
    page.getByText("What is your favorite place in Bengaluru?", {
      exact: true,
    }),
  ).toBeVisible();
  await capture(page, "board-questions");
  await page
    .getByRole("button", {
      name: "Delete question: What is your favorite place in Bengaluru?",
    })
    .click();
  await expect(
    page.getByText("What is your favorite place in Bengaluru?", {
      exact: true,
    }),
  ).toHaveCount(0);
  expect(
    state.requests.some(
      (req) =>
        req.method === "PUT" &&
        req.body.question === "What is your favorite place in Bengaluru?",
    ),
  ).toBe(true);
  await noOverflow(page);
});

test("owner showcase pagination, visibility, and website filter", async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto("/u/alex");
  await page.getByRole("tab", { name: "Showcase", exact: true }).click();
  await expect(
    page.getByText("Community question 1", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Hide answer: Community question 1",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", { name: "Show answer: Community question 1" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Show answer: Community question 1" })
    .click();
  await expect(
    page.getByRole("button", { name: "Hide answer: Community question 1" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Go to page 2" }).click();
  await expect(
    page.getByText("Community question 5", { exact: true }),
  ).toBeVisible();
  await page.getByRole("combobox", { name: "Website", exact: true }).click();
  await page.getByRole("option", { name: "example.com", exact: true }).click();
  await expect
    .poll(() =>
      state.requests.some((req) => req.search.includes("host=example.com")),
    )
    .toBe(true);
  await expect(
    page.getByText("Community question 1", { exact: true }),
  ).toBeVisible();
  await capture(page, "board-showcase");
});

test("embed setup preserves configuration, preview, and saving", async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto("/u/alex");
  await page.getByRole("tab", { name: "Embed", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Take your board with you" }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Dialog title", exact: true })
    .fill("Say hello");
  await expect(page.getByText("Say hello", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Save widget settings" }).click();
  await expect
    .poll(() =>
      state.requests.some(
        (req) =>
          req.path.endsWith("/widget/settings") &&
          req.method === "PUT" &&
          req.body.settings.title === "Say hello",
      ),
    )
    .toBe(true);
  await expect(page.getByRole("button", { name: "Copy script" })).toBeVisible();
  await capture(page, "board-embed");
  await noOverflow(page);
});

test("anonymous visitor can choose a prompt and send on the same-origin API", async ({
  page,
}) => {
  const state = await fixture(page, { viewer: null });
  await page.goto("/u/alex");
  await expect(
    page.getByRole("heading", { name: "A note for @alex" }),
  ).toBeVisible();
  await expect(
    page.getByRole("tablist", { name: "Board management" }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Hide answer:/ })).toHaveCount(
    0,
  );
  await page.getByRole("textbox", { name: "Your message" }).fill(" ");
  await expect(
    page.getByRole("button", { name: "Send message", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "What made you smile today?" })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Your message" }),
  ).toBeFocused();
  await capture(page, "board-visitor");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Your message" })).toHaveValue(
    "",
  );
  expect(
    state.requests.some(
      (req) =>
        req.path === "/api/v1/chat/ask-and-record" &&
        req.body.sender === null &&
        req.body.question === "What made you smile today?",
    ),
  ).toBe(true);
  await noOverflow(page);
});

test("logged-in visitor sees the composer but not owner management", async ({
  page,
}) => {
  await fixture(page, {
    viewer: { ...owner, _id: "visitor", username: "jamie" },
  });
  await page.goto("/u/alex");
  await expect(
    page.getByRole("textbox", { name: "Your message" }),
  ).toBeVisible();
  await expect(
    page.getByRole("tablist", { name: "Board management" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Profile", exact: true }).click();
  await expect(page.getByText("@jamie", { exact: true })).toBeVisible();
});

test("320px owner tabs, embed, and reduced motion remain usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 812 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await fixture(page);
  await page.goto("/u/alex");
  await expect(
    page.getByRole("heading", { name: "Let the conversation find you." }),
  ).toBeVisible();
  expect(
    await page
      .locator("section.workspace-reveal")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  for (const name of ["Questions", "Showcase", "Embed", "Overview"]) {
    await page.getByRole("tab", { name, exact: true }).click();
    await expect(page.getByRole("tabpanel")).toBeVisible();
    if (name === "Embed")
      await expect(
        page.getByRole("heading", { name: "Take your board with you" }),
      ).toBeVisible();
    await noOverflow(page);
  }
  await capture(page, "board-mobile");
});

test("mobile visitor can switch between the message form and shared answers", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await fixture(page, { viewer: null });
  await page.goto("/u/alex");
  await expect(
    page.getByRole("textbox", { name: "Your message" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Shared answers", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Answer showcase" }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Your message" }),
  ).not.toBeVisible();
  await page.getByRole("tab", { name: "Leave a note", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Your message" }),
  ).toBeVisible();
  await noOverflow(page);
});

test("board and widget failures expose retry without pretending data loaded", async ({
  page,
}) => {
  const state = await fixture(page, {
    failQuestions: true,
    failSettings: true,
  });
  await page.goto("/u/alex");
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Couldn't load this board's questions" }),
  ).toBeVisible();
  state.failQuestions = false;
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "What made you smile today?" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Embed", exact: true }).click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Couldn't load your widget settings" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save widget settings" }),
  ).toHaveCount(0);
  state.failSettings = false;
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Take your board with you" }),
  ).toBeVisible();
});

test("session loading does not flash visitor actions to the owner", async ({
  page,
}) => {
  await fixture(page);
  let releaseSession;
  const sessionReady = new Promise((resolve) => {
    releaseSession = resolve;
  });
  await page.route("**/api/v1/user/me", async (route) => {
    await sessionReady;
    await route.fulfill({ json: { user: owner } });
  });
  await page.goto("/u/alex");
  await expect(
    page.getByRole("status", { name: "Loading board" }),
  ).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Your message" })).toHaveCount(
    0,
  );
  releaseSession();
  await expect(
    page.getByRole("heading", { name: "Let the conversation find you." }),
  ).toBeVisible();
});

test("new boards have useful empty questions and showcase states", async ({
  page,
}) => {
  const state = await fixture(page);
  state.custom = [];
  state.priority = [];
  state.answers = [];
  await page.goto("/u/alex");
  await page.getByRole("tab", { name: "Questions", exact: true }).click();
  await expect(
    page.getByText("Your first question starts here", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Curiosity is on its way", { exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Showcase", exact: true }).click();
  await expect(
    page.getByText("Every answer starts with a question", { exact: true }),
  ).toBeVisible();
});

test("board and default embed preview inherit the login palette", async ({ page }) => {
  await fixture(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/u/alex');
  await expect(page.getByRole('heading', { name: 'Let the conversation find you.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy board link', exact: true }).first()).toHaveCSS('background-color', 'rgb(68, 119, 91)');
  await expect(page.locator('.board-workspace')).toHaveCSS('background-color', 'rgb(250, 251, 247)');
  await capture(page, 'board-brand');
  await page.getByRole('tab', { name: 'Embed', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Button color', exact: true })).toHaveValue('#44775b');
  await capture(page, 'embed-brand');
});
