# Kiswahili cha Mtaani App

Hii ni app ya kukusanya, kuhifadhi, na kuangalia dataset ya Kiswahili cha mtaani kwa matumizi ya AI/LLM.

## Kipi app hii inafanya

- Inaruhusu kuingiza sentensi au mazungumzo ya zamu-zamu
- Huhifadhi metadata kama chanzo, mkoa, mada, na notes
- Ina admin dashboard ya kuhariri, kufuta, na kuangalia duplicate entries
- Inatoa export ya CSV na JSONL kwa ajili ya mafunzo ya modeli
- Ina progress tracker ya lengo la maneno lililowekwa

## Tech stack

- Next.js
- PostgreSQL
- Prisma

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

App hii imeandaliwa kwa deploy kwenye Railway. Unganisha PostgreSQL, weka environment variables, kisha udeploy app yako.

## Usalama

- Weka `APP_PASSWORD` na `SESSION_SECRET` kwenye environment variables
- Usiruhusu password ya default katika production
- Kwa data ya watu halisi, epuka kuweka majina halisi au taarifa zinazoweza kuwatambulisha watu
