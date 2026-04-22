CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA extensions;

-- ----------------------------------------
-- インデックスを追加
-- ----------------------------------------
CREATE INDEX tickets_assignee_id_idx ON tickets(assignee_id);
CREATE INDEX tickets_updated_at_idx ON tickets(updated_at DESC);
CREATE INDEX tickets_title_trgm_idx ON tickets USING gin(title gin_trgm_ops);
