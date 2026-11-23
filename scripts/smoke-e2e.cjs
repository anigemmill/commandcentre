/*
  Browser smoke test of the MVP (npm run test:e2e). Needs: npm run setup, then npm run dev with
  DEV_IDENTITY=enabled in .env.local, and Playwright available (pre-installed in cloud sessions).
  Covers sign-in, workspace and task workflows, persistence, sign-out, cross-org isolation, member
  permissions and a forged-token cookie.
*/
// eslint-disable-next-line @typescript-eslint/no-require-imports -- plain Node script; Playwright is provided by the environment
const { chromium } = require('playwright');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const SP = process.argv[2] || require('node:os').tmpdir();
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1200, height: 900 } });
  const p = await ctx.newPage();
  const ok = (m) => console.log('✓ ' + m);
  await p.goto('http://localhost:3000/');
  await p.waitForURL('**/sign-in'); ok('signed-out visitor sent to sign-in');
  await p.getByRole('button', { name: /Continue as Aroha Test/ }).click();
  await p.waitForURL('**/orgs'); ok('signed in as Aroha (owner)');
  await p.getByRole('link', { name: /Coastal Tours/ }).click();
  await p.getByLabel('Workspace name').fill('Summer campaign ' + Date.now().toString().slice(-4));
  await p.getByRole('button', { name: 'Create workspace' }).click();
  await p.waitForURL(/\/w\//); ok('workspace created, dashboard opened');
  const wsUrl = p.url();
  await p.getByLabel('Title').fill('Draft brief for summer video');
  await p.getByLabel('Priority').selectOption('high');
  await p.getByLabel(/Due date/).fill('2026-11-01');
  await p.getByLabel('Assign to me').check();
  await p.getByRole('button', { name: 'Add task' }).click();
  await p.getByText('Draft brief for summer video', { exact: true }).waitFor(); ok('task created');
  await p.getByLabel('Title').fill('Book photographer');
  await p.getByRole('button', { name: 'Add task' }).click();
  await p.getByText('Book photographer', { exact: true }).waitFor();
  const tile = (n) => p.locator('dl div', { hasText: n }).locator('dd');
  console.log('  counts: to do', await tile('To do').textContent(), '· overdue', await tile('Overdue').textContent());
  await p.getByLabel('Status of Book photographer').selectOption('done');
  await p.locator('li', { hasText: 'Book photographer' }).getByRole('button', { name: 'Update' }).click();
  await p.waitForFunction(() => [...document.querySelectorAll('dl div')].find(d => d.textContent.startsWith('Done'))?.querySelector('dd')?.textContent === '1');
  ok('status updated, dashboard counts refreshed');
  await p.reload(); await p.getByText('Draft brief for summer video', { exact: true }).waitFor(); ok('data persisted across reload');
  await p.screenshot({ path: SP + '/dashboard.png', fullPage: true });
  await p.getByRole('button', { name: 'Delete Book photographer' }).click();
  await p.getByText('Book photographer', { exact: true }).waitFor({ state: 'detached' }); ok('task deleted');
  await p.getByRole('button', { name: 'Sign out' }).click();
  await p.waitForURL('**/sign-in'); ok('signed out');
  // isolation through the UI: Casey (other org) opens Aroha's workspace URL
  await p.getByRole('button', { name: /Continue as Casey Test/ }).click();
  await p.waitForURL('**/orgs');
  const orgs = await p.getByRole('link', { name: /Test Org/ }).allTextContents();
  if (orgs.some(t => t.includes('Coastal'))) throw new Error('Casey sees Coastal Tours');
  const r = await p.goto(wsUrl);
  if (r.status() !== 404) throw new Error('expected 404, got ' + r.status());
  ok("other organisation's workspace URL returns 404 for Casey");
  await ctx.clearCookies();
  // member cannot create workspaces
  await p.goto('http://localhost:3000/sign-in');
  await p.getByRole('button', { name: /Continue as Ben Test/ }).click();
  await p.waitForURL('**/orgs');
  await p.getByRole('link', { name: /Coastal Tours/ }).click();
  if (await p.getByRole('button', { name: 'Create workspace' }).count()) throw new Error('member sees create workspace');
  await p.goto(wsUrl); await p.getByText('Draft brief for summer video', { exact: true }).waitFor();
  ok('member sees the shared workspace but cannot create workspaces');
  // forged cookie
  await ctx.clearCookies();
  await ctx.addCookies([{ name: 'cc_session', value: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIwZTVlMDAwMC0wMDAwLTQwMDAtODAwMC0wMDAwMDAwMDAwMGEifQ.x', url: 'http://localhost:3000' }]);
  await p.goto('http://localhost:3000/orgs'); await p.waitForURL('**/sign-in'); ok('forged HS256 cookie refused');
  await b.close();
})().catch((e) => { console.error('✗', e.message); process.exit(1); });
