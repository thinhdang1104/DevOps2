import { useEffect, useState } from "react";
import {
  createTransaction,
  deleteTransaction,
  getHealth,
  getSummary,
  getTransactions
} from "./api";

const initialForm = {
  type: "EXPENSE",
  amount: "",
  description: ""
};

function App() {
  const [health, setHealth] = useState("checking");
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  async function refreshData() {
    const [tx, sum] = await Promise.all([getTransactions(), getSummary()]);
    setTransactions(tx);
    setSummary(sum);
  }

  useEffect(() => {
    async function bootstrap() {
      try {
        const healthResult = await getHealth();
        setHealth(healthResult.ok ? "ok" : "down");
        await refreshData();
      } catch (e) {
        setHealth("down");
        setError(e.message);
      }
    }

    bootstrap();
  }, []);

  async function onSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      await createTransaction({
        type: form.type,
        amount: Number(form.amount),
        description: form.description
      });
      setForm(initialForm);
      await refreshData();
    } catch (e) {
      setError(e.message);
    }
  }

  async function onDelete(id) {
    setError("");
    try {
      await deleteTransaction(id);
      await refreshData();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <main className="container">
      <h1>Expense Tracker</h1>
      <p className="health">API health: {health}</p>

      {error ? <p className="error">{error}</p> : null}

      <section className="card">
        <h2>Create Transaction</h2>
        <form className="form" onSubmit={onSubmit}>
          <select
            value={form.type}
            onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
          >
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Amount"
            value={form.amount}
            onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
            required
          />
          <input
            type="text"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            required
          />
          <button type="submit">Add</button>
        </form>
      </section>

      <section className="card summary">
        <h2>Summary</h2>
        <p>Total Income: {summary.totalIncome}</p>
        <p>Total Expense: {summary.totalExpense}</p>
        <p>Balance: {summary.balance}</p>
      </section>

      <section className="card">
        <h2>Transactions</h2>
        <ul className="list">
          {transactions.map((item) => (
            <li key={item.id} className="item">
              <span>
                [{item.type}] {item.description} - {item.amount}
              </span>
              <button type="button" onClick={() => onDelete(item.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export default App;
