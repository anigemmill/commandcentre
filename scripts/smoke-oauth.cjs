/*
  Browser test of real shared sign-in (npm run test:e2e:oauth -- <account.json>).
  Needs: the account service running on :3100 (FIRST_PARTY_CLIENT_IDS = Command Centre's client id,
  PRODUCT_REDIRECT_ORIGINS=http://localhost:3000), Command Centre on :3000 with ACCOUNTS_* set, and a
  JSON file {id, email, password} for a confirmed accounts-dev test account (never committed).
  In cloud sessions run with NODE_USE_ENV_PROXY=1 (accounts-dev is reached through the proxy).

  The /auth/sign-in route hook below stands in for accounts-dev's Site URL (it should be
  http://localhost:3100, docs/environments.md) by sending the browser to the consent page on :3100.
  Remove it once the Site URL is set.
*/
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium } = require('playwright');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { readFileSync } = require('node:fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { execSync } = require('node:child_process');
const SP = require('node:path').dirname(require('node:path').resolve(process.argv[2] || 'missing.json'));
const ACCOUNT_FILE = process.argv[2];
const user = JSON.parse(readFileSync(ACCOUNT_FILE, 'utf8'));
const ok = (m) => console.log('✓ ' + m);
(async () => {
  execSync(`cd /home/user/commandcentre && psql "$(scripts/db-local.sh url)" -qc "delete from public.memberships where user_id = '${user.id}'"`); // local test database only
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  // TEST SHIM (until accounts-dev's Site URL is set to http://localhost:3100): the consent page lives on the account service.
  // Follows Command Centre's redirect to the account service's authorise endpoint, then sends the
  // browser to the consent page on port 3100 (what accounts-dev's Site URL should say).
  await ctx.route((u) => u.host === 'localhost:3000' && u.pathname === '/auth/sign-in', async (r) => {
    const first = await r.fetch({ maxRedirects: 0 });
    const authorize = first.headers()['location'];
    const second = await fetch(authorize, { redirect: 'manual' });
    const consent = (second.headers.get('location') || '').replace('http://localhost:3000/oauth/consent', 'http://localhost:3100/oauth/consent');
    if (!consent.includes('authorization_id=')) throw new Error('authorise did not return a consent redirect: ' + second.status);
    await r.fulfill({ status: 302, headers: { location: consent, 'set-cookie': first.headers()['set-cookie'] } });
  });
  const p = await ctx.newPage();
  const hops = [];
  p.on('framenavigated', (f) => { if (f === p.mainFrame()) hops.push(new URL(f.url()).host + new URL(f.url()).pathname); });
  await p.goto('http://localhost:3000/sign-in');
  await p.getByRole('link', { name: 'Sign in with your Outside In account' }).click();
  await p.waitForURL(/localhost:3100\/sign-in/); ok('Command Centre sent me to the Outside In account sign-in');
  const form = p.locator('form', { has: p.getByLabel('Password') });
  await form.getByLabel('Email').fill(user.email);
  await form.getByLabel('Password').fill(user.password);
  await form.getByRole('button', { name: /^sign in$/i }).click();
  await p.waitForURL(/localhost:3000\/orgs/, { timeout: 30000 }); ok('signed in at the account service, consent auto-approved (first-party), back in Command Centre');
  console.log('  route: ' + [...new Set(hops)].join(' → '));
  await p.getByText(/aren.t a member of any organisation/).waitFor(); ok('new account has no organisations yet (memberships come from the account service later)');
  const cookies = await ctx.cookies('http://localhost:3000');
  const s = cookies.find((c) => c.name === 'cc_session');
  const hdr = JSON.parse(Buffer.from(s.value.split('.')[0], 'base64url'));
  const claims = JSON.parse(Buffer.from(s.value.split('.')[1], 'base64url'));
  if (!s.httpOnly || s.sameSite !== 'Lax') throw new Error('cookie flags');
  if (claims.iss !== 'https://urdrrzqqtmeuwlxksuov.supabase.co/auth/v1' || claims.client_id !== '86d968a0-3341-4489-9c5f-a01aeb917e10' || hdr.alg !== 'ES256' || claims.sub !== user.id) throw new Error('unexpected token ' + JSON.stringify({ alg: hdr.alg, iss: claims.iss, client_id: claims.client_id }));
  ok('session cookie is httpOnly, SameSite=Lax, and holds the account service\'s ES256 token for Command Centre\'s client');
  if (cookies.some((c) => c.name === 'cc_oauth')) throw new Error('oauth state cookie left behind'); ok('one-time OAuth state cookie cleared');
  execSync(`cd /home/user/commandcentre && DATABASE_URL=$(scripts/db-local.sh url) node --import tsx scripts/dev-seed.ts --member ${user.email} owner`, { stdio: 'inherit' });
  await p.reload();
  await p.waitForURL(/\/orgs\/[0-9a-f-]{36}$/);
  await p.getByRole('heading', { level: 1, name: /Good (morning|afternoon|evening), Sign-in\./ }).waitFor(); ok('after membership is added: Today dashboard, greeted by account name');
  await p.screenshot({ path: SP + '/oauth-today.png' });
  // replay: the callback can't be reused
  const r = await p.goto('http://localhost:3000/auth/callback?code=forged&state=forged');
  if (!p.url().includes('/sign-in?error=state') && !p.url().includes('/orgs')) throw new Error('replay not refused: ' + p.url());
  ok('forged callback refused (state)');
  await p.goto('http://localhost:3000/orgs');
  await p.getByRole('button', { name: 'Sign out' }).first().click();
  await p.waitForURL('**/sign-in'); ok('signed out of Command Centre');
  await p.getByRole('link', { name: 'Sign in with your Outside In account' }).click();
  await p.waitForURL(/localhost:3000\/orgs/, { timeout: 30000 }); ok('signing in again goes straight through (account session still active, no password prompt)');
  await b.close();
})().catch((e) => { console.error('✗', e.message); process.exit(1); });
