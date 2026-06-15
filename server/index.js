const express = require('express');
const cors = require('cors');
const path = require('path');
const { MongoClient } = require('mongodb');
const statsRouter = require('./routes/stats');
const aiRouter = require('./routes/ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const uri = process.env.MONGO_URI;

app.use(cors());
app.use(express.json());

// Serve built React frontend
const fs = require('fs');
const distPath = path.join(__dirname, '../dist');
console.log('dist path:', distPath);
console.log('dist exists:', fs.existsSync(distPath));
console.log('dist contents:', fs.existsSync(distPath) ? fs.readdirSync(distPath) : 'MISSING');
app.use(express.static(distPath));

// Start server immediately — don't wait for DB
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Connect to DB in the background
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

connectToDB();

// SPA fallback — catches all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});
