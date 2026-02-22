import os
import json
import argparse
import time
import google.generativeai as genai
from scripts.gemini_translate import translate_file

files_to_fix = [
    "theme_02_浄霊の方法_part_65.json",
    "theme_02_浄霊の方法_part_76.json",
    "theme_03_浄化作用_part_02.json"
]

def retranslate():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("API key missing!")
        return
        
    genai.configure(api_key=api_key)
    
    with open("PROMPT_TRANSLACAO_VOL2.md", 'r', encoding='utf-8') as f:
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

    for idx, f in enumerate(files_to_fix):
        in_path = os.path.join("Data/parts_for_translation", f)
        out_path = os.path.join("Data/translated_parts", f)
        
        # Check if input exists
        if not os.path.exists(in_path):
            print(f"Skipping {f}, input note found.")
            continue
            
        print(f"Retranslating {in_path} -> {out_path}...")
        success = translate_file(in_path, "PROMPT_TRANSLACAO_VOL2.md", out_path, model)
        if success:
            print(f"[{idx+1}/{len(files_to_fix)}] Re-translated {f} successfully.")
        else:
            print(f"[{idx+1}/{len(files_to_fix)}] Failed to re-translate {f}.")
            
        time.sleep(2)

if __name__ == "__main__":
    retranslate()
