# 07 · Findable and Reel Deal API contracts

Status: proposed, version `2026-11-draft`. The Reel Deal contract maps to services that **already exist**
in the Reel Deal repo (`anigemmill/reeldeal`, `src/server/services/`, exposed today through its MCP
server). Gaps that Reel Deal must add are listed in §3.5. The Findable contract is written without access
to a Findable codebase and needs review by its owners (decisions, open question 5).

## 1. Principles

1. **System of record stays put.** Reel Deal owns projects, media, storyboards, renders and credits.
   Findable owns crawls, rankings, visibility scores and audits. Command Centre stores references
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
| Auth | OAuth 2.1 bearer tokens, one linked organisation per token (`06` §5) |
| Versioning | `Ecosystem-Version: 2026-11-draft` header; additive changes only within a version |
| Ids | UUIDs; each side stores the other's id in `external_ref` |
| Writes | `Idempotency-Key` header required; repeats within 24 h return the first result |
| Pagination | `?cursor=&limit=` (max 100), response `{ data, next_cursor }` |
| Errors | `{ error: { code, message, details? } }` with codes `not_found`, `forbidden`, `invalid_input`, `conflict`, `rate_limited`, `capability_unavailable`, `insufficient_credits` (codes match Reel Deal's MCP tool errors) |
| Events | Webhooks, `POST` to the subscriber, body `{ id, type, occurred_at, org_ref, data }`, header `Ecosystem-Signature: t=<unix>,v1=<hmac-sha256(secret, t + "." + body)>`; reject if older than 5 min; retries with backoff for 24 h; receivers dedupe on `id` |
| Rate limits | 600 requests/min per linked org; `429` with `Retry-After` |

## 3. Reel Deal ↔ Command Centre

### 3.1 Linking

`GET /api/v1/organisation` (Reel Deal) returns `{ id, name, plan, credit_balances }` for the token's
organisation. Command Centre stores it on `integrations` (provider `reel_deal`).

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
2. OAuth authorisation server live (verifier exists; Supabase OAuth server not yet connected).
3. Outgoing webhooks (none exist today).
4. `cc_ref` and `deadline` on projects; storyboard decision endpoint.
5. Performance data for videos (Reel Deal does not track post-publish performance; Command Centre gets
   it from connected social platforms instead, so this may not be needed).

## 4. Findable ↔ Command Centre

### 4.1 Command Centre → Findable (Findable exposes)

| Endpoint | Returns |
|---|---|
| `GET /visibility?period=` | Scores for SEO, AEO and GEO/AI search, with method, period and evidence class |
| `GET /findings?since=` | Search findings: issue, severity, affected URLs, evidence, detected_at |
| `GET /opportunities` | Keyword and content opportunities: query, intent, volume (`platform_reported` or `estimated`), difficulty, current position |
| `GET /competitors` | Competitor visibility per competitor domain |
| `GET /recommendations` | Website optimisation recommendations with expected impact and effort |
| `PATCH /recommendations/{id}` | Status from Command Centre (`accepted`, `in_progress`, `done`, `dismissed`) |
| `GET /performance?metric=&period=` | Search performance time series |
| `POST /audits` | Request a new audit (scope `fd:write`) |

### 4.2 Findable → Command Centre (events)

`finding.created`, `opportunity.created`, `recommendation.created`, `visibility.updated`,
`audit.completed`. Command Centre turns each into an intelligence record (`source_type: findable`,
`evidence_class` as sent) or a performance metric.

### 4.3 Findable reads from Command Centre

`GET /api/v1/context`: website, locations, offerings, audiences, competitors, campaign landing pages.

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
