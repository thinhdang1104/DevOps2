const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const transactionsRouter = require("./routes/transactions");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("combined"));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "expense-tracker-backend" });
});

app.use("/api/transactions", transactionsRouter);

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

module.exports = app;
