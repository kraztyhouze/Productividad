import os

file_path = r'c:\Users\Juanma\.gemini\antigravity\TikTak 2.1\src\pages\Gerencia.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Filter out common JS constructs that might confuse the simple counter
# Like strings, comments
# But we mostly care about braces at the module/component level
stack = []
for i, char in enumerate(text):
    if char == '{':
        stack.append(i)
    elif char == '}':
        if stack:
            stack.pop()
        else:
            print(f"Extra closing brace at position {i}")

if stack:
    for pos in stack:
        # Find line number
        line_num = text.count('\n', 0, pos) + 1
        snippet = text[pos:pos+50].replace('\n', ' ')
        print(f"Unclosed brace at L{line_num}: {snippet}")
else:
    print("All braces matched (simple count)")
