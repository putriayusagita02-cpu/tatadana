# -*- coding: utf-8 -*-
"""
Patch public/index.html to fix Budget Bulanan:
1. getCategorySpentThisMonth helper function that dynamically calculates current month's expenses per category
2. Full interactive renderBudgetTab() with summary overview cards, active budget progress bars, alert badges (80% & 100%), and unbudgeted categories list
3. Interactive #set-budget-modal with category selector, limit input, quick presets, real-time preview, and delete limit action
4. Telegram Bot /budget command and auto budget alerts (80% and 100%)
"""

import sys
import re

INDEX_PATH = r"C:\Users\Asus\.gemini\antigravity\scratch\tatadana\public\index.html"

def main():
    with open(INDEX_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    print(f"Read {len(content)} characters from {INDEX_PATH}")

    # =========================================================================
    # 1. ADD SET BUDGET MODAL HTML right after add-tx-modal
    # =========================================================================
    set_budget_modal_html = '''
  <!-- MODAL SET BUDGET BULANAN -->
  <div id="set-budget-modal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm hidden flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-rose-100 overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="bg-gradient-to-r from-brand-600 via-rose-500 to-pink-500 px-6 py-4 flex items-center justify-between text-white shadow-md">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xl shadow-sm">🎯</div>
          <div>
            <h3 class="font-bold text-base">Atur Budget Bulanan</h3>
            <p class="text-xs text-rose-100">Pasang target limit belanja per kategori per bulan</p>
          </div>
        </div>
        <button onclick="closeSetBudgetModal()" class="text-white/80 hover:text-white text-xl font-bold transition">✕</button>
      </div>

      <!-- Form Body -->
      <form id="set-budget-form" onsubmit="handleSaveBudget(event)" class="p-6 space-y-4 text-xs">
        <div>
          <label class="block font-bold text-slate-700 mb-1">Pilih Kategori Pengeluaran</label>
          <select id="budget-cat-select" onchange="onBudgetCategoryChange()" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-semibold text-slate-800 outline-none focus:border-brand-500 focus:bg-white transition">
            <!-- Populated dynamically -->
          </select>
        </div>

        <div>
          <div class="flex justify-between items-center mb-1">
            <label class="block font-bold text-slate-700">Limit Budget Bulanan (Rp)</label>
            <span id="budget-current-spent-info" class="text-[10px] text-slate-500 font-medium">Terpakai bulan ini: Rp0</span>
          </div>
          <input id="budget-amount-input" oninput="updateBudgetPreview()" type="number" min="0" step="10000" placeholder="Contoh: 1500000" required class="w-full text-base font-bold text-brand-600 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition">
        </div>

        <!-- Quick Preset Buttons -->
        <div>
          <span class="text-[10px] text-slate-400 block mb-1.5 font-semibold">Pilihan Cepat Limit:</span>
          <div class="flex flex-wrap gap-1.5">
            <button type="button" onclick="setBudgetPreset(250000)" class="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 hover:text-brand-600 text-slate-700 rounded-lg font-bold text-[10px] transition">250rb</button>
            <button type="button" onclick="setBudgetPreset(500000)" class="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 hover:text-brand-600 text-slate-700 rounded-lg font-bold text-[10px] transition">500rb</button>
            <button type="button" onclick="setBudgetPreset(1000000)" class="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 hover:text-brand-600 text-slate-700 rounded-lg font-bold text-[10px] transition">1 Juta</button>
            <button type="button" onclick="setBudgetPreset(1500000)" class="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 hover:text-brand-600 text-slate-700 rounded-lg font-bold text-[10px] transition">1.5 Juta</button>
            <button type="button" onclick="setBudgetPreset(2000000)" class="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 hover:text-brand-600 text-slate-700 rounded-lg font-bold text-[10px] transition">2 Juta</button>
            <button type="button" onclick="setBudgetPreset(3000000)" class="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 hover:text-brand-600 text-slate-700 rounded-lg font-bold text-[10px] transition">3 Juta</button>
          </div>
        </div>

        <!-- Preview Box -->
        <div id="budget-preview-box" class="p-3 bg-rose-50/60 rounded-xl border border-rose-100 space-y-1 text-[11px]">
          <div class="flex justify-between font-semibold">
            <span class="text-slate-600">Simulasi Pemakaian:</span>
            <span id="budget-preview-pct" class="font-bold text-brand-600">0%</span>
          </div>
          <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div id="budget-preview-bar" class="bg-brand-500 h-full rounded-full transition-all duration-300" style="width: 0%"></div>
          </div>
          <div class="flex justify-between text-[10px] text-slate-500 pt-0.5">
            <span id="budget-preview-status">🟢 Status: Aman</span>
            <span id="budget-preview-remaining">Sisa: Rp0</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="pt-2 flex items-center justify-between gap-2">
          <button type="button" onclick="handleRemoveBudget()" id="budget-remove-btn" class="px-3.5 py-2.5 text-rose-600 hover:bg-rose-50 font-bold rounded-xl border border-rose-200 transition">
            Hapus Limit
          </button>
          <div class="flex items-center gap-2">
            <button type="button" onclick="closeSetBudgetModal()" class="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition">
              Batal
            </button>
            <button type="submit" class="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-md transition">
              Simpan Budget
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
'''

    if 'id="set-budget-modal"' not in content:
        content = content.replace('<!-- MODAL TRANSAKSI BARU (WEB DASHBOARD) -->', set_budget_modal_html + '\n  <!-- MODAL TRANSAKSI BARU (WEB DASHBOARD) -->')

    # =========================================================================
    # 2. ADD HELPER getCategorySpentThisMonth & BUDGET MODAL HANDLERS
    # =========================================================================
    budget_helpers = '''
    // =========================================================================
    // DYNAMIC BUDGET BULANAN ENGINE & HANDLERS
    // =========================================================================
    function getCategorySpentThisMonth(categoryNameOrObj) {
      if (!categoryNameOrObj) return 0;
      const name = typeof categoryNameOrObj === 'string' ? categoryNameOrObj : categoryNameOrObj.name;
      const emoji = typeof categoryNameOrObj === 'object' && categoryNameOrObj.emoji ? categoryNameOrObj.emoji : '';

      const now = getWIBDate();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      return AppState.transactions.filter(t => {
        if (t.type !== 'expense') return false;
        const d = parseTxDate(t);
        const inMonth = d ? (d.getMonth() === currentMonth && d.getFullYear() === currentYear) : true;
        if (!inMonth) return false;

        const tCat = (t.category || '').toLowerCase();
        const cName = (name || '').toLowerCase();
        return tCat === cName || tCat.includes(cName) || (emoji && tCat.includes(emoji));
      }).reduce((sum, t) => sum + t.amount, 0);
    }

    function openSetBudgetModal(preselectedCatId) {
      const modal = document.getElementById('set-budget-modal');
      const select = document.getElementById('budget-cat-select');
      if (!modal || !select) return;

      const expenseCats = AppState.categories.filter(c => c.type === 'expense');
      select.innerHTML = expenseCats.map(c => {
        const spent = getCategorySpentThisMonth(c);
        const curLimit = c.budget > 0 ? ` (Limit: ${formatIDR(c.budget)})` : ' (Belum ada limit)';
        return `<option value="${c.id}">${c.emoji || '📁'} ${c.name}${curLimit}</option>`;
      }).join('');

      if (preselectedCatId) {
        select.value = preselectedCatId;
      }

      onBudgetCategoryChange();
      modal.classList.remove('hidden');
    }

    function closeSetBudgetModal() {
      const modal = document.getElementById('set-budget-modal');
      if (modal) modal.classList.add('hidden');
    }

    function onBudgetCategoryChange() {
      const select = document.getElementById('budget-cat-select');
      const input = document.getElementById('budget-amount-input');
      const spentInfo = document.getElementById('budget-current-spent-info');
      const removeBtn = document.getElementById('budget-remove-btn');
      if (!select) return;

      const cat = AppState.categories.find(c => c.id === select.value);
      if (!cat) return;

      const spent = getCategorySpentThisMonth(cat);
      if (spentInfo) spentInfo.innerText = `Terpakai bulan ini: ${formatIDR(spent)}`;

      if (input) {
        input.value = cat.budget > 0 ? cat.budget : '';
      }

      if (removeBtn) {
        removeBtn.style.display = cat.budget > 0 ? 'inline-block' : 'none';
      }

      updateBudgetPreview();
    }

    function setBudgetPreset(amt) {
      const input = document.getElementById('budget-amount-input');
      if (input) {
        input.value = amt;
        updateBudgetPreview();
      }
    }

    function updateBudgetPreview() {
      const select = document.getElementById('budget-cat-select');
      const input = document.getElementById('budget-amount-input');
      const pctEl = document.getElementById('budget-preview-pct');
      const barEl = document.getElementById('budget-preview-bar');
      const statusEl = document.getElementById('budget-preview-status');
      const remainingEl = document.getElementById('budget-preview-remaining');
      if (!select || !input) return;

      const cat = AppState.categories.find(c => c.id === select.value);
      const spent = cat ? getCategorySpentThisMonth(cat) : 0;
      const budgetLimit = parseFloat(input.value) || 0;

      let pct = 0;
      if (budgetLimit > 0) {
        pct = Math.round((spent / budgetLimit) * 100);
      }

      if (pctEl) pctEl.innerText = `${pct}%`;
      if (barEl) {
        barEl.style.width = `${Math.min(100, pct)}%`;
        barEl.className = pct >= 100 ? 'bg-rose-600 h-full rounded-full transition-all duration-300' :
                          pct >= 80 ? 'bg-amber-500 h-full rounded-full transition-all duration-300' :
                          'bg-brand-500 h-full rounded-full transition-all duration-300';
      }

      const remaining = Math.max(0, budgetLimit - spent);
      if (remainingEl) remainingEl.innerText = `Sisa: ${formatIDR(remaining)}`;

      if (statusEl) {
        if (pct >= 100) {
          statusEl.innerText = '🔴 Status: Budget Penuh (≥100%)';
          statusEl.className = 'text-rose-600 font-bold';
        } else if (pct >= 80) {
          statusEl.innerText = '🟡 Status: Alert Waspada (≥80%)';
          statusEl.className = 'text-amber-600 font-bold';
        } else {
          statusEl.innerText = '🟢 Status: Aman Terkendali';
          statusEl.className = 'text-emerald-600 font-bold';
        }
      }
    }

    function handleSaveBudget(e) {
      if (e) e.preventDefault();
      const select = document.getElementById('budget-cat-select');
      const input = document.getElementById('budget-amount-input');
      if (!select || !input) return;

      const cat = AppState.categories.find(c => c.id === select.value);
      if (!cat) return;

      const newLimit = parseFloat(input.value) || 0;
      if (newLimit <= 0) {
        alert('Harap masukkan nominal limit budget yang valid!');
        return;
      }

      cat.budget = newLimit;
      saveCurrentUserData();
      closeSetBudgetModal();
      renderApp();
      alert(`Limit budget untuk ${cat.emoji || ''} ${cat.name} berhasil diatur sebesar ${formatIDR(newLimit)} / bulan!`);
    }

    function handleRemoveBudget() {
      const select = document.getElementById('budget-cat-select');
      if (!select) return;

      const cat = AppState.categories.find(c => c.id === select.value);
      if (!cat) return;

      if (confirm(`Hapus limit budget untuk kategori ${cat.name}?`)) {
        cat.budget = 0;
        saveCurrentUserData();
        closeSetBudgetModal();
        renderApp();
        alert(`Limit budget untuk ${cat.name} telah dinonaktifkan.`);
      }
    }
'''

    if 'function getCategorySpentThisMonth(' not in content:
        content = content.replace('function renderBudgetTab() {', budget_helpers + '\n    function renderBudgetTab() {')

    # =========================================================================
    # 3. REPLACE renderBudgetTab() WITH DYNAMIC IMPLEMENTATION
    # =========================================================================
    old_budget_tab_pattern = r"function renderBudgetTab\(\) \{[\s\S]*?function renderWalletTab\(\)"

    new_budget_tab = '''function renderBudgetTab() {
      const expenseCats = AppState.categories.filter(c => c.type === 'expense');
      const budgetedCats = expenseCats.filter(c => c.budget > 0);
      const unbudgetedCats = expenseCats.filter(c => !c.budget || c.budget === 0);

      const totalBudget = budgetedCats.reduce((sum, c) => sum + c.budget, 0);
      const totalSpent = budgetedCats.reduce((sum, c) => sum + getCategorySpentThisMonth(c), 0);
      const remainingTotal = Math.max(0, totalBudget - totalSpent);
      const overallPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
      const isOverallOver = overallPct >= 100;
      const isOverallAlert = overallPct >= 80 && overallPct < 100;

      return `
      <div class="space-y-6">
        <!-- Header & Action -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 class="font-bold text-slate-900 text-base">Budget Bulanan per Kategori</h3>
            <p class="text-xs text-slate-500 mt-0.5">Pantau realisasi belanja terhadap target limit bulanan. Alert 80% & 100% aktif via Telegram Bot.</p>
          </div>
          <button onclick="openSetBudgetModal()" class="px-4 py-2.5 bg-brand-500 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/25 hover:bg-brand-600 transition flex items-center gap-1.5 self-start sm:self-auto">
            <span>+</span>
            <span>Atur Limit Budget</span>
          </button>
        </div>

        <!-- SUMMARY OVERVIEW CARDS -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm space-y-1">
            <span class="text-xs text-slate-500 font-semibold">Total Budget Terpasang</span>
            <p class="text-2xl font-black text-slate-900 mt-1">${formatIDR(totalBudget)}</p>
            <span class="text-[11px] text-slate-400 font-medium">${budgetedCats.length} Kategori Dibatasi</span>
          </div>
          <div class="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm space-y-1">
            <span class="text-xs text-slate-500 font-semibold">Realisasi Belanja Bulan Ini</span>
            <p class="text-2xl font-black text-brand-600 mt-1">${formatIDR(totalSpent)}</p>
            <span class="text-[11px] font-bold ${isOverallOver ? 'text-rose-600' : isOverallAlert ? 'text-amber-600' : 'text-emerald-600'}">
              ${overallPct}% Terpakai
            </span>
          </div>
          <div class="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm space-y-1">
            <span class="text-xs text-slate-500 font-semibold">Sisa Kuota Budget</span>
            <p class="text-2xl font-black ${remainingTotal > 0 ? 'text-emerald-600' : 'text-rose-600'} mt-1">${formatIDR(remainingTotal)}</p>
            <span class="text-[11px] text-slate-400 font-medium">${remainingTotal > 0 ? 'Tersedia aman' : 'Melebihi limit'}</span>
          </div>
          <div class="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm space-y-1">
            <span class="text-xs text-slate-500 font-semibold">Status Disiplin Budget</span>
            <div class="mt-1">
              <span class="inline-block text-xs font-bold px-2.5 py-1 rounded-full ${isOverallOver ? 'bg-rose-50 text-rose-600 border border-rose-200' : isOverallAlert ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}">
                ${isOverallOver ? '🔴 Melebihi Budget' : isOverallAlert ? '🟡 Waspada (≥80%)' : '🟢 Aman Terkendali'}
              </span>
            </div>
            <span class="text-[10px] text-slate-400 block pt-0.5">Tersinkron bot real-time</span>
          </div>
        </div>

        <!-- BUDGETED CATEGORIES GRID -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-bold text-slate-800 text-sm">Kategori dengan Limit Aktif (${budgetedCats.length})</h4>
          </div>

          ${budgetedCats.length === 0 ? `
            <div class="bg-white p-8 rounded-2xl border border-dashed border-rose-200 text-center space-y-2">
              <span class="text-3xl">🎯</span>
              <p class="text-xs text-slate-600 font-semibold">Belum ada limit budget yang diatur.</p>
              <p class="text-[11px] text-slate-400 max-w-sm mx-auto">Pasang target batas pengeluaran untuk kategori favoritmu agar bot Telegram dapat memberikan peringatan dini.</p>
              <button onclick="openSetBudgetModal()" class="mt-2 px-4 py-2 bg-brand-500 text-white rounded-xl text-xs font-bold hover:bg-brand-600 transition shadow-sm">
                + Pasang Limit Budget Sekarang
              </button>
            </div>
          ` : `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${budgetedCats.map(cat => {
                const spent = getCategorySpentThisMonth(cat);
                const pct = Math.round((spent / cat.budget) * 100);
                const isAlert80 = pct >= 80 && pct < 100;
                const isAlert100 = pct >= 100;
                const remaining = Math.max(0, cat.budget - spent);

                return `
                <div class="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm space-y-3 transition hover:shadow-md">
                  <div class="flex items-start justify-between">
                    <div class="flex items-center space-x-2.5">
                      <span class="text-2xl">${cat.emoji || '📁'}</span>
                      <div>
                        <h4 class="font-bold text-slate-800 text-xs">${cat.name}</h4>
                        <p class="text-[10px] text-slate-400">Limit: <strong class="text-slate-700">${formatIDR(cat.budget)}</strong> / bulan</p>
                      </div>
                    </div>
                    <div class="flex items-center space-x-2">
                      <div class="text-right">
                        <span class="text-xs font-black ${isAlert100 ? 'text-rose-600' : isAlert80 ? 'text-amber-600' : 'text-slate-800'}">${pct}%</span>
                        ${isAlert100 ? `<span class="block text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">Penuh (≥100%)</span>` : ''}
                        ${isAlert80 ? `<span class="block text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Alert (≥80%)</span>` : ''}
                      </div>
                      <button onclick="openSetBudgetModal('${cat.id}')" class="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-rose-50 rounded-lg transition" title="Edit Limit">
                        ✏️
                      </button>
                    </div>
                  </div>

                  <!-- Progress Bar -->
                  <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-500 ${isAlert100 ? 'bg-rose-600' : isAlert80 ? 'bg-amber-500' : 'bg-brand-500'}" style="width: ${Math.min(100, pct)}%"></div>
                  </div>

                  <div class="flex justify-between items-center text-[11px] text-slate-500 pt-1 border-t border-slate-50">
                    <span>Terpakai: <strong class="text-slate-700">${formatIDR(spent)}</strong></span>
                    <span>Sisa: <strong class="${remaining > 0 ? 'text-emerald-600' : 'text-rose-600'}">${formatIDR(remaining)}</strong></span>
                  </div>
                </div>
                `;
              }).join('')}
            </div>
          `}
        </div>

        <!-- UNBUDGETED CATEGORIES -->
        ${unbudgetedCats.length > 0 ? `
          <div class="pt-4 border-t border-slate-100">
            <h4 class="font-bold text-slate-800 text-xs mb-3 flex items-center gap-1.5">
              <span>💡</span>
              <span>Kategori Lainnya (Belum Ada Limit):</span>
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              ${unbudgetedCats.map(cat => {
                const spent = getCategorySpentThisMonth(cat);
                return `
                <div class="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                  <div class="flex items-center space-x-2">
                    <span class="text-lg">${cat.emoji || '📁'}</span>
                    <div>
                      <span class="font-bold text-slate-800 text-xs block">${cat.name}</span>
                      <span class="text-[10px] text-slate-400">Terpakai: ${formatIDR(spent)}</span>
                    </div>
                  </div>
                  <button onclick="openSetBudgetModal('${cat.id}')" class="px-2.5 py-1 bg-white hover:bg-rose-50 hover:text-brand-600 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold transition shadow-2xs">
                    + Pasang
                  </button>
                </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

      </div>
      `;
    }

    function renderWalletTab()'''

    content = re.sub(old_budget_tab_pattern, new_budget_tab, content, count=1)

    # =========================================================================
    # 4. UPDATE TELEGRAM BOT /budget COMMAND IN handleBotResponse
    # =========================================================================
    old_bot_budget_block = '''      if (lower === '/budget') {
        const lines = AppState.categories.filter(c => c.budget > 0).map(c => {
          const spent = AppState.transactions.filter(t => t.type === 'expense' && t.category === c.name).reduce((sum, t) => sum + t.amount, 0);
          const pct = Math.round((spent / c.budget) * 100);
          const bar = '█'.repeat(Math.min(10, Math.floor(pct / 10))) + '░'.repeat(Math.max(0, 10 - Math.floor(pct / 10)));
          return `${c.emoji} ${c.name}\\n${bar} ${pct}% (${formatIDR(spent)} / ${formatIDR(c.budget)})\\nSisa: ${formatIDR(Math.max(0, c.budget - spent))}`;
        });
        const msg = `🎯 Status Budget Bulan Ini (${AppState.user.name}):\\n\\n${lines.length > 0 ? lines.join('\\n\\n') : 'Belum ada budget terpasang.'}`;
        appendChatMessage('bot', msg);
        return;
      }'''

    new_bot_budget_block = '''      if (lower === '/budget') {
        const budgetedCats = AppState.categories.filter(c => c.budget > 0);
        if (budgetedCats.length === 0) {
          appendChatMessage('bot', `🎯 Status Budget (${AppState.user.name}):\\n\\nBelum ada budget bulanan yang diatur.\\nBuka tab 🎯 Budget di Dashboard untuk memasang target limit belanja!`);
          return;
        }

        const lines = budgetedCats.map(c => {
          const spent = getCategorySpentThisMonth(c);
          const pct = Math.round((spent / c.budget) * 100);
          const filled = Math.min(10, Math.floor(pct / 10));
          const empty = Math.max(0, 10 - filled);
          const bar = '█'.repeat(filled) + '░'.repeat(empty);
          const statusIcon = pct >= 100 ? '🔴 Over' : pct >= 80 ? '🟡 Waspada' : '🟢 Aman';
          return `${c.emoji || '📁'} ${c.name} [${statusIcon}]\\n${bar} ${pct}%\\n├ Terpakai : ${formatIDR(spent)}\\n├ Limit : ${formatIDR(c.budget)}\\n└ Sisa : ${formatIDR(Math.max(0, c.budget - spent))}`;
        });

        const totalB = budgetedCats.reduce((s, c) => s + c.budget, 0);
        const totalS = budgetedCats.reduce((s, c) => s + getCategorySpentThisMonth(c), 0);
        const msg = `🎯 Status Budget Bulanan (${AppState.user.name}):\\n\\n${lines.join('\\n\\n')}\\n\\n📊 Total Budget : ${formatIDR(totalB)}\\n💸 Total Terpakai : ${formatIDR(totalS)} (${totalB > 0 ? Math.round((totalS/totalB)*100) : 0}%)\\n💰 Sisa Kuota : ${formatIDR(Math.max(0, totalB - totalS))}`;
        appendChatMessage('bot', msg);
        return;
      }'''
    content = content.replace(old_bot_budget_block, new_bot_budget_block)

    # =========================================================================
    # 5. AUTO BUDGET ALERTS WHEN EXPENSE IS RECORDED IN BOT
    # =========================================================================
    old_bot_expense_reply = '''        const reply = `📅 ${dateStr}\\n💸 Pengeluaran tercatat!\\n├ Nominal : ${formatIDR(amount)}\\n├ Kategori : 🍜 Makanan & Minuman\\n├ Rekening Terpilih : 👛 ${txWalletName}\\n├ Catatan : ${text}\\n└ Sisa Saldo ${txWalletName} : ${formatIDR(targetWallet ? targetWallet.balance : 0)}\\n\\n🎯 Sisa jatah hari ini: ${formatIDR(updatedJatah.remainingToday)}\\n\\n💳 Rekening mana yang mau dipakai? Klik tombol di bawah:`;'''

    new_bot_expense_reply = '''        // Check if expense triggered 80% or 100% budget alert
        let budgetAlertText = '';
        const matchedCat = AppState.categories.find(c => c.type === 'expense' && (newTx.category.includes(c.name) || (c.emoji && newTx.category.includes(c.emoji))));
        if (matchedCat && matchedCat.budget > 0) {
          const catSpent = getCategorySpentThisMonth(matchedCat);
          const catPct = Math.round((catSpent / matchedCat.budget) * 100);
          if (catPct >= 100) {
            budgetAlertText = `\\n\\n🚨 ALERT BUDGET BULANAN (≥100%)!\\nPengeluaran untuk ${matchedCat.emoji || ''} ${matchedCat.name} telah mencapai ${catPct}% (${formatIDR(catSpent)} / ${formatIDR(matchedCat.budget)})! Kuota budget habis.`;
          } else if (catPct >= 80) {
            budgetAlertText = `\\n\\n⚠️ ALERT BUDGET BULANAN (≥80%)!\\nPengeluaran untuk ${matchedCat.emoji || ''} ${matchedCat.name} sudah mencapai ${catPct}% (${formatIDR(catSpent)} / ${formatIDR(matchedCat.budget)}). Sisa: ${formatIDR(Math.max(0, matchedCat.budget - catSpent))}.`;
          }
        }

        const reply = `📅 ${dateStr}\\n💸 Pengeluaran tercatat!\\n├ Nominal : ${formatIDR(amount)}\\n├ Kategori : ${newTx.category}\\n├ Rekening Terpilih : 👛 ${txWalletName}\\n├ Catatan : ${text}\\n└ Sisa Saldo ${txWalletName} : ${formatIDR(targetWallet ? targetWallet.balance : 0)}\\n\\n🎯 Sisa jatah hari ini: ${formatIDR(updatedJatah.remainingToday)}${budgetAlertText}\\n\\n💳 Rekening mana yang mau dipakai? Klik tombol di bawah:`;'''
    content = content.replace(old_bot_expense_reply, new_bot_expense_reply)

    with open(INDEX_PATH, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Patched successfully! New file length: {len(content)}")

if __name__ == '__main__':
    main()
