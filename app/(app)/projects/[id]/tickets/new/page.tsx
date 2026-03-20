import { getProjectMembers } from '@/lib/supabase/members';
import NewTicketForm from './new-ticket-form';

interface NewTicketPageProps {
  params: Promise<{ id: string }>;
}

export default async function NewTicketPage({ params }: NewTicketPageProps) {
  const { id: projectId } = await params;
  const members = await getProjectMembers(projectId);

  return <NewTicketForm projectId={projectId} members={members} />;
}
