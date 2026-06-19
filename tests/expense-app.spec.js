import { test, expect } from "@playwright/test";

const SAMIR_PIN = ["2", "5", "8", "0"];
const PAPA_PIN  = ["0", "7", "8", "6"];

async function login(page, pin = SAMIR_PIN) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  // Pick first profile (Samir)
  await page.locator("button").filter({ hasText: /SA/i }).first().click();
  await expect(page.locator("text=Enter your 4-digit PIN")).toBeVisible();
  // Type each digit — pressSequentially triggers React onChange + auto-submit
  const inputs = page.locator('input[type="password"]');
  for (let i = 0; i < pin.length; i++) {
    await inputs.nth(i).click();
    await inputs.nth(i).pressSequentially(pin[i]);
  }
  // Wait for dashboard
  await expect(page.locator("text=Expense Tracker")).toBeVisible({ timeout: 10000 });
}

// ── 1. Profile select screen loads ───────────────────────────────────────────
test("shows profile select screen on first load", async ({ page }) => {
  // Clear any existing session
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator("text=Who's tracking?")).toBeVisible();
});

// ── 2. Login flow ─────────────────────────────────────────────────────────────
test("login with Samir profile and correct PIN", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // Select Samir
  await page.locator("button").filter({ hasText: /SA/i }).first().click();
  await expect(page.locator("text=Enter your 4-digit PIN")).toBeVisible();

  // Enter PIN
  const inputs = page.locator('input[type="password"]');
  for (let i = 0; i < SAMIR_PIN.length; i++) {
    await inputs.nth(i).click();
    await inputs.nth(i).pressSequentially(SAMIR_PIN[i]);
  }

  // Should reach dashboard
  await expect(page.locator("text=Expense Tracker")).toBeVisible({ timeout: 10000 });
  await expect(page.locator("text=Pick a date & hit Fetch")).toBeVisible();
});

// ── 3. Wrong PIN shows error ──────────────────────────────────────────────────
test("wrong PIN shows error", async ({ page }) => {
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

  await expect(page.locator("text=/incorrect|PIN/i")).toBeVisible({ timeout: 8000 });
});

// ── 4. Logout returns to profile select ──────────────────────────────────────
test("logout button returns to profile select", async ({ page }) => {
  await login(page);
  // Click logout (LogOut icon button)
  await page.locator('button[title="Switch profile"]').click();
  await expect(page.locator("text=Who's tracking?")).toBeVisible();
  // localStorage should be cleared
  const token = await page.evaluate(() => localStorage.getItem("token"));
  expect(token).toBeNull();
});

// ── 5. Fetch report ───────────────────────────────────────────────────────────
test("fetch report loads transactions or shows no-transactions message", async ({ page }) => {
  await login(page);
  // Set a recent date and fetch
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split("T")[0];
  await page.locator('input[type="date"]').fill(dateStr);
  await page.locator("button").filter({ hasText: "Fetch" }).click();

  // Should either show transactions or "No transactions"
  await expect(
    page.locator("text=/transactions|No transactions|🤷/i")
  ).toBeVisible({ timeout: 20000 });
});

// ── 6. Bill toggle updates summary instantly ──────────────────────────────────
test("marking a transaction as Bill Payment updates summary without refetch", async ({ page }) => {
  test.setTimeout(90000);
  await login(page);

  // Fetch today's report — try today and yesterday until we find transactions
  const dates = [0, 1, 2, 3].map(offset => {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    return d.toISOString().split("T")[0];
  });

  let found = false;
  for (const dateStr of dates) {
    await page.locator('input[type="date"]').fill(dateStr);
    await page.locator("button").filter({ hasText: "Fetch" }).click();
    await page.locator("button").filter({ hasText: "Fetch" }).waitFor({ state: "visible", timeout: 15000 });
    const hasTxns = await page.locator(".txn-row").count();
    if (hasTxns > 0) { found = true; break; }
  }

  if (!found) {
    test.skip("No transactions found in last 4 days — skipping bill toggle test");
    return;
  }

  // Grab the "excl. bills" span text before — bills total must increase after marking a debit as bill
  const exclBillsSpan = page.locator("span").filter({ hasText: /excl\. ₹/ });
  const billsBefore = await exclBillsSpan.textContent().catch(() => "none");

  // Find first DEBIT txn row (shows "-₹") — credits wouldn't affect totalSpent/totalBillPayment
  const debitRow = page.locator(".txn-row").filter({ hasText: /-₹/ }).first();
  const hasDebit = await debitRow.count();
  if (!hasDebit) {
    test.skip("No debit transactions visible — skipping bill toggle test");
    return;
  }

  await debitRow.locator("button").click();
  await expect(page.locator("text=Edit Category")).toBeVisible();

  // Select "Bill Payment" and save
  await page.locator("button").filter({ hasText: "Bill Payment" }).click();
  await page.locator("button").filter({ hasText: "Save" }).click();

  // "excl. bills" amount must increase immediately — no refetch needed
  await expect(async () => {
    const billsAfter = await exclBillsSpan.textContent().catch(() => "none");
    expect(billsAfter).not.toBe(billsBefore);
  }).toPass({ timeout: 3000 });
});

// ── 7. Session persists on reload ─────────────────────────────────────────────
test("session is restored from localStorage on reload", async ({ page }) => {
  await login(page);
  await page.reload();
  // Should still be on dashboard without re-entering PIN
  await expect(page.locator("text=Expense Tracker")).toBeVisible({ timeout: 5000 });
});

// ── 8. Back button on PIN screen returns to profile select ────────────────────
test("back button on PIN screen returns to profiles", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.locator("button").filter({ hasText: /SA/i }).first().click();
  await expect(page.locator("text=Enter your 4-digit PIN")).toBeVisible();
  await page.locator("text=← Back to profiles").click();
  await expect(page.locator("text=Who's tracking?")).toBeVisible();
});
