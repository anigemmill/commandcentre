-- Objectives (MVP subset of M6) and what the home dashboard needs from tasks.
-- docs/specs/02-data-model.md "Strategy and growth" and "Work management".
--
-- MVP difference from spec 02: objectives belong to a workspace directly. `strategy_id` is added
-- (nullable) when strategies are built in M6; nothing here has to change for that.
-- Progress is never stored: it is derived from the tasks linked to the objective (spec 09 §5).

create table public.objectives (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  workspace_id uuid not null,
  title text not null check (length(btrim(title)) between 1 and 200),
  description text not null default '' check (length(description) <= 5000),
  status text not null default 'active' check (status in ('active', 'achieved', 'paused', 'dropped')),
  target_date date,
  owner_id uuid references public.users (id),
  created_by uuid not null references public.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (workspace_id, org_id) references public.workspaces (id, org_id) on delete cascade,
  unique (id, workspace_id, org_id)          -- target for tasks.objective_id below
);
create index objectives_workspace on public.objectives (workspace_id, status);

-- A task may contribute to one objective in the same workspace and organisation.
alter table public.tasks add column objective_id uuid;
alter table public.tasks add column completed_at timestamptz;
alter table public.tasks
  add constraint tasks_objective_same_workspace
  foreign key (objective_id, workspace_id, org_id) references public.objectives (id, workspace_id, org_id) on delete set null (objective_id);
create index tasks_objective on public.tasks (objective_id) where objective_id is not null;
create index tasks_due on public.tasks (org_id, due_date) where status <> 'done';

alter table public.objectives enable row level security;
grant select, insert, update, delete on public.objectives to authenticated;
create policy objectives_read on public.objectives for select to authenticated
  using (app.is_member(org_id));
create policy objectives_insert on public.objectives for insert to authenticated
  with check (app.is_member(org_id) and created_by = app.current_principal_user());
create policy objectives_update on public.objectives for update to authenticated
  using (app.is_member(org_id)) with check (app.is_member(org_id));
create policy objectives_delete on public.objectives for delete to authenticated
  using (app.is_org_admin(org_id));
