import os
import json
import time
import google.generativeai as genai

INPUT_FILE = "Data/missing_content_to_translate_t1_to_t5.json"
OUTPUT_FILE = "Data/translated_missing_t1_to_t5.json"
PROMPT_FILE = "PROMPT_TRANSLACAO_VOL2.md"
CHUNK_SIZE = 5  # Translate 5 topics at a time to prevent timeouts

def translate_missing():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("ERRO: A variável de ambiente GEMINI_API_KEY conf não existe!")
        return

    genai.configure(api_key=api_key)

    try:
        with open(PROMPT_FILE, 'r', encoding='utf-8') as f:
            system_instruction = f.read()
    except FileNotFoundError:
        print(f"ERRO: Arquivo de prompt não encontrado: {PROMPT_FILE}")
        return

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

    try:
        with open(INPUT_FILE, "r", encoding="utf-8") as f:
            input_data = json.load(f)["topics_to_translate"]
    except Exception as e:
        print(f"Erro ao ler {INPUT_FILE}: {e}")
        return

    # Load already translated to resume if stopped
    translated_data = []
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
                translated_data = json.load(f)
        except Exception:
            pass

    # Find what is left
    translated_titles = {t.get("original_title", t.get("title_original")) for t in translated_data if t}
    remaining_topics = [t for t in input_data if t.get("title_original") not in translated_titles]

    print(f"Total de tópicos na fila: {len(input_data)}")
    print(f"Já traduzidos no arquivo offline: {len(translated_titles)}")
    print(f"Faltam traduzir agora: {len(remaining_topics)}")

    if not remaining_topics:
        print("Tudo já foi traduzido!")
        return

    for i in range(0, len(remaining_topics), CHUNK_SIZE):
        chunk = remaining_topics[i:i+CHUNK_SIZE]
        print(f"\nTraduzindo Lote {i//CHUNK_SIZE + 1}/{(len(remaining_topics) - 1)//CHUNK_SIZE + 1} (Tópicos: {len(chunk)})", flush=True)
        
        # Prepare input JSON specifically for translation prompt
        chunk_input = []
        for c in chunk:
            chunk_input.append({
                "source_file": c["source_file"],
                "title": c["title_original"],
                "content": c["content_original"]
            })
            
        input_str = json.dumps({"topics": chunk_input}, ensure_ascii=False)
        
        try:
            response = model.generate_content(input_str, request_options={"timeout": 600})
            try:
                parsed = json.loads(response.text)
                topics_returned = parsed if isinstance(parsed, list) else parsed.get("topics", [])
                
                # Append original Japanese title tracking info so we can easily merge it later
                for rt, orig in zip(topics_returned, chunk):
                    rt["original_title"] = orig["title_original"]
                    rt["source_file"] = orig["source_file"]
                    translated_data.append(rt)
                
                with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
                    json.dump(translated_data, f, ensure_ascii=False, indent=2)
                print(f"Lote salvo com sucesso! (+{len(topics_returned)} traduzidos)", flush=True)

            except json.JSONDecodeError:
                print(f"Falha ao decodificar JSON do Lote {i//CHUNK_SIZE + 1}. Pulando.", flush=True)
                print(response.text)
        except Exception as e:
            print(f"Erro na API no Lote {i//CHUNK_SIZE+1}: {e}", flush=True)
            
        time.sleep(2) # Rate limit

if __name__ == "__main__":
    translate_missing()
