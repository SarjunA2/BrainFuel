const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function aiRouter(db) {
  const router = express.Router();
  const flashcardProgressCollection = db.collection("flashcard_progress");

  // Generate flashcards for a topic + difficulty
  router.post('/flashcards', async (req, res) => {
    try {
      const { topic, difficulty = 'beginner', count = 8 } = req.body;
      if (!topic) return res.status(400).json({ error: 'topic is required' });

      const difficultyGuide = {
        beginner: 'basic, well-known facts that most people would recognize',
        intermediate: 'moderately detailed facts requiring some knowledge of the subject',
        advanced: 'specific, nuanced facts that only enthusiasts or experts would know'
      };

      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Generate ${count} trivia flashcards about "${topic}" at ${difficulty} difficulty (${difficultyGuide[difficulty] || difficultyGuide.beginner}).

Return ONLY a JSON array with no extra text, in this exact format:
[
  { "question": "...", "answer": "..." },
  ...
]

Make each answer concise (1-2 sentences max). Keep questions clear and unambiguous.`
        }]
      });

      const text = message.content[0].text.trim();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return res.status(500).json({ error: 'Failed to parse AI response' });

      const flashcards = JSON.parse(jsonMatch[0]);
      res.json({ flashcards });
    } catch (err) {
      console.error('Flashcard generation error:', err);
      res.status(500).json({ error: 'Failed to generate flashcards' });
    }
  });

  // Explain a trivia answer
  router.post('/explain', async (req, res) => {
    try {
      const { question, correctAnswer, userAnswer, wasCorrect } = req.body;
      if (!question || !correctAnswer) {
        return res.status(400).json({ error: 'question and correctAnswer are required' });
      }

      const prompt = wasCorrect
        ? `Trivia question: "${question}"\nCorrect answer: "${correctAnswer}"\n\nGive a 1-2 sentence interesting fact or context that makes this answer memorable. Be engaging and concise.`
        : `Trivia question: "${question}"\nThe player answered: "${userAnswer}"\nCorrect answer: "${correctAnswer}"\n\nBriefly explain why "${correctAnswer}" is correct in 1-2 sentences. Be clear and educational.`;

      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }]
      });

      res.json({ explanation: message.content[0].text.trim() });
    } catch (err) {
      console.error('Explain error:', err);
      res.status(500).json({ error: 'Failed to generate explanation' });
    }
  });

  // Generate a custom quiz on any topic
  router.post('/quiz', async (req, res) => {
    try {
      const { topic, count = 5 } = req.body;
      if (!topic) return res.status(400).json({ error: 'topic is required' });

      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: `Generate ${count} multiple-choice trivia questions about "${topic}".

Return ONLY a JSON array with no extra text:
[
  {
    "question": "...",
    "correct_answer": "...",
    "incorrect_answers": ["...", "...", "..."]
  },
  ...
]

Rules:
- Each question must have exactly 3 incorrect answers
- Keep answers short (1-5 words each)
- Make questions clear and unambiguous
- Vary the difficulty slightly across questions`
        }]
      });

      const text = message.content[0].text.trim();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return res.status(500).json({ error: 'Failed to parse AI response' });

      const questions = JSON.parse(jsonMatch[0]);
      // Shuffle answers on the server side
      const formatted = questions.map(q => ({
        ...q,
        category: topic,
        allAnswers: shuffle([q.correct_answer, ...q.incorrect_answers])
      }));

      res.json({ questions: formatted });
    } catch (err) {
      console.error('Quiz generation error:', err);
      res.status(500).json({ error: 'Failed to generate quiz' });
    }
  });

  // Save flashcard session progress
  router.post('/flashcards/progress', async (req, res) => {
    try {
      const { userId, topic, difficulty, mastered, total } = req.body;
      if (!userId) return res.status(400).json({ error: 'userId is required' });

      await flashcardProgressCollection.insertOne({
        userId, topic, difficulty, mastered, total,
        studiedAt: new Date()
      });
      res.status(201).json({ message: 'Progress saved' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to save progress' });
    }
  });

  return router;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

module.exports = aiRouter;
