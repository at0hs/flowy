-- ============================================================
-- テスト用プロジェクト + チケット 5件 作成
-- ============================================================
-- 事前準備:
--   1. v_user_id を実行ユーザーの UUID に変更してください
--      （Supabase Studio → Authentication → Users でコピー可能）
--   2. Supabase Studio の SQL Editor で実行してください
-- ============================================================

DO $$
DECLARE
  v_user_id   uuid := 'c84df6fb-11dd-481f-a709-a5bcb79b6659';  -- ← 自分の user_id に変更
  v_project_id uuid := gen_random_uuid();
  v_t1_id     uuid := gen_random_uuid();
  v_t2_id     uuid := gen_random_uuid();
  v_t3_id     uuid := gen_random_uuid();
  v_t4_id     uuid := gen_random_uuid();
  v_t5_id     uuid := gen_random_uuid();
BEGIN
  -- ----------------------------------------------------------------
  -- プロジェクト作成
  -- on_project_created トリガーにより project_members に owner が自動追加される
  -- ----------------------------------------------------------------
  INSERT INTO public.projects (id, owner_id, name, description)
  VALUES (
    v_project_id,
    v_user_id,
    'Flowy 開発プロジェクト',
    'チケット管理Webアプリ "Flowy" の開発・改善タスクを管理するプロジェクト。'
  );

  -- ----------------------------------------------------------------
  -- チケット作成（トリガーを一時無効化して手動ウォッチを挿入）
  -- on_ticket_created は auth.uid() を使うが Studio 実行時は NULL になるため
  -- ----------------------------------------------------------------
  ALTER TABLE public.tickets DISABLE TRIGGER on_ticket_created;

  -- チケット 1: ログイン・サインアップ画面のバリデーション改善（対応中・高）
  INSERT INTO public.tickets (id, project_id, assignee_id, title, description, status, priority, due_date)
  VALUES (
    v_t1_id,
    v_project_id,
    v_user_id,
    'ログイン・サインアップ画面のバリデーション改善',
    '<h2>背景</h2><p>現状、メールアドレス形式の不正入力や空送信時のエラーメッセージがユーザーに分かりにくい。</p><h2>対応内容</h2><ul><li>メールアドレス形式チェックをリアルタイムで表示</li><li>パスワード強度インジケーターの追加</li><li>送信ボタン連打による二重送信の防止（ローディング状態の表示）</li></ul><h2>受入条件</h2><ul><li>不正入力時にフィールド直下にインラインエラーが表示される</li><li>送信中はボタンが無効化される</li></ul>',
    'in_progress',
    'high',
    (current_date + interval '5 days')::date
  );

  -- チケット 2: チケット一覧画面のページネーション実装（未着手・中）
  INSERT INTO public.tickets (id, project_id, assignee_id, title, description, status, priority, due_date)
  VALUES (
    v_t2_id,
    v_project_id,
    NULL,
    'チケット一覧画面のページネーション実装',
    '<h2>背景</h2><p>チケット数が増加するにつれ、一覧の初期表示が遅くなっている。無限スクロールまたはページネーションの導入が必要。</p><h2>対応方針</h2><ul><li>カーソルベースのページネーション（<code>created_at</code> + <code>id</code> をカーソルとして使用）</li><li>1ページあたり 30 件を基本とする</li><li>フィルター条件と組み合わせ可能にする</li></ul><h2>非目標</h2><ul><li>オフセットページネーション（パフォーマンス上の理由で除外）</li></ul>',
    'todo',
    'medium',
    (current_date + interval '14 days')::date
  );

  -- チケット 3: メール通知テンプレートの文言・デザイン修正（完了・低）
  INSERT INTO public.tickets (id, project_id, assignee_id, title, description, status, priority, due_date)
  VALUES (
    v_t3_id,
    v_project_id,
    v_user_id,
    'メール通知テンプレートの文言・デザイン修正',
    '<h2>背景</h2><p>招待メールおよびステータス変更通知メールの文言が機械的で、ユーザーが内容を把握しにくいとフィードバックがあった。</p><h2>対応内容</h2><ul><li>招待メールの件名・本文を親しみやすい文体に変更</li><li>通知メールにプロジェクト名・チケットタイトルを明示</li><li>フッターにサポート連絡先を追加</li></ul><h2>完了メモ</h2><p><code>emails/</code> ディレクトリの React Email テンプレートを更新し、<code>npm run build:emails</code> で反映済み。</p>',
    'done',
    'low',
    NULL
  );

  -- チケット 4: APIレートリミットの実装（未着手・緊急）
  INSERT INTO public.tickets (id, project_id, assignee_id, title, description, status, priority, due_date)
  VALUES (
    v_t4_id,
    v_project_id,
    NULL,
    'APIレートリミットの実装',
    '<h2>背景</h2><p>AIアシスト機能のエンドポイントに対するリクエストが急増しており、外部APIの利用コストが増大している。悪意ある大量リクエストへの対策も必要。</p><h2>対応内容</h2><ul><li>Next.js Route Handler に IP ベースのレートリミットを実装</li><li>ユーザー単位でのリクエスト回数制限（例: 1分間に10回）</li><li>制限超過時は <code>429 Too Many Requests</code> を返す</li></ul><h2>候補ライブラリ</h2><ul><li><a href="#">upstash/ratelimit</a>（Redis ベース、Vercel Edge 対応）</li><li><a href="#">next-rate-limit</a>（軽量、インメモリ）</li></ul><h2>受入条件</h2><ul><li>制限超過時に適切なエラーレスポンスが返る</li><li>通常利用では制限に引っかからない</li></ul>',
    'todo',
    'urgent',
    (current_date + interval '3 days')::date
  );

  -- チケット 5: ダッシュボード画面の実装（対応中・高）
  INSERT INTO public.tickets (id, project_id, assignee_id, title, description, status, priority, due_date)
  VALUES (
    v_t5_id,
    v_project_id,
    v_user_id,
    'ダッシュボード画面の実装',
    '<h2>背景</h2><p>ログイン直後に表示するダッシュボードが未実装のため、プロジェクト一覧画面に直接遷移している。ユーザーが自分のタスクやアクティビティを俯瞰できる画面が必要。</p><h2>表示要素</h2><ul><li>自分に割り当てられたチケット一覧（ステータス別集計）</li><li>期限が近いチケット（3日以内）</li><li>最近の更新アクティビティ（更新日時降順）</li></ul><h2>技術方針</h2><ul><li>Server Component でデータフェッチ（<code>lib/supabase/dashboard.ts</code> に関数を切り出す）</li><li>既存の <code>tickets_assignee_id_idx</code>・<code>tickets_updated_at_idx</code> を活用してクエリ高速化</li></ul><h2>受入条件</h2><ul><li>自分のチケットが正しく表示される</li><li>他ユーザーのチケットは表示されない</li></ul>',
    'in_progress',
    'high',
    (current_date + interval '7 days')::date
  );

  ALTER TABLE public.tickets ENABLE TRIGGER on_ticket_created;

  RAISE NOTICE 'Done! project_id = %', v_project_id;
END;
$$;
