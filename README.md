# Kiswahili cha Mtaani Dataset App

Mradi huu ni mfumo wa kukusanya, kusafisha na kuhifadhi dataset ya Kiswahili cha mtaani (sheng, lugha ya kila siku) kwa ajili ya mafunzo ya AI na LLMs. Unachangia data kwa mkono, kwa scraping, au kwa kuleta CSV, na unaweza kuifanyia review kwenye admin dashboard.

## Lengo kuu

- Kukusanya data ya Kiswahili cha ulimwengu halisi
- Kuandaa dataset bora kwa ajili ya fine-tuning na mafunzo ya mifano ya lugha
- Kuweka data kwenye database yenye utaratibu wa wazi na wa kudumu

## Vipengele muhimu

- Kuingiza sentensi moja au mazungumzo ya zamu-zamu
- Kuweka metadata kama chanzo, mkoa, mada, na notes
- Quality flag: haijakaguliwa, nzuri, au ina shaka
- Admin dashboard kwa kuhariri, kufuta, na kuangalia duplicate entries
- Import na export ya CSV na JSONL
- Progress tracker inayofuata lengo la maneno lililowekwa

## Muundo wa repo

- app/ — Next.js app, API routes, Prisma schema, na admin dashboard
- scraper/ — Python scripts za scraping
- notebook/ — notebook ya data prep na EDA
- AGENTS.md — maelekezo ya kina kwa AI coding agent

## Setup ya ndani

### Mahitaji

- Node.js 18+
- PostgreSQL (au Docker)

### Hatua

```bash
cd app
npm install
```

Unda faili la `.env` na uweke variables hizi:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/kiswahili_mtaani
APP_PASSWORD=your-secret-password
SESSION_SECRET=your-random-secret
GOAL_WORDS=1000000
```

Kisha endesha:

```bash
npx prisma migrate deploy
npm run dev
```

Fungua http://localhost:3000

## Deployment

Repo hii imeandaliwa kwa deploy kwenye Railway. Unganisha PostgreSQL, weka environment variables, kisha udeploy app yako.

## Usalama

- Weka thamani nyeti kama `APP_PASSWORD` na `SESSION_SECRET` kwenye environment variables
- Usiruhusu password ya default katika production
- Kwa data ya watu halisi, epuka kuweka majina halisi au taarifa zinazoweza kuwatambulisha watu

## Hatua zijazo

- Dashboard ya takwimu zaidi
- Roles za watumiaji wengi
- Uboreshaji wa preprocessing na export kwa fine-tuning
