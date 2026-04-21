import { test, expect } from "@playwright/test";

test("S1: プロジェクト作成 → チケット一覧表示", async ({ page }) => {
  const projectName = `S1テストプロジェクト_${Date.now()}`;

  // プロジェクト一覧へ
  await page.goto("/projects");
  await expect(page).toHaveURL("/projects");

  // 「+ 新規作成」ボタンをクリック
  await page.getByRole("link", { name: "+ 新規作成" }).click();
  await page.waitForURL("/projects/new");

  // プロジェクト名を入力して作成
  await page.getByLabel("プロジェクト名 *").fill(projectName);
  await page.getByRole("button", { name: "作成" }).click();

  // 作成後はプロジェクト一覧に戻る
  await page.waitForURL("/projects");

  // サイドバーに作成したプロジェクト名が表示される
  const sidebarProjectButton = page.getByRole("button", { name: projectName });
  await expect(sidebarProjectButton).toBeVisible();

  // サイドバーのプロジェクト名をクリックしてアコーディオンを展開
  await sidebarProjectButton.click();

  // 「チケット一覧」リンクが表示される
  const ticketsLink = page.getByRole("link", { name: "チケット一覧" }).first();
  await expect(ticketsLink).toBeVisible();

  // チケット一覧リンクをクリック → チケット一覧画面に遷移
  await ticketsLink.click();
  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]+$/);

  // チケット一覧画面にプロジェクト名が表示される
  await expect(page.getByRole("heading", { name: projectName })).toBeVisible();
});
