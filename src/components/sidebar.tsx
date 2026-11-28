"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/components/ui";

/*
  Primary navigation (spec 09 §5 Navigation). Desktop: fixed sidebar. Below 1024 px: a top bar with
  a disclosure menu holding the same links. Current page marked with aria-current.
*/
export type NavData = {
  orgId: string;
  orgName: string;
  orgRole: string;
  multipleOrgs: boolean;
  personName: string;
  personEmail: string;
  workspaces: { id: string; name: string }[];
  signOut: (formData: FormData) => Promise<void>;
  devSession: boolean;
};

const icons = {
  today: <path d="M3 9.5 10 4l7 5.5V16a1 1 0 0 1-1 1h-3.5v-4.5h-5V17H4a1 1 0 0 1-1-1z" />,
  tasks: <><path d="m4 6 1.5 1.5L8 5" /><path d="M11 6.5h6" /><path d="m4 12.5 1.5 1.5L8 11.5" /><path d="M11 13h6" /></>,
  objectives: <><circle cx="10" cy="10" r="7" /><circle cx="10" cy="10" r="3.5" /><circle cx="10" cy="10" r=".75" fill="currentColor" /></>,
  workspaces: <><rect x="3" y="3" width="6" height="6" rx="1" /><rect x="11" y="3" width="6" height="6" rx="1" /><rect x="3" y="11" width="6" height="6" rx="1" /><rect x="11" y="11" width="6" height="6" rx="1" /></>,
};
function Icon({ name }: { name: keyof typeof icons }) {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      {icons[name]}
    </svg>
  );
}

function NavLink({ href, active, children, nested }: { href: string; active: boolean; children: React.ReactNode; nested?: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cx(
        "flex min-h-9 items-center gap-3 rounded-md px-3 text-base transition-colors duration-(--oi-duration-fast)",
        nested && "pl-10 text-sm",
        active ? "bg-accent-soft font-medium text-on-accent-soft" : "text-muted hover:bg-surface-muted hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}

function NavBody({ nav }: { nav: NavData }) {
  const path = usePathname();
  const base = `/orgs/${nav.orgId}`;
  const items = [
    { href: base, label: "Today", icon: "today" as const, active: path === base },
    { href: `${base}/tasks`, label: "Tasks", icon: "tasks" as const, active: path.startsWith(`${base}/tasks`) },
    { href: `${base}/objectives`, label: "Objectives", icon: "objectives" as const, active: path.startsWith(`${base}/objectives`) },
    { href: `${base}/workspaces`, label: "Workspaces", icon: "workspaces" as const, active: path === `${base}/workspaces` },
  ];
  return (
    <div className="flex h-full flex-col">
      <div className="px-3 pb-6">
        <p className="font-mono text-xs uppercase tracking-[0.08em] text-muted">{nav.orgRole}</p>
        <p className="mt-1 font-display text-lg leading-tight">{nav.orgName}</p>
        {nav.multipleOrgs && (
          <Link href="/orgs" className="mt-1 inline-block text-sm text-muted underline decoration-line underline-offset-4 hover:text-ink">
            Switch organisation
          </Link>
        )}
      </div>
      <nav aria-label="Main" className="flex flex-col gap-0.5">
        {items.map((i) => (
          <NavLink key={i.href} href={i.href} active={i.active}>
            <Icon name={i.icon} />
            {i.label}
          </NavLink>
        ))}
        {nav.workspaces.length > 0 && (
          <ul aria-label="Workspaces" className="mt-1 flex flex-col gap-0.5">
            {nav.workspaces.map((w) => (
              <li key={w.id}>
                <NavLink nested href={`${base}/w/${w.id}`} active={path.startsWith(`${base}/w/${w.id}`)}>
                  <span className="truncate">{w.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </nav>
      <div className="mt-auto border-t border-line px-3 pt-4">
        <p className="text-sm font-medium text-ink">{nav.personName}</p>
        <p className="truncate text-xs text-muted">{nav.personEmail}</p>
        <form action={nav.signOut} className="mt-2">
          <button className="text-sm text-muted underline decoration-line underline-offset-4 hover:text-ink">Sign out</button>
        </form>
        {nav.devSession && (
          <p role="note" className="mt-4 font-mono text-xs uppercase leading-relaxed tracking-[0.08em] text-accent-ink">
            Development sign-in · test data
          </p>
        )}
      </div>
    </div>
  );
}

export function AppFrame({ nav, children }: { nav: NavData; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-ink lg:grid lg:grid-cols-[var(--oi-nav-expanded)_1fr]">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-(--oi-z-toast) focus:rounded-md focus:bg-surface focus:px-3 focus:py-2">
        Skip to content
      </a>
      <aside className="hidden border-r border-line lg:block">
        <div className="sticky top-0 flex h-screen flex-col px-4 py-8">
          <Brand />
          <div className="mt-10 flex-1">
            <NavBody nav={nav} />
          </div>
        </div>
      </aside>
      <details className="group border-b border-line lg:hidden">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between px-4">
          <Brand />
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-muted group-open:hidden">Menu</span>
          <span className="hidden font-mono text-xs uppercase tracking-[0.08em] text-muted group-open:inline">Close</span>
        </summary>
        <div className="px-1 pb-6">
          <NavBody nav={nav} />
        </div>
      </details>
      <main id="main" className="min-w-0 px-4 py-10 md:px-10 lg:px-16 lg:py-14">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}

function Brand() {
  return (
    <div className="px-3">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">The Outside In</p>
      <p className="font-display text-md font-medium tracking-tight">Command Centre</p>
    </div>
  );
}
