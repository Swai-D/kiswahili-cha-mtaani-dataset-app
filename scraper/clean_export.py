"""
clean_export.py

Inachanganya output/jamii_raw.jsonl na output/social_raw.jsonl, kufanya
usafi wa msingi (kuondoa @mentions/URLs kwa faragha, kuondoa nakala,
kuchuja urefu), na kuandika CSV moja tayari kwa kupakia kwenye Admin
Dashboard ya Kiswahili cha Mtaani app (feature ya "Pakia CSV").

Muundo wa CSV unaofanana na import schema ya app: text, source_type,
source_name, region, topic, notes
"""
import os
import json
import re
import csv

BASE = os.path.dirname(__file__)
JAMII_PATH = os.path.join(BASE, "output", "jamii_raw.jsonl")
SOCIAL_PATH = os.path.join(BASE, "output", "social_raw.jsonl")
FINAL_CSV_PATH = os.path.join(BASE, "output", "mtaani_scraped_ready_for_import.csv")

MENTION_RE = re.compile(r"@[A-Za-z0-9_.]+")
URL_RE = re.compile(r"https?://\S+")
WHITESPACE_RE = re.compile(r"\s+")


def load_jsonl(path):
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


def clean_text(text):
    text = MENTION_RE.sub("", text)          # ondoa @majina (faragha)
    text = URL_RE.sub("", text)              # ondoa links
    text = WHITESPACE_RE.sub(" ", text).strip()
    return text


def run(min_words=3, max_words=300):
    records = load_jsonl(JAMII_PATH)
    records += load_jsonl(SOCIAL_PATH)
    print(f"Jumla ya records kabla ya usafi: {len(records)}")

    seen = set()
    cleaned = []
    for r in records:
        text = clean_text(r.get("text", ""))
        word_count = len(text.split())
        if not (min_words <= word_count <= max_words):
            continue
        key = text.lower()
        if key in seen:
            continue
        seen.add(key)
        cleaned.append({
            "text": text,
            "source_type": r.get("source_type", "Nyingine"),
            "source_name": r.get("source_name", ""),
            "region": "Sijui / Mchanganyiko",   # hakuna region info kwenye scraped data kwa default
            "topic": "Nyingine",                 # hariri baadaye kwenye Admin Dashboard
            "notes": f"scraped_url: {r.get('scraped_url', '')}",
        })

    print(f"Jumla ya records baada ya usafi na dedupe: {len(cleaned)}")

    os.makedirs(os.path.dirname(FINAL_CSV_PATH), exist_ok=True)
    with open(FINAL_CSV_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["text", "source_type", "source_name", "region", "topic", "notes"])
        writer.writeheader()
        writer.writerows(cleaned)

    print(f"Imehifadhiwa: {FINAL_CSV_PATH}")
    print("\nHATUA INAYOFUATA: pakia faili hii kwenye Admin Dashboard (/admin) —")
    print("kitufe 'Pakia CSV' — kisha kagua na uweke quality flag kwa kila entry.")
    return cleaned


if __name__ == "__main__":
    run()
