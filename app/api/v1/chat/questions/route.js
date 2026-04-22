import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/server/db.js';
import Chat from '../../../../../lib/server/models/chat.model.js';
import Message from '../../../../../lib/server/models/message.model.js';
import SuggestedQuestion from '../../../../../lib/server/models/suggestedQuestion.model.js';
import User from '../../../../../lib/server/models/user.model.js';
import { getAuthenticatedUser } from '../../../../../lib/server/auth.js';

const SUGGESTION_LIMIT = 8;

const GLOBAL_SEED_QUESTIONS = [
  'What is something small that made your day better recently?',
  'If you could instantly learn one skill, what would it be and why?',
  'What kind of conversation helps you feel most understood?',
  'What is one goal you are currently working toward?',
  'What helps you recharge after a stressful day?',
  'What motivates you when you feel stuck?',
  'If you could relive one day from last year, which day would it be?',
  'What is one thing people often misunderstand about you?',
  'What is your ideal weekend like from start to finish?',
  'What is a fear you have overcome recently?',
  'If you could travel anywhere this year, where would you go first?',
  'What habit has improved your life the most?',
];

const normalizeQuestion = (value = '') =>
  value
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

const parseExclude = (exclude = '') => {
  if (!exclude) return new Set();

  return new Set(
    exclude
      .split('||')
      .map((item) => normalizeQuestion(item))
      .filter(Boolean)
  );
};

const normalizeShowcaseAnswer = (answer = '') => {
  const trimmed = (answer || '').trim();
  const replyPrefixMatch = trimmed.match(/^Reply to\s+.+?:\s*(.*)$/i);

  if (!replyPrefixMatch) return trimmed;

  const replyBody = (replyPrefixMatch[1] || '').trim();
  const replyBodyWithoutMention = replyBody.replace(/^@\S+\s+/, '').trim();
  const finalBody = replyBodyWithoutMention || replyBody;

  return finalBody ? `Reply to Anonymous: ${finalBody}` : 'Reply to Anonymous';
};

const randomPick = (items, count = SUGGESTION_LIMIT) => {
  const cloned = [...items];
  for (let i = cloned.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned.slice(0, count);
};

const mixSuggestionsWithUserRatio = ({ personal, global, limit, shuffle = false }) => {
  const personalPool = shuffle ? randomPick(personal, personal.length) : [...personal];
  const globalPool = shuffle ? randomPick(global, global.length) : [...global];

  const mixed = [];

  while (mixed.length < limit && (personalPool.length > 0 || globalPool.length > 0)) {
    const slot = mixed.length;
    const needsPersonalSlot = slot % 3 === 0;

    if (needsPersonalSlot && personalPool.length > 0) {
      mixed.push(personalPool.shift());
      continue;
    }

    if (globalPool.length > 0) {
      mixed.push(globalPool.shift());
      continue;
    }

    if (personalPool.length > 0) {
      mixed.push(personalPool.shift());
    }
  }

  return mixed;
};

const ensureGlobalSeeds = async () => {
  const operations = GLOBAL_SEED_QUESTIONS.map((question) => {
    const normalized = normalizeQuestion(question);

    return {
      updateOne: {
        filter: { targetUsername: null, normalizedQuestion: normalized },
        update: {
          $setOnInsert: {
            targetUsername: null,
            question,
            normalizedQuestion: normalized,
            askedCount: 0,
            answer: '',
            answeredAt: null,
          },
        },
        upsert: true,
      },
    };
  });

  try {
    await SuggestedQuestion.bulkWrite(operations, { ordered: false });
  } catch (error) {
    const hasOnlyDupErrors =
      Array.isArray(error?.writeErrors) &&
      error.writeErrors.length > 0 &&
      error.writeErrors.every((item) => item?.code === 11000);

    if (!hasOnlyDupErrors) throw error;
  }
};

const getPoolForUsername = async (username) => {
  const normalizedUsername = username.toLowerCase();
  const [personalQuestions, globalQuestions] = await Promise.all([
    SuggestedQuestion.find({ targetUsername: normalizedUsername }).lean(),
    SuggestedQuestion.find({ targetUsername: null }).lean(),
  ]);

  return [...personalQuestions, ...globalQuestions];
};

const getBoardReplyShowcaseForUsername = async (username) => {
  const owner = await User.findOne({ username }).select('_id username').lean();

  if (!owner?._id) return [];

  const boardChat = await Chat.findById(owner._id).select('_id').lean();

  if (!boardChat?._id) return [];

  const replyMessages = await Message.find({
    chat: boardChat._id,
    replyTo: { $exists: true },
    'replyTo.content': { $nin: ['', null] },
    hiddenFromShowcase: { $ne: true },
  })
    .populate('sender', 'name username')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return replyMessages.map((message) => ({
    id: `reply-${message._id}`,
    itemType: 'reply',
    question: message.replyTo?.content || 'Replied question',
    answer: normalizeShowcaseAnswer(message.content || ''),
    createdAt: message.createdAt,
  }));
};

export async function GET(request) {
  try {
    await connectDB();

    const url = new URL(request.url);
    const username = (url.searchParams.get('username') || '').trim().toLowerCase();
    const exclude = url.searchParams.get('exclude') || '';
    const shouldRefresh = url.searchParams.get('refresh') === 'true';

    if (shouldRefresh) {
      await ensureGlobalSeeds();
    }

    if (!username) {
      return NextResponse.json(
        { success: false, message: 'username is required' },
        { status: 400 }
      );
    }

    const excludedSet = parseExclude(exclude);
    const pool = await getPoolForUsername(username);

    const unanswered = pool.filter((item) => !item.answer?.trim());
    const answered = pool
      .filter((item) => item.answer?.trim() && !item.hiddenFromShowcase)
      .sort((a, b) => new Date(b.answeredAt || b.updatedAt) - new Date(a.answeredAt || a.updatedAt))
      .slice(0, 20)
      .map((item) => ({
        id: item._id,
        itemType: 'question',
        question: item.question,
        answer: normalizeShowcaseAnswer(item.answer),
        createdAt: item.answeredAt || item.updatedAt,
      }));

    const boardReplyAnswered = await getBoardReplyShowcaseForUsername(username);

    const answeredKeys = new Set(
      answered.map((item) => `${normalizeQuestion(item.question)}::${normalizeQuestion(item.answer)}`)
    );

    const mergedAnswered = [...answered];

    for (const item of boardReplyAnswered) {
      const key = `${normalizeQuestion(item.question)}::${normalizeQuestion(item.answer)}`;
      if (answeredKeys.has(key)) continue;
      mergedAnswered.push(item);
    }

    mergedAnswered.sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );

    const filteredUnanswered = unanswered
      .filter((item) => !excludedSet.has(item.normalizedQuestion))
      .sort((a, b) => a.askedCount - b.askedCount || a.question.localeCompare(b.question));

    const personalSuggestions = filteredUnanswered
      .filter((item) => item.targetUsername === username)
      .map((item) => item.question);

    const globalSuggestions = filteredUnanswered
      .filter((item) => item.targetUsername !== username)
      .map((item) => item.question);

    const suggestions = mixSuggestionsWithUserRatio({
      personal: personalSuggestions,
      global: globalSuggestions,
      limit: SUGGESTION_LIMIT,
      shuffle: shouldRefresh,
    });

    return NextResponse.json(
      {
        success: true,
        suggestions,
        answered: mergedAnswered.slice(0, 20),
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch question pool',
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();
    await ensureGlobalSeeds();
    const { username, question } = await request.json();

    const normalizedUsername = (username || '').trim().toLowerCase();
    const trimmedQuestion = (question || '').trim();

    if (!normalizedUsername || !trimmedQuestion) {
      return NextResponse.json(
        { success: false, message: 'username and question are required' },
        { status: 400 }
      );
    }

    const normalizedQuestion = normalizeQuestion(trimmedQuestion);

    let existing;

    try {
      existing = await SuggestedQuestion.findOneAndUpdate(
        { targetUsername: normalizedUsername, normalizedQuestion },
        {
          $setOnInsert: {
            targetUsername: normalizedUsername,
            question: trimmedQuestion,
            normalizedQuestion,
            answer: '',
            answeredAt: null,
          },
          $inc: { askedCount: 1 },
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      const duplicateError = error?.code === 11000;
      if (!duplicateError) throw error;

      existing = await SuggestedQuestion.findOneAndUpdate(
        { targetUsername: normalizedUsername, normalizedQuestion },
        {
          $inc: { askedCount: 1 },
        },
        { new: true }
      );
    }

    if (!existing) {
      existing = await SuggestedQuestion.findOne({
        targetUsername: normalizedUsername,
        normalizedQuestion,
      });
    }

    if (!existing) {
      return NextResponse.json(
        {
          success: true,
          alreadyAnswered: false,
        },
        { status: 200 }
      );
    }

    if (existing.answer?.trim()) {
      return NextResponse.json(
        {
          success: true,
          alreadyAnswered: true,
          question: existing.question,
          answer: existing.answer,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        alreadyAnswered: false,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to record asked question',
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await connectDB();
    const authUser = await getAuthenticatedUser();

    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Please login to continue' },
        { status: 401 }
      );
    }

    const { username, questionId, question } = await request.json();
    const normalizedUsername = (username || '').trim().toLowerCase();

    if (!normalizedUsername || normalizedUsername !== authUser.username.toLowerCase()) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized update attempt' },
        { status: 403 }
      );
    }

    const trimmedQuestion = (question || '').trim();
    if (!trimmedQuestion) {
      return NextResponse.json(
        { success: false, message: 'question is required' },
        { status: 400 }
      );
    }

    const normalizedQuestion = normalizeQuestion(trimmedQuestion);

    const filter = questionId
      ? { _id: questionId, targetUsername: normalizedUsername }
      : { targetUsername: normalizedUsername, normalizedQuestion };

    let updated;

    try {
      updated = await SuggestedQuestion.findOneAndUpdate(
        filter,
        {
          $set: {
            targetUsername: normalizedUsername,
            question: trimmedQuestion,
            normalizedQuestion,
          },
          $setOnInsert: {
            askedCount: 0,
            answer: '',
            answeredAt: null,
          },
        },
        { new: true, upsert: true }
      );
    } catch (error) {
      const duplicateError = error?.code === 11000;
      if (!duplicateError) throw error;

      updated = await SuggestedQuestion.findOneAndUpdate(filter, {
        $set: {
          question: trimmedQuestion,
          normalizedQuestion,
        },
      }, { new: true });
    }

    return NextResponse.json(
      {
        success: true,
        item: {
          id: updated._id,
          question: updated.question,
          answer: updated.answer,
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: 'Failed to save question' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    await connectDB();
    const authUser = await getAuthenticatedUser();

    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Please login to continue' },
        { status: 401 }
      );
    }

    const { username, itemId, itemType } = await request.json();
    const normalizedUsername = (username || '').trim().toLowerCase();

    if (!normalizedUsername || normalizedUsername !== authUser.username.toLowerCase()) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized hide attempt' },
        { status: 403 }
      );
    }

    if (!itemId || !itemType) {
      return NextResponse.json(
        { success: false, message: 'itemId and itemType are required' },
        { status: 400 }
      );
    }

    if (itemType === 'question') {
      const updated = await SuggestedQuestion.findOneAndUpdate(
        {
          _id: itemId,
          targetUsername: normalizedUsername,
        },
        {
          $set: {
            hiddenFromShowcase: true,
          },
        },
        { new: true }
      );

      if (!updated) {
        return NextResponse.json(
          { success: false, message: 'Showcase item not found' },
          { status: 404 }
        );
      }
    } else if (itemType === 'reply') {
      const owner = await User.findOne({ username: normalizedUsername }).select('_id').lean();

      if (!owner?._id) {
        return NextResponse.json(
          { success: false, message: 'User not found' },
          { status: 404 }
        );
      }

      const boardChat = await Chat.findById(owner._id).select('_id').lean();

      if (!boardChat?._id) {
        return NextResponse.json(
          { success: false, message: 'Board chat not found' },
          { status: 404 }
        );
      }

      const replyId = String(itemId).startsWith('reply-')
        ? String(itemId).slice('reply-'.length)
        : itemId;

      const updated = await Message.findOneAndUpdate(
        {
          _id: replyId,
          chat: boardChat._id,
        },
        {
          $set: {
            hiddenFromShowcase: true,
          },
        },
        { new: true }
      );

      if (!updated) {
        return NextResponse.json(
          { success: false, message: 'Reply showcase item not found' },
          { status: 404 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid itemType' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Showcase item hidden successfully',
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: 'Failed to hide showcase item' },
      { status: 500 }
    );
  }
}
