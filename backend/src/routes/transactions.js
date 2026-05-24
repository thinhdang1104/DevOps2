const express = require("express");
const pool = require("../db");

const router = express.Router();

function buildFilters(query) {
  const clauses = [];
  const params = [];

  if (query.type) {
    if (!["INCOME", "EXPENSE"].includes(query.type)) {
      throw new Error("type must be INCOME or EXPENSE");
    }
    clauses.push("type = ?");
    params.push(query.type);
  }

  if (query.category) {
    clauses.push("UPPER(category) = ?");
    params.push(String(query.category).trim().toUpperCase());
  }

  if (query.startDate) {
    clauses.push("DATE(created_at) >= ?");
    params.push(query.startDate);
  }

  if (query.endDate) {
    clauses.push("DATE(created_at) <= ?");
    params.push(query.endDate);
  }

  return {
    whereSql: clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "",
    params
  };
}

router.get("/", async (req, res, next) => {
  try {
    const { whereSql, params } = buildFilters(req.query);
    const [rows] = await pool.query(
      `SELECT id, type, amount, category, description, created_at
       FROM transactions
       ${whereSql}
       ORDER BY created_at DESC`,
      params
    );
    res.json(rows);
  } catch (error) {
    if (error.message === "type must be INCOME or EXPENSE") {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
});

router.get("/summary", async (req, res, next) => {
  try {
    const { whereSql, params } = buildFilters(req.query);
    const [rows] = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount END), 0) AS total_expense
      FROM transactions
      ${whereSql}
    `, params);

    const totalIncome = Number(rows[0].total_income || 0);
    const totalExpense = Number(rows[0].total_expense || 0);

    res.json({
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense
    });
  } catch (error) {
    if (error.message === "type must be INCOME or EXPENSE") {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
});

router.get("/monthly", async (req, res, next) => {
  try {
    const requestedYear = Number(req.query.year || new Date().getFullYear());
    if (!Number.isInteger(requestedYear) || requestedYear < 2000 || requestedYear > 2100) {
      return res.status(400).json({ message: "year must be a valid number" });
    }

    const [rows] = await pool.query(
      `SELECT
         DATE_FORMAT(created_at, '%Y-%m') AS month,
         COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) AS total_income,
         COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) AS total_expense
       FROM transactions
       WHERE YEAR(created_at) = ?
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month ASC`,
      [requestedYear]
    );

    const data = rows.map((row) => {
      const totalIncome = Number(row.total_income || 0);
      const totalExpense = Number(row.total_expense || 0);
      return {
        month: row.month,
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense
      };
    });

    return res.json({ year: requestedYear, data });
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { type, amount, description, category } = req.body;

    if (!["INCOME", "EXPENSE"].includes(type)) {
      return res.status(400).json({ message: "type must be INCOME or EXPENSE" });
    }

    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ message: "amount must be a positive number" });
    }

    if (!description || String(description).trim().length === 0) {
      return res.status(400).json({ message: "description is required" });
    }

    const safeCategory = String(category || "GENERAL").trim().toUpperCase();
    if (safeCategory.length === 0 || safeCategory.length > 50) {
      return res.status(400).json({ message: "category must be 1-50 characters" });
    }

    const [result] = await pool.query(
      "INSERT INTO transactions(type, amount, category, description) VALUES (?, ?, ?, ?)",
      [type, amount, safeCategory, description.trim()]
    );

    const [rows] = await pool.query(
      "SELECT id, type, amount, category, description, created_at FROM transactions WHERE id = ?",
      [result.insertId]
    );

    return res.status(201).json(rows[0]);
  } catch (error) {
    return next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "invalid id" });
    }

    const { type, amount, description, category } = req.body;

    if (!["INCOME", "EXPENSE"].includes(type)) {
      return res.status(400).json({ message: "type must be INCOME or EXPENSE" });
    }

    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ message: "amount must be a positive number" });
    }

    if (!description || String(description).trim().length === 0) {
      return res.status(400).json({ message: "description is required" });
    }

    const safeCategory = String(category || "GENERAL").trim().toUpperCase();
    if (safeCategory.length === 0 || safeCategory.length > 50) {
      return res.status(400).json({ message: "category must be 1-50 characters" });
    }

    const [result] = await pool.query(
      `UPDATE transactions
       SET type = ?, amount = ?, category = ?, description = ?
       WHERE id = ?`,
      [type, amount, safeCategory, description.trim(), id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "transaction not found" });
    }

    const [rows] = await pool.query(
      "SELECT id, type, amount, category, description, created_at FROM transactions WHERE id = ?",
      [id]
    );

    return res.json(rows[0]);
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
