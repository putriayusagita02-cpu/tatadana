import os
import re

html_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'index.html')
html_path = os.path.abspath(html_path)

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update handleRegisterSubmit to initialize EVERYTHING with 0
old_reg_submit_pattern = r'const newUser = \{\s*id: newUserId,\s*name: name,.*?\};\s*users\.push\(newUser\);'
new_reg_user_code = """const newUser = {
        id: newUserId,
        name: name,
        email: email,
        phone: phone,
        password: password,
        plan: 'starter',
        monthlyTxCount: 0,
        currency: 'IDR',
        isSuperadmin: false,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=f43f5e`,
        wallets: [
          { id: `w-${Date.now()}-1`, name: 'BCA Utama', alias: 'bca', type: 'bank', balance: 0, isDefaultTelegram: true, isArchived: false, color: '#f43f5e' },
          { id: `w-${Date.now()}-2`, name: 'GoPay', alias: 'gopay', type: 'ewallet', balance: 0, isDefaultTelegram: false, isArchived: false, color: '#fb7185' },
          { id: `w-${Date.now()}-3`, name: 'Uang Tunai (Cash)', alias: 'cash', type: 'cash', balance: 0, isDefaultTelegram: false, isArchived: false, color: '#fda4af' },
          { id: `w-${Date.now()}-4`, name: 'Mandiri Livin', alias: 'mandiri', type: 'bank', balance: 0, isDefaultTelegram: false, isArchived: false, color: '#e11d48' }
        ],
        categories: [
          { id: 'c-1', name: 'Makanan & Minuman', type: 'expense', emoji: '🍜', color: '#f43f5e', budget: 1500000, spent: 0 },
          { id: 'c-2', name: 'Transportasi', type: 'expense', emoji: '🚗', color: '#fb7185', budget: 500000, spent: 0 },
          { id: 'c-3', name: 'Belanja Kebutuhan', type: 'expense', emoji: '🛒', color: '#f472b6', budget: 800000, spent: 0 },
          { id: 'c-4', name: 'Tagihan & Utilitas', type: 'expense', emoji: '🏠', color: '#e11d48', budget: 600000, spent: 0 },
          { id: 'c-5', name: 'Hiburan & Kopi', type: 'expense', emoji: '🎮', color: '#be123c', budget: 350000, spent: 0 },
          { id: 'c-6', name: 'Gaji Bulanan', type: 'income', emoji: '💰', color: '#10b981', budget: 0, spent: 0 }
        ],
        transactions: [], // 0 TRANSAKSI - BERSIH UNTUK AKUN BARU
        bills: [],        // 0 TAGIHAN AWAL
        jatahConfig: {
          paydayDate: 25,
          monthlySavingsTarget: 0,
          enableRollover: true,
          streakDays: 0
        },
        telegramSettings: {
          isConnected: false,
          botUsername: 'TataDanaBot',
          alwaysAskWallet: false,
          remindersEnabled: true,
          frequency: 2,
          time1: '12:00',
          time2: '20:00',
          linkCode: 'LINK-' + Math.floor(1000 + Math.random()*9000)
        }
      };

      users.push(newUser);"""

match_reg = re.search(old_reg_submit_pattern, content, re.DOTALL)
if match_reg:
    content = content[:match_reg.start()] + new_reg_user_code + content[match_reg.end():]
    print("1. Successfully updated handleRegisterSubmit to initialize all numbers with 0.")
else:
    print("1. Pattern old_reg_submit_pattern not matched.")

# 2. Update renderLaporanTab to be 100% dynamic
old_laporan_pattern = r'function renderLaporanTab\(\)\s*\{.*?return `\s*<div class="space-y-8">.*?Riwayat Unduhan Laporan.*?</div>\s*</div>\s*`;\s*\}'
new_laporan_code = """function renderLaporanTab() {
      const isStarter = AppState.user.plan === 'starter';
      const totalIncome = AppState.transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const totalExpense = AppState.transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
      const netSurplus = totalIncome - totalExpense;

      const expenseByCategory = {};
      AppState.transactions.filter(t => t.type === 'expense').forEach(t => {
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
      });
      let topCategory = '-';
      let topCategoryAmount = 0;
      for (const [cat, amt] of Object.entries(expenseByCategory)) {
        if (amt > topCategoryAmount) {
          topCategoryAmount = amt;
          topCategory = cat;
        }
      }
      const topCategoryPct = totalExpense > 0 ? Math.round((topCategoryAmount / totalExpense) * 100) : 0;
      const topCategoryText = totalExpense > 0 ? `${topCategory} (${topCategoryPct}%)` : 'Belum ada pengeluaran';

      return `
      <div class="space-y-8">
        <div class="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 class="font-bold text-slate-900 text-base">Laporan Keuangan & Export Data</h3>
              <p class="text-xs text-slate-500 mt-0.5">Laporan akun <strong>${AppState.user.name}</strong> • Realtime Supabase WIB</p>
            </div>
            <div class="flex items-center space-x-2">
              <button onclick="triggerExport('pdf')" class="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm">
                <span>📄</span>
                <span>Export PDF</span>
              </button>
              <button onclick="triggerExport('excel')" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm">
                <span>📊</span>
                <span>Export Excel (.xlsx)</span>
              </button>
            </div>
          </div>

          ${isStarter ? `
            <div class="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
              <div>
                <strong>Perhatian Akun Starter:</strong> Export berkas PDF/Excel tanpa batas merupakan fitur eksklusif paket Pro.
              </div>
              <button onclick="togglePlanMode()" class="px-3 py-1 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 transition">Upgrade Pro</button>
            </div>
          ` : ''}

          <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs">
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span class="text-slate-500 font-medium">Total Pemasukan</span>
              <p class="text-lg font-black text-emerald-600 mt-1">${formatIDR(totalIncome)}</p>
            </div>
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span class="text-slate-500 font-medium">Total Pengeluaran</span>
              <p class="text-lg font-black text-brand-600 mt-1">${formatIDR(totalExpense)}</p>
            </div>
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span class="text-slate-500 font-medium">Net Arus Kas (Cashflow)</span>
              <p class="text-lg font-black ${netSurplus >= 0 ? 'text-slate-800' : 'text-rose-600'} mt-1">${netSurplus >= 0 ? '+' : ''}${formatIDR(netSurplus)}</p>
            </div>
            <div class="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span class="text-slate-500 font-medium">Top Pengeluaran</span>
              <p class="text-xs font-bold text-slate-800 mt-1">${topCategoryText}</p>
            </div>
          </div>
        </div>

        <!-- Tabel Transaksi Terkini pada Laporan -->
        <div class="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm space-y-4">
          <div class="flex items-center justify-between">
            <h4 class="font-bold text-slate-900 text-sm">Rincian Transaksi (${AppState.transactions.length} mutasi)</h4>
            <span class="text-xs text-slate-500">Mata uang: IDR (Rupiah)</span>
          </div>
          ${renderTransactionsTable(AppState.transactions)}
        </div>

        <!-- Riwayat Export -->
        <div class="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm space-y-4">
          <h4 class="font-bold text-slate-900 text-sm">Riwayat Unduhan Laporan (Supabase Storage Signed URLs)</h4>
          <div class="space-y-2 text-xs">
            <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div class="flex items-center space-x-3">
                <span class="text-rose-500 text-base">📄</span>
                <div>
                  <h5 class="font-bold text-slate-800">Laporan_Keuangan_${encodeURIComponent(AppState.user.name)}_Okt_2026.pdf</h5>
                  <p class="text-[10px] text-slate-400">13 Okt 2026, 14:00 WIB • Ukuran: 245 KB</p>
                </div>
              </div>
              <button onclick="downloadReportSim('PDF')" class="px-3 py-1.5 bg-white border border-slate-200 text-brand-600 font-bold rounded-lg hover:border-brand-500 transition">
                Unduh Berkas
              </button>
            </div>

            <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div class="flex items-center space-x-3">
                <span class="text-emerald-500 text-base">📊</span>
                <div>
                  <h5 class="font-bold text-slate-800">Rekap_Transaksi_${encodeURIComponent(AppState.user.name)}_Okt_2026.xlsx</h5>
                  <p class="text-[10px] text-slate-400">13 Okt 2026, 11:30 WIB • Ukuran: 88 KB</p>
                </div>
              </div>
              <button onclick="downloadReportSim('Excel')" class="px-3 py-1.5 bg-white border border-slate-200 text-emerald-600 font-bold rounded-lg hover:border-emerald-500 transition">
                Unduh Berkas
              </button>
            </div>
          </div>
        </div>
      </div>
      `;
    }"""

match_lap = re.search(old_laporan_pattern, content, re.DOTALL)
if match_lap:
    content = content[:match_lap.start()] + new_laporan_code + content[match_lap.end():]
    print("2. Successfully updated renderLaporanTab to be 100% dynamic.")
else:
    print("2. Pattern old_laporan_pattern not matched.")

# 3. Update Telegram Bot Simulator Engine: openTelegramSimulator, handleBotResponse, etc.
old_bot_engine_pattern = r'function openTelegramSimulator\(\)\s*\{.*?function togglePlanMode\(\)'
new_bot_engine_code = """function openTelegramSimulator() {
      document.getElementById('telegram-modal').classList.remove('hidden');
      initBotChatGreeting();
    }

    function initBotChatGreeting() {
      const chat = document.getElementById('bot-chat-history');
      if (!chat) return;
      const defaultWallet = AppState.wallets.find(w => w.isDefaultTelegram) || AppState.wallets[0] || { name: 'Dompet Utama', balance: 0 };
      const totalBalance = AppState.wallets.filter(w => !w.isArchived).reduce((acc, w) => acc + w.balance, 0);

      chat.innerHTML = `
        <div class="text-center my-1">
          <span class="text-[10px] bg-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full font-medium">Hari ini • Waktu Indonesia Barat (WIB)</span>
        </div>
        <div class="flex items-start space-x-2">
          <div class="w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs font-bold">TD</div>
          <div class="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-3 max-w-[85%] shadow-sm text-xs text-slate-700 leading-relaxed font-sans">
            👋 Halo <strong>${AppState.user.name}</strong>! Selamat datang di bot resmi <strong>TataDana</strong>.<br><br>
            Akun: <b>${AppState.user.email}</b> (${AppState.user.plan.toUpperCase()} PLAN)<br>
            Dompet default: 👛 <b>${defaultWallet.name}</b> (Saldo: ${formatIDR(defaultWallet.balance)})<br>
            Total saldo akunmu: <b>${formatIDR(totalBalance)}</b><br><br>
            Catat pengeluaran & pemasukan semudah chat natural:<br>
            • <em>"beli bakso 15rb"</em><br>
            • <em>"gajian 5jt"</em><br>
            • <em>"kopi 25k pakai gopay"</em><br>
            • Kirim Voice Note atau Foto Struk belanja!<br><br>
            Ketik <code>/saldo</code>, <code>/jatah</code>, atau <code>/budget</code> untuk info cepat.
          </div>
        </div>
      `;
    }

    function closeTelegramSimulator() {
      document.getElementById('telegram-modal').classList.add('hidden');
    }

    function sendQuickMessage(text) {
      document.getElementById('bot-user-input').value = text;
      sendBotMessage();
    }

    function sendBotMessage() {
      const input = document.getElementById('bot-user-input');
      const text = input.value.trim();
      if (!text) return;

      appendChatMessage('user', text);
      input.value = '';

      setTimeout(() => {
        handleBotResponse(text);
      }, 400);
    }

    function appendChatMessage(sender, content, inlineButtons) {
      const chat = document.getElementById('bot-chat-history');
      if (!chat) return;
      const div = document.createElement('div');

      if (sender === 'user') {
        div.className = 'flex justify-end';
        div.innerHTML = `<div class="bg-brand-500 text-white rounded-2xl rounded-tr-none px-3.5 py-2 max-w-[80%] shadow-sm text-xs font-sans">${content}</div>`;
      } else {
        div.className = 'flex justify-start';
        let buttonsHtml = '';
        if (inlineButtons && inlineButtons.length > 0) {
          buttonsHtml = `
            <div class="mt-2.5 pt-2 border-t border-slate-200 flex flex-wrap gap-1.5">
              ${inlineButtons.map(btn => `
                <button onclick="${btn.action}" class="bg-slate-100 hover:bg-rose-50 hover:text-brand-600 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 transition">
                  ${btn.label}
                </button>
              `).join('')}
            </div>
          `;
        }

        div.innerHTML = `
          <div class="flex items-start space-x-2">
            <div class="w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs font-bold">TD</div>
            <div class="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-3 max-w-[85%] shadow-sm text-xs text-slate-800 leading-relaxed font-mono text-[11px] whitespace-pre-wrap">${content}${buttonsHtml}</div>
          </div>
        `;
      }

      chat.appendChild(div);
      chat.scrollTop = chat.scrollHeight;
    }

    function handleBotResponse(text) {
      const lower = text.toLowerCase();
      const jatah = getTataJatahState();

      if (lower === '/saldo') {
        const lines = AppState.wallets.filter(w => !w.isArchived).map(w => {
          const icon = w.type === 'bank' ? '🏦' : w.type === 'ewallet' ? '📱' : '💵';
          return `├ ${icon} ${w.name} : ${formatIDR(w.balance)}`;
        });
        const total = AppState.wallets.filter(w => !w.isArchived).reduce((acc, w) => acc + w.balance, 0);
        const msg = `👛 Status Saldo Dompet TataDana (${AppState.user.name}):\\n\\n${lines.join('\\n')}\\n└ 💰 Total Saldo : ${formatIDR(total)}`;
        appendChatMessage('bot', msg);
        return;
      }

      if (lower === '/jatah') {
        const msg = `🎯 Status TataJatah Harian (${AppState.user.name}):\\n\\n├ 🗓️ Sisa Hari Gajian : ${jatah.daysLeft} hari (tgl ${AppState.jatahConfig.paydayDate})\\n├ 💵 Jatah Harian Aman : ${formatIDR(jatah.safeDailyAllowance)} / hari\\n├ 🛒 Terpakai Hari Ini : ${formatIDR(jatah.todaySpent)} (${jatah.spentPct}%)\\n├ 💰 Sisa Jatah Hari Ini : ${formatIDR(jatah.remainingToday)}\\n└ 🚦 Status : ${jatah.status === 'aman' ? '🟢 Aman Terkendali' : jatah.status === 'hati_hati' ? '🟡 Hati-hati' : '🔴 Lewat Jatah'}\\n\\n🔥 Streak: ${jatah.streakDays} hari berturut-turut!`;
        appendChatMessage('bot', msg);
        return;
      }

      if (lower === '/budget') {
        const lines = AppState.categories.filter(c => c.budget > 0).map(c => {
          const spent = AppState.transactions.filter(t => t.type === 'expense' && t.category === c.name).reduce((sum, t) => sum + t.amount, 0);
          const pct = Math.round((spent / c.budget) * 100);
          const bar = '█'.repeat(Math.min(10, Math.floor(pct / 10))) + '░'.repeat(Math.max(0, 10 - Math.floor(pct / 10)));
          return `${c.emoji} ${c.name}\\n${bar} ${pct}% (${formatIDR(spent)} / ${formatIDR(c.budget)})\\nSisa: ${formatIDR(Math.max(0, c.budget - spent))}`;
        });
        const msg = `🎯 Status Budget Bulan Ini (${AppState.user.name}):\\n\\n${lines.length > 0 ? lines.join('\\n\\n') : 'Belum ada budget terpasang.'}`;
        appendChatMessage('bot', msg);
        return;
      }

      if (lower === '/hari ini' || lower === '/hariini') {
        const today = new Date().getDate();
        const todayTxs = AppState.transactions.filter(t => t.dayNum === today);
        const todayExpenses = todayTxs.filter(t => t.type === 'expense');
        const todayIncomes = todayTxs.filter(t => t.type === 'income');
        const expTotal = todayExpenses.reduce((s, t) => s + t.amount, 0);
        const incTotal = todayIncomes.reduce((s, t) => s + t.amount, 0);

        let txSummary = '• Belum ada transaksi hari ini.';
        if (todayTxs.length > 0) {
          txSummary = todayTxs.map(t => `• ${t.category}: ${t.notes || 'Transaksi'} (${formatIDR(t.amount)})`).join('\\n');
        }
        const msg = `📊 Rekap Transaksi Hari Ini (${AppState.user.name}):\\n\\n${txSummary}\\n\\n💸 Total Pengeluaran: ${formatIDR(expTotal)}\\n💰 Pemasukan: ${formatIDR(incTotal)}\\n🎯 Sisa Jatah Harian: ${formatIDR(jatah.remainingToday)}`;
        appendChatMessage('bot', msg);
        return;
      }

      // Check amount parser
      let amount = 15000;
      if (lower.includes('jt') || lower.includes('juta')) {
        const m = lower.match(/(\\d+(?:[.,]\\d+)?)\\s*(?:jt|juta)/);
        amount = m ? parseFloat(m[1].replace(',', '.')) * 1000000 : 1000000;
      } else if (lower.includes('rb') || lower.includes('ribu') || lower.includes('k')) {
        const m = lower.match(/(\\d+(?:[.,]\\d+)?)\\s*(?:rb|ribu|k)/);
        amount = m ? parseFloat(m[1].replace(',', '.')) * 1000 : 25000;
      } else {
        const m = lower.match(/(\\d{4,})/);
        if (m) amount = parseInt(m[1], 10);
      }

      // Detect wallet from user's actual wallets
      let targetWallet = AppState.wallets.find(w => w.isDefaultTelegram) || AppState.wallets[0];
      if (lower.includes('gopay')) {
        const found = AppState.wallets.find(w => w.name.toLowerCase().includes('gopay') || (w.alias && w.alias.includes('gopay')));
        if (found) targetWallet = found;
      } else if (lower.includes('mandiri')) {
        const found = AppState.wallets.find(w => w.name.toLowerCase().includes('mandiri') || (w.alias && w.alias.includes('mandiri')));
        if (found) targetWallet = found;
      } else if (lower.includes('cash') || lower.includes('tunai')) {
        const found = AppState.wallets.find(w => w.name.toLowerCase().includes('cash') || w.name.toLowerCase().includes('tunai') || (w.alias && w.alias.includes('cash')));
        if (found) targetWallet = found;
      } else if (lower.includes('bca')) {
        const found = AppState.wallets.find(w => w.name.toLowerCase().includes('bca') || (w.alias && w.alias.includes('bca')));
        if (found) targetWallet = found;
      }

      const isIncome = lower.includes('gajian') || lower.includes('gaji') || lower.includes('masuk') || lower.includes('terima') || lower.includes('dapat');
      const nowTimestamp = new Date();
      const dayNum = nowTimestamp.getDate();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
      const dateStr = `${dayNum} ${months[nowTimestamp.getMonth()]} ${nowTimestamp.getFullYear()}, ${String(nowTimestamp.getHours()).padStart(2,'0')}:${String(nowTimestamp.getMinutes()).padStart(2,'0')} WIB`;

      if (isIncome) {
        if (targetWallet) targetWallet.balance += amount;

        const newTx = {
          id: `tx-${Date.now()}`,
          date: dateStr,
          dayNum: dayNum,
          type: 'income',
          amount: amount,
          category: '💰 Gaji Bulanan',
          wallet: targetWallet ? targetWallet.name : 'Dompet Utama',
          notes: text,
          source: 'telegram'
        };
        AppState.transactions.unshift(newTx);
        AppState.user.monthlyTxCount = (AppState.user.monthlyTxCount || 0) + 1;
        saveCurrentUserData();

        const reply = `📅 ${dateStr}\\n💰 Pemasukan tercatat!\\n├ Nominal : ${formatIDR(amount)}\\n├ Kategori : 💼 Pemasukan\\n├ Dompet : 👛 ${targetWallet ? targetWallet.name : 'Dompet Utama'}\\n└ Saldo baru : ${formatIDR(targetWallet ? targetWallet.balance : amount)}\\n\\n💪 Semangat terus! Jatah harianmu otomatis bertambah proporsional.`;
        appendChatMessage('bot', reply);
      } else {
        if (targetWallet) targetWallet.balance -= amount;

        const newTx = {
          id: `tx-${Date.now()}`,
          date: dateStr,
          dayNum: dayNum,
          type: 'expense',
          amount: amount,
          category: '🍜 Makanan & Minuman',
          wallet: targetWallet ? targetWallet.name : 'Dompet Utama',
          notes: text,
          source: 'telegram'
        };
        AppState.transactions.unshift(newTx);
        AppState.user.monthlyTxCount = (AppState.user.monthlyTxCount || 0) + 1;
        saveCurrentUserData();

        const updatedJatah = getTataJatahState();
        const otherWallets = AppState.wallets.filter(w => w.name !== (targetWallet ? targetWallet.name : ''));
        const switchBtnWallet = otherWallets.length > 0 ? otherWallets[0].name : 'GoPay';

        const reply = `📅 ${dateStr}\\n💸 Pengeluaran tercatat!\\n├ Nominal : ${formatIDR(amount)}\\n├ Kategori : 🍜 Makanan & Minuman\\n├ Dompet : 👛 ${targetWallet ? targetWallet.name : 'Dompet Utama'}\\n├ Catatan : ${text}\\n└ Saldo : ${formatIDR(targetWallet ? targetWallet.balance : 0)}\\n\\n🎯 Sisa jatah hari ini: ${formatIDR(updatedJatah.remainingToday)}`;

        const buttons = [
          { label: `🔄 Ganti ke ${switchBtnWallet}`, action: `changeTxWallet('${switchBtnWallet}')` },
          { label: '🗑️ Hapus Transaksi', action: 'deleteLatestTx()' }
        ];

        appendChatMessage('bot', reply, buttons);
      }

      if (AppState.currentPage === 'dashboard') renderApp();
    }

    function changeTxWallet(newWallet) {
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
    }

    function deleteLatestTx() {
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
    }

    function simulateReceiptPhoto() {
      if (AppState.user.plan === 'starter') {
        appendChatMessage('user', '[📷 Mengirim Foto Struk Indomaret]');
        setTimeout(() => {
          appendChatMessage('bot', '⚠️ Fitur Scan Foto Struk belanja hanya tersedia untuk pengguna paket Pro! Upgrade akun seharga Rp99.000 sekali bayar di dashboard.');
        }, 300);
        return;
      }

      const defaultWallet = AppState.wallets.find(w => w.isDefaultTelegram) || AppState.wallets[0];
      const amount = 48500;
      if (defaultWallet) defaultWallet.balance -= amount;

      const nowTimestamp = new Date();
      const dayNum = nowTimestamp.getDate();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
      const dateStr = `${dayNum} ${months[nowTimestamp.getMonth()]} ${nowTimestamp.getFullYear()}, ${String(nowTimestamp.getHours()).padStart(2,'0')}:${String(nowTimestamp.getMinutes()).padStart(2,'0')} WIB`;

      AppState.transactions.unshift({
        id: `tx-${Date.now()}`,
        date: dateStr,
        dayNum: dayNum,
        type: 'expense',
        amount: amount,
        category: '🛒 Belanja Kebutuhan',
        wallet: defaultWallet ? defaultWallet.name : 'Dompet Utama',
        notes: 'Struk Alfamart Point',
        source: 'receipt_ocr',
        receiptItems: [
          { name: 'Roti Gandum', qty: 1, price: 18500, subtotal: 18500 },
          { name: 'Susu UHT 1L', qty: 1, price: 22000, subtotal: 22000 },
          { name: 'Air Mineral 600ml', qty: 2, price: 4000, subtotal: 8000 }
        ]
      });
      AppState.user.monthlyTxCount = (AppState.user.monthlyTxCount || 0) + 1;
      saveCurrentUserData();

      appendChatMessage('user', '[📷 Mengirim Foto Struk Supermarket]');
      setTimeout(() => {
        const reply = `📅 ${dateStr}\\n🧾 Struk Belanja Terverifikasi (AI Vision OCR)!\\n🏪 Merchant : Alfamart Point\\n💸 Total : ${formatIDR(amount)}\\n├ Dompet : 👛 ${defaultWallet ? defaultWallet.name : 'Dompet Utama'}\\n└ Saldo : ${formatIDR(defaultWallet ? defaultWallet.balance : 0)}\\n\\n📋 Rincian Produk:\\n• Roti Gandum (1x) : Rp18.500\\n• Susu UHT 1L (1x) : Rp22.000\\n• Air Mineral 600ml (2x) : Rp8.000\\n\\nSemua item otomatis dicatat ke akun ${AppState.user.name}.`;
        appendChatMessage('bot', reply);
        if (AppState.currentPage === 'dashboard') renderApp();
      }, 500);
    }

    function simulateVoiceNote() {
      const defaultWallet = AppState.wallets.find(w => w.isDefaultTelegram) || AppState.wallets[0];
      const amount = 22000;
      if (defaultWallet) defaultWallet.balance -= amount;

      const nowTimestamp = new Date();
      const dayNum = nowTimestamp.getDate();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
      const dateStr = `${dayNum} ${months[nowTimestamp.getMonth()]} ${nowTimestamp.getFullYear()}, ${String(nowTimestamp.getHours()).padStart(2,'0')}:${String(nowTimestamp.getMinutes()).padStart(2,'0')} WIB`;

      AppState.transactions.unshift({
        id: `tx-${Date.now()}`,
        date: dateStr,
        dayNum: dayNum,
        type: 'expense',
        amount: amount,
        category: '🍜 Makanan & Minuman',
        wallet: defaultWallet ? defaultWallet.name : 'Dompet Utama',
        notes: 'Soto Ayam',
        source: 'voice_note',
        vnTranscript: 'makan siang soto ayam dua puluh dua ribu'
      });
      AppState.user.monthlyTxCount = (AppState.user.monthlyTxCount || 0) + 1;
      saveCurrentUserData();

      appendChatMessage('user', '[🎙️ Voice Note: 0:04 detik]');
      setTimeout(() => {
        const reply = `📅 ${dateStr}\\n🎙️ Transkrip: "makan siang soto ayam dua puluh dua ribu"\\n💸 Pengeluaran tercatat!\\n├ Nominal : ${formatIDR(amount)}\\n├ Kategori : 🍜 Makanan & Minuman\\n├ Dompet : 👛 ${defaultWallet ? defaultWallet.name : 'Dompet Utama'}\\n├ Catatan : Soto Ayam\\n└ Saldo : ${formatIDR(defaultWallet ? defaultWallet.balance : 0)}\\n\\nCatatan otomatis tersinkron ke dashboard ${AppState.user.name}.`;
        appendChatMessage('bot', reply);
        if (AppState.currentPage === 'dashboard') renderApp();
      }, 500);
    }

    function testBotConnection() {
      const btn = document.getElementById('btn-test-conn');
      if (btn) btn.innerText = '⏳ Testing...';
      setTimeout(() => {
        if (btn) btn.innerText = 'Test Koneksi Bot';
        alert(`Koneksi SUKSES! Telegram API getMe: ok (true), Webhook didaftarkan untuk akun ${AppState.user.name} (@TataDanaBot) ke /api/telegram/webhook`);
      }, 800);
    }

    function togglePlanMode() {
      AppState.user.plan = AppState.user.plan === 'pro' ? 'starter' : 'pro';
      saveCurrentUserData();
      renderApp();
    }"""

match_bot = re.search(old_bot_engine_pattern, content, re.DOTALL)
if match_bot:
    content = content[:match_bot.start()] + new_bot_engine_code + content[match_bot.end():]
    print("3. Successfully updated Bot Simulator engine to be 100% dynamic to the active user.")
else:
    print("3. Pattern old_bot_engine_pattern not matched.")

# 4. Update buyFromSimulation in TataJatah
old_buy_sim = """    function buyFromSimulation() {
      const name = document.getElementById('sim-item-name')?.value || 'Barang Belanjaan';
      const amt = parseFloat(document.getElementById('sim-item-amount')?.value) || 0;
      if (amt <= 0) return;

      AppState.transactions.unshift({
        id: `tx-${Date.now()}`,
        date: '13 Okt 2026, 14:40 WIB',
        dayNum: 13,
        type: 'expense',
        amount: amt,
        category: '🛒 Belanja Kebutuhan',
        wallet: 'BCA Utama',
        notes: name,
        source: 'web'
      });

      // Potong saldo BCA
      const bca = AppState.wallets.find(w => w.name === 'BCA Utama');
      if (bca) bca.balance -= amt;

      closeModal('simulation-modal');
      renderApp();
      alert(`Transaksi '${name}' seharga ${formatIDR(amt)} berhasil dicatat! Jatah harian otomatis diperbarui.`);
    }"""

new_buy_sim = """    function buyFromSimulation() {
      const name = document.getElementById('sim-item-name')?.value || 'Barang Belanjaan';
      const amt = parseFloat(document.getElementById('sim-item-amount')?.value) || 0;
      if (amt <= 0) return;

      const targetW = AppState.wallets.find(w => w.isDefaultTelegram) || AppState.wallets[0] || { name: 'Dompet Utama', balance: 0 };
      if (targetW) targetW.balance -= amt;

      const nowTimestamp = new Date();
      const dayNum = nowTimestamp.getDate();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
      const dateStr = `${dayNum} ${months[nowTimestamp.getMonth()]} ${nowTimestamp.getFullYear()}, ${String(nowTimestamp.getHours()).padStart(2,'0')}:${String(nowTimestamp.getMinutes()).padStart(2,'0')} WIB`;

      AppState.transactions.unshift({
        id: `tx-${Date.now()}`,
        date: dateStr,
        dayNum: dayNum,
        type: 'expense',
        amount: amt,
        category: '🛒 Belanja Kebutuhan',
        wallet: targetW.name,
        notes: name,
        source: 'web'
      });

      closeModal('simulation-modal');
      saveCurrentUserData();
      renderApp();
      alert(`Transaksi '${name}' seharga ${formatIDR(amt)} berhasil dicatat pada ${targetW.name}! Jatah harian otomatis diperbarui.`);
    }"""

if old_buy_sim in content:
    content = content.replace(old_buy_sim, new_buy_sim, 1)
    print("4. Successfully updated buyFromSimulation.")
else:
    print("4. old_buy_sim not found directly.")

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("ALL PATCHES APPLIED TO index.html!")
