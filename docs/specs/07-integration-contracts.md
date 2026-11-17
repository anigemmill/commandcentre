# 07 · Findable and Reel Deal API contracts

Status: proposed, version `2026-11-draft`. The Reel Deal contract maps to services that **already exist**
in the Reel Deal repo (`anigemmill/reeldeal`, `src/server/services/`, exposed today through its MCP
server). Gaps that Reel Deal must add are listed in §3.5. The Findable contract maps to Findable's real
data model (`anigemmill/Tourism-AI-Growth-Platform`, Prisma schema at `b283f7b`); Findable has no
external API yet, so every Findable endpoint here is new work for Findable (§4.5).

## 1. Principles

1. **System of record stays put.** Reel Deal owns projects, media, storyboards, renders and credits.
   Findable owns AI visibility runs and answers, citations, competitors found in answers, website
   assessments, question coverage, content briefs and search data. Command Centre stores references
   (`external_ref`) and summaries, plus its own records that point at them.
2. **Shared context flows out of Command Centre.** Business profile, brands, audiences, competitors and
   campaigns are mastered in Command Centre when connected, and read by the others with
   `cc:context.read`.
3. **Each product works alone.** Every call is optional; failure shows "unavailable, last updated …" in
   Command Centre, never stale data presented as current.
4. **Same evidence classes everywhere:** `measured`, `platform_reported`, `estimated`,
   `ai_interpretation`.
5. **No money moves without a person.** Command Centre never requests Reel Deal's `rd:render` scope.

## 2. Common conventions

| Concern | Rule |
|---|---|
| Transport | HTTPS, JSON, REST under `/api/v1`. The MCP servers stay for AI clients; product-to-product uses REST |
| Auth | Accounts-issued bearer tokens (`13` §5): the signed-in user via token exchange, or the organisation's service principal with `on_behalf_of` for background work. Same organisation id in every product |
| Versioning | `Ecosystem-Version: 2026-11-draft` header; additive changes only within a version |
| Ids | UUIDs; each side stores the other's id in `external_ref` |
| Writes | `Idempotency-Key` header required; repeats within 24 h return the first result |
| Pagination | `?cursor=&limit=` (max 100), response `{ data, next_cursor }` |
| Errors | `{ error: { code, message, details? } }` with codes `not_found`, `forbidden`, `invalid_input`, `conflict`, `rate_limited`, `capability_unavailable`, `insufficient_credits` (codes match Reel Deal's MCP tool errors) |
| Events | Webhooks, `POST` to the subscriber, body `{ id, type, occurred_at, org_ref, data }`, header `Ecosystem-Signature: t=<unix>,v1=<hmac-sha256(secret, t + "." + body)>`; reject if older than 5 min; retries with backoff for 24 h; receivers dedupe on `id` |
| Rate limits | 600 requests/min per organisation; `429` with `Retry-After` |

## 3. Reel Deal ↔ Command Centre

### 3.1 Connection

There is no linking step. When an organisation subscribes to both products (shared account, `13`), the
exchange is available automatically, using the same organisation id on both sides. Command Centre shows
Creative Studio as active once its subscription mirror says Reel Deal is on. Admins can switch the data
exchange off in either product.

### 3.2 Command Centre → Reel Deal (Reel Deal exposes)

| Endpoint | Maps to existing Reel Deal service | Purpose |
|---|---|---|
| `GET /brands`, `GET /brands/{id}` | `brands.listBrands`, `getBrandProfile` | Read brand profiles |
| `PUT /brands/{id}` · `POST /brands` | `createBrandProfile`, `updateBrandProfile` | Push brand guidelines from Command Centre |
| `POST /production-requests` | `projects.createProject` + `creative.createVideoBrief` | Create a project with its brief |
| `GET /projects/{id}` | `projects.getProject` | Status, storyboards, exports |
| `GET /projects/{id}/storyboards/{sid}` | `projects.getStoryboard` | Review content for approval |
| `POST /projects/{id}/storyboards/{sid}/decision` | **new** | Approval decision from Command Centre |
| `GET /exports?project_id=` · `GET /exports/{id}` | `render.listExports`, `getExport` | Final videos (signed URLs, short-lived) |
| `GET /usage` | `usage.getUsage` | Credits and allowances, for display only |

Brand profile mapping (Command Centre `brands` → Reel Deal `BrandInput`):

| Command Centre | Reel Deal | Notes |
|---|---|---|
| `name` | `name` (≤120) | |
| `positioning` + workspace profile `description` | `description` (≤2000) | Truncated with a warning |
| workspace `industry` | `industry` | |
| linked `audiences[].name` | `audiences` (≤10 strings) | |
| `voice` | `voice` (≤1000) | |
| `visual_guidelines.colours` | `colours[] { name, hex, role }` | |
| `visual_guidelines.typography` | `typography { headings, body, notes }` | |
| `visual_guidelines.guidelines` + approved messaging | `guidelines` (≤10000) | |
| `visual_guidelines.restrictions` | `restrictions` (≤20) | |
| logo file | `logo_media_id` | Upload through Reel Deal's media upload, then set |

Production request body:

```json
{
  "cc_ref": { "content_item_id": "…", "campaign_id": "…", "objective_id": "…" },
  "name": "Winter Hot Pools — Reels",
  "brand_id": "<reel deal brand id>",
  "objective": "Grow winter bookings from domestic visitors by 15%",
  "audience": "Auckland couples, 30–45, short-break planners",
  "description": "Campaign brief text …",
  "platform": "Instagram Reels",
  "formats": ["9:16", "4:5"],
  "duration_seconds": 30,
  "deadline": "2026-12-05",
  "media_ids": []
}
```

Fields map onto Reel Deal's `ProjectInput` (`name`, `brand_id`, `objective`, `audience`, `description`,
`platform`, `formats` ∈ `9:16 | 1:1 | 16:9 | 4:5`, `duration_seconds` 5–300, `media_ids`). The brief
`request` text is built from `objective`, `audience` and `description`. `cc_ref` and `deadline` are new
fields Reel Deal stores but does not act on.

### 3.3 Reel Deal → Command Centre (events)

| Event | When | Command Centre does |
|---|---|---|
| `production.created` | Project created (from either side) | Links to content item if `cc_ref` set |
| `production.status_changed` | Project status changes (`draft`, `storyboarding`, `ready_to_render`, `rendering`, `completed`, `archived`) | Updates content item and Creative Studio status |
| `storyboard.ready_for_review` | A storyboard version is ready | Creates an `approvals` row (kind `creative`, `external_product: reel_deal`) |
| `render.succeeded` | Export ready | Attaches export ref to content item; notifies owner |
| `render.failed` | Render failed | Notifies; shows Reel Deal's reason and whether retry is free |
| `brand.updated` | Brand edited in Reel Deal | Shows "changed in Reel Deal" with a diff; does not overwrite silently |

### 3.4 Reel Deal reads from Command Centre

`GET /api/v1/context` (Command Centre, scope `cc:context.read`) returns the workspace's business profile
summary, brands, audiences, competitors and active campaigns, so Reel Deal's AI briefs use the same
business context.

### 3.5 Gaps Reel Deal must close (Phase 3 of Command Centre)

1. A REST surface over the existing services (today they are reachable through MCP and the app only).
2. Accept shared-account tokens and mirror organisations and memberships from accounts (`13` §7). Its
   existing JWKS verifier for MCP OAuth is the starting point.
3. Outgoing webhooks (none exist today).
4. `cc_ref` and `deadline` on projects; storyboard decision endpoint.
5. Performance data for videos (Reel Deal does not track post-publish performance; Command Centre gets
   it from connected social platforms instead, so this may not be needed).

## 4. Findable ↔ Command Centre

Findable's unit is the business (`Operator`). Under the shared account (`13`) a business is an
organisation (or, for multi-location groups, a workspace; Findable's multi-location reporting is
planned, not built).

**Rule for what flows:** Command Centre receives exactly what the business itself may see in its
Findable portal: shared reports, approved briefs, results the business has consent for. Staff-only
drafts, internal notes, fixture runs (`isFixture`) and illustrative records never leave Findable.

### 4.1 Command Centre → Findable (Findable exposes)

| Endpoint | Built from (Findable model) | Returns |
|---|---|---|
| `GET /visibility/summary?period=` | `VisibilityRun`, `VisibilityAnswer` | Per engine (ChatGPT, Perplexity, Google AI Overviews): questions asked, valid answers, mention rate, recommendation rate, average mention position, sentiment split, citation rate, with run dates and the engines' validation status |
| `GET /visibility/answers?since=` | `VisibilityAnswer`, `AnswerCitation` | Answer-level results: question text, engine, mentioned, recommended, position, sentiment, accuracy, cited URLs (response text only where the provider's terms allow) |
| `GET /competitors` | `Competitor` | Name, domains, aliases, status (confirmed or suggested), how it was found, observed evidence counts |
| `GET /coverage` | `QuestionCoverage` | Per traveller question: covered / partial / missing, best page, missing terms |
| `GET /recommendations` | `WebsiteAssessmentResult` (issues with a recommendation) | Title, why, action, pages, impact, effort, confidence, priority score, rank, recheck status, linked task |
| `PATCH /recommendations/{id}` | same | Status from Command Centre (`accepted`, `in_progress`, `done`, `dismissed`) and the Command Centre task reference |
| `GET /content-briefs?status=approved` | `ContentBrief` | Approved briefs: type, title, why now, audience, key points, search intent, questions, outline, relevant pages |
| `GET /reports?status=shared` | `IntelligenceReport` | Shared reports: title, period, snapshot summary, PDF link (signed, short-lived) |
| `GET /search/queries?period=` | `SearchQueryStat` | Search Console queries: clicks, impressions, CTR, position, page |
| `GET /analytics/daily?period=` | `AnalyticsDaily` | GA4 sessions, engaged sessions and key events by landing page, channel and source, including AI referrals |
| `GET /plan` | `Subscription` + entitlements | Plan, analyses used and left this month, competitor limit (display only) |

### 4.2 Findable → Command Centre (events)

| Event | Command Centre does |
|---|---|
| `visibility.run_completed` | Records metrics (`platform_reported` for provider answers; mention and citation rates as `measured` counts over the sample, with sample size shown) |
| `competitor.confirmed` | Offers to add the competitor to the workspace's competitor list |
| `recommendation.created` | Creates an intelligence record (`source_type: findable`) |
| `content_brief.approved` | Offers it as a content item in the content calendar |
| `report.shared` | Links the report on Discoverability and in the next monthly review |
| `analytics.synced`, `search.synced` | Refreshes the performance metrics it reads |

### 4.3 Findable reads from Command Centre

`GET /api/v1/context`: business description, offerings (as Findable `products`), locations, audiences,
competitors and campaign landing pages. Findable keeps its own search-specific profile fields
(`brandNames`, `brandDomains`, `searchLocation`, traveller questions, engines, cadence).

### 4.4 Evidence mapping

Findable is more precise than the blueprint's four classes. Command Centre stores both: the blueprint
class (required) and Findable's original label (`source_claim_type`, `source_confidence`).

| Findable label | Command Centre `evidence_class` |
|---|---|
| GA4 / Search Console figures | `platform_reported` |
| Counts over stored answers (mention rate, citation rate) | `measured` (with sample size and period) |
| Provider answer content (what an engine said) | `platform_reported` |
| `Confidence.MODELLED`, `ClaimType.INFERENCE`, `HYPOTHESIS` | `estimated` |
| Rules or AI-generated recommendations (`RECOMMENDATION`, briefs) | `ai_interpretation` |
| `EvidenceKind.OPERATOR_REPORTED` | `estimated`, labelled "reported by the business" |

### 4.5 Work Findable must do

1. An external API for §4.1 (today there are only internal route handlers), scoped by organisation and
   respecting what the business may see.
2. Outgoing webhooks for §4.2.
3. Move onto the shared account (`13` §7), including turning its single-tenant model into organisations.
4. When both products are subscribed, let Command Centre own tasks: Findable's recommendation → task
   link (`WebsiteAssessmentResult.taskId`) points to the Command Centre task instead of a Findable task.

## 5. Command Centre's own ecosystem endpoints

| Endpoint | Scope | Used by |
|---|---|---|
| `GET /api/v1/context` | `cc:context.read` | Both |
| `POST /api/v1/intelligence` | `cc:intelligence.write` | Both (alternative to webhooks) |
| `POST /api/v1/metrics` | `cc:intelligence.write` | Both |
| `POST /api/v1/status` | `cc:status.write` | Both |
| Webhooks out: `context.updated`, `campaign.created`, `approval.decided` | — | Both |

## 6. Contract tests

Each product publishes an OpenAPI 3.1 file for its side. A shared contract-test suite (consumer-driven)
runs in each repo's CI against the other's schema, so a breaking change fails before release.
