import os

file_path = r'c:\Users\Juanma\.gemini\antigravity\TikTak 2.1\src\pages\Gerencia.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update BatteryForm component definition to accept zones
content = content.replace(
    'const BatteryForm = ({ initialData, onSave, onCancel }) => {',
    'const BatteryForm = ({ initialData, zones, onSave, onCancel }) => {'
)

# 2. Update usage of BatteryForm to pass zones
content = content.replace(
    '<BatteryForm initialData={modal.data} onSave={handleSaveBattery} onCancel={() => setModal({ type: null, data: null })} />',
    '<BatteryForm initialData={modal.data} zones={zones} onSave={handleSaveBattery} onCancel={() => setModal({ type: null, data: null })} />'
)

# 3. Update BatteriesView component definition to accept activeZoneId
content = content.replace(
    'const BatteriesView = ({ batteries, onAdd, onCheck, onDelete, onEdit, onAddItem, onDeleteItem, onPostpone, hideHeader, isCompact }) => {',
    'const BatteriesView = ({ batteries, onAdd, onCheck, onDelete, onEdit, onAddItem, onDeleteItem, onPostpone, hideHeader, isCompact, activeZoneId }) => {'
)

# 4. Update BatteriesView logic to filter by activeZoneId
content = content.replace(
    'const safeBatteries = Array.isArray(batteries) ? batteries : [];',
    'const safeBatteries = (Array.isArray(batteries) ? batteries : []).filter(b => !activeZoneId || b.zone_id == activeZoneId);'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated BatteryForm and BatteriesView.")
