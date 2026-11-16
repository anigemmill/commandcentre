# 03 · Multi-tenant architecture

Status: proposed. Covers blueprint §6 and §27–§28.

## 1. Hierarchy

People and organisations live in the shared Outside In account (`13`); the same organisation id is the
tenant in every product. Workspaces and brands below are Command Centre's own.

```
Organisation (tenant, billing unit, isolation boundary)
 ├─ Workspace (a business or business unit: its own profile, strategy, projects, integrations)
 │   ├─ Brand (positioning, voice, visual guidelines)
 │   └─ Location
 └─ Teams, memberships, subscription, audit log
```

| Customer shape (§6) | Modelled as |
|---|---|
| Single business | 1 organisation, 1 workspace, 1 brand |
| Multi-brand business | 1 organisation, 1 workspace, several brands |
| Several business units | 1 organisation, several workspaces |
| Multiple locations | Locations under a workspace |
| Agency | Agency organisation + `org_relationships` to each client organisation |
| Separate client organisations | Each client is its own organisation; client data never sits in the agency org |
| Enterprise | 1 organisation, many workspaces, teams and (Phase 4) custom roles and SSO |

## 2. Isolation

- **Boundary:** the organisation. Every customer-data row carries `org_id`. RLS on every table, no
  permissive defaults; a CI check fails if any `public` table lacks RLS or policies.
- **Policy helper:**

```sql
create function app.has_permission(p_org uuid, p_workspace uuid, p_perm text)
returns boolean language sql stable security definer
set search_path = app, public, pg_temp as $$
  select exists (
    select 1
    from memberships m                          -- mirror from accounts (13)
    join cc_access a on a.org_id = m.org_id and a.user_id = m.user_id
    join role_permissions rp on rp.role_id = a.role_id
    where m.user_id = app.current_principal_user()
      and m.org_id = p_org
      and m.status = 'active'
      and app.org_has_product(p_org, 'command_centre')  -- subscription mirror
      and rp.permission_key = p_perm
      and (a.workspace_ids is null or p_workspace = any(a.workspace_ids))
  ) and app.principal_allows(p_perm);  -- narrows further for agent and integration principals
$$;
```

- `app.current_principal_user()` reads `auth.uid()`, which comes from the shared-account token the
  server verified and set as `request.jwt.claims` for the transaction (`13` §2). `app.principal_allows()` reads a per-transaction
  setting (`set local app.principal = …`) that the service layer sets for agent runs and integration
  calls, so an agent can do **less** than its authorising user, never more.
- Every insert/update policy has `with check`, so a row cannot be moved to another org by editing `org_id`.
- Composite foreign keys keep parents and children in the same org (see `02` §4).
- The service role bypasses RLS. Only the job worker uses it, for system tasks (sync scheduling, purges,
  billing webhooks), and those queries filter `org_id` explicitly. Agent runs **do not** use it.

## 3. Agencies

- An agency organisation links to a client organisation through `org_relationships`. The **client
  organisation's owner** must accept it, and either side can end it.
- Agency staff get **delegated memberships** in the client org (`delegated_from_org_id` set), with a
  role chosen by the client. They then act inside the client org like any member, and every action is
  audited in the client org.
- The agency's dashboard across clients is built from per-client queries the user is entitled to, not a
  cross-tenant table. No agency-level query ever reads client rows directly.
- Ending the relationship revokes every delegated membership in one transaction.
- White-label (Phase 4) is a theming and domain concern only and does not change isolation.

## 4. The active context

The URL carries the context: `/{orgSlug}/{workspaceSlug}/…`. The server resolves it against the user's
memberships on every request. Nothing from the client (headers, cookies, body) is trusted as the
tenant. The brand selector filters views but is not a security boundary unless the membership is
brand-scoped.

## 5. AI and tenancy

- Knowledge retrieval (`document_chunks`) runs as the principal, under RLS, and is then filtered by the
  agent's `knowledge_scope`.
- Prompts are assembled per run from that organisation's data only. No cross-customer caching of
  completions; provider-side prompt caching is per organisation and per prompt prefix.
- Model providers are used under terms that exclude training on customer data (to be confirmed per
  provider before launch).

## 6. Data lifecycle

| Operation | Behaviour |
|---|---|
| Export | Organisation owner starts a job; JSON per table plus files, delivered as a signed link valid 24 h |
| Delete record | Soft delete; restorable for 30 days; then purged by job, audit event kept |
| Close organisation | Owner-confirmed; 30-day grace, then all rows and R2 objects purged; billing and audit retained as law requires |
| Retention | Agent run steps 13 months, audit events 7 years [CONFIRM with owner], metrics indefinitely |

## 7. Required isolation tests

Two organisations, users in each plus an agency user delegated into one. For **every** table and every
operation (select, insert, update, delete), including guessed ids and `org_id` changes on update:

1. A member of A sees and changes nothing in B.
2. A workspace-scoped member sees only their workspaces.
3. An agent principal of A cannot read B, and cannot exceed its own permission list inside A.
4. A delegated agency user loses all access the moment the relationship ends.
5. Retrieval over `document_chunks` never returns another org's chunks.
6. Signed file URLs cannot be minted for another org's files.

These run in CI against the local Supabase stack, on every pull request.
