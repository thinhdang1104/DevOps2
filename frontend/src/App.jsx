import { useEffect, useState } from "react";
import {
  createTransaction,
  deleteTransaction,
  getHealth,
  getMonthlySummary,
  getSummary,
  getTransactions
} from "./api";

const initialForm = {
  type: "EXPENSE",
  amount: "",
  category: "GENERAL",
  description: ""
};

const initialFilters = {
  type: "ALL",
  category: "",
  startDate: "",
  endDate: ""
};

function toApiFilters(filters) {
  return {
    type: filters.type === "ALL" ? "" : filters.type,
    category: filters.category,
    startDate: filters.startDate,
    endDate: filters.endDate
  };
}

function App() {
  const [health, setHealth] = useState("checking");
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [monthly, setMonthly] = useState({ year: new Date().getFullYear(), data: [] });
  const [filters, setFilters] = useState(initialFilters);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  async function refreshData(activeFilters = filters) {
    const apiFilters = toApiFilters(activeFilters);
    const [tx, sum, monthlyResult] = await Promise.all([
      getTransactions(apiFilters),
      getSummary(apiFilters),
      getMonthlySummary(monthly.year)
    ]);

    setTransactions(tx);
    setSummary(sum);
    setMonthly(monthlyResult);
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
        category: form.category,
        description: form.description
      });
      setForm(initialForm);
      await refreshData();
    } catch (e) {
      setError(e.message);
    }
  }

  async function onApplyFilters(event) {
    event.preventDefault();
    setError("");
    try {
      await refreshData(filters);
    } catch (e) {
      setError(e.message);
    }
  }

  async function onResetFilters() {
    setError("");
    setFilters(initialFilters);
    try {
      await refreshData(initialFilters);
    } catch (e) {
      setError(e.message);
    }
  }

  async function onChangeYear(event) {
    const selectedYear = Number(event.target.value);
    const nextMonthly = await getMonthlySummary(selectedYear);
    setMonthly(nextMonthly);
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
            placeholder="Category (e.g. FOOD)"
            value={form.category}
            onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
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

      <section className="card">
        <h2>Filters</h2>
        <form className="filter-form" onSubmit={onApplyFilters}>
          <select
            value={filters.type}
            onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
          >
            <option value="ALL">All Types</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>
          <input
            type="text"
            placeholder="Category"
            value={filters.category}
            onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
          />
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
          />
          <button type="submit">Apply</button>
          <button type="button" onClick={onResetFilters}>
            Reset
          </button>
        </form>
      </section>

      <section className="card summary">
        <h2>Summary</h2>
        <p>Total Income: {summary.totalIncome}</p>
        <p>Total Expense: {summary.totalExpense}</p>
        <p>Balance: {summary.balance}</p>
      </section>

      <section className="card">
        <h2>Monthly Summary</h2>
        <div className="monthly-head">
          <label htmlFor="year">Year:</label>
          <input id="year" type="number" min="2000" max="2100" defaultValue={monthly.year} onBlur={onChangeYear} />
        </div>
        <ul className="list">
          {monthly.data.map((item) => (
            <li key={item.month} className="item">
              <span>
                {item.month} | +{item.totalIncome} | -{item.totalExpense}
              </span>
              <strong>{item.balance}</strong>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Transactions</h2>
        <ul className="list">
          {transactions.map((item) => (
            <li key={item.id} className="item">
              <span>
                [{item.type}] [{item.category}] {item.description} - {item.amount}
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
