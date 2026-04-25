CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA extensions;

-- ----------------------------------------
-- インデックスを追加
-- ----------------------------------------
CREATE INDEX tickets_assignee_id_idx ON tickets(assignee_id);
CREATE INDEX tickets_updated_at_idx ON tickets(updated_at DESC);
CREATE INDEX tickets_title_trgm_idx ON tickets USING gin(title extensions.gin_trgm_ops);

-- ----------------------------------------
-- チケットにカテゴリを追加
-- ----------------------------------------
CREATE TYPE ticket_category AS ENUM ('bug', 'task', 'feature', 'improvement');

ALTER TABLE tickets
  ADD COLUMN category ticket_category NOT NULL DEFAULT 'task';
