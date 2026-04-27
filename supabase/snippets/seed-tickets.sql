-- ============================================================
-- テスト用チケット 100件 一括作成
-- ============================================================
-- 1. 下記の project_id を実際の値に変更してから実行してください
-- 2. Supabase Studio の SQL Editor で実行（RLS バイパス済み）
-- ============================================================

ALTER TABLE tickets DISABLE TRIGGER on_ticket_created;

DO $$
DECLARE
  v_project_id uuid := '76ff34f2-4cc7-41fd-b49d-ff080b9f4d9a';  -- ← ここを変更
BEGIN
  INSERT INTO tickets (project_id, assignee_id, title, status, priority, created_at)
  SELECT
    v_project_id,
    NULL,
    '【テスト】チケット #' || n,
    (ARRAY['todo', 'in_progress', 'done'])[1 + floor(random() * 3)::int]::ticket_status,
    (ARRAY['low', 'medium', 'high', 'urgent'])[1 + floor(random() * 4)::int]::ticket_priority,
    now() - (n * interval '1 hour')
  FROM generate_series(1, 100) AS n;
END;
$$;

ALTER TABLE tickets ENABLE TRIGGER on_ticket_created;
