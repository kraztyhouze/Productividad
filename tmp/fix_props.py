import os

file_path = r'c:\Users\Juanma\.gemini\antigravity\TikTak 2.1\src\pages\Gerencia.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace activeId={activeZoneId} with activeZoneId={activeZoneId}
new_content = content.replace('activeId={activeZoneId}', 'activeZoneId={activeZoneId}')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully fixed ZoneFilter props.")
