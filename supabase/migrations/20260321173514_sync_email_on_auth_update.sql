-- auth.users のメールアドレス変更時に profiles.email を自動同期するトリガー
-- supabase.auth.updateUser({ email }) でメール確認後に auth.users.email が更新されるタイミングで発火する

CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  -- メールアドレスが実際に変更された場合のみ更新
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE profiles
    SET email = NEW.email
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION sync_profile_email();
