const express = require('express');

function statsRouter(db) {
  const router = express.Router();
  const answersCollection = db.collection("answers");

  router.post('/record', async (req, res) => {
    try {
      const {  userId, category, correct, timestamp } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      const result = await answersCollection.insertOne({
        userId,
        category,
        correct,
        timestamp: new Date(timestamp)
      });
      
      console.log("Inserted doc:", result);
      console.log("Recording answer for:", userId);
      res.status(201).json({ message: 'Answer recorded' });
    } catch (err) {
      res.status(500).json({ error: 'Did not record ' });
    }
  });

router.get('/summary', async (req, res) => {
    try {
        const userId = req.query.userId;

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }
      const answers = await answersCollection.find({userId}).sort({ timestamp: 1 }).toArray();
  
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
        if (!categoryStats[cat]) {
          categoryStats[cat] = { correct: 0, total: 0 };
        }
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
  
      res.json({
        longestStreak,
        correctAnswers: correct,
        totalAnswered: total,
        categoryStats,
        bestCategory
      });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Did not compute stats' });
    }
  });
  

  return router;
}

module.exports = statsRouter;
