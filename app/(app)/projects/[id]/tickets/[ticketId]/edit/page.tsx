import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { EditTicketForm } from "./edit-ticket-form";
import { getProjectMembers } from "@/lib/supabase/members";

type Props = {
  params: Promise<{ id: string; ticketId: string }>;
};

export default async function EditTicketPage({ params }: Props) {
  const { id, ticketId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: ticket }, members] = await Promise.all([
    supabase.from("tickets").select("*").eq("id", ticketId).single(),
    getProjectMembers(id),
  ]);

  if (!ticket) notFound();

  return (
    <div className="max-w-lg mx-auto p-8">
      <EditTicketForm ticket={ticket} projectId={id} members={members} />
    </div>
  );
}
