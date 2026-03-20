import os

file_path = r'c:\Users\Juanma\.gemini\antigravity\TikTak 2.1\src\pages\Gerencia.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update GerenciaDashboard component definition to accept activeZoneId
content = content.replace(
    'const GerenciaDashboard = ({ tasks, batteries, partners, movements, cashHistory, inventory, orders, cumulativeCashDiff, employees, auditAlerts, onXPBonus, onTabSwitch }) => {',
    'const GerenciaDashboard = ({ tasks, batteries, partners, movements, cashHistory, inventory, orders, cumulativeCashDiff, employees, auditAlerts, activeZoneId, onXPBonus, onTabSwitch }) => {'
)

# 2. Update usage of GerenciaDashboard to pass activeZoneId
content = content.replace(
    'onTabSwitch={setActiveTab} />',
    'activeZoneId={activeZoneId} onTabSwitch={setActiveTab} />'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully fixed GerenciaDashboard props.")
