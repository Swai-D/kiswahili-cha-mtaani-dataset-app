"""
Keywords na malengo ya scraping.
Hii ni orodha ya kuanzia — ongeza/badilisha kulingana na mahitaji yako.
Lengo ni maneno/mada zinazovuta mazungumzo ya kawaida ya mtaani (si makala rasmi).
"""

# Maneno ya kutafuta kwenye Jamii Forums (majadiliano ya mtaani, si habari rasmi)
JAMII_KEYWORDS = [
    "mambo vipi",
    "story za mtaani",
    "maisha ya bongo",
    "uchumba",
    "ajira tanzania",
    "michezo bongo",
    "muziki wa bongo fleva",
    "siasa za mtaani",
    "maisha ya dar",
]

# Sehemu/JamiiForums categories zenye mazungumzo mengi ya kawaida (jaza URLs halisi)
# Mfano wa muundo — badilisha na URLs halisi za sehemu unazotaka
JAMII_FORUM_SECTIONS = [
    # "https://www.jamiiforums.com/forums/mikoa.16/",
    # "https://www.jamiiforums.com/forums/jamii-la-siasa.10/",
]

# Idadi ya kurasa za juu kwa kila search/section (weka ndogo mwanzoni, ongeza baadaye)
MAX_PAGES_PER_SOURCE = 5

# --- Apify: mitandao ya kijamii ---
# Chagua Actors kutoka Apify Store zinazolingana na jukwaa unalotaka.
# Mfano wa muundo (badilisha actor_id na Actor uliyochagua kwenye Apify Store,
# na weka run_input kulingana na "Input" schema ya Actor hiyo):
APIFY_TARGETS = [
    {
        "label": "Twitter/X - keyword search",
        "actor_id": "weka-actor-id-hapa",  # mfano: "apidojo/tweet-scraper"
        "run_input": {
            "searchTerms": ["bongo fleva", "tanzania mtaani"],
            "maxItems": 50,
        },
    },
    {
        "label": "Instagram - hashtag search",
        "actor_id": "weka-actor-id-hapa",  # mfano: "apify/instagram-hashtag-scraper"
        "run_input": {
            "hashtags": ["tanzania", "bongo", "dar"],
            "resultsLimit": 50,
        },
    },
]

# Field ya maandishi kwenye output ya Actor husika (inatofautiana kwa kila Actor —
# angalia "Output" tab ya Actor kwenye Apify Console kuona jina sahihi la field)
APIFY_TEXT_FIELD_CANDIDATES = ["text", "caption", "fullText", "description"]
