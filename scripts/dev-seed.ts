/*
  DEVELOPMENT ONLY (npm run db:seed). Fills the account mirrors (users, organisations, memberships)
  with test people, standing in for the account-event consumer that will fill them in production.
  Refuses any database that isn't on this machine. Safe to run repeatedly.

  Test people (choose one on the development sign-in page):
    Aroha Test   owner of "Test Org: Coastal Tours"
    Ben Test     member of "Test Org: Coastal Tours"
    Casey Test   owner of "Test Org: Alpine Lodge"  (cannot see Coastal Tours: isolation check)

  npm run db:seed -- --member you@example.com [owner|admin|member]
    adds a real Outside In account (after its first sign-in to Command Centre) to "Test Org: Coastal
    Tours", standing in for the membership events the account service will send.

  Also adds sample workspaces, objectives and tasks to Coastal Tours (dates relative to today), only
  when that organisation has no workspaces yet, so the dashboard has something real to show.
*/
import postgres from "postgres";
import { classifyDatabaseUrl } from "../src/server/db/migration-target";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("✗ DATABASE_URL is not set. For local development run: npm run setup");
  process.exit(1);
}
if (classifyDatabaseUrl(url).kind !== "local") {
  console.error("✗ Refusing to seed test data into a database that isn't local.");
  process.exit(1);
}

const ORGS = [
  { id: "0c0a0000-0000-4000-8000-000000000001", name: "Test Org: Coastal Tours" },
  { id: "0c0a0000-0000-4000-8000-000000000002", name: "Test Org: Alpine Lodge" },
];
const PEOPLE = [
  { id: "0e5e0000-0000-4000-8000-00000000000a", name: "Aroha Test", email: "aroha@example.test", org: 0, role: "owner" },
  { id: "0e5e0000-0000-4000-8000-00000000000b", name: "Ben Test", email: "ben@example.test", org: 0, role: "member" },
  { id: "0e5e0000-0000-4000-8000-00000000000c", name: "Casey Test", email: "casey@example.test", org: 1, role: "owner" },
];

const sql = postgres(url, { max: 1, onnotice: () => {} });
try {
  await sql.begin(async (tx) => {
    for (const o of ORGS) await tx`insert into public.organisations (id, name) values (${o.id}, ${o.name}) on conflict (id) do nothing`;
    for (const p of PEOPLE) {
      await tx`insert into public.users (id, display_name, email) values (${p.id}, ${p.name}, ${p.email}) on conflict (id) do nothing`;
      await tx`insert into public.memberships (org_id, user_id, org_role) values (${ORGS[p.org].id}, ${p.id}, ${p.role}) on conflict do nothing`;
    }
    await sampleWork(tx);
    const i = process.argv.indexOf("--member");
    if (i > 0) {
      const email = process.argv[i + 1] ?? "";
      const role = ["owner", "admin", "member"].includes(process.argv[i + 2]) ? process.argv[i + 2] : "owner";
      const [u] = await tx<{ id: string }[]>`select id from public.users where lower(email) = lower(${email}) order by created_at desc limit 1`;
      if (!u) throw new Error(`No one with the email ${email} has signed in to Command Centre yet. Sign in once, then run this again.`);
      await tx`insert into public.memberships (org_id, user_id, org_role) values (${ORGS[0].id}, ${u.id}, ${role})
               on conflict (org_id, user_id) do update set org_role = excluded.org_role, status = 'active'`;
      console.log(`✓ ${email} is now ${role} of ${ORGS[0].name}`);
    }
  });
  console.log(`✓ test organisations and people present (${PEOPLE.map((p) => p.name).join(", ")})`);
} catch (e) {
  console.error(`✗ ${(e as Error).message}`);
  process.exitCode = 1;
} finally {
  await sql.end();
}

async function sampleWork(tx: postgres.TransactionSql) {
  const org = ORGS[0].id;
  const [aroha, ben] = [PEOPLE[0].id, PEOPLE[1].id];
  const [{ n }] = await tx<{ n: number }[]>`select count(*)::int as n from public.workspaces where org_id = ${org}`;
  if (n > 0) return;
  const day = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);
  const ws = async (name: string, slug: string) =>
    (await tx<{ id: string }[]>`insert into public.workspaces (org_id, name, slug, created_by, created_at) values (${org}, ${name}, ${slug}, ${aroha}, now() - interval '20 days') returning id`)[0].id;
  const summer = await ws("Summer season", "summer-season");
  const brand = await ws("Brand and website", "brand-and-website");
  const obj = async (w: string, title: string, target: number) =>
    (await tx<{ id: string }[]>`insert into public.objectives (org_id, workspace_id, title, target_date, owner_id, created_by, created_at)
      values (${org}, ${w}, ${title}, ${day(target)}, ${aroha}, ${aroha}, now() - interval '12 days') returning id`)[0].id;
  const fill = await obj(summer, "Fill 80% of summer departures", 45);
  const reviews = await obj(summer, "Reach 150 five-star reviews", 70);
  const site = await obj(brand, "Relaunch the bookings website", 28);
  const task = (w: string, title: string, o: string | null, priority: string, due: number | null, status = "todo", who: string | null = aroha, ageHours = 30) =>
    tx`insert into public.tasks (org_id, workspace_id, title, objective_id, priority, due_date, status, owner_id, created_by, created_at, completed_at)
       values (${org}, ${w}, ${title}, ${o}, ${priority}, ${due === null ? null : day(due)}, ${status}, ${who}, ${who ?? aroha},
               now() - make_interval(hours => ${ageHours}), ${status === "done" ? tx`now() - make_interval(hours => ${Math.floor(ageHours / 3)})` : null})`;
  await task(summer, "Confirm photographer for the Abel Tasman shoot", fill, "urgent", 0);
  await task(summer, "Send early-bird offer to past guests", fill, "high", 0, "in_progress");
  await task(summer, "Update departure calendar for January", fill, "normal", -2);
  await task(summer, "Reply to this week's reviews", reviews, "normal", 2, "todo", ben);
  await task(summer, "Set up review request after each tour", reviews, "high", 6, "blocked", ben);
  await task(summer, "Brief the summer video with Reel Deal", fill, "normal", 9);
  await task(summer, "Print new brochures", null, "low", 15);
  await task(summer, "Draft summer itinerary copy", fill, "normal", null, "done", aroha, 70);
  await task(summer, "Collect guest photo permissions", reviews, "normal", null, "done", ben, 40);
  await task(brand, "Choose the booking platform", site, "high", 3, "in_review");
  await task(brand, "Write the About page", site, "normal", 12);
  await task(brand, "Gather tour photos for the new site", site, "normal", null, "done", ben, 20);
}
