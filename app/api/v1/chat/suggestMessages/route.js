import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/server/db.js';
import SuggestedQuestion from '../../../../../lib/server/models/suggestedQuestion.model.js';
import { generateSuggestionsWithNvidia } from '../../../../../lib/server/nvidia.js';

const SUGGESTION_SEPARATOR = '||';

const SEED_QUESTIONS = [
  'What is something small that made your day better recently?',
  'If you could instantly learn one skill, what would it be and why?',
  'What kind of conversation helps you feel most understood?',
  'What is one goal you are currently working toward?',
  'What is a book, movie, or song you keep recommending to people?',
  'What helps you recharge after a stressful day?',
  'What is one habit that improved your life the most?',
  'If you could travel anywhere this year, where would you go first?',
  'What is one thing people often misunderstand about you?',
  'What is a memory that still makes you smile?',
  'What motivates you when you feel stuck?',
  'What is one question you wish people asked you more often?',
];

const toPipeSeparated = (items) => items.join(SUGGESTION_SEPARATOR);

const normalizeQuestion = (value = '') =>
  value
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

const parseExcludedQuestions = (exclude = '') => {
  if (!exclude) return new Set();

  return new Set(
    exclude
      .split(SUGGESTION_SEPARATOR)
      .map((item) => normalizeQuestion(item))
      .filter(Boolean)
  );
};

const ensureSeedQuestions = async () => {
  await Promise.all(
    SEED_QUESTIONS.map((question) =>
      SuggestedQuestion.updateOne(
        { question },
        { $setOnInsert: { question, askedCount: 0 } },
        { upsert: true }
      )
    )
  );
};

const pickSuggestions = (questions, excludedSet, limit = 3) => {
  const filtered = [];
  const seen = new Set();

  for (const item of questions) {
    const normalized = normalizeQuestion(item.question);

    if (!normalized || excludedSet.has(normalized) || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    filtered.push(item.question.trim());
  }

  for (let i = filtered.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
  }

  return filtered.slice(0, limit);
};

const extractSuggestionText = (payload) => {
  const text = payload?.candidates?.[0]?.content?.parts
    ?.map((part) => part?.text || '')
    .join('')
    .trim();

  if (!text) return null;
  return text;
};

const generateWithGeminiRest = async (exclude = '') => {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) return null;

  const prompt = `Create a list of three open-ended and engaging questions formatted as a single string.\nEach question should be separated by '||'.\nThese questions are for an anonymous social messaging app, designed to spark conversation.\nAvoid questions that are too personal or inappropriate.\n${exclude ? `Exclude these topics: ${exclude}` : ''}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    }
  );

  if (!response.ok) return null;

  const payload = await response.json();
  return extractSuggestionText(payload);
};

export async function POST(request) {
  try {
    await connectDB();
    const { exclude, askedQuestion } = await request.json();

    await ensureSeedQuestions();

    const excludedQuestions = parseExcludedQuestions(exclude);

    const normalizedAskedQuestion = normalizeQuestion(askedQuestion || '');
    if (normalizedAskedQuestion) {
      await SuggestedQuestion.updateOne(
        { question: new RegExp(`^${askedQuestion.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        {
          $setOnInsert: { question: askedQuestion.trim() },
          $inc: { askedCount: 1 },
        },
        { upsert: true }
      );
      excludedQuestions.add(normalizedAskedQuestion);
    }

    const unaskedQuestions = await SuggestedQuestion.find({ askedCount: 0 })
      .select('question -_id')
      .lean();

    let pickedSuggestions = pickSuggestions(unaskedQuestions, excludedQuestions, 3);

    if (pickedSuggestions.length < 3) {
      // Fastest measured provider first (NVIDIA nemotron-3.5-lightning),
      // Gemini as fallback. Either may be unconfigured — both return null then.
      const nvidiaSuggestions =
        (await generateSuggestionsWithNvidia({ exclude })) || [];
      const geminiText =
        nvidiaSuggestions.length >= 3
          ? null
          : await generateWithGeminiRest(exclude);
      const aiSuggestions = [
        ...nvidiaSuggestions,
        ...(geminiText
          ? geminiText.split(SUGGESTION_SEPARATOR).map((item) => item.trim()).filter(Boolean)
          : []),
      ];

      for (const suggestion of aiSuggestions) {
        await SuggestedQuestion.updateOne(
          { question: suggestion },
          { $setOnInsert: { question: suggestion, askedCount: 0 } },
          { upsert: true }
        );
      }

      const refreshedUnaskedQuestions = await SuggestedQuestion.find({ askedCount: 0 })
        .select('question -_id')
        .lean();

      pickedSuggestions = pickSuggestions(refreshedUnaskedQuestions, excludedQuestions, 3);
    }

    if (pickedSuggestions.length < 3) {
      pickedSuggestions = pickSuggestions(
        SEED_QUESTIONS.map((question) => ({ question })),
        excludedQuestions,
        3
      );
    }

    const message = toPipeSeparated(pickedSuggestions);

    return NextResponse.json(
      { success: true, message },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: true,
        message: toPipeSeparated(SEED_QUESTIONS.slice(0, 3)),
      },
      { status: 200 }
    );
  }
}
