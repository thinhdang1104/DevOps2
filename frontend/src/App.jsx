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

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(value);
}

function badgeClass(type) {
  return type === "INCOME" ? "badge badge-income" : "badge badge-expense";
}

function isValidYear(value) {
  const year = Number(value);
  return Number.isInteger(year) && year >= 2000 && year <= 2100;
}

function App() {
  const currentYear = new Date().getFullYear();
  const [health, setHealth] = useState("checking");
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [monthly, setMonthly] = useState({ year: currentYear, data: [] });
  const [yearInput, setYearInput] = useState(String(currentYear));
  const [filters, setFilters] = useState(initialFilters);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  async function refreshData(activeFilters = filters) {
    const targetYear = isValidYear(yearInput) ? Number(yearInput) : currentYear;
    const apiFilters = toApiFilters(activeFilters);
    const [tx, sum, monthlyResult] = await Promise.all([
      getTransactions(apiFilters),
      getSummary(apiFilters),
      getMonthlySummary(targetYear)
    ]);

    setTransactions(tx);
    setSummary(sum);
    setMonthly(monthlyResult);
    setYearInput(String(monthlyResult.year));
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

  function onChangeYearInput(event) {
    setYearInput(event.target.value);
  }

  async function onApplyYear() {
    setError("");
    if (!isValidYear(yearInput)) {
      setError("Year must be from 2000 to 2100");
      return;
    }

    try {
      const nextMonthly = await getMonthlySummary(Number(yearInput));
      setMonthly(nextMonthly);
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
      <section className="hero">
        <div className="hero-copy">
          <h1>Expense Tracker</h1>
          <p className={`health ${health === "ok" ? "health-ok" : "health-down"}`}>
            API health: {health}
          </p>
        </div>

        <div className="dashboard-cards">
          <article className="stat-card income">
            <span>Total Income</span>
            <strong>{formatCurrency(summary.totalIncome)}</strong>
          </article>
          <article className="stat-card expense">
            <span>Total Expense</span>
            <strong>{formatCurrency(summary.totalExpense)}</strong>
          </article>
          <article className="stat-card balance">
            <span>Balance</span>
            <strong>{formatCurrency(summary.balance)}</strong>
          </article>
        </div>
      </section>

      {error ? <p className="error">{error}</p> : null}

      <section className="card card-split">
        <div className="card-pane">
          <h2 className="section-title">Create Transaction</h2>
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
            <button type="submit">Add Transaction</button>
          </form>
        </div>

        <div className="card-pane">
          <h2 className="section-title">Filters</h2>
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
            <button type="submit">Apply Filters</button>
            <button type="button" className="secondary" onClick={onResetFilters}>
              Reset
            </button>
          </form>
        </div>
      </section>

      <section className="card summary-card">
        <h2 className="section-title">Summary</h2>
        <div className="summary-grid">
          <div>
            <span className="summary-label">Income</span>
            <strong>{formatCurrency(summary.totalIncome)}</strong>
          </div>
          <div>
            <span className="summary-label">Expense</span>
            <strong>{formatCurrency(summary.totalExpense)}</strong>
          </div>
          <div>
            <span className="summary-label">Balance</span>
            <strong>{formatCurrency(summary.balance)}</strong>
          </div>
        </div>
      </section>

      <section className="card monthly-card">
        <div className="section-row">
          <div>
            <h2 className="section-title">Monthly Summary</h2>
            <p className="section-text">Visualize income and expense trends for the selected year.</p>
          </div>
          <label className="year-field">
            Year
            <input
              id="year"
              type="number"
              min="2000"
              max="2100"
              value={yearInput}
              onChange={onChangeYearInput}
              onBlur={onApplyYear}
            />
          </label>
        </div>
        <div className="chart-wrapper">
          {monthly.data.length === 0 ? (
            <p className="empty-state">No monthly summary available yet.</p>
          ) : (
            monthly.data.map((item) => {
              const maxValue = Math.max(...monthly.data.map((row) => Math.max(row.totalIncome, row.totalExpense)), 1);
              const incomeWidth = `${Math.round((item.totalIncome / maxValue) * 100)}%`;
              const expenseWidth = `${Math.round((item.totalExpense / maxValue) * 100)}%`;

              return (
                <div key={item.month} className="bar-row">
                  <div className="bar-label">
                    <strong>{item.month}</strong>
                    <span>{formatCurrency(item.balance)}</span>
                  </div>
                  <div className="bar-track">
                    <span className="bar bar-income" style={{ width: incomeWidth }} />
                    <span className="bar bar-expense" style={{ width: expenseWidth }} />
                  </div>
                  <div className="bar-values">
                    <span>{formatCurrency(item.totalIncome)}</span>
                    <span>{formatCurrency(item.totalExpense)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="card transactions-card">
        <div className="section-row">
          <h2 className="section-title">Transactions</h2>
          <span className="transaction-count">{transactions.length} items</span>
        </div>
        {transactions.length === 0 ? (
          <p className="empty-state">No transactions yet. Add one to get started.</p>
        ) : (
          <ul className="list">
            {transactions.map((item) => (
              <li key={item.id} className={`item transaction-${item.type.toLowerCase()}`}>
                <div>
                  <div className="transaction-header">
                    <strong>{item.description}</strong>
                    <span className={badgeClass(item.type)}>{item.type}</span>
                  </div>
                  <p>
                    {item.category} • {formatCurrency(item.amount)}
                  </p>
                </div>
                <button type="button" onClick={() => onDelete(item.id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default App;
