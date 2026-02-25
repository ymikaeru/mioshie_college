import json
import os
import glob
from collections import Counter

OUT_DIR = "Data/v1_translated_parts"

def analyze_translations():
    files = glob.glob(os.path.join(OUT_DIR, "*.json"))
    flagged_topics = []

    for file_path in files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            for topic in data.get('topics', []):
                original = topic.get('topic_ja', '')
                translated = topic.get('topic_pt', '')
                
                # Basic check: is translation suspiciously longer? (e.g. 5x longer for short strings)
                if len(original) > 20 and len(translated) > len(original) * 5:
                    flagged_topics.append({
                        "file": os.path.basename(file_path),
                        "reason": "Length discrepancy",
                        "ja_len": len(original),
                        "pt_len": len(translated),
                        "pt_snippet": translated[:100] + "..."
                    })
                    continue
                
                # Basic check: repeated words (signs of a loop/hallucination)
                words = translated.split()
                if len(words) > 50:
                    word_counts = Counter(words)
                    most_common, count = word_counts.most_common(1)[0]
                    # If a single word makes up 20% of a long text, it's suspect (excluding common stop words like 'a', 'de', 'que', etc.)
                    stop_words = {'de', 'a', 'o', 'que', 'e', 'do', 'da', 'em', 'um', 'para', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas'}
                    
                    if count > len(words) * 0.15 and most_common.lower() not in stop_words:
                        flagged_topics.append({
                            "file": os.path.basename(file_path),
                            "reason": f"Repeated word: '{most_common}' ({count} times)",
                            "pt_snippet": translated[:100] + "..."
                        })

        except Exception as e:
            pass

    return flagged_topics

if __name__ == "__main__":
    issues = analyze_translations()
    if issues:
        print(f"Found {len(issues)} suspicious translations:")
        for issue in issues[:10]: # Print top 10
            print(f"- {issue['file']}: {issue['reason']}")
            print(f"  Snippet: {issue['pt_snippet']}")
    else:
        print("No obvious hallucinations detected.")

