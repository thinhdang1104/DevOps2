const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

export async function getHealth() {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) {
    throw new Error("Health check failed");
  }
  return response.json();
}

export async function getTransactions() {
  const response = await fetch(`${API_BASE}/transactions`);
  if (!response.ok) {
    throw new Error("Cannot fetch transactions");
  }
  return response.json();
}

export async function getSummary() {
  const response = await fetch(`${API_BASE}/transactions/summary`);
  if (!response.ok) {
    throw new Error("Cannot fetch summary");
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

export async function deleteTransaction(id) {
  const response = await fetch(`${API_BASE}/transactions/${id}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    throw new Error("Cannot delete transaction");
  }
}
