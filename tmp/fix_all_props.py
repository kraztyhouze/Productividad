import os

file_path = r'c:\Users\Juanma\.gemini\antigravity\TikTak 2.1\src\pages\Gerencia.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update ReportsView component definition to accept activeZoneId
content = content.replace(
    'const ReportsView = ({ batteries, tasks, cashHistory, movements, partners }) => {',
    'const ReportsView = ({ batteries, tasks, cashHistory, movements, partners, activeZoneId }) => {'
)

# 2. Update usage of ReportsView to pass activeZoneId
content = content.replace(
    'partners={partners} />',
    'partners={partners} activeZoneId={activeZoneId} />'
)

# 3. Update JewelryView component definition to accept activeZoneId
content = content.replace(
    'const JewelryView = ({ inventory, orders, partners, movements, onAddPartner, onEditPartner, onDeletePartner, onAddMovement, onDeleteMovement, onRefine, onAddOrder, onReceiveOrder, onAdjustInventory }) => {',
    'const JewelryView = ({ inventory, orders, partners, movements, onAddPartner, onEditPartner, onDeletePartner, onAddMovement, onDeleteMovement, onRefine, onAddOrder, onReceiveOrder, onAdjustInventory, activeZoneId }) => {'
)

# 4. Update usage of JewelryView to pass activeZoneId
# Since it's a multiline call, I'll be careful
content = content.replace(
    'onAdjustInventory={(cat) => setModal({ type: "inventory_adjust", data: cat })}\n                    />',
    'onAdjustInventory={(cat) => setModal({ type: "inventory_adjust", data: cat })}\n                        activeZoneId={activeZoneId}\n                    />'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully fixed ReportsView and JewelryView props.")
