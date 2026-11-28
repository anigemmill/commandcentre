import "server-only";
import { z } from "zod";
import { asUser, db } from "./db/client";
import { devIdentityEnabled } from "./auth/dev-issuer";
import { OBJECTIVE_STATUSES, TASK_PRIORITIES, TASK_STATUSES } from "./task-options";
export { OBJECTIVE_STATUSES, TASK_PRIORITIES, TASK_STATUSES };

/*
  Service layer. Every read and write runs as the signed-in person (asUser), so RLS decides what
  they can see and change; the checks here give clear errors and validate input first.
*/
export type Org = { id: string; name: string; org_role: string };
export type Workspace = { id: string; org_id: string; name: string; slug: string };
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type Task = {
  id: string;
  workspace_id: string;
  workspace_name: string;
  objective_title: string | null;
  title: string;
  description: string;
  priority: (typeof TASK_PRIORITIES)[number];
  status: TaskStatus;
  due_date: string | null;
  owner_name: string | null;
  created_at: Date;
};

/** Development sign-in only: the seeded test people to choose from. */
export async function devPeople() {
  if (!devIdentityEnabled()) return [];
  return db()<{ id: string; display_name: string; email: string; orgs: string }[]>`
    select u.id, u.display_name, u.email,
           coalesce(string_agg(o.name || ' (' || m.org_role || ')', ', ' order by o.name), 'no organisation') as orgs
    from public.users u
    left join public.memberships m on m.user_id = u.id and m.status = 'active'
    left join public.organisations o on o.id = m.org_id
    where u.id::text like '0e5e0000-%'
    group by u.id order by u.display_name`;
}

export async function devPersonExists(id: string) {
  if (!devIdentityEnabled()) return false;
  const rows = await db()`select 1 from public.users where id = ${id} and id::text like '0e5e0000-%'`;
  return rows.length === 1;
}

/*
  Profile mirror from a verified sign-in (user id, email, name from the account service's tokens).
  Written by the service, not by people (they can only read users). Organisation memberships are
  NOT created here: they come from the account service's events (not built yet) or, in local
  development, from npm run db:seed -- --member <email>.
*/
export async function mirrorSignedInUser(u: { id: string; email: string; displayName: string }) {
  await db()`
    insert into public.users (id, display_name, email) values (${u.id}, ${u.displayName.slice(0, 120)}, ${u.email})
    on conflict (id) do update set email = excluded.email, display_name = excluded.display_name`;
}

export const me = (userId: string) =>
  asUser(userId, async (tx) => (await tx<{ id: string; display_name: string; email: string }[]>`select id, display_name, email from public.users where id = ${userId}`)[0] ?? null);

export const myOrgs = (userId: string) =>
  asUser(userId, (tx) => tx<Org[]>`
    select o.id, o.name, m.org_role from public.organisations o
    join public.memberships m on m.org_id = o.id and m.user_id = ${userId} and m.status = 'active'
    order by o.name`);

export const org = (userId: string, orgId: string) =>
  asUser(userId, async (tx) => (await tx<Org[]>`
    select o.id, o.name, m.org_role from public.organisations o
    join public.memberships m on m.org_id = o.id and m.user_id = ${userId} and m.status = 'active'
    where o.id = ${orgId}`)[0] ?? null);

export const workspaces = (userId: string, orgId: string) =>
  asUser(userId, (tx) => tx<(Workspace & { open_tasks: number })[]>`
    select w.id, w.org_id, w.name, w.slug,
           (select count(*)::int from public.tasks t where t.workspace_id = w.id and t.status <> 'done') as open_tasks
    from public.workspaces w where w.org_id = ${orgId} order by w.name`);

export const workspace = (userId: string, orgId: string, workspaceId: string) =>
  asUser(userId, async (tx) => (await tx<Workspace[]>`select id, org_id, name, slug from public.workspaces where id = ${workspaceId} and org_id = ${orgId}`)[0] ?? null);

const Name = z.string().trim().min(1, "Enter a name").max(120);
export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "workspace";

export async function createWorkspace(userId: string, orgId: string, name: string) {
  const parsed = Name.safeParse(name);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  return asUser(userId, async (tx) => {
    const [o] = await tx<{ org_role: string }[]>`select org_role from public.memberships where org_id = ${orgId} and user_id = ${userId} and status = 'active'`;
    if (!o || !["owner", "admin"].includes(o.org_role)) return { error: "Only organisation owners and admins can create workspaces" };
    let slug = slugify(parsed.data);
    const taken = await tx`select 1 from public.workspaces where org_id = ${orgId} and slug = ${slug}`;
    if (taken.length) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    const [w] = await tx<{ id: string }[]>`
      insert into public.workspaces (org_id, name, slug, created_by) values (${orgId}, ${parsed.data}, ${slug}, ${userId}) returning id`;
    return { id: w.id };
  });
}

/** Tasks in one workspace, or across the organisation when workspaceId is null. */
export const tasks = (userId: string, orgId: string, workspaceId: string | null) =>
  asUser(userId, (tx) => tx<Task[]>`
    select t.id, t.workspace_id, w.name as workspace_name, o.title as objective_title,
           t.title, t.description, t.priority, t.status, to_char(t.due_date, 'YYYY-MM-DD') as due_date,
           u.display_name as owner_name, t.created_at
    from public.tasks t
    join public.workspaces w on w.id = t.workspace_id
    left join public.users u on u.id = t.owner_id
    left join public.objectives o on o.id = t.objective_id
    where t.org_id = ${orgId} and (${workspaceId}::uuid is null or t.workspace_id = ${workspaceId})
    order by (t.status = 'done'), t.due_date nulls last,
             array_position(array['urgent','high','normal','low'], t.priority), t.created_at`);

export const TaskInput = z.object({
  title: z.string().trim().min(1, "Enter a title").max(200),
  description: z.string().trim().max(5000).default(""),
  priority: z.enum(TASK_PRIORITIES).default("normal"),
  due_date: z.union([z.literal(""), z.iso.date()]).optional().transform((v) => v || null),
  assign_to_me: z.boolean().default(false),
  objective_id: z.union([z.literal(""), z.uuid()]).optional().transform((v) => v || null),
});

export async function createTask(userId: string, orgId: string, workspaceId: string, input: z.input<typeof TaskInput>) {
  const parsed = TaskInput.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const t = parsed.data;
  return asUser(userId, async (tx) => {
    const [w] = await tx`select 1 from public.workspaces where id = ${workspaceId} and org_id = ${orgId}`;
    if (!w) return { error: "Workspace not found" };
    const [row] = await tx<{ id: string }[]>`
      insert into public.tasks (org_id, workspace_id, title, description, priority, due_date, owner_id, created_by, objective_id)
      values (${orgId}, ${workspaceId}, ${t.title}, ${t.description}, ${t.priority}, ${t.due_date}, ${t.assign_to_me ? userId : null}, ${userId}, ${t.objective_id})
      returning id`;
    return { id: row.id };
  });
}

export async function setTaskStatus(userId: string, taskId: string, status: string) {
  const s = z.enum(TASK_STATUSES).safeParse(status);
  if (!s.success) return { error: "Unknown status" };
  return asUser(userId, async (tx) => {
    const rows = await tx`update public.tasks
      set status = ${s.data}, updated_at = now(),
          completed_at = case when ${s.data} = 'done' then coalesce(completed_at, now()) else null end
      where id = ${taskId} returning id`;
    return rows.length ? { id: taskId } : { error: "Task not found" };
  });
}

export async function deleteTask(userId: string, taskId: string) {
  return asUser(userId, async (tx) => {
    const rows = await tx`delete from public.tasks where id = ${taskId} returning id`;
    return rows.length ? { id: taskId } : { error: "Task not found" };
  });
}

/* ---------- Objectives ---------- */

export type Objective = {
  id: string;
  workspace_id: string;
  workspace_name: string;
  title: string;
  status: (typeof OBJECTIVE_STATUSES)[number];
  target_date: string | null;
  owner_name: string | null;
  tasks_total: number;
  tasks_done: number;
};

export const objectives = (userId: string, orgId: string, workspaceId: string | null) =>
  asUser(userId, (tx) => tx<Objective[]>`
    select o.id, o.workspace_id, w.name as workspace_name, o.title, o.status,
           to_char(o.target_date, 'YYYY-MM-DD') as target_date, u.display_name as owner_name,
           count(t.id)::int as tasks_total, count(t.id) filter (where t.status = 'done')::int as tasks_done
    from public.objectives o
    join public.workspaces w on w.id = o.workspace_id
    left join public.users u on u.id = o.owner_id
    left join public.tasks t on t.objective_id = o.id
    where o.org_id = ${orgId} and (${workspaceId}::uuid is null or o.workspace_id = ${workspaceId})
    group by o.id, w.name, u.display_name
    order by array_position(array['active','paused','achieved','dropped'], o.status), o.target_date nulls last, o.created_at`);

export const ObjectiveInput = z.object({
  title: z.string().trim().min(1, "Enter a title").max(200),
  description: z.string().trim().max(5000).default(""),
  target_date: z.union([z.literal(""), z.iso.date()]).optional().transform((v) => v || null),
});

export async function createObjective(userId: string, orgId: string, workspaceId: string, input: z.input<typeof ObjectiveInput>) {
  const parsed = ObjectiveInput.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const o = parsed.data;
  return asUser(userId, async (tx) => {
    const [w] = await tx`select 1 from public.workspaces where id = ${workspaceId} and org_id = ${orgId}`;
    if (!w) return { error: "Workspace not found" };
    const [row] = await tx<{ id: string }[]>`
      insert into public.objectives (org_id, workspace_id, title, description, target_date, owner_id, created_by)
      values (${orgId}, ${workspaceId}, ${o.title}, ${o.description}, ${o.target_date}, ${userId}, ${userId}) returning id`;
    return { id: row.id };
  });
}

export async function setObjectiveStatus(userId: string, objectiveId: string, status: string) {
  const s = z.enum(OBJECTIVE_STATUSES).safeParse(status);
  if (!s.success) return { error: "Unknown status" };
  return asUser(userId, async (tx) => {
    const rows = await tx`update public.objectives set status = ${s.data}, updated_at = now() where id = ${objectiveId} returning id`;
    return rows.length ? { id: objectiveId } : { error: "Objective not found" };
  });
}

/* ---------- Home dashboard ---------- */

/** The organisation's day. Workspaces carry a timezone; the MVP home uses New Zealand time. */
export const HOME_TIMEZONE = "Pacific/Auckland";
/** Today's date (YYYY-MM-DD) in the home timezone. */
export const homeToday = (now = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: HOME_TIMEZONE }).format(now);

export type DatedItem = { kind: "task" | "objective"; id: string; title: string; date: string; workspace_id: string; workspace_name: string; priority: string | null };
export type ActivityItem = { at: Date; actor: string | null; verb: string; title: string; workspace_id: string; workspace_name: string };

export async function homeDashboard(userId: string, orgId: string) {
  return asUser(userId, async (tx) => {
    const today = homeToday();

    const focus = await tx<Task[]>`
      select t.id, t.workspace_id, w.name as workspace_name, null as objective_title, t.title, t.description, t.priority,
             t.status, to_char(t.due_date, 'YYYY-MM-DD') as due_date, u.display_name as owner_name, t.created_at
      from public.tasks t join public.workspaces w on w.id = t.workspace_id
      left join public.users u on u.id = t.owner_id
      where t.org_id = ${orgId} and t.status <> 'done'
        and (t.due_date <= ${today}::date or t.priority in ('urgent', 'high') or t.status = 'blocked')
      order by (t.due_date < ${today}::date) desc, array_position(array['urgent','high','normal','low'], t.priority),
               t.due_date nulls last
      limit 7`;

    const [counts] = await tx<{ open: number; overdue: number; due_today: number; blocked: number; done_week: number }[]>`
      select count(*) filter (where status <> 'done')::int as open,
             count(*) filter (where status <> 'done' and due_date < ${today}::date)::int as overdue,
             count(*) filter (where status <> 'done' and due_date = ${today}::date)::int as due_today,
             count(*) filter (where status = 'blocked')::int as blocked,
             count(*) filter (where status = 'done' and completed_at >= now() - interval '7 days')::int as done_week
      from public.tasks where org_id = ${orgId}`;

    const upcoming = await tx<DatedItem[]>`
      select * from (
        select 'task' as kind, t.id, t.title, to_char(t.due_date, 'YYYY-MM-DD') as date, t.workspace_id, w.name as workspace_name, t.priority
        from public.tasks t join public.workspaces w on w.id = t.workspace_id
        where t.org_id = ${orgId} and t.status <> 'done' and t.due_date > ${today}::date and t.due_date <= ${today}::date + 30
        union all
        select 'objective', o.id, o.title, to_char(o.target_date, 'YYYY-MM-DD'), o.workspace_id, w.name, null
        from public.objectives o join public.workspaces w on w.id = o.workspace_id
        where o.org_id = ${orgId} and o.status = 'active' and o.target_date >= ${today}::date and o.target_date <= ${today}::date + 90
      ) d order by date, kind limit 6`;

    const activity = await tx<ActivityItem[]>`
      select * from (
        select t.completed_at as at, null::text as actor, 'completed' as verb, t.title, t.workspace_id, w.name as workspace_name
        from public.tasks t join public.workspaces w on w.id = t.workspace_id
        where t.org_id = ${orgId} and t.completed_at is not null
        union all
        select t.created_at, u.display_name, 'added task', t.title, t.workspace_id, w.name
        from public.tasks t join public.workspaces w on w.id = t.workspace_id join public.users u on u.id = t.created_by
        where t.org_id = ${orgId}
        union all
        select o.created_at, u.display_name, 'set objective', o.title, o.workspace_id, w.name
        from public.objectives o join public.workspaces w on w.id = o.workspace_id join public.users u on u.id = o.created_by
        where o.org_id = ${orgId}
        union all
        select w.created_at, u.display_name, 'created workspace', w.name, w.id, w.name
        from public.workspaces w left join public.users u on u.id = w.created_by
        where w.org_id = ${orgId}
      ) a order by at desc limit 6`;

    const goals = await tx<Objective[]>`
      select o.id, o.workspace_id, w.name as workspace_name, o.title, o.status,
             to_char(o.target_date, 'YYYY-MM-DD') as target_date, null as owner_name,
             count(t.id)::int as tasks_total, count(t.id) filter (where t.status = 'done')::int as tasks_done
      from public.objectives o join public.workspaces w on w.id = o.workspace_id
      left join public.tasks t on t.objective_id = o.id
      where o.org_id = ${orgId} and o.status = 'active'
      group by o.id, w.name order by o.target_date nulls last, o.created_at limit 4`;

    const spaces = await tx<{ id: string; name: string; open_tasks: number; next_due: string | null; active_objectives: number }[]>`
      select w.id, w.name,
             (select count(*)::int from public.tasks t where t.workspace_id = w.id and t.status <> 'done') as open_tasks,
             (select to_char(min(t.due_date), 'YYYY-MM-DD') from public.tasks t where t.workspace_id = w.id and t.status <> 'done' and t.due_date >= ${today}::date) as next_due,
             (select count(*)::int from public.objectives o where o.workspace_id = w.id and o.status = 'active') as active_objectives
      from public.workspaces w where w.org_id = ${orgId} order by w.name`;

    return { today, focus, counts, upcoming, activity, goals, spaces };
  });
}
