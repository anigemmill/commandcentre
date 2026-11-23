import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asUser } from "./client";
import { migrate } from "./migrate";

/*
  Tenant isolation for every table in the tenancy and tasks migration (docs/specs/03-multi-tenancy.md §7):
  reads, inserts, updates and deletes as a person in another organisation, guessed ids, moving a row
  to another org, and the mirrors being read-only. Runs in its own throwaway database, as the people
  themselves (role `authenticated` with their token's claims), exactly as the app does.
*/
const url = process.env.TEST_DATABASE_URL;

const A = "0c0a0000-0000-4000-8000-0000000000a1"; // org A
const B = "0c0a0000-0000-4000-8000-0000000000b1"; // org B
const ownerA = "0e5e0000-0000-4000-8000-0000000000a1";
const memberA = "0e5e0000-0000-4000-8000-0000000000a2";
const ownerB = "0e5e0000-0000-4000-8000-0000000000b1";
const suspendedA = "0e5e0000-0000-4000-8000-0000000000a3";

describe.skipIf(!url)("tenancy and tasks: row level security", () => {
  const admin = postgres(url ?? "", { max: 1, onnotice: () => {} });
  const name = `tenancy_${process.pid}`;
  let sql: postgres.Sql;
  let wsA: string, wsB: string, taskA: string;

  beforeAll(async () => {
    await admin.unsafe(`drop database if exists ${name}`); // test-only throwaway database
    await admin.unsafe(`create database ${name}`);
    const u = new URL(url ?? "");
    u.pathname = `/${name}`;
    sql = postgres(u.toString(), { max: 2, onnotice: () => {} });
    await migrate(sql);
    // mirrors, written by the connection owner (as the account-event consumer will)
    await sql`insert into public.organisations (id, name) values (${A}, 'Org A'), (${B}, 'Org B')`;
    await sql`insert into public.users (id, display_name, email) values
      (${ownerA}, 'Owner A', 'a@x.test'), (${memberA}, 'Member A', 'm@x.test'), (${ownerB}, 'Owner B', 'b@x.test'), (${suspendedA}, 'Gone A', 'g@x.test')`;
    await sql`insert into public.memberships (org_id, user_id, org_role, status) values
      (${A}, ${ownerA}, 'owner', 'active'), (${A}, ${memberA}, 'member', 'active'), (${B}, ${ownerB}, 'owner', 'active'), (${A}, ${suspendedA}, 'member', 'suspended')`;
    [{ id: wsA }] = await asUser(ownerA, (tx) => tx`insert into public.workspaces (org_id, name, slug, created_by) values (${A}, 'A main', 'a-main', ${ownerA}) returning id`, sql);
    [{ id: wsB }] = await asUser(ownerB, (tx) => tx`insert into public.workspaces (org_id, name, slug, created_by) values (${B}, 'B main', 'b-main', ${ownerB}) returning id`, sql);
    [{ id: taskA }] = await asUser(memberA, (tx) => tx`insert into public.tasks (org_id, workspace_id, title, created_by) values (${A}, ${wsA}, 'A task', ${memberA}) returning id`, sql);
  });
  afterAll(async () => {
    await sql?.end();
    await admin.unsafe(`drop database if exists ${name} with (force)`);
    await admin.end();
  });

  const as = <T>(user: string, fn: (tx: postgres.TransactionSql) => Promise<T>) => asUser(user, fn, sql);
  const denied = (p: Promise<unknown>) => expect(p).rejects.toThrow(/row-level security|permission denied|violates foreign key/);

  it("leaves no public table without RLS and policies", async () => {
    expect(await sql`select * from app.tables_missing_rls`).toEqual([]);
  });

  it("shows each person only their own organisations, members, workspaces and tasks", async () => {
    expect((await as(ownerB, (tx) => tx`select id from public.organisations`)).map((r) => r.id)).toEqual([B]);
    expect(await as(ownerB, (tx) => tx`select * from public.memberships where org_id = ${A}`)).toEqual([]);
    expect(await as(ownerB, (tx) => tx`select * from public.workspaces where id = ${wsA}`)).toEqual([]);
    expect(await as(ownerB, (tx) => tx`select * from public.tasks where id = ${taskA}`)).toEqual([]);
    expect((await as(ownerB, (tx) => tx`select id from public.users order by id`)).map((r) => r.id)).toEqual([ownerB]);
    expect((await as(memberA, (tx) => tx`select id from public.tasks`)).map((r) => r.id)).toEqual([taskA]);
  });

  it("gives nothing to a suspended member or to a request with no verified person", async () => {
    expect(await as(suspendedA, (tx) => tx`select * from public.tasks`)).toEqual([]);
    expect(await as(suspendedA, (tx) => tx`select * from public.workspaces`)).toEqual([]);
    const anon = await sql.begin(async (tx) => {
      await tx`set local role authenticated`;
      return tx`select * from public.tasks`;
    });
    expect(anon).toEqual([]);
  });

  it("refuses to create rows in another organisation", async () => {
    await denied(as(ownerB, (tx) => tx`insert into public.tasks (org_id, workspace_id, title, created_by) values (${A}, ${wsA}, 'x', ${ownerB})`));
    await denied(as(ownerB, (tx) => tx`insert into public.workspaces (org_id, name, slug, created_by) values (${A}, 'x', 'x', ${ownerB})`));
    // own org id but another org's workspace: the composite foreign key refuses it
    await denied(as(ownerB, (tx) => tx`insert into public.tasks (org_id, workspace_id, title, created_by) values (${B}, ${wsA}, 'x', ${ownerB})`));
    // pretending to be someone else
    await denied(as(memberA, (tx) => tx`insert into public.tasks (org_id, workspace_id, title, created_by) values (${A}, ${wsA}, 'x', ${ownerA})`));
  });

  it("only lets owners and admins create workspaces", async () => {
    await denied(as(memberA, (tx) => tx`insert into public.workspaces (org_id, name, slug, created_by) values (${A}, 'x', 'x', ${memberA})`));
  });

  it("can't change or delete another organisation's rows, even with a guessed id", async () => {
    expect(await as(ownerB, (tx) => tx`update public.tasks set title = 'hacked' where id = ${taskA} returning id`)).toEqual([]);
    expect(await as(ownerB, (tx) => tx`delete from public.tasks where id = ${taskA} returning id`)).toEqual([]);
    expect(await as(ownerB, (tx) => tx`update public.workspaces set name = 'hacked' where id = ${wsA} returning id`)).toEqual([]);
    const [t] = await sql`select title from public.tasks where id = ${taskA}`;
    expect(t.title).toBe("A task");
  });

  it("can't move a row into another organisation", async () => {
    await denied(as(ownerA, (tx) => tx`update public.tasks set org_id = ${B}, workspace_id = ${wsB} where id = ${taskA}`));
    await denied(as(ownerA, (tx) => tx`update public.workspaces set org_id = ${B} where id = ${wsA}`));
  });

  it("keeps the account mirrors read-only for people", async () => {
    await denied(as(ownerA, (tx) => tx`insert into public.memberships (org_id, user_id, org_role) values (${B}, ${ownerA}, 'owner')`));
    await denied(as(ownerA, (tx) => tx`update public.memberships set org_role = 'owner' where user_id = ${memberA}`));
    await denied(as(ownerA, (tx) => tx`insert into public.organisations (id, name) values (gen_random_uuid(), 'x')`));
    await denied(as(ownerA, (tx) => tx`update public.users set display_name = 'x' where id = ${ownerA}`));
  });

  it("lets members of the organisation work on its tasks", async () => {
    expect(await as(memberA, (tx) => tx`update public.tasks set status = 'done' where id = ${taskA} returning status`)).toEqual([{ status: "done" }]);
    expect(await as(ownerA, (tx) => tx`delete from public.tasks where id = ${taskA} returning id`)).toEqual([{ id: taskA }]);
  });
});
