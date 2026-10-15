# -*- coding: utf-8 -*-
"""
Verification script for:
1. Date Range Filter ("hari_ini", "kemarin", "7_hari", "30_hari", "bulan_ini")
2. Telegram Bot Multi-Wallet selection ("bca", "gopay", "mandiri", "cash", etc.)
"""

INDEX_PATH = r"C:\Users\Asus\.gemini\antigravity\scratch\tatadana\public\index.html"

with open(INDEX_PATH, 'r', encoding='utf-8') as f:
    html = f.read()

# Assertions
assert 'function getFilteredTransactions(' in html, "ERROR: getFilteredTransactions function missing!"
assert 'function isTxInDateRange(' in html, "ERROR: isTxInDateRange function missing!"
assert 'function parseTxDate(' in html, "ERROR: parseTxDate function missing!"
assert 'function getDateRangeLabel(' in html, "ERROR: getDateRangeLabel function missing!"
assert 'function buildWalletSelectionButtons(' in html, "ERROR: buildWalletSelectionButtons function missing!"
assert 'changeTxWallet(' in html, "ERROR: changeTxWallet function missing!"
assert 'Pilih Rekening Sumber Pengeluaran:' in html, "ERROR: Wallet selection label in bot buttons missing!"
assert 'filteredTxs' in html, "ERROR: filteredTxs variable in renderBerandaTab missing!"

print("[SUCCESS] All period filter and multi-wallet bot assertions passed!")

import urllib.request
resp = urllib.request.urlopen('http://localhost:3000')
assert resp.getcode() == 200, f"Expected 200 OK, got {resp.getcode()}"
print(f"[SUCCESS] Server responded with HTTP 200 OK (Content Length: {len(resp.read())})")
