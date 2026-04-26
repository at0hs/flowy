-- ============================================================
-- テスト用チケット 100件 一括作成
-- ============================================================
-- 1. 下記の project_id を実際の値に変更してから実行してください
-- 2. Supabase Studio の SQL Editor で実行（RLS バイパス済み）
-- ============================================================

ALTER TABLE tickets DISABLE TRIGGER on_ticket_created;

DO $$
DECLARE
  v_project_id uuid := '74f5bdb0-f3a0-44d3-8c45-f230bd802149';  -- ← ここを変更
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
