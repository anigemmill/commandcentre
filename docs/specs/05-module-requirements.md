# 05 · Module-by-module functional requirements

Status: proposed. Requirements are numbered for tracing into tests (`12`). **Phase** is the blueprint
phase (§29–§32) in which the requirement first ships. "Must" items are required for that phase's
acceptance.

## M01 · Home (Phase 1)
- M01.1 Must show priorities, objectives, KPI snapshot, deadlines, overdue tasks, active projects.
- M01.2 Must show campaign activity, recommendations, agent activity and approvals once those modules
  exist; until then the section is hidden, not faked.
- M01.3 Every number links to the list or report it summarises.
- M01.4 Each metric shows source, period, updated time and evidence class (§12).

## M02 · Business Intelligence
- M02.1 (P1) Editable business profile with all §5 fields; progressive completeness score.
- M02.2 (P1) CRUD for offerings, locations, audiences, competitors.
- M02.3 (P1) Knowledge library: upload (PDF, DOCX, TXT, MD), tag by kind (§13), mark "approved
  messaging"; text extracted and embedded for retrieval.
- M02.4 (P2) Intelligence register: create manually or from agents/integrations; every record has the
  §8 fields; stage workflow Finding → … → Learning; actions "create task" and "create project".
- M02.5 (P2) Feedback and sentiment intake from uploads and connected review sources.
- M02.6 (P3) Findable and Reel Deal findings arrive as intelligence records with source references.

## M03 · Strategy and Growth (Phase 1)
- M03.1 Plans of every §4.03 kind with periods, sections and status; one active plan per kind/period.
- M03.2 SWOT with items linked to evidence (intelligence or documents).
- M03.3 Objectives with owners and periods; KPIs with unit, baseline, target, direction, linked metric.
- M03.4 Progress view: KPI actual vs target over time; objectives at risk flagged by rule (behind
  linear pace by more than a configurable margin).
- M03.5 (P2) AI draft of any plan from profile + intelligence, labelled as a draft until approved.
- M03.6 Version history and compare on plans.

- M03.7 (P2) Experiments (from the pilot): hypothesis, baseline period, metric, minimum acceptable and
  target set before start; limitations required to complete; threshold edits after start audited;
  verdict shown with caveats.

## M04 · Marketing
- M04.1 (P1) Campaigns: name, goal, objective, audiences, channels, dates, budget, status.
- M04.2 (P2) Content calendar (month/week/list), content bank, items by channel and format.
- M04.3 (P2) Channel plans, social, email, paid and blog planning as content item types with
  channel-specific fields.
- M04.4 (P2) Production workflow: draft → review → approved → scheduled → published, with approvals.
- M04.5 (P3) Results: performance metrics joined to campaigns and content items.
- Boundary: Command Centre plans and tracks content. It does not publish to social networks in
  Phase 1–3 [CONFIRM: is publishing in scope later?].

## M05 · Discoverability – Findable (Phase 3)
- M05.1 Not connected: explain Findable, link to activate. No placeholder scores.
- M05.2 Connected: AI visibility per engine (mention, recommendation and citation rates, position,
  sentiment), competitors, question coverage and search performance, as reported by Findable (`07` §4),
  with sample sizes, dates and evidence classes.
- M05.3 Opportunities and recommendations listed; "accept" creates a Command Centre task linked to the
  Findable record; status changes sync back.
- M05.4 Deep links into Findable for any analysis. No SEO analysis runs inside Command Centre.

## M06 · Creative Studio – Reel Deal (Phase 3)
- M06.1 Not connected: explain Reel Deal, link to activate.
- M06.2 Production request form: campaign, objective, audience, brief, formats, deadline, brand. Sent
  to Reel Deal as a project and brief.
- M06.3 Production status per request (brief, concepts, storyboard, rendering, ready, failed) from
  Reel Deal events.
- M06.4 Production approvals surface in the Approval Centre; the decision is sent to Reel Deal.
  Credit-spending steps are confirmed by a human in Reel Deal's quote flow, shown in Command Centre.
- M06.5 Outputs attach to content items; performance comes back via connected social platforms.
- M06.6 Asset library and editing happen in Reel Deal (deep links), not here.

## M07 · Projects and Tasks (Phase 1)
- M07.1 Projects with every §11 field; board, list and timeline views.
- M07.2 Tasks with every §11 field; my tasks; filters and saved views.
- M07.3 Dependencies with cycle detection; blocked tasks flagged automatically.
- M07.4 Recurring tasks (RRULE); next instance created on completion or schedule.
- M07.5 Workload view per person/team: open tasks, due this week, overdue; uneven load flagged.
- M07.6 Project risk flags: overdue milestones, blocked critical tasks, budget overrun.
- M07.7 (P2) Workflow automation: "when X then Y" rules limited to safe actions.

## M08 · AI Workforce (Phase 2)
- M08.1 Agent library of the §9 templates, each with default instructions, tools and autonomy.
- M08.2 Configure instructions, knowledge scope, tools, permissions, schedule, triggers, autonomy.
- M08.3 Run history with status, cost, outputs; full step trace.
- M08.4 Collaboration: an agent can hand off to another within the same run tree, sharing only
  context both are authorised to read.
- M08.5 Usage and performance: runs, success rate, acceptance rate of recommendations, cost.

## M09 · Performance and Insights
- M09.1 (P1) Basic reporting: KPIs and project/task metrics, manual metric entry (`measured` only if
  the user attests the source; otherwise `estimated`).
- M09.2 (P1) GA4 connector (first integration), using the one Google connection per business described
  in `decisions.md`. Search Console data comes from Findable, not a second Command Centre connector.
- M09.3 (P3) Unified reporting across channels, Findable and Reel Deal.
- M09.4 (P3) Monthly/quarterly/annual review generation and PDF export.
- M09.5 (P4) Attribution and forecasting, with methods shown and outputs marked `estimated`.

## M10 · Approval Centre (Phase 2)
- M10.1 One inbox for every §14 kind, filters by kind, requester, age.
- M10.2 Approval detail shows the exact version being approved; editing the record after submission
  invalidates the pending approval.
- M10.3 Approve, reject, request changes; comments; every §14 field recorded.
- M10.4 Approval rules per kind: who can approve, how many approvers, self-approval forbidden.

## M11 · Strategy Assistant (Phase 2)
- M11.1 Chat grounded in the workspace's data and knowledge, with citations to records.
- M11.2 Can propose tasks, projects, objectives; proposals become drafts or approvals, never direct
  writes.
- M11.3 Can call specialist agents; shows which agent did what.
- M11.4 Clearly marks interpretation versus measured data.

## Cross-cutting (from the pilot, `docs/pilot-review.md` §3)
- X.1 (P1) Cultural authority: each workspace can record who holds authority over its cultural content
  and what must not go into AI tools. Records flagged for cultural review cannot be shared, published or
  sent to another product until that authority approves. Agents never receive content marked
  "not for AI tools".
- X.2 (P1) Demo, fixture and illustrative data flagged in the schema and badged wherever shown; never
  counted in reports.
- X.3 (P2) Visibility levels and consent on intelligence and learnings before anything is shared
  outside the workspace (e.g. an agency's cross-client benchmarks).

## Administration
- A.1 (P1) Organisation, workspaces, brands, users, invitations, roles, teams.
- A.2 (P1) Notification preferences per user and channel.
- A.3 (P1) Audit log viewer with filters and export.
- A.4 (P1) Security and privacy: sessions, MFA requirement, data export, deletion, AI data-use settings.
- A.5 (P1) Integrations hub with connection status and last sync.
- A.6 (P4) Billing, plans, usage and credits (basic usage view in P2).
