import Link from "next/link";
import { deleteTaskAction, setObjectiveStatusAction, setTaskStatusAction } from "@/app/actions";
import { StatusSelect } from "@/components/forms";
import { DueLabel, EmptyState, formatDate, ObjectiveStatusLabel, PriorityLabel, Progress, TaskStatusIndicator, tableClass, tdClass, thClass } from "@/components/ui";
import type { Objective, Task } from "@/server/data";
import { OBJECTIVE_STATUS_LABEL, OBJECTIVE_STATUSES, STATUS_LABEL, TASK_STATUSES } from "@/server/task-options";

const statusOptions = TASK_STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] }));

/** Tasks as a table (spec 09 §5): secondary columns drop away on small screens. */
export function TaskTable({ tasks, today, orgId, showWorkspace, empty }: { tasks: Task[]; today: string; orgId: string; showWorkspace?: boolean; empty: string }) {
  if (tasks.length === 0) return <EmptyState>{empty}</EmptyState>;
  return (
    <table className={tableClass}>
      <thead>
        <tr>
          <th scope="col" className={thClass}>Task</th>
          {showWorkspace && <th scope="col" className={`${thClass} hidden md:table-cell`}>Workspace</th>}
          <th scope="col" className={`${thClass} hidden sm:table-cell`}>Priority</th>
          <th scope="col" className={thClass}>Due</th>
          <th scope="col" className={thClass}>Status</th>
          <th scope="col" className={thClass}><span className="sr-only">Actions</span></th>
        </tr>
      </thead>
      <tbody>
        {tasks.map((t) => (
          <tr key={t.id} className="group">
            <td className={tdClass}>
              <div className="flex items-start gap-3">
                <span className="pt-1"><TaskStatusIndicator status={t.status} hideLabel /></span>
                <div className="min-w-0">
                  <p className={t.status === "done" ? "text-muted line-through" : "font-medium text-ink"}>{t.title}</p>
                  {(t.description || t.objective_title || t.owner_name) && (
                    <p className="mt-0.5 text-sm text-muted">
                      {[t.owner_name, t.objective_title && `→ ${t.objective_title}`, t.description].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
              </div>
            </td>
            {showWorkspace && (
              <td className={`${tdClass} hidden text-muted md:table-cell`}>
                <Link href={`/orgs/${orgId}/w/${t.workspace_id}`} className="hover:text-ink hover:underline">{t.workspace_name}</Link>
              </td>
            )}
            <td className={`${tdClass} hidden sm:table-cell`}><PriorityLabel priority={t.priority} /></td>
            <td className={tdClass}><DueLabel date={t.due_date} today={today} done={t.status === "done"} /></td>
            <td className={tdClass}>
              <StatusSelect action={setTaskStatusAction} idName="task_id" id={t.id} value={t.status} options={statusOptions} label={`Status of ${t.title}`} />
            </td>
            <td className={`${tdClass} text-right`}>
              <form action={deleteTaskAction}>
                <input type="hidden" name="task_id" value={t.id} />
                <button aria-label={`Delete ${t.title}`} className="rounded-sm px-2 py-1 text-sm text-muted transition-opacity duration-(--oi-duration-fast) hover:text-danger lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100">
                  Delete
                </button>
              </form>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const objectiveOptions = OBJECTIVE_STATUSES.map((s) => ({ value: s, label: OBJECTIVE_STATUS_LABEL[s] }));

export function ObjectiveList({ objectives, showWorkspace, empty }: { objectives: Objective[]; showWorkspace?: boolean; empty: string }) {
  if (objectives.length === 0) return <EmptyState>{empty}</EmptyState>;
  return (
    <ul className="divide-y divide-line">
      {objectives.map((o) => (
        <li key={o.id} className="grid gap-4 py-5 md:grid-cols-[1fr_11rem_9rem] md:items-center md:gap-8">
          <div className="min-w-0">
            <ObjectiveStatusLabel status={o.status} />
            <p className="mt-1 font-display text-lg leading-snug">{o.title}</p>
            <p className="mt-1 text-sm text-muted">
              {[showWorkspace && o.workspace_name, o.target_date && `Target ${formatDate(o.target_date, { day: "numeric", month: "short", year: "numeric" })}`, o.owner_name].filter(Boolean).join(" · ")}
            </p>
          </div>
          <Progress done={o.tasks_done} total={o.tasks_total} label={`Progress on ${o.title}`} />
          <StatusSelect action={setObjectiveStatusAction} idName="objective_id" id={o.id} value={o.status} options={objectiveOptions} label={`Status of ${o.title}`} />
        </li>
      ))}
    </ul>
  );
}
