import { test, expect } from "@playwright/test";

const API = "https://expense-api-production-bf8c.up.railway.app";
const FAKE_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwcm9maWxlX2lkIjoxLCJuYW1lIjoiU2FtaXIiLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6OTk5OTk5OTk5OX0.fake";

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_PROFILES = [
  { id: 1, name: "Samir" },
  { id: 2, name: "Papa" },
];

const MOCK_REPORT = {
  success: true,
  summary: {
    totalSpent: 1250,
    totalBillPayment: 5000,
    totalCredit: 0,
    debitCount: 3,
  },
  transactions: [
    { merchant: "Swiggy", category: "Food Delivery", type: "debit", amount: 450, bank: "HDFC", cardType: "UPI", time: "12:30" },
    { merchant: "Zepto", category: "Quick Commerce", type: "debit", amount: 390, bank: "HDFC", cardType: "UPI", time: "10:15" },
    { merchant: "Uber", category: "Cab / Ride", type: "debit", amount: 410, bank: "Kotak", cardType: "UPI", time: "09:00" },
  ],
  billPayments: [
    { merchant: "CRED Club", category: "Bill Payment", type: "debit", amount: 5000, bank: "HDFC", cardType: "UPI", time: "08:00" },
  ],
  categories: [
    { name: "Food Delivery", total: 450, count: 1, percentage: 36 },
    { name: "Quick Commerce", total: 390, count: 1, percentage: 31 },
    { name: "Cab / Ride", total: 410, count: 1, percentage: 33 },
  ],
  message: "",
};

// ── Route interceptor — call this at the start of every test ──────────────────
async function mockAPI(page, { wrongPin = false } = {}) {
  await page.route(`${API}/api/profiles`, route =>
    route.fulfill({ json: { success: true, profiles: MOCK_PROFILES } })
  );

  await page.route(`${API}/api/profiles/verify`, async route => {
    const body = JSON.parse(route.request().postData() || "{}");
    if (wrongPin || body.pin !== "2580") {
      // Use 400, not 401 — 401 triggers auth-expired redirect in apiFetch
      return route.fulfill({ status: 400, json: { success: false, message: "Incorrect PIN" } });
    }
    route.fulfill({
      json: { success: true, token: FAKE_TOKEN, profile: { id: 1, name: "Samir" } },
    });
  });

  await page.route(`${API}/api/report**`, route =>
    route.fulfill({ json: MOCK_REPORT })
  );

  await page.route(`${API}/api/override`, route =>
    route.fulfill({ json: { success: true } })
  );

  await page.route(`${API}/api/overrides`, route =>
    route.fulfill({ json: { success: true, overrides: {} } })
  );

  await page.route(`${API}/api/ai-chat`, route =>
    route.fulfill({ json: { success: true, answer: "Your top spend is Food Delivery at ₹450." } })
  );

  await page.route(`${API}/api/sms-inbox**`, route =>
    route.fulfill({ json: { success: true, entries: [] } })
  );

  await page.route(`${API}/api/insights**`, route =>
    route.fulfill({ json: {
      success: true, from: "2026-05-21", to: "2026-06-20",
      filter: { merchant: "Swiggy", category: null },
      total: 2340, count: 5,
      merchantBreakdown: [{ merchant: "Swiggy", total: 2340, count: 5 }],
      categoryBreakdown: [],
      dateBreakdown: [],
      cachedDates: ["2026-06-18"],
      missingDates: ["2026-06-19", "2026-06-20"],
    }})
  );
}

async function login(page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator("button").filter({ hasText: /SA/i }).first().click();
  await expect(page.locator("text=Enter your 4-digit PIN")).toBeVisible();
  const inputs = page.locator('input[type="password"]');
  for (const digit of ["2", "5", "8", "0"]) {
    await inputs.nth(["2","5","8","0"].indexOf(digit)).click();
    await inputs.nth(["2","5","8","0"].indexOf(digit)).pressSequentially(digit);
  }
  await expect(page.locator("text=Expense Tracker")).toBeVisible({ timeout: 8000 });
}

// ── 1. Profile select screen loads ───────────────────────────────────────────
test("shows profile select screen on first load", async ({ page }) => {
  await mockAPI(page);
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator("text=Who's tracking?")).toBeVisible();
  await expect(page.locator("button").filter({ hasText: "Samir" })).toBeVisible();
  await expect(page.locator("button").filter({ hasText: "Papa" })).toBeVisible();
});

// ── 2. Login with correct PIN ────────────────────────────────────────────────
test("login with Samir profile and correct PIN reaches dashboard", async ({ page }) => {
  await mockAPI(page);
  await login(page);
  await expect(page.locator("text=Pick a date & hit Fetch")).toBeVisible();
  await expect(page.locator("text=Samir")).toBeVisible();
});

// ── 3. Wrong PIN shows error ──────────────────────────────────────────────────
test("wrong PIN shows error and stays on PIN screen", async ({ page }) => {
  await mockAPI(page, { wrongPin: true });
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator("button").filter({ hasText: /SA/i }).first().click();
  await expect(page.locator("text=Enter your 4-digit PIN")).toBeVisible();
  const inputs = page.locator('input[type="password"]');
  for (let i = 0; i < 4; i++) {
    await inputs.nth(i).click();
    await inputs.nth(i).pressSequentially("9");
  }
  await expect(page.getByText("Incorrect PIN")).toBeVisible({ timeout: 6000 });
  // Must stay on PIN screen, not go to dashboard
  await expect(page.locator("text=Enter your 4-digit PIN")).toBeVisible();
});

// ── 4. Logout returns to profile select ──────────────────────────────────────
test("logout button clears session and returns to profile select", async ({ page }) => {
  await mockAPI(page);
  await login(page);
  await page.locator('button[title="Switch profile"]').click();
  await expect(page.locator("text=Who's tracking?")).toBeVisible();
  const token = await page.evaluate(() => localStorage.getItem("token"));
  expect(token).toBeNull();
});

// ── 5. Fetch report shows transactions ───────────────────────────────────────
test("fetching report shows transactions and summary", async ({ page }) => {
  await mockAPI(page);
  await login(page);
  await page.locator("button").filter({ hasText: "Fetch" }).click();
  await expect(page.locator("text=Total spent")).toBeVisible({ timeout: 8000 });
  await expect(page.locator("text=Swiggy")).toBeVisible();
  await expect(page.locator("text=Zepto")).toBeVisible();
  // Bills card should appear (CRED = ₹5000)
  await expect(page.getByText("Bills", { exact: true })).toBeVisible();
});

// ── 6. Bill toggle updates summary instantly without refetch ─────────────────
test("marking a transaction as Bill Payment updates summary instantly", async ({ page }) => {
  await mockAPI(page);
  await login(page);
  await page.locator("button").filter({ hasText: "Fetch" }).click();
  await expect(page.locator("text=Swiggy")).toBeVisible();

  // Capture excl. bills text before
  const exclBillsSpan = page.locator("span").filter({ hasText: /excl\. ₹/ });
  const billsBefore = await exclBillsSpan.textContent();

  // Click pencil on Swiggy (first debit row)
  const swiggyRow = page.locator(".txn-row").filter({ hasText: "Swiggy" });
  await swiggyRow.locator("button").click();
  await expect(page.locator("text=Edit Category")).toBeVisible();

  // Mark as Bill Payment and save
  await page.locator("button").filter({ hasText: "Bill Payment" }).click();
  await page.locator("button").filter({ hasText: "Save" }).click();

  // Bills amount must increase immediately — no API refetch
  await expect(async () => {
    const billsAfter = await exclBillsSpan.textContent();
    expect(billsAfter).not.toBe(billsBefore);
  }).toPass({ timeout: 3000 });
});

// ── 7. Unmarking a bill updates summary instantly ─────────────────────────────
test("unmarking a bill updates summary instantly", async ({ page }) => {
  await mockAPI(page);
  await login(page);
  await page.locator("button").filter({ hasText: "Fetch" }).click();
  await expect(page.getByText("Bills", { exact: true })).toBeVisible();

  // Capture excl. bills text while still on Home tab
  const exclBillsSpan = page.locator("span").filter({ hasText: /excl\. ₹/ });
  const billsBefore = await exclBillsSpan.textContent();

  // Switch to Activity tab — CRED Club (bill) is visible there
  await page.locator(".nav-btn").filter({ hasText: "Activity" }).click();
  await page.locator(".txn-row").filter({ hasText: "CRED Club" }).locator("button").click();
  await expect(page.locator("text=Edit Category")).toBeVisible();

  // Change to Food Delivery (unmark as bill) and save
  await page.locator("button").filter({ hasText: "Food Delivery" }).click();
  await page.locator("button").filter({ hasText: "Save" }).click();

  // Wait for modal to close, then go back to Home tab
  await expect(page.locator("text=Edit Category")).not.toBeVisible({ timeout: 3000 });
  await page.locator(".nav-btn").filter({ hasText: "Home" }).click();

  // Bills card must disappear — totalBillPayment is now 0 (CRED Club moved to regular spend)
  await expect(page.getByText("Bills", { exact: true })).not.toBeVisible({ timeout: 3000 });
});

// ── 8. Session is restored from localStorage on reload ───────────────────────
test("session is restored from localStorage on reload", async ({ page }) => {
  await mockAPI(page);
  await login(page);
  // Re-mock after reload too
  await mockAPI(page);
  await page.reload();
  await expect(page.locator("text=Expense Tracker")).toBeVisible({ timeout: 5000 });
  await expect(page.locator("text=Pick a date & hit Fetch")).toBeVisible();
});

// ── 9. Back button on PIN screen returns to profiles ─────────────────────────
test("back button on PIN screen returns to profile select", async ({ page }) => {
  await mockAPI(page);
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator("button").filter({ hasText: /SA/i }).first().click();
  await expect(page.locator("text=Enter your 4-digit PIN")).toBeVisible();
  await page.locator("text=← Back to profiles").click();
  await expect(page.locator("text=Who's tracking?")).toBeVisible();
});

// ── 10. saveOverride never called on real API during tests ───────────────────
test("category save is intercepted and never reaches real API", async ({ page }) => {
  let realApiCalled = false;

  await mockAPI(page);
  // Extra check: if somehow the mock failed and real API was called, flag it
  await page.route("**/api/override", route => {
    if (!route.request().url().includes(API)) realApiCalled = true;
    route.fulfill({ json: { success: true } });
  });

  await login(page);
  await page.locator("button").filter({ hasText: "Fetch" }).click();
  await expect(page.locator("text=Swiggy")).toBeVisible();

  await page.locator(".txn-row").filter({ hasText: "Swiggy" }).locator("button").click();
  await page.locator("button").filter({ hasText: "Bill Payment" }).click();
  await page.locator("button").filter({ hasText: "Save" }).click();

  expect(realApiCalled).toBe(false);
});

// ── 11. Refresh button triggers re-fetch (bypasses cache) ────────────────────
test("refresh button triggers a new report fetch", async ({ page }) => {
  let fetchCount = 0;
  await mockAPI(page);
  await page.route(`${API}/api/report**`, route => {
    fetchCount++;
    route.fulfill({ json: MOCK_REPORT });
  });

  await login(page);
  // First fetch via Fetch button
  await page.locator("button").filter({ hasText: "Fetch" }).click();
  await expect(page.locator("text=Total spent")).toBeVisible({ timeout: 8000 });
  expect(fetchCount).toBe(1);

  // Refresh button (icon-only, identified by title)
  await page.locator('button[title*="Refresh"]').click();
  await expect(page.locator("text=Total spent")).toBeVisible({ timeout: 8000 });
  expect(fetchCount).toBe(2);
});

// ── 12. Insights tab loads and search works ───────────────────────────────────
test("insights tab shows search form and returns results", async ({ page }) => {
  await mockAPI(page);
  await login(page);

  // Navigate to Insights tab
  await page.locator(".nav-btn").filter({ hasText: "Insights" }).click();
  await expect(page.locator("text=Spending Insights")).toBeVisible();

  // Quick chip click fills the search box
  await page.locator("button.chip").filter({ hasText: "Swiggy" }).click();
  const input = page.locator('input[placeholder*="Swiggy"]');
  await expect(input).toHaveValue("Swiggy");

  // Submit search
  await page.locator("button").filter({ hasText: "Search" }).click();

  // Should show total card and merchant breakdown
  await expect(page.locator("text=Total spent")).toBeVisible({ timeout: 6000 });
  await expect(page.locator("text=₹2,340").first()).toBeVisible();
  await expect(page.locator("text=By merchant")).toBeVisible();
  await expect(page.locator("text=missing")).toBeVisible();
});
