# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 参照ドキュメント
場合に応じて、以下のドキュメントを参照してください。
- 要件定義: private-repo/requirements.md
- アーキテクチャ、ディレクトリ構成、設計方針、環境構成、: private-repo/architecture.md
- データベース設計書: private-repo/database_design.md
- 画面設計: private-repo/screen_design.md
- コーディング規約: .prettierrc

## Commands

```bash
# Development
npm run dev          # Start Next.js dev server (localhost:3111)
npm run build        # Production build
npm run lint         # Run ESLint

# Supabase local development (requires Docker)
npm run sb:start     # Start local Supabase (DB, Auth, Studio)
npm run sb:stop      # Stop local Supabase
npm run sb:reset     # Reset DB and re-run all migrations
npm run sb:migration-up  # Run pending migrations
supabase migration new <name>   # Create a new migration file

# Type generation
npm run gen:types    # Generate TypeScript types from Supabase schema
```

## Architecture

**Flowy** はJira風のチケット管理Webアプリ。Next.js App Router + Supabase (PostgreSQL + Auth) で構成される。

### Directory layout

```
app/
├── (auth)/          # 認証ページ (login, signup) + actions.ts (signOut)
├── (app)/           # アプリ本体（認証ガード済み）
│   ├── layout.tsx   # サイドバー、Toaster
│   ├── projects/
│   │   ├── actions.ts            # プロジェクト・メンバー関連 Server Actions
│   │   ├── new/
│   │   └── [id]/
│   │       ├── actions.ts        # チケット関連 Server Actions
│   │       ├── edit/
│   │       ├── members/
│   │       └── tickets/[ticketId]/
│   └── settings/
components/
├── ui/              # shadcn/ui コンポーネント (radix-nova スタイル)
├── sidebar/
├── projects/
├── tickets/
└── members/
lib/
├── supabase/
│   ├── client.ts    # ブラウザ用クライアント (createBrowserClient)
│   ├── server.ts    # サーバー用クライアント (createServerClient + cookies())
│   ├── projects.ts  # プロジェクト・プロフィール取得関数
│   └── members.ts   # メンバー管理関数
├── utils.ts         # cn() 関数
├── logger.ts        # 環境別ロギングユーティリティ
└── validations.ts   # Zod バリデーションスキーマ
types/
├── database.types.ts  # supabase gen types で自動生成
└── index.ts           # 型エクスポート (Profile, Project, Ticket 等)
proxy.ts             # 認証ミドルウェア (Next.js middleware)
supabase/
└── migrations/      # タイムスタンプ付きSQLマイグレーション
```

### Key patterns

- **Server Components優先**: デフォルトはServer Component。インタラクションが必要な箇所のみ `'use client'` を付ける
- **Supabaseクライアントの使い分け**: Server Components・Route Handlers では `lib/supabase/server.ts`、Client Components では `lib/supabase/client.ts` を使う
- **Server Actions**: データ変更は `'use server'` の actions.ts で実装。変更後は `revalidatePath()` でキャッシュ削除し `redirect()` でナビゲーション
- **バリデーション**: `lib/validations.ts` の Zod スキーマでフォームデータを検証
- **状態管理**: グローバル状態ライブラリ未導入
- **エラーハンドリング**: ページレベルは `error.tsx`、APIエラーは `sonner` のトースト通知
- **ロギング**: `lib/logger.ts` 経由で環境別ログ出力

### UI / Styling

- **shadcn/ui** (radix-nova スタイル) - コンポーネントはプロジェクト内にコピーされる (`components/ui/`)
- **Tailwind CSS v4** - CSS variablesでテーマ管理、OKLCHカラースペース使用
- **sonner** - トースト通知ライブラリ
- **next-themes** - テーマ（ダーク/ライト）管理
- `cn()` ユーティリティ (`lib/utils.ts`) で Tailwind クラスを結合する

## Database

### Schema overview

| Table | Description |
|-------|-------------|
| `profiles` | ユーザープロフィール (auth.usersと1:1, `username`, `email`) |
| `projects` | プロジェクト (`owner_id` で RLS 制御) |
| `project_members` | プロジェクトメンバー (`role: 'owner' \| 'member'`) |
| `tickets` | チケット (`status: todo/in_progress/done`, `priority: low/medium/high/urgent`, `assignee_id`) |

- 全テーブルでRLS (Row Level Security) 有効。`project_members` をベースに多層的なポリシーを実装
- サインアップ時にDBトリガーで `profiles` レコードを自動生成（`raw_user_meta_data` から `username` を取得）
- マイグレーションは `supabase/migrations/` にタイムスタンプ付きSQLで管理
- `types/database.types.ts` は `npm run gen:types` で再生成

### Auth flow

- `proxy.ts` がミドルウェアとして動作：未認証ユーザーを `/login` へ、認証済みユーザーが `/` `/login` `/signup` アクセス時は `/projects` へリダイレクト

## Code Style

Prettierの設定:
- `singleQuote: false`, `semi: true`, `printWidth: 100`
- `trailingComma: "es5"`, `endOfLine: "lf"`

TypeScriptはstrict modeで動作。パスエイリアス `@/*` でプロジェクトルートを参照。
