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

function sectionAmountClass(value) {
  if (value > 0) return "amount-positive";
  if (value < 0) return "amount-negative";
  return "amount-neutral";
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

  const incomeCount = transactions.filter((item) => item.type === "INCOME").length;
  const expenseCount = transactions.filter((item) => item.type === "EXPENSE").length;
  const totalFlow = summary.totalIncome + summary.totalExpense;
  const incomeShare = totalFlow > 0 ? Math.round((summary.totalIncome / totalFlow) * 100) : 0;
  const expenseShare = totalFlow > 0 ? Math.round((summary.totalExpense / totalFlow) * 100) : 0;

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
      setError("N\u0103m ph\u1ea3i t\u1eeb 2000 \u0111\u1ebfn 2100");
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
      <div className={`floating-health ${health === "ok" ? "health-ok" : "health-down"}`}>
        API Status: {health === "ok" ? "Online" : health === "down" ? "Offline" : "Checking"}
      </div>

      <header className="topbar">
        <div>
          <p className="eyebrow">{"B\u1ea3ng \u0111i\u1ec1u khi\u1ec3n t\u00e0i ch\u00ednh c\u00e1 nh\u00e2n"}</p>
          <h1>{"Qu\u1ea3n l\u00fd chi ti\u00eau"}</h1>
        </div>
        <div className="topbar-actions">
          <div className="top-pill">{transactions.length} {"giao d\u1ecbch"}</div>
          <div className="top-pill">{monthly.year}</div>
        </div>
      </header>

      <section className="hero">
        <div className="dashboard-cards">
          <article className="stat-card income">
            <span>{"T\u1ed5ng thu"}</span>
            <strong>{formatCurrency(summary.totalIncome)}</strong>
          </article>
          <article className="stat-card expense">
            <span>{"T\u1ed5ng chi"}</span>
            <strong>{formatCurrency(summary.totalExpense)}</strong>
          </article>
          <article className="stat-card balance">
            <span>{"S\u1ed1 d\u01b0"}</span>
            <strong>{formatCurrency(summary.balance)}</strong>
          </article>
        </div>
      </section>

      {error ? <p className="error">{error}</p> : null}

      <section className="workspace-grid">
        <div className="workspace-left">
          <section className="card card-split">
            <div className="card-pane">
              <h2 className="section-title">{"Th\u00eam giao d\u1ecbch"}</h2>
              <form className="form" onSubmit={onSubmit}>
                <select
                  value={form.type}
                  onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                >
                  <option value="INCOME">Thu</option>
                  <option value="EXPENSE">Chi</option>
                </select>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder={"S\u1ed1 ti\u1ec1n"}
                  value={form.amount}
                  onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                  required
                />
                <input
                  type="text"
                  placeholder={"Danh m\u1ee5c (VD: AN_UONG)"}
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                  required
                />
                <input
                  type="text"
                  placeholder={"M\u00f4 t\u1ea3"}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  required
                />
                <button type="submit">{"Th\u00eam giao d\u1ecbch"}</button>
              </form>
            </div>

            <div className="card-pane">
              <h2 className="section-title">{"B\u1ed9 l\u1ecdc"}</h2>
              <form className="filter-form" onSubmit={onApplyFilters}>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
                >
                  <option value="ALL">{"T\u1ea5t c\u1ea3 lo\u1ea1i"}</option>
                  <option value="INCOME">Thu</option>
                  <option value="EXPENSE">Chi</option>
                </select>
                <input
                  type="text"
                  placeholder={"Danh m\u1ee5c"}
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
                <button type="submit">{"\u00c1p d\u1ee5ng l\u1ecdc"}</button>
                <button type="button" className="secondary" onClick={onResetFilters}>
                  {"\u0110\u1eb7t l\u1ea1i"}
                </button>
              </form>
            </div>
          </section>

          <section className="card transactions-card">
            <div className="section-row">
              <h2 className="section-title">{"Danh s\u00e1ch giao d\u1ecbch"}</h2>
              <span className="transaction-count">{transactions.length} {"m\u1ee5c"}</span>
            </div>
            <div className="transaction-meta">
              <span>Thu: {incomeCount}</span>
              <span>Chi: {expenseCount}</span>
            </div>
            {transactions.length === 0 ? (
              <p className="empty-state">{"Ch\u01b0a c\u00f3 giao d\u1ecbch n\u00e0o. H\u00e3y th\u00eam giao d\u1ecbch \u0111\u1ea7u ti\u00ean."}</p>
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
                      {"X\u00f3a"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="workspace-right">
          <section className="card summary-card">
            <h2 className="section-title">{"T\u1ed5ng quan"}</h2>
            <div className="summary-grid">
              <div className="summary-cell summary-income">
                <span className="summary-label">Thu</span>
                <strong>{formatCurrency(summary.totalIncome)}</strong>
                <small className="summary-hint">{incomeShare}% {"d\u00f2ng ti\u1ec1n"}</small>
                <span className="summary-meter">
                  <span style={{ width: `${incomeShare}%` }} />
                </span>
              </div>
              <div className="summary-cell summary-expense">
                <span className="summary-label">Chi</span>
                <strong>{formatCurrency(summary.totalExpense)}</strong>
                <small className="summary-hint">{expenseShare}% {"d\u00f2ng ti\u1ec1n"}</small>
                <span className="summary-meter">
                  <span style={{ width: `${expenseShare}%` }} />
                </span>
              </div>
              <div className="summary-cell summary-balance">
                <span className="summary-label">{"S\u1ed1 d\u01b0"}</span>
                <strong className={sectionAmountClass(summary.balance)}>{formatCurrency(summary.balance)}</strong>
                <small className="summary-hint">{"Ch\u00eanh l\u1ec7ch hi\u1ec7n t\u1ea1i"}</small>
              </div>
            </div>
          </section>

          <section className="card monthly-card">
            <div className="section-row">
              <div>
                <h2 className="section-title">{"Th\u1ed1ng k\u00ea theo th\u00e1ng"}</h2>
              </div>
              <div className="year-controls">
                <label className="year-field" htmlFor="year">
                  {"N\u0103m"}
                </label>
                <input
                  id="year"
                  className="year-input"
                  type="number"
                  min="2000"
                  max="2100"
                  value={yearInput}
                  onChange={onChangeYearInput}
                  onBlur={onApplyYear}
                />
                <button type="button" className="year-apply" onClick={onApplyYear}>
                  {"Xem"}
                </button>
              </div>
            </div>
            <div className="chart-wrapper">
              {monthly.data.length === 0 ? (
                <p className="empty-state">{"Ch\u01b0a c\u00f3 d\u1eef li\u1ec7u th\u1ed1ng k\u00ea theo th\u00e1ng."}</p>
              ) : (
                monthly.data.map((item) => {
                  const maxValue = Math.max(
                    ...monthly.data.map((row) => Math.max(row.totalIncome, row.totalExpense)),
                    1
                  );
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
        </aside>
      </section>
    </main>
  );
}

export default App;
