const API_BASE = "https://expense-api-production-bf8c.up.railway.app";

export async function fetchReport(date) {
  try {
    const res = await fetch(`${API_BASE}/api/report?date=${date}`);
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || `Server error (${res.status})`);
    }
    return json;
  } catch (err) {
    if (err.name === "TypeError" && err.message === "Failed to fetch") {
      throw new Error("Cannot connect to server.\n• Check internet connection\n• Try a different browser");
    }
    throw err;
  }
}

export async function askAI(question, transactions) {
  const res = await fetch(`${API_BASE}/api/ai-chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, transactions }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || "AI chat failed");
  return json.answer;
}

export async function saveOverride(merchant, category) {
  const res = await fetch(`${API_BASE}/api/override`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ merchant, category }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || "Failed to save");
  return json;
}

export async function getOverrides() {
  const res = await fetch(`${API_BASE}/api/overrides`);
  const json = await res.json();
  return json.overrides || {};
}