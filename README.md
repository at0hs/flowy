# Flowy

Jira風のチケット管理Webアプリ。Next.js App Router + Supabase (PostgreSQL + Auth) で構成。

## セットアップ

```bash
npm install
npm run dev        # localhost:3000 で起動
supabase start     # ローカルSupabase (Docker必須)
```

## コマンド

```bash
# 開発
npm run dev        # Next.js dev server
npm run build      # プロダクションビルド
npm run lint       # ESLint

# Supabase
supabase start
supabase stop
supabase db reset
supabase migration new <name>
```

## ディレクトリ構成

```
app/
├── (auth)/        # 認証ページ (login, signup)
└── (app)/         # アプリ本体（認証ガード済み）
components/        # UI コンポーネント
lib/               # ユーティリティ
└── supabase/      # Supabase クライアント
types/             # 型定義
supabase/
└── migrations/    # DB マイグレーション
```

## 技術スタック

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS v4
- **UI**: shadcn/ui (Radix Nova)
- **Backend**: Supabase (PostgreSQL, Auth)
- **Styling**: Tailwind CSS + CSS Variables (OKLCH)
