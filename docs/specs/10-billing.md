# 10 · Subscription and billing architecture

Status: proposed. Covers blueprint §15 and §32. Prices are owner decisions and are not set here;
everything below reads from config.

## 1. Concepts

| Concept | Meaning |
|---|---|
| Product | `command_centre`, `findable`, `reel_deal` |
| Plan | A priced package for one product, or a bundle of products (`config/plans.json`) |
| Subscription | An organisation's active plan(s), billed through Stripe |
| Entitlement | A computed flag or limit the app checks: `feature.ai_workforce`, `limit.users = 10` |
| Allowance | A metered quantity per period: AI credits, storage GB, integration syncs |
| Add-on | Extra allowance or feature bought on top (extra users, extra brands, credit packs) |

## 2. Config shape (`config/plans.json`, illustrative values in brackets)

```json
{
  "version": 1,
  "currency": "[CURRENCY]",
  "plans": [
    {
      "key": "cc_growth",
      "products": ["command_centre"],
      "price": { "monthly": "[PRICE]", "annual": "[PRICE]" },
      "entitlements": {
        "feature.ai_workforce": true,
        "feature.agency": false,
        "limit.users": "[N]",
        "limit.workspaces": "[N]",
        "limit.brands": "[N]",
        "limit.integrations": "[N]",
        "allowance.ai_credits_month": "[N]",
        "allowance.storage_gb": "[N]"
      }
    },
    { "key": "ecosystem", "products": ["command_centre", "findable", "reel_deal"], "…": "…" }
  ],
  "addons": [ { "key": "extra_brand", "entitlements": { "limit.brands": 1 }, "price": "[PRICE]" } ],
  "credit_costs": { "agent_run.routine": "[N]", "agent_run.reasoning": "[N]", "assistant.message": "[N]" }
}
```

## 3. Tables

| Table | Columns |
|---|---|
| `subscriptions` | `org_id`, `stripe_subscription_id`, `plan_key`, `status` (`trialing`, `active`, `past_due`, `cancelled`), `period_start`, `period_end`, `cancel_at` |
| `subscription_items` | `subscription_id`, `addon_key`, `quantity` |
| `entitlements` | `org_id`, `key`, `value jsonb`, `source` (`plan`, `addon`, `override`), `valid_until` (materialised view, recomputed on subscription change) |
| `usage_events` | `org_id`, `workspace_id`, `kind`, `quantity`, `unit`, `cost_micros`, `ref`, `at` (append-only) |
| `credit_ledger` | `org_id`, `delta`, `reason` (`grant`, `hold`, `charge`, `release`, `expire`, `purchase`), `ref`, `balance_after` |

Credit holds mirror Reel Deal's proven pattern: hold before a run, charge on success, release on
failure.

## 4. Flows

- **Checkout:** Stripe Checkout → webhook `customer.subscription.*` → upsert subscription → recompute
  entitlements → audit event. Webhooks are verified, idempotent (event id stored) and processed by the
  worker.
- **Upgrade:** immediate, prorated. **Downgrade:** at period end. If usage exceeds the new limits
  (e.g. too many users), the app blocks adding more and asks the owner to choose what to remove; it
  never deletes data automatically.
- **Enforcement:** `requireEntitlement(ctx, key)` in services; UI hides or explains locked features
  with an upgrade path (no fake previews of locked data).
- **Bundles across products:** each product checks its own entitlements. When products are linked,
  Command Centre publishes `entitlements.updated` to them, or each product reads a shared billing
  service (open question 7).

## 5. Agencies (Phase 4)

Agency plans pay for client organisations: a client org can be billed to the agency's Stripe customer
(`billing_owner_org_id`) while remaining a separate tenant. The client keeps ownership of its data and
can move to direct billing.
