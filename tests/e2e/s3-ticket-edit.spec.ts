import { test, expect } from "@playwright/test";

const PROJECT_ID = "00000000-0000-0000-0000-000000000002";
const TICKET_ID = "00000000-0000-0000-0000-000000000003";
const TICKET_URL = `/projects/${PROJECT_ID}/tickets/${TICKET_ID}`;

test("S3: チケットのインライン編集（タイトル・ステータス変更）", async ({ page }) => {
  await page.goto(TICKET_URL);
  await expect(page).toHaveURL(TICKET_URL);

  // --- タイトルのインライン編集 ---

  // 初期タイトルが h1 として表示されている
  const titleHeading = page.getByRole("heading", { name: "E2E Test Ticket" });
  await expect(titleHeading).toBeVisible();

  // h1 をクリック → 入力フィールドに変わる
  await titleHeading.click();
  const titleInput = page.getByRole("textbox");
  await expect(titleInput).toBeVisible();
  await expect(titleInput).toBeFocused();

  // タイトルを変更して Enter
  const newTitle = "S3編集済みタイトル";
  await titleInput.fill(newTitle);
  await titleInput.press("Enter");

  // 変更後のタイトルが h1 として表示される（入力フィールドが消える）
  await expect(page.getByRole("heading", { name: newTitle })).toBeVisible();
  await expect(titleInput).not.toBeVisible();

  // --- ステータスのインライン編集 ---

  // 初期ステータスが「TODO」
  const statusTrigger = page.getByRole("combobox").filter({ hasText: /^TODO$/i });
  await expect(statusTrigger).toBeVisible();

  // セレクトを「進行中」に変更
  await statusTrigger.click();
  await page.getByRole("option", { name: "進行中" }).click();

  // 変更後のステータスが表示される
  await expect(page.getByRole("combobox").filter({ hasText: /^進行中$/ })).toBeVisible();
});
