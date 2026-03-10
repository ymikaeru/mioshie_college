import os
import re

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

files_to_minify = [
    ('css/styles.css', 'css/styles.min.css', 'css'),
    ('js/toggle.js', 'js/toggle.min.js', 'js'),
    ('js/reader.js', 'js/reader.min.js', 'js')
]

def minify_css(css):
    # Remove block comments
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.DOTALL)
    # Remove whitespace around structural characters
    css = re.sub(r'\s*([\{\}\:\;\,])\s*', r'\1', css)
    # Remove newlines and tabs
    css = re.sub(r'[\r\n\t]+', ' ', css)
    # Collapse multiple spaces into one
    css = re.sub(r'\s{2,}', ' ', css)
    # Remove trailing semicolons in blocks
    css = re.sub(r';}', '}', css)
    return css.strip()

def minify_js(js):
    # Remove block comments (multiline)
    js = re.sub(r'/\*.*?\*/', '', js, flags=re.DOTALL)
    # Remove single line comments (but not URLs like http://)
    js = re.sub(r'(?<![A-Za-z0-9_:\'"])\/\/.*', '', js)
    
    # Simple whitespace collapse (doing full structural minification in python requires a parser,
    # so we'll do safe basic minification: remove empty lines and extra spaces)
    import string
    
    lines = js.split('\n')
    out_lines = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        out_lines.append(line)
        
    js = '\n'.join(out_lines)
    return js

for src, dest, ftype in files_to_minify:
    src_path = os.path.join(base_dir, src)
    dest_path = os.path.join(base_dir, dest)
    
    if not os.path.exists(src_path):
        print(f"Skipping {src_path}, not found.")
        continue
        
    print(f"Minifying {src}...")
    with open(src_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    orig_len = len(content)
    
    if ftype == 'css':
        minified = minify_css(content)
    else:
        minified = minify_js(content)
        
    new_len = len(minified)
    
    with open(dest_path, 'w', encoding='utf-8') as f:
        f.write(minified)
        
    savings = 100 - (new_len / orig_len * 100) if orig_len > 0 else 0
    print(f"  Saved {savings:.1f}% ({orig_len} -> {new_len} bytes)")

print("Done minifying assets!")
