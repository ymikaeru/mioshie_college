
import json
import os
import glob
import re
from collections import Counter

TRANSLATED_DIR = "/Users/michael/Documents/Ensinamentos/Sites/BR/Shumei_Vol02/Data/translated_parts"

SUSPICIOUS_KEYWORDS = [
    "I cannot translate", "As an AI", "Sorry, but", "Here is the translation",
    "Tradução:", "Segue a tradução", "Desculpe, mas", "sou uma inteligência artificial"
]

def check_file(file_path):
    issues = []
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        return [f"JSON Load Error: {e}"]

    if isinstance(data, list):
        items = data
    else:
        # Some files might be { "topics": [...] } or just [...]
        # The merge script handles lists, so we assume list or dict with topics
        items = data.get("topics", []) if isinstance(data, dict) else data

    for i, item in enumerate(items):
        content = item.get("content_ptbr", "")
        title = item.get("title_ptbr", "")
        
        # Check 1: Suspicious keywords (AI chatter)
        for keyword in SUSPICIOUS_KEYWORDS:
            if keyword.lower() in content.lower():
                issues.append(f"Topic {i}: Found AI keyword '{keyword}'")

        # Check 2: Repetitive content (Hallucination)
        # Split by newlines or breaks
        lines = re.split(r'<br/?>|\n', content)
        non_empty_lines = [line.strip() for line in lines if line.strip()]
        
        if len(non_empty_lines) > 10:
            # Check for consecutive repetition
            for j in range(len(non_empty_lines) - 5):
                chunk = non_empty_lines[j:j+5]
                if all(x == chunk[0] for x in chunk):
                    issues.append(f"Topic {i}: Detected repetitive lines (loop hallucination) starting with '{chunk[0][:20]}...'")
                    break

        # Check 3: Excessive HTML (HTML Dirt)
        # Removes tags and counts length
        text_only = re.sub(r'<[^>]+>', '', content)
        if len(content) > 500 and len(text_only) < len(content) * 0.2:
             issues.append(f"Topic {i}: High HTML-to-Text ratio (Possible empty table/div soup)")

        # Check 4: Unclosed tags (Basic check)
        # This is hard to do perfectly with regex, but we can look for obviously bad things
        # or just specific patterns user hated before like empty spans
        if "<span ></span>" in content or "<span></span>" in content:
             issues.append(f"Topic {i}: Empty spans found")

        # Check 5: Title issues
        if not title:
             issues.append(f"Topic {i}: Missing title")
        elif title == item.get("content_ptbr"):
             issues.append(f"Topic {i}: Title equals content")

    return issues

def main():
    print(f"Scanning {TRANSLATED_DIR}...")
    files = sorted(glob.glob(os.path.join(TRANSLATED_DIR, "*.json")))
    
    total_issues = 0
    files_with_issues = 0
    
    for file_path in files:
        issues = check_file(file_path)
        if issues:
            base_name = os.path.basename(file_path)
            print(f"\nIssues in {base_name}:")
            for issue in issues:
                print(f"  - {issue}")
            total_issues += len(issues)
            files_with_issues += 1
            
    print(f"\nScan complete. Found {total_issues} issues in {files_with_issues} files out of {len(files)} total files.")

if __name__ == "__main__":
    main()
