# Kiswahili cha Mtaani — Dataset Project

Mradi wa kukusanya dataset ya Kiswahili cha mtaani (sheng/lugha ya kila siku)
kwa ajili ya kutrain/fine-tune AI models za Kiswahili cha kweli — si Kiswahili
cha kamusi.

Lengo: **maneno 1,000,000+** ndani ya mwaka mmoja, yakikusanywa kwa mkono na
kwa scraping, kisha kusafishwa na kuandaliwa kwa fine-tuning.

## Muundo wa mradi

```
kiswahili-mtaani/
  app/          Web app (Next.js + PostgreSQL) — kuongeza data + Admin Dashboard
                Hii ndiyo "chanzo halisi" cha data (database iko hapa)
  scraper/      Script za Python — scraping kutoka Jamii Forums na mitandao
                ya kijamii, kutoa CSV inayopakiwa kwenye app/
  notebook/     Colab notebook — EDA, usafi wa data, kuandaa kwa fine-tuning
  AGENTS.md     Maelekezo ya kina kwa AI coding agent (Kiingereza — angalia hapo)
```

## Ukitaka kufanya kazi na hii wewe mwenyewe
Fungua README.md ndani ya folder unayotaka kufanyia kazi:
- `app/README.md` — setup ya local + jinsi ya deploy Railway
- `scraper/README.md` — setup ya scraper + mambo ya kuzingatia (ToS, faragha)
- `notebook/` — fungua `.ipynb` kwenye Google Colab

## Ukitaka kumtumia AI coding agent (Claude Code, n.k.) kufanya kazi humu
Mpe `AGENTS.md` kwanza — hiyo ndiyo faili inayoelezea mradi mzima, jinsi
components tatu zinavyounganika, wapi kubadilisha kitu gani, na vitu vya
kuzingatia kabla ya kubadilisha msingi wa mfumo. Agents wengi wa kisasa
wanasoma `AGENTS.md` kiotomatiki wakigundua ipo kwenye repo.

## Muhtasari wa mtiririko (workflow)
1. **Kuongeza data kwa mkono** — `app/` homepage, form ya sentensi/mazungumzo
2. **Kuongeza data kwa scraping** — `scraper/` → CSV → `app/admin` "Pakia CSV"
   → kagua na weka quality flag
3. **Kuandaa kwa fine-tuning** — `notebook/` inavuta train/val/test kutoka
   `app/`, inasafisha, inaandaa data tayari
