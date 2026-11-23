import Link from "next/link";
import { signOut } from "@/app/actions";

/* Top bar for signed-in pages. The development banner is shown whenever the dev sign-in is in use. */
export function Shell({ name, crumbs, children }: { name: string; crumbs: { href?: string; label: string }[]; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-ink">
      <p role="note" className="bg-accent-soft px-4 py-1 text-center text-sm text-on-accent-soft">
        Development sign-in with test data. Not the Outside In account service yet.
      </p>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-3">
          <Link href="/orgs" className="font-semibold">Command Centre</Link>
          <nav aria-label="Breadcrumb" className="flex-1">
            <ol className="flex flex-wrap gap-2 text-sm text-muted">
              {crumbs.map((c, i) => (
                <li key={i} className="flex gap-2">
                  <span aria-hidden="true">/</span>
                  {c.href ? <Link className="underline" href={c.href}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
                </li>
              ))}
            </ol>
          </nav>
          <span className="text-sm text-muted">{name}</span>
          <form action={signOut}>
            <button className="rounded border border-control px-3 py-1 text-sm hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-focus">Sign out</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
