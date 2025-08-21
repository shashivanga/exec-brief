# Database Design - MVP Schema

Here's a **clean, Google-Docs-ready database design** for your MVP (multi-org, per-user dashboards, single role for now, public+private competitors, competitor + industry news, email+password auth, US/English defaults, Google News RSS ingestion hourly, retain last 200 items per competitor, org branding stored). Each item lists the **table name, purpose, key fields, and relationships**.

## 1) Users & Organizations (Tenancy) — core identity and membership

• **profiles** — Stores app-facing profile data shadowing Supabase `auth.users`. Fields: `user_id (uuid, PK)`, `full_name (text)`, `avatar_url (text)`, `timezone (text, default 'America/New_York')`, `created_at (timestamptz)`. Rel: `user_id` ↔ auth.users.id.

• **organizations** — One row per tenant/company. Fields: `id (uuid, PK)`, `name (text)`, `plan (text, default 'free')`, `branding (jsonb: {logo_url, primary_color, secondary_color, pdf_header_text})`, `created_at (timestamptz)`.

• **org\_members** — Links users to orgs (single role for MVP). Fields: `org_id (uuid, FK organizations)`, `user_id (uuid, FK auth.users)`, `role (text, default 'member')`, `created_at (timestamptz)`. PK: `(org_id, user_id)`.

## 2) Dashboards & Cards — per-user, shareable layouts

• **dashboards** — A user's workspace within an org (shareable later). Fields: `id (uuid, PK)`, `org_id (uuid, FK)`, `owner_id (uuid, FK auth.users)`, `name (text, default 'Main')`, `is_default (bool, default true)`, `is_shared (bool, default false)`, `created_at (timestamptz)`. Rel: many `cards`.

• **card\_templates** — Canonical definitions for card kinds. Fields: `key (text, PK; e.g., 'competitor_overview','industry_news','macro_snapshot','company_health','product_metrics','ai_summary')`, `title (text)`, `description (text)`, `type (text enum-like)`, `schema (jsonb, expected data shape)`.

• **cards** — Concrete card instances on a dashboard. Fields: `id (uuid, PK)`, `org_id (uuid, FK)`, `dashboard_id (uuid, FK dashboards)`, `template_key (text, FK card_templates)`, `title (text, optional override)`, `size (text: 's'|'m'|'l', default 'm')`, `position (int)`, `pinned (bool)`, `hidden (bool)`, `data (jsonb, payload such as headlines/metrics)`, `sources (jsonb, [{title,url}])`, `refreshed_at (timestamptz)`, `created_at (timestamptz)`. Index: `(org_id, dashboard_id, position)`.

## 3) Company Catalog & Org Selection — public + private competitors

• **company\_catalog** — Global canonical companies to de-duplicate across orgs. Fields: `id (uuid, PK)`, `name (text, required)`, `ticker (text, nullable)`, `domain (text, nullable)`, `aliases (text[]; alt names)`, `created_at (timestamptz)`. Unique: `(name, COALESCE(ticker,''), COALESCE(domain,''))`.

• **org\_companies** — Companies the org actually tracks. Fields: `id (uuid, PK)`, `org_id (uuid, FK)`, `company_id (uuid, FK company_catalog)`, `label (text; org's preferred name)`, `created_at (timestamptz)`. Unique: `(org_id, company_id)`.

• **source\_feeds** — Ingestion endpoints per company (e.g., Google News RSS, press/blog RSS, SEC later). Fields: `id (uuid, PK)`, `competitor_id (uuid, FK org_companies)`, `kind (text: 'news'|'rss'|'sec'|'financials')`, `url (text)`, `active (bool, default true)`, `created_at (timestamptz)`.

## 4) Ingestion Cache & Industry Topics — hourly fetch without duplication

• **ingested\_items** — Normalized cache of fetched items (pre-AI). Fields: `id (uuid, PK)`, `org_id (uuid, FK)`, `competitor_id (uuid, FK org_companies, nullable for industry-only items)`, `industry_topic_id (uuid, FK industry_topics, nullable)`, `source_kind (text: 'news'|'rss'|'sec'|'financials')`, `source_id (text; provider GUID or URL hash)`, `title (text)`, `url (text)`, `published_at (timestamptz)`, `summary (text short)`, `raw (jsonb; full provider payload)`, `created_at (timestamptz)`. Unique: `(org_id, COALESCE(competitor_id,'00000000-...'), COALESCE(industry_topic_id,'00000000-...'), source_kind, source_id)`.

• **industry\_topics** — Topics/keywords an org tracks for industry news. Fields: `id (uuid, PK)`, `org_id (uuid, FK)`, `name (text; e.g., 'Generative AI in Pharma')`, `queries (text[]; search terms)`, `active (bool)`, `created_at (timestamptz)`.

## 5) Documents & KPI Storage — uploads and structured metrics

• **documents** — Tracks uploaded files in Storage (PDF/DOCX/PPTX/XLSX). Fields: `id (uuid, PK)`, `org_id (uuid, FK)`, `uploader_id (uuid, FK auth.users)`, `storage_path (text; e.g., uploads/{org}/{uuid}.pdf)`, `file_name (text)`, `kind (text enum-like: 'pdf'|'docx'|'pptx'|'xlsx')`, `uploaded_at (timestamptz)`, `status (text: 'stored'|'parsed'|'error')`.

• **document\_texts** — Extracted raw text for quick summaries (no AI required). Fields: `document_id (uuid, PK, FK documents)`, `page_count (int)`, `text (text)`, `created_at (timestamptz)`.

• **document\_extractions** — Heuristic/AI outputs for card content. Fields: `document_id (uuid, PK, FK documents)`, `method (text: 'heuristic'|'ai')`, `bullets (jsonb; array of 3 summary bullets)`, `entities (jsonb; optional)`, `kpis (jsonb; optional)`, `created_at (timestamptz)`.

• **kpi\_definitions** — Canonical KPIs per org (ARR, Churn %, etc.). Fields: `id (uuid, PK)`, `org_id (uuid, FK)`, `name (text)`, `unit (text: '$'|'$M'|'%'|'count')`, `description (text)`, `created_at (timestamptz)`. Unique: `(org_id, name)`.

• **kpi\_values** — Time-series metric values. Fields: `id (uuid, PK)`, `org_id (uuid, FK)`, `kpi_id (uuid, FK kpi_definitions)`, `period (date; day/week/month/quarter end)`, `value (numeric)`, `source_document_id (uuid, FK documents, nullable)`, `created_at (timestamptz)`. Unique: `(org_id, kpi_id, period)`. Index: `(org_id, kpi_id, period desc)`.

## 6) Briefings, Exports, Notifications — daily executive flow

• **briefings** — Saved morning briefings (top 5 cards). Fields: `id (uuid, PK)`, `org_id (uuid, FK)`, `user_id (uuid, FK auth.users)`, `for_date (date)`, `card_ids (uuid[])`, `generated_by (text: 'heuristic'|'ai')`, `sent_at (timestamptz, nullable)`, `created_at (timestamptz)`. Unique: `(org_id, user_id, for_date)`.

• **exports** — Records of rendered PDFs. Fields: `id (uuid, PK)`, `org_id (uuid, FK)`, `user_id (uuid, FK auth.users)`, `kind (text: 'dashboard_pdf')`, `storage_path (text; exports/{org}/{uuid}.pdf)`, `created_at (timestamptz)`.

• **notification\_prefs** — Email digest preferences. Fields: `user_id (uuid, PK, FK auth.users)`, `daily_digest_enabled (bool)`, `digest_hour_utc (int, default 12)`.

## 7) AI Jobs (activated later; optional in early MVP) — provider-agnostic queue

• **ai\_jobs** — Tracks AI tasks (summaries, flags). Fields: `id (uuid, PK)`, `org_id (uuid, FK)`, `job (text: 'summarize'|'classify'|'flag_risks'|'embed')`, `input_ref_type (text: 'document'|'card'|'kpi_set')`, `input_ref_id (uuid)`, `provider (text; 'gemini'|'groq'|'openrouter' etc.)`, `model (text)`, `status (text: 'queued'|'processing'|'done'|'error')`, `output (jsonb)`, `error (text)`, `cost_usd (numeric)`, `created_at (timestamptz)`, `completed_at (timestamptz)`. Index: `(org_id, status, created_at desc)`.

## 8) Storage Buckets & Limits — files and exports

• **uploads bucket (private)** — Path: `uploads/{org_id}/{uuid}.{ext}`; referenced by `documents.storage_path`.

• **exports bucket (private)** — Path: `exports/{org_id}/{uuid}.pdf`; referenced by `exports.storage_path`.

• **Retention** — Keep **last 200** `ingested_items` per competitor; prune older entries via scheduled job.

## 9) Relationships & Usage Notes — how it all connects

• A **user** belongs to many **organizations** via **org\_members**; every content row carries an `org_id` for strict tenancy.

• A **dashboard** belongs to one **org** and has many **cards**; cards use **card\_templates** for consistent shapes.

• An **org** selects companies to monitor via **org\_companies**, each mapped to a canonical **company\_catalog** entry; per-company ingestion endpoints live in **source\_feeds**.

• Hourly jobs fetch Google News/press/blog **RSS** into **ingested\_items** (deduped by `source_id`), which then hydrate **cards** (e.g., Competitor Overview, Industry News) by composing the latest items and writing to `cards.data` + `cards.sources`.

• **Documents** and **KPIs** feed the Company Health/Product Metrics cards; **document\_extractions** can be heuristic now and AI later without schema changes.

• **Briefings** store the 5-card morning set; **exports** record rendered PDFs; **notification\_prefs** controls optional email digests.

• **Branding** lives on **organizations** for later export styling; no schema changes needed when you add branded PDFs.

## 10) Indexing & RLS Guidance — performance and safety

• Suggested indexes: `cards(org_id, dashboard_id, position)`, `ingested_items(org_id, competitor_id, published_at desc)`, `kpi_values(org_id, kpi_id, period desc)`, `briefings(org_id, for_date desc)`.

• Row-Level Security: enable RLS on all org-scoped tables; allow `SELECT/INSERT/UPDATE` only when `auth.uid()` is a member of `org_id` (via an `is_org_member(org_id)` helper function).

---

This schema lets you: (1) connect Lovable to Supabase and create all tables safely for **multi-org, per-user dashboards**, (2) add **email+password auth** and remember each user's dashboards/preferences, and (3) wire in **Google News RSS** ingestion on an hourly schedule to populate **Competitor** and **Industry** cards, while keeping a clean path to later AI without any redesign.