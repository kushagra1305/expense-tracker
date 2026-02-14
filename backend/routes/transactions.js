const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const auth = require("../middleware/auth"); // 🔐 JWT middleware


// ================= GET: Only logged-in user's transactions =================
router.get("/", auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user }).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ================= POST: Add transaction for logged-in user =================
router.post("/", auth, async (req, res) => {
  try {
    const transaction = new Transaction({
      ...req.body,
      user: req.user // 🔐 attach user ID
    });

    const saved = await transaction.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


// ================= DELETE: Delete only user's own transaction =================
router.delete("/:id", auth, async (req, res) => {
  try {
    const deleted = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user // 🔐 ensure ownership
    });

    if (!deleted) {
      return res.status(404).json({ message: "Transaction not found or not yours" });
    }

    res.json({ message: "Transaction deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;
