import { ProjectSettingsNav } from "@/components/settings/project-settings-nav";

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export default async function ProjectSettingsLayout({ children, params }: Props) {
  const { id } = await params;

  return (
    <div className="flex h-full">
      <ProjectSettingsNav projectId={id} />
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
