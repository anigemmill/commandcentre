# 08 · AI orchestration architecture

Status: proposed. Covers blueprint §9, §11 (Strategy Assistant) and §27 (AI infrastructure).

## 1. Components

```
 Trigger (user chat · schedule · event · another agent)
        │
        ▼
 Orchestrator ── builds principal, loads agent config, checks budget
        │
        ├─ Context builder ── retrieval (pgvector under RLS) + structured records the agent may read
        ├─ Model gateway ──── provider interface → Claude (first) · others later
        │                     model registry, routing, retries, usage metering
        ├─ Tool layer ─────── typed tools that call the service layer as the principal
        │                     each tool has a risk level; autonomy gate decides: run · draft · approve
        └─ Run recorder ───── agent_runs + agent_run_steps (every model call, tool call, handoff)
```

## 2. Model gateway

- One `ModelProvider` interface (`complete`, `stream`, `embed`) with Anthropic Claude as the first
  implementation. Providers are configured centrally; customers never supply keys (§27).
- `config/models.json` maps **task classes** to models (e.g. `reasoning`, `routine`, `classification`,
  `embedding`). Agents reference a task class, not a model id, so a model can change without touching
  agents.
- Every call writes a `usage_events` row: org, workspace, agent run, provider, model, input/output
  tokens, cached tokens, cost in micro-units. Costs come from a price table in config.
- Budgets: per-organisation monthly AI allowance from the plan (`10`); soft warning at 80%, hard stop
  at 100% for scheduled agents (chat shows a clear limit message).
- Structured outputs (JSON schema) for every agent output that becomes a record.

## 3. Agents

An agent = template (shipped by The Outside In, versioned in `config/agents/*.json`) + customer
configuration (`agents` table).

| Field | Purpose |
|---|---|
| `instructions` | Template prompt + customer additions (customer text is clearly delimited as data) |
| `knowledge_scope` | Which document kinds, brands and records it may retrieve |
| `tools` | Subset of the template's allowed tools |
| `permission_keys` | Upper bound on what it may do (intersected with the authorising user) |
| `autonomy_level` | 1 Recommend · 2 Prepare · 3 Execute with approval · 4 Execute authorised low-risk |
| `schedule`, `triggers` | Cron and event triggers (e.g. `findable.opportunity.created`) |
| `model_policy` | Task class and max cost per run |

### Autonomy gate

Every tool declares a risk: `read`, `draft`, `internal_write`, `external`, `spend`.

| Tool risk | L1 Recommend | L2 Prepare | L3 Execute with approval | L4 Authorised low-risk |
|---|---|---|---|---|
| `read` | run | run | run | run |
| `draft` (creates a draft or recommendation) | recommendation only | run | run | run |
| `internal_write` (task, status change) | recommendation | draft | approval request | run if the action is on the agent's allow-list |
| `external` (email, Findable/Reel Deal writes) | recommendation | draft | approval request | approval request |
| `spend` (credits, budget, ads) | recommendation | draft | approval request | approval request (never autonomous) |

Level 4 requires an admin to authorise each workflow explicitly (`authorised_by`, date, scope); the
authorisation is audited and expires after 90 days unless renewed.

## 4. Collaboration

- The **Chief of Staff** is the default orchestrator: it receives user requests and scheduled reviews,
  and hands off to specialists.
- A handoff creates a child `agent_run` (`parent_run_id`). The child's principal is the intersection of
  the parent's and its own configuration, so delegation can never widen access.
- Shared context between agents passes as explicit structured messages recorded in the trace. There is
  no hidden shared memory.
- Loop guards: max depth 3, max 8 child runs per root run, max cost per root run.

## 5. Knowledge retrieval

- Documents → text extraction → chunks (~800 tokens, overlap 100) → embeddings → `document_chunks`.
- Query = hybrid: vector similarity + Postgres full-text, run under the principal's RLS context, then
  filtered by `knowledge_scope`.
- Structured context (profile, objectives, KPIs, recent intelligence) is fetched by tools, not stuffed
  into every prompt.
- Every answer cites its sources (record ids or document chunks), shown as links in the UI.

## 6. Safety and transparency

- Prompt-injection posture: retrieved documents, integration data and web content are wrapped as
  untrusted data; tools never take free-text instructions from them; high-risk tools need a structured
  argument that the model must state explicitly and the gate re-checks.
- All AI-generated records carry `created_by_type = agent`, the run id and `evidence_class =
  ai_interpretation` unless they only restate measured data.
- Customers can see every run's steps, inputs (redacted secrets) and costs (§27 "AI usage
  transparency"), and can turn agents off per workspace.

## 7. Strategy Assistant

A chat surface on top of the Chief of Staff. Sessions are stored per user. It can read, cite, run
specialists and **propose** writes (tasks, projects, objectives), which appear as cards to accept. It
does not write directly, regardless of the user's own permissions.

## 8. Phase 2 agent set (first release)

Chief of Staff, Business Strategy, Marketing Performance, Content Strategy, Competitor Intelligence,
Project Management, Reporting. Others from §9 follow as templates once these prove useful, judged by
recommendation acceptance rate and run success rate.
