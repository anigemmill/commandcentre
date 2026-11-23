import { redirect } from "next/navigation";
import { devSignIn } from "@/app/actions";
import { currentPrincipal, signInConfigured } from "@/server/auth/session";
import { devPeople } from "@/server/data";

export const metadata = { title: "Sign in · Command Centre" };

export default async function SignIn() {
  if (await currentPrincipal()) redirect("/orgs");
  if (!(await signInConfigured())) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="mt-4 text-muted">
          Sign-in isn&apos;t available yet. Command Centre will sign people in with their Outside In account once the
          account service&apos;s sign-in is enabled.
        </p>
      </main>
    );
  }
  const people = await devPeople();
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-2xl font-semibold">Development sign-in</h1>
      <p className="mt-2 text-muted">
        For local development only. Choose a test person; there are no passwords. This page doesn&apos;t exist in
        production and will be replaced by signing in with an Outside In account.
      </p>
      {people.length === 0 ? (
        <p className="mt-6" role="alert">No test people found. Run <code>npm run db:seed</code>.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {people.map((p) => (
            <li key={p.id}>
              <form action={devSignIn}>
                <input type="hidden" name="user_id" value={p.id} />
                <button className="w-full rounded border border-control bg-surface px-4 py-3 text-left hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-focus">
                  <span className="block font-medium">Continue as {p.display_name}</span>
                  <span className="block text-sm text-muted">{p.email} · {p.orgs}</span>
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
