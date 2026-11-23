# Navigation and information architecture

Status: **proposal for review**, 18 November 2026. Builds on the brief (`docs/blueprint.md` §4 and §20)
and the shell in `docs/specs/04-journeys-and-screens.md` §3. No navigation is implemented yet.

## 1. Reconciling the lists

| Item | Brief §4 | Spec 04 | Recommendation |
|---|---|---|---|
| Home / Overview | Module 01 | Left nav | Top of the sidebar |
| Business Intelligence | 02 (includes the knowledge library) | Left nav | Sidebar, "Understand" group |
| Strategy & Growth | 03 | Left nav | "Plan" group |
| Marketing | 04 | Left nav | "Do" group |
| Discoverability (Findable) | 05 | Left nav | "Connected products" group, state depends on subscription (§4) |
| Creative Studio (Reel Deal) | 06 | Left nav | "Connected products" group |
| Projects & Tasks | 07 | Left nav | "Do" group |
| AI Workforce | 08 | Left nav | "Do" group |
| Performance & Insights | 09 | Left nav | "Measure" group |
| Approvals | 10 (Approval Centre) | Left nav | "Measure" group with a count badge; also in the top bar on mobile |
| Strategy Assistant | 11 | Top bar toggle + full page | **Not a sidebar item**: a top-bar button opening a side panel, available on every page (it works on the page's context) |
| Knowledge Hub | Inside 02; §13 heading | Inside Business Intelligence | **Promote to its own sidebar item** in "Understand". Documents are used by every module and by agents; burying them in BI hides them |
| Integrations | Administration; §13 heading | Administration | **Settings section**, plus a "Connections" status card on Home. Changing connections is an admin task; seeing their health is everyone's |
| Settings / Administration | Administration | Left nav | Bottom of the sidebar |

## 2. Recommended hierarchy

```
[Organisation ▾]  [Workspace ▾]  [Brand ▾ only if >1]          Top bar: search ⌘K · Assistant · Approvals · Notifications · Products ▦ · Profile
─────────────────────────────
Home
UNDERSTAND
  Business Intelligence      profile · offerings · locations · audiences · competitors · intelligence register
  Knowledge Hub              documents · approved messaging · brand guidelines
PLAN
  Strategy & Growth          plans · SWOT · objectives & KPIs · experiments · progress & learnings
DO
  Marketing                  campaigns · content calendar · content bank · channel plans
  Projects & Tasks           my tasks · projects · workload
  AI Workforce               agents · run history · library
MEASURE
  Performance & Insights     overview · channels · campaigns · reports
  Approvals  (3)             inbox · history
CONNECTED PRODUCTS
  Discoverability · Findable
  Creative Studio · Reel Deal
─────────────────────────────
Settings                     organisation · workspaces · brands · people & roles · integrations · billing & usage · notifications · audit log · security & privacy
```

Group labels use the mono section-label style (design system §4). The order follows the brief's loop:
understand → plan → do → measure. Second-level items appear as tabs or a sub-list on the module's page,
not as a nested tree in the sidebar, so the sidebar stays at 13 lines.

## 3. Sidebar behaviour

- Expanded 248 px, collapsed 72 px (icons with tooltips); remembered per person.
- Current item: `aria-current="page"`, `bg-nav-selected`.
- Under 1024 px the sidebar becomes an overlay drawer; under 768 px the bottom bar takes over (§7).
- **Only built modules appear.** A module that does not exist yet is not shown with "coming soon"
  (no fake functionality, CLAUDE.md).
- Counts (Approvals, overdue tasks) are real numbers from the service layer, not decorations.

## 4. Product access and locked states

Command Centre is only reached by organisations subscribed to it (the account service refuses entry
otherwise, spec 13 §6). Within it, two kinds of lock exist:

| Situation | What the person sees |
|---|---|
| Findable or Reel Deal **not subscribed** | The item stays in "Connected products", muted, with a small lock icon. Its page explains what the product adds to Command Centre, shows no placeholder data, and offers "Add to your plan" (owner, admin, billing) or "Ask your admin" (others) |
| Subscribed, but the person **has no access** to it | Hidden from that person's sidebar; the product switcher shows it as "Ask your admin" |
| Subscribed, data exchange **switched off** by an admin | Item visible; page says the exchange is off and who can turn it on |
| A Command Centre feature **not in the plan** (e.g. AI Workforce) | Item visible with a lock; page explains the feature, shows the plan that includes it; the service layer also refuses (spec 12: locked means blocked, not just hidden) |
| Lacking permission for an action | Action hidden or disabled with the reason; never a 403 page for something the person can see |

**For customers with only one or two products:** an admin can choose "Hide products we don't use"
(organisation setting). Then the "Connected products" group shows only subscribed products, and
unsubscribed ones are reachable from the product switcher's "More from The Outside In". Default: shown,
because they are the main cross-sell and the brief makes them part of Command Centre's value.

## 5. Organisation, workspace and product switching

| Switcher | Where | Behaviour |
|---|---|---|
| Organisation | Top-left of the sidebar | Lists the person's organisations (own, client, agency). Changing it changes the URL (`/{org}/…`) and all data; a persistent label shows whose data is on screen (J8) |
| Workspace | Next to the organisation | Lists workspaces the person can see in that organisation; hidden when there is only one |
| Brand | Filter beside the workspace | Only if the workspace has more than one brand; a view filter, not a security boundary unless access is brand-scoped |
| Product | Top bar grid icon (account service component A7) | The active organisation's products; subscribed ones open without signing in again; others show "Add to your plan" |

The URL carries the context (`/{orgSlug}/{workspaceSlug}/{module}`), resolved against memberships on
every request; nothing in cookies or headers is trusted as the tenant (spec 03 §4).

## 6. User journeys

### New customer, starting from Command Centre

1. Marketing site → "Start" → account service: create account and organisation.
2. Back in Command Centre: three required fields (business name, website, industry), then choose
   goals.
3. Home with a profile checklist (30% complete). Checklist items: audiences, competitors, first
   objective, invite a teammate, connect Google Analytics, connect Findable or Reel Deal, set up an
   agent. Each skippable; each links to its module.
4. The sidebar shows every built module from the start; empty modules open on their empty state with
   one action, so nothing is a dead end.

### Existing Findable or Reel Deal customer adding Command Centre

1. In their product, the product switcher shows Command Centre with "Add to your plan".
2. After subscribing, Command Centre opens without a second sign-in, already in their organisation.
3. Onboarding is shorter: the business profile and brand pre-fill from what the other product already
   holds (labelled with its source, editable), and "Connected products" shows that product as active.

### Returning customer (weekly)

1. Home: priorities strip (overdue, approvals waiting, due this week), objectives, KPI tiles,
   top recommendations, activity.
2. Open a recommendation → evidence and source → accept (creates a pre-filled task) or dismiss with a
   reason.
3. Approvals badge → inbox → decide.
4. Assistant from any page for "why did enquiries drop?" style questions, with citations.

### Agency strategist

Organisation switcher → client list with a health summary → pick a client → everything changes; the
client's name stays visible in the top bar.

### Approver on a phone

Email or push → approval detail (what, who asked, the diff, evidence) → approve, reject or request
changes → done. No sidebar needed.

## 7. Mobile

The brief makes desktop primary for complex work and mobile for reviewing dashboards, approvals,
tasks and notifications (§24).

| Element | Mobile behaviour |
|---|---|
| Bottom bar | Home · Tasks · Approvals · Notifications · More (spec 04) |
| More | The full sidebar as a list, plus organisation and workspace switchers |
| Assistant | Full-screen sheet from the top bar |
| Tables | Become stacked lists under 768 px |
| Editing-heavy screens (plan editor, campaign builder, agent configuration) | Readable and commentable on mobile; full editing is desktop-first, said plainly rather than hidden |
| Targets | 44 px minimum, safe-area insets respected |

## 8. Open questions for the owner

1. Promote Knowledge Hub to the sidebar and keep Integrations under Settings (§1)?
2. Show unsubscribed products in the sidebar by default, with an admin option to hide them (§4)?
3. Strategy Assistant as a top-bar panel rather than a sidebar item (§1)?
