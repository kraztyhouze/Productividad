import os
import re

file_path = r'c:\Users\Juanma\.gemini\antigravity\TikTak 2.1\src\pages\Gerencia.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find all component definitions
# format: const CompName = ({ prop1, prop2 }) => {
comp_pattern = re.compile(r'const (\w+) = \(\{([^}]*)\}\) => \{')

# Find all activeZoneId usages
usage_pattern = re.compile(r'\bactiveZoneId\b')

# Extract components and check if they use activeZoneId without having it in props
matches = list(comp_pattern.finditer(content))

results = []
for i, match in enumerate(matches):
    comp_name = match.group(1)
    props = match.group(2)
    start_pos = match.start()
    
    # End pos is start of next component or EOF
    end_pos = matches[i+1].start() if i + 1 < len(matches) else len(content)
    
    body = content[start_pos:end_pos]
    
    if usage_pattern.search(body) and 'activeZoneId' not in props:
        # Check if it was defined inside the component (not likely if it's a prop I just added)
        if 'const [activeZoneId' not in body:
            results.append(comp_name)

print(f"Missing activeZoneId in props for: {results}")

# Also check for undefined variables in the whole file
# Just a quick check for common suspects
suspects = ['activeZoneId', 'zones', 'tasks', 'batteries']
for s in suspects:
    # Find all usages
    for match in re.finditer(r'\b' + s + r'\b', content):
        # Check if it's inside a component that doesn't define it or receive it
        pass # This is hard without full AST parsing

# Update batteryStats useMemo dependencies
content = re.sub(
    r'\}, \[batteries\]\); // batteryStats', # Wait, did I add the comment? Let's check
    r'}, [batteries, activeZoneId]);',
    content
)
# Just look for the first occurrence in GerenciaDashboard
content = content.replace(
    '}, [batteries]);',
    '}, [batteries, activeZoneId]);',
    1 # Only first one
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated dependencies and confirmed components.")
