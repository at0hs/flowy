import { test, expect } from "@playwright/test";

const PROJECT_ID = "00000000-0000-0000-0000-000000000002";
const TICKET_ID = "00000000-0000-0000-0000-000000000003";
const TICKET_URL = `/projects/${PROJECT_ID}/tickets/${TICKET_ID}`;

test("S4: コメント投稿", async ({ page }) => {
  const commentText = `S4テストコメント_${Date.now()}`;

  await page.goto(TICKET_URL);
  await expect(page).toHaveURL(TICKET_URL);

  // 投稿フォームのプレースホルダー領域をクリックしてエディタを開く
  await page.getByText("コメントを入力").click();

  // Tiptap エディタ（contenteditable）が表示される
  const editor = page.locator('[contenteditable="true"]').first();
  await expect(editor).toBeVisible();

  // コメントを入力
  await editor.click();
  await page.keyboard.type(commentText);

  // 「投稿」ボタンをクリック
  await page.getByRole("button", { name: "投稿" }).click();

  // 投稿後にエディタが閉じることを確認
  await expect(page.getByRole("button", { name: "投稿" })).not.toBeVisible();

  // 投稿したコメントが一覧に表示される
  await expect(page.getByText(commentText)).toBeVisible();

  // ユーザー名が正しい（シードデータの username）
  await expect(page.getByText("test-user")).toBeVisible();
});
