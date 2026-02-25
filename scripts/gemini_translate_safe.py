import asyncio
import os
import json
import glob
import google.generativeai as genai

# Use the environment variable OR paste directly.
GEMINI_API_KEY = "AIzaSyBjCfPqcYMpI6i5LAprBF6uOGx2xPP6ojw"
genai.configure(api_key=GEMINI_API_KEY)
model_name = "gemini-3.1-pro-preview"
model = genai.GenerativeModel(model_name)

INPUT_DIR = "Data/v3_parts_for_translation"
OUTPUT_DIR = "Data/v3_translated_parts"

def get_missing_files():
    all_input_files = sorted(glob.glob(os.path.join(INPUT_DIR, "*.json")))
    missing = []
    for input_file in all_input_files:
        basename = os.path.basename(input_file)
        output_file = os.path.join(OUTPUT_DIR, basename)
        if not os.path.exists(output_file):
            missing.append(input_file)
    return missing

async def translate_single_file(input_file):
    basename = os.path.basename(input_file)
    output_file = os.path.join(OUTPUT_DIR, basename)
    print(f"Translating safe mode: {basename}")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Disable all safety settings to bypass false positives on religious texts
    safety_settings = [
        {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"}
    ]

    system_prompt = """
Você é um tradutor sênior especializado em religião e filosofia japonesa. 
Este é um texto religioso filosófico clássico. Os termos como morte, vingança, demônios, etc., são usados em um contexto estritamente espiritual e teológico.
Traduza o JSON do japonês para o português mantendo todas as tags HTML.
Retorne APENAS o JSON válido.
"""

    prompt = f"{system_prompt}\n\nJSON:\n{json.dumps(data, ensure_ascii=False, indent=2)}"

    try:
        response = await asyncio.to_thread(
            model.generate_content,
            prompt,
            generation_config={"temperature": 0.1},
            safety_settings=safety_settings
        )
        
        response_text = response.text
        # Clean markdown
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]

        translated_data = json.loads(response_text)
        
        # Keep original structure just like main script
        for i in range(len(data)):
             translated_data[i]["source_file"] = data[i].get("filename", "")
             if "title" in translated_data[i]:
                 translated_data[i]["title_ptbr"] = translated_data[i].pop("title")
             elif "title_ja" in translated_data[i]:
                 translated_data[i]["title_ptbr"] = translated_data[i].pop("title_ja")
                 
             if "content" in translated_data[i]:
                 translated_data[i]["content_ptbr"] = translated_data[i].pop("content")
             elif "content_ja" in translated_data[i]:
                 translated_data[i]["content_ptbr"] = translated_data[i].pop("content_ja")
             
             translated_data[i]["publication_title_ptbr"] = ""

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(translated_data, f, ensure_ascii=False, indent=2)
            
        print(f"✅ Success: {basename}")
    except Exception as e:
        print(f"❌ Error {basename}: {e}")

async def main():
    missing = get_missing_files()
    if not missing:
        print("All files translated!")
        return
        
    print(f"Translating {len(missing)} files with safety filters disabled...")
    for f in missing:
        await translate_single_file(f)

if __name__ == "__main__":
    asyncio.run(main())
