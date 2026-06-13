const API_BASE = "https://expense-api-production-bf8c.up.railway.app";

export async function fetchReport(date) {
  const res = await fetch(`${API_BASE}/api/report?date=${date}`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || `Server error (${res.status})`);
  }
  return json;
}

export async function askAI(question, transactions) {
  const res = await fetch(`${API_BASE}/api/ai-chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, transactions }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "AI chat failed");
  }
  return json.answer;
}

export async function healthCheck() {
  const res = await fetch(`${API_BASE}/api/health`);
  return res.json();
}
