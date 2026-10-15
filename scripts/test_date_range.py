# -*- coding: utf-8 -*-
"""
Test date range logic in Python mimicking JavaScript implementation
"""

import datetime

def parse_tx_date(date_str, day_num=None):
    months_map = {
        'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'mei': 5, 'jun': 6,
        'jul': 7, 'agt': 8, 'aug': 8, 'sep': 9, 'okt': 10, 'oct': 10, 'nov': 11, 'des': 12, 'dec': 12
    }
    if date_str:
        import re
        m = re.match(r'(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})(?:,\s+(\d{1,2}):(\d{2}))?', date_str)
        if m:
            d = int(m.group(1))
            mon = months_map.get(m.group(2).lower(), 10)
            y = int(m.group(3))
            hh = int(m.group(4)) if m.group(4) else 12
            mm = int(m.group(5)) if m.group(5) else 0
            return datetime.datetime(y, mon, d, hh, mm)
    if day_num is not None:
        return datetime.datetime(2026, 10, day_num, 12, 0)
    return None

now_wib = datetime.datetime(2026, 10, 14, 17, 15)

sample_txs = [
    {'id': 'tx-101', 'date': '14 Okt 2026, 13:15 WIB', 'dayNum': 14, 'amount': 35000},
    {'id': 'tx-102', 'date': '14 Okt 2026, 08:30 WIB', 'dayNum': 14, 'amount': 18000},
    {'id': 'tx-102b', 'date': '13 Okt 2026, 14:00 WIB', 'dayNum': 13, 'amount': 25000},
    {'id': 'tx-103', 'date': '12 Okt 2026, 19:40 WIB', 'dayNum': 12, 'amount': 184500},
    {'id': 'tx-106', 'date': '10 Okt 2026, 12:00 WIB', 'dayNum': 10, 'amount': 45000},
    {'id': 'tx-107', 'date': '08 Okt 2026, 18:30 WIB', 'dayNum': 8, 'amount': 75000},
    {'id': 'tx-105', 'date': '05 Okt 2026, 15:20 WIB', 'dayNum': 5, 'amount': 2300000},
    {'id': 'tx-104', 'date': '01 Okt 2026, 09:00 WIB', 'dayNum': 1, 'amount': 8500000},
]

def is_in_range(tx, rng):
    d = parse_tx_date(tx.get('date'), tx.get('dayNum'))
    if not d:
        return True
    today = now_wib.date()
    tx_date = d.date()

    if rng == 'hari_ini':
        return tx_date == today
    if rng == 'kemarin':
        return tx_date == (today - datetime.timedelta(days=1))
    if rng == '7_hari':
        return (today - datetime.timedelta(days=6)) <= tx_date <= today
    if rng == '30_hari':
        return (today - datetime.timedelta(days=29)) <= tx_date <= today
    if rng == 'bulan_ini':
        return tx_date.year == today.year and tx_date.month == today.month
    if rng == 'tahun_ini':
        return tx_date.year == today.year
    return True

print("Hari Ini:", [t['id'] for t in sample_txs if is_in_range(t, 'hari_ini')])
print("Kemarin:", [t['id'] for t in sample_txs if is_in_range(t, 'kemarin')])
print("7 Hari:", [t['id'] for t in sample_txs if is_in_range(t, '7_hari')])
print("Bulan Ini:", [t['id'] for t in sample_txs if is_in_range(t, 'bulan_ini')])

assert len([t for t in sample_txs if is_in_range(t, 'hari_ini')]) == 2
assert len([t for t in sample_txs if is_in_range(t, 'kemarin')]) == 1
assert len([t for t in sample_txs if is_in_range(t, '7_hari')]) == 6
assert len([t for t in sample_txs if is_in_range(t, 'bulan_ini')]) == 8
print("All assertions passed!")
