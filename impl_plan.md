# Backend Implementation Plan (for the simplified schema)

## Phase 0 — Setup & Guardrails

**Goal:** secure foundation, so every later step "just works."

* **Environment variables (server only):**
  `SUPABASE_URL`, `SUPABASE_ANON_KEY` (client use), `SUPABASE_SERVICE_ROLE_KEY` (server only).
  `NEWS_REGION=US`, `NEWS_LANG=en`.

* **Supabase Auth:** enable **Email + Password**.

* **Storage:** create private buckets:
  `uploads` (documents), `exports` (reserved for later).

* **RLS:** enable Row-Level Security on all org-scoped tables. Add helper:

  * `is_org_member(org_id)` → allows `SELECT/INSERT/UPDATE` only for users in `org_members` for that `org_id`.

* **Indexes:**

  * `cards(org_id, dashboard_id, pinned desc, position asc)`
  * `items(org_id, company_id, published_at desc)`
  * `items(org_id, topic_id, published_at desc)`
  * `kpi_points(org_id, kpi_id, period desc)`

**Definition of done:** anonymous user sees nothing; members only see their org's rows; buckets exist.

---

## Phase 1 — Onboarding, Tenancy, Default Dashboard

**Goal:** a new user signs up → gets an org, membership, and a usable dashboard.

**Routes (server):**

* `POST /onboarding/start`
  **Input:** `{ orgName: string, fullName?: string }`
  **Actions:**

  1. create `organizations` row.
  2. insert `org_members (org_id, user_id)`.
  3. create `dashboards` row (`is_default=true`, `owner_id=user`).
  4. seed **3–4 cards** (type: `'competitor'`, `'industry'`, `'company_health'`, `'metrics'`), each with minimal `data` (placeholder) and empty `sources`.
     **Output:** `{ org, dashboard, cards }`.

* `GET /me/dashboard`
  **Action:** find user's default dashboard in current org, return ordered **visible** cards (filter `hidden=false`), sorted by `pinned desc, position asc`.
  **Output:** `[ { id, type, title, data, sources, position, pinned, hidden, refreshed_at } ]`.

* `POST /cards/:id/pin`, `POST /cards/:id/hide`, `POST /cards/reorder`
  **Action:** update `pinned`, `hidden`, or `position` (transaction for multi-reorder).

**Definition of done:** new user flows into a real dashboard with editable cards; RLS prevents cross-org access.

---

## Phase 2 — Companies, Topics, Feeds (Google News RSS) + Hourly Ingestion

**Goal:** selected companies/topics produce live headlines on cards.

**Routes (server):**

* `POST /companies`
  **Input:** `{ name, ticker?, domain?, aliases?[] }`
  **Action:** insert into `companies` (per org).
  **Output:** `{ company }`.

* `POST /topics`
  **Input:** `{ name, queries: string[] }`
  **Action:** insert into `topics`.
  **Output:** `{ topic }`.

* `POST /feeds/autogenerate`
  **Input:** `{ targetType: 'company'|'topic', targetId }`
  **Action:** create **Google News RSS** feed rows in `feeds` for that target.

  * URL pattern (US/en):
    `https://news.google.com/rss/search?q="<NAME>"%20OR%20site:<DOMAIN>&hl=en-US&gl=US&ceid=US:en`
    **Output:** `{ feeds: Feed[] }`.

*(You can also let users add extra RSS (press/blog) later with `POST /feeds`.)*

**Edge Functions (Supabase):**

* **`fetch_rss`** (runs **hourly**)
  **Logic:**

  1. read `feeds` where `active=true`.
  2. fetch & parse RSS; for each item, **upsert** into `items` with dedupe key `(org_id, company_id/topic_id, source_kind, source_id)` where `source_id` = `guid` or URL hash.
     **Writes:** `{ title, url, published_at, summary?, raw }`.

* **`refresh_cards`** (runs hourly, a few minutes **after** `fetch_rss`)
  **Logic:**

  1. for each `company` → query newest 3–5 `items`; **upsert/update** one card per company (`type='competitor'`, `title=company.name`).
     **data:**

     ```json
     {
       "competitor": "<Name>",
       "ticker": "<optional>",
       "headlines": [{ "title": "...", "url": "...", "ts": "..." }],
       "last_refreshed": "ISO"
     }
     ```

     **sources:** same links as headlines.
  2. for each `topic` → group newest 3–5 `items`; **upsert/update** one card (`type='industry'`, `title=topic.name`) with `{ topic, headlines[], last_refreshed }`.

**Maintenance (SQL job, daily):**

* **Prune** `items` so only the **latest 200 per (org, company)** and **latest 200 per (org, topic)** remain.

**Definition of done:** adding a company/topic results in live headlines showing on its card within an hour.

---

## Phase 3 — Documents → Heuristic Summaries (No AI)

**Goal:** upload a PDF/DOCX/PPTX → show a 3-bullet summary in "Company Health."

**Routes (server):**

* `POST /documents/sign-upload`
  **Input:** `{ ext: 'pdf'|'docx'|'pptx'|'xlsx' }`
  **Action:** create a `documents` row; return signed URL to `uploads/{org}/{uuid}.{ext}`.
  **Output:** `{ documentId, uploadUrl }`.

* `POST /documents/:id/parse`
  **Action:** extract **raw text** to `document_texts` (for XLSX, skip—handled in Phase 4).
  **Heuristic summary:**

  * Take first \~2 pages (or up to N characters), split sentences, pick **top 3 informative** sentences (length + presence of numerics/pronouns heuristic).
  * Build `bullets: string[3]`.
  * Update (or create) a `cards` row with `type='company_health'`, `title='Company Health'`.
    **data:**

  ```json
  { "bullets": ["...", "...", "..."], "last_refreshed": "ISO" }
  ```

  **sources:** `[ { "title": "<file_name>", "url": "<signed_download_url>" } ]`.

**Definition of done:** uploading a PDF results in a visible "Company Health" card with 3 concise bullets and a source link.

---

## Phase 4 — KPI Import (Excel) → Metrics & Health Cards

**Goal:** upload an Excel file with KPI rows; render latest values on cards.

**Route (server):**

* `POST /kpis/import-xlsx`
  **Input:** file reference or documentId (already in `documents`).
  **Assumptions:** one sheet; headers: `name, value, period (YYYY-MM-DD)`.
  **Actions:**

  1. Upsert `kpis (org_id, name, unit?)`.
  2. Insert `kpi_points (org_id, kpi_id, period, value)` (idempotent via unique).
  3. Update (or create) `cards` with `type='metrics'` (title "Product Metrics") to show **latest values** and simple deltas if two recent points exist.
  4. Optionally extend `company_health` card with one-line KPI highlights.

**data examples:**

```json
// metrics card
{
  "kpis": [
    { "name": "ARR", "value": "$24.3M", "delta": "+4% QoQ" },
    { "name": "Churn %", "value": "2.1%", "delta": "-0.3pp MoM" }
  ],
  "last_refreshed": "ISO"
}
```

**Definition of done:** importing an XLSX updates KPI cards immediately and safely (no duplicates for the same period).

---

## Phase 5 — Briefing API & Mobile Feed (No email yet)

**Goal:** mobile gets the "top 5" stack; desktop can also call it.

**Route (server):**

* `GET /briefing/today`
  **Logic:** select **top 5** non-hidden cards for the user's default dashboard, ordered by `pinned desc, refreshed_at desc`.
  **Output:** same shape as `/me/dashboard`, limited to 5.

**Definition of done:** mobile can swipe through 5 most relevant cards; order changes as new headlines arrive or user pins items.

---

## Phase 6 — Observability, Rate Limits, Polishing

**Goal:** robustness and safety.

* **Function logging:** each Edge Function logs `{ started_at, count_inserted, count_skipped, errors[] }`.
* **Backoff & caps:** per-feed cap (e.g., up to 20 items/hour); exponential backoff on 4xx/5xx.
* **Validation:** sanitize `url` and ignore invalid items; enforce "one of `company_id` or `topic_id` set" in `feeds`.
* **Tests:**

  * RLS test: user from Org A can't read Org B `items/cards/documents`.
  * Ingestion test: creating a company & feed results in `items` and a refreshed card.
  * Documents test: PDF upload → parse → bullets on card.
  * KPI test: XLSX import updates `metrics` card; unique constraint blocks duplicate periods.

---

## Data Contracts to Keep Things Consistent

* **Competitor card (`type='competitor'`):**

  ```json
  { "competitor": "Name", "ticker": "TICKER?", "headlines":[{"title":"...","url":"...","ts":"ISO"}], "last_refreshed": "ISO" }
  ```

* **Industry card (`type='industry'`):**

  ```json
  { "topic": "Topic Name", "headlines":[{"title":"...","url":"...","ts":"ISO"}], "last_refreshed": "ISO" }
  ```

* **Company Health (`type='company_health'`):**

  ```json
  { "bullets": ["...","...","..."], "last_refreshed": "ISO" }
  ```

* **Metrics (`type='metrics'`):**

  ```json
  { "kpis":[{"name":"ARR","value":"$24.3M","delta":"+4% QoQ"}], "last_refreshed":"ISO" }
  ```

*(Always mirror links in `cards.sources`.)*

---

## Scheduling Summary (Supabase)

* **Hourly:** `fetch_rss` at :05; `refresh_cards` at :10.
* **Daily:** prune `items` to newest **200** per (org, company/topic).
* *(Email digests/exports are deferred per your choice; add later without schema changes.)*

---

### What Lovable Builds, In Order (checklist)

1. Env vars + Auth + RLS helper; buckets created.
2. Phase 1 routes; default dashboard + seeded cards.
3. Company/topic + feed creation; RSS function pair; prune job.
4. Document upload + parse + health card.
5. KPI import + metrics card.
6. Briefing endpoint; logs, backoff, and tests.

This plan matches your simplified schema and the PRD use cases, and it's intentionally thin: **7 tables + 2 edge functions** (plus 2 optional doc/KPI tables) give you a working product quickly, with clean paths for exports and AI later.