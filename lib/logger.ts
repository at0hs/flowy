// ロガーユーティリティ
// 開発環境: すべてのレベルを出力
// 本番環境(サーバー): ERROR のみ出力
// 本番環境(クライアント): 何も出力しない

const isDev = process.env.NODE_ENV === "development";
const isClient = typeof window !== "undefined";

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDev) console.debug("[debug]", ...args);
  },
  info: (...args: unknown[]) => {
    if (isDev) console.info("[info]", ...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn("[warn]", ...args);
  },
  error: (...args: unknown[]) => {
    // サーバー: 開発・本番ともに出力
    // クライアント: 開発のみ出力
    if (!isClient || isDev) console.error("[error]", ...args);
  },
};
