import "server-only";
import { z } from "zod";
import { asUser, db } from "./db/client";
import { devIdentityEnabled } from "./auth/dev-issuer";
import { TASK_PRIORITIES, TASK_STATUSES } from "./task-options";
export { TASK_PRIORITIES, TASK_STATUSES };

/*
  Service layer. Every read and write runs as the signed-in person (asUser), so RLS decides what
  they can see and change; the checks here give clear errors and validate input first.
*/
export type Org = { id: string; name: string; org_role: string };
export type Workspace = { id: string; org_id: string; name: string; slug: string };
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type Task = {
  id: string;
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
    group by u.id order by u.display_name`;
}

export async function devPersonExists(id: string) {
  if (!devIdentityEnabled()) return false;
  const rows = await db()`select 1 from public.users where id = ${id}`;
  return rows.length === 1;
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

export const tasks = (userId: string, workspaceId: string) =>
  asUser(userId, (tx) => tx<Task[]>`
    select t.id, t.title, t.description, t.priority, t.status, to_char(t.due_date, 'YYYY-MM-DD') as due_date,
           u.display_name as owner_name, t.created_at
    from public.tasks t left join public.users u on u.id = t.owner_id
    where t.workspace_id = ${workspaceId}
    order by (t.status = 'done'), t.due_date nulls last, t.created_at`);

export const TaskInput = z.object({
  title: z.string().trim().min(1, "Enter a title").max(200),
  description: z.string().trim().max(5000).default(""),
  priority: z.enum(TASK_PRIORITIES).default("normal"),
  due_date: z.union([z.literal(""), z.iso.date()]).optional().transform((v) => v || null),
  assign_to_me: z.boolean().default(false),
});

export async function createTask(userId: string, orgId: string, workspaceId: string, input: z.input<typeof TaskInput>) {
  const parsed = TaskInput.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const t = parsed.data;
  return asUser(userId, async (tx) => {
    const [w] = await tx`select 1 from public.workspaces where id = ${workspaceId} and org_id = ${orgId}`;
    if (!w) return { error: "Workspace not found" };
    const [row] = await tx<{ id: string }[]>`
      insert into public.tasks (org_id, workspace_id, title, description, priority, due_date, owner_id, created_by)
      values (${orgId}, ${workspaceId}, ${t.title}, ${t.description}, ${t.priority}, ${t.due_date}, ${t.assign_to_me ? userId : null}, ${userId})
      returning id`;
    return { id: row.id };
  });
}

export async function setTaskStatus(userId: string, taskId: string, status: string) {
  const s = z.enum(TASK_STATUSES).safeParse(status);
  if (!s.success) return { error: "Unknown status" };
  return asUser(userId, async (tx) => {
    const rows = await tx`update public.tasks set status = ${s.data}, updated_at = now() where id = ${taskId} returning id`;
    return rows.length ? { id: taskId } : { error: "Task not found" };
  });
}

export async function deleteTask(userId: string, taskId: string) {
  return asUser(userId, async (tx) => {
    const rows = await tx`delete from public.tasks where id = ${taskId} returning id`;
    return rows.length ? { id: taskId } : { error: "Task not found" };
  });
}
