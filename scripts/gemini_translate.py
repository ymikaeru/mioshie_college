import os
import json
import glob
import time
import argparse
import google.generativeai as genai

def is_already_translated(input_file, output_dir):
    """Verifica se o arquivo já foi traduzido verificando se a chave content_ptbr ou title_ptbr existe."""
    basename = os.path.basename(input_file)
    expected_output = os.path.join(output_dir, basename)
    if not os.path.exists(expected_output):
        return False
        
    try:
        with open(expected_output, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if isinstance(data, list) and len(data) > 0:
                return "content_ptbr" in data[0]
            elif isinstance(data, dict):
                topics = data.get("topics", [])
                if len(topics) > 0:
                    return "content_ptbr" in topics[0]
    except Exception:
        return False
        
    return False

def translate_file(input_path, prompt_path, output_path, model):
    """
    Translates a JSON file using the Gemini Pro API.
    """
    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            input_data = json.load(f)
            if isinstance(input_data, list):
                input_str = json.dumps({"topics": input_data}, ensure_ascii=False)
            else:
                input_str = json.dumps(input_data, ensure_ascii=False)
    except Exception as e:
        print(f"ERRO ao ler {input_path}: {e}")
        return False

    print(f"Traduzindo: {os.path.basename(input_path)}...", flush=True)

    try:
        response = model.generate_content(input_str, request_options={"timeout": 600})
        
        with open(output_path, 'w', encoding='utf-8') as f:
            try:
                parsed = json.loads(response.text)
                json.dump(parsed, f, ensure_ascii=False, indent=2)
                print(f"✅ Sucesso -> {os.path.basename(output_path)}", flush=True)
            except json.JSONDecodeError:
                f.write(response.text)
                print(f"⚠️ Salvo (Mas não é JSON estrito) -> {os.path.basename(output_path)}", flush=True)
                
        return True
    
    except Exception as e:
        print(f"❌ ERRO na API para {os.path.basename(input_path)}: {e}", flush=True)
        return False

def translate_directory(input_dir, output_dir, prompt_path, pattern="theme_05_*.json", delay=0):
    """Traduz todos os arquivos de um diretório matching o padrão."""
    
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("ERRO: A variável de ambiente GEMINI_API_KEY não existe!")
        return

    genai.configure(api_key=api_key)

    try:
        with open(prompt_path, 'r', encoding='utf-8') as f:
            system_instruction = f.read()
    except FileNotFoundError:
        print(f"ERRO: Arquivo de prompt não encontrado: {prompt_path}")
        return

    # Usaremos 3.1-pro-preview conforme solicitado
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

    search_pattern = os.path.join(input_dir, pattern)
    files_to_process = sorted(glob.glob(search_pattern))
    
    if not files_to_process:
        print(f"Nenhum arquivo encontrado em {search_pattern}")
        return

    print(f"Encontrados {len(files_to_process)} arquivos para traduzir.")
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    success_count = 0
    skip_count = 0

    for idx, input_file in enumerate(files_to_process, 1):
        if is_already_translated(input_file, output_dir):
            print(f"[{idx}/{len(files_to_process)}] ⏭️ Pulando (já traduzido): {os.path.basename(input_file)}")
            skip_count += 1
            continue
            
        output_file = os.path.join(output_dir, os.path.basename(input_file))
        print(f"[{idx}/{len(files_to_process)}] ", end="")
        
        success = translate_file(input_file, prompt_path, output_file, model)
        
        if success:
            success_count += 1
        
        # Rate limiting delay for free tier or general safety
        if delay > 0 and idx < len(files_to_process):
            print(f"Aguardando {delay} segundos (Rate Limit)...")
            time.sleep(delay)

    print("-" * 30)
    print(f"Processo Concluído!")
    print(f"Traduzidos: {success_count}")
    print(f"Mantecidos/Pulados: {skip_count}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Script para traduzir múltiplos arquivos com a API do Gemini Pro")
    parser.add_argument("--input_dir", "-i", default="Data/parts_for_translation", help="Diretório dos arquivos originais")
    parser.add_argument("--output_dir", "-o", default="Data/translated_parts", help="Diretório para salvar traduções")
    parser.add_argument("--prompt", "-p", default="PROMPT_TRANSLACAO_VOL2.md", help="Arquivo de prompt")
    parser.add_argument("--pattern", "-m", default="theme_05_*.json", help="Padrão de busca (ex: theme_05_*.json)")
    parser.add_argument("--delay", "-d", type=int, default=0, help="Espera entre requisições (0 = Rápido/Pago, 30 = Gratuito)")
    
    args = parser.parse_args()
    
    translate_directory(args.input_dir, args.output_dir, args.prompt, args.pattern, args.delay)
