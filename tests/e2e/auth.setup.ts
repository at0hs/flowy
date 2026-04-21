import { test as setup } from "@playwright/test";
import path from "path";
import { resetDb } from "./helpers/db";

const AUTH_FILE = path.join(__dirname, "../../playwright/.auth/user.json");

setup("認証状態を保存", async ({ page }) => {
  resetDb();

  await page.goto("/login");

  await page.getByLabel("メールアドレス").fill("test@example.com");
  await page.getByLabel("パスワード").fill("password123");
  await page.getByRole("button", { name: "ログイン" }).click();

  await page.waitForURL("/projects");

  await page.context().storageState({ path: AUTH_FILE });
});
