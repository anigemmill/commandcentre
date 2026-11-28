import { redirect } from "next/navigation";
import { devSignIn } from "@/app/actions";
import { buttonClass, Eyebrow } from "@/components/ui";
import { currentPrincipal, signInOptions } from "@/server/auth/session";
import { devPeople } from "@/server/data";

export const metadata = { title: "Sign in · Command Centre" };

const ERRORS: Record<string, string> = {
  denied: "Sign-in was cancelled. Nothing was shared.",
  refused: "Your Outside In account couldn't sign you in to Command Centre. Try again.",
  state: "That sign-in link has expired or was already used. Start again.",
  exchange: "We couldn't finish signing you in. Try again.",
  token: "We couldn't confirm your sign-in. Try again.",
  not_configured: "Signing in with an Outside In account isn't set up here yet.",
};

export default async function SignIn({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await currentPrincipal()) redirect("/orgs");
  const { error } = await searchParams;
  const options = await signInOptions();
  const people = options.development ? await devPeople() : [];

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
      <Eyebrow>The Outside In · Command Centre</Eyebrow>
      <h1 className="mt-4 font-display text-3xl tracking-tight">Sign in</h1>
      {error && (
        <p role="alert" className="mt-6 border-l-2 border-danger pl-4 text-base text-ink">
          {ERRORS[error] ?? ERRORS.exchange}
        </p>
      )}

      {options.accounts ? (
        <>
          <p className="mt-3 text-md text-muted">Use your Outside In account: the same sign-in for Command Centre, Findable and Reel Deal.</p>
          <a href="/auth/sign-in" className={`${buttonClass("primary")} mt-8 self-start`}>
            Sign in with your Outside In account
          </a>
        </>
      ) : (
        !options.development && (
          <p className="mt-4 text-muted">
            Sign-in isn&apos;t available yet. Command Centre will sign people in with their Outside In account once it&apos;s set up here.
          </p>
        )
      )}

      {options.development && (
        <section aria-labelledby="dev-people" className="mt-14">
          <h2 id="dev-people" className="font-mono text-xs font-normal uppercase tracking-[0.08em] text-accent-ink">
            Development only · test people
          </h2>
          <p className="mt-2 text-sm text-muted">No passwords. Not available in production.</p>
          {people.length === 0 ? (
            <p className="mt-4" role="alert">No test people found. Run <code>npm run db:seed</code>.</p>
          ) : (
            <ul className="mt-4 border-t border-line">
              {people.map((p) => (
                <li key={p.id} className="border-b border-line">
                  <form action={devSignIn}>
                    <input type="hidden" name="user_id" value={p.id} />
                    <button className="group w-full py-4 text-left">
                      <span className="block font-display text-lg group-hover:underline">Continue as {p.display_name}</span>
                      <span className="mt-1 block text-sm text-muted">{p.email} · {p.orgs}</span>
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
