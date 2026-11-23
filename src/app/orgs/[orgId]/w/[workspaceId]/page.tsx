import { notFound } from "next/navigation";
import { z } from "zod";
import { NewObjectiveForm, NewTaskForm } from "@/components/forms";
import { ObjectiveList, TaskTable } from "@/components/task-table";
import { buttonClass, PageHeader, Section } from "@/components/ui";
import { requirePrincipal } from "@/server/auth/session";
import { homeToday, objectives, org, tasks, workspace } from "@/server/data";

export default async function WorkspacePage({ params }: { params: Promise<{ orgId: string; workspaceId: string }> }) {
  const p = await requirePrincipal();
  const { orgId, workspaceId } = await params;
  if (!z.uuid().safeParse(workspaceId).success) notFound();
  const [o, w] = await Promise.all([org(p.userId, orgId), workspace(p.userId, orgId, workspaceId)]);
  if (!o || !w) notFound();
  const [list, goals] = await Promise.all([tasks(p.userId, orgId, workspaceId), objectives(p.userId, orgId, workspaceId)]);
  const today = homeToday();
  const open = list.filter((t) => t.status !== "done");
  const done = list.filter((t) => t.status === "done");
  const activeGoals = goals.filter((g) => g.status === "active" || g.status === "paused");

  return (
    <>
      <PageHeader
        eyebrow={`Workspace · ${o.name}`}
        title={w.name}
        description={`${open.length} open task${open.length === 1 ? "" : "s"} · ${activeGoals.length} objective${activeGoals.length === 1 ? "" : "s"} in play`}
      />

      <div className="flex flex-col gap-14">
        <Section label="Tasks">
          <details className="group mb-2 mt-2">
            <summary className={`${buttonClass("primary")} cursor-pointer list-none`}>
              <span className="group-open:hidden">New task</span>
              <span className="hidden group-open:inline">Close</span>
            </summary>
            <div className="mt-4 rounded-lg bg-surface p-6 shadow-1">
              <NewTaskForm orgId={orgId} workspaceId={workspaceId} objectives={goals.filter((g) => g.status === "active").map((g) => ({ id: g.id, title: g.title }))} />
            </div>
          </details>
          <TaskTable tasks={open} today={today} orgId={orgId} empty="No open tasks in this workspace." />
          {done.length > 0 && (
            <details className="mt-6">
              <summary className="cursor-pointer text-sm text-muted hover:text-ink">Completed ({done.length})</summary>
              <TaskTable tasks={done} today={today} orgId={orgId} empty="" />
            </details>
          )}
        </Section>

        <Section label="Objectives">
          <ObjectiveList objectives={goals} empty="No objectives yet. What is this workspace working towards?" />
          <details className="group mt-4">
            <summary className={`${buttonClass("secondary")} cursor-pointer list-none`}>
              <span className="group-open:hidden">New objective</span>
              <span className="hidden group-open:inline">Close</span>
            </summary>
            <div className="mt-4 rounded-lg bg-surface p-6 shadow-1">
              <NewObjectiveForm orgId={orgId} workspaceId={workspaceId} />
            </div>
          </details>
        </Section>
      </div>
    </>
  );
}
