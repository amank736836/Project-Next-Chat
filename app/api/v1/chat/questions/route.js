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
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();

const normalizeQuestionLegacy = (value = '') =>
  value
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

const getNormalizedQuestionCandidates = (value = '') => {
  const normalized = normalizeQuestion(value);
  const legacyNormalized = normalizeQuestionLegacy(value);

  return [normalized, legacyNormalized].filter(
    (item, index, arr) => Boolean(item) && arr.indexOf(item) === index
  );
};

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

const dedupeQuestions = (questions = []) => {
  const seen = new Set();

  return questions.filter((question) => {
    const normalized = normalizeQuestion(question);
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
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

const getBoardReplyShowcaseForUsername = async (username, { includeHidden = false } = {}) => {
  const owner = await User.findOne({ username }).select('_id username').lean();

  if (!owner?._id) return [];

  const boardChat = await Chat.findById(owner._id).select('_id').lean();

  if (!boardChat?._id) return [];

  const replyQuery = {
    chat: boardChat._id,
    replyTo: { $exists: true },
    'replyTo.content': { $nin: ['', null] },
  };

  if (!includeHidden) {
    replyQuery.hiddenFromShowcase = { $ne: true };
  }

  const replyMessages = await Message.find(replyQuery)
    .populate('sender', 'name username')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return replyMessages.map((message) => ({
    id: `reply-${message._id}`,
    itemType: 'reply',
    hiddenFromShowcase: Boolean(message.hiddenFromShowcase),
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

    const authUser = await getAuthenticatedUser(request);
    const isOwnerViewer =
      Boolean(authUser?.username) && authUser.username.toLowerCase() === username;

    const excludedSet = parseExclude(exclude);
    const pool = await getPoolForUsername(username);

    const unanswered = pool.filter((item) => !item.answer?.trim());
    const answered = pool
      .filter((item) => item.answer?.trim() && (isOwnerViewer || !item.hiddenFromShowcase))
      .sort((a, b) => new Date(b.answeredAt || b.updatedAt) - new Date(a.answeredAt || a.updatedAt))
      .slice(0, 20)
      .map((item) => ({
        id: item._id,
        itemType: 'question',
        hiddenFromShowcase: Boolean(item.hiddenFromShowcase),
        question: item.question,
        answer: normalizeShowcaseAnswer(item.answer),
        createdAt: item.answeredAt || item.updatedAt,
      }));

    const boardReplyAnswered = await getBoardReplyShowcaseForUsername(username, {
      includeHidden: isOwnerViewer,
    });

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

    const personalUnanswered = unanswered
      .filter((item) => item.targetUsername === username)
      .sort((a, b) => a.askedCount - b.askedCount || a.question.localeCompare(b.question));

    const askedQuestionSet = new Set(
      personalUnanswered
        .filter((item) => (item.askedCount || 0) > 0)
        .map((item) => normalizeQuestion(item.question || item.normalizedQuestion || ''))
        .filter(Boolean)
    );

    const priorityQuestions = personalUnanswered
      .filter((item) => (item.askedCount || 0) > 0)
      .sort((a, b) => (b.askedCount || 0) - (a.askedCount || 0))
      .slice(0, 10)
      .map((item) => ({
        id: item._id,
        question: item.question,
        askedCount: item.askedCount || 0,
        createdAt: item.createdAt,
      }));

    const customQuestions = personalUnanswered
      .filter((item) => (item.askedCount || 0) === 0)
      .map((item) => ({
      id: item._id,
      question: item.question,
      askedCount: item.askedCount || 0,
      createdAt: item.createdAt,
      }));

    const filteredUnanswered = unanswered
      .filter(
        (item) => {
          const normalized = normalizeQuestion(item.question || item.normalizedQuestion || '');
          return !excludedSet.has(normalized) && !askedQuestionSet.has(normalized);
        }
      )
      .sort((a, b) => a.askedCount - b.askedCount || a.question.localeCompare(b.question));

    const personalSuggestions = personalUnanswered
      .filter((item) => (item.askedCount || 0) === 0)
      .map((item) => item.question);

    const globalSuggestions = filteredUnanswered
      .filter((item) => item.targetUsername !== username)
      .map((item) => item.question);

    const suggestions = dedupeQuestions(
      mixSuggestionsWithUserRatio({
      personal: personalSuggestions,
      global: globalSuggestions,
      limit: SUGGESTION_LIMIT,
      shuffle: shouldRefresh,
      })
    );

    return NextResponse.json(
      {
        success: true,
        suggestions,
        answered: mergedAnswered.slice(0, 20),
        customQuestions,
        priorityQuestions,
        ownerView: isOwnerViewer,
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
    const normalizedQuestionCandidates = getNormalizedQuestionCandidates(trimmedQuestion);

    let existing = await SuggestedQuestion.findOne({
      targetUsername: normalizedUsername,
      normalizedQuestion: { $in: normalizedQuestionCandidates },
    });

    if (existing?.answer?.trim()) {
      existing = await SuggestedQuestion.findOneAndUpdate(
        { _id: existing._id },
        { $inc: { askedCount: 1 } },
        { new: true }
      );

      return NextResponse.json(
        {
          success: true,
          alreadyAsked: true,
          alreadyAnswered: true,
          question: existing.question,
          answer: existing.answer,
        },
        { status: 200 }
      );
    }

    if (existing && (existing.askedCount || 0) > 0) {
      existing = await SuggestedQuestion.findOneAndUpdate(
        { _id: existing._id },
        { $inc: { askedCount: 1 } },
        { new: true }
      );

      return NextResponse.json(
        {
          success: true,
          alreadyAsked: true,
          alreadyAnswered: false,
        },
        { status: 200 }
      );
    }

    if (existing) {
      existing = await SuggestedQuestion.findOneAndUpdate(
        { _id: existing._id },
        {
          $set: {
            question: trimmedQuestion,
            normalizedQuestion,
          },
          $inc: { askedCount: 1 },
        },
        { new: true }
      );
    } else {
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

        existing = await SuggestedQuestion.findOne({
          targetUsername: normalizedUsername,
          normalizedQuestion: { $in: normalizedQuestionCandidates },
        });

        if (existing && (existing.askedCount || 0) > 0) {
          existing = await SuggestedQuestion.findOneAndUpdate(
            { _id: existing._id },
            { $inc: { askedCount: 1 } },
            { new: true }
          );

          return NextResponse.json(
            {
              success: true,
              alreadyAsked: true,
              alreadyAnswered: Boolean(existing.answer?.trim()),
              question: existing.answer?.trim() ? existing.question : undefined,
              answer: existing.answer?.trim() ? existing.answer : undefined,
            },
            { status: 200 }
          );
        }

        if (existing) {
          existing = await SuggestedQuestion.findOneAndUpdate(
            { _id: existing._id },
            {
              $set: {
                question: trimmedQuestion,
                normalizedQuestion,
              },
              $inc: { askedCount: 1 },
            },
            { new: true }
          );
        }
      }
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
          alreadyAsked: true,
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
        alreadyAsked: false,
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
    const normalizedQuestionCandidates = getNormalizedQuestionCandidates(trimmedQuestion);

    const askedDuplicate = await SuggestedQuestion.findOne({
      targetUsername: normalizedUsername,
      normalizedQuestion: { $in: normalizedQuestionCandidates },
      askedCount: { $gt: 0 },
      ...(questionId ? { _id: { $ne: questionId } } : {}),
    }).lean();

    if (askedDuplicate) {
      return NextResponse.json(
        {
          success: true,
          alreadyAsked: true,
          alreadyAnswered: Boolean(askedDuplicate.answer?.trim()),
          question: askedDuplicate.question,
          answer: askedDuplicate.answer?.trim() ? askedDuplicate.answer : undefined,
          message: 'This question was already asked and cannot be added as custom.',
        },
        { status: 200 }
      );
    }

    const filter = questionId
      ? { _id: questionId, targetUsername: normalizedUsername }
      : {
          targetUsername: normalizedUsername,
          normalizedQuestion: { $in: normalizedQuestionCandidates },
        };

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

    const { username, itemId, itemType, action = 'hide' } = await request.json();
    const normalizedUsername = (username || '').trim().toLowerCase();
    const shouldHide = action !== 'show';

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
            hiddenFromShowcase: shouldHide,
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
            hiddenFromShowcase: shouldHide,
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
        message: shouldHide
          ? 'Showcase item hidden successfully'
          : 'Showcase item shown successfully',
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

export async function DELETE(request) {
  try {
    await connectDB();
    const authUser = await getAuthenticatedUser();

    if (!authUser) {
      return NextResponse.json(
        { success: false, message: 'Please login to continue' },
        { status: 401 }
      );
    }

    const { username, questionId } = await request.json();
    const normalizedUsername = (username || '').trim().toLowerCase();

    if (!normalizedUsername || normalizedUsername !== authUser.username.toLowerCase()) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized delete attempt' },
        { status: 403 }
      );
    }

    if (!questionId) {
      return NextResponse.json(
        { success: false, message: 'questionId is required' },
        { status: 400 }
      );
    }

    const deleted = await SuggestedQuestion.findOneAndDelete({
      _id: questionId,
      targetUsername: normalizedUsername,
    });

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Question not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Custom question deleted successfully',
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: 'Failed to delete custom question' },
      { status: 500 }
    );
  }
}
