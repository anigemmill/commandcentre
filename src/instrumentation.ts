/*
  Runs once when a server instance starts, before it handles any request (Next.js instrumentation).
  Validating the environment here makes a misconfigured deployment fail at start-up with the
  message from parseEnv, as src/server/env.ts promises, instead of starting and then answering
  every request with a 500. Only the Node.js runtime reads server settings.
*/
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { env } = await import("./server/env");
    env();
  }
}
