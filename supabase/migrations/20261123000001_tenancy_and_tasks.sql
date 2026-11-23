-- MVP subset of M2b (tenancy) and M5 (tasks): account mirrors, workspaces and tasks.
-- docs/specs/02-data-model.md §2, docs/specs/03-multi-tenancy.md.
--
-- users, organisations and memberships are MIRRORS of the Outside In account service. In production
-- they are written only by the account-event consumer (not built yet), never by people. In
-- development they are filled by scripts/dev-seed.ts. People can only read them, within their orgs.

create table public.users (
  id uuid primary key,                       -- the account service user id (token `sub`)
  display_name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

create table public.organisations (
  id uuid primary key,
  name text not null,
  kind text not null default 'business' check (kind in ('business', 'agency', 'enterprise')),
  created_at timestamptz not null default now()
);

create table public.memberships (
  org_id uuid not null references public.organisations (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  org_role text not null check (org_role in ('owner', 'admin', 'member')),
  status text not null default 'active' check (status in ('active', 'suspended', 'removed')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations (id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 120),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  timezone text not null default 'Pacific/Auckland',
  created_by uuid references public.users (id),
  created_at timestamptz not null default now(),
  unique (org_id, slug),
  unique (id, org_id)                        -- target of the composite foreign keys below
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  workspace_id uuid not null,
  title text not null check (length(btrim(title)) between 1 and 200),
  description text not null default '' check (length(description) <= 5000),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'blocked', 'in_review', 'done')),
  due_date date,
  owner_id uuid references public.users (id),
  created_by uuid not null references public.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- a task cannot point at a workspace in another organisation (02 §4)
  foreign key (workspace_id, org_id) references public.workspaces (id, org_id) on delete cascade
);
create index tasks_workspace_status on public.tasks (workspace_id, status);

-- Who is asking: the verified token's subject, set per transaction by the service layer.
create or replace function app.current_principal_user() returns uuid
language sql stable as $$ select auth.uid() $$;

-- Membership checks run as the function owner so policies on memberships don't recurse.
create or replace function app.is_member(p_org uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = p_org and m.user_id = app.current_principal_user() and m.status = 'active'
  )
$$;

create or replace function app.is_org_admin(p_org uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = p_org and m.user_id = app.current_principal_user() and m.status = 'active'
      and m.org_role in ('owner', 'admin')
  )
$$;

create or replace function app.shares_org_with(p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships a
    join public.memberships b on b.org_id = a.org_id and b.status = 'active'
    where a.user_id = app.current_principal_user() and a.status = 'active' and b.user_id = p_user
  )
$$;

revoke all on function app.current_principal_user(), app.is_member(uuid), app.is_org_admin(uuid), app.shares_org_with(uuid) from public;
grant execute on function app.current_principal_user(), app.is_member(uuid), app.is_org_admin(uuid), app.shares_org_with(uuid) to authenticated;

alter table public.users enable row level security;
alter table public.organisations enable row level security;
alter table public.memberships enable row level security;
alter table public.workspaces enable row level security;
alter table public.tasks enable row level security;

-- Mirrors: read-only for people.
grant select on public.users, public.organisations, public.memberships to authenticated;
create policy users_read on public.users for select to authenticated
  using (id = app.current_principal_user() or app.shares_org_with(id));
create policy organisations_read on public.organisations for select to authenticated
  using (app.is_member(id));
create policy memberships_read on public.memberships for select to authenticated
  using (app.is_member(org_id));

-- Workspaces: members read; owners and admins create and rename.
grant select, insert, update on public.workspaces to authenticated;
create policy workspaces_read on public.workspaces for select to authenticated
  using (app.is_member(org_id));
create policy workspaces_insert on public.workspaces for insert to authenticated
  with check (app.is_org_admin(org_id) and created_by = app.current_principal_user());
create policy workspaces_update on public.workspaces for update to authenticated
  using (app.is_org_admin(org_id)) with check (app.is_org_admin(org_id));

-- Tasks: any active member of the organisation.
grant select, insert, update, delete on public.tasks to authenticated;
create policy tasks_read on public.tasks for select to authenticated
  using (app.is_member(org_id));
create policy tasks_insert on public.tasks for insert to authenticated
  with check (app.is_member(org_id) and created_by = app.current_principal_user());
create policy tasks_update on public.tasks for update to authenticated
  using (app.is_member(org_id)) with check (app.is_member(org_id));
create policy tasks_delete on public.tasks for delete to authenticated
  using (app.is_member(org_id));
