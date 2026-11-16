# 04 · User journeys and screen specifications

Status: proposed. Screens are specified by purpose, content and states, not visuals. Visual design
follows `09-design-system.md` and will be drawn before each module is built.

## 1. Personas

| Persona | Typical role | Main device | Wants |
|---|---|---|---|
| Owner-operator | Owner | Desktop, phone for approvals | "What should I do this week, and is it working?" |
| Marketing manager | Admin / Manager | Desktop | Plan campaigns, run content, report results |
| Team member | Contributor | Desktop, phone | Clear tasks and deadlines |
| Agency strategist | Delegated Manager in many client orgs | Desktop | Switch clients quickly, consistent reporting |
| Approver (exec, client) | Approver permission | Phone | Approve or reject quickly with context |

## 2. Core journeys

**J1 · First run and onboarding (§5).** Sign up → create organisation → business name, website and
industry (only required fields) → the app offers to pre-fill the business profile from the website
(AI, labelled `ai_interpretation`, every field editable) → choose goals → land on Home with a
"profile 30% complete" checklist. Remaining steps (audiences, competitors, objectives, invites,
integrations, Findable/Reel Deal, AI workforce, first intelligence assessment) appear as checklist
items, each skippable.

**J2 · Weekly priorities.** Home → "Today's priorities" (overdue tasks, approvals waiting, top
recommendations) → open a recommendation → see evidence and source → accept (creates task or project,
pre-filled) or dismiss with a reason (feeds learnings).

**J3 · Set strategy and objectives.** Strategy → new annual plan (template or AI draft from profile and
intelligence) → edit sections → add objectives with KPIs linked to metrics → submit for approval →
approved plan becomes the active plan; quarterly priorities roll down from it.

**J4 · Run a campaign with video.** Marketing → new campaign linked to an objective → content calendar
→ "Request video" → production request sent to Reel Deal (`07`) → status appears on the content item →
Reel Deal's storyboard comes back for review → approve in Approval Centre (decision passed to Reel Deal)
→ final export attached to the content item → performance flows back after publishing.

**J5 · Act on discoverability.** Findable reports a keyword opportunity → arrives as an intelligence
record (`platform_reported`) → SEO agent assesses and recommends a content brief → human accepts →
task assigned → once published, Findable's measurement closes the loop with a learning.

**J6 · Configure an agent.** AI Workforce → library → pick "Marketing Performance" → set instructions,
knowledge scope, schedule (weekly), autonomy (Prepare) → test run with trace → enable.

**J7 · Approve on mobile.** Push or email notification → approval detail (what, who requested, the
change as a diff, evidence) → approve / reject / request changes with comment → audit recorded.

**J8 · Agency client switch.** Org switcher → client list with health summary → pick a client → URL
and all data change; a persistent label shows whose data is on screen.

**J9 · Monthly report.** Performance → monthly review → generated draft (metrics with evidence badges,
AI commentary marked as interpretation) → edit → share link or export PDF.

## 3. Application shell (§20)

| Region | Contents |
|---|---|
| Left nav (expanded 248 px, collapsed 72 px) | Org/workspace switcher, brand selector (only if more than one brand), eleven modules, Administration |
| Top bar | Breadcrumb, global search (⌘K: records, people, commands), notifications, Strategy Assistant toggle, profile |
| Main | Page title, contextual actions (one primary), content |
| Right side panel (optional) | Record detail, Strategy Assistant, approvals; closes with Esc |
| Mobile | Bottom bar: Home, Tasks, Approvals, Notifications, More |

## 4. Screen inventory

| Module | Screens (Phase in brackets) |
|---|---|
| Home | Dashboard (1) |
| Business Intelligence | Profile (1), Offerings (1), Locations (1), Audiences (1), Competitors (1), Intelligence register (2), Record detail (2), Knowledge library (1) |
| Strategy and Growth | Plans list (1), Plan editor (1), SWOT (1), Objectives and KPIs (1), Progress and learnings (2) |
| Marketing | Campaigns (1 basic, 2 full), Campaign detail, Content calendar, Content bank, Channel plans (2) |
| Discoverability | Overview, Opportunities, Recommendations (3; read-through from Findable) |
| Creative Studio | Production requests, Request detail, Asset library view (3; read-through from Reel Deal) |
| Projects and Tasks | Projects list, Project detail (board, list, timeline), My tasks, Workload (1) |
| AI Workforce | Library, Agent config, Run history, Run trace (2) |
| Performance | Overview, Channel reports, Campaign report, Reports list, Report editor (1 basic, 3 unified) |
| Approval Centre | Inbox, Approval detail, History (2) |
| Strategy Assistant | Side panel and full-page chat (2) |
| Administration | Organisation, Workspaces, Brands, Users and roles, Teams, Integrations, Billing, Usage, Notifications, Audit log, Security and privacy (1–4) |

## 5. Required states for every screen

Each screen spec lists: **loading** (skeleton matching layout), **empty** (what this is for + one
action, never a dead end), **partial** (e.g. integration not connected: show what's missing and how to
connect), **error** (plain message, retry, support reference), **no permission** (who to ask),
**success** feedback for writes. Connected-product screens also show **not connected**: what the
product does and how to activate it, with no fake data.

## 6. Home dashboard specification (first screen to design)

1. **Header:** greeting, workspace, period picker (this week / month / quarter).
2. **Priorities strip:** overdue tasks, approvals waiting, due this week (counts link to filtered lists).
3. **Objectives:** up to 4 active objectives, each KPI with current vs target, trend, evidence badge.
4. **Performance snapshot:** 4 KPI tiles chosen by the user, source and "updated" time on each.
5. **Recommendations:** top 3, with source agent, evidence class and accept/dismiss.
6. **Activity:** campaigns live, projects at risk, recent agent runs, connected-product status.

Mobile order: 2, 5, 3, 4, 6.
