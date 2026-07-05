# Kiswahili cha Mtaani — Dataset Collector

Full-stack app (Next.js + PostgreSQL + Prisma) ya kukusanya dataset ya Kiswahili cha mtaani
(sheng/lugha ya kila siku) kwa ajili ya kutrain AI/LLM models za baadaye.

Inabadilisha ile HTML artifact ya awali kuwa **real app yenye database**, tayari ku-host
kwenye [Railway](https://railway.app).

---

## Vipengele (Features)

- Kuongeza data kama **sentensi moja** au **mazungumzo ya zamu-zamu** (dialogue turns)
- Fields: maneno ya mtaani, tafsiri ya Kiswahili sanifu, chanzo, mkoa, mada, glossary notes
- Progress bar ya moja kwa moja inayoonyesha maneno mangapi mmefikia kati ya lengo lenu
  (default: 1,000,000 maneno ndani ya mwaka mmoja) + "pace" mnayohitaji kufikia lengo
- Utafutaji (search) wa sentensi zilizoongezwa
- Export ya dataset nzima kama **JSONL** (tayari kwa ML pipelines) au **CSV** (backup)
- Password moja rahisi ya kulinda app (haihitaji akaunti nyingi — kwa matumizi ya
  mtu mmoja/wawili wa nyumbani)
- Data zote ziko kwenye PostgreSQL database yako — si localStorage, si browser storage
- **Admin Dashboard** (`/admin`):
  - CRUD kamili — hariri entry yoyote (si kufuta tu), futa moja moja au kwa wingi (bulk)
  - Filters kwa mkoa, mada, chanzo, aina (sentensi/mazungumzo), na quality flag
  - Quality flag kwa kila entry: *Haijakaguliwa / Nzuri / Ina shaka*
  - Duplicate detection — inaonyesha sentensi zinazofanana kabisa, na kitufe cha
    "baki na moja tu" kufuta nakala kwa haraka
  - **Train / Val / Test split export** — deterministic (kwa seed), tayari kupakiwa
    moja kwa moja kwenye Colab kwa ajili ya fine-tuning
  - **Pakia CSV (bulk import)** — pakia data kutoka kwenye mradi tofauti wa
    scraping (`mtaani-scraper`) bila kuandika kwa mkono; entries zote
    zinaingia na quality flag "Haijakaguliwa" kwa ukaguzi wa lazima

### Import API endpoint — `/api/entries/import`

Inakubali njia mbili:
- **multipart/form-data** na field `file` (CSV) — hii ndiyo inayotumika na
  kitufe "Pakia CSV" kwenye `/admin`. CSV inahitaji column `text` angalau;
  `source_type`, `source_name`, `region`, `topic`, `notes` ni hiari.
- **application/json** na body `{ "records": [{ "text": "...", ... }] }` —
  hii ndiyo njia ya `mtaani-scraper` (script tofauti ya scraping) kupakia
  moja kwa moja kupitia `main.py` yake.

Entries zote zinazopitia import endpoint hii zinapata `qualityFlag:
"haijakaguliwa"` kiotomatiki — haziwezi "kupita" bila kukaguliwa kwenye
Admin Dashboard.

---

## Tech stack

- **Next.js 14** (App Router, JavaScript) — frontend + API routes kwenye app moja
- **PostgreSQL** — database
- **Prisma** — ORM / migrations
- Hakuna framework ya ziada ya CSS (plain CSS, tayari imeandaliwa)

*(Kama ulitegemea Laravel: Next.js ilichaguliwa kwa sababu inakuwezesha ku-deploy
frontend + backend + database schema kwa mradi mmoja tu kwenye Railway bila
kusimamia PHP runtime/webserver tofauti. Ukitaka toleo la Laravel baadaye,
schema na API design hapa chini vinaweza kubadilishwa kwa urahisi.)*

---

## 1. Local Setup (kwenye computer yako)

### Mahitaji
- Node.js 18+ 
- PostgreSQL (au Docker)

### Hatua

```bash
# 1. Ingiza kwenye folder ya project
cd kiswahili-mtaani-app

# 2. Install dependencies
npm install

# 3. Nakili .env.example kuwa .env na jaza thamani zako
cp .env.example .env

# (Hiari) Anzisha Postgres ya local kwa Docker:
docker run --name mtaani-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres

# 4. Endesha migration ili kutengeneza tables
npx prisma migrate deploy

# 5. Anzisha app
npm run dev
```

Fungua http://localhost:3000 — utaombwa password (ile uliyoweka kwenye `.env` kama
`APP_PASSWORD`).

---

## 2. Deploy kwenye Railway

### Hatua kwa hatua

1. **Tengeneza GitHub repo** ya project hii na uipush (`git init`, `git add .`,
   `git commit -m "init"`, kisha uunganishe na GitHub repo).

2. **Railway → New Project → Deploy from GitHub repo** — chagua repo yako.

3. **Ongeza PostgreSQL**: kwenye project yako ya Railway, bofya "+ New" → "Database"
   → "PostgreSQL". Railway itatengeneza `DATABASE_URL` kiotomatiki na kuiunganisha
   kwenye service yako.

4. **Weka Environment Variables** kwenye service ya app yako (tab "Variables"):
   - `DATABASE_URL` — Railway anaweka hii yenyewe akijua umeunganisha Postgres
     (angalia "Reference variable" ili kuunganisha na Postgres service)
   - `APP_PASSWORD` — password ya kuingia kwenye app (chagua yako)
   - `SESSION_SECRET` — string ndefu ya nasibu (tengeneza kwa: `openssl rand -hex 32`)
   - `GOAL_WORDS` — hiari, default ni 1000000

5. **Deploy.** Railway itasoma `railway.json` — itafanya build kisha kabla ya
   kuanzisha app itaendesha `npx prisma migrate deploy` kiotomatiki (tables
   zitatengenezwa automatically wakati wa deploy ya kwanza).

6. Railway itakupa URL ya app yako (mfano `kiswahili-mtaani.up.railway.app`).
   Fungua, weka `APP_PASSWORD` yako, anzeni kukusanya data.

### Baada ya deploy ya kwanza
Kila utakapo-push mabadiliko mapya GitHub, Railway ita-deploy tena kiotomatiki
na kuendesha migrations mpya (kama zipo) kabla ya kuanzisha app.

---

## 3. Muundo wa Database (Prisma schema)

Angalia `prisma/schema.prisma`. Jedwali kuu ni `Entry`:

| Field | Aina | Maelezo |
|---|---|---|
| `type` | String | `"sentence"` au `"dialogue"` |
| `textSheng` | String? | Maneno ya mtaani (kwa aina "sentence") |
| `textStandard` | String? | Tafsiri ya Kiswahili sanifu |
| `turns` | JSON? | Array ya `{speaker, text}` kwa aina "dialogue" |
| `sourceType` | String | Tamthilia / Redio / Mazungumzo n.k. |
| `sourceName` | String? | Jina la kipindi/chanzo |
| `region` | String | Mkoa |
| `topic` | String | Mada |
| `notes` | String? | Glossary ya maneno magumu |
| `wordCount` | Int | Idadi ya maneno (imekokotolewa server-side) |
| `deleted` | Boolean | Soft-delete flag |
| `createdAt` | DateTime | Tarehe ya kuongezwa |

Jedwali la pili `Settings` linahifadhi `startDate`, `targetDate`, na `goalWords`
kwa ajili ya progress bar (linatengenezwa automatically mara ya kwanza app
inapoanza).

---

## 4. Muundo wa Dataset Export (JSONL)

Kila mstari mmoja wa faili ya `.jsonl` ni record moja:

```json
{"type": "sentence", "text": "Mambo vipi msee, unadakiwa wapi leo?", "standard_swahili": "Habari yako rafiki, unakwenda wapi leo?", "turns": null, "source_type": "Mazungumzo ya kawaida", "source_name": null, "region": "Dar es Salaam", "topic": "Maisha ya kila siku", "notes": "'kudakiwa' = kukamatwa/kukumbana na tatizo", "word_count": 6, "quality_flag": "nzuri", "date": "2026-07-01T09:14:02.000Z"}
```

```json
{"type": "dialogue", "text": null, "standard_swahili": null, "turns": [{"speaker": "Msemaji A", "text": "Umeshafika home msee?"}, {"speaker": "Msemaji B", "text": "Bado, niko njiani, kuna foleni mbaya sana."}], "source_type": "Tamthilia", "source_name": "Country Boy", "region": "Dar es Salaam", "topic": "Maisha ya kila siku", "notes": null, "word_count": 12, "quality_flag": "haijakaguliwa", "date": "2026-07-01T09:20:11.000Z"}
```

Format hii ni tayari kutumika moja kwa moja kwenye pipelines za kutrain/fine-tune
LLM (mfano: kupakia kwa Hugging Face `datasets` library, au kubadilisha kuwa
instruction-format baadaye).

### Export API endpoint — `/api/export`

Query params zote ni hiari:

| Param | Default | Maelezo |
|---|---|---|
| `format` | `jsonl` | `jsonl` au `csv` |
| `part` | `all` | `all`, `train`, `val`, au `test` |
| `trainRatio` | `0.8` | asilimia ya train split |
| `valRatio` | `0.1` | asilimia ya val split (test = kilichobaki) |
| `seed` | `42` | seed ya split — seed ile ile = mgawanyo ule ule kila wakati |
| `onlyGood` | `false` | `true` kupata entries zenye quality flag `nzuri` tu |

Mfano: `/api/export?format=jsonl&part=train&trainRatio=0.8&valRatio=0.1&seed=42`

Split ni **deterministic** (kutumia seeded shuffle), kwa hiyo ukipiga `part=train`
na `part=val` na `part=test` kwa seed ile ile, hazitagongana kamwe — kila entry
inaishia sehemu moja tu.

---

## 5. Admin Dashboard (`/admin`)

Fungua `/admin` (baada ya kuingia na password) kupata:

- **Filters** — chuja entries kwa mkoa, mada, chanzo, aina, au quality flag
- **Bulk actions** — chagua entries nyingi kwa checkbox, futa kwa mara moja
- **Hariri (Edit)** — bofya "hariri" kwenye entry yoyote kubadilisha maandishi,
  mkoa, mada, glossary, au quality flag, bila kuifuta na kuiongeza upya
- **Quality flag** — bofya moja ya vitufe (Haijakaguliwa / Nzuri / Ina shaka)
  moja kwa moja kwenye orodha — hii husaidia baadaye kuchuja data "nzuri tu"
  wakati wa fine-tuning (`onlyGood=true` kwenye export)
- **Duplicate detection** — bofya "Kagua nakala" kuona sentensi zinazofanana
  kabisa; kitufe cha "Baki na moja tu" kinafuta nakala zote isipokuwa moja
- **Train/Val/Test export** — weka ratios na seed, pakua faili tatu tofauti
  tayari kwa Colab

---

## 6. Usalama / faragha (muhimu)

- App inalindwa na password moja tu (`APP_PASSWORD`) — inatosha kwa matumizi ya
  ndani ya familia, lakini **usiache thamani ya default** kwenye `.env.example`.
- Badilisha `SESSION_SECRET` iwe string ndefu ya nasibu kabla ya deploy.
- Ukikusanya mazungumzo ya watu halisi (si tamthilia/redio), epuka kuweka majina
  halisi au taarifa zinazoweza kuwatambulisha watu husika kwenye maandishi.
- Fanya backup ya mara kwa mara (JSONL/CSV export) hata kama data iko kwenye
  database — Railway Postgres ina uhakika mzuri, lakini nakala za ziada
  hazidhuru kamwe kwa mradi wa mwaka mzima.

---

## 7. Hatua zijazo (ideas za baadaye)

- Kuongeza roles nyingi (kama watu zaidi ya mmoja watakuwa wanaingiza data)
- Kuunganisha na audio clips (kwa ajili ya baadaye ASR/TTS models)
- Dashboard ya takwimu kwa mkoa/mada (kuona wapi kuna pengo la data)
- **Colab notebook** kwa EDA + cleaning + fine-tune prep — hii itakuwa hatua
  inayofuata (angalia mazungumzo na Claude uliyoyafanya kuhusu hili)
