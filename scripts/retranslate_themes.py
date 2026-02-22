import os
import json
import glob
import time
import argparse
import google.generativeai as genai

INPUT_DIR = "Data/parts_for_translation"
OUTPUT_DIR = "Data/translated_parts"
PROMPT_FILE = "PROMPT_TRANSLACAO_VOL2.md"
MISSING_CACHE_FILE = "Data/translated_missing_t1_to_t5.json"

THEME_PREFIXES = ["theme_01_", "theme_02_", "theme_03_", "theme_04_"]

def load_cache():
    cache = {}
    
    # 1. Load the "missing" cache file to prioritize it
    if os.path.exists(MISSING_CACHE_FILE):
        try:
            with open(MISSING_CACHE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                for item in data:
                    src = item.get("source_file", "")
                    title = item.get("original_title", item.get("title_original", item.get("title", "")))
                    key = f"{src}:::{title}"
                    cache[key] = item
        except Exception as e:
            print(f"Error loading {MISSING_CACHE_FILE}: {e}")

                    
    return cache

def retranslate_themes():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("API Key is missing! Set GEMINI_API_KEY environment variable.")
        return

    genai.configure(api_key=api_key)

    with open(PROMPT_FILE, 'r', encoding='utf-8') as f:
        system_instruction = f.read()

    model = genai.GenerativeModel(
        model_name="gemini-3.1-pro-preview",
        system_instruction=system_instruction,
        generation_config=genai.types.GenerationConfig(
            temperature=0.3,
            response_mime_type="application/json",
        ),
        safety_settings={
            genai.types.HarmCategory.HARM_CATEGORY_HARASSMENT: genai.types.HarmBlockThreshold.BLOCK_NONE,
            genai.types.HarmCategory.HARM_CATEGORY_HATE_SPEECH: genai.types.HarmBlockThreshold.BLOCK_NONE,
            genai.types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: genai.types.HarmBlockThreshold.BLOCK_NONE,
            genai.types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: genai.types.HarmBlockThreshold.BLOCK_NONE,
        }
    )

    cache = load_cache()
    print(f"Loaded {len(cache)} topics from cache.")

    files_to_process = []
    for prefix in THEME_PREFIXES:
        pattern = os.path.join(INPUT_DIR, f"{prefix}*.json")
        files_to_process.extend(glob.glob(pattern))
    
    files_to_process.sort()
    print(f"Found {len(files_to_process)} files to process.")

    for idx, input_file in enumerate(files_to_process):
        basename = os.path.basename(input_file)
        output_file = os.path.join(OUTPUT_DIR, basename)
        
        if os.path.exists(output_file):
            print(f"[{idx+1}/{len(files_to_process)}] {basename}: Already translated successfully. Skipping.")
            continue
        
        with open(input_file, "r", encoding="utf-8") as f:
            original_data = json.load(f)
            
        topics = original_data.get("topics", []) if isinstance(original_data, dict) else original_data
        
        final_topics = []
        topics_to_translate = []
        indices_to_translate = []
        
        for i, t in enumerate(topics):
            src = t.get("source_file", t.get("filename", ""))
            title = t.get("title", "")
            key = f"{src}:::{title}"
            
            if key in cache:
                final_topics.append(cache[key])
            else:
                final_topics.append(None)
                topics_to_translate.append(t)
                indices_to_translate.append(i)
                
        if topics_to_translate:
            print(f"[{idx+1}/{len(files_to_process)}] {basename}: Translating {len(topics_to_translate)} topics (Cached: {len(topics)-len(topics_to_translate)})")
            
            chunk_size = 5
            for chunk_start in range(0, len(topics_to_translate), chunk_size):
                chunk_req = topics_to_translate[chunk_start:chunk_start+chunk_size]
                chunk_indices = indices_to_translate[chunk_start:chunk_start+chunk_size]
                
                input_str = json.dumps({"topics": chunk_req}, ensure_ascii=False)
                
                max_retries = 3
                for attempt in range(max_retries):
                    try:
                        response = model.generate_content(input_str, request_options={"timeout": 600})
                        try:
                            parsed = json.loads(response.text)
                            translated_topics = parsed if isinstance(parsed, list) else parsed.get("topics", [])
                            
                            # Assume Gemini might drop fields, restore them
                            for original_req, final_res in zip(chunk_req, translated_topics):
                                final_res["original_title"] = original_req.get("title", "")
                                final_res["source_file"] = original_req.get("source_file", original_req.get("filename", ""))
                                if "filename" in original_req:
                                    final_res["filename"] = original_req["filename"]

                            if len(translated_topics) == len(chunk_req):
                                for j, rt in enumerate(translated_topics):
                                    final_topics[chunk_indices[j]] = rt
                                break # Success! Exit the retry loop
                            else:
                                print(f"  -> ERROR: Returned topics count ({len(translated_topics)}) does mismatch requested ({len(chunk_req)}). Trying to salvage...")
                                # If sizes don't match, we still try to inject as many as possible to avoid losing everything
                                for j, rt in enumerate(translated_topics):
                                    if j < len(chunk_indices):
                                        final_topics[chunk_indices[j]] = rt
                                break # Salvaged what we could, exit retry loop
                        except Exception as e:
                            print(f"  -> JSON decode error on {basename} Chunk {chunk_start} (Attempt {attempt+1}/{max_retries}): {e}")
                            if attempt < max_retries - 1:
                                time.sleep(15) 
                    except Exception as e:
                        print(f"  -> API error on {basename} Chunk {chunk_start} (Attempt {attempt+1}/{max_retries}): {e}")
                        if attempt < max_retries - 1:
                            time.sleep(15) # Wait before retrying server errors
                
                time.sleep(2) # Rate limit between chunks
        else:
            print(f"[{idx+1}/{len(files_to_process)}] {basename}: Fully cached.")

        # If we successfully populated all final_topics
        if all(final_topics):
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(final_topics, f, ensure_ascii=False, indent=2)
            print(f"  -> Saved {basename}")
        else:
            print(f"  -> Skipping save for {basename} due to incomplete translation data.")
            
if __name__ == "__main__":
    retranslate_themes()
