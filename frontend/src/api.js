const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

function toQueryString(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      params.append(key, value);
    }
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function getHealth() {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) {
    throw new Error("Health check failed");
  }
  return response.json();
}

export async function getTransactions(filters = {}) {
  const response = await fetch(`${API_BASE}/transactions${toQueryString(filters)}`);
  if (!response.ok) {
    throw new Error("Cannot fetch transactions");
  }
  return response.json();
}

export async function getSummary(filters = {}) {
  const response = await fetch(`${API_BASE}/transactions/summary${toQueryString(filters)}`);
  if (!response.ok) {
    throw new Error("Cannot fetch summary");
  }
  return response.json();
}

export async function getMonthlySummary(year) {
  const response = await fetch(`${API_BASE}/transactions/monthly${toQueryString({ year })}`);
  if (!response.ok) {
    throw new Error("Cannot fetch monthly summary");
  }
  return response.json();
}

export async function createTransaction(payload) {
  const response = await fetch(`${API_BASE}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Cannot create transaction");
  }

  return response.json();
}

export async function updateTransaction(id, payload) {
  const response = await fetch(`${API_BASE}/transactions/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Cannot update transaction");
  }

  return response.json();
}

export async function deleteTransaction(id) {
  const response = await fetch(`${API_BASE}/transactions/${id}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error("Cannot delete transaction");
  }
}
