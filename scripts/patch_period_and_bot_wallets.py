# -*- coding: utf-8 -*-
"""
Patch public/index.html:
1. Global DateRangeFilter (Hari Ini, Kemarin, 7 Hari, 30 Hari, Bulan Ini, Bulan Lalu, Tahun Ini):
   - parseTxDate & isTxInDateRange & getFilteredTransactions
   - Dynamic period labels
   - Beranda stats cards, category progress bars, and transactions table now use getFilteredTransactions()
   - Transaksi tab uses getFilteredTransactions()
   - Laporan tab summary cards and table use getFilteredTransactions()
   - DEFAULT_DEMO_USER demo transactions aligned to 14 Okt (today) and 13 Okt (kemarin)

2. Telegram Chat Bot - Multi-Account Selection:
   - When typing an expense, the bot provides interactive buttons for ALL user wallets (BCA, GoPay, Mandiri, Cash, etc.)
   - Clicking any wallet button immediately transfers the mutation to that account and recalculates balances
   - All wallets (current and user-created) can be used!
"""

import re
import sys

INDEX_PATH = r"C:\Users\Asus\.gemini\antigravity\scratch\tatadana\public\index.html"

def main():
    with open(INDEX_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    print(f"Read {len(content)} characters from {INDEX_PATH}")

    # =========================================================================
    # 1. UPDATE DEFAULT_DEMO_USER TRANSACTIONS (14 Okt today, 13 Okt yesterday, 7 Hari range)
    # =========================================================================
    old_demo_txs = '''      transactions: [
        { id: 'tx-101', date: '13 Okt 2026, 13:15 WIB', dayNum: 13, type: 'expense', amount: 35000, category: '🍜 Makanan & Minuman', wallet: 'BCA Utama', notes: 'Nasi Goreng Kambing', source: 'telegram' },
        { id: 'tx-102', date: '13 Okt 2026, 08:30 WIB', dayNum: 13, type: 'expense', amount: 18000, category: '🚗 Transportasi', wallet: 'GoPay', notes: 'Gojek ke Stasiun', source: 'voice_note', vnTranscript: 'gojek ke stasiun 18 ribu' },
        { id: 'tx-103', date: '12 Okt 2026, 19:40 WIB', dayNum: 12, type: 'expense', amount: 184500, category: '🛒 Belanja Kebutuhan', wallet: 'BCA Utama', notes: 'Struk Indomaret Point', source: 'receipt_ocr',
          receiptItems: [
            { name: 'Minyak Goreng 2L', qty: 1, price: 34000, subtotal: 34000 },
            { name: 'Beras Premium 5kg', qty: 1, price: 74500, subtotal: 74500 },
            { name: 'Kopi Susu Kaleng', qty: 4, price: 9000, subtotal: 36000 },
            { name: 'Sabun Cuci Piring', qty: 2, price: 20000, subtotal: 40000 }
          ]
        },
        { id: 'tx-104', date: '01 Okt 2026, 09:00 WIB', dayNum: 1, type: 'income', amount: 8500000, category: '💰 Gaji Bulanan', wallet: 'BCA Utama', notes: 'Gaji Pokok Oktober', source: 'telegram' },
        { id: 'tx-105', date: '05 Okt 2026, 15:20 WIB', dayNum: 5, type: 'income', amount: 2300000, category: '💻 Freelance & Side Hustle', wallet: 'Mandiri Livin', notes: 'Proyek Web Desain', source: 'web' },
        { id: 'tx-106', date: '10 Okt 2026, 12:00 WIB', dayNum: 10, type: 'expense', amount: 45000, category: '🍜 Makanan & Minuman', wallet: 'GoPay', notes: 'Makan Siang Ramen', source: 'telegram' },
        { id: 'tx-107', date: '08 Okt 2026, 18:30 WIB', dayNum: 8, type: 'expense', amount: 75000, category: '🎮 Hiburan & Kopi', wallet: 'BCA Utama', notes: 'Nongkrong Cafe', source: 'telegram' },
      ],'''

    new_demo_txs = '''      transactions: [
        { id: 'tx-101', date: '14 Okt 2026, 13:15 WIB', dayNum: 14, type: 'expense', amount: 35000, category: '🍜 Makanan & Minuman', wallet: 'BCA Utama', notes: 'Nasi Goreng Kambing', source: 'telegram' },
        { id: 'tx-102', date: '14 Okt 2026, 08:30 WIB', dayNum: 14, type: 'expense', amount: 18000, category: '🚗 Transportasi', wallet: 'GoPay', notes: 'Gojek ke Stasiun', source: 'voice_note', vnTranscript: 'gojek ke stasiun 18 ribu' },
        { id: 'tx-102b', date: '13 Okt 2026, 14:00 WIB', dayNum: 13, type: 'expense', amount: 25000, category: '🍜 Makanan & Minuman', wallet: 'BCA Utama', notes: 'Ayam Geprek Sambal Bawang', source: 'telegram' },
        { id: 'tx-103', date: '12 Okt 2026, 19:40 WIB', dayNum: 12, type: 'expense', amount: 184500, category: '🛒 Belanja Kebutuhan', wallet: 'BCA Utama', notes: 'Struk Indomaret Point', source: 'receipt_ocr',
          receiptItems: [
            { name: 'Minyak Goreng 2L', qty: 1, price: 34000, subtotal: 34000 },
            { name: 'Beras Premium 5kg', qty: 1, price: 74500, subtotal: 74500 },
            { name: 'Kopi Susu Kaleng', qty: 4, price: 9000, subtotal: 36000 },
            { name: 'Sabun Cuci Piring', qty: 2, price: 20000, subtotal: 40000 }
          ]
        },
        { id: 'tx-106', date: '10 Okt 2026, 12:00 WIB', dayNum: 10, type: 'expense', amount: 45000, category: '🍜 Makanan & Minuman', wallet: 'GoPay', notes: 'Makan Siang Ramen', source: 'telegram' },
        { id: 'tx-107', date: '08 Okt 2026, 18:30 WIB', dayNum: 8, type: 'expense', amount: 75000, category: '🎮 Hiburan & Kopi', wallet: 'BCA Utama', notes: 'Nongkrong Cafe', source: 'telegram' },
        { id: 'tx-105', date: '05 Okt 2026, 15:20 WIB', dayNum: 5, type: 'income', amount: 2300000, category: '💻 Freelance & Side Hustle', wallet: 'Mandiri Livin', notes: 'Proyek Web Desain', source: 'web' },
        { id: 'tx-104', date: '01 Okt 2026, 09:00 WIB', dayNum: 1, type: 'income', amount: 8500000, category: '💰 Gaji Bulanan', wallet: 'BCA Utama', notes: 'Gaji Pokok Oktober', source: 'telegram' },
      ],'''

    content = content.replace(old_demo_txs, new_demo_txs)

    # In case localStorage already has older demo user, update loadUserSession to refresh dates if demo user
    old_load = '''      AppState.transactions = found.transactions ? JSON.parse(JSON.stringify(found.transactions)) : [];'''
    new_load = '''      AppState.transactions = found.transactions ? JSON.parse(JSON.stringify(found.transactions)) : [];
      // Ensure demo user has realistic 14 Okt transactions for today & 7-hari testing
      if (found.id === 'usr-001' && AppState.transactions.length > 0) {
        if (AppState.transactions[0].id === 'tx-101' && AppState.transactions[0].dayNum === 13) {
          AppState.transactions[0].dayNum = 14;
          AppState.transactions[0].date = '14 Okt 2026, 13:15 WIB';
        }
        if (AppState.transactions.length > 1 && AppState.transactions[1].id === 'tx-102' && AppState.transactions[1].dayNum === 13) {
          AppState.transactions[1].dayNum = 14;
          AppState.transactions[1].date = '14 Okt 2026, 08:30 WIB';
        }
      }'''
    content = content.replace(old_load, new_load)

    # =========================================================================
    # 2. DATE RANGE UTILITIES & HELPERS
    # =========================================================================
    date_range_helpers = '''
    // =========================================================================
    // GLOBAL DATE RANGE FILTER UTILITIES (HARI INI, 7 HARI, 30 HARI, BULAN INI)
    // =========================================================================
    function parseTxDate(tx) {
      if (!tx) return null;
      if (tx.timestamp) return new Date(tx.timestamp);
      if (tx.occurred_at) return new Date(tx.occurred_at);
      if (typeof tx.date === 'string') {
        const monthsMap = {
          'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'mei': 4, 'jun': 5,
          'jul': 6, 'agt': 7, 'aug': 7, 'sep': 8, 'okt': 9, 'oct': 9, 'nov': 10, 'des': 11, 'dec': 11
        };
        const m = tx.date.match(/(\\d{1,2})\\s+([A-Za-z]{3})\\s+(\\d{4})(?:,\\s+(\\d{1,2}):(\\d{2}))?/i);
        if (m) {
          const d = parseInt(m[1], 10);
          const monStr = m[2].toLowerCase();
          const month = monthsMap[monStr] !== undefined ? monthsMap[monStr] : 9;
          const year = parseInt(m[3], 10);
          const hh = m[4] ? parseInt(m[4], 10) : 12;
          const mm = m[5] ? parseInt(m[5], 10) : 0;
          return new Date(year, month, d, hh, mm);
        }
      }
      if (typeof tx.dayNum === 'number') {
        const now = getWIBDate();
        return new Date(now.getFullYear(), now.getMonth(), tx.dayNum, 12, 0);
      }
      return null;
    }

    function isTxInDateRange(tx, range = AppState.dateRange) {
      const now = getWIBDate();
      const todayDay = now.getDate();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const txDate = parseTxDate(tx);
      const dayNum = (txDate ? txDate.getDate() : tx.dayNum);
      const txMonth = (txDate ? txDate.getMonth() : currentMonth);
      const txYear = (txDate ? txDate.getFullYear() : currentYear);

      if (range === 'hari_ini') {
        return dayNum === todayDay && txMonth === currentMonth && txYear === currentYear;
      }

      if (range === 'kemarin') {
        const yest = new Date(currentYear, currentMonth, todayDay - 1);
        return dayNum === yest.getDate() && txMonth === yest.getMonth() && txYear === yest.getFullYear();
      }

      if (range === '7_hari') {
        if (txDate) {
          const start7 = new Date(currentYear, currentMonth, todayDay - 6, 0, 0, 0);
          const endToday = new Date(currentYear, currentMonth, todayDay, 23, 59, 59);
          return txDate >= start7 && txDate <= endToday;
        }
        return dayNum >= (todayDay - 6) && dayNum <= todayDay && txMonth === currentMonth && txYear === currentYear;
      }

      if (range === '30_hari') {
        if (txDate) {
          const start30 = new Date(currentYear, currentMonth, todayDay - 29, 0, 0, 0);
          const endToday = new Date(currentYear, currentMonth, todayDay, 23, 59, 59);
          return txDate >= start30 && txDate <= endToday;
        }
        return true;
      }

      if (range === 'bulan_ini') {
        return txMonth === currentMonth && txYear === currentYear;
      }

      if (range === 'bulan_lalu') {
        const prevMonth = new Date(currentYear, currentMonth - 1, 1);
        return txMonth === prevMonth.getMonth() && txYear === prevMonth.getFullYear();
      }

      if (range === 'tahun_ini') {
        return txYear === currentYear;
      }

      return true;
    }

    function getFilteredTransactions(range = AppState.dateRange) {
      return AppState.transactions.filter(t => isTxInDateRange(t, range));
    }

    function getDateRangeLabel(range = AppState.dateRange) {
      const now = getWIBDate();
      const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
      const today = now.getDate();
      const m = monthsShort[now.getMonth()];
      const y = now.getFullYear();

      if (range === 'hari_ini') {
        return `Hari Ini (${today} ${m} ${y})`;
      }
      if (range === 'kemarin') {
        const yest = new Date(y, now.getMonth(), today - 1);
        return `Kemarin (${yest.getDate()} ${monthsShort[yest.getMonth()]} ${yest.getFullYear()})`;
      }
      if (range === '7_hari') {
        const start7 = new Date(y, now.getMonth(), today - 6);
        return `${start7.getDate()} ${monthsShort[start7.getMonth()]} - ${today} ${m} ${y} (7 Hari Terakhir)`;
      }
      if (range === '30_hari') {
        const start30 = new Date(y, now.getMonth(), today - 29);
        return `${start30.getDate()} ${monthsShort[start30.getMonth()]} - ${today} ${m} ${y} (30 Hari)`;
      }
      if (range === 'bulan_ini') {
        const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
        return `1 ${m} - ${lastDay} ${m} ${y} (Bulan Ini)`;
      }
      if (range === 'bulan_lalu') {
        const prevMonth = new Date(y, now.getMonth() - 1, 1);
        const lastDayPrev = new Date(y, now.getMonth(), 0).getDate();
        const prevM = monthsShort[prevMonth.getMonth()];
        return `1 ${prevM} - ${lastDayPrev} ${prevM} ${prevMonth.getFullYear()} (Bulan Lalu)`;
      }
      if (range === 'tahun_ini') {
        return `1 Jan - 31 Des ${y} (Tahun Ini)`;
      }
      return `Semua Periode`;
    }

    function getDateRangeShortName(range = AppState.dateRange) {
      if (range === 'hari_ini') return 'Hari Ini';
      if (range === 'kemarin') return 'Kemarin';
      if (range === '7_hari') return '7 Hari';
      if (range === '30_hari') return '30 Hari';
      if (range === 'bulan_ini') return 'Bulan Ini';
      if (range === 'bulan_lalu') return 'Bulan Lalu';
      if (range === 'tahun_ini') return 'Tahun Ini';
      return 'Periode Aktif';
    }

    function renderCategoryBreakdown(txList) {
      const expenseTxs = txList.filter(t => t.type === 'expense');
      const total = expenseTxs.reduce((sum, t) => sum + t.amount, 0);

      if (total === 0 || expenseTxs.length === 0) {
        return `<div class="p-6 text-center text-xs text-slate-400">Belum ada transaksi pengeluaran pada periode ini.</div>`;
      }

      const categoryMap = {};
      expenseTxs.forEach(t => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
      });

      const sorted = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
      return sorted.slice(0, 5).map(([cat, amt]) => {
        const pct = Math.round((amt / total) * 100);
        return `
          <div>
            <div class="flex justify-between font-medium text-slate-700 mb-1">
              <span>${cat}</span>
              <span class="font-bold text-brand-600">${formatIDR(amt)} (${pct}%)</span>
            </div>
            <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div class="bg-brand-500 h-full rounded-full transition-all duration-300" style="width: ${pct}%"></div>
            </div>
          </div>
        `;
      }).join('');
    }
'''

    if 'function getFilteredTransactions(' not in content:
        content = content.replace('function setDateRange(range) {', date_range_helpers + '\n    function setDateRange(range) {')

    # =========================================================================
    # 3. UPDATE GLOBAL DATERANGEFILTER BAR in renderDashboardPage()
    # =========================================================================
    old_date_bar = '''        <!-- Global DateRangeFilter Bar -->
        <div class="bg-white p-3 rounded-2xl border border-rose-100 flex items-center justify-between text-xs overflow-x-auto shadow-sm">
          <div class="flex items-center space-x-1 font-semibold text-slate-600 whitespace-nowrap">
            <span class="text-slate-400 mr-2 text-[11px]">Periode:</span>
            <button onclick="setDateRange('hari_ini')" class="px-3 py-1.5 rounded-lg transition ${AppState.dateRange === 'hari_ini' ? 'bg-brand-500 text-white font-bold shadow-sm' : 'hover:bg-rose-50'}">Hari Ini</button>
            <button onclick="setDateRange('kemarin')" class="px-3 py-1.5 rounded-lg transition ${AppState.dateRange === 'kemarin' ? 'bg-brand-500 text-white font-bold shadow-sm' : 'hover:bg-rose-50'}">Kemarin</button>
            <button onclick="setDateRange('7_hari')" class="px-3 py-1.5 rounded-lg transition ${AppState.dateRange === '7_hari' ? 'bg-brand-500 text-white font-bold shadow-sm' : 'hover:bg-rose-50'}">7 Hari</button>
            <button onclick="setDateRange('30_hari')" class="px-3 py-1.5 rounded-lg transition ${AppState.dateRange === '30_hari' ? 'bg-brand-500 text-white font-bold shadow-sm' : 'hover:bg-rose-50'}">30 Hari</button>
            <button onclick="setDateRange('bulan_ini')" class="px-3 py-1.5 rounded-lg transition ${AppState.dateRange === 'bulan_ini' ? 'bg-brand-500 text-white font-bold shadow-sm' : 'hover:bg-rose-50'}">Bulan Ini</button>
            <button onclick="setDateRange('bulan_lalu')" class="px-3 py-1.5 rounded-lg transition ${AppState.dateRange === 'bulan_lalu' ? 'bg-brand-500 text-white font-bold shadow-sm' : 'hover:bg-rose-50'}">Bulan Lalu</button>
            <button onclick="setDateRange('tahun_ini')" class="px-3 py-1.5 rounded-lg transition ${AppState.dateRange === 'tahun_ini' ? 'bg-brand-500 text-white font-bold shadow-sm' : 'hover:bg-rose-50'}">Tahun Ini</button>
          </div>
          <span class="text-[11px] text-slate-400 font-mono hidden sm:inline-block">1 Okt — 31 Okt 2026</span>
        </div>'''

    new_date_bar = '''        <!-- Global DateRangeFilter Bar -->
        <div class="bg-white p-3 rounded-2xl border border-rose-100 flex items-center justify-between text-xs overflow-x-auto shadow-sm">
          <div class="flex items-center space-x-1 font-semibold text-slate-600 whitespace-nowrap">
            <span class="text-slate-400 mr-2 text-[11px]">Periode:</span>
            <button onclick="setDateRange('hari_ini')" class="px-3 py-1.5 rounded-lg transition ${AppState.dateRange === 'hari_ini' ? 'bg-brand-500 text-white font-bold shadow-sm' : 'text-slate-600 hover:bg-rose-50'}">Hari Ini</button>
            <button onclick="setDateRange('kemarin')" class="px-3 py-1.5 rounded-lg transition ${AppState.dateRange === 'kemarin' ? 'bg-brand-500 text-white font-bold shadow-sm' : 'text-slate-600 hover:bg-rose-50'}">Kemarin</button>
            <button onclick="setDateRange('7_hari')" class="px-3 py-1.5 rounded-lg transition ${AppState.dateRange === '7_hari' ? 'bg-brand-500 text-white font-bold shadow-sm' : 'text-slate-600 hover:bg-rose-50'}">7 Hari</button>
            <button onclick="setDateRange('30_hari')" class="px-3 py-1.5 rounded-lg transition ${AppState.dateRange === '30_hari' ? 'bg-brand-500 text-white font-bold shadow-sm' : 'text-slate-600 hover:bg-rose-50'}">30 Hari</button>
            <button onclick="setDateRange('bulan_ini')" class="px-3 py-1.5 rounded-lg transition ${AppState.dateRange === 'bulan_ini' ? 'bg-brand-500 text-white font-bold shadow-sm' : 'text-slate-600 hover:bg-rose-50'}">Bulan Ini</button>
            <button onclick="setDateRange('bulan_lalu')" class="px-3 py-1.5 rounded-lg transition ${AppState.dateRange === 'bulan_lalu' ? 'bg-brand-500 text-white font-bold shadow-sm' : 'text-slate-600 hover:bg-rose-50'}">Bulan Lalu</button>
            <button onclick="setDateRange('tahun_ini')" class="px-3 py-1.5 rounded-lg transition ${AppState.dateRange === 'tahun_ini' ? 'bg-brand-500 text-white font-bold shadow-sm' : 'text-slate-600 hover:bg-rose-50'}">Tahun Ini</button>
          </div>
          <span class="text-[11px] text-brand-600 font-bold font-mono hidden sm:inline-block">📅 ${getDateRangeLabel(AppState.dateRange)}</span>
        </div>'''
    content = content.replace(old_date_bar, new_date_bar)

    # Subtab button transaction count
    content = content.replace(
        "💳 Transaksi (${AppState.transactions.length})",
        "💳 Transaksi (${getFilteredTransactions().length})"
    )

    # =========================================================================
    # 4. UPDATE renderBerandaTab() WITH getFilteredTransactions()
    # =========================================================================
    old_beranda_start = '''    // --- TAB 1: BERANDA ---
    function renderBerandaTab() {
      const jatah = getTataJatahState();
      const totalIncome = AppState.transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const totalExpense = AppState.transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);'''

    new_beranda_start = '''    // --- TAB 1: BERANDA ---
    function renderBerandaTab() {
      const jatah = getTataJatahState();
      const filteredTxs = getFilteredTransactions();
      const totalIncome = filteredTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const totalExpense = filteredTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
      const rangeShort = getDateRangeShortName(AppState.dateRange);'''
    content = content.replace(old_beranda_start, new_beranda_start)

    # Stat cards labels in Beranda
    content = content.replace(
        '<span class="text-xs text-slate-500 font-semibold">Pemasukan Bulan Ini</span>',
        '<span class="text-xs text-slate-500 font-semibold">Pemasukan (${rangeShort})</span>'
    )
    content = content.replace(
        '<span class="text-xs text-slate-500 font-semibold">Pengeluaran Bulan Ini</span>',
        '<span class="text-xs text-slate-500 font-semibold">Pengeluaran (${rangeShort})</span>'
    )
    content = content.replace(
        '<span class="text-[11px] text-brand-600 font-semibold mt-1 inline-block">Tersinkron Telegram Bot</span>',
        '<span class="text-[11px] text-brand-600 font-semibold mt-1 inline-block">${filteredTxs.filter(t=>t.type===\'expense\').length} Transaksi Terfilter</span>'
    )

    # Replace hardcoded Category Breakdown in Beranda with dynamic renderCategoryBreakdown(filteredTxs)
    old_category_box = '''          <!-- Kategori Breakdown -->
          <div class="lg:col-span-5 bg-white p-6 rounded-2xl border border-rose-100 shadow-sm space-y-4">
            <h3 class="font-bold text-slate-800 text-sm">Pengeluaran per Kategori</h3>
            <div class="space-y-3 pt-2 text-xs">
              <div>
                <div class="flex justify-between font-medium text-slate-700 mb-1">
                  <span>🍜 Makanan & Minuman</span>
                  <span class="font-bold text-brand-600">Rp1.420.000 (38%)</span>
                </div>
                <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div class="bg-brand-500 h-full rounded-full" style="width: 38%"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between font-medium text-slate-700 mb-1">
                  <span>🛒 Belanja Kebutuhan</span>
                  <span class="font-bold text-brand-600">Rp1.250.000 (33%)</span>
                </div>
                <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div class="bg-brand-400 h-full rounded-full" style="width: 33%"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between font-medium text-slate-700 mb-1">
                  <span>🏠 Tagihan & Utilitas</span>
                  <span class="font-bold text-brand-600">Rp1.100.000 (29%)</span>
                </div>
                <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div class="bg-brand-600 h-full rounded-full" style="width: 29%"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between font-medium text-slate-700 mb-1">
                  <span>🚗 Transportasi</span>
                  <span class="font-bold text-brand-600">Rp450.000 (12%)</span>
                </div>
                <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div class="bg-rose-300 h-full rounded-full" style="width: 12%"></div>
                </div>
              </div>
            </div>
          </div>'''

    new_category_box = '''          <!-- Kategori Breakdown Dinamis -->
          <div class="lg:col-span-5 bg-white p-6 rounded-2xl border border-rose-100 shadow-sm space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-slate-800 text-sm">Pengeluaran per Kategori</h3>
              <span class="text-[10px] text-brand-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full">${rangeShort}</span>
            </div>
            <div class="space-y-3 pt-2 text-xs">
              ${renderCategoryBreakdown(filteredTxs)}
            </div>
          </div>'''
    content = content.replace(old_category_box, new_category_box)

    # Recent Transactions Table in Beranda
    old_recent_tx = '''        <!-- RECENT TRANSACTIONS TABLE -->
        <div class="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-slate-800 text-sm">10 Transaksi Terbaru</h3>
            <button onclick="switchDashboardTab('transaksi')" class="text-xs text-brand-600 font-semibold hover:underline">Lihat Semua →</button>
          </div>
          ${renderTransactionsTable(AppState.transactions.slice(0, 10))}
        </div>'''

    new_recent_tx = '''        <!-- RECENT TRANSACTIONS TABLE -->
        <div class="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-bold text-slate-800 text-sm">Transaksi Periode ${rangeShort} (${filteredTxs.length})</h3>
              <p class="text-[11px] text-slate-400">Rentang: ${getDateRangeLabel(AppState.dateRange)}</p>
            </div>
            <button onclick="switchDashboardTab('transaksi')" class="text-xs text-brand-600 font-semibold hover:underline">Lihat Semua →</button>
          </div>
          ${renderTransactionsTable(filteredTxs.slice(0, 10))}
        </div>'''
    content = content.replace(old_recent_tx, new_recent_tx)

    # =========================================================================
    # 5. UPDATE renderTransaksiTab() WITH getFilteredTransactions()
    # =========================================================================
    old_tx_tab = '''    // --- TAB 2: TRANSAKSI ---
    function renderTransaksiTab() {
      return `
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center space-x-2 text-xs">
            <input id="tx-search-input" oninput="filterTransactions()" type="text" placeholder="Cari catatan transaksi..." class="border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-500 text-xs w-64">
            <select id="tx-category-filter" onchange="filterTransactions()" class="border border-slate-200 rounded-xl px-3 py-2 outline-none text-xs">
              <option value="all">Semua Kategori</option>
              <option value="🍜 Makanan & Minuman">🍜 Makanan & Minuman</option>
              <option value="🚗 Transportasi">🚗 Transportasi</option>
              <option value="🛒 Belanja Kebutuhan">🛒 Belanja Kebutuhan</option>
              <option value="🏠 Tagihan & Utilitas">🏠 Tagihan & Utilitas</option>
              <option value="🎮 Hiburan & Kopi">🎮 Hiburan & Kopi</option>
            </select>
          </div>
          <button onclick="openModal('add-tx-modal')" class="px-4 py-2 bg-brand-500 text-white rounded-xl text-xs font-bold shadow hover:bg-brand-600 transition">
            + Tambah Transaksi
          </button>
        </div>

        <div id="tx-table-container" class="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden p-6">
          ${renderTransactionsTable(AppState.transactions)}
        </div>
      </div>
      `;
    }

    function filterTransactions() {
      const q = document.getElementById('tx-search-input')?.value.toLowerCase() || '';
      const cat = document.getElementById('tx-category-filter')?.value || 'all';

      const filtered = AppState.transactions.filter(t => {
        const matchQ = (t.notes || '').toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q);
        const matchCat = cat === 'all' || t.category === cat;
        return matchQ && matchCat;
      });

      const container = document.getElementById('tx-table-container');
      if (container) {
        container.innerHTML = renderTransactionsTable(filtered);
      }
    }'''

    new_tx_tab = '''    // --- TAB 2: TRANSAKSI ---
    function renderTransaksiTab() {
      const filtered = getFilteredTransactions();
      const rangeShort = getDateRangeShortName(AppState.dateRange);
      return `
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 class="font-bold text-slate-900 text-base">Riwayat Transaksi (${filtered.length})</h3>
            <p class="text-xs text-slate-500 mt-0.5">Filter Aktif: <strong>${getDateRangeLabel(AppState.dateRange)}</strong></p>
          </div>
          <div class="flex items-center space-x-2 text-xs">
            <input id="tx-search-input" oninput="filterTransactions()" type="text" placeholder="Cari catatan / kategori..." class="border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-brand-500 text-xs w-56">
            <select id="tx-category-filter" onchange="filterTransactions()" class="border border-slate-200 rounded-xl px-3 py-2 outline-none text-xs">
              <option value="all">Semua Kategori</option>
              <option value="🍜 Makanan & Minuman">🍜 Makanan & Minuman</option>
              <option value="🚗 Transportasi">🚗 Transportasi</option>
              <option value="🛒 Belanja Kebutuhan">🛒 Belanja Kebutuhan</option>
              <option value="🏠 Tagihan & Utilitas">🏠 Tagihan & Utilitas</option>
              <option value="🎮 Hiburan & Kopi">🎮 Hiburan & Kopi</option>
            </select>
            <button onclick="openModal('add-tx-modal')" class="px-4 py-2 bg-brand-500 text-white rounded-xl text-xs font-bold shadow hover:bg-brand-600 transition whitespace-nowrap">
              + Tambah Transaksi
            </button>
          </div>
        </div>

        <div id="tx-table-container" class="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden p-6">
          ${renderTransactionsTable(filtered)}
        </div>
      </div>
      `;
    }

    function filterTransactions() {
      const q = document.getElementById('tx-search-input')?.value.toLowerCase() || '';
      const cat = document.getElementById('tx-category-filter')?.value || 'all';

      const baseList = getFilteredTransactions();
      const filtered = baseList.filter(t => {
        const matchQ = (t.notes || '').toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q) || (t.wallet || '').toLowerCase().includes(q);
        const matchCat = cat === 'all' || t.category === cat;
        return matchQ && matchCat;
      });

      const container = document.getElementById('tx-table-container');
      if (container) {
        container.innerHTML = renderTransactionsTable(filtered);
      }
    }'''
    content = content.replace(old_tx_tab, new_tx_tab)

    # =========================================================================
    # 6. UPDATE renderLaporanTab() WITH getFilteredTransactions()
    # =========================================================================
    old_laporan_start = '''    // --- TAB 3: LAPORAN & EXPORT ---
    function renderLaporanTab() {
      const isStarter = AppState.user.plan === 'starter';
      const totalIncome = AppState.transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const totalExpense = AppState.transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
      const netSurplus = totalIncome - totalExpense;

      const expenseByCategory = {};
      AppState.transactions.filter(t => t.type === 'expense').forEach(t => {
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
      });'''

    new_laporan_start = '''    // --- TAB 3: LAPORAN & EXPORT ---
    function renderLaporanTab() {
      const isStarter = AppState.user.plan === 'starter';
      const filteredTxs = getFilteredTransactions();
      const totalIncome = filteredTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const totalExpense = filteredTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
      const netSurplus = totalIncome - totalExpense;

      const expenseByCategory = {};
      filteredTxs.filter(t => t.type === 'expense').forEach(t => {
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
      });'''
    content = content.replace(old_laporan_start, new_laporan_start)

    content = content.replace(
        '<p class="text-xs text-slate-500 mt-0.5">Laporan akun <strong>${AppState.user.name}</strong> • Realtime Supabase WIB</p>',
        '<p class="text-xs text-slate-500 mt-0.5">Laporan akun <strong>${AppState.user.name}</strong> • Periode: <strong>${getDateRangeLabel(AppState.dateRange)}</strong></p>'
    )
    content = content.replace(
        '${renderTransactionsTable(AppState.transactions)}',
        '${renderTransactionsTable(filteredTxs)}'
    )

    # =========================================================================
    # 7. TELEGRAM CHAT BOT: MULTI-WALLET SELECTION BUTTONS ("semua rekening bisa dipakai")
    # =========================================================================
    wallet_selection_helpers = '''
    // =========================================================================
    // TELEGRAM BOT MULTI-WALLET HELPERS (BCA, GOPAY, MANDIRI, CASH, DLL)
    // =========================================================================
    function buildWalletSelectionButtons(currentWalletName, txId) {
      const activeWallets = AppState.wallets.filter(w => !w.isArchived);
      const buttons = [];

      activeWallets.forEach(w => {
        const isCurrent = (w.name === currentWalletName);
        const icon = w.type === 'bank' ? '🏦' : w.type === 'ewallet' ? '📱' : '💵';
        const label = isCurrent ? `✓ ${icon} ${w.name}` : `${icon} ${w.name}`;
        buttons.push({
          label: label,
          action: `changeTxWallet('${w.name}', '${txId}')`,
          isCurrent: isCurrent
        });
      });

      // Tombol Hapus Transaksi
      buttons.push({
        label: '🗑️ Hapus Transaksi',
        action: `deleteLatestTx('${txId}')`,
        isCurrent: false
      });

      return buttons;
    }
'''

    if 'function buildWalletSelectionButtons(' not in content:
        content = content.replace('function changeTxWallet(newWallet) {', wallet_selection_helpers + '\n    function changeTxWallet(newWallet) {')

    # Update appendChatMessage to format active buttons with highlight
    old_append_btn = '''        if (inlineButtons && inlineButtons.length > 0) {
          buttonsHtml = `
            <div class="mt-2.5 pt-2 border-t border-slate-200 flex flex-wrap gap-1.5">
              ${inlineButtons.map(btn => `
                <button onclick="${btn.action}" class="bg-slate-100 hover:bg-rose-50 hover:text-brand-600 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 transition">
                  ${btn.label}
                </button>
              `).join('')}
            </div>
          `;
        }'''

    new_append_btn = '''        if (inlineButtons && inlineButtons.length > 0) {
          buttonsHtml = `
            <div class="mt-2.5 pt-2 border-t border-slate-200">
              <span class="text-[9px] text-slate-400 font-sans block mb-1">Pilih Rekening Sumber Pengeluaran:</span>
              <div class="flex flex-wrap gap-1.5">
                ${inlineButtons.map(btn => `
                  <button onclick="${btn.action}" class="${btn.isCurrent ? 'bg-brand-500 text-white border-brand-600 shadow-xs' : 'bg-slate-100 hover:bg-rose-50 hover:text-brand-600 text-slate-700'} text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 transition">
                    ${btn.label}
                  </button>
                `).join('')}
              </div>
            </div>
          `;
        }'''
    content = content.replace(old_append_btn, new_append_btn)

    # Update handleBotResponse for expense branch to generate buttons for ALL wallets
    old_bot_expense_handling = '''        const updatedJatah = getTataJatahState();
        const otherWallets = AppState.wallets.filter(w => w.name !== (targetWallet ? targetWallet.name : ''));
        const switchBtnWallet = otherWallets.length > 0 ? otherWallets[0].name : 'GoPay';

        const reply = `📅 ${dateStr}\\n💸 Pengeluaran tercatat!\\n├ Nominal : ${formatIDR(amount)}\\n├ Kategori : 🍜 Makanan & Minuman\\n├ Dompet : 👛 ${targetWallet ? targetWallet.name : 'Dompet Utama'}\\n├ Catatan : ${text}\\n└ Saldo : ${formatIDR(targetWallet ? targetWallet.balance : 0)}\\n\\n🎯 Sisa jatah hari ini: ${formatIDR(updatedJatah.remainingToday)}`;

        const buttons = [
          { label: `🔄 Ganti ke ${switchBtnWallet}`, action: `changeTxWallet('${switchBtnWallet}')` },
          { label: '🗑️ Hapus Transaksi', action: 'deleteLatestTx()' }
        ];

        appendChatMessage('bot', reply, buttons);'''

    new_bot_expense_handling = '''        const updatedJatah = getTataJatahState();
        const txWalletName = targetWallet ? targetWallet.name : 'BCA Utama';

        const reply = `📅 ${dateStr}\\n💸 Pengeluaran tercatat!\\n├ Nominal : ${formatIDR(amount)}\\n├ Kategori : 🍜 Makanan & Minuman\\n├ Rekening Terpilih : 👛 ${txWalletName}\\n├ Catatan : ${text}\\n└ Sisa Saldo ${txWalletName} : ${formatIDR(targetWallet ? targetWallet.balance : 0)}\\n\\n🎯 Sisa jatah hari ini: ${formatIDR(updatedJatah.remainingToday)}\\n\\n💳 Rekening mana yang mau dipakai? Klik tombol di bawah:`;

        const buttons = buildWalletSelectionButtons(txWalletName, newTx.id);
        appendChatMessage('bot', reply, buttons);'''
    content = content.replace(old_bot_expense_handling, new_bot_expense_handling)

    # Update changeTxWallet function to support txId and all wallets switching
    old_change_tx = '''    function changeTxWallet(newWallet) {
      if (AppState.transactions.length > 0) {
        const tx = AppState.transactions[0];
        const oldWalletName = tx.wallet;
        const oldW = AppState.wallets.find(w => w.name === oldWalletName);
        const newW = AppState.wallets.find(w => w.name === newWallet);

        if (oldW && newW) {
          if (tx.type === 'expense') {
            oldW.balance += tx.amount;
            newW.balance -= tx.amount;
          } else if (tx.type === 'income') {
            oldW.balance -= tx.amount;
            newW.balance += tx.amount;
          }
        }
        tx.wallet = newWallet;
        saveCurrentUserData();
        appendChatMessage('bot', `🔄 Dompet berhasil dialihkan ke: 👛 ${newWallet}\\nSaldo ${newWallet} kini: ${formatIDR(newW ? newW.balance : 0)}`);
        if (AppState.currentPage === 'dashboard') renderApp();
      }
    }'''

    new_change_tx = '''    function changeTxWallet(newWallet, txId) {
      let tx = null;
      if (txId) {
        tx = AppState.transactions.find(t => t.id === txId);
      }
      if (!tx && AppState.transactions.length > 0) {
        tx = AppState.transactions[0];
      }
      if (!tx) {
        appendChatMessage('bot', '⚠️ Transaksi tidak ditemukan.');
        return;
      }

      if (tx.wallet === newWallet) {
        appendChatMessage('bot', `ℹ️ Transaksi ini sudah menggunakan rekening 👛 ${newWallet}.`);
        return;
      }

      const oldWalletName = tx.wallet;
      const oldW = AppState.wallets.find(w => w.name === oldWalletName);
      const newW = AppState.wallets.find(w => w.name === newWallet);

      if (!newW) {
        appendChatMessage('bot', `⚠️ Rekening ${newWallet} tidak ditemukan.`);
        return;
      }

      // Rollback old balance and charge new balance
      if (oldW) {
        if (tx.type === 'expense') oldW.balance += tx.amount;
        else if (tx.type === 'income') oldW.balance -= tx.amount;
      }
      if (tx.type === 'expense') newW.balance -= tx.amount;
      else if (tx.type === 'income') newW.balance += tx.amount;

      tx.wallet = newWallet;
      saveCurrentUserData();

      const iconOld = oldW ? (oldW.type === 'bank' ? '🏦' : oldW.type === 'ewallet' ? '📱' : '💵') : '👛';
      const iconNew = newW.type === 'bank' ? '🏦' : newW.type === 'ewallet' ? '📱' : '💵';

      const reply = `🔄 Rekening sumber berhasil dialihkan!\\n├ Transaksi : ${tx.notes || tx.category} (${formatIDR(tx.amount)})\\n├ Rekening Lama : ${iconOld} ${oldWalletName} (Saldo: ${formatIDR(oldW ? oldW.balance : 0)})\\n└ Rekening Baru : ${iconNew} ${newWallet} (Saldo: ${formatIDR(newW.balance)})\\n\\n💡 Rekening aktif saat ini: ${newWallet}`;

      const buttons = buildWalletSelectionButtons(newWallet, tx.id);
      appendChatMessage('bot', reply, buttons);

      if (AppState.currentPage === 'dashboard') renderApp();
    }'''
    content = content.replace(old_change_tx, new_change_tx)

    # Update deleteLatestTx function
    old_delete_tx = '''    function deleteLatestTx() {
      if (AppState.transactions.length > 0) {
        const removed = AppState.transactions.shift();
        const w = AppState.wallets.find(x => x.name === removed.wallet);
        if (w) {
          if (removed.type === 'expense') w.balance += removed.amount;
          else if (removed.type === 'income') w.balance -= removed.amount;
        }
        saveCurrentUserData();
        appendChatMessage('bot', `🗑️ Transaksi '${removed.notes || removed.category}' berhasil dibatalkan dan saldo dikembalikan.`);
        if (AppState.currentPage === 'dashboard') renderApp();
      }
    }'''

    new_delete_tx = '''    function deleteLatestTx(txId) {
      let idx = -1;
      if (txId) {
        idx = AppState.transactions.findIndex(t => t.id === txId);
      } else if (AppState.transactions.length > 0) {
        idx = 0;
      }
      if (idx === -1) {
        appendChatMessage('bot', '⚠️ Transaksi tidak ditemukan atau sudah dihapus.');
        return;
      }

      const removed = AppState.transactions.splice(idx, 1)[0];
      const w = AppState.wallets.find(x => x.name === removed.wallet);
      if (w) {
        if (removed.type === 'expense') w.balance += removed.amount;
        else if (removed.type === 'income') w.balance -= removed.amount;
      }
      saveCurrentUserData();
      appendChatMessage('bot', `🗑️ Transaksi '${removed.notes || removed.category}' sebesar ${formatIDR(removed.amount)} berhasil dihapus dan saldo ${removed.wallet} telah dikembalikan.`);
      if (AppState.currentPage === 'dashboard') renderApp();
    }'''
    content = content.replace(old_delete_tx, new_delete_tx)

    # Also update simulateReceiptPhoto & simulateVoiceNote to provide wallet selection buttons!
    content = content.replace(
        "appendChatMessage('bot', reply);\n        if (AppState.currentPage === 'dashboard') renderApp();",
        "const buttons = buildWalletSelectionButtons(defaultWallet ? defaultWallet.name : 'BCA Utama', AppState.transactions[0].id);\n        appendChatMessage('bot', reply, buttons);\n        if (AppState.currentPage === 'dashboard') renderApp();"
    )

    with open(INDEX_PATH, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Patch applied successfully! New file size: {len(content)}")

if __name__ == '__main__':
    main()
