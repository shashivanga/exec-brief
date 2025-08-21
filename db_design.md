# Database Design - Comprehensive Multi-Org MVP Schema

Here's the **single, comprehensive database design** for the complete MVP (multi-org tenancy, per-user dashboards, competitor & industry news via Google News RSS, documents/KPIs, exports/briefings, and future AI). Each item lists the **table name, purpose, key fields, and relationships** in clear prose.

## 1) Users & Organizations (Tenancy)
• **profiles** — App-facing profile for each Supabase `auth.users` row. Fields: `user_id (uuid, PK → auth.users.id)`, `full_name (text)`, `avatar_url (text)`, `timezone (text, default 'America/New_York')`, `created_at (timestamptz)`.
• **organizations** — One row per tenant/company, including branding used in exports. Fields: `id (uuid, PK)`, `name (text)`, `plan (text, default 'free')`, `branding (jsonb: {logo_url, primary_color, secondary_color, pdf_header_text})`, `created_at (timestamptz)`.
• **org_members** — Connects users to orgs (single role for MVP). Fields: `org_id (uuid, FK organizations)`, `user_id (uuid, FK auth.users)`, `role (text, default 'member')`, `created_at (timestamptz)`. Primary key `(org_id, user_id)`. This is used by RLS to enforce tenant isolation.

## 2) Dashboards & Cards (Per-User, Shareable Later)
• **dashboards** — A user's workspace within an org (shareable toggle for later). Fields: `id (uuid, PK)`, `org_id (uuid, FK)`, `owner_id (uuid, FK auth.users)`, `name (text, default 'Main')`, `is_default (bool, default true)`, `is_shared (bool, default false)`, `created_at (timestamptz)`.
• **card_templates** — Canonical definitions of card kinds used in the product. Fields: `key (text, PK; e.g., 'competitor_overview','industry_news','company_health','product_metrics','macro_snapshot','ai_summary')`, `title (text)`, `description (text)`, `type (text)`, `schema (jsonb; expected data shape)`.
• **cards** — Concrete card instances on dashboards. Fields: `id (uuid, PK)`, `org_id (uuid, FK)`, `dashboard_id (uuid, FK dashboards)`, `template_key (text, FK card_templates)`, `title (text, optional override)`, `size (text: 's'|'m'|'l', default 'm')`, `position (integer)`, `pinned (bool)`, `hidden (bool)`, `data (jsonb; payload shown on the card such as headlines/metrics)`, `sources (jsonb; array of `{title,url}` citations)`, `refreshed_at (timestamptz)`, `created_at (timestamptz)`. Index `(org_id, dashboard_id, position)` for fast ordering.

## 3) Company Catalog & Org Selections (Competitors: Public + Private)
• **company_catalog** — Global canonical companies to de-duplicate across orgs. Fields: `id (uuid, PK)`, `name (text, required)`, `ticker (text, nullable)`, `domain (text, nullable)`, `aliases (text[]; alt names)`, `created_at (timestamptz)`. Unique `(name, coalesce(ticker,''), coalesce(domain,''))`.
• **org_companies** — Companies an org actively tracks. Fields: `id (uuid, PK)`, `org_id (uuid, FK organizations)`, `company_id (uuid, FK company_catalog)`, `label (text; org's preferred display name)`, `created_at (timestamptz)`. Unique `(org_id, company_id)`.
• **source_feeds** — Ingestion endpoints per org-company (e.g., **Google News RSS** and company press/blog RSS). Fields: `id (uuid, PK)`, `competitor_id (uuid, FK org_companies)`, `kind (text: 'news'|'rss'|'sec'|'financials' — start with 'news' and 'rss')`, `url (text; e.g., Google News RSS query for US/English)`, `active (bool, default true)`, `created_at (timestamptz)`.

## 4) Industry Topics (Non-Company News)
• **industry_topics** — Topics/keywords an org tracks for broader news. Fields: `id (uuid, PK)`, `org_id (uuid, FK)`, `name (text; e.g., 'AI in Retail')`, `queries (text[]; list of search terms)`, `active (bool, default true)`, `created_at (timestamptz)`.

## 5) Ingestion Cache (News/RSS → Cards, with Retention Policy)
• **ingested_items** — Normalized cache of fetched items so the app doesn't hit APIs live; also enables **retaining only the last 200 items per competitor**. Fields: `id (uuid, PK)`, `org_id (uuid, FK)`, `competitor_id (uuid, FK org_companies, nullable for industry-only items)`, `industry_topic_id (uuid, FK industry_topics, nullable for company-only items)`, `source_kind (text: 'news'|'rss'|'sec'|'financials')`, `source_id (text; provider GUID or URL hash for dedupe)`, `title (text)`, `url (text)`, `published_at (timestamptz)`, `summary (text short)`, `raw (jsonb; full provider payload)`, `created_at (timestamptz)`. Unique `(org_id, coalesce(competitor_id, ZERO_UUID), coalesce(industry_topic_id, ZERO_UUID), source_kind, source_id)`. Index `(org_id, competitor_id, published_at desc)` for "latest 5" reads. A daily job prunes older rows to **keep only the newest 200 per (org, competitor)**.

## 6) Documents & KPIs (Uploads and Structured Metrics)
• **documents** — Tracks uploaded files in Storage (`uploads` bucket) for summaries and KPI imports. Fields: `id (uuid, PK)`, `org_id (uuid, FK)`, `uploader_id (uuid, FK auth.users)`, `storage_path (text; e.g., `uploads/{org}/{uuid}.pdf`)`, `file_name (text)`, `kind (text: 'pdf'|'docx'|'pptx'|'xlsx')`, `uploaded_at (timestamptz)`, `status (text: 'stored'|'parsed'|'error')`.
• **document_texts** — Extracted raw text for quick heuristic summaries (AI optional later). Fields: `document_id (uuid, PK, FK documents)`, `page_count (int)`, `text (text)`, `created_at (timestamptz)`.
• **document_extractions** — Heuristic/AI outputs for card content. Fields: `document_id (uuid, PK, FK documents)`, `method (text: 'heuristic'|'ai')`, `bullets (jsonb; e.g., three executive bullets)`, `entities (jsonb; optional)`, `kpis (jsonb; optional)`, `created_at (timestamptz)`.
• **kpi_definitions** — Canonical KPIs per org (ARR, Churn %, etc.). Fields: `id (uuid, PK)`, `org_id (uuid, FK)`, `name (text)`, `unit (text: '$'|'$M'|'%'|'count')`, `description (text)`, `created_at (timestamptz)`. Unique `(org_id, name)`.
• **kpi_values** — Time-series values for each KPI. Fields: `id (uuid, PK)`, `org_id (uuid, FK)`, `kpi_id (uuid, FK kpi_definitions)`, `period (date; day/week/month/quarter end)`, `value (numeric)`, `source_document_id (uuid, FK documents, nullable)`, `created_at (timestamptz)`. Unique `(org_id, kpi_id, period)`. Index `(org_id, kpi_id, period desc)`.

## 7) Briefings, Exports, Notifications (Daily Executive Flow & Branding)
• **briefings** — Saved "morning briefing" sets (top 5 cards). Fields: `id (uuid, PK)`, `org_id (uuid, FK)`, `user_id (uuid, FK auth.users)`, `for_date (date)`, `card_ids (uuid[])`, `generated_by (text: 'heuristic'|'ai')`, `sent_at (timestamptz, nullable)`, `created_at (timestamptz)`. Unique `(org_id, user_id, for_date)`.
• **exports** — Records of rendered PDFs (stored in `exports` bucket). Fields: `id (uuid, PK)`, `org_id (uuid, FK)`, `user_id (uuid, FK auth.users)`, `kind (text: 'dashboard_pdf')`, `storage_path (text; e.g., `exports/{org}/{uuid}.pdf`)`, `created_at (timestamptz)`.
• **notification_prefs** — Email digest preferences per user. Fields: `user_id (uuid, PK → auth.users.id)`, `daily_digest_enabled (bool)`, `digest_hour_utc (int, default 12)`. Branding for exports (logo/colors) is read from **organizations.branding**.

## 8) AI Jobs (Future-Proofing)
• **ai_jobs** — Provider-agnostic queue for AI tasks. Fields: `id (uuid, PK)`, `org_id (uuid, FK)`, `job (text: 'summarize'|'classify'|'flag_risks'|'embed')`, `input_ref_type (text: 'document'|'card'|'kpi_set')`, `input_ref_id (uuid)`, `provider (text; 'gemini'|'groq'|'openrouter')`, `model (text)`, `status (text: 'queued'|'processing'|'done'|'error')`, `output (jsonb)`, `error (text)`, `cost_usd (numeric)`, `created_at (timestamptz)`, `completed_at (timestamptz)`.

## 9) Storage Buckets (Private)
• **uploads** — Private bucket for incoming documents, referenced by `documents.storage_path`.
• **exports** — Private bucket for generated PDFs, referenced by `exports.storage_path`.

## 10) Row-Level Security (RLS) & Helper
Enable RLS on all org-scoped tables and use a helper function to authorize access: `is_org_member(org_id)` returns true when `auth.uid()` is in `org_members` for that org. Policies: **SELECT/INSERT/UPDATE** allowed only when `is_org_member(org_id)` is true (and for `source_feeds`, membership is checked via the linked `org_companies.org_id`). `card_templates` can be universally readable.

## 11) How This Powers Your Plan (Auth → News → Cards)
Email+password auth creates a user; you create an **organization** and an **org_members** row for them, a default **dashboard**, and seed **cards** using **card_templates**. When a user selects competitors, you upsert into **company_catalog**, link via **org_companies**, and add Google News RSS (US/English) and any press/blog feeds into **source_feeds**. An hourly job reads each feed, normalizes items into **ingested_items** (deduped by `source_id`), and the backend composes **competitor_overview** and **industry_news** **cards.data** + **cards.sources** from the newest items. A daily prune keeps **only the latest 200 items per competitor**. Documents/KPIs feed **company_health** and **product_metrics** cards. Branding in **organizations.branding** is used by PDF **exports**; **briefings** store the 5-card morning set and **notification_prefs** controls digests. AI can be added later using `document_extractions.method='ai'` without schema changes.

## 12) Performance & Indexing
• Key indexes: `cards(org_id, dashboard_id, position)`, `ingested_items(org_id, competitor_id, published_at desc)`, `kpi_values(org_id, kpi_id, period desc)`, `briefings(org_id, for_date desc)`.
• Retention: Keep last 200 `ingested_items` per competitor via scheduled cleanup.

This single design gives you all tables, relationships, and behaviors required to support multi-org tenancy, per-user dashboards, authentication memory, hourly Google News RSS ingestion for competitor/industry insights, uploads/KPIs, branded exports, and future AI—without needing any additional schema passes.