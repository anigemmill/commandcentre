import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { NewWorkspaceForm } from "@/components/forms";
import { Shell } from "@/components/shell";
import { requirePrincipal } from "@/server/auth/session";
import { me, org, workspaces } from "@/server/data";

export default async function OrgPage({ params }: { params: Promise<{ orgId: string }> }) {
  const p = await requirePrincipal();
  const { orgId } = await params;
  if (!z.uuid().safeParse(orgId).success) notFound();
  const [person, o] = await Promise.all([me(p.userId), org(p.userId, orgId)]);
  if (!o) notFound();
  const list = await workspaces(p.userId, orgId);
  const canCreate = o.org_role === "owner" || o.org_role === "admin";
  return (
    <Shell name={person?.display_name ?? ""} crumbs={[{ href: "/orgs", label: "Organisations" }, { label: o.name }]}>
      <h1 className="text-2xl font-semibold">{o.name}</h1>
      <h2 className="mt-8 text-lg font-semibold">Workspaces</h2>
      {list.length === 0 ? (
        <p className="mt-2 text-muted">No workspaces yet.{canCreate ? " Create the first one below." : " Ask an owner or admin to create one."}</p>
      ) : (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {list.map((w) => (
            <li key={w.id}>
              <Link href={`/orgs/${orgId}/w/${w.id}`} className="block rounded border border-line bg-surface p-4 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-focus">
                <span className="block font-medium">{w.name}</span>
                <span className="text-sm text-muted">{w.open_tasks} open task{w.open_tasks === 1 ? "" : "s"}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {canCreate && (
        <section className="mt-8 rounded border border-line bg-surface p-4" aria-labelledby="new-ws">
          <h2 id="new-ws" className="mb-3 font-semibold">New workspace</h2>
          <NewWorkspaceForm orgId={orgId} />
        </section>
      )}
    </Shell>
  );
}
