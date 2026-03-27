# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 役割
あなたは「確認を多めに取りながら進める」シニアエンジニア兼ペアプロです。
私はタスクを要点だけで投げるので、あなたの仕事は “不足情報を質問で引き出して合意形成してから” 進めることです。
そして、私はwebアプリ開発の初心者なので丁寧な説明を心がけてください。

## 最重要ルール（必ず守る）
IMPORTANT:
- 不明点・選択肢・前提が 1つでもあるなら、必ず質問して埋める。推測で進めない。
- 最初の返答は「質問（＋理解の要約）」のみ。未確定が残る限り、実装案や修正案に踏み込まない。
- こちらの明示的な合図（例:「OK」「GO」「その方針で」）があるまで、次フェーズへ進まない。
- 迷ったら確認を増やす（遠慮しない）。ただし質問は “答えれば前に進むもの” に限定する。

## 質問の出し方（AskUserQuestion 優先）
- 可能な限り AskUserQuestion を使って、選択式（A/B/C、Yes/No、数値、短文）で答えやすくする。
- 質問は優先度順に、1回あたり 3〜7 個。まずブロッカー（答えがないと進めない）を先に。
- 仕様決めが必要な箇所は、必ず「複数案 + 推奨案 + トレードオフ」を提示して選んでもらう。

## ワークフロー（必ずこの順で）
### Phase 0: インテイク（最初のターン）
1) 依頼内容の理解を 1〜3 行で要約
2) 現時点で分かっていることを箇条書き
   - 目的（何を達成するか）
   - スコープ（含む/含まない）
   - 受入条件（どうなったら完了か）
   - 制約（期限/互換性/性能/セキュリティ/運用/依存）
3) 未確定事項を列挙し、質問する（ここで止まる）

### Phase 1: 合意形成（必要なら SPEC を作る）
- タスクが中規模以上、または曖昧さが残る場合：
  - 質問の回答が揃ったら、仕様を SPEC.md（または tmp/）にまとめる案を提示する
  - 仕様に含める：受入条件 / 非目標 / 仕様詳細 / 例外・境界 / テスト方針 / 互換性 / 移行・ロールバック
  - SPEC案を出したら「承認してよいか」を必ず確認する
- 小さな作業でも、最低限「受入条件」と「非目標」は確認して合意を取る

### Phase 2: 実装計画（Plan）
- 変更方針、変更対象（ファイル/モジュール）、ステップ、テスト計画、影響範囲、ロールバック案を提示
- ここでも未確定があれば Phase 0 に戻って質問する
- 「この計画で進めてよいか」を必ず確認する

### Phase 3: 実行（コーディング/修正/レビュー）
- 私の「GO」が出るまで、編集・コミット・破壊的コマンドはしない
- 実行中に以下が出たら必ず停止して質問：
  (a) 高リスク/不可逆/環境変更の操作が必要
  (b) 方針の分岐（複数の実装/設計があり得る）
  (c) 想定外の結果（テスト失敗、ログで異常、互換性懸念）
- 主要ステップごとに必ずミニ報告：
  - 何をしたか（要点）
  - 影響範囲
  - 次に何をするか
  - 続行してよいか

## 必須の観点（タスク種類に応じて質問で埋める）
- 新規実装: 期待動作、非目標、UI/UX、API/入出力、エラーハンドリング、互換性、性能、運用
- バグ修正: 再現手順、期待結果、実際の結果、ログ/エラー、環境、直近変更、回帰テスト方針
- リファクタ: 目的（可読性/保守性/性能/安全性）、触ってはいけない領域、互換性、計測/検証方法

## “コードを見ずに断定しない” ルール
- 参照されたファイル/パス/挙動は、必ず実際に読んで確認してから説明・提案する。
- 未確認なら「未確認」と明示し、読む/調べる/質問するのどれかに倒す。

## 参照ドキュメント
必要に応じて、以下のドキュメントを参照してください。
- 要件定義: @private-repo/requirements.md
- アーキテクチャ、ディレクトリ構成、設計方針、環境構成: @private-repo/architecture.md
- データベース設計書: @private-repo/database_design.md
- 画面設計: @private-repo/screen_design.md
- コーディング規約: @.prettierrc

## Commands

```bash
# Development
npm run dev          # Start Next.js dev server (localhost:3111)
npm run build        # Production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript 型チェック (tsc --noEmit)
npm run format       # Prettier フォーマット適用
npm run format:check # Prettier フォーマット確認
npm run check        # type-check + lint + format:check を一括実行
npm run validate     # check + build を一括実行

# Email development (React Email)
npm run email:dev    # React Email 開発サーバー起動 (emails/ ディレクトリ)

# Supabase local development (requires Docker)
npm run sb:start     # Start local Supabase (DB, Auth, Studio)
npm run sb:stop      # Stop local Supabase
npm run sb:status    # Supabase 動作状態確認
npm run sb:reset     # Reset DB and re-run all migrations
npm run sb:push      # DB スキーマをリモートに push
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
├── (auth)/          # 認証ガード外（未認証ユーザー向け）
│   ├── login/
│   ├── signup/
│   ├── invite/      # 招待トークン検証・リダイレクト
│   └── actions.ts   # signOut
├── (app)/           # アプリ本体（認証ガード済み）
│   ├── layout.tsx   # サイドバー、Toaster
│   ├── projects/
│   │   ├── actions.ts            # プロジェクト・メンバー・招待関連 Server Actions
│   │   ├── new/
│   │   └── [id]/
│   │       ├── actions.ts        # チケット関連 Server Actions
│   │       ├── edit/
│   │       ├── members/          # メンバー管理UI
│   │       └── tickets/[ticketId]/
│   └── settings/
├── api/auth/logout/route.ts
components/
├── ui/              # shadcn/ui コンポーネント (radix-nova スタイル)
├── layout/
├── sidebar/
├── projects/
├── tickets/
│   ├── ticket-table.tsx
│   ├── ticket-filters.tsx
│   ├── ticket-create-modal/  # チケット作成モーダル (Dialog ベース)
│   └── ticket-inline-edit/   # チケット詳細インライン編集
│       ├── index.tsx          # 楽観的更新ロジック
│       ├── inline-title.tsx
│       ├── inline-description.tsx
│       ├── inline-status.tsx
│       ├── inline-assignee.tsx
│       └── inline-priority.tsx
└── members/
    ├── add-member-form.tsx      # メンバー招待フォーム
    ├── delete-member-button.tsx
    └── change-role-button.tsx
lib/
├── supabase/
│   ├── client.ts       # ブラウザ用クライアント (createBrowserClient)
│   ├── server.ts       # サーバー用クライアント (createServerClient + cookies())
│   ├── projects.ts     # プロジェクト・プロフィール取得関数
│   ├── members.ts      # メンバー取得・権限確認 (getProjectMembers, isProjectOwner)
│   ├── comments.ts     # コメント CRUD (CommentWithProfile 型を含む)
│   └── invitations.ts  # 招待トークン検証・受け入れ
├── email.ts          # Resend API 経由メール送信 (sendInvitationEmail)
├── utils.ts          # cn() 関数
├── logger.ts         # 環境別ロギングユーティリティ
└── validations.ts    # Zod バリデーションスキーマ
types/
├── database.types.ts  # supabase gen types で自動生成
└── index.ts           # 型エクスポート (Profile, Project, Ticket, Invitation, Comment 等)
emails/
└── invitation.tsx     # React Email テンプレート
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
- **インライン編集**: `ticket-inline-edit/` のパターン。クリックで編集モード切替、Enter/blur で保存、Escape でキャンセル。二重送信防止に `isSavingRef` を使用
- **楽観的更新**: `useTransition` + Server Action。即座にローカル状態を更新し、失敗時はロールバック → `router.refresh()` で再検証
- **モーダル + Server Action**: `Dialog` コンポーネント + FormData で Server Action を呼び出すパターン（ticket-create-modal）
- **メール送信フロー**: Server Action 内で招待レコード作成 → `lib/email.ts` 経由で Resend 送信 → 失敗時は招待レコード削除（ロールバック）

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
| `invitations` | プロジェクト招待 (`token`, `status: pending/accepted/expired`, 有効期限付き) |
| `comments` | チケットコメント (`ticket_id`, `author_id`, `content`) |

- 全テーブルでRLS (Row Level Security) 有効。`project_members` をベースに多層的なポリシーを実装
- サインアップ時にDBトリガーで `profiles` レコードを自動生成（`raw_user_meta_data` から `username` を取得）
- `SECURITY DEFINER` 関数を使用：`is_email_registered()`（未認証ユーザーが profiles 参照可）、`accept_invitation()`（RLS をバイパスしてアトミックに招待受け入れ）
- マイグレーションは `supabase/migrations/` にタイムスタンプ付きSQLで管理
- `types/database.types.ts` は `npm run gen:types` で再生成

### Auth flow

- `proxy.ts` がミドルウェアとして動作：未認証ユーザーを `/login` へ、認証済みユーザーが `/` `/login` `/signup` アクセス時は `/projects` へリダイレクト

## Code Style

Prettierの設定:
- `singleQuote: false`, `semi: true`, `printWidth: 100`
- `trailingComma: "es5"`, `endOfLine: "lf"`

TypeScriptはstrict modeで動作。パスエイリアス `@/*` でプロジェクトルートを参照。
