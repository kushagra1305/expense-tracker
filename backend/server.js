const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ================= CORS CONFIG =================
// Allow Netlify frontend + local testing
const allowedOrigins = [
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "https://brilliant-madeleine-7786d8.netlify.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps, curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("CORS not allowed"));
      }
    },
    credentials: true
  })
);

app.use(express.json());

// ================= MONGODB CONNECTION =================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:");
    console.error(err.message);
    process.exit(1); // stop app if DB fails
  });

// ================= ROUTES =================
app.get("/", (req, res) => {
  res.send("🚀 Expense Tracker API Running");
});

// Auth routes
app.use("/api/auth", require("./routes/auth"));

// Transaction routes
app.use("/api/transactions", require("./routes/transactions"));

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
