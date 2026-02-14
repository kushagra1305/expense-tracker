const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  title: String,
  amount: Number,
  type: String,
  category: String,
  date: String,
  month: String,

  // 🔐 link transaction to logged-in user
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
});

module.exports = mongoose.model("Transaction", transactionSchema);
