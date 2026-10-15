# -*- coding: utf-8 -*-
"""
Verification script for Bot Category Selection & Detection feature
"""

INDEX_PATH = r"C:\Users\Asus\.gemini\antigravity\scratch\tatadana\public\index.html"

with open(INDEX_PATH, 'r', encoding='utf-8') as f:
    html = f.read()

assert 'function detectCategoryFromText(' in html, "ERROR: detectCategoryFromText missing!"
assert 'function buildBotTxActionButtons(' in html, "ERROR: buildBotTxActionButtons missing!"
assert 'function changeTxCategory(' in html, "ERROR: changeTxCategory missing!"
assert 'Pilih Kategori:' in html, "ERROR: Category buttons label missing!"
assert 'detectedCategory' in html, "ERROR: detectedCategory variable in handleBotResponse missing!"

print("[SUCCESS] All Bot Category Selection & Detection assertions passed!")

import urllib.request
resp = urllib.request.urlopen('http://localhost:3000')
assert resp.getcode() == 200
print(f"[SUCCESS] Server responded with HTTP 200 OK (Content length: {len(resp.read())})")
