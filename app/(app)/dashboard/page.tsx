import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getMyTickets,
  getProjectProgress,
  getRecentActivity,
  getUnreadNotificationSummary,
} from "@/lib/supabase/dashboard";
import { MyTickets } from "@/components/dashboard/my-tickets";
import { ProjectProgressSection } from "@/components/dashboard/project-progress";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { NotificationSummary } from "@/components/dashboard/notification-summary";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [myTickets, projectProgress, recentActivity, notificationSummary] = await Promise.all([
    getMyTickets(user.id),
    getProjectProgress(user.id),
    getRecentActivity(user.id),
    getUnreadNotificationSummary(user.id),
  ]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">ダッシュボード</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <MyTickets tickets={myTickets} />
        <ProjectProgressSection projects={projectProgress} />
        <RecentActivity tickets={recentActivity} />
        <NotificationSummary summary={notificationSummary} />
      </div>
    </div>
  );
}
