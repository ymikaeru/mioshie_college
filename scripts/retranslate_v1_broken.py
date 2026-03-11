"""
Script to retranslate specific broken items in Volume 1 translated parts.
Identifies items where Gemini returned truncated HTML instead of real Portuguese text.
"""
import asyncio
import os
import json
import glob
import google.generativeai as genai

GEMINI_API_KEY = "AIzaSyCpr4VbptcG5s6xbXICGBIZfrr3g6Fsvc0"
genai.configure(api_key=GEMINI_API_KEY)
model_name = "gemini-3.1-pro-preview"
model = genai.GenerativeModel(model_name)

TRANS_DIR = "Data/v1_translated_parts"
SRC_DIR = "Data/v1_parts_for_translation"

BROKEN_SOURCE_FILES = {
    "yudaya1.html",
    "nihon4YUUSHUU.html",
    "sei2SHUGOSIN.html",
    "mokuryuu1.html",
    "inariITEN.html",
    "hyourei4.html",
    "aku3BU.html",
    "aku4BU.html",
    "SbyoubuIHAI.html",
    "SNheiyou.html",
    "Shaidoku4.html",
}

def is_broken(content_ptbr, src_item):
    if "</blockquote>" in content_ptbr or "</body>" in content_ptbr:
        return True
    
    content_ja = src_item.get("content", "")
    len_pt = len(content_ptbr)
    len_ja = len(content_ja)
    
    if len_ja > 200: # Significant content
        ratio = len_pt / len_ja
        if ratio < 0.3: # Suspiciously short
            return True
            
    return False

def load_json_as_list(path):
    """Load JSON file and always return a list of items."""
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    if isinstance(data, list):
        return data
    elif isinstance(data, dict):
        if "topics" in data:
            return data["topics"]
        else:
            return list(data.values())
    return []

def find_broken_parts():
    """Get dict of {part_basename: [broken_indices]}."""
    result = {}
    for tf in sorted(glob.glob(os.path.join(TRANS_DIR, "*.json"))):
        basename = os.path.basename(tf)
        trans_items = load_json_as_list(tf)
        
        src_path = os.path.join(SRC_DIR, basename)
        if not os.path.exists(src_path):
            continue
        src_items = load_json_as_list(src_path)
        
        broken_idxs = []
        for i, item in enumerate(trans_items):
            if i >= len(src_items):
                continue
            
            src_fname = item.get("source_file", "")
            content = item.get("content_ptbr", "")
            if src_fname in BROKEN_SOURCE_FILES and is_broken(content, src_items[i]):
                broken_idxs.append(i)
        if broken_idxs:
            result[basename] = broken_idxs
    return result

async def translate_items(items_for_translation, part_basename):
    """Call Gemini to translate a batch of Japanese items."""
    system_prompt = """Você é um tradutor sênior especializado em religião e filosofia japonesa.
Este é um texto religioso filosófico clássico. Os termos como morte, vingança, demônios, etc., são usados em um contexto estritamente espiritual e teológico.
Traduza o JSON do japonês para o português mantendo todas as tags HTML.
Retorne APENAS o JSON válido — uma lista de objetos com os campos traduzidos.
Campos a traduzir: title, content, date (se existir, converta a data para o formato ocidental em pt-BR)
NÃO altere os campos: filename, source_file, title_idx, pub_idx, publication_title_ptbr."""

    safety_settings = [
        {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"}
    ]

    prompt = f"{system_prompt}\n\nJSON:\n{json.dumps(items_for_translation, ensure_ascii=False, indent=2)}"
    print(f"  Sending {len(items_for_translation)} items to Gemini...")

    try:
        response = await asyncio.to_thread(
            model.generate_content,
            prompt,
            generation_config={"temperature": 0.1},
            safety_settings=safety_settings
        )
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        result = json.loads(text)
        if not isinstance(result, list):
            result = [result]
        return result
    except Exception as e:
        print(f"  ERROR: {e}")
        return None

async def main():
    broken_parts = find_broken_parts()
    print(f"Found {len(broken_parts)} part files with broken translations:")
    for bn, idxs in sorted(broken_parts.items()):
        print(f"  {bn}: indices {idxs}")

    total_fixed = 0

    for part_basename, broken_idxs in sorted(broken_parts.items()):
        trans_path = os.path.join(TRANS_DIR, part_basename)
        src_path = os.path.join(SRC_DIR, part_basename)

        print(f"\nProcessing {part_basename}...")

        # Load translated items (list)
        trans_items = load_json_as_list(trans_path)

        # Load source items (list)
        if not os.path.exists(src_path):
            print(f"  WARNING: Source file not found: {src_path}")
            continue
        src_items = load_json_as_list(src_path)

        print(f"  Trans items: {len(trans_items)}, Src items: {len(src_items)}")

        # Get source items to retranslate (using same position indices)
        items_to_retranslate = []
        valid_idxs = []
        for idx in broken_idxs:
            if idx < len(src_items):
                items_to_retranslate.append(src_items[idx])
                valid_idxs.append(idx)
            else:
                print(f"  WARNING: Index {idx} out of range in src ({len(src_items)} items)")

        if not items_to_retranslate:
            print("  No valid items to retranslate, skipping.")
            continue

        # Retranslate
        retranslated = await translate_items(items_to_retranslate, part_basename)
        if retranslated is None:
            print(f"  Retranslation failed for {part_basename}, skipping.")
            continue

        count = min(len(retranslated), len(valid_idxs))

        # Patch back into translated file
        # We need to save the full list, not just the patched list
        # Load the raw JSON first to preserve format
        with open(trans_path, 'r', encoding='utf-8') as f:
            raw_trans = json.load(f)

        def get_item_list(data):
            if isinstance(data, list):
                return data
            if isinstance(data, dict) and "topics" in data:
                return data["topics"]
            return []

        item_list = get_item_list(raw_trans)

        for j in range(count):
            src_idx = valid_idxs[j]
            new_item = retranslated[j]

            # Normalize keys
            if "title" in new_item and "title_ptbr" not in new_item:
                new_item["title_ptbr"] = new_item.pop("title")
            if "content" in new_item and "content_ptbr" not in new_item:
                new_item["content_ptbr"] = new_item.pop("content")

            # Preserve metadata from original translated item
            old = item_list[src_idx]
            new_item["source_file"] = old.get("source_file", "")
            for meta_key in ["title_idx", "pub_idx", "publication_title_ptbr"]:
                if meta_key in old:
                    new_item.setdefault(meta_key, old[meta_key])

            item_list[src_idx] = new_item
            total_fixed += 1
            print(f"  Fixed [{src_idx}]: {new_item.get('title_ptbr', '')[:60]}")

        # Save back (preserve the original structure type)
        with open(trans_path, 'w', encoding='utf-8') as f:
            json.dump(raw_trans, f, ensure_ascii=False, indent=2)
        print(f"  Saved {trans_path}")

    print(f"\nTotal items fixed: {total_fixed}")
    print("Run merge_v1.py (or rebuild) to apply changes to the bilingual JSON.")

if __name__ == "__main__":
    asyncio.run(main())
