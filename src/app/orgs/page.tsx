import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions";
import { Eyebrow } from "@/components/ui";
import { requirePrincipal } from "@/server/auth/session";
import { me, myOrgs } from "@/server/data";
import { env } from "@/server/env";

export const metadata = { title: "Choose an organisation · Command Centre" };

export default async function Orgs() {
  const p = await requirePrincipal();
  const [person, orgs] = await Promise.all([me(p.userId), myOrgs(p.userId)]);
  if (orgs.length === 1) redirect(`/orgs/${orgs[0].id}`);
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
      <Eyebrow>The Outside In · Command Centre</Eyebrow>
      <h1 className="mt-4 font-display text-3xl tracking-tight">Welcome, {person?.display_name.split(" ")[0]}.</h1>
      {orgs.length === 0 ? (
        <>
          <p className="mt-4 text-md text-muted">You aren&apos;t a member of any organisation yet. When someone invites you, it will appear here.</p>
          {env().NODE_ENV !== "production" && (
            <p className="mt-6 font-mono text-xs leading-relaxed text-accent-ink">
              Development: add yourself to the test organisation with <code>npm run db:seed -- --member {person?.email} owner</code>, then reload.
            </p>
          )}
        </>
      ) : (
        <>
          <p className="mt-3 text-md text-muted">Choose where to work.</p>
          <ul className="mt-10 border-t border-line">
            {orgs.map((o) => (
              <li key={o.id} className="border-b border-line">
                <Link href={`/orgs/${o.id}`} className="group flex items-baseline justify-between py-5">
                  <span className="font-display text-xl group-hover:underline">{o.name}</span>
                  <span className="font-mono text-xs uppercase tracking-[0.08em] text-muted">{o.org_role}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
      <form action={signOut} className="mt-10">
        <button className="text-sm text-muted underline decoration-line underline-offset-4 hover:text-ink">Sign out</button>
      </form>
    </main>
  );
}
