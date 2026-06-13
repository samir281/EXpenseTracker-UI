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
      throw new Error("Cannot connect to server. Possible reasons:\n• Your network/ISP might be blocking the server\n• Try switching between WiFi and mobile data\n• Try a different browser (Chrome recommended)");
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
  if (!res.ok || !json.success) {
    throw new Error(json.message || "AI chat failed");
  }
  return json.answer;
}

export async function healthCheck() {
  const res = await fetch(`${API_BASE}/api/health`);
  return res.json();
}