-- E2E テスト用シードデータ（ローカル環境専用）
-- supabase db reset 実行時に投入される

DO $$
DECLARE
  test_user_id  uuid := '10000000-0000-0000-0000-000000000001';
  test_project_id uuid := '00000000-0000-0000-0000-000000000002';
  test_ticket_id  uuid := '00000000-0000-0000-0000-000000000003';
BEGIN
  -- auth.users に挿入（handle_new_user トリガーで profiles が自動生成される）
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    test_user_id,
    'authenticated',
    'authenticated',
    'test@example.com',
    crypt('password123', gen_salt('bf')),
    current_timestamp,
    current_timestamp,
    '{"provider":"email","providers":["email"]}',
    '{"username":"test-user"}',
    current_timestamp,
    current_timestamp,
    '', '', '', ''
  );

  -- プロジェクト（on_project_created トリガーで project_members に owner が自動追加される）
  INSERT INTO public.projects (id, owner_id, name)
  VALUES (test_project_id, test_user_id, 'E2E Test Project');

  -- チケット（todo ステータス）
  -- auto_watch_on_ticket_create トリガーは auth.uid() を使うが、seed 実行時は NULL になるため無効化
  ALTER TABLE public.tickets DISABLE TRIGGER on_ticket_created;
  INSERT INTO public.tickets (id, project_id, title, status, priority)
  VALUES (test_ticket_id, test_project_id, 'E2E Test Ticket', 'todo', 'medium');
  ALTER TABLE public.tickets ENABLE TRIGGER on_ticket_created;

  -- ticket_watches を手動挿入（トリガーの代替）
  INSERT INTO public.ticket_watches (ticket_id, user_id)
  VALUES (test_ticket_id, test_user_id);
END $$;
