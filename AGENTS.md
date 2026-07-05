# AGENTS.md — Kiswahili cha Mtaani Dataset Project

This file orients any AI coding agent (Claude Code, Codex, Cursor, etc.) or new
human contributor working in this repository. Read this in full before making
changes. Written in English deliberately (see "Language conventions" below).

## Mission

Build a 1,000,000+ word dataset of authentic Tanzanian street/colloquial
Swahili ("Kiswahili cha mtaani" / sheng) — collected manually, scraped from
public forums and social media, cleaned, and prepared for fine-tuning a
Swahili-capable language model. Most existing Swahili NLP resources use
formal/dictionary Swahili; this project's differentiator is authentic
everyday/street language.

Target timeline: ~1 year of ongoing collection. This is a family project —
primary data-entry users are non-technical.

## Repo layout

```
kiswahili-mtaani/
  app/            Next.js + PostgreSQL web app — manual data entry + admin dashboard
                  Deployed on Railway. This is the system of record (the DB).
  scraper/        Standalone Python scripts (not a deployed service) —
                  Firecrawl (Jamii Forums) + Apify (social media) -> CSV,
                  imported into app/ via /api/entries/import
  notebook/       Google Colab notebook (.ipynb) — EDA, cleaning,
                  train/val/test leakage checks, LoRA fine-tune skeleton.
                  Pulls data from app/'s /api/export.
  AGENTS.md       this file
  README.md       short human-facing overview (in Swahili — see below)
```

Each subfolder also has its own README.md with setup/deploy details specific
to that component. This file is the map that ties them together and should
be your first read; go to the subfolder README for step-by-step commands.

## Language conventions — IMPORTANT, read before editing UI or docs

- **All UI-facing strings in `app/`** (labels, buttons, placeholders, error
  messages, page copy) **are written in Swahili on purpose.** The end users
  are Swahili-speaking, non-technical family members. **Do not translate
  UI strings to English** when refactoring, and do not "fix" Swahili text
  you don't recognize — much of it is intentionally informal/sheng
  (that's the entire point of the dataset).
- Code itself (variable/function names, code comments, commit messages,
  this file, other agent-facing docs) is in English for broader tooling
  compatibility.
- Database/API field names are English (camelCase or snake_case per
  context below) even though the values they store are Swahili text.
- If a human writes to you in Swahili/Sheng in an issue or prompt, you can
  respond in kind, but keep code/comments in English unless told otherwise.

## Components in detail

### 1. `app/` — Data collection + Admin dashboard (the system of record)

- Stack: Next.js 14 (App Router, plain JavaScript — no TypeScript), plain
  CSS (no Tailwind/CSS framework — see `app/globals.css` for design tokens),
  PostgreSQL, Prisma ORM.
- Two user-facing pages:
  - `app/page.js` — daily data-entry form (sentence or dialogue-turn mode),
    live progress bar toward the word-count goal. Used by non-technical
    family members. Keep this page simple; don't add admin-y complexity here.
  - `app/admin/page.js` — CRUD, filters, bulk actions, quality-flag review,
    duplicate detection, CSV import, train/val/test split export. This is
    where scraped/imported data gets reviewed and cleaned.
- Auth: single shared password (`APP_PASSWORD` env var), not a full user
  system. `middleware.js` protects every route except `/login` and
  `/api/auth`. Do not build out multi-user auth unless explicitly asked —
  it's intentionally minimal for a household-scale project.
- Database models (source of truth: `prisma/schema.prisma`):
  - `Entry` — one dataset row (sentence or dialogue turns)
  - `Settings` — singleton row for progress-goal tracking (start/target
    date, word goal), auto-created on first `/api/stats` call
- API routes (`app/api/`):
  | Route | Methods | Purpose |
  |---|---|---|
  | `entries` | GET (list+filter), POST (create) | main CRUD |
  | `entries/[id]` | PATCH (edit), DELETE (soft-delete) | single entry |
  | `entries/bulk` | POST | bulk soft-delete by id list |
  | `entries/import` | POST | bulk import — accepts multipart CSV **or** JSON `{records: [...]}`; always forces `qualityFlag: "haijakaguliwa"` |
  | `duplicates` | GET | exact-text duplicate detection (sentence type only) |
  | `stats` | GET | progress totals for the goal-tracking bar |
  | `export` | GET | JSONL/CSV export; supports deterministic `train`/`val`/`test` split via seeded shuffle (`part`, `trainRatio`, `valRatio`, `seed`, `onlyGood` query params) |
  | `auth` | POST (login), DELETE (logout) | sets/clears the auth cookie |
- See `app/README.md` for local setup and Railway deployment steps.

### 2. `scraper/` — Data acquisition (not a deployed service)

- Plain Python scripts run manually or via cron — no web server, no
  database of its own. Its only job is to produce a CSV that `app/`
  can import.
- `scrape_jamii.py` — Firecrawl (`firecrawl-py`) search + crawl of Jamii
  Forums by keyword. Uses a **heuristic** paragraph-length splitter to
  approximate individual forum posts from a scraped page — this is
  approximate by design and documented as needing tuning after a real run.
- `scrape_social.py` — Apify (`apify-client`) actors for social platforms.
  Actor IDs in `config/keywords.py` are **placeholders** — must be replaced
  with real Actor IDs from Apify Store before this script does anything.
- `clean_export.py` — merges both raw outputs, strips `@mentions` and URLs
  (privacy), dedupes, filters by word count, writes the final CSV.
- `main.py` — orchestrates all three steps in order, then optionally
  auto-uploads to `app/`'s `/api/entries/import` if `APP_URL`/`APP_PASSWORD`
  are set in `scraper/.env`.
- See `scraper/README.md` for setup and — important — a short note on
  platform ToS/legal considerations before scaling up scraping volume.

### 3. `notebook/` — Data prep for fine-tuning

- `kiswahili_mtaani_data_prep.ipynb`, meant to run in Google Colab.
- Fetches `train`/`val`/`test` directly from `app/`'s `/api/export`
  (logs in with `APP_PASSWORD`, hits the export endpoint) — or accepts
  manual file upload as a fallback.
- Notable step: **cross-split duplicate/leakage detection** — because the
  app's split is a deterministic shuffle over *all* entries, if the same
  text existed as a duplicate before splitting it could land in two
  different splits. The notebook detects and fixes this before any
  training happens. If you change the app's export/split logic, keep this
  check in mind.
- Ends with an LoRA fine-tuning skeleton (peft + transformers) — explicitly
  a starting point, not a turnkey pipeline (model choice/compute/hyperparams
  are left to the user).

## Data model reference

`Entry` fields (see `app/prisma/schema.prisma` for the authoritative
definition — this table is a summary, not a substitute):

| Field | Type | Notes |
|---|---|---|
| `type` | `"sentence"` \| `"dialogue"` | |
| `textSheng` | string? | sentence type only |
| `textStandard` | string? | optional formal-Swahili translation, sentence type only — valuable for building sheng↔sanifu translation pairs |
| `turns` | JSON? | `[{speaker, text}, ...]`, dialogue type only |
| `sourceType` | string | one of the values in `lib/helpers.js` `SOURCE_TYPES` |
| `sourceName` | string? | free text, e.g. show/thread name |
| `region` | string | one of `REGIONS` in `lib/helpers.js` |
| `topic` | string | one of `TOPICS` in `lib/helpers.js` |
| `notes` | string? | free-text glossary annotation for slang terms |
| `wordCount` | int | **always server-computed** (`countWords()`), never trust a client-supplied value |
| `qualityFlag` | `"haijakaguliwa"` \| `"nzuri"` \| `"ina_shaka"` | default unreviewed; see `QUALITY_FLAGS`/`QUALITY_LABELS` in `lib/helpers.js` |
| `deleted` | boolean | soft-delete flag, never hard-deleted |

## Key workflows (how the three components connect)

1. **Manual entry**: family member uses `app/`'s homepage form → `Entry`
   created directly via `POST /api/entries`.
2. **Scraped data**: `scraper/` produces a CSV → uploaded via `app/admin`'s
   "Pakia CSV" button (or scraper's own auto-upload) → `POST
   /api/entries/import` → entries land with `qualityFlag: "haijakaguliwa"`
   → reviewed/flagged by the family in `/admin` before being trusted.
3. **Fine-tune prep**: `notebook/` pulls a `train`/`val`/`test` split from
   `app/`'s `/api/export` (optionally `onlyGood=true` to use only
   `qualityFlag: "nzuri"` entries) → cleans/dedupes/checks leakage →
   outputs `prepared_dataset/` → optional LoRA fine-tune.

## Environment variables (master list)

`app/.env` (see `app/.env.example`):
- `DATABASE_URL` — Postgres connection string (Railway auto-provides when
  the Postgres plugin is attached)
- `APP_PASSWORD` — shared login password for the whole app
- `SESSION_SECRET` — random string for signing the auth cookie
- `GOAL_WORDS` — optional, default 1,000,000

`scraper/.env` (see `scraper/.env.example`):
- `FIRECRAWL_API_KEY`
- `APIFY_TOKEN`
- `MAX_RESULTS_PER_KEYWORD` — optional throttle
- `APP_URL`, `APP_PASSWORD` — optional, for `main.py`'s auto-upload step
  (same password as `app/.env`'s `APP_PASSWORD`, different `.env` file)

## Common tasks — where to make changes

- **Add a new region/topic/source-type option**: edit `app/lib/helpers.js`
  (`REGIONS`/`TOPICS`/`SOURCE_TYPES` arrays) **and**
  `app/app/api/entries/import/route.js` (`VALID_REGIONS`/`VALID_TOPICS`/
  `VALID_SOURCE_TYPES` sets) — these must stay in sync or CSV imports will
  silently fall back to "Nyingine"/"Sijui / Mchanganyiko".
- **Change the dataset goal or timeline**: `GOAL_WORDS` env var; the
  365-day target window is computed in `app/app/api/stats/route.js` when
  the `Settings` row is first created — changing it after the fact requires
  updating the existing `Settings` row (e.g. via `prisma studio`), not just
  the env var.
- **Add a new quality-flag value**: `QUALITY_FLAGS`/`QUALITY_LABELS` in
  `app/lib/helpers.js`. No migration needed — `qualityFlag` is a plain
  string column, not a Postgres enum.
- **Change train/val/test split logic**: `seededShuffle()`/`splitDataset()`
  in `app/lib/helpers.js`, consumed by `app/app/api/export/route.js`.
  Remember the split is deterministic by seed — changing the shuffle
  algorithm will change every existing split's composition.
- **Add a new scraping source**: new script in `scraper/`, following the
  pattern in `scrape_jamii.py`/`scrape_social.py`. Output must ultimately
  match the CSV columns `app/api/entries/import` expects: `text`,
  `source_type`, `source_name`, `region`, `topic`, `notes`.

## Conventions / style

- Next.js App Router, plain JavaScript (no TypeScript by choice — keep it
  that way unless asked to migrate).
- Plain CSS, no framework. Follow the existing tokens in `app/globals.css`
  (warm/terracotta palette, Fraunces + Work Sans fonts) if adding UI.
- Prisma migrations under `app/prisma/migrations/` were **hand-written**
  (this repo was built without a live Postgres instance to run
  `prisma migrate dev` against). They're standard SQL and should apply
  cleanly via `prisma migrate deploy`, but validate on the first real
  deploy rather than assuming.
- Python: standard library + the minimal deps in `scraper/requirements.txt`.
  No async needed — these are batch scripts, not services.

## Known limitations / verify before scaling

- `app/prisma/migrations/*` — hand-written, not generated against a live
  DB (see above). Low risk, but verify on first deploy.
- `scrape_jamii.py`'s post-splitting heuristic is approximate by design —
  expect to tune `split_into_candidate_posts()` after inspecting a real
  `output/jamii_raw.jsonl`.
- `APIFY_TARGETS` actor IDs in `scraper/config/keywords.py` are unfilled
  placeholders — `scrape_social.py` will skip them and print a warning
  until real Actor IDs are set.
- No automated tests exist in either component yet.
- The admin dashboard loads up to 500 entries per query (no true
  pagination yet) — fine at current scale, will need real pagination
  once the dataset grows past a few thousand entries.

## Status / roadmap

- [x] Data collection app — manual entry (sentence + dialogue modes),
      live progress tracking
- [x] Admin dashboard — CRUD, filters, quality flags, duplicate detection,
      deterministic train/val/test export
- [x] Scraper skeleton — Firecrawl (Jamii Forums) + Apify (social) → CSV
      → import pipeline into the app
- [x] Colab notebook — EDA, cross-split leakage check, LM + translation-pair
      formatting, LoRA fine-tune skeleton
- [ ] Real Apify actor selection + first live scrape run
- [ ] First real fine-tune run
- [ ] Ideas not yet built: multi-user roles, audio/ASR integration,
      per-region/topic analytics dashboard, true pagination in `/admin`

## If you're an agent picking this up cold

1. Read this file fully, then the README.md in whichever subfolder you're
   about to touch.
2. Check "Known limitations" above before assuming something works
   end-to-end untested.
3. Preserve Swahili UI strings exactly as-is unless the human explicitly
   asks for a wording change.
4. When adding categorical options (region/topic/source type/quality
   flag), always update both the frontend list in `lib/helpers.js` and the
   validation set in the import route — see "Common tasks" above.
5. Prefer extending the existing three-component structure over introducing
   a fourth service — the design intent is to keep `app/` as the single
   system of record and everything else as scripts/notebooks that read
   from or write to it through its API.
