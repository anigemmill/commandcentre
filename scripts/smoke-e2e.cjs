/*
  Browser smoke test of the MVP (npm run test:e2e). Needs: npm run setup, then npm run dev with
  DEV_IDENTITY=enabled in .env.local, and Playwright available (pre-installed in cloud sessions).
  Covers sign-in, workspace and task workflows, persistence, sign-out, cross-org isolation, member
  permissions and a forged-token cookie.
*/
// eslint-disable-next-line @typescript-eslint/no-require-imports -- plain Node script; Playwright is provided by the environment
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1200, height: 900 } });
  const p = await ctx.newPage();
  const ok = (m) => console.log('✓ ' + m);
  await p.goto('http://localhost:3000/');
  await p.waitForURL('**/sign-in'); ok('signed-out visitor sent to sign-in');
  await p.getByRole('button', { name: /Continue as Aroha Test/ }).click();
  await p.waitForURL(/\/orgs\/[0-9a-f-]{36}$/); ok('signed in as Aroha (owner), straight to Today');
  await p.getByRole('heading', { level: 1, name: /Good (morning|afternoon|evening), Aroha/ }).waitFor(); ok('dashboard greets by name');
  const main = p.getByRole('navigation', { name: 'Main' }).first();
  await main.getByRole('link', { name: 'Workspaces' }).click();
  const wsName = 'Smoke test ' + Date.now().toString().slice(-5);
  await p.getByLabel('Workspace name').fill(wsName);
  await p.getByRole('button', { name: 'Create workspace' }).click();
  await p.waitForURL(/\/w\//); ok('workspace created and opened');
  const wsUrl = p.url();
  await p.getByText('New objective', { exact: true }).click();
  await p.getByLabel('Objective', { exact: true }).fill('Smoke objective');
  await p.getByRole('button', { name: 'Add objective' }).click();
  await p.locator('p', { hasText: /^Smoke objective$/ }).waitFor(); ok('objective created');
  await p.getByText('New task', { exact: true }).click();
  await p.getByLabel('Title').fill('Draft brief for summer video');
  await p.getByLabel('Priority').selectOption('high');
  await p.getByLabel(/Due date/).fill('2026-11-01');
  await p.locator('select[name=objective_id]').selectOption({ label: 'Smoke objective' });
  await p.getByLabel('Assign to me').check();
  await p.getByRole('button', { name: 'Add task' }).click();
  await p.getByText('Draft brief for summer video', { exact: true }).waitFor(); ok('task created and linked to the objective');
  await p.getByLabel('Title').fill('Book photographer');
  await p.getByRole('button', { name: 'Add task' }).click();
  await p.getByText('Book photographer', { exact: true }).waitFor();
  await p.getByLabel('Status of Draft brief for summer video').selectOption('done');
  await p.locator('tr', { hasText: 'Draft brief for summer video' }).getByRole('button', { name: 'Save' }).click();
  await p.getByRole('progressbar', { name: 'Progress on Smoke objective' }).and(p.locator('[aria-valuenow="1"]')).waitFor();
  ok('status saved; objective progress follows linked tasks (1 of 2)');
  await p.reload(); await p.getByText('Book photographer', { exact: true }).waitFor(); ok('data persisted across reload');
  await p.getByRole('button', { name: 'Delete Book photographer' }).click();
  await p.getByText('Book photographer', { exact: true }).waitFor({ state: 'detached' }); ok('task deleted');
  await main.getByRole('link', { name: 'Today' }).click();
  await p.getByText('Smoke objective').first().waitFor(); ok('Today shows the new objective');
  await main.getByRole('link', { name: 'Tasks' }).click();
  await p.getByRole('link', { name: /Overdue/ }).click();
  await p.waitForURL(/view=overdue/); ok('task views filter (overdue)');
  await p.getByRole('button', { name: 'Sign out' }).first().click();
  await p.waitForURL('**/sign-in'); ok('signed out');
  // isolation through the UI: Casey (other org) opens Aroha's workspace URL
  await p.getByRole('button', { name: /Continue as Casey Test/ }).click();
  await p.waitForURL(/\/orgs\/[0-9a-f-]{36}$/);
  if (await p.getByText('Coastal Tours').count()) throw new Error('Casey sees Coastal Tours');
  const r = await p.goto(wsUrl);
  if (r.status() !== 404) throw new Error('expected 404, got ' + r.status());
  ok("other organisation's workspace URL returns 404 for Casey");
  await ctx.clearCookies();
  // member cannot create workspaces
  await p.goto('http://localhost:3000/sign-in');
  await p.getByRole('button', { name: /Continue as Ben Test/ }).click();
  await p.waitForURL(/\/orgs\/[0-9a-f-]{36}$/);
  await p.goto(p.url() + '/workspaces');
  if (await p.getByRole('button', { name: 'Create workspace' }).count()) throw new Error('member sees create workspace');
  await p.goto(wsUrl); await p.getByText('Draft brief for summer video', { exact: true }).waitFor({ state: 'attached' });
  ok('member sees the shared workspace but cannot create workspaces');
  // forged cookie
  await ctx.clearCookies();
  await ctx.addCookies([{ name: 'cc_session', value: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIwZTVlMDAwMC0wMDAwLTQwMDAtODAwMC0wMDAwMDAwMDAwMGEifQ.x', url: 'http://localhost:3000' }]);
  await p.goto('http://localhost:3000/orgs'); await p.waitForURL('**/sign-in'); ok('forged HS256 cookie refused');
  await b.close();
})().catch((e) => { console.error('✗', e.message); process.exit(1); });
