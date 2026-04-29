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

  // 作成後はプロジェクトホームにリダイレクト
  await page.waitForURL(/\/projects\/[0-9a-f-]+$/);

  // プロジェクトホームにプロジェクト名が表示される
  await expect(page.getByRole("heading", { name: projectName })).toBeVisible();
});
