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
      <div className={`floating-health ${health === "ok" ? "health-ok" : "health-down"}`}>
        API Status: {health === "ok" ? "Online" : health === "down" ? "Offline" : "Checking"}
      </div>

      <header className="topbar">
        <div>
          <p className="eyebrow">Personal Finance Workspace</p>
          <h1>Quan ly chi tieu</h1>
        </div>
        <div className="topbar-actions">
          <div className="top-pill">{transactions.length} giao dich</div>
          <div className="top-pill">{monthly.year}</div>
        </div>
      </header>

      <section className="hero">
        <div className="dashboard-cards">
          <article className="stat-card income">
            <span>Tong thu</span>
            <strong>{formatCurrency(summary.totalIncome)}</strong>
          </article>
          <article className="stat-card expense">
            <span>Tong chi</span>
            <strong>{formatCurrency(summary.totalExpense)}</strong>
          </article>
          <article className="stat-card balance">
            <span>So du</span>
            <strong>{formatCurrency(summary.balance)}</strong>
          </article>
        </div>
      </section>

      {error ? <p className="error">{error}</p> : null}

      <section className="workspace-grid">
        <div className="workspace-left">
          <section className="card card-split">
            <div className="card-pane">
              <h2 className="section-title">Them giao dich</h2>
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
                  placeholder="So tien"
                  value={form.amount}
                  onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                  required
                />
                <input
                  type="text"
                  placeholder="Danh muc (VD: AN_UONG)"
                  value={form.category}
                  onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                  required
                />
                <input
                  type="text"
                  placeholder="Mo ta"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  required
                />
                <button type="submit">Them giao dich</button>
              </form>
            </div>

            <div className="card-pane">
              <h2 className="section-title">Bo loc</h2>
              <form className="filter-form" onSubmit={onApplyFilters}>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
                >
                  <option value="ALL">Tat ca loai</option>
                  <option value="INCOME">Thu</option>
                  <option value="EXPENSE">Chi</option>
                </select>
                <input
                  type="text"
                  placeholder="Danh muc"
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
                <button type="submit">Ap dung loc</button>
                <button type="button" className="secondary" onClick={onResetFilters}>
                  Dat lai
                </button>
              </form>
            </div>
          </section>

          <section className="card transactions-card">
            <div className="section-row">
              <h2 className="section-title">Danh sach giao dich</h2>
              <span className="transaction-count">{transactions.length} muc</span>
            </div>
            <div className="transaction-meta">
              <span>Thu: {incomeCount}</span>
              <span>Chi: {expenseCount}</span>
            </div>
            {transactions.length === 0 ? (
              <p className="empty-state">Chua co giao dich nao. Hay them giao dich dau tien.</p>
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
                      Xoa
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="workspace-right">
          <section className="card summary-card">
            <h2 className="section-title">Tong quan</h2>
            <div className="summary-grid">
              <div>
                <span className="summary-label">Thu</span>
                <strong>{formatCurrency(summary.totalIncome)}</strong>
              </div>
              <div>
                <span className="summary-label">Chi</span>
                <strong>{formatCurrency(summary.totalExpense)}</strong>
              </div>
              <div>
                <span className="summary-label">So du</span>
                <strong className={sectionAmountClass(summary.balance)}>{formatCurrency(summary.balance)}</strong>
              </div>
            </div>
          </section>

          <section className="card monthly-card">
            <div className="section-row">
              <div>
                <h2 className="section-title">Thong ke theo thang</h2>
              </div>
              <div className="year-controls">
                <label className="year-field" htmlFor="year">
                  Nam
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
                  Xem
                </button>
              </div>
            </div>
            <div className="chart-wrapper">
              {monthly.data.length === 0 ? (
                <p className="empty-state">Chua co du lieu thong ke theo thang.</p>
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
