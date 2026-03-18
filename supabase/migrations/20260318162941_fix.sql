DROP POLICY IF EXISTS "owner can update" ON projects;
CREATE POLICY "owner can update"
  ON projects FOR UPDATE
  USING ((SELECT auth.uid()) = owner_id);
