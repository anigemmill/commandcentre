import Link from "next/link";
import { ButtonLink, DueLabel, Eyebrow, EmptyState, formatDate, PriorityLabel, Progress, relativeDay, Section, TaskStatusIndicator, TextLink, timeAgo } from "@/components/ui";
import { requirePrincipal } from "@/server/auth/session";
import { HOME_TIMEZONE, homeDashboard, me, org } from "@/server/data";

export const metadata = { title: "Today · Command Centre" };

function greeting(now: Date) {
  const hour = Number(new Intl.DateTimeFormat("en-NZ", { hour: "numeric", hourCycle: "h23", timeZone: HOME_TIMEZONE }).format(now));
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export default async function Today({ params }: { params: Promise<{ orgId: string }> }) {
  const p = await requirePrincipal();
  const { orgId } = await params;
  const [person, o, d] = await Promise.all([me(p.userId), org(p.userId, orgId), homeDashboard(p.userId, orgId)]);
  if (!person || !o) return null; // the layout has already refused non-members
  const now = new Date();
  const first = person.display_name.split(" ")[0];
  const base = `/orgs/${orgId}`;
  const { counts } = d;

  const summary =
    counts.open === 0
      ? "Nothing open right now. A clear desk."
      : [
          counts.due_today ? `${plural(counts.due_today, "thing")} due today` : "nothing due today",
          counts.overdue ? `${counts.overdue} overdue` : null,
          counts.blocked ? `${counts.blocked} blocked` : null,
        ]
          .filter(Boolean)
          .join(", ")
          .replace(/^./, (c) => c.toUpperCase()) + `. ${plural(counts.done_week, "task")} completed this week.`;

  const pulse = [
    { label: "Due today", value: counts.due_today, href: `${base}/tasks?view=today` },
    { label: "Overdue", value: counts.overdue, href: `${base}/tasks?view=overdue`, alert: counts.overdue > 0 },
    { label: "Blocked", value: counts.blocked, href: `${base}/tasks?view=blocked`, alert: counts.blocked > 0 },
    { label: "Open", value: counts.open, href: `${base}/tasks` },
    { label: "Done this week", value: counts.done_week, href: `${base}/tasks?view=done` },
  ];

  return (
    <>
      <header className="pb-12">
        <Eyebrow>
          {formatDate(d.today, { weekday: "long", day: "numeric", month: "long" })} · {o.name}
        </Eyebrow>
        <h1 className="mt-4 font-display text-[2.5rem] leading-[1.1] tracking-tight md:text-[3.25rem]">
          {greeting(now)}, {first}.
        </h1>
        <p className="mt-4 max-w-[60ch] text-md text-muted">{summary}</p>
      </header>

      <nav aria-label="At a glance" className="mb-14 border-y border-line">
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {pulse.map((item, i) => (
            <li key={item.label} className={i > 0 ? "lg:border-l lg:border-line" : undefined}>
              <Link href={item.href} className="group block px-1 py-5 lg:px-6 lg:first:pl-0">
                <span className={`block font-mono text-3xl tabular-nums ${item.alert ? "text-danger" : "text-ink"}`}>{item.value}</span>
                <span className="mt-1 block text-sm text-muted group-hover:text-ink">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="flex flex-col gap-14 lg:col-span-7">
          <Section label="Focus" action={<TextLink href={`${base}/tasks`}>All tasks</TextLink>}>
            {d.focus.length === 0 ? (
              <EmptyState>Nothing urgent, overdue or blocked. Use the time for the bigger things.</EmptyState>
            ) : (
              <ol className="mt-1 divide-y divide-line rounded-lg bg-surface px-5 shadow-1">
                {d.focus.map((t) => (
                  <li key={t.id} className="flex items-start gap-4 py-4">
                    <span className="pt-1"><TaskStatusIndicator status={t.status} hideLabel /></span>
                    <div className="min-w-0 flex-1">
                      <Link href={`${base}/w/${t.workspace_id}`} className="font-medium text-ink hover:underline">
                        {t.title}
                      </Link>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                        <span>{t.workspace_name}</span>
                        <PriorityLabel priority={t.priority} />
                        {t.status === "blocked" && <span className="text-danger">Blocked</span>}
                      </p>
                    </div>
                    <DueLabel date={t.due_date} today={d.today} />
                  </li>
                ))}
              </ol>
            )}
          </Section>

          <Section label="Objectives" action={<TextLink href={`${base}/objectives`}>All objectives</TextLink>}>
            {d.goals.length === 0 ? (
              <EmptyState>No active objectives yet. Set one from a workspace to see progress here.</EmptyState>
            ) : (
              <ul className="divide-y divide-line">
                {d.goals.map((g) => (
                  <li key={g.id} className="grid gap-3 py-5 sm:grid-cols-[1fr_12rem] sm:items-center sm:gap-8">
                    <div className="min-w-0">
                      <p className="font-display text-lg leading-snug">{g.title}</p>
                      <p className="mt-1 text-sm text-muted">
                        {g.workspace_name}
                        {g.target_date && <> · by {formatDate(g.target_date, { day: "numeric", month: "short", year: "numeric" })}</>}
                      </p>
                    </div>
                    <Progress done={g.tasks_done} total={g.tasks_total} label={`Progress on ${g.title}`} />
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        <div className="flex flex-col gap-14 lg:col-span-5">
          <Section label="Coming up">
            {d.upcoming.length === 0 ? (
              <EmptyState>No dates in the next 30 days.</EmptyState>
            ) : (
              <ul>
                {d.upcoming.map((u) => (
                  <li key={`${u.kind}-${u.id}`} className="grid grid-cols-[5.5rem_1fr] gap-4 border-b border-line py-3.5 last:border-0">
                    <time dateTime={u.date} className="font-mono text-xs uppercase tabular-nums leading-6 text-muted">
                      {relativeDay(u.date, d.today).length <= 9 ? relativeDay(u.date, d.today) : formatDate(u.date, { day: "numeric", month: "short" })}
                    </time>
                    <div className="min-w-0">
                      <p className="truncate text-base text-ink">{u.title}</p>
                      <p className="text-sm text-muted">{u.kind === "objective" ? "Objective target" : u.workspace_name}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section label="Workspaces" action={<TextLink href={`${base}/workspaces`}>Manage</TextLink>}>
            {d.spaces.length === 0 ? (
              <div className="py-4">
                <EmptyState>No workspaces yet. A workspace is one business or business unit.</EmptyState>
                {(o.org_role === "owner" || o.org_role === "admin") && <ButtonLink variant="primary" href={`${base}/workspaces`}>Create a workspace</ButtonLink>}
              </div>
            ) : (
              <ul>
                {d.spaces.map((w) => (
                  <li key={w.id} className="border-b border-line last:border-0">
                    <Link href={`${base}/w/${w.id}`} className="group flex items-baseline justify-between gap-4 py-3.5">
                      <span className="font-medium text-ink group-hover:underline">{w.name}</span>
                      <span className="shrink-0 text-sm text-muted">
                        {plural(w.open_tasks, "open task")}
                        {w.active_objectives > 0 && ` · ${plural(w.active_objectives, "objective")}`}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section label="Activity">
            {d.activity.length === 0 ? (
              <EmptyState>Activity in this organisation will appear here.</EmptyState>
            ) : (
              <ul className="flex flex-col gap-4 pt-2">
                {d.activity.map((a, i) => (
                  <li key={i} className="text-sm leading-relaxed">
                    {a.actor ? <><span className="text-ink">{a.actor}</span> <span className="text-muted">{a.verb}</span></> : <span className="text-muted">Completed</span>}{" "}
                    <span className="text-ink">{a.title}</span>
                    <span className="block font-mono text-xs text-muted">
                      {timeAgo(new Date(a.at), now)}
                      {a.verb !== "created workspace" && ` · ${a.workspace_name}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}
