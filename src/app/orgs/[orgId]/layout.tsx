import { notFound } from "next/navigation";
import { z } from "zod";
import { signOut } from "@/app/actions";
import { AppFrame } from "@/components/sidebar";
import { requirePrincipal } from "@/server/auth/session";
import { me, myOrgs, workspaces } from "@/server/data";

export default async function OrgLayout({ params, children }: { params: Promise<{ orgId: string }>; children: React.ReactNode }) {
  const p = await requirePrincipal();
  const { orgId } = await params;
  if (!z.uuid().safeParse(orgId).success) notFound();
  const [person, orgs] = await Promise.all([me(p.userId), myOrgs(p.userId)]);
  const org = orgs.find((o) => o.id === orgId);
  if (!org || !person) notFound();
  const spaces = await workspaces(p.userId, orgId);
  return (
    <AppFrame
      nav={{
        orgId,
        orgName: org.name,
        orgRole: org.org_role,
        multipleOrgs: orgs.length > 1,
        personName: person.display_name,
        personEmail: person.email,
        workspaces: spaces.map((w) => ({ id: w.id, name: w.name })),
        signOut,
      }}
    >
      {children}
    </AppFrame>
  );
}
