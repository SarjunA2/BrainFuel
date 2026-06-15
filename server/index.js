const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { MongoClient } = require('mongodb');
const statsRouter = require('./routes/stats');
const aiRouter = require('./routes/ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const uri = process.env.MONGO_URI;

app.use(cors());
app.use(express.json());

const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

async function connectToDB() {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db("brainfuel");
    console.log("MongoDB connected");
    app.use('/stats', statsRouter(db));
    app.use('/ai', aiRouter(db));
  } catch (err) {
    console.error("DB connection failed:", err.message);
  }
}

// Register API routes first, then SPA fallback, then start listening
connectToDB().then(() => {
  // SPA fallback must come after API routes so /stats and /ai aren't swallowed
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
