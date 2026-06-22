const API_BASE = import.meta.env.VITE_API_BASE ?? "https://expense-api-production-bf8c.up.railway.app";

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch (err) {
    if (err.name === "TypeError") {
      throw new Error("Cannot connect to server.\n• Check internet connection\n• Try a different browser");
    }
    throw err;
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(`Server error (${res.status}): received HTML instead of JSON`);
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server error (${res.status}): invalid JSON response`);
  }

  if (res.status === 401) {
    localStorage.clear();
    window.dispatchEvent(new Event("auth-expired"));
    return null;
  }

  return { res, data };
}

export async function fetchProfiles() {
  const result = await apiFetch("/api/profiles");
  if (!result) return [];
  return result.data.profiles || [];
}

export async function verifyPin(profileId, pin) {
  const result = await apiFetch("/api/profiles/verify", {
    method: "POST",
    body: JSON.stringify({ profile_id: profileId, pin }),
  });
  if (!result) throw new Error("Request failed");
  const { res, data } = result;
  if (!res.ok || !data.success) throw new Error(data.message || "Incorrect PIN");
  return data;
}

export async function fetchReport(date, refresh = false) {
  const url = `/api/report?date=${date}${refresh ? "&refresh=true" : ""}`;
  const result = await apiFetch(url);
  if (!result) throw new Error("Login required");
  const { res, data } = result;
  if (!res.ok || !data.success) throw new Error(data.message || `Server error (${res.status})`);
  return data;
}

export async function askAI(question, transactions) {
  const result = await apiFetch("/api/ai-chat", {
    method: "POST",
    body: JSON.stringify({ question, transactions }),
  });
  if (!result) throw new Error("Login required");
  const { res, data } = result;
  if (!res.ok || !data.success) throw new Error(data.message || "AI chat failed");
  return data.answer;
}

export async function saveOverride(merchant, category) {
  const result = await apiFetch("/api/override", {
    method: "POST",
    body: JSON.stringify({ merchant, category }),
  });
  if (!result) throw new Error("Login required");
  const { res, data } = result;
  if (!res.ok || !data.success) throw new Error(data.message || "Failed to save");
  return data;
}

export async function getOverrides() {
  const result = await apiFetch("/api/overrides");
  if (!result) return {};
  return result.data.overrides || {};
}

export async function submitSMS(text, date) {
  const result = await apiFetch("/api/sms-inbox", {
    method: "POST",
    body: JSON.stringify({ text, date }),
  });
  if (!result) throw new Error("Login required");
  const { res, data } = result;
  if (!res.ok || !data.success) throw new Error(data.message || "Failed to save SMS");
  return data;
}

export async function fetchSMSInbox(date) {
  const result = await apiFetch(`/api/sms-inbox?date=${date}`);
  if (!result) return [];
  return result.data.entries || [];
}

export async function deleteSMSEntry(id) {
  const result = await apiFetch(`/api/sms-inbox/${id}`, { method: "DELETE" });
  if (!result) throw new Error("Login required");
  return result.data;
}

export async function fetchMonthly(month) {
  const result = await apiFetch(`/api/monthly?month=${month}`);
  if (!result) throw new Error("Login required");
  const { res, data } = result;
  if (!res.ok || !data.success) throw new Error(data.message || "Failed to load monthly data");
  return data;
}

export async function fetchBudget() {
  const result = await apiFetch("/api/budget");
  if (!result) throw new Error("Login required");
  const { res, data } = result;
  if (!res.ok || !data.success) throw new Error(data.message || "Failed to load budget");
  return data;
}

export async function saveBudget(budget) {
  const result = await apiFetch("/api/budget", {
    method: "POST",
    body: JSON.stringify({ budget }),
  });
  if (!result) throw new Error("Login required");
  const { res, data } = result;
  if (!res.ok || !data.success) throw new Error(data.message || "Failed to save budget");
  return data;
}

export async function fetchInsights({ from, to, merchant, category }) {
  const params = new URLSearchParams({ from, to });
  if (merchant) params.set("merchant", merchant);
  if (category) params.set("category", category);
  const result = await apiFetch(`/api/insights?${params}`);
  if (!result) throw new Error("Login required");
  const { res, data } = result;
  if (!res.ok || !data.success) throw new Error(data.message || "Insights failed");
  return data;
}
