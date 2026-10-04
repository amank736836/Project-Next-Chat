/**
 * NVIDIA NIM (build.nvidia.com) suggestion helper.
 * Uses the fastest model accessible to the account, measured 2026-10:
 * nvidia/nemotron-3.5-lightning-30b-a3b (~2-4s for 3 questions).
 * Requires NVIDIA_API_KEY in env. Never throws — returns null on any failure.
 */

export const NVIDIA_MODEL = 'nvidia/nemotron-3.5-lightning-30b-a3b';
const NVIDIA_API_BASE = 'https://integrate.api.nvidia.com/v1';

export const SUGGESTION_SEPARATOR = '||';

const THINKING_MARKERS = ['**', 'thinking process', 'analyze request', '###'];
const QUESTION_STARTS =
  /^(what|when|where|which|who|whom|whose|why|how|is|are|was|were|do|does|did|can|could|should|would|will|have|has|had|if|describe|tell|share|imagine|suppose)\b/i;

function looksLikeQuestion(s = '') {
  if (s.includes('?')) return s.length >= 10 && s.length <= 200;
  // Model sometimes drops punctuation — accept question-led sentences.
  return s.length >= 20 && s.length <= 200 && QUESTION_STARTS.test(s);
}

function cleanSegment(segment = '') {
  // Reasoning output may prefix the final list with a thinking block —
  // only the last line of a segment can be a real suggestion.
  const lines = String(segment).split('\n');
  let s = lines[lines.length - 1].trim();
  s = s
    .replace(/^["“”'\-•*\d.\s:;|]+/, '')
    .replace(/^(?:questions?\s*\d*\s*[:.-]\s*)/i, '')
    .replace(/^["“”']+|["“”']+$/g, '')
    .trim();
  if (!looksLikeQuestion(s)) return '';
  if (s.length < 10 || s.length > 200) return '';
  const lowered = s.toLowerCase();
  if (THINKING_MARKERS.some((marker) => lowered.includes(marker))) return '';
  return s;
}

export function parseSuggestionList(text = '', limit = 3) {
  const seen = new Set();
  const out = [];
  for (const segment of String(text || '').split(SUGGESTION_SEPARATOR)) {
    const cleaned = cleanSegment(segment);
    const key = cleaned.toLowerCase();
    if (cleaned && !seen.has(key)) {
      seen.add(key);
      out.push(cleaned);
    }
    if (out.length >= limit) break;
  }
  return out;
}

export function buildSuggestionPrompt(exclude = '') {
  return (
    'Create a list of three open-ended and engaging questions formatted as a single string. ' +
    "Each question should be separated by '||'. " +
    'These questions are for an anonymous social messaging app, designed to spark conversation. ' +
    'Avoid questions that are too personal or inappropriate. ' +
    'Each question MUST be at most 100 characters long.' +
    (exclude ? ` Do not include anything like: ${exclude}` : '')
  );
}

export async function generateSuggestionsWithNvidia({ exclude = '', count = 3 } = {}) {  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    const response = await fetch(`${NVIDIA_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages: [
          {
            role: 'system',
            content: 'Output ONLY the requested string. No thinking, no explanations, no markdown.',
          },
          { role: 'user', content: buildSuggestionPrompt(exclude) },
        ],
        // Reasoning model: needs headroom or it gets cut off mid-thinking.
        max_tokens: 2500,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    const payload = await response.json();
    const text = payload?.choices?.[0]?.message?.content || '';
    const parsed = parseSuggestionList(text, count);

    return parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// In-chat AI answers with conversation context (Ask AI button).
// ---------------------------------------------------------------------------

const AI_HISTORY_LIMIT = 20;
const AI_MAX_ANSWER_CHARS = 1200;

/** "Name: message" transcript lines, oldest first, capped. Pure. */
export function buildChatTranscript(messages = [], limit = AI_HISTORY_LIMIT) {
  return (Array.isArray(messages) ? messages : [])
    .slice(-limit)
    .map((msg) => {
      const name = msg?.senderName || msg?.sender?.name || 'Someone';
      const content = String(msg?.content || '').replace(/\s+/g, ' ').trim();
      return content ? `${name}: ${content}` : '';
    })
    .filter(Boolean)
    .join('\n');
}

export function buildChatPrompt({ history = [], question = '' } = {}) {
  const transcript = buildChatTranscript(history);
  return (
    'You are a helpful friend inside a private chat, answering only the person who asked. ' +
    'Be concise, warm, and practical. If asked for ideas (food, plans, gifts), give a short list. ' +
    'Do not lecture, do not ask clarifying questions back unless truly needed.\n' +
    (transcript ? `Conversation so far:\n${transcript}\n` : '') +
    `Question: ${String(question || '').trim()}`
  );
}

export function cleanChatAnswer(text = '') {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, AI_MAX_ANSWER_CHARS);
}

/**
 * Asks NVIDIA with conversation context. Returns the answer string or null.
 * The caller decides persistence — chat answers stay private (not saved).
 */
export async function askNvidiaChat({ history = [], question = '' } = {}) {
  const apiKey = process.env.NVIDIA_API_KEY;
  const trimmedQuestion = String(question || '').trim();

  if (!apiKey || !trimmedQuestion) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    const response = await fetch(`${NVIDIA_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful friend in a private chat. Answer directly and concisely. No thinking process, no markdown headers.',
          },
          { role: 'user', content: buildChatPrompt({ history, question: trimmedQuestion }) },
        ],
        max_tokens: 2500,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    const payload = await response.json();
    const answer = cleanChatAnswer(payload?.choices?.[0]?.message?.content || '');

    return answer || null;
  } catch {
    return null;
  }
}
