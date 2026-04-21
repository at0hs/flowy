import { execSync } from "child_process";
import path from "path";

const ROOT = path.resolve(__dirname, "../../..");

export function resetDb(): void {
  execSync("supabase db reset", {
    cwd: ROOT,
    stdio: "inherit",
  });

  // コンテナ再起動完了まで待機（最大30秒）
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      execSync("supabase status", { cwd: ROOT, stdio: "pipe" });
      return;
    } catch {
      execSync("sleep 1", { stdio: "ignore" });
    }
  }
  throw new Error("Supabase did not become ready after db reset");
}
