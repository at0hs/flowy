import { createClient } from './server';
import { Project } from '@/types';

// ユーザーが所有・参加しているプロジェクト一覧を取得
export async function getUserProjects(): Promise<Project[]> {
  const supabase = await createClient();

  // 現在のユーザーを取得
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('Failed to get current user:', userError);
    throw new Error('ユーザー認証情報が見つかりません');
  }

  // ユーザーが所属するプロジェクトメンバーレコードを検索
  const { data: memberData, error: memberError } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('user_id', user.id);

  if (memberError) {
    console.error('Failed to fetch project members:', memberError);
    throw memberError;
  }

  // プロジェクトがない場合は空配列を返す
  if (!memberData || memberData.length === 0) {
    return [];
  }

  // project_idのリストを取得
  const projectIds = memberData.map((m) => m.project_id);

  // プロジェクト情報を取得（新しい順）
  const { data: projects, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .in('id', projectIds)
    .order('created_at', { ascending: false });

  if (projectError) {
    console.error('Failed to fetch projects:', projectError);
    throw projectError;
  }

  return projects || [];
}

// ユーザープロフィール情報を取得
export async function getUserProfile() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('ユーザー認証情報が見つかりません');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, display_name, email')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Failed to fetch user profile:', profileError);
    throw profileError;
  }

  return profile;
}
