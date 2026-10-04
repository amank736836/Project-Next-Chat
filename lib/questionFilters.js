/**
 * Pure helpers for matching board replies back to question pool entries.
 * No Node/Mongoose imports — usable in API routes and unit tests.
 */

export const normalizeBoardQuestion = (value = '') =>
  value
    .trim()
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();

// Legacy normalization (kept for entries created before punctuation stripping).
export const normalizeBoardQuestionLegacy = (value = '') =>
  value
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

const normalizedForms = (value = '') => {
  // Note: .trim() at the end (the stored DB normalizer historically leaves a
  // trailing space when the question ends in punctuation). In-memory matching
  // trims so "place?" and "place" still match each other.
  const forms = [
    normalizeBoardQuestion(value).trim(),
    normalizeBoardQuestionLegacy(value).trim(),
  ].filter(Boolean);
  return [...new Set(forms)];
};

/** Normalized set of questions that already have a board reply (i.e. answered). */
export function buildReplyAnsweredSet(replyQuestions = []) {
  const set = new Set();
  for (const question of replyQuestions) {
    for (const form of normalizedForms(question || '')) {
      set.add(form);
    }
  }
  return set;
}

export function isReplyAnswered(item, replyAnsweredSet) {
  if (!replyAnsweredSet || replyAnsweredSet.size === 0) return false;
  const raw = item?.question || item?.normalizedQuestion || '';
  return normalizedForms(raw).some((form) => replyAnsweredSet.has(form));
}

/** Removes pool entries that were already answered via a board reply. */
export function excludeReplyAnswered(items = [], replyQuestions = []) {
  const set = buildReplyAnsweredSet(replyQuestions);
  if (set.size === 0) return [...items];
  return items.filter((item) => !isReplyAnswered(item, set));
}

/** normalized-question -> distinct ask hosts index over pool items. */
export function buildQuestionHostsIndex(items = []) {
  const index = new Map();
  const add = (form, hosts) => {
    if (!form) return;
    const entry = index.get(form) || new Set();
    for (const host of hosts) entry.add(host);
    index.set(form, entry);
  };
  for (const item of items || []) {
    const uniqueHosts = [...new Set((item?.hosts || []).map((h) => sanitizeHost(h)))];
    if (uniqueHosts.length === 0) continue;
    for (const form of normalizedForms(item?.question || '')) add(form, uniqueHosts);
    const stored = String(item?.normalizedQuestion || '').trim().toLowerCase();
    if (stored) add(stored, uniqueHosts);
  }
  return index;
}

/** Distinct hosts a question was asked from (pool index + direct reply host). */
export function hostsForQuestion(question = '', index, directHost = null) {
  const out = new Set();
  const cleanDirect = sanitizeHost(directHost);
  if (directHost && cleanDirect) out.add(cleanDirect);
  if (index) {
    for (const form of normalizedForms(question)) {
      const entry = index.get(form);
      if (entry) for (const host of entry) out.add(host);
    }
  }
  return [...out];
}

/** Keeps items asked from the given host (null/undefined = all). */
export function filterByHost(items = [], host = null, getHosts = (item) => item?.hosts || []) {
  if (!host) return [...items];
  return items.filter((item) => getHosts(item).includes(host));
}

/**
 * Normalizes a website host for attribution ("https://Example.com:3000/x"
 * -> "example.com"). Unparseable values become "direct".
 */
export function sanitizeHost(value = '') {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'direct';

  let host = raw;
  const originMatch = raw.match(/^https?:\/\/([^/:?#]+)/);
  if (originMatch) {
    host = originMatch[1];
  } else {
    host = raw.split(/[/:?#]/)[0];
  }

  host = host.replace(/\.+$/, '').trim();

  if (!host || host.length > 100 || !/^[a-z0-9.-]+$/.test(host)) return 'direct';
  if (!host.includes('.') && host !== 'localhost') return 'direct';
  return host;
}

/** Picks the ask origin: explicit body.host wins, else Origin/Referer headers. */
export function resolveAskHost({ host, origin, referer } = {}) {
  const explicit = sanitizeHost(host);
  if (explicit !== 'direct') return explicit;
  const fromOrigin = sanitizeHost(origin);
  if (fromOrigin !== 'direct') return fromOrigin;
  return sanitizeHost(referer);
}

// ---------------------------------------------------------------------------
// Relevance ranking: steer suggestions toward topics the board owner has
// already engaged with (answered Q&A + repeatedly asked questions).
// ---------------------------------------------------------------------------

const STOPWORDS = new Set(
  'what,when,where,which,who,whom,whose,why,how,are,you,your,yours,have,has,had,do,does,did,can,could,should,would,will,there,their,they,them,then,than,that,this,these,those,with,from,about,into,and,for,the,was,were,been,being,all,any,one,ever,never,also,just,much,more,most,some,such,like,get,got,make,made,really,very,often,always,every,kind,thing,things,something,anything,someone,anyone,people,person,feel,feeling,makes,make,help,helps,does,doing,done'.split(',')
);

const MIN_KEYWORD_LEN = 3;

/** Significant lowercase keyword tokens of a text (stopwords removed). */
export function extractKeywords(value = '') {
  return (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= MIN_KEYWORD_LEN && !STOPWORDS.has(w));
}

/**
 * Weighted keyword profile of what this board is about.
 * Answered questions count most, answers and repeated asks add context.
 */
export function buildTopicProfile({ answered = [], priority = [] } = {}) {
  const profile = new Map();
  const add = (text, weight) => {
    for (const word of extractKeywords(text)) {
      profile.set(word, (profile.get(word) || 0) + weight);
    }
  };
  for (const item of answered) {
    add(item?.question, 2);
    add(item?.answer, 1);
  }
  for (const item of priority) {
    add(item?.question, 1);
  }
  return profile;
}

/** Relevance score of a candidate question against a topic profile. */
export function scoreRelevance(question = '', profile) {
  if (!profile || profile.size === 0) return 0;
  let score = 0;
  for (const word of new Set(extractKeywords(question))) {
    score += profile.get(word) || 0;
  }
  return score;
}

/**
 * Orders pool items by topic relevance (highest first). Items carry
 * { question, askedCount }. Ties keep the previous order, and an empty
 * profile leaves the order untouched.
 */
export function rankByRelevance(items = [], profile) {
  if (!profile || profile.size === 0) return [...items];
  return [...items]
    .map((item, index) => ({
      item,
      index,
      score: scoreRelevance(item?.question || '', profile),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.item);
}

const NEAR_DUP_JACCARD = 0.7;
const NEAR_DUP_MIN_TOKENS = 3;

function tokenSet(value = '') {
  return new Set(extractKeywords(value));
}

/** Jaccard similarity of two questions' keyword sets (0..1). */
export function similarity(a = '', b = '') {
  const setA = tokenSet(a);
  const setB = tokenSet(b);
  if (setA.size < NEAR_DUP_MIN_TOKENS || setB.size < NEAR_DUP_MIN_TOKENS) return 0;
  let overlap = 0;
  for (const word of setA) {
    if (setB.has(word)) overlap += 1;
  }
  return overlap / (setA.size + setB.size - overlap);
}

/**
 * Drops pool items that are near-duplicates of already-answered questions,
 * so suggestions stay fresh instead of re-asking answered topics.
 */
export function excludeNearDuplicates(items = [], answeredQuestions = []) {
  if (!answeredQuestions || answeredQuestions.length === 0) return [...items];
  return items.filter((item) => {
    const question = item?.question || '';
    return !answeredQuestions.some(
      (answered) => similarity(question, answered || '') >= NEAR_DUP_JACCARD
    );
  });
}
