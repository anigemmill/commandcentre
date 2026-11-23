import { notFound } from "next/navigation";
import { z } from "zod";
import { deleteTaskAction, setTaskStatusAction } from "@/app/actions";
import { NewTaskForm } from "@/components/forms";
import { Shell } from "@/components/shell";
import { requirePrincipal } from "@/server/auth/session";
import { me, org, tasks, workspace } from "@/server/data";
import { STATUS_LABEL, TASK_STATUSES } from "@/server/task-options";

export default async function WorkspaceDashboard({ params }: { params: Promise<{ orgId: string; workspaceId: string }> }) {
  const p = await requirePrincipal();
  const { orgId, workspaceId } = await params;
  if (!z.uuid().safeParse(orgId).success || !z.uuid().safeParse(workspaceId).success) notFound();
  const [person, o, w] = await Promise.all([me(p.userId), org(p.userId, orgId), workspace(p.userId, orgId, workspaceId)]);
  if (!o || !w) notFound();
  const list = await tasks(p.userId, workspaceId);
  const today = new Date().toISOString().slice(0, 10);
  const counts = Object.fromEntries(TASK_STATUSES.map((s) => [s, list.filter((t) => t.status === s).length]));
  const overdue = list.filter((t) => t.status !== "done" && t.due_date && t.due_date < today).length;

  return (
    <Shell name={person?.display_name ?? ""} crumbs={[{ href: "/orgs", label: "Organisations" }, { href: `/orgs/${orgId}`, label: o.name }, { label: w.name }]}>
      <h1 className="text-2xl font-semibold">{w.name}</h1>
      <p className="text-sm text-muted">Dashboard · figures are counts of this workspace&apos;s tasks (measured)</p>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-6">
        {TASK_STATUSES.map((s) => (
          <div key={s} className="rounded border border-line bg-surface p-3">
            <dt className="text-sm text-muted">{STATUS_LABEL[s]}</dt>
            <dd className="text-2xl font-semibold">{counts[s]}</dd>
          </div>
        ))}
        <div className="rounded border border-line bg-surface p-3">
          <dt className="text-sm text-muted">Overdue</dt>
          <dd className={`text-2xl font-semibold ${overdue ? "text-danger" : ""}`}>{overdue}</dd>
        </div>
      </dl>

      <section className="mt-8 rounded border border-line bg-surface p-4" aria-labelledby="new-task">
        <h2 id="new-task" className="mb-3 font-semibold">New task</h2>
        <NewTaskForm orgId={orgId} workspaceId={workspaceId} />
      </section>

      <section className="mt-8" aria-labelledby="task-list">
        <h2 id="task-list" className="text-lg font-semibold">Tasks</h2>
        {list.length === 0 ? (
          <p className="mt-2 text-muted">No tasks yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {list.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-3 rounded border border-line bg-surface p-3">
                <div className="min-w-0 flex-1">
                  <p className={`font-medium ${t.status === "done" ? "line-through text-muted" : ""}`}>{t.title}</p>
                  <p className="text-sm text-muted">
                    {t.priority} priority{t.due_date ? ` · due ${t.due_date}` : ""}{t.owner_name ? ` · ${t.owner_name}` : " · unassigned"}
                  </p>
                  {t.description && <p className="mt-1 text-sm">{t.description}</p>}
                </div>
                <form action={setTaskStatusAction} className="flex items-center gap-2">
                  <input type="hidden" name="task_id" value={t.id} />
                  <label className="text-sm">
                    <span className="sr-only">Status of {t.title}</span>
                    <select name="status" defaultValue={t.status} className="rounded border border-control bg-surface px-2 py-1">
                      {TASK_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                    </select>
                  </label>
                  <button className="rounded border border-control px-3 py-1 text-sm hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-focus">Update</button>
                </form>
                <form action={deleteTaskAction}>
                  <input type="hidden" name="task_id" value={t.id} />
                  <button className="rounded px-3 py-1 text-sm text-danger underline focus-visible:outline-2 focus-visible:outline-focus" aria-label={`Delete ${t.title}`}>Delete</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Shell>
  );
}
