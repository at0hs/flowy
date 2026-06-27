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
