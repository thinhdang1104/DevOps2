const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/", async (_req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, type, amount, description, created_at FROM transactions ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get("/summary", async (_req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount END), 0) AS total_expense
      FROM transactions
    `);

    const totalIncome = Number(rows[0].total_income || 0);
    const totalExpense = Number(rows[0].total_expense || 0);

    res.json({
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { type, amount, description } = req.body;

    if (!["INCOME", "EXPENSE"].includes(type)) {
      return res.status(400).json({ message: "type must be INCOME or EXPENSE" });
    }

    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ message: "amount must be a positive number" });
    }

    if (!description || String(description).trim().length === 0) {
      return res.status(400).json({ message: "description is required" });
    }

    const [result] = await pool.query(
      "INSERT INTO transactions(type, amount, description) VALUES (?, ?, ?)",
      [type, amount, description.trim()]
    );

    const [rows] = await pool.query(
      "SELECT id, type, amount, description, created_at FROM transactions WHERE id = ?",
      [result.insertId]
    );

    return res.status(201).json(rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "invalid id" });
    }

    const [result] = await pool.query("DELETE FROM transactions WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "transaction not found" });
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
