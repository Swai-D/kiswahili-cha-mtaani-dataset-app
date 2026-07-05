# Mtaani Scraper

Script (siyo full app) ya kukusanya maandishi ya Kiswahili cha mtaani kutoka
Jamii Forums (kupitia Firecrawl) na mitandao ya kijamii (kupitia Apify),
kuyasafisha, na kuandaa CSV moja tayari kupakiwa kwenye **Kiswahili cha
Mtaani Dataset App** (Admin Dashboard → Pakia CSV).

---

## Kabla ya kuanza — soma hii

- **ToS za majukwaa:** X/Twitter, Instagram, na Facebook kwa ujumla
  zinakataza scraping kwenye Terms of Service zao. Apify Actors haziondoi
  hatari hii — akaunti/proxy zinaweza kuzuiwa. Anza na scale ndogo, angalia
  matokeo, kisha ongeza kadri unavyoona ni salama.
- **Jamii Forums:** Firecrawl inaheshimu `robots.txt` kiotomatiki. Bado ni
  vizuri kuangalia ToS yao na kutokusanya kwa speed/scale kubwa isiyo ya lazima.
- **Faragha:** script hii inaondoa @mentions na links kiotomatiki
  (`clean_export.py`), lakini bado angalia maandishi kwa mkono kwenye Admin
  Dashboard kabla ya kuweka quality flag "nzuri" — hasa maudhui kutoka
  mitandao ya kijamii ambayo yanaweza kuwa na taarifa za kibinafsi ndani ya
  maandishi yenyewe (majina, namba za simu, n.k.).
- Hii ni script ya kuanzia — itahitaji marekebisho kadri unavyoiona ikifanya
  kazi kwenye majukwaa halisi (angalia maelezo ndani ya kila faili).

---

## Muundo

```
mtaani-scraper/
  .env.example
  requirements.txt
  config/keywords.py       ← weka keywords zako na Apify Actor IDs hapa
  scrape_jamii.py           ← Firecrawl: search + crawl Jamii Forums
  scrape_social.py          ← Apify: Actors za mitandao ya kijamii
  clean_export.py           ← kusafisha + kuunganisha + CSV ya mwisho
  main.py                   ← inaendesha hatua zote kwa mpangilio
  output/                   ← matokeo (jsonl za kati + CSV ya mwisho)
```

## Setup

```bash
cd mtaani-scraper
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# jaza FIRECRAWL_API_KEY na APIFY_TOKEN kwenye .env
```

### 1. Weka keywords na malengo yako
Fungua `config/keywords.py`:
- `JAMII_KEYWORDS` — maneno/mada za kutafuta kwenye Jamii Forums
- `JAMII_FORUM_SECTIONS` — (hiari) URLs za sehemu maalum za kufanyia crawl
- `APIFY_TARGETS` — chagua Actors kutoka [Apify Store](https://apify.com/store)
  zinazolingana na jukwaa unalotaka (Twitter/X, Instagram, n.k.), weka
  `actor_id` halisi na `run_input` kulingana na Input schema ya Actor hiyo

### 2. Endesha
```bash
# Kila hatua peke yake:
python scrape_jamii.py
python scrape_social.py
python clean_export.py

# Au zote kwa pamoja:
python main.py
```

### 3. Pakia matokeo kwenye app
- **Njia A (rahisi):** fungua `/admin` kwenye Kiswahili cha Mtaani app yako,
  bofya "Pakia CSV", chagua `output/mtaani_scraped_ready_for_import.csv`
- **Njia B (automatic):** weka `APP_URL` na `APP_PASSWORD` kwenye `.env` —
  `main.py` itapakia moja kwa moja mwishoni mwa run

Entries zote zinazopakiwa zinaingia na `qualityFlag: "haijakaguliwa"` —
kagua na uweke flag sahihi ("nzuri" / "ina shaka") kabla ya kuzitumia
kwenye export ya fine-tuning (`onlyGood=true`).

---

## Kumbuka kuhusu ubora wa data

- `scrape_jamii.py` inagawa ukurasa mmoja wa forum kuwa "posts zinazowezekana"
  kwa heuristic rahisi (paragraph length) — si sahihi 100%. Kagua
  `output/jamii_raw.jsonl` mara ya kwanza kuona kama inafanya kazi vizuri
  kwenye muundo halisi wa ukurasa, urekebishe `split_into_candidate_posts()`
  kama inahitajika.
- `region` na `topic` za scraped data zinawekwa default
  ("Sijui / Mchanganyiko" / "Nyingine") kwa sababu scraper haiwezi kujua hizi
  kwa uhakika — sahihisha kwenye Admin Dashboard baada ya kupakia.
