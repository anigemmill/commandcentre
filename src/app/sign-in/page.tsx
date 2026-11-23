import { redirect } from "next/navigation";
import { devSignIn } from "@/app/actions";
import { Eyebrow } from "@/components/ui";
import { currentPrincipal, signInConfigured } from "@/server/auth/session";
import { devPeople } from "@/server/data";

export const metadata = { title: "Sign in · Command Centre" };

export default async function SignIn() {
  if (await currentPrincipal()) redirect("/orgs");
  if (!(await signInConfigured())) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
        <Eyebrow>The Outside In · Command Centre</Eyebrow>
        <h1 className="mt-4 font-display text-3xl tracking-tight">Sign in</h1>
        <p className="mt-4 text-muted">
          Sign-in isn&apos;t available yet. Command Centre will sign people in with their Outside In account once the
          account service&apos;s sign-in is enabled.
        </p>
      </main>
    );
  }
  const people = await devPeople();
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
      <Eyebrow>The Outside In · Command Centre</Eyebrow>
      <h1 className="mt-4 font-display text-3xl tracking-tight">Development sign-in</h1>
      <p className="mt-3 text-md text-muted">
        For local development only. Choose a test person; there are no passwords. This page doesn&apos;t exist in
        production and will be replaced by signing in with an Outside In account.
      </p>
      {people.length === 0 ? (
        <p className="mt-6" role="alert">No test people found. Run <code>npm run db:seed</code>.</p>
      ) : (
        <ul className="mt-10 border-t border-line">
          {people.map((p) => (
            <li key={p.id} className="border-b border-line">
              <form action={devSignIn}>
                <input type="hidden" name="user_id" value={p.id} />
                <button className="group w-full py-5 text-left">
                  <span className="block font-display text-xl group-hover:underline">Continue as {p.display_name}</span>
                  <span className="mt-1 block text-sm text-muted">{p.email} · {p.orgs}</span>
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
