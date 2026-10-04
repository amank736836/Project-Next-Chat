/**
 * Shared widget configuration helpers.
 * Pure functions only (no Node/Mongoose imports) so they can be used
 * in the browser, in API routes, and in unit tests.
 */

export const WIDGET_POSITIONS = [
  "bottom-right",
  "bottom-left",
  "top-right",
  "top-left",
  "bottom-center",
];

export const WIDGET_SHAPES = ["round", "square", "pill"];

export const WIDGET_SIZES = ["sm", "md", "lg"];

export const WIDGET_DEFAULTS = {
  position: "bottom-right",
  themeColor: "#4facfe",
  backgroundColor: "#ffffff",
  textColor: "#1a1a2e",
  title: "Send feedback",
  subtitle: "We read every message",
  placeholder: "Write your anonymous message here...",
  buttonText: "Send",
  bubbleLabel: "💬",
  shape: "round",
  size: "md",
  autoOpenDelay: 0,
  showSuggestions: true,
  enabled: true,
};

const HEX_COLOR_RE = /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/;

const cleanString = (value, fallback, maxLen = 120) => {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim().slice(0, maxLen);
  return trimmed || fallback;
};

export function sanitizeWidgetSettings(input = {}) {
  const out = { ...WIDGET_DEFAULTS };

  if (WIDGET_POSITIONS.includes(input.position)) out.position = input.position;
  if (WIDGET_SHAPES.includes(input.shape)) out.shape = input.shape;
  if (WIDGET_SIZES.includes(input.size)) out.size = input.size;

  if (typeof input.themeColor === "string" && HEX_COLOR_RE.test(input.themeColor.trim())) {
    out.themeColor = input.themeColor.trim();
  }
  // Legacy migration: the old default purple becomes the Chat Champ brand blue.
  if (out.themeColor.toLowerCase() === "#6c3ce0") {
    out.themeColor = WIDGET_DEFAULTS.themeColor;
  }
  if (typeof input.backgroundColor === "string" && HEX_COLOR_RE.test(input.backgroundColor.trim())) {
    out.backgroundColor = input.backgroundColor.trim();
  }
  if (typeof input.textColor === "string" && HEX_COLOR_RE.test(input.textColor.trim())) {
    out.textColor = input.textColor.trim();
  }

  out.title = cleanString(input.title, WIDGET_DEFAULTS.title, 80);
  out.subtitle = cleanString(input.subtitle, WIDGET_DEFAULTS.subtitle, 140);
  out.placeholder = cleanString(input.placeholder, WIDGET_DEFAULTS.placeholder, 200);
  out.buttonText = cleanString(input.buttonText, WIDGET_DEFAULTS.buttonText, 40);
  out.bubbleLabel = cleanString(input.bubbleLabel, WIDGET_DEFAULTS.bubbleLabel, 12);

  const delay = Number(input.autoOpenDelay);
  out.autoOpenDelay = Number.isFinite(delay) ? Math.min(Math.max(Math.round(delay), 0), 120) : 0;

  out.showSuggestions = input.showSuggestions !== false;
  out.enabled = input.enabled !== false;

  return out;
}

/**
 * Merge order: server settings < URL params < data-attributes.
 * All sources are sanitized so a hostile embed cannot inject CSS.
 */
export function mergeWidgetSettings(...sources) {
  return sanitizeWidgetSettings(Object.assign({}, ...sources));
}

export function getPositionStyle(position) {
  const offset = "20px";
  switch (position) {
    case "top-left":
      return { top: offset, left: offset };
    case "top-right":
      return { top: offset, right: offset };
    case "bottom-left":
      return { bottom: offset, left: offset };
    case "bottom-center":
      return { bottom: offset, left: "50%", transform: "translateX(-50%)" };
    case "bottom-right":
    default:
      return { bottom: offset, right: offset };
  }
}

export function buildWidgetQuery(settings = {}) {
  const s = sanitizeWidgetSettings(settings);
  const params = new URLSearchParams({
    position: s.position,
    color: s.themeColor,
    bg: s.backgroundColor,
    text: s.textColor,
    title: s.title,
    subtitle: s.subtitle,
    placeholder: s.placeholder,
    button: s.buttonText,
    shape: s.shape,
    size: s.size,
    suggestions: s.showSuggestions ? "1" : "0",
  });
  return params.toString();
}

export function buildScriptSnippet({ origin, username, settings = {} }) {
  const s = sanitizeWidgetSettings(settings);
  const cleanOrigin = String(origin || "").replace(/\/$/, "");
  const attrs = [
    `src="${cleanOrigin}/widget.js"`,
    `data-username="${String(username || "").toLowerCase()}"`,
    `data-position="${s.position}"`,
    `data-color="${s.themeColor}"`,
    `data-bg="${s.backgroundColor}"`,
    `data-text="${s.textColor}"`,
    `data-title="${s.title.replace(/"/g, "&quot;")}"`,
    `data-button="${s.buttonText.replace(/"/g, "&quot;")}"`,
    `data-shape="${s.shape}"`,
    `data-size="${s.size}"`,
  ];
  if (s.autoOpenDelay > 0) attrs.push(`data-auto-open="${s.autoOpenDelay}"`);
  if (!s.showSuggestions) attrs.push(`data-suggestions="0"`);
  return `<script ${attrs.join(" ")} async defer></script>`;
}

export function buildIframeSnippet({ origin, username, settings = {} }) {
  const cleanOrigin = String(origin || "").replace(/\/$/, "");
  const query = buildWidgetQuery(settings);
  return `<iframe src="${cleanOrigin}/embed/${String(username || "").toLowerCase()}?${query}" width="380" height="520" style="border:0;border-radius:16px;overflow:hidden" loading="lazy" title="Feedback widget"></iframe>`;
}
