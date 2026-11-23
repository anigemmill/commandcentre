import Link from "next/link";
import { cx, PageHeader } from "@/components/ui";
import { TaskTable } from "@/components/task-table";
import { requirePrincipal } from "@/server/auth/session";
import { homeToday, tasks } from "@/server/data";

export const metadata = { title: "Tasks · Command Centre" };

const VIEWS = {
  open: { label: "Open", empty: "No open tasks." },
  today: { label: "Due today", empty: "Nothing due today." },
  overdue: { label: "Overdue", empty: "Nothing overdue." },
  blocked: { label: "Blocked", empty: "Nothing blocked." },
  done: { label: "Done", empty: "No completed tasks yet." },
  all: { label: "All", empty: "No tasks yet. Add them from a workspace." },
} as const;
type View = keyof typeof VIEWS;

export default async function Tasks({ params, searchParams }: { params: Promise<{ orgId: string }>; searchParams: Promise<{ view?: string }> }) {
  const p = await requirePrincipal();
  const { orgId } = await params;
  const raw = (await searchParams).view;
  const view: View = raw && raw in VIEWS ? (raw as View) : "open";
  const all = await tasks(p.userId, orgId, null);
  const today = homeToday();
  const pick: Record<View, (t: (typeof all)[number]) => boolean> = {
    open: (t) => t.status !== "done",
    today: (t) => t.status !== "done" && t.due_date === today,
    overdue: (t) => t.status !== "done" && !!t.due_date && t.due_date < today,
    blocked: (t) => t.status === "blocked",
    done: (t) => t.status === "done",
    all: () => true,
  };
  const shown = all.filter(pick[view]);
  return (
    <>
      <PageHeader eyebrow="Across all workspaces" title="Tasks" />
      <nav aria-label="Task views" className="mb-6 flex flex-wrap gap-1">
        {(Object.keys(VIEWS) as View[]).map((v) => (
          <Link
            key={v}
            href={v === "open" ? `/orgs/${orgId}/tasks` : `/orgs/${orgId}/tasks?view=${v}`}
            aria-current={v === view ? "page" : undefined}
            className={cx("rounded-pill px-3 py-1.5 text-sm", v === view ? "bg-accent-soft font-medium text-on-accent-soft" : "text-muted hover:bg-surface-muted hover:text-ink")}
          >
            {VIEWS[v].label} <span className="font-mono text-xs tabular-nums">{all.filter(pick[v]).length}</span>
          </Link>
        ))}
      </nav>
      <TaskTable tasks={shown} today={today} orgId={orgId} showWorkspace empty={VIEWS[view].empty} />
    </>
  );
}
