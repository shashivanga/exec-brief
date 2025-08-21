# Complete Backend Implementation Plan

Perfect—here's a **complete, end-to-end backend implementation plan** that Lovable can execute in small, safe steps. It assumes the database design you approved (multi-org tenancy, per-user dashboards, news via Google News RSS, documents/KPIs, exports, future AI). Each layer has: what to build, key endpoints/edge functions, data contracts, scheduling, and "definition of done." Follow the layers in order; you'll have a working product after Layer 2, and everything else stacks cleanly.

---

## Layer 1 — Foundations (Auth, Tenancy, Default Dashboard)

**Goal:** a signed-in user lands on their org's default dashboard with seeded cards; strict row-level security.

**Build**

* Supabase Auth: **email+password**.
* Secrets (Lovable → Env): `SUPABASE_URL`, `SUPABASE_ANON_KEY` (client), `SUPABASE_SERVICE_ROLE_KEY` (server only), `NEWS_REGION=US`, `NEWS_LANG=en`.
* Storage buckets (private): `uploads`, `exports`.
* Apply the DB you finalized (plus RLS helper `is_org_member(org_id)` and org-scoped policies).
* Seed `card_templates`: `competitor_overview`, `industry_news`, `company_health`, `product_metrics`, `macro_snapshot`.

**Server routes (Lovable backend using service key)**

* `POST /onboarding/start` → body `{ name, orgName }`

  1. create `organizations` row; 2) insert into `org_members`; 3) create `dashboards` (default); 4) seed 3–4 **cards** with placeholder `data` and `sources`.
     **Return** `{ org, dashboard, cards }`.
* `GET /me/dashboard` → returns ordered cards for the user's default dashboard.
* `POST /cards/:id/pin` | `POST /cards/:id/hide` | `POST /cards/reorder` → update `pinned`, `hidden`, `position`.

**Definition of Done**

* New user signs up → immediately gets a default dashboard and can pin/hide cards.
* RLS verified: user cannot read/write another org's rows (basic unit tests).

---

## Layer 2 — Competitors & Industry News (Google News RSS → Cards)

**Goal:** real, auto-updating competitor and industry news powering dashboard cards.

**DB already supports**

* `company_catalog`, `org_companies`, `source_feeds`, `industry_topics`, `ingested_items`, `cards`.

**Flows**

* **Add competitor** (UI → server):

  1. upsert into `company_catalog` `{ name, ticker?, domain?, aliases? }`;
  2. insert into `org_companies` `{ org_id, company_id, label? }`;
  3. insert **source\_feeds** rows for each competitor:

     * `kind='news'`, `url=Google News RSS for US/English: https://news.google.com/rss/search?q="<COMPANY>"%20OR%20site:<DOMAIN>&hl=en-US&gl=US&ceid=US:en`
     * optional `kind='rss'` press/blog feed if known.
* **Add industry topic** (UI → server): insert into `industry_topics` `{ org_id, name, queries[] }`; you'll create a Google News RSS feed per query later or ingest via a separate function.

**Edge functions (Supabase)**

* `fetch_rss` (hourly): for each active `source_feeds` row, fetch RSS XML, parse items, **upsert** into `ingested_items` with `(org_id, competitor_id OR industry_topic_id, source_kind, source_id)` to dedupe.
* `refresh_cards` (hourly, 5–10 minutes after `fetch_rss`):

  * For each `org_companies` row → query latest 3–5 `ingested_items` and **upsert/update** one `competitor_overview` card per competitor (`cards.title = label or canonical name`).
  * For each `industry_topics` row → group latest items by topic and **upsert/update** one `industry_news` card per topic.

**Data contract for card payloads**

* `competitor_overview.data`:
  `{ competitor, ticker?, headlines:[{title,url,ts}], last_refreshed }`
* `industry_news.data`:
  `{ topic, headlines:[{title,url,ts}], last_refreshed }`
  In both, also write `cards.sources = headlines.map({title,url})`.

**Retention**

* Daily scheduled SQL job: keep **latest 200** `ingested_items` per (org, competitor); delete older.

**Definition of Done**

* Selecting competitors/topics shows real headlines on cards within the hour.
* Headlines render consistently on desktop and mobile; `refreshed_at` updates.

---

## Layer 3 — Documents → Heuristic Summaries (No AI yet)

**Goal:** PDF/DOCX/PPTX/XLSX uploads produce a 3-bullet summary on the Company Health card.

**Server routes**

* `POST /documents/sign-upload` → signed URL for `uploads/{org}/{uuid}.{ext}` (private).
* `POST /documents/:id/parse` → after upload, extract raw text into `document_texts` (PDF: pdf.js/pdfminer; DOCX/PPTX: text body; XLSX: skip here).

**Heuristic summary**

* Simple rule: **first 2 pages**, split to sentences, keep the **top 3 longest/most informative** (strip boilerplate).
* Write to `document_extractions` with `method='heuristic'` and `bullets=[...]`.
* **Update/insert** a `company_health` card for the org with `data = { bullets:[...], last_refreshed }` and `sources = [{title:file_name,url:download_url}]`.

**Definition of Done**

* Uploading a PDF yields a 3-bullet "Company Health" card without calling any AI.

---

## Layer 4 — KPI Import (Excel) → Company Health & Product Metrics

**Goal:** structured KPI uploads and card auto-updates.

**Server route**

* `POST /kpis/import-xlsx` (server-only): expects one sheet with headers `name,value,period` (ISO date).

  * Upsert into `kpi_definitions` (`org_id`, `name`, `unit?`).
  * Insert into `kpi_values` (`org_id`, `kpi_id`, `period`, `value`, `source_document_id?`).
  * Normalize display units server-side (e.g., `$M`, `%`) when composing cards.

**Card updates**

* `company_health` card: append "latest KPI highlights" (e.g., last 3 KPI deltas).
* `product_metrics` card: add a concise KPI list with latest value and YoY/period-over-period if available.

**Definition of Done**

* Uploading an Excel template immediately updates KPI cards; conflicting periods are idempotent (unique `(org_id,kpi_id,period)`).

---

## Layer 5 — Branding, Exports, Briefing

**Goal:** boardroom-ready exports and a daily "top-5" briefing.

**Branding**

* `PATCH /org/settings/branding` updates `organizations.branding` `{ logo_url, primary_color, secondary_color, pdf_header_text }` (logo in a public CDN or Supabase signed URL resolved server-side).

**Exports**

* Edge function `export_dashboard`: render the user's current dashboard into a branded PDF (header with logo/colors, timestamp), save to `exports/{org}/{uuid}.pdf`, insert a row in `exports`.
* `POST /export/dashboard` returns the signed URL for download (short TTL).

**Briefing**

* `GET /briefing/today` → returns the **top 5** cards in order: `pinned` first, then newest `refreshed_at`.
* Optional scheduled function `send_daily_digest` (email provider of your choice later): composes the same 5 cards into an email; respects `notification_prefs`.

**Definition of Done**

* Users can download a clean, branded PDF of their dashboard.
* "Briefing" endpoint powers mobile swipe stack and daily digests.

---

## Layer 6 — AI v1 (Upgradeable, Optional)

**Goal:** drop-in intelligence that doesn't break anything if disabled.

**DB already supports** `document_extractions.method='ai'` and `ai_jobs` (if you add it).

**Edge function `ai_dispatch`**

* Pulls queued jobs (e.g., `summarize` a document).
* Calls your chosen provider (start free/low-cost: **Gemini** or **Groq**).
* Writes `document_extractions.method='ai'` with 3 concise bullets.
* Optional: `POST /ai/flag-card` adds `data.flags = { risks:[], opportunities:[] }` on any card.
* **Fallback**: if AI fails or quota exceeded, keep the **heuristic** bullets.

**Briefing scoring (optional enhancement)**

* Score = `pinned + flags + freshness`. Use to order `/briefing/today`.

**Definition of Done**

* If AI keys are present, summaries switch to AI; if not, product still works 100% with heuristics.

---

## Cross-cutting: contracts, scheduling, and quality gates

**Canonical JSON shapes**

* `CardHeadlinesItem` → `{ title: string, url: string, ts?: string }`
* `CompetitorCard` → `{ competitor: string, ticker?: string, headlines: CardHeadlinesItem[], last_refreshed: string }`
* `IndustryCard` → `{ topic: string, headlines: CardHeadlinesItem[], last_refreshed: string }`
* `CompanyHealthCard` → `{ bullets: string[], kpis?: { name:string, value:string, delta?:string }[], last_refreshed: string }`
* Always fill `cards.sources` with the same links you show on the card.

**Schedulers**

* Hourly: `fetch_rss` (minute 5), `refresh_cards` (minute 10).
* Daily: prune `ingested_items` to last **200** per (org, competitor).
* Optional Daily: `send_daily_digest` at each user's `digest_hour_utc`.

**Security**

* All org-scoped tables under RLS using `is_org_member(org_id)`.
* Service key **only** in server/edge code.
* Validate URLs before fetching; backoff on 4xx/5xx; cap per-feed items (≤20/hour).

**Observability**

* Log each function run (`started`, `success`, `errors`, `inserted_count`).
* Add a simple `health` table or logs for last run timestamps per function.

**Acceptance tests per layer**

* L1: RLS denies cross-org reads; onboarding seeds default dashboard.
* L2: adding a competitor creates feeds; within an hour, card has real headlines.
* L3: uploading a PDF creates 3 bullets in `company_health`.
* L4: importing XLSX produces `kpi_values` and updates cards.
* L5: export returns a branded PDF; `/briefing/today` returns 5 items.
* L6: with AI key, `document_extractions.method='ai'` and bullets differ from heuristic; without key, app still passes all prior tests.

---

### What Lovable needs to implement (checklist)

1. **Env & Auth** wired; storage buckets created; DB applied; RLS on.
2. **Routes:** `/onboarding/start`, `/me/dashboard`, `/cards/*`, `/org/settings/branding`, `/documents/*`, `/kpis/import-xlsx`, `/export/dashboard`, `/briefing/today`, `/companies/*`, `/industry-topics/*`.
3. **Edge functions:** `fetch_rss`, `refresh_cards`, `export_dashboard`, `send_daily_digest` (optional), `ai_dispatch` (optional).
4. **Schedulers:** hourly fetch/refresh, daily prune (+ optional digest).
5. **Seeds:** `card_templates` and one demo competitor/topic for staging.
6. **QA:** RLS tests, endpoint smoke tests, function run logs, retention job verification.

This plan is deliberately **iterative**: after **Layer 2** you already have a usable product (auth → org → dashboard → live news). Layers 3–5 make it lovable (documents, KPIs, exports/briefing), and Layer 6 adds optional AI without risking stability.