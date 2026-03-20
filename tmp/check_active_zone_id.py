import os
import re

file_path = r'c:\Users\Juanma\.gemini\antigravity\TikTak 2.1\src\pages\Gerencia.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find all component definitions using activeZoneId
pattern = re.compile(r'const (\w+) = \(\{([^}]+)\}\) => \{', re.MULTILINE)
matches = pattern.findall(content)

results = []
for comp_name, props in matches:
    # Check if activeZoneId is used in the component body
    # This is a bit complex with regex, so I'll just look for the text in the component's likely range
    comp_start = content.find(f'const {comp_name} =')
    # Find next component or end of file
    next_comp = content.find('const ', comp_start + 1)
    if next_comp == -1: next_comp = len(content)
    
    body = content[comp_start:next_comp]
    if 'activeZoneId' in body:
        if 'activeZoneId' not in props:
            results.append((comp_name, props))

print(f"Components using activeZoneId but not receiving it in props: {results}")

# Also check usages of activeZoneId in the main Gerencia component calls
# Find <CompName ... /> and see if activeZoneId is passed if defined in the component
# I'll manually check the common ones: ReportsView, GerenciaDashboard (already fixed), etc.
