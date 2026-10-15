# -*- coding: utf-8 -*-
"""
Patch public/index.html to:
1. Fix hardcoded category in Telegram Chat Bot so transactions are NOT all Makanan & Minuman
2. Add smart natural language category detection (Transportasi, Belanja, Tagihan, Hiburan, Medis, Makanan)
3. Add interactive Category Selection Buttons in bot messages so user can switch categories on the fly
4. Implement changeTxCategory handler with real-time UI & budget re-rendering
"""

import sys
import re

INDEX_PATH = r"C:\Users\Asus\.gemini\antigravity\scratch\tatadana\public\index.html"

def main():
    with open(INDEX_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    print(f"Read {len(content)} characters from {INDEX_PATH}")

    # =========================================================================
    # 1. ADD detectCategoryFromText & changeTxCategory & buildBotTxActionButtons
    # =========================================================================
    cat_engine_js = '''
    // =========================================================================
    // SMART CATEGORY DETECTION & INTERACTIVE BOT CATEGORY PICKER
    // =========================================================================
    function detectCategoryFromText(text) {
      const t = text.toLowerCase();

      // 1. Transportasi
      const transportKw = ['bensin', 'pertalite', 'pertamax', 'solar', 'bbm', 'gojek', 'grab', 'maxim', 'ojol', 'taksi', 'taxi', 'parkir', 'tol', 'krl', 'mrt', 'kereta', 'busway', 'transjakarta', 'servis', 'tambal ban', 'oli', 'ongkir', 'transport'];
      if (transportKw.some(k => t.includes(k))) return '🚗 Transportasi';

      // 2. Tagihan & Utilitas
      const billKw = ['listrik', 'pln', 'token', 'air', 'pdam', 'wifi', 'internet', 'indihome', 'biznet', 'first media', 'pulsa', 'kuota', 'telkomsel', 'xl', 'indosat', 'kos', 'kost', 'kontrakan', 'sewa', 'bpjs', 'pbb', 'tagihan', 'cicilan', 'asuransi', 'pajak'];
      if (billKw.some(k => t.includes(k))) return '🏠 Tagihan & Utilitas';

      // 3. Belanja Kebutuhan
      const shopKw = ['belanja', 'indomaret', 'alfamart', 'supermarket', 'hypermart', 'transmart', 'sabun', 'shampo', 'odol', 'deterjen', 'minyak', 'beras', 'telur', 'pasar', 'sayur', 'bumbu', 'tisu', 'shopee', 'tokopedia', 'tiktok shop', 'lazada', 'baju', 'celana', 'sepatu', 'tas', 'skincare', 'makeup'];
      if (shopKw.some(k => t.includes(k))) return '🛒 Belanja Kebutuhan';

      // 4. Kesehatan & Medis
      const healthKw = ['obat', 'apotek', 'apotik', 'kimia farma', 'k24', 'dokter', 'rumah sakit', 'klinik', 'rs', 'vitamin', 'masker', 'panadol', 'paracetamol', 'bodrex', 'tolak angin', 'periksa', 'medis'];
      if (healthKw.some(k => t.includes(k))) return '💊 Kesehatan & Medis';

      // 5. Hiburan & Kopi
      const funKw = ['kopi', 'coffee', 'starbucks', 'kenangan', 'janji jiwa', 'cafe', 'kafe', 'nongkrong', 'nonton', 'bioskop', 'cinema', 'xxi', 'cgv', 'netflix', 'spotify', 'youtube', 'game', 'steam', 'topup', 'diamond', 'mlbb', 'pubg', 'jalan-jalan', 'liburan', 'karaoke'];
      if (funKw.some(k => t.includes(k))) return '🎮 Hiburan & Kopi';

      // 6. Makanan & Minuman
      const foodKw = ['makan', 'minum', 'sarapan', 'lunch', 'dinner', 'bakso', 'mie', 'nasi', 'ayam', 'sate', 'geprek', 'padang', 'warteg', 'snack', 'roti', 'kue', 'jajan', 'burger', 'pizza', 'mcd', 'kfc', 'hokben', 'resto', 'restoran', 'gofood', 'grabfood', 'shopeefood'];
      if (foodKw.some(k => t.includes(k))) return '🍜 Makanan & Minuman';

      // Fallback: match from AppState.categories
      for (const cat of AppState.categories) {
        if (cat.type === 'expense' && t.includes(cat.name.toLowerCase())) {
          return `${cat.emoji || '📁'} ${cat.name}`;
        }
      }

      return '🍜 Makanan & Minuman';
    }

    function buildBotTxActionButtons(currentWalletName, currentCategoryName, txId) {
      const activeWallets = AppState.wallets.filter(w => !w.isArchived);
      const expenseCats = AppState.categories.filter(c => c.type === 'expense');

      return {
        categories: expenseCats.map(c => {
          const fullName = `${c.emoji || '📁'} ${c.name}`;
          const isCurrent = (currentCategoryName === fullName || currentCategoryName === c.name || currentCategoryName.includes(c.name));
          return {
            label: `${c.emoji || ''} ${c.name}`,
            action: `changeTxCategory('${fullName}', '${txId}')`,
            isCurrent: isCurrent
          };
        }),
        wallets: activeWallets.map(w => {
          const isCurrent = (w.name === currentWalletName);
          const icon = w.type === 'bank' ? '🏦' : w.type === 'ewallet' ? '📱' : '💵';
          return {
            label: `${icon} ${w.name}`,
            action: `changeTxWallet('${w.name}', '${txId}')`,
            isCurrent: isCurrent
          };
        }),
        deleteBtn: {
          label: '🗑️ Hapus Transaksi',
          action: `deleteLatestTx('${txId}')`
        }
      };
    }

    function changeTxCategory(newCategoryName, txId) {
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

      if (tx.category === newCategoryName) {
        appendChatMessage('bot', `ℹ️ Transaksi ini sudah masuk dalam kategori ${newCategoryName}.`);
        return;
      }

      const oldCat = tx.category;
      tx.category = newCategoryName;
      saveCurrentUserData();

      // Check if new category has budget alert
      let budgetNote = '';
      const matchedCat = AppState.categories.find(c => c.type === 'expense' && (newCategoryName.includes(c.name) || (c.emoji && newCategoryName.includes(c.emoji))));
      if (matchedCat && matchedCat.budget > 0) {
        const spent = getCategorySpentThisMonth(matchedCat);
        const pct = Math.round((spent / matchedCat.budget) * 100);
        if (pct >= 100) {
          budgetNote = `\\n\\n🚨 ALERT BUDGET: Kuota kategori ${matchedCat.name} telah mencapai ${pct}% (${formatIDR(spent)} / ${formatIDR(matchedCat.budget)})!`;
        } else if (pct >= 80) {
          budgetNote = `\\n\\n⚠️ ALERT BUDGET: Kategori ${matchedCat.name} sudah terpakai ${pct}% (${formatIDR(spent)} / ${formatIDR(matchedCat.budget)}).`;
        }
      }

      const reply = `🏷️ Kategori transaksi berhasil diubah!\\n├ Transaksi : ${tx.notes || 'Pengeluaran'} (${formatIDR(tx.amount)})\\n├ Kategori Lama : ${oldCat}\\n└ Kategori Baru : ${newCategoryName}${budgetNote}\\n\\n💡 Status budget dan laporan langsung tersinkronkan.`;

      const actions = buildBotTxActionButtons(tx.wallet, newCategoryName, tx.id);
      appendChatMessage('bot', reply, actions);

      if (AppState.currentPage === 'dashboard') renderApp();
    }
'''

    if 'function detectCategoryFromText(' not in content:
        content = content.replace('function buildWalletSelectionButtons(', cat_engine_js + '\n    function buildWalletSelectionButtons(')

    # =========================================================================
    # 2. UPDATE appendChatMessage TO RENDER CATEGORIES + WALLETS BUTTON GROUPS
    # =========================================================================
    old_append_logic = '''        if (inlineButtons && inlineButtons.length > 0) {
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

    new_append_logic = '''        if (inlineButtons) {
          if (inlineButtons.categories && inlineButtons.wallets) {
            // Grouped Category + Wallet action buttons
            buttonsHtml = `
              <div class="mt-2.5 pt-2 border-t border-slate-200 space-y-2">
                <div>
                  <span class="text-[9px] text-slate-500 font-sans font-semibold block mb-1">🏷️ Pilih Kategori:</span>
                  <div class="flex flex-wrap gap-1">
                    ${inlineButtons.categories.map(btn => `
                      <button onclick="${btn.action}" class="${btn.isCurrent ? 'bg-brand-500 text-white border-brand-600 shadow-xs' : 'bg-slate-100 hover:bg-rose-50 hover:text-brand-600 text-slate-700'} text-[10px] font-bold px-2 py-0.5 rounded-lg border border-slate-200 transition">
                        ${btn.isCurrent ? '✓ ' : ''}${btn.label}
                      </button>
                    `).join('')}
                  </div>
                </div>
                <div>
                  <span class="text-[9px] text-slate-500 font-sans font-semibold block mb-1">💳 Rekening Sumber:</span>
                  <div class="flex flex-wrap gap-1">
                    ${inlineButtons.wallets.map(btn => `
                      <button onclick="${btn.action}" class="${btn.isCurrent ? 'bg-brand-500 text-white border-brand-600 shadow-xs' : 'bg-slate-100 hover:bg-rose-50 hover:text-brand-600 text-slate-700'} text-[10px] font-bold px-2 py-0.5 rounded-lg border border-slate-200 transition">
                        ${btn.isCurrent ? '✓ ' : ''}${btn.label}
                      </button>
                    `).join('')}
                    ${inlineButtons.deleteBtn ? `
                      <button onclick="${inlineButtons.deleteBtn.action}" class="bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-rose-200 transition">
                        ${inlineButtons.deleteBtn.label}
                      </button>
                    ` : ''}
                  </div>
                </div>
              </div>
            `;
          } else if (Array.isArray(inlineButtons) && inlineButtons.length > 0) {
            // Flat list fallback
            buttonsHtml = `
              <div class="mt-2.5 pt-2 border-t border-slate-200">
                <div class="flex flex-wrap gap-1">
                  ${inlineButtons.map(btn => `
                    <button onclick="${btn.action}" class="${btn.isCurrent ? 'bg-brand-500 text-white border-brand-600 shadow-xs' : 'bg-slate-100 hover:bg-rose-50 hover:text-brand-600 text-slate-700'} text-[10px] font-bold px-2 py-0.5 rounded-lg border border-slate-200 transition">
                      ${btn.label}
                    </button>
                  `).join('')}
                </div>
              </div>
            `;
          }
        }'''
    content = content.replace(old_append_logic, new_append_logic)

    # =========================================================================
    # 3. UPDATE EXPENSE RECORDING IN handleBotResponse TO USE detectCategoryFromText
    # =========================================================================
    old_tx_expense_creation = '''        const newTx = {
          id: `tx-${Date.now()}`,
          date: dateStr,
          dayNum: dayNum,
          type: 'expense',
          amount: amount,
          category: '🍜 Makanan & Minuman',
          wallet: targetWallet ? targetWallet.name : 'Dompet Utama',
          notes: text,
          source: 'telegram'
        };'''

    new_tx_expense_creation = '''        const detectedCategory = detectCategoryFromText(text);

        const newTx = {
          id: `tx-${Date.now()}`,
          date: dateStr,
          dayNum: dayNum,
          type: 'expense',
          amount: amount,
          category: detectedCategory,
          wallet: targetWallet ? targetWallet.name : 'Dompet Utama',
          notes: text,
          source: 'telegram'
        };'''
    content = content.replace(old_tx_expense_creation, new_tx_expense_creation)

    # Replace buttons generation in handleBotResponse to use buildBotTxActionButtons
    old_btn_call = '''        const buttons = buildWalletSelectionButtons(txWalletName, newTx.id);
        appendChatMessage('bot', reply, buttons);'''

    new_btn_call = '''        const actions = buildBotTxActionButtons(txWalletName, detectedCategory, newTx.id);
        appendChatMessage('bot', reply, actions);'''
    content = content.replace(old_btn_call, new_btn_call)

    # Update changeTxWallet to preserve category and return buildBotTxActionButtons
    content = content.replace(
        "const buttons = buildWalletSelectionButtons(newWallet, tx.id);\n      appendChatMessage('bot', reply, buttons);",
        "const actions = buildBotTxActionButtons(newWallet, tx.category, tx.id);\n      appendChatMessage('bot', reply, actions);"
    )

    # Update simulateReceiptPhoto and simulateVoiceNote to use buildBotTxActionButtons
    content = content.replace(
        "const buttons = buildWalletSelectionButtons(defaultWallet ? defaultWallet.name : 'BCA Utama', AppState.transactions[0].id);\n        appendChatMessage('bot', reply, buttons);",
        "const actions = buildBotTxActionButtons(defaultWallet ? defaultWallet.name : 'BCA Utama', '🛒 Belanja Kebutuhan', AppState.transactions[0].id);\n        appendChatMessage('bot', reply, actions);"
    )

    with open(INDEX_PATH, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Patched successfully! New file size: {len(content)}")

if __name__ == '__main__':
    main()
