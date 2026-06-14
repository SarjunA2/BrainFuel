const express = require('express');

function statsRouter(db) {
  const router = express.Router();
  const answersCollection = db.collection("answers");
  const streaksCollection = db.collection("streaks");

  router.post('/record', async (req, res) => {
    try {
      const { userId, category, correct, timestamp } = req.body;
      if (!userId) return res.status(400).json({ error: 'userId is required' });

      await answersCollection.insertOne({
        userId,
        category,
        correct,
        timestamp: new Date(timestamp)
      });

      // Update daily streak
      await updateStreak(streaksCollection, userId);

      res.status(201).json({ message: 'Answer recorded' });
    } catch (err) {
      res.status(500).json({ error: 'Did not record' });
    }
  });

  router.get('/summary', async (req, res) => {
    try {
      const userId = req.query.userId;
      if (!userId) return res.status(400).json({ error: 'userId is required' });

      const answers = await answersCollection.find({ userId }).sort({ timestamp: 1 }).toArray();

      let total = answers.length;
      let correct = 0;
      let longestStreak = 0;
      let currentStreak = 0;
      const categoryStats = {};

      for (const a of answers) {
        if (a.correct) {
          correct++;
          currentStreak++;
          longestStreak = Math.max(longestStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
        const cat = a.category || "Unknown";
        if (!categoryStats[cat]) categoryStats[cat] = { correct: 0, total: 0 };
        categoryStats[cat].total++;
        if (a.correct) categoryStats[cat].correct++;
      }

      let bestCategory = "N/A";
      let bestAccuracy = 0;
      for (const [cat, data] of Object.entries(categoryStats)) {
        const accuracy = data.correct / data.total;
        if (data.total >= 2 && accuracy > bestAccuracy) {
          bestAccuracy = accuracy;
          bestCategory = cat;
        }
      }

      const streakDoc = await streaksCollection.findOne({ userId });

      res.json({
        longestStreak,
        correctAnswers: correct,
        totalAnswered: total,
        categoryStats,
        bestCategory,
        dailyStreak: streakDoc?.currentStreak || 0,
        longestDailyStreak: streakDoc?.longestStreak || 0
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Did not compute stats' });
    }
  });

  // Touch streak on page load (so opening the app counts as activity)
  router.post('/streak/touch', async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ error: 'userId is required' });
      const streak = await updateStreak(streaksCollection, userId);
      res.json(streak);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update streak' });
    }
  });

  router.get('/streak', async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ error: 'userId is required' });
      const doc = await streaksCollection.findOne({ userId });
      res.json({
        currentStreak: doc?.currentStreak || 0,
        longestStreak: doc?.longestStreak || 0,
        lastActiveDate: doc?.lastActiveDate || null
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to get streak' });
    }
  });

  return router;
}

async function updateStreak(streaksCollection, userId) {
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const doc = await streaksCollection.findOne({ userId });

  if (!doc) {
    const newDoc = { userId, currentStreak: 1, longestStreak: 1, lastActiveDate: today };
    await streaksCollection.insertOne(newDoc);
    return newDoc;
  }

  if (doc.lastActiveDate === today) return doc; // already counted today

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const newStreak = doc.lastActiveDate === yesterdayStr ? doc.currentStreak + 1 : 1;
  const longestStreak = Math.max(newStreak, doc.longestStreak || 0);

  await streaksCollection.updateOne(
    { userId },
    { $set: { currentStreak: newStreak, longestStreak, lastActiveDate: today } }
  );

  return { currentStreak: newStreak, longestStreak, lastActiveDate: today };
}

module.exports = statsRouter;
