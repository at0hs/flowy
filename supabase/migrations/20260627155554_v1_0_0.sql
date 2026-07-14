-- ============================================================
-- v1.0.0 マイグレーション
-- - comment_reactions テーブルを新規作成
-- ============================================================

-- ----------------------------------------
-- comment_reactions テーブル
-- コメントへのリアクション（スタンプ）を管理
-- ----------------------------------------
CREATE TABLE comment_reactions (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid        NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji      text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comment_id, user_id, emoji)
);

CREATE INDEX comment_reactions_comment_id_idx ON comment_reactions(comment_id);

ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------
-- comment_reactions テーブル RLS
-- ----------------------------------------

-- 読み取り: 自分が project_members に存在するプロジェクトのコメントのリアクションのみ
CREATE POLICY "comment_reactions: project members can read" ON comment_reactions
  FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM comments c
        WHERE c.id = comment_reactions.comment_id
          AND can_access_ticket(c.ticket_id)
      )
    );

-- 追加: 自分が project_members に存在するプロジェクトのコメントにのみ追加可
CREATE POLICY "comment_reactions: project members can insert" ON comment_reactions
  FOR INSERT
    WITH CHECK (
      (SELECT auth.uid()) = user_id
      AND EXISTS (
        SELECT 1 FROM comments c
        WHERE c.id = comment_reactions.comment_id
          AND can_access_ticket(c.ticket_id)
      )
    );

-- 削除: 自分のリアクションのみ削除可
CREATE POLICY "comment_reactions: own reactions can delete" ON comment_reactions
  FOR DELETE
    USING ((SELECT auth.uid()) = user_id);

-- ============================================================
-- Supabase CLI の db reset は、マイグレーション適用前に
--   ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
--     REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES / USAGE, SELECT ON SEQUENCES
--     / EXECUTE ON FUNCTIONS FROM anon, authenticated, service_role
-- を実行するようになったため、テーブルへの明示的な GRANT が
-- どこにも存在しないこのプロジェクトでは anon/authenticated が
-- 一切テーブルにアクセスできなくなっていた（permission denied for table ...）。
-- 既存テーブルへの GRANT と、今後 postgres ロールが作成するテーブルに
-- 対する default privileges を明示的に復元する。
-- ============================================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
