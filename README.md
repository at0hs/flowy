# Flowy

チケット管理Webアプリ。チケットのカンバン/ガント表示、コメント、通知、AIアシスト、Slack連携などを備える。Next.js App Router + Supabase (PostgreSQL + Auth + Storage) で構成。

## 主な機能

- チケット管理(テーブル/カンバン/ガントビューの切替、サブタスク、添付ファイル)
- コメント(返信・編集・削除・リアクション)
- 通知(担当者アサイン・ウォッチ中チケットの更新・期限切れをメール/アプリ内で通知)
- プロジェクト・メンバー・招待管理
- AIアシスト(要約・サブタスク提案、Gemini / OpenRouter対応)
- Slack Webhook連携

## セットアップ

```bash
npm install
npm run dev        # Next.js dev server 起動 (localhost:3111)
npm run sb:start    # ローカルSupabase起動 (Docker必須)
```

## コマンド

```bash
# 開発
npm run dev          # Next.js dev server (localhost:3111)
npm run build        # プロダクションビルド
npm run lint         # ESLint
npm run type-check   # TypeScript 型チェック
npm run format       # Prettier フォーマット適用
npm run check        # type-check + lint + format:check を一括実行

# Supabase (要 Docker)
npm run sb:start     # ローカルSupabase起動
npm run sb:stop      # ローカルSupabase停止
npm run sb:reset      # DBリセット・全マイグレーション再実行
supabase migration new <name>   # 新規マイグレーションファイル作成
```

## ディレクトリ構成

```
app/
├── (landing)/     # ランディングページ（認証不要）
├── (auth)/        # 認証ページ (login, signup, invite)
└── (app)/         # アプリ本体（認証ガード済み）
components/        # UI コンポーネント
lib/               # ユーティリティ
└── supabase/      # Supabase クライアント
types/             # 型定義
supabase/
├── migrations/    # DB マイグレーション
└── functions/     # Edge Functions（通知バッチ等）
```

## 技術スタック

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS v4
- **UI**: shadcn/ui (Radix Nova)
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **エディタ**: Tiptap（リッチテキスト）
- **AI**: Vercel AI SDK (Gemini / OpenRouter)
