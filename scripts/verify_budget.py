# -*- coding: utf-8 -*-
"""
Verification script for Budget Bulanan feature
"""

INDEX_PATH = r"C:\Users\Asus\.gemini\antigravity\scratch\tatadana\public\index.html"

with open(INDEX_PATH, 'r', encoding='utf-8') as f:
    html = f.read()

assert 'function getCategorySpentThisMonth(' in html, "ERROR: getCategorySpentThisMonth missing!"
assert 'id="set-budget-modal"' in html, "ERROR: set-budget-modal missing!"
assert 'function openSetBudgetModal(' in html, "ERROR: openSetBudgetModal missing!"
assert 'function handleSaveBudget(' in html, "ERROR: handleSaveBudget missing!"
assert 'function handleRemoveBudget(' in html, "ERROR: handleRemoveBudget missing!"
assert 'ALERT BUDGET BULANAN' in html, "ERROR: Telegram bot budget alerts missing!"
assert 'Total Budget Terpasang' in html, "ERROR: Summary cards missing in Budget tab!"

print("[SUCCESS] All Budget Bulanan assertions passed!")

import urllib.request
resp = urllib.request.urlopen('http://localhost:3000')
assert resp.getcode() == 200
print(f"[SUCCESS] Server responded with HTTP 200 OK (Content length: {len(resp.read())})")
