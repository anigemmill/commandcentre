import { PageHeader } from "@/components/ui";
import { ObjectiveList } from "@/components/task-table";
import { requirePrincipal } from "@/server/auth/session";
import { objectives } from "@/server/data";

export const metadata = { title: "Objectives · Command Centre" };

export default async function Objectives({ params }: { params: Promise<{ orgId: string }> }) {
  const p = await requirePrincipal();
  const { orgId } = await params;
  const list = await objectives(p.userId, orgId, null);
  return (
    <>
      <PageHeader
        eyebrow="Across all workspaces"
        title="Objectives"
        description="What each workspace is working towards. Progress is the share of linked tasks that are done."
      />
      <ObjectiveList objectives={list} showWorkspace empty="No objectives yet. Add one from a workspace." />
    </>
  );
}
