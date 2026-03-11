import asyncio
import os
import json
import google.generativeai as genai

# Using environment key if available, else an internal placeholder
key = os.environ.get("GEMINI_API_KEY", "AIzaSyBjCfPqcYMpI6i5LAprBF6uOGx2xPP6ojw")
genai.configure(api_key=key)
model_name = "gemini-3.1-pro-preview"
try:
    model = genai.GenerativeModel(model_name)
except:
    model = genai.GenerativeModel("gemini-1.5-pro")

async def translate_single_file(input_file, output_file):
    print(f"Translating safe mode: {input_file}")
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    safety_settings = [
        {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"}
    ]

    system_prompt = """Você é um tradutor sênior especializado em religião e filosofia japonesa. 
Este é um texto religioso filosófico clássico. Os termos como morte, vingança, demônios, etc., são usados em um contexto estritamente espiritual e teológico.
Traduza o JSON do japonês para o português mantendo todas as tags HTML.
Retorne APENAS o JSON válido.
"""
    prompt = f"{system_prompt}\n\nJSON:\n{json.dumps(data, ensure_ascii=False, indent=2)}"

    response = await asyncio.to_thread(
        model.generate_content,
        prompt,
        generation_config={"temperature": 0.1},
        safety_settings=safety_settings
    )
    
    response_text = response.text
    if response_text.startswith("```json"): response_text = response_text[7:]
    elif response_text.startswith("```"): response_text = response_text[3:]
    if response_text.endswith("```"): response_text = response_text[:-3]

    translated_data = json.loads(response_text)
    for i in range(len(data)):
         translated_data[i]["source_file"] = data[i].get("filename", "")
         if "title" in translated_data[i]:
             translated_data[i]["title_ptbr"] = translated_data[i].pop("title")
         if "content" in translated_data[i]:
             translated_data[i]["content_ptbr"] = translated_data[i].pop("content")
         translated_data[i]["publication_title_ptbr"] = ""

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(translated_data, f, ensure_ascii=False, indent=2)
    print(f"✅ Success")

async def main():
    await translate_single_file(
        "Data/v4_parts_for_translation/theme_01_明主様の御事跡_part_061.json",
        "Data/v4_translated_parts/theme_01_明主様の御事跡_part_061.json"
    )

if __name__ == "__main__":
    asyncio.run(main())
