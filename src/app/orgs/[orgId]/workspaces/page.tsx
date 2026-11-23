import Link from "next/link";
import { NewWorkspaceForm } from "@/components/forms";
import { EmptyState, PageHeader, Section } from "@/components/ui";
import { requirePrincipal } from "@/server/auth/session";
import { org, workspaces } from "@/server/data";

export const metadata = { title: "Workspaces · Command Centre" };

export default async function Workspaces({ params }: { params: Promise<{ orgId: string }> }) {
  const p = await requirePrincipal();
  const { orgId } = await params;
  const [o, list] = await Promise.all([org(p.userId, orgId), workspaces(p.userId, orgId)]);
  const canCreate = o?.org_role === "owner" || o?.org_role === "admin";
  return (
    <>
      <PageHeader eyebrow={o?.name} title="Workspaces" description="Each workspace is one business or business unit, with its own tasks and objectives." />
      {list.length === 0 ? (
        <EmptyState>{canCreate ? "No workspaces yet. Create the first one below." : "No workspaces yet. Ask an owner or admin to create one."}</EmptyState>
      ) : (
        <ul className="border-t border-line">
          {list.map((w) => (
            <li key={w.id} className="border-b border-line">
              <Link href={`/orgs/${orgId}/w/${w.id}`} className="group flex items-baseline justify-between gap-4 py-5">
                <span className="font-display text-xl group-hover:underline">{w.name}</span>
                <span className="text-sm text-muted">{w.open_tasks} open task{w.open_tasks === 1 ? "" : "s"}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {canCreate && (
        <Section label="New workspace" id="new" className="mt-14 max-w-2xl">
          <div className="pt-4"><NewWorkspaceForm orgId={orgId} /></div>
        </Section>
      )}
    </>
  );
}
