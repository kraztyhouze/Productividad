import os

file_path = r'c:\Users\Juanma\.gemini\antigravity\TikTak 2.1\src\pages\Gerencia.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Check ()
stack_p = []
for i, char in enumerate(text):
    if char == '(':
        stack_p.append(i)
    elif char == ')':
        if stack_p:
            stack_p.pop()
        else:
            line = text.count('\n', 0, i) + 1
            print(f"Extra closing parenthesis at L{line}")

if stack_p:
    for pos in stack_p:
        line_num = text.count('\n', 0, pos) + 1
        snippet = text[pos:pos+50].replace('\n', ' ')
        print(f"Unclosed parenthesis at L{line_num}: {snippet}")
else:
    print("All parentheses matched")
