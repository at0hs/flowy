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
必要に応じて、以下のドキュメントを参照してください（`flowy-docs/` は別ワークスペースの Obsidian Vault 内）。
- 要件定義: @flowy-docs/requirements.md
- アーキテクチャ、ディレクトリ構成、設計方針、環境構成: @flowy-docs/architecture.md
- データベース設計書: @flowy-docs/database_design.md
- 画面設計: @flowy-docs/screen_design.md
- バージョンごとの仕様（最新は v1.0.0）: @flowy-docs/v1.0.0/SPEC_v1.0.0.md
- コーディング規約: @.prettierrc

## Commands

```bash
# Development
npm run dev          # Next.js dev server 起動 (localhost:3111)
npm run build        # 本番ビルド
npm run lint         # ESLint 実行
npm run type-check   # TypeScript 型チェック (tsc --noEmit)
npm run format       # Prettier フォーマット適用
npm run format:check # Prettier フォーマット確認
npm run check        # type-check + lint + format:check を一括実行
npm run validate     # check + build を一括実行

# E2E testing (Playwright) ※ローカルSupabaseの起動が前提
npm run test:e2e     # Playwright E2E テスト実行 (headless)
npm run test:e2e:ui  # Playwright E2E テスト実行 (UIモード)
# 単体実行例: npx playwright test tests/e2e/s2-ticket-crud.spec.ts

# Email development (React Email)
npm run email:dev    # React Email 開発サーバー起動 (emails/ ディレクトリ)
npm run build:emails # React Email テンプレートを supabase/templates/ に HTML ビルド

# Supabase local development (requires Docker)
npm run sb:start     # Local Supabase 起動 (DB, Auth, Studio, Storage)
npm run sb:stop      # Local Supabase 停止
npm run sb:status    # Supabase 動作状態確認
npm run sb:reset     # DB リセット・全マイグレーション再実行
npm run sb:push      # DB スキーマをリモートに push
npm run sb:lint      # DB スキーマの lint チェック
npm run sb:migration # sb:reset + sb:lint + gen:types を一括実行（マイグレーション後の定番フロー）
npm run sb:func-serve  # Supabase Edge Functions をローカルで起動
supabase migration new <name>   # 新規マイグレーションファイル作成

# Type generation
npm run gen:types    # Supabase スキーマから TypeScript 型を生成 (types/database.types.ts)
```

## Architecture

**Flowy** はJira風のチケット管理Webアプリ（現行バージョン v1.0.0）。Next.js 16 App Router + Supabase (PostgreSQL + Auth + Storage) で構成される。

### Directory layout

```
app/
├── (landing)/       # ランディングページ（認証不要、認証ガード外）
│   ├── layout.tsx   # Navbar・Footer を含む共通レイアウト
│   └── page.tsx     # ランディングページ本体 (/)
├── (auth)/          # 認証ガード外（未認証ユーザー向け）
│   ├── login/
│   ├── signup/
│   ├── invite/      # 招待トークン検証・リダイレクト
│   └── actions.ts   # signOut
├── (app)/           # アプリ本体（認証ガード済み）
│   ├── layout.tsx   # サイドバー、Toaster
│   ├── dashboard/   # ダッシュボード（自分のチケット・進捗・最近のアクティビティ・未読通知）
│   ├── notifications/
│   │   └── actions.ts            # 通知既読・全既読 Server Actions
│   ├── projects/
│   │   ├── actions.ts            # プロジェクト・チケット・メンバー・招待・タグ・リアクション関連 Server Actions
│   │   ├── new/
│   │   └── [id]/
│   │       ├── page.tsx          # チケット一覧（テーブル/カンバン/ガントの切替）
│   │       ├── edit/
│   │       ├── settings/         # プロジェクト設定（左サイドメニュー）
│   │       │   ├── members/      # メンバー管理（旧 /projects/[id]/members から移設）
│   │       │   └── fields/       # フィールド設定（タグ管理）
│   │       └── tickets/[ticketId]/   # チケット詳細（2ペイン: メインエリア＋プロパティサイドバー）
│   └── settings/                 # ユーザー設定（左サイドメニュー）
│       ├── account/              # プロフィール編集・パスワード変更・アバターアップロード
│       ├── notifications/        # メール通知ON/OFF設定（種別ごと）
│       └── integrations/         # Slack Webhook URL・AI プロバイダー設定
└── api/auth/logout/route.ts
components/
├── ui/              # shadcn/ui コンポーネント (radix-nova スタイル)
├── layout/, sidebar/, landing/, dashboard/, settings/
├── projects/settings/  # プロジェクト設定ナビ・タグマネージャー
├── account/         # アバターアップロードUI
├── editor/
│   ├── rich-text-editor.tsx  # Tiptap エディタ本体（固定ツールバー・画像D&D・@メンション対応）
│   ├── editor-toolbar.tsx
│   └── rich-text-content.tsx # HTML表示用（DOMPurify でサニタイズして dangerouslySetInnerHTML）
├── notifications/   # ベルアイコン + 未読数バッジ / 通知一覧ドロップダウン
├── tickets/
│   ├── ticket-table.tsx / ticket-filters.tsx / tag-select.tsx
│   ├── kanban/          # カンバンビュー（dnd-kit）
│   ├── gantt/           # ガントチャートビュー（自前実装）
│   ├── ticket-watch-button.tsx
│   ├── ticket-create-modal/  # チケット作成モーダル（コピー機能用に defaultValues 対応）
│   ├── subtask-section/, attachment-section/, activity-section/
│   ├── comment-list/    # コメント一覧・投稿・返信・編集・削除・リアクション(comment-reaction.tsx)
│   ├── ai-assist/       # 要約・サブタスク提案（Vercel AI SDK 使用）
│   └── ticket-inline-edit/   # プロパティサイドバー用インライン編集
│       ├── index.tsx          # 楽観的更新ロジック
│       ├── inline-title.tsx / inline-description.tsx / inline-status.tsx
│       ├── inline-assignee.tsx / inline-priority.tsx / inline-tags.tsx
└── members/
    ├── add-member-form.tsx / delete-member-button.tsx / change-role-button.tsx
lib/
├── supabase/
│   ├── client.ts / server.ts / admin.ts
│   ├── projects.ts / members.ts / tickets.ts / comments.ts / invitations.ts
│   ├── watches.ts / notifications.ts / notification-settings.ts
│   ├── attachments.ts / activities.ts / tags.ts / reactions.ts / dashboard.ts
├── email.ts        # Resend API 経由メール送信
├── slack.ts         # Slack Incoming Webhook 送信
├── storage.ts        # Supabase Storage 操作
├── ai.ts             # AI処理（要約・サブタスク提案）
├── encryption.ts      # AI APIキー等の暗号化/復号
├── ticket-config.ts   # ステータス/優先度/カテゴリのラベル・アイコン等の定義
├── constants.ts / date.ts / file-icons.tsx
├── utils.ts           # cn() 関数
├── logger.ts          # 環境別ロギングユーティリティ
└── validations.ts     # Zod バリデーションスキーマ
types/
├── database.types.ts  # supabase gen types で自動生成
└── index.ts            # 型エクスポート
emails/                 # invitation / notification / confirm-signup / change-email テンプレート
proxy.ts                # 認証ミドルウェア (Next.js middleware)
scripts/build-emails.ts # React Email → supabase/templates/ へ HTML ビルド
supabase/
├── migrations/         # タイムスタンプ付きSQLマイグレーション
├── functions/          # Edge Functions（cronバッチ）
│   ├── deadline-notification/  # 期限切れ通知バッチ
│   ├── email-notification/     # 通知メール一括送信バッチ（15分ごと）
│   └── _shared/                # メールテンプレート等の共有コード
└── templates/          # build:emails で生成した Auth メール HTML（自動生成、手動編集不可）
tests/e2e/
    ├── auth.setup.ts        # DB リセット + UIログイン → playwright/.auth/user.json 保存
    ├── fixtures/, helpers/db.ts
    └── s*.spec.ts           # シナリオ別テスト（s1: プロジェクト, s2: チケットCRUD, s3: インライン編集, s4: コメント）
```

### Key patterns

- **Server Components優先**: デフォルトはServer Component。インタラクションが必要な箇所のみ `'use client'` を付ける
- **Supabaseクライアントの使い分け**: Server Components・Route Handlers・Server Actions では `lib/supabase/server.ts`、Client Components では `lib/supabase/client.ts`、RLSをバイパスする管理操作には `lib/supabase/admin.ts`（サービスロールキー使用）を使う
- **Server Actions**: データ変更は `'use server'` の actions.ts で実装。変更後は `revalidatePath()` でキャッシュ削除し `redirect()` でナビゲーション
- **バリデーション**: `lib/validations.ts` の Zod スキーマでフォームデータを検証
- **状態管理**: グローバル状態ライブラリ未導入（必要になるまで追加しない方針）
- **エラーハンドリング**: ページレベルは `error.tsx`、APIエラーは `sonner` のトースト通知
- **ロギング**: `lib/logger.ts` の `logger` オブジェクト経由（`console.*` 直接呼び出し禁止）。本番クライアントでは debug/info/warn を出力しない
- **インライン編集**: `ticket-inline-edit/` のパターン。クリックで編集モード切替、Enter/blur で保存、Escape でキャンセル。二重送信防止に `isSavingRef` を使用
- **楽観的更新**: `useTransition` + Server Action。即座にローカル状態を更新し、失敗時はロールバック → `router.refresh()` で再検証（カンバンD&D、ガントの日程変更、コメントリアクションも同様のパターン）
- **モーダル + Server Action**: `Dialog` コンポーネント + FormData で Server Action を呼び出すパターン（ticket-create-modal）
- **メール送信フロー**: 招待メールは Server Action 内で即時送信（`lib/email.ts` 経由）。それ以外の通知メールは Edge Function のバッチ処理で送信（即時送信は行わない）
- **リッチテキスト**: Tiptap で編集、HTML文字列として保存（`description`・`body` カラム）。表示時は `rich-text-content.tsx` が DOMPurify でサニタイズしてから `dangerouslySetInnerHTML` で描画。@メンションは `data-mention-id` 属性に埋め込む
- **通知発行**: Server Action 内でチケット更新後に `notify_watchers()` SECURITY DEFINER関数を呼び出してウォッチユーザーへ一括通知レコード挿入。担当者割り当ては直接 `notifications` テーブルに INSERT。メール送信は行わずレコード作成のみ（バッチが拾う）
- **ウォッチ**: `ticket_watches` テーブルで管理。チケット作成時にトリガーで作成者を自動ウォッチ。`ticket-watch-button.tsx` で楽観的更新
- **アクティビティ履歴**: チケット更新・作成・コメント投稿と同時に Server Action 内で `ticket_activities` テーブルへ INSERT。取得は `lib/supabase/activities.ts`。チケット詳細の「コメント/アクティビティ」タブで表示
- **AIアシスト**: Vercel AI SDK (`ai`, `@ai-sdk/google`, `@ai-sdk/openai`) を使用。Gemini・OpenRouter に対応。APIキーは `lib/encryption.ts` で暗号化して `profiles.ai_api_key` に保存
- **Slack連携**: `profiles.slack_webhook_url` が設定されている場合のみ `lib/slack.ts` 経由で Incoming Webhook に通知をPOST
- **添付ファイル**: Supabase Storage の `attachments` バケット（`{project_id}/{ticket_id}/{uuid}.{拡張子}`）。メタデータは `attachments` テーブルで管理。Tiptap の Image エクステンションで画像D&D対応
- **アバター**: Supabase Storage の `avatars` バケット（`{user_id}/avatar.{拡張子}`）。パスは `profiles.avatar_file_path`。2MB・JPEG/PNG/WebPのみ、公開読み取り可
- **タグ**: プロジェクト単位（`tags` テーブル）、チケットとは `ticket_tags` で多対多。作成・編集・削除はプロジェクト設定の `fields` ページから
- **カンバン/ガント**: カンバンは dnd-kit（`DndContext` → `SortableContext`/`useDroppable` → `useDraggable`）でステータス変更。ガントは自前実装（`gantt-task-react` は React 19 非対応のため不採用）でバードラッグにより `start_date`/`due_date` を更新
- **ランディング/認証ルーティング**: `proxy.ts`（ミドルウェア）が制御。未認証で `/` はランディング表示、未認証で他の保護URLは `/login` へ、認証済みで `/` `/login` `/signup` は `/dashboard` へリダイレクト（Server Action呼び出し `Next-Action` ヘッダーがある場合はリダイレクトしない）
- **レスポンシブ**: アプリ本体は `xl`（1280px）をブレークポイントとし、それ未満ではサイドバー折り畳みを強制（`localStorage` の折り畳み状態は 1280px 以上でのみ永続化）
- **E2Eテスト**: Playwright を使用（`tests/e2e/`）。実行前にローカル Supabase (`npm run sb:start`) が必要。`auth.setup.ts` が DB をリセットし `test@example.com` / `password123` でログイン状態を生成する。認証状態は `playwright/.auth/user.json` にキャッシュされる。対象は「壊れたら致命的」な4シナリオ（プロジェクト作成、チケットCRUD、インライン編集、コメント投稿）。認証フロー自体（メール確認が絡む）はテスト対象外

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
| `profiles` | ユーザープロフィール (auth.usersと1:1、`slack_webhook_url`・`ai_provider`/`ai_api_key`/`ai_model_name`・`avatar_file_path` を含む) |
| `projects` | プロジェクト (`owner_id` で RLS 制御) |
| `project_members` | プロジェクトメンバー (`role: 'owner' \| 'member'`) |
| `tickets` | チケット (`status: todo/in_progress/done`, `priority: low/medium/high/urgent`, `category: bug/task/feature/improvement`, `assignee_id`, `parent_id`, `start_date`, `due_date`) |
| `comments` | チケットコメント (`reply_to_id` で返信対応、`is_deleted` でソフトデリート) |
| `invitations` | プロジェクト招待 (`token`, `status: pending/accepted/expired`, 有効期限付き) |
| `ticket_watches` | チケットウォッチ (`ticket_id`, `user_id`, UNIQUE制約) |
| `notifications` | 通知 (`type`, `is_read`, `actor_id`, `metadata` jsonb, `email_sent_at`) |
| `notification_settings` | ユーザーごとの通知種別ON/OFF設定 |
| `attachments` | チケット添付ファイルのメタデータ（本体は Supabase Storage） |
| `ticket_activities` | チケットの操作履歴（アクティビティタブ表示用） |
| `tags` | プロジェクト内共有タグ |
| `ticket_tags` | チケットとタグの中間テーブル |
| `comment_reactions` | コメントへのリアクション（スタンプ、絵文字10種類固定） |

- 全テーブルでRLS (Row Level Security) 有効。`project_members` をベースに多層的なポリシーを実装
- サインアップ時にDBトリガーで `profiles` レコードを自動生成（`raw_user_meta_data` から `username` を取得）
- `SECURITY DEFINER` 関数：`accept_invitation()`, `create_invitation()`, `remove_member_from_project()`, `notify_watchers()`, `is_email_registered()`, `is_project_member()`, `is_project_owner()`
- マイグレーションは `supabase/migrations/` にタイムスタンプ付きSQLで管理
- `types/database.types.ts` は `npm run gen:types` で再生成
- 詳細なスキーマ・ENUM定義・トリガー・RLSポリシーは @flowy-docs/database_design.md を参照

### Auth flow

- `proxy.ts` がミドルウェアとして動作：未認証ユーザーが `/`（ランディング）以外の保護URLへアクセス→ `/login` へ、認証済みユーザーが `/` `/login` `/signup` アクセス時は `/dashboard` へリダイレクト
- 通常サインアップはメール確認必須。招待経由のサインアップはメール確認をスキップし即座にプロジェクトメンバーへ追加
