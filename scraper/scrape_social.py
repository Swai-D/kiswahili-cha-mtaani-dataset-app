"""
scrape_social.py

Inatumia Apify Actors kuchukua machapisho ya mitandao ya kijamii kulingana
na malengo uliyoweka kwenye config/keywords.py (APIFY_TARGETS).

MUHIMU: kila Actor kwenye Apify Store ina "Input schema" na "Output" fields
zake — angalia Actor uliyochagua kwenye Apify Console (tab za "Input" na
"Output") na urekebishe `run_input` na field za maandishi kwenye
config/keywords.py ipasavyo. Actor IDs za mfano hazijawekwa hapa kwa
makusudi — chagua zile zinazolingana na jukwaa unalotaka na uangalie ToS
ya jukwaa hilo kabla ya kuendesha kwa scale kubwa.
"""
import os
import json
from dotenv import load_dotenv
from apify_client import ApifyClient

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config.keywords import APIFY_TARGETS, APIFY_TEXT_FIELD_CANDIDATES

load_dotenv()

APIFY_TOKEN = os.getenv("APIFY_TOKEN")
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "output", "social_raw.jsonl")


def extract_text_field(item):
    for field in APIFY_TEXT_FIELD_CANDIDATES:
        if item.get(field):
            return item[field]
    return None


def run():
    if not APIFY_TOKEN:
        print("HITILAFU: APIFY_TOKEN haipo kwenye .env")
        return

    client = ApifyClient(APIFY_TOKEN)
    records = []

    for target in APIFY_TARGETS:
        if target["actor_id"] == "weka-actor-id-hapa":
            print(f"[skip] '{target['label']}' — bado hujaweka actor_id halisi kwenye config/keywords.py")
            continue

        print(f"[apify] Inaanzisha Actor: {target['label']} ({target['actor_id']})")
        try:
            run_result = client.actor(target["actor_id"]).call(run_input=target["run_input"])
        except Exception as e:
            print(f"  hitilafu ya kuendesha Actor: {e}")
            continue

        dataset_id = run_result["defaultDatasetId"]
        count = 0
        for item in client.dataset(dataset_id).iterate_items():
            text = extract_text_field(item)
            if not text:
                continue
            records.append({
                "text": text,
                "source_type": "Mitandao ya kijamii",
                "source_name": target["label"],
                "scraped_url": item.get("url") or item.get("postUrl"),
            })
            count += 1
        print(f"  imepata {count} records")

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        for r in records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    print(f"\nJumla ya records: {len(records)}")
    print(f"Imehifadhiwa: {OUTPUT_PATH}")


if __name__ == "__main__":
    run()
