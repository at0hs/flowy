-- ----------------------------------------
-- - profileにアバターURLを追加
-- - tagsテーブルを新規作成
-- - ticket_tagsテーブルを新規作成
-- - avatarsバケットの作成
-- ----------------------------------------

-- アバターURL
ALTER TABLE profiles
  ADD COLUMN avatar_url text;

-- tagsテーブル
CREATE TABLE tags (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  color      text,
  created_by uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, name)
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------
-- tagsテーブル RLS
-- プロジェクトメンバーのみ操作可能
-- ----------------------------------------
CREATE POLICY "tags: project members can read" ON tags
  FOR SELECT
    USING (is_project_member(project_id));

CREATE POLICY "tags: project members can create" ON tags
  FOR INSERT
    WITH CHECK (
      is_project_member(project_id)
      AND (SELECT auth.uid()) = created_by
    );

CREATE POLICY "tags: project members can update" ON tags
  FOR UPDATE
    USING (is_project_member(project_id));

CREATE POLICY "tags: project members can delete" ON tags
  FOR DELETE
    USING (is_project_member(project_id));

-- ticket_tagsテーブル
CREATE TABLE ticket_tags (
  ticket_id uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  tag_id    uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (ticket_id, tag_id)
);

ALTER TABLE ticket_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ticket_tags: project members only" ON ticket_tags
  FOR ALL
    USING (can_access_ticket(ticket_id));

-- アバター画像用のバケット
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'avatars',
    'avatars',
    true,
    2*1024*1024,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  );

-- 更新・削除・作成: 本人のみ可能
-- 読み取り: 制限なし
-- パスから user_id を抽出して権限チェック（avatars/{user_id}/{uuid}.{ext}）

CREATE POLICY "avatar bucket: own directory can create" ON storage.objects
  FOR INSERT
    WITH CHECK (
      bucket_id = 'avatars'
      AND (
        (SELECT auth.uid()) = (split_part(storage.objects.name, '/', 1))::uuid
      )
    );

CREATE POLICY "avatar bucket: own directory can update" ON storage.objects
  FOR UPDATE
    USING (
      bucket_id = 'avatars'
      AND (
        (SELECT auth.uid()) = (split_part(storage.objects.name, '/', 1))::uuid
      )
    );

CREATE POLICY "avatar bucket: own directory can delete" ON storage.objects
  FOR DELETE
    USING (
      bucket_id = 'avatars'
      AND (
        (SELECT auth.uid()) = (split_part(storage.objects.name, '/', 1))::uuid
      )
    );
