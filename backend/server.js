const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
  })
  .catch(err => {
    console.error("❌ MongoDB Connection Error:");
    console.error(err);
  });

// routes
app.use("/api/transactions", require("./routes/transactions")); // existing

// 🔐 ADD AUTH ROUTES HERE
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

// test route
app.get("/", (req, res) => {
  res.send("Finance Tracker API Running");
});

// start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on port", PORT));

