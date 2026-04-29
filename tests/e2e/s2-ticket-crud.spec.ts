import { test, expect } from "@playwright/test";

const PROJECT_ID = "00000000-0000-0000-0000-000000000002";

test("S2: チケット作成 → 詳細表示", async ({ page }) => {
  const ticketTitle = `S2テストチケット_${Date.now()}`;

  // E2E Test Project のチケット一覧へ
  await page.goto(`/projects/${PROJECT_ID}`);
  await expect(page).toHaveURL(`/projects/${PROJECT_ID}`);

  // 「チケット作成」ボタンをクリック
  await page.getByRole("button", { name: "チケット作成" }).click();

  // モーダルが開いたことを確認
  await expect(page.getByRole("dialog")).toBeVisible();

  // タイトルを入力
  await page.getByLabel("タイトル *").fill(ticketTitle);

  // ステータスを「進行中」に変更（デフォルト: TODO）
  await page
    .getByRole("combobox")
    .filter({ hasText: /^TODO$/i })
    .click();
  await page.getByRole("option", { name: "進行中" }).click();

  // 優先度を「高」に変更（デフォルト: 中）
  await page.getByRole("combobox").filter({ hasText: /^中$/ }).click();
  await page.getByRole("option", { name: "高" }).click();

  // 「作成」ボタンをクリック
  await page.getByRole("button", { name: "作成" }).click();

  // モーダルが閉じることを確認
  await expect(page.getByRole("dialog")).not.toBeVisible();

  // 作成したチケットが一覧に表示される
  await expect(page.getByRole("link", { name: ticketTitle })).toBeVisible();

  // チケット行をクリック → 詳細画面に遷移
  await page.getByRole("link", { name: ticketTitle }).click();
  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]+\/tickets\/[0-9a-f-]+$/);

  // 詳細画面にタイトルが表示される
  await expect(page.getByRole("heading", { name: ticketTitle })).toBeVisible();

  // メニューボタンをクリック → DropdownMenu を開く
  await page.getByRole("button", { name: "メニューを開く" }).click();
  await expect(page.getByRole("menuitem", { name: "削除" })).toBeVisible();

  // 「削除」メニュー項目をクリック → 確認ダイアログが開く
  await page.getByRole("menuitem", { name: "削除" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("チケットを削除しますか？")).toBeVisible();

  // 確認ダイアログで「削除」をクリック
  await page.getByRole("button", { name: "削除" }).click();

  // 一覧ページに戻る
  await expect(page).toHaveURL(`/projects/${PROJECT_ID}`);

  // 削除したチケットが一覧から消えていることを確認
  await expect(page.getByRole("link", { name: ticketTitle })).not.toBeVisible();
});
