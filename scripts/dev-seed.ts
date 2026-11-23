/*
  DEVELOPMENT ONLY (npm run db:seed). Fills the account mirrors (users, organisations, memberships)
  with test people, standing in for the account-event consumer that will fill them in production.
  Refuses any database that isn't on this machine. Safe to run repeatedly.

  Test people (choose one on the development sign-in page):
    Aroha Test   owner of "Test Org: Coastal Tours"
    Ben Test     member of "Test Org: Coastal Tours"
    Casey Test   owner of "Test Org: Alpine Lodge"  (cannot see Coastal Tours: isolation check)
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
  });
  console.log(`✓ test organisations and people present (${PEOPLE.map((p) => p.name).join(", ")})`);
} catch (e) {
  console.error(`✗ ${(e as Error).message}`);
  process.exitCode = 1;
} finally {
  await sql.end();
}
