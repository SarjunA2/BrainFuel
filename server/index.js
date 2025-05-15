const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const statsRouter = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3001;
const uri = "mongodb+srv://Arjun:Athmakuri@cluster0.75tuy8a.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri);
let db;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connect + Start
async function connectToDB() {
  try {
    await client.connect();
    db = client.db("brainfuel");
    console.log("✅ MongoDB connected");

    // Inject db into routes
    app.use('/stats', statsRouter(db));

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ DB connection failed:", err);
  }
}

connectToDB();
