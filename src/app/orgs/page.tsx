import Link from "next/link";
import { Shell } from "@/components/shell";
import { requirePrincipal } from "@/server/auth/session";
import { me, myOrgs } from "@/server/data";

export const metadata = { title: "Organisations · Command Centre" };

export default async function Orgs() {
  const p = await requirePrincipal();
  const [person, orgs] = await Promise.all([me(p.userId), myOrgs(p.userId)]);
  return (
    <Shell name={person?.display_name ?? ""} crumbs={[{ label: "Organisations" }]}>
      <h1 className="text-2xl font-semibold">Your organisations</h1>
      {orgs.length === 0 ? (
        <p className="mt-4 text-muted">You aren&apos;t a member of any organisation yet.</p>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {orgs.map((o) => (
            <li key={o.id}>
              <Link href={`/orgs/${o.id}`} className="block rounded border border-line bg-surface p-4 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-focus">
                <span className="block font-medium">{o.name}</span>
                <span className="text-sm text-muted">Your role: {o.org_role}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}
