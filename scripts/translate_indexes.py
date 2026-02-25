import os
import glob
from bs4 import BeautifulSoup
import google.generativeai as genai
import json
import time

genai.configure()

def translate_strings(texts, max_retries=3):
    if not texts: return []
    
    prompt = "Translate the following short Japanese string fragments from a religious teachings index page to Portuguese (pt-BR). Strictly preserve the EXACT formatting, spaces, brackets, or bullets (like '・' or '　'). The length and tone should match closely. Do not add anything. Return a JSON array of strings in the exact same order.\n\n"
    prompt += json.dumps(texts, ensure_ascii=False)
    
    print(f"Calling Gemini to translate {len(texts)} strings...")
    model = genai.GenerativeModel('gemini-2.5-pro')
    
    for attempt in range(max_retries):
        try:
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"},
                request_options={"timeout": 120}
            )
            translated = json.loads(response.text)
            return translated
        except Exception as e:
            print(f"Error on attempt {attempt + 1}: {e}")
            if attempt < max_retries - 1:
                print("Retrying in 5 seconds...")
                time.sleep(5)
            else:
                return texts

def is_japanese(text):
    for char in text:
        if '\u3040' <= char <= '\u309F' or '\u30A0' <= char <= '\u30FF' or '\u4E00' <= char <= '\u9FFF':
            return True
    return False

def translate_index_file(fpath):
    print(f"Processing {fpath}...")
    try:
        with open(fpath, 'r', encoding='shift_jis') as f:
            html = f.read()
    except UnicodeDecodeError:
        with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
            html = f.read()
            
    soup = BeautifulSoup(html, 'html.parser')
    
    texts_to_translate = []
    text_nodes = []
    
    for text_node in soup.find_all(string=True):
        t = text_node.strip()
        # Keep things like '・神と経綸 1' or '序 文'
        if t and is_japanese(t):
            texts_to_translate.append(str(t))
            text_nodes.append(text_node)
            
    # Batch translate
    BATCH_SIZE = 50
    translated_texts = []
    for i in range(0, len(texts_to_translate), BATCH_SIZE):
        batch = texts_to_translate[i:i+BATCH_SIZE]
        translated_batch = translate_strings(batch)
        translated_texts.extend(translated_batch)
        
    if len(translated_texts) == len(text_nodes):
        for node, translated_text in zip(text_nodes, translated_texts):
            # Replace the stripped text but keep the surrounding whitespace of the original node
            original = str(node)
            stripped = original.strip()
            new_val = original.replace(stripped, translated_text)
            node.replace_with(new_val)
    else:
        print(f"Warning: Count mismatch in {fpath}. Original: {len(text_nodes)}, Translated: {len(translated_texts)}")
        
    return soup

TRANSLATED_DIR = 'Data/translated_indexes'
os.makedirs(TRANSLATED_DIR, exist_ok=True)

for rel_path in ['shumeic1/index.html', 'shumeic1/index2.html', 'shumeic2/index.html', 'shumeic3/index.html', 'shumeic4/index.html']:
    original_idx_path = os.path.join('OrigianlHTML', rel_path)
    if not os.path.exists(original_idx_path): continue
    
    soup = translate_index_file(original_idx_path)
    
    out_dir = os.path.join(TRANSLATED_DIR, os.path.dirname(rel_path))
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(TRANSLATED_DIR, rel_path)
    
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(str(soup))
    print(f"Saved translated index to {out_path}")
