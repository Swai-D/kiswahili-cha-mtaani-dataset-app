"""
scrape_jamii.py

Inatumia Firecrawl kutafuta na kuchukua maandishi kutoka Jamii Forums (na
tovuti nyingine za mtaani ukizihitaji) kulingana na keywords.

MUHIMU: Jamii Forums haina muundo rasmi wa "API ya posts", kwa hiyo tunachukua
ukurasa mzima kama markdown na kuugawa vipande vya "posts wanaowezekana" kwa
heuristic rahisi (paragraph splitting + urefu). Hii si sahihi asilimia 100 —
kagua matokeo ya kwanza (output/jamii_raw.jsonl) na urekebishe
`split_into_candidate_posts()` kulingana na muundo halisi wa ukurasa
utakaouona.

Firecrawl inaheshimu robots.txt ya tovuti kwa default.
"""
import os
import json
import re
import time
from dotenv import load_dotenv
from firecrawl import Firecrawl

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config.keywords import JAMII_KEYWORDS, JAMII_FORUM_SECTIONS, MAX_PAGES_PER_SOURCE

load_dotenv()

FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY")
MAX_RESULTS_PER_KEYWORD = int(os.getenv("MAX_RESULTS_PER_KEYWORD", "25"))

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "output", "jamii_raw.jsonl")


def split_into_candidate_posts(markdown_text, min_words=4, max_words=200):
    """Heuristic ya kugawa ukurasa mmoja wa markdown kuwa 'posts' zinazowezekana.
    Inagawa kwa mistari-tupu (paragraphs) na kuchuja kwa urefu unaokubalika."""
    if not markdown_text:
        return []
    paragraphs = re.split(r"\n\s*\n", markdown_text)
    candidates = []
    for p in paragraphs:
        p = p.strip()
        # ondoa mistari inayofanana na navigation/links pekee
        if not p or p.startswith("#") or p.startswith("!["):
            continue
        word_count = len(p.split())
        if min_words <= word_count <= max_words:
            candidates.append(p)
    return candidates


def run():
    if not FIRECRAWL_API_KEY:
        print("HITILAFU: FIRECRAWL_API_KEY haipo kwenye .env")
        return

    app = Firecrawl(api_key=FIRECRAWL_API_KEY)
    records = []

    # --- 1. Search kwa keywords, zikilenga jamiiforums.com ---
    for keyword in JAMII_KEYWORDS:
        query = f"{keyword} site:jamiiforums.com"
        print(f"[search] {query}")
        try:
            results = app.search(
                query,
                limit=min(MAX_RESULTS_PER_KEYWORD, 10),
                scrape_options={"formats": ["markdown"]},
            )
        except Exception as e:
            print(f"  hitilafu ya search: {e}")
            continue

        items = getattr(results, "data", None) or results.get("data", []) if isinstance(results, dict) else results
        # SDK inaweza kurudisha object au dict kulingana na version — tunashughulikia zote
        try:
            iterable = results.data
        except AttributeError:
            iterable = results.get("data", []) if isinstance(results, dict) else []

        for item in iterable:
            url = getattr(item, "url", None) or item.get("url")
            markdown = getattr(item, "markdown", None) or item.get("markdown", "")
            for post_text in split_into_candidate_posts(markdown):
                records.append({
                    "text": post_text,
                    "source_type": "Jamii Forums",
                    "source_name": keyword,
                    "scraped_url": url,
                })
        time.sleep(1)  # kupunguza mzigo / kuheshimu rate limits

    # --- 2. Crawl sections maalum (ukiwa umeziweka kwenye config/keywords.py) ---
    for section_url in JAMII_FORUM_SECTIONS:
        print(f"[crawl] {section_url}")
        try:
            crawl_result = app.crawl(
                section_url,
                limit=MAX_PAGES_PER_SOURCE,
                scrape_options={"formats": ["markdown"]},
            )
        except Exception as e:
            print(f"  hitilafu ya crawl: {e}")
            continue

        pages = getattr(crawl_result, "data", None) or (
            crawl_result.get("data", []) if isinstance(crawl_result, dict) else []
        )
        for page in pages:
            url = getattr(page, "url", None) or page.get("url")
            markdown = getattr(page, "markdown", None) or page.get("markdown", "")
            for post_text in split_into_candidate_posts(markdown):
                records.append({
                    "text": post_text,
                    "source_type": "Jamii Forums",
                    "source_name": section_url,
                    "scraped_url": url,
                })

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        for r in records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    print(f"\nJumla ya candidate posts: {len(records)}")
    print(f"Imehifadhiwa: {OUTPUT_PATH}")
    print("KUMBUKA: kagua faili hii kwa mkono kabla ya kuendelea — heuristic ya")
    print("kugawa posts si sahihi 100%, kuna uwezekano wa noise (navigation, n.k.)")


if __name__ == "__main__":
    run()
