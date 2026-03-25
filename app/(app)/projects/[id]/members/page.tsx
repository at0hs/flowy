import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getProjectMembers, isProjectOwner } from "@/lib/supabase/members";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AddMemberForm } from "@/components/members/add-member-form";
import { DeleteMemberButton } from "@/components/members/delete-member-button";
import { ChangeRoleButton } from "@/components/members/change-role-button";
import { revalidatePath } from "next/cache";

type Props = {
  params: Promise<{ id: string }>;
};

async function revalidateMembers(projectId: string) {
  "use server";
  revalidatePath(`/projects/${projectId}/members`);
}

export default async function MembersPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: project } = await supabase.from("projects").select("*").eq("id", id).single();

  if (!project) notFound();

  const members = await getProjectMembers(id);
  const isOwner = await isProjectOwner(id, user.id);
  const ownerCount = members.filter((m) => m.role === "owner").length;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-6">
        <Link href={`/projects/${id}`} className="text-sm text-muted-foreground hover:underline">
          ← {project.name}
        </Link>
        <h1 className="text-2xl font-bold mt-1">メンバー管理</h1>
      </div>

      <Separator className="mb-6" />

      {isOwner && (
        <div className="mb-6 p-4 rounded-md border bg-muted/50">
          <h2 className="text-sm font-medium mb-3">メンバーを追加</h2>
          <AddMemberForm projectId={id} onMemberAdded={revalidateMembers} />
        </div>
      )}

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">ユーザー名</th>
              <th className="px-4 py-3 text-left font-medium">メールアドレス</th>
              <th className="px-4 py-3 text-left font-medium">ロール</th>
              {isOwner && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-b last:border-0">
                <td className="px-4 py-3">{member.profile.username}</td>
                <td className="px-4 py-3 text-muted-foreground">{member.profile.email}</td>
                <td className="px-4 py-3">
                  {isOwner ? (
                    <ChangeRoleButton
                      projectId={id}
                      memberId={member.id}
                      memberName={member.profile.username}
                      currentRole={member.role}
                      isLastOwner={member.role === "owner" && ownerCount === 1}
                    />
                  ) : (
                    <Badge variant={member.role === "owner" ? "default" : "secondary"}>
                      {member.role === "owner" ? "オーナー" : "メンバー"}
                    </Badge>
                  )}
                </td>
                {isOwner && (
                  <td className="px-4 py-3 text-right">
                    {member.user_id !== user.id && (
                      <DeleteMemberButton
                        projectId={id}
                        memberId={member.id}
                        userId={member.user_id}
                        memberName={member.profile.username}
                      />
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
