/**
 * Shared browser-test fixtures: mocks every `/api/v1/**` request so pages can be
 * exercised without MongoDB or the remote realtime backend. Nothing here ships
 * in the app bundle.
 */
const owner = {
  _id: "me",
  name: "Alex Morgan",
  username: "alex",
  email: "alex@example.test",
  createdAt: "2024-01-01",
  avatar: { url: "" },
  isAcceptingMessage: true,
};
const friend = { _id: "friend", name: "Jamie Chen", avatar: "" };

const defaultMessages = [
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
    sender: owner,
    content: "Absolutely. I have a few concepts I would love your thoughts on.",
    createdAt: "2026-10-05T15:01:00Z",
  },
];

function buildState(opts = {}) {
  const groups = opts.groups || [
    {
      _id: "design",
      name: "Design collective",
      avatar: [],
      groupChat: true,
      members: ["me", "friend"],
    },
  ];
  const chats = opts.chats || [
    ...groups,
    {
      _id: "friend",
      name: "Jamie Chen",
      avatar: [],
      groupChat: false,
      members: ["friend", "me"],
    },
  ];
  return {
    viewer: opts.viewer === undefined ? owner : opts.viewer,
    groups,
    chats,
    messages: opts.messages || defaultMessages,
    delayMs: opts.delayMs || 0,
    fail: new Set(opts.fail || []), // substrings of paths that should answer 500
    notifications: opts.notifications || [],
    requests: [],
    custom: [{ id: "custom-1", question: "What inspires your work?" }],
    priority: [
      { id: "popular-1", question: "What keeps you inspired?", askedCount: 8 },
    ],
    answers:
      opts.answers ||
      Array.from({ length: 6 }, (_, i) => ({
        id: `answer-${i}`,
        question: `Community question ${i + 1}`,
        answer: "A thoughtful answer, shared with the community.",
        itemType: "question",
        hiddenFromShowcase: i === 5,
      })),
  };
}

async function mockApi(page, opts = {}) {
  const state = buildState(opts);
  await page.route("**/api/v1/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname;
    const method = req.method();
    let body;
    try {
      body = req.postDataJSON();
    } catch {
      body = undefined;
    }
    state.requests.push({ path, method, body, search: url.search });
    if (state.delayMs) await new Promise((r) => setTimeout(r, state.delayMs));
    if ([...state.fail].some((needle) => path.includes(needle)))
      return route.fulfill({ status: 500, json: { message: "Unavailable" } });

    let data = { success: true };
    if (path === "/api/v1/user/me") {
      if (!state.viewer)
        return route.fulfill({ status: 401, json: { message: "Please log in" } });
      data = { user: state.viewer, notificationCount: state.notifications.length };
    } else if (path === "/api/v1/chat") data = { chats: state.chats };
    else if (path === "/api/v1/chat/group") data = { groups: state.groups };
    else if (path.startsWith("/api/v1/chat/message/"))
      data = { messages: state.messages, totalPages: 1 };
    else if (path === "/api/v1/chat/questions") {
      if (method === "GET") {
        const isOwnerView = state.viewer?.username === "alex";
        data = {
          success: true,
          suggestions: [
            "What is your favorite place to recharge?",
            "What are you learning lately?",
            "What made you smile today?",
          ],
          customQuestions: isOwnerView ? state.custom : [],
          priorityQuestions: isOwnerView ? state.priority : [],
          answered: isOwnerView
            ? state.answers
            : state.answers.filter((item) => !item.hiddenFromShowcase),
          availableHosts: ["example.com", "journal.example.com"],
        };
      } else if (method === "PUT")
        state.custom.push({ id: `custom-${Date.now()}`, question: body?.question });
      else if (method === "DELETE")
        state.custom = state.custom.filter((q) => q.id !== body?.questionId);
    } else if (path === "/api/v1/chat/ask-and-record")
      data = { success: true, messageSent: true, realtimeDelivered: false };
    else if (path === "/api/v1/widget/settings")
      data = {
        success: true,
        settings: method === "PUT" ? body?.settings : { sites: ["example.com"] },
      };
    else if (path.startsWith("/api/v1/chat/"))
      data = { chat: { ...state.groups[0], creator: "me", members: [owner, friend] } };
    else if (path === "/api/v1/user/friends") data = { friends: [friend] };
    else if (path === "/api/v1/user/search") data = { users: [friend] };
    else if (path === "/api/v1/user/notifications")
      data = { allRequests: state.notifications };
    else if (path === "/api/v1/user/check-username")
      data = { success: true, available: true, message: "Username is available" };
    else if (path === "/api/v1/user/check-email")
      data = { success: true, available: true, message: "Email is available" };
    else if (path === "/api/v1/admin") data = { admin: true };
    else if (path === "/api/v1/admin/stats")
      data = {
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
      data = {
        users: [
          owner,
          { ...owner, _id: "jamie", name: "Jamie Chen", username: "jamie" },
        ],
      };
    else if (path === "/api/v1/admin/chats")
      data = {
        chats: [{ ...state.groups[0], creator: owner, members: [owner, friend] }],
      };
    else if (path === "/api/v1/admin/messages")
      data = {
        messages: state.messages.map((m) => ({
          ...m,
          attachments: [],
          groupChat: true,
        })),
      };
    await route.fulfill({ json: data });
  });
  return state;
}

module.exports = { mockApi, owner, friend, defaultMessages };
