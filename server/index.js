const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const statsRouter = require('./routes/stats');
const aiRouter = require('./routes/ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
let db;

app.use(cors());
app.use(express.json());

async function connectToDB() {
  try {
    await client.connect();
    db = client.db("brainfuel");
    console.log("MongoDB connected");
    app.use('/stats', statsRouter(db));
    app.use('/ai', aiRouter(db));

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("server connection failed:", err);
  }
}

connectToDB();
