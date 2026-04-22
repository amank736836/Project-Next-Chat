import { NextResponse } from 'next/server';
import axios from 'axios';
import connectDB from '../../../../../lib/server/db.js';
import SuggestedQuestion from '../../../../../lib/server/models/suggestedQuestion.model.js';

const SOCKET_CHAT_API_BASE = process.env.SOCKET_BACKEND_URL || 'http://localhost:4000/api/v1';

const normalizeQuestion = (value = '') =>
  value
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

const ensureGlobalSeeds = async () => {
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

export async function POST(request) {
  try {
    await connectDB();
    await ensureGlobalSeeds();

    const { username, question, content, sender } = await request.json();

    const normalizedUsername = (username || '').trim().toLowerCase();
    const trimmedQuestion = (question || '').trim();
    const trimmedContent = (content || '').trim();

    if (!normalizedUsername || !trimmedQuestion || !trimmedContent) {
      return NextResponse.json(
        { success: false, message: 'username, question, and content are required' },
        { status: 400 }
      );
    }

    const normalizedQuestion = normalizeQuestion(trimmedQuestion);

    // Step 1: Record the question
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

    let alreadyAnswered = false;
    let answeredQuestion = null;
    let answeredAnswer = null;

    if (existing && existing.answer?.trim()) {
      alreadyAnswered = true;
      answeredQuestion = existing.question;
      answeredAnswer = existing.answer;
    }

    // Step 2: Send the message via socket backend (if not already answered)
    let messageSent = false;
    let messageResponse = null;

    if (!alreadyAnswered) {
      try {
        const socketResponse = await axios.post(`${SOCKET_CHAT_API_BASE}/chat/sendMessage`, {
          content: trimmedContent,
          username,
          sender,
        });

        if (socketResponse.data.success) {
          messageSent = true;
          messageResponse = socketResponse.data;
        }
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            message: 'Failed to send message to socket backend',
            error: process.env.NODE_ENV === 'development' ? error?.message : undefined,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        alreadyAnswered,
        answeredQuestion,
        answeredAnswer,
        messageSent,
        messageResponse,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process question and message',
        error: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}
