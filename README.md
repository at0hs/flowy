# Flowy

Jira風のチケット管理Webアプリ。Next.js App Router + Supabase (PostgreSQL + Auth) で構成。

## 開発環境の起動

```bash
npm run dev        # Next.js dev server (localhost:3000)
supabase start     # ローカルSupabase (Docker必須)
```

## コマンド

```bash
npm run build      # プロダクションビルド
npm run lint       # ESLint

supabase stop              # Supabase停止
supabase db reset          # DBリセット＆マイグレーション再実行
supabase migration new <name>  # マイグレーションファイル作成
```
