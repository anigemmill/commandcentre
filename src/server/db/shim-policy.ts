/*
  Whether `npm run db:migrate` may apply supabase/local/* (the compatibility file that creates an
  auth stub and Supabase's roles, including a service_role that bypasses RLS).

  - ALLOW_LOCAL_SHIM=true  → allowed (explicit choice)
  - ALLOW_LOCAL_SHIM=false → refused
  - unset                  → allowed only for a database on this machine

  So pointing DATABASE_URL at a hosted, non-Supabase Postgres by mistake cannot silently create an
  RLS-bypassing role there. A real Supabase project never gets the file either way (migrate() checks
  for auth.users first).
*/
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export function localShimAllowed(databaseUrl: string, flag: string | undefined): boolean {
  if (flag === "true") return true;
  if (flag === "false") return false;
  try {
    const host = new URL(databaseUrl).hostname;
    return host === "" || LOCAL_HOSTS.has(host);
  } catch {
    return false;
  }
}
