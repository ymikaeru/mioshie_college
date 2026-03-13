#!/usr/bin/env python3
"""
Retranslate suspicious topics from site_data/ files.

Steps:
  1. Scan all SiteModerno/site_data/shumeic*/*.html.json files
  2. Identify topics where PT translation is missing or too short (< 40% of JA)
  3. Save them to Data/suspicious_topics.json for inspection
  4. Translate via Gemini API
  5. Apply corrected translations back to site_data files
"""

import os
import sys
import json
import glob
import time
import re
import google.generativeai as genai

# ─── Config ──────────────────────────────────────────────────────────────────
SITE_DATA_DIR = "SiteModerno/site_data"
SUSPICIOUS_JSON = "Data/suspicious_topics.json"
TRANSLATED_JSON = "Data/suspicious_topics_translated.json"
PROMPT_FILE = "Backup/prompts/PROMPT_TRANSLACAO.md"
GEMINI_API_KEY = "AIzaSyBjCfPqcYMpI6i5LAprBF6uOGx2xPP6ojw"
RATIO_THRESHOLD = 0.40   # PT/JA ratio below this is flagged
MIN_JA_CHARS = 50        # Ignore topics with very little JA content
BATCH_SIZE = 8           # Topics per API call

# ─── Helpers ─────────────────────────────────────────────────────────────────

def strip_html(text):
    """Remove HTML tags for character counting."""
    return re.sub(r'<[^>]+>', '', text or '')


def ratio(pt, ja):
    ja_len = len(strip_html(ja))
    pt_len = len(strip_html(pt))
    if ja_len == 0:
        return 1.0
    return pt_len / ja_len


def is_suspicious(topic):
    content_ja = topic.get('content', '')
    content_pt = topic.get('content_ptbr', '') or topic.get('content_pt', '')
    ja_len = len(strip_html(content_ja))
    if ja_len < MIN_JA_CHARS:
        return False
    r = ratio(content_pt, content_ja)
    return r < RATIO_THRESHOLD


# ─── Step 1: Scan ─────────────────────────────────────────────────────────────

def scan_site_data():
    """Find all suspicious topics across site_data files."""
    suspicious = []
    pattern = os.path.join(SITE_DATA_DIR, "shumeic*", "*.html.json")
    files = sorted(glob.glob(pattern))
    print(f"Scanning {len(files)} site_data files...")

    for fpath in files:
        try:
            with open(fpath, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            print(f"  ⚠ Could not read {fpath}: {e}")
            continue

        themes = data.get('themes', [])
        for theme in themes:
            for topic in theme.get('topics', []):
                if not is_suspicious(topic):
                    continue
                content_ja = topic.get('content', '')
                content_pt = topic.get('content_ptbr', '') or topic.get('content_pt', '')
                r = ratio(content_pt, content_ja)
                suspicious.append({
                    "_site_file": fpath,
                    "_ratio": round(r, 3),
                    "source_file": topic.get('source_file') or topic.get('filename', ''),
                    "title_idx": topic.get('title_idx', 0),
                    "pub_idx": topic.get('pub_idx', 0),
                    "title": topic.get('title', ''),
                    "publication_title": topic.get('publication_title', ''),
                    "content": content_ja,
                })

    print(f"Found {len(suspicious)} suspicious topics.")
    return suspicious


# ─── Step 2: Save ─────────────────────────────────────────────────────────────

def save_suspicious(suspicious):
    os.makedirs("Data", exist_ok=True)
    with open(SUSPICIOUS_JSON, 'w', encoding='utf-8') as f:
        json.dump(suspicious, f, ensure_ascii=False, indent=2)
    print(f"Saved to {SUSPICIOUS_JSON}")


# ─── Step 3: Translate ────────────────────────────────────────────────────────

def setup_model():
    genai.configure(api_key=GEMINI_API_KEY)
    with open(PROMPT_FILE, 'r', encoding='utf-8') as f:
        system_instruction = f.read()
    model = genai.GenerativeModel(
        model_name="gemini-2.5-pro-preview-03-25",
        system_instruction=system_instruction,
        generation_config=genai.types.GenerationConfig(
            temperature=0.2,
            response_mime_type="application/json",
        ),
        safety_settings={
            genai.types.HarmCategory.HARM_CATEGORY_HARASSMENT: genai.types.HarmBlockThreshold.BLOCK_NONE,
            genai.types.HarmCategory.HARM_CATEGORY_HATE_SPEECH: genai.types.HarmBlockThreshold.BLOCK_NONE,
            genai.types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: genai.types.HarmBlockThreshold.BLOCK_NONE,
            genai.types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: genai.types.HarmBlockThreshold.BLOCK_NONE,
        }
    )
    return model


def translate_batch(model, batch):
    """Send a batch of topics to the API and return list of translated dicts."""
    # Strip internal metadata before sending
    items = []
    for t in batch:
        items.append({k: v for k, v in t.items() if not k.startswith('_')})

    payload = json.dumps({"untranslated_items": items}, ensure_ascii=False)
    try:
        response = model.generate_content(payload, request_options={"timeout": 600})
        text = response.text.strip()
        # Remove markdown fences if present
        if text.startswith("```"):
            text = re.sub(r'^```[a-z]*\n?', '', text)
            text = re.sub(r'\n?```$', '', text)
        return json.loads(text)
    except Exception as e:
        print(f"  ❌ API error: {e}")
        return []


def translate_all(suspicious):
    model = setup_model()
    all_translated = []
    total = len(suspicious)

    for i in range(0, total, BATCH_SIZE):
        batch = suspicious[i:i + BATCH_SIZE]
        print(f"  Translating batch {i//BATCH_SIZE + 1}/{(total + BATCH_SIZE - 1)//BATCH_SIZE} ({len(batch)} topics)...")
        results = translate_batch(model, batch)
        if results:
            # Re-attach _site_file metadata for later patching
            for j, res in enumerate(results):
                if i + j < total:
                    res['_site_file'] = suspicious[i + j]['_site_file']
            all_translated.extend(results)
            print(f"    ✅ Got {len(results)} translations")
        else:
            print(f"    ⚠ No results for this batch")
        if i + BATCH_SIZE < total:
            time.sleep(2)

    with open(TRANSLATED_JSON, 'w', encoding='utf-8') as f:
        json.dump(all_translated, f, ensure_ascii=False, indent=2)
    print(f"\nSaved {len(all_translated)} translations to {TRANSLATED_JSON}")
    return all_translated


# ─── Step 4: Apply ────────────────────────────────────────────────────────────

def apply_translations(translated):
    """Patch site_data JSON files with corrected translations."""
    # Group by site file
    by_file = {}
    for t in translated:
        sf = t.get('_site_file', '')
        if sf:
            by_file.setdefault(sf, []).append(t)

    updated_files = 0
    updated_topics = 0

    for fpath, translations in by_file.items():
        try:
            with open(fpath, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            print(f"  ⚠ Cannot open {fpath}: {e}")
            continue

        # Build lookup: (source_file, title_idx, pub_idx) → translation
        lookup = {}
        for t in translations:
            key = (t.get('source_file', ''), t.get('title_idx', 0), t.get('pub_idx', 0))
            lookup[key] = t

        changed = 0
        themes = data.get('themes', [])
        for theme in themes:
            for topic in theme.get('topics', []):
                key = (
                    topic.get('source_file') or topic.get('filename', ''),
                    topic.get('title_idx', 0),
                    topic.get('pub_idx', 0),
                )
                if key in lookup:
                    tr = lookup[key]
                    if tr.get('title_ptbr'):
                        topic['title_ptbr'] = tr['title_ptbr']
                    if tr.get('content_ptbr'):
                        topic['content_ptbr'] = tr['content_ptbr']
                    if tr.get('publication_title_ptbr'):
                        topic['publication_title_ptbr'] = tr['publication_title_ptbr']
                    changed += 1

        if changed:
            with open(fpath, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"  ✅ Updated {changed} topics in {os.path.basename(fpath)}")
            updated_files += 1
            updated_topics += changed

    print(f"\nDone: updated {updated_topics} topics across {updated_files} files.")


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "all"

    # Change to repo root
    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.dirname(script_dir)
    os.chdir(repo_root)

    if mode in ("scan", "all"):
        print("=== Step 1: Scanning for suspicious topics ===")
        suspicious = scan_site_data()
        save_suspicious(suspicious)
        if not suspicious:
            print("Nothing to do.")
            return

    if mode in ("translate", "all"):
        print("\n=== Step 2: Translating suspicious topics ===")
        with open(SUSPICIOUS_JSON, 'r', encoding='utf-8') as f:
            suspicious = json.load(f)
        translated = translate_all(suspicious)

    if mode in ("apply", "all"):
        print("\n=== Step 3: Applying translations to site_data ===")
        with open(TRANSLATED_JSON, 'r', encoding='utf-8') as f:
            translated = json.load(f)
        apply_translations(translated)

    print("\n✅ All done!")


if __name__ == "__main__":
    # Usage:
    #   python scripts/retranslate_suspicious.py          # scan + translate + apply
    #   python scripts/retranslate_suspicious.py scan     # only scan
    #   python scripts/retranslate_suspicious.py translate # only translate
    #   python scripts/retranslate_suspicious.py apply    # only apply
    main()
