"""
main.py — inaendesha hatua zote: scrape Jamii Forums -> scrape social media
-> kusafisha na kuunganisha -> (hiari) auto-upload kwenye Kiswahili cha
Mtaani app kupitia /api/entries/import.
"""
import os
import csv
import requests
from dotenv import load_dotenv

import scrape_jamii
import scrape_social
import clean_export

load_dotenv()

APP_URL = os.getenv("APP_URL", "").rstrip("/")
APP_PASSWORD = os.getenv("APP_PASSWORD", "")


def auto_upload(records):
    if not APP_URL or not APP_PASSWORD:
        print("\nAPP_URL/APP_PASSWORD havijawekwa — kupakia moja kwa moja kumesitishwa.")
        print("Pakia faili ya CSV kwa mkono kwenye /admin badala yake.")
        return

    print(f"\nInaunganisha na {APP_URL} kupakia records {len(records)}...")
    session = requests.Session()
    res = session.post(f"{APP_URL}/api/auth", json={"password": APP_PASSWORD})
    res.raise_for_status()
    if not res.json().get("ok"):
        print("Login imeshindwa — angalia APP_PASSWORD yako.")
        return

    res = session.post(f"{APP_URL}/api/entries/import", json={"records": records})
    if res.ok:
        data = res.json()
        print(f"Imefanikiwa: {data.get('created', 0)} entries zimeongezwa.")
        if data.get("skipped"):
            print(f"Zilizoskipwa (tupu/fupi mno): {data.get('skipped')}")
    else:
        print(f"Hitilafu ya upload: {res.status_code} — {res.text[:300]}")


def main():
    print("=== HATUA 1: Scraping Jamii Forums ===")
    scrape_jamii.run()

    print("\n=== HATUA 2: Scraping mitandao ya kijamii (Apify) ===")
    scrape_social.run()

    print("\n=== HATUA 3: Kusafisha na kuunganisha ===")
    records = clean_export.run()

    print("\n=== HATUA 4: Auto-upload (hiari) ===")
    auto_upload(records)

    print("\nKazi imekamilika. Angalia output/mtaani_scraped_ready_for_import.csv")


if __name__ == "__main__":
    main()
