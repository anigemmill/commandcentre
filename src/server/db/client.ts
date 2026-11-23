import "server-only";
import postgres, { type Sql, type TransactionSql } from "postgres";
import { env } from "../env";

/*
  One connection pool per server. People's requests never run with the connection's own privileges:
  `asUser` switches to the `authenticated` role and sets the verified token's claims for the
  transaction, so every query is checked by row level security, as on Supabase's Data API.
*/
const store = globalThis as unknown as { __ccSql?: Sql };

export function db(): Sql {
  const url = env().DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return (store.__ccSql ??= postgres(url, { max: 5, onnotice: () => {} }));
}

export async function asUser<T>(userId: string, fn: (tx: TransactionSql) => Promise<T>, sql: Sql = db()): Promise<T> {
  return sql.begin(async (tx) => {
    await tx`select set_config('request.jwt.claims', ${JSON.stringify({ sub: userId, role: "authenticated" })}, true)`;
    await tx`set local role authenticated`;
    return fn(tx);
  }) as Promise<T>;
}
