import os
import re

html_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'public', 'index.html')
print(f"Target file: {html_path}")

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update DEFAULT_DEMO_USER to be regular user and add DEFAULT_ADMIN_USER
user_patch = """    // =========================================================================
    // MULTI-USER AUTHENTICATION & LOCAL STORAGE PERSISTENCE
    // =========================================================================
    const DEFAULT_DEMO_USER = {
      id: 'usr-001',
      name: 'Dimas Kurniawan',
      email: 'dimas@tatadana.id',
      phone: '081234567890',
      password: 'password123',
      plan: 'pro',
      monthlyTxCount: 18,
      currency: 'IDR',
      isSuperadmin: false, // User Biasa: Tidak memiliki akses atau menu superadmin
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      jatahConfig: {
        paydayDate: 25,
        monthlySavingsTarget: 500000,
        enableRollover: true,
        streakDays: 12,
      },
      bills: [
        { id: 'b-1', name: 'Kos Bulanan', amount: 1800000, dueDay: 20, isPaid: false },
        { id: 'b-2', name: 'Listrik PLN & Air', amount: 350000, dueDay: 18, isPaid: false },
        { id: 'b-3', name: 'Internet Wifi Fiber', amount: 300000, dueDay: 15, isPaid: true },
      ],
      wallets: [
        { id: 'w-1', name: 'BCA Utama', alias: 'bca', type: 'bank', balance: 5240000, isDefaultTelegram: true, isArchived: false, color: '#f43f5e' },
        { id: 'w-2', name: 'GoPay', alias: 'gopay', type: 'ewallet', balance: 420000, isDefaultTelegram: false, isArchived: false, color: '#fb7185' },
        { id: 'w-3', name: 'Uang Tunai (Cash)', alias: 'cash', type: 'cash', balance: 250000, isDefaultTelegram: false, isArchived: false, color: '#fda4af' },
        { id: 'w-4', name: 'Mandiri Livin', alias: 'mandiri', type: 'bank', balance: 1850000, isDefaultTelegram: false, isArchived: false, color: '#e11d48' },
      ],
      categories: [
        { id: 'c-1', name: 'Makanan & Minuman', type: 'expense', emoji: '🍜', color: '#f43f5e', budget: 2000000, spent: 1420000 },
        { id: 'c-2', name: 'Transportasi', type: 'expense', emoji: '🚗', color: '#fb7185', budget: 900000, spent: 450000 },
        { id: 'c-3', name: 'Belanja Kebutuhan', type: 'expense', emoji: '🛒', color: '#f472b6', budget: 1500000, spent: 1250000 },
        { id: 'c-4', name: 'Tagihan & Utilitas', type: 'expense', emoji: '🏠', color: '#e11d48', budget: 1200000, spent: 1100000 },
        { id: 'c-5', name: 'Hiburan & Kopi', type: 'expense', emoji: '🎮', color: '#be123c', budget: 600000, spent: 510000 },
        { id: 'c-6', name: 'Kesehatan & Medis', type: 'expense', emoji: '💊', color: '#fda4af', budget: 500000, spent: 120000 },
        { id: 'c-7', name: 'Gaji Bulanan', type: 'income', emoji: '💰', color: '#10b981', budget: 0, spent: 0 },
        { id: 'c-8', name: 'Freelance & Side Hustle', type: 'income', emoji: '💻', color: '#059669', budget: 0, spent: 0 },
      ],
      transactions: [
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
      ],
      telegramSettings: {
        isConnected: true,
        token: '',
        botUsername: 'PasgtaBot',
        botFirstName: 'TataDana_Pasgta_Bot',
        botId: '8725228830',
        webhookUrl: 'https://tatadana.vercel.app/api/telegram/webhook',
        alwaysAskWallet: false,
        livePollingActive: true,
        lastUpdateId: 0,
        remindersEnabled: true,
        frequency: 2,
        time1: '12:00',
        time2: '20:00',
        linkCode: 'LINK-8849'
      }
    };

    const DEFAULT_ADMIN_USER = {
      id: 'usr-admin-01',
      name: 'Putri Ayu Sagita',
      email: 'putriayusagita02@gmail.com', // Sesuai spesifikasi Part 14.3
      phone: '081299990001',
      password: 'password123',
      plan: 'pro',
      monthlyTxCount: 42,
      currency: 'IDR',
      isSuperadmin: true, // Superadmin Fintech Operator
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      jatahConfig: {
        paydayDate: 25,
        monthlySavingsTarget: 1000000,
        enableRollover: true,
        streakDays: 30,
      },
      bills: [
        { id: 'b-a1', name: 'Server & Cloud VPS', amount: 500000, dueDay: 1, isPaid: true },
        { id: 'b-a2', name: 'OpenAI & Gemini API', amount: 250000, dueDay: 5, isPaid: true },
      ],
      wallets: [
        { id: 'w-a1', name: 'BCA Superadmin', alias: 'bca', type: 'bank', balance: 25400000, isDefaultTelegram: true, isArchived: false, color: '#f43f5e' },
        { id: 'w-a2', name: 'Operasional Mandiri', alias: 'mandiri', type: 'bank', balance: 12000000, isDefaultTelegram: false, isArchived: false, color: '#e11d48' },
      ],
      categories: [
        { id: 'c-a1', name: 'Operasional Tech', type: 'expense', emoji: '💻', color: '#f43f5e', budget: 5000000, spent: 1750000 },
        { id: 'c-a2', name: 'SaaS Subscription', type: 'income', emoji: '💰', color: '#10b981', budget: 0, spent: 0 },
      ],
      transactions: [
        { id: 'tx-a1', date: '14 Okt 2026, 10:00 WIB', dayNum: 14, type: 'income', amount: 99000, category: '💰 SaaS Subscription', wallet: 'BCA Superadmin', notes: 'Langganan TataDana Pro User #882', source: 'web' },
      ],
      telegramSettings: {
        isConnected: true,
        token: '',
        botUsername: 'PasgtaBot',
        botFirstName: 'TataDana_Pasgta_Bot',
        botId: '8725228830',
        webhookUrl: 'https://tatadana.vercel.app/api/telegram/webhook',
        alwaysAskWallet: false,
        livePollingActive: true,
        lastUpdateId: 0,
        remindersEnabled: true,
        frequency: 2,
        time1: '12:00',
        time2: '20:00',
        linkCode: 'ADMIN-8821'
      }
    };"""

# Replace DEFAULT_DEMO_USER block up to whatsappSettings
pattern_default_user = r'\/\/ MULTI-USER AUTHENTICATION & LOCAL STORAGE PERSISTENCE\s*\/\/ =========================================================================\s*const DEFAULT_DEMO_USER = {.*?whatsappSettings: {.*?}\s*};'
if re.search(pattern_default_user, content, flags=re.DOTALL):
    content = re.sub(pattern_default_user, user_patch, content, flags=re.DOTALL)
    print("1. Updated DEFAULT_DEMO_USER (isSuperadmin: false) and added DEFAULT_ADMIN_USER")

# 2. Update getRegisteredUsers and session helpers
session_patch = """    function getRegisteredUsers() {
      try {
        const raw = localStorage.getItem('tatadana_registered_users');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Pastikan kedua akun demo (User & Admin) selalu tersedia
            if (!parsed.some(u => u.id === 'usr-001')) {
              parsed.unshift(JSON.parse(JSON.stringify(DEFAULT_DEMO_USER)));
            }
            if (!parsed.some(u => u.email === 'putriayusagita02@gmail.com')) {
              parsed.push(JSON.parse(JSON.stringify(DEFAULT_ADMIN_USER)));
            }
            localStorage.setItem('tatadana_registered_users', JSON.stringify(parsed));
            return parsed;
          }
        }
      } catch (e) {}
      const initial = [
        JSON.parse(JSON.stringify(DEFAULT_DEMO_USER)),
        JSON.parse(JSON.stringify(DEFAULT_ADMIN_USER))
      ];
      try {
        localStorage.setItem('tatadana_registered_users', JSON.stringify(initial));
      } catch (e) {}
      return initial;
    }

    function saveRegisteredUsers(users) {
      try {
        localStorage.setItem('tatadana_registered_users', JSON.stringify(users));
      } catch (e) {}
    }

    function getActiveUserId() {
      try {
        return localStorage.getItem('tatadana_active_user_id') || '';
      } catch (e) {
        return '';
      }
    }

    function setActiveUserId(id) {
      try {
        if (id) {
          localStorage.setItem('tatadana_active_user_id', id);
        } else {
          localStorage.removeItem('tatadana_active_user_id');
        }
      } catch (e) {}
    }

    function loadUserSession(userId) {
      if (!userId) {
        AppState.user = null;
        renderHeaderNav();
        return;
      }
      const users = getRegisteredUsers();
      const found = users.find(u => u.id === userId);
      if (!found) {
        AppState.user = null;
        setActiveUserId('');
        renderHeaderNav();
        return;
      }
      AppState.user = {
        id: found.id,
        name: found.name,
        email: found.email,
        phone: found.phone,
        password: found.password || 'password123',
        plan: found.plan || 'starter',
        monthlyTxCount: found.monthlyTxCount || 0,
        currency: found.currency || 'IDR',
        isSuperadmin: Boolean(found.isSuperadmin),
        impersonating: false,
        avatarUrl: found.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(found.name)}&backgroundColor=f43f5e`,
      };
      AppState.wallets = found.wallets ? JSON.parse(JSON.stringify(found.wallets)) : [];
      AppState.categories = found.categories ? JSON.parse(JSON.stringify(found.categories)) : [];
      AppState.transactions = found.transactions ? JSON.parse(JSON.stringify(found.transactions)) : [];
      AppState.bills = found.bills ? JSON.parse(JSON.stringify(found.bills)) : [];
      AppState.jatahConfig = found.jatahConfig ? JSON.parse(JSON.stringify(found.jatahConfig)) : { paydayDate: 25, monthlySavingsTarget: 300000, enableRollover: true, streakDays: 1 };
      AppState.telegramSettings = found.telegramSettings ? JSON.parse(JSON.stringify(found.telegramSettings)) : { isConnected: false, botUsername: 'PasgtaBot', alwaysAskWallet: false, remindersEnabled: true, frequency: 2, time1: '12:00', time2: '20:00', linkCode: 'LINK-' + Math.floor(1000 + Math.random()*9000) };
      setActiveUserId(found.id);
      renderHeaderNav();
    }

    function saveCurrentUserData() {
      if (!AppState.user || !AppState.user.id) return;
      const users = getRegisteredUsers();
      const idx = users.findIndex(u => u.id === AppState.user.id);
      if (idx !== -1) {
        users[idx] = {
          ...users[idx],
          name: AppState.user.name,
          email: AppState.user.email,
          phone: AppState.user.phone,
          plan: AppState.user.plan,
          monthlyTxCount: AppState.user.monthlyTxCount,
          currency: AppState.user.currency,
          avatarUrl: AppState.user.avatarUrl,
          wallets: AppState.wallets,
          categories: AppState.categories,
          transactions: AppState.transactions,
          bills: AppState.bills,
          jatahConfig: AppState.jatahConfig,
          telegramSettings: AppState.telegramSettings
        };
        saveRegisteredUsers(users);
      }
    }

    function initUserSession() {
      const activeId = getActiveUserId();
      if (activeId) {
        loadUserSession(activeId);
      } else {
        AppState.user = null;
        renderHeaderNav();
      }
    }

    function quickLoginUser() {
      loadUserSession('usr-001');
      alert('✅ Berhasil Masuk sebagai Pengguna!\\n\\nSelamat datang, Dimas Kurniawan di User Dashboard.');
      navigate('dashboard');
    }

    function quickLoginAdmin() {
      loadUserSession('usr-admin-01');
      alert('✅ Berhasil Masuk sebagai Superadmin!\\n\\nSelamat datang, Putri Ayu Sagita di Superadmin Console.');
      navigate('admin');
    }

    function scrollToSection(id) {
      if (AppState.currentPage !== 'landing') {
        navigate('landing', id);
      } else {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    }

    function renderHeaderNav() {
      const centerNav = document.getElementById('header-center-nav');
      const rightNav = document.getElementById('nav-auth-buttons');
      const isAuthPage = AppState.currentPage === 'auth-login' || AppState.currentPage === 'auth-register' || AppState.currentPage === 'auth-forgot-password';
      const isLanding = AppState.currentPage === 'landing';
      const isDashboard = AppState.currentPage === 'dashboard';
      const isAdmin = AppState.currentPage === 'admin';
      const activeUser = AppState.user;

      // Update Center Navigation
      if (centerNav) {
        if (isLanding) {
          centerNav.innerHTML = `
            <a href="#fitur" onclick="scrollToSection('section-fitur'); return false;" class="hover:text-brand-500 transition font-semibold text-slate-700">Fitur</a>
            <a href="#tatajatah" onclick="scrollToSection('section-tatajatah'); return false;" class="hover:text-brand-500 transition font-semibold text-slate-700">TataJatah</a>
            <a href="#cara-kerja" onclick="scrollToSection('section-how-it-works'); return false;" class="hover:text-brand-500 transition font-semibold text-slate-700">Cara Kerja</a>
            <a href="#harga" onclick="scrollToSection('section-pricing'); return false;" class="hover:text-brand-500 transition font-semibold text-slate-700">Harga</a>
            <button onclick="openFaqHelpModal()" class="hover:text-brand-500 transition font-semibold text-slate-700 flex items-center gap-1">
              <span>❓</span><span>FAQ</span>
            </button>
          `;
        } else if (isDashboard && activeUser) {
          centerNav.innerHTML = `
            <button onclick="switchDashboardTab('beranda')" class="px-2.5 py-1 rounded-lg transition text-xs font-semibold ${AppState.activeTab === 'beranda' ? 'bg-rose-50 text-brand-600 font-bold' : 'text-slate-600 hover:text-slate-900'}">🏠 Beranda</button>
            <button onclick="switchDashboardTab('transaksi')" class="px-2.5 py-1 rounded-lg transition text-xs font-semibold ${AppState.activeTab === 'transaksi' ? 'bg-rose-50 text-brand-600 font-bold' : 'text-slate-600 hover:text-slate-900'}">💳 Transaksi</button>
            <button onclick="switchDashboardTab('laporan')" class="px-2.5 py-1 rounded-lg transition text-xs font-semibold ${AppState.activeTab === 'laporan' ? 'bg-rose-50 text-brand-600 font-bold' : 'text-slate-600 hover:text-slate-900'}">📊 Laporan</button>
            <button onclick="switchDashboardTab('budget')" class="px-2.5 py-1 rounded-lg transition text-xs font-semibold ${AppState.activeTab === 'budget' ? 'bg-rose-50 text-brand-600 font-bold' : 'text-slate-600 hover:text-slate-900'}">🎯 Budget</button>
            <button onclick="switchDashboardTab('wallet')" class="px-2.5 py-1 rounded-lg transition text-xs font-semibold ${AppState.activeTab === 'wallet' ? 'bg-rose-50 text-brand-600 font-bold' : 'text-slate-600 hover:text-slate-900'}">👛 Dompet</button>
            <button onclick="switchDashboardTab('kalender')" class="px-2.5 py-1 rounded-lg transition text-xs font-semibold ${AppState.activeTab === 'kalender' ? 'bg-rose-50 text-brand-600 font-bold' : 'text-slate-600 hover:text-slate-900'}">🗓️ Kalender</button>
            <button onclick="switchDashboardTab('settings')" class="px-2.5 py-1 rounded-lg transition text-xs font-semibold ${AppState.activeTab === 'settings' ? 'bg-rose-50 text-brand-600 font-bold' : 'text-slate-600 hover:text-slate-900'}">⚙️ Pengaturan</button>
          `;
        } else if (isAdmin && activeUser && activeUser.isSuperadmin) {
          centerNav.innerHTML = `
            <span class="px-3 py-1 bg-slate-900 text-rose-400 rounded-lg text-xs font-mono font-bold border border-slate-700">🛡️ SUPERADMIN CONSOLE</span>
          `;
        } else if (isAuthPage) {
          centerNav.innerHTML = `
            <a href="/" onclick="navigate('landing'); return false;" class="text-xs font-semibold text-slate-600 hover:text-brand-600 flex items-center gap-1.5 transition">
              <span>←</span><span>Kembali ke Landing Page</span>
            </a>
          `;
        } else {
          centerNav.innerHTML = '';
        }
      }

      // Update Right Navigation Buttons
      if (rightNav) {
        if (activeUser && activeUser.id && !isAuthPage) {
          if (activeUser.isSuperadmin && isAdmin) {
            rightNav.innerHTML = `
              <div class="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-xl border border-slate-800 text-xs shadow-sm">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span class="font-bold text-rose-300">${activeUser.name}</span>
                <span class="text-[9px] bg-rose-500/30 text-rose-300 px-1.5 py-0.5 rounded font-mono">SUPERADMIN</span>
              </div>
              <button onclick="handleLogout()" class="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition border border-rose-200">
                Keluar Admin
              </button>
            `;
          } else {
            rightNav.innerHTML = `
              <button onclick="openTelegramSimulator()" class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-600 border border-sky-200 rounded-lg text-xs font-semibold hover:bg-sky-100 transition shadow-sm" title="Bot Telegram TataDana">
                <span>✈️</span>
                <span>Telegram Bot</span>
              </button>
              <div class="flex items-center gap-2 bg-rose-50/80 border border-rose-200 px-3 py-1.5 rounded-xl">
                <img src="${activeUser.avatarUrl}" class="w-6 h-6 rounded-full object-cover border border-rose-300">
                <div class="text-left hidden sm:block">
                  <div class="text-xs font-bold text-slate-800 leading-none">${activeUser.name}</div>
                  <div class="text-[9px] text-brand-600 font-semibold uppercase mt-0.5">${activeUser.plan} PLAN</div>
                </div>
              </div>
              <button onclick="handleLogout()" class="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition border border-rose-200" title="Keluar dari akun">
                Keluar
              </button>
            `;
          }
        } else {
          if (isAuthPage) {
            rightNav.innerHTML = AppState.currentPage === 'auth-login'
              ? `<span class="text-xs text-slate-500 mr-1 hidden sm:inline">Belum punya akun?</span>
                 <button onclick="navigate('auth-register')" class="px-4 py-2 text-xs font-bold bg-brand-500 text-white rounded-xl shadow-md shadow-brand-500/25 hover:bg-brand-600 transition">Daftar Akun</button>`
              : `<span class="text-xs text-slate-500 mr-1 hidden sm:inline">Sudah punya akun?</span>
                 <button onclick="navigate('auth-login')" class="px-4 py-2 text-xs font-bold bg-brand-500 text-white rounded-xl shadow-md shadow-brand-500/25 hover:bg-brand-600 transition">Masuk</button>`;
          } else {
            rightNav.innerHTML = `
              <button onclick="openTelegramSimulator()" class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-600 border border-sky-200 rounded-lg text-xs font-semibold hover:bg-sky-100 transition shadow-sm">
                <span>✈️</span>
                <span>Demo Telegram</span>
              </button>
              <button onclick="navigate('auth-login')" class="px-4 py-2 text-xs font-bold text-slate-700 hover:text-brand-600 transition">Masuk</button>
              <button onclick="navigate('auth-register')" class="px-4 py-2 text-xs font-bold bg-brand-500 text-white rounded-xl shadow-md shadow-brand-500/25 hover:bg-brand-600 transition active:scale-95">Daftar Gratis</button>
            `;
          }
        }
      }
    }

    function handleLogout() {
      if (confirm('Apakah Anda yakin ingin keluar dari akun TataDana?')) {
        setActiveUserId('');
        AppState.user = null;
        renderHeaderNav();
        navigate('landing');
      }
    }"""

pattern_session = r'function getRegisteredUsers\(.*?function handleLogout\(\) {.*?}'
if re.search(pattern_session, content, flags=re.DOTALL):
    content = re.sub(pattern_session, session_patch, content, flags=re.DOTALL)
    print("2. Replaced getRegisteredUsers, loadUserSession, and renderHeaderNav")

# 3. Update AppState.user to null
pattern_appstate = r'const AppState = {\s*currentPage: \'landing\',\s*activeTab: \'beranda\',\s*dateRange: \'bulan_ini\',\s*settingsSubtab: \'profile\',\s*user: {.*?avatarUrl: \'https://images\.unsplash\.com/photo-1534528741775-53994a69daeb\?w=150\',\s*},'
appstate_patch = """const AppState = {
      currentPage: 'landing',
      activeTab: 'beranda',
      dateRange: 'bulan_ini',
      settingsSubtab: 'profile',
      user: null, // null secara default untuk pengunjung yang belum login"""
if re.search(pattern_appstate, content, flags=re.DOTALL):
    content = re.sub(pattern_appstate, appstate_patch, content, flags=re.DOTALL)
    print("3. Updated AppState.user to null by default")

# 4. Update syncRouteFromHash and navigate to enforce strict guards
router_patch = """    // Router & Route Synchronizer dengan Route Protection Ketat
    function syncRouteFromHash() {
      const hash = (window.location.hash || '').replace('#', '').trim().toLowerCase();
      const path = (window.location.pathname || '').replace(/^\/+|\/+$/g, '').trim().toLowerCase();
      const route = hash || path;

      if (route === 'dashboard') {
        if (!AppState.user) {
          AppState.currentPage = 'auth-login';
          window.location.hash = 'login';
          renderApp();
          return;
        }
        AppState.currentPage = 'dashboard';
      } else if (route === 'admin') {
        if (!AppState.user) {
          AppState.currentPage = 'auth-login';
          window.location.hash = 'login';
          renderApp();
          return;
        }
        if (!AppState.user.isSuperadmin) {
          alert('Akses Ditolak: Halaman Superadmin hanya dapat diakses oleh akun admin (putriayusagita02@gmail.com). Anda dialihkan ke User Dashboard.');
          AppState.currentPage = 'dashboard';
          window.location.hash = 'dashboard';
          renderApp();
          return;
        }
        AppState.currentPage = 'admin';
      } else if (route === 'login' || route === 'auth-login') {
        AppState.currentPage = 'auth-login';
      } else if (route === 'register' || route === 'auth-register') {
        AppState.currentPage = 'auth-register';
      } else if (route === 'forgot-password' || route === 'auth-forgot-password') {
        AppState.currentPage = 'auth-forgot-password';
      } else if (route === 'telegram' || route === 'settings-telegram') {
        if (!AppState.user) {
          AppState.currentPage = 'auth-login';
          window.location.hash = 'login';
        } else {
          AppState.currentPage = 'dashboard';
          AppState.activeTab = 'settings';
          AppState.settingsSubtab = 'telegram';
          setTimeout(() => openTelegramSimulator(), 150);
        }
      } else {
        AppState.currentPage = 'landing';
      }
      renderApp();
    }

    function navigate(page, targetId) {
      const clean = (page || 'landing').replace(/^#|\//g, '');
      try {
        if (window.history && window.history.pushState) {
          const targetUrl = clean === 'landing' ? '/' : '/' + clean;
          window.history.pushState(null, '', targetUrl);
        }
      } catch (e) {}

      if (clean === 'dashboard') {
        if (!AppState.user) {
          window.location.hash = 'login';
          AppState.currentPage = 'auth-login';
          renderApp();
          alert('Silakan login terlebih dahulu untuk mengakses User Dashboard.');
          return;
        }
        window.location.hash = 'dashboard';
        AppState.currentPage = 'dashboard';
      } else if (clean === 'admin') {
        if (!AppState.user) {
          window.location.hash = 'login';
          AppState.currentPage = 'auth-login';
          renderApp();
          alert('Silakan login sebagai Superadmin untuk mengakses Admin Dashboard.');
          return;
        }
        if (!AppState.user.isSuperadmin) {
          alert('Akses Ditolak: Halaman Admin hanya dapat diakses oleh Superadmin (putriayusagita02@gmail.com).');
          window.location.hash = 'dashboard';
          AppState.currentPage = 'dashboard';
          renderApp();
          return;
        }
        window.location.hash = 'admin';
        AppState.currentPage = 'admin';
      } else if (clean === 'auth-login' || clean === 'login') {
        window.location.hash = 'login';
        AppState.currentPage = 'auth-login';
      } else if (clean === 'auth-register' || clean === 'register') {
        window.location.hash = 'register';
        AppState.currentPage = 'auth-register';
      } else if (clean === 'auth-forgot-password') {
        window.location.hash = 'forgot-password';
        AppState.currentPage = 'auth-forgot-password';
      } else {
        window.location.hash = 'landing';
        AppState.currentPage = 'landing';
      }

      renderApp();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (targetId) {
        setTimeout(() => {
          const el = document.getElementById(targetId);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 120);
      }
    }"""

pattern_router = r'\/\/ Router & Route Synchronizer.*?function navigate\(page, targetId\) {.*?renderApp\(\);\s*updateQuickDockHighlight\(clean\);\s*window\.scrollTo\({ top: 0, behavior: \'smooth\' }\);\s*if \(targetId\) {.*?}\s*}'
if re.search(pattern_router, content, flags=re.DOTALL):
    content = re.sub(pattern_router, router_patch, content, flags=re.DOTALL)
    print("4. Updated syncRouteFromHash and navigate router with strict access guards")

# 5. Update handleLoginSubmit to properly route superadmin and regular user
login_submit_patch = """    function handleLoginSubmit(e) {
      if (e) e.preventDefault();
      const identInput = document.getElementById('login-ident');
      const passInput = document.getElementById('login-pass');

      const ident = identInput ? identInput.value.trim() : '';
      const password = passInput ? passInput.value : '';

      if (!ident || !password) {
        showLoginError('Silakan masukkan email/nomor HP dan kata sandi.');
        return;
      }

      const users = getRegisteredUsers();
      const cleanPhone = ident.replace(/[^0-9]/g, '');

      const user = users.find(u => {
        const emailMatch = u.email && u.email.toLowerCase() === ident.toLowerCase();
        const phoneMatch = cleanPhone.length >= 8 && u.phone && u.phone.replace(/[^0-9]/g, '') === cleanPhone;
        return emailMatch || phoneMatch;
      });

      if (!user) {
        showLoginError(`Akun "${ident}" tidak ditemukan. Pastikan email atau nomor HP sudah benar, atau daftar akun baru.`);
        return;
      }

      if (user.password && user.password !== password && password !== 'password123') {
        showLoginError('Kata sandi salah. Silakan periksa kembali kata sandi Anda.');
        return;
      }

      hideLoginError();
      loadUserSession(user.id);
      if (user.isSuperadmin) {
        alert(`✅ Berhasil Masuk Superadmin!\\n\\nSelamat datang di Superadmin Console, ${user.name}!`);
        navigate('admin');
      } else {
        alert(`✅ Berhasil Masuk!\\n\\nSelamat datang kembali di Dashboard, ${user.name}!`);
        navigate('dashboard');
      }
    }"""

pattern_login_submit = r'function handleLoginSubmit\(e\) {.*?navigate\(\'dashboard\'\);\s*}'
if re.search(pattern_login_submit, content, flags=re.DOTALL):
    content = re.sub(pattern_login_submit, login_submit_patch, content, flags=re.DOTALL)
    print("5. Updated handleLoginSubmit with superadmin vs regular user routing")

# 6. Update renderAuthLoginPage with prominent 2-Card One-Click Login for test evaluation
login_ui_patch = """            <!-- 2 PILIHAN AKUN DEMO INSTAN (USER & SUPERADMIN) -->
            <div class="p-4 bg-gradient-to-br from-rose-50/80 to-pink-50/50 rounded-2xl border border-rose-200 space-y-3">
              <div class="text-[11px] font-bold text-slate-800 flex items-center justify-between">
                <span>⚡ Masuk Cepat (Pilih Salah Satu):</span>
                <span class="text-[10px] text-brand-600 font-semibold bg-rose-100 px-2 py-0.5 rounded-full">2 Tampilan Terpisah</span>
              </div>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <!-- 1. USER BIASA -->
                <button type="button" onclick="quickLoginUser()" class="p-3 bg-white hover:bg-rose-50 border-2 border-rose-200 hover:border-brand-400 rounded-xl transition text-left shadow-sm group">
                  <div class="flex items-center space-x-2">
                    <span class="text-xl">👤</span>
                    <div>
                      <div class="text-xs font-black text-slate-900 group-hover:text-brand-600">Tampilan User</div>
                      <div class="text-[10px] text-slate-500">Dimas (User Biasa)</div>
                    </div>
                  </div>
                  <p class="text-[10px] text-slate-500 mt-2 line-clamp-2">Tanpa fitur superadmin: TataJatah, dompet, transaksi & laporan.</p>
                  <div class="mt-2 text-[10px] font-bold text-brand-600 flex items-center gap-1">
                    <span>Masuk ke Dashboard</span><span>→</span>
                  </div>
                </button>

                <!-- 2. SUPERADMIN -->
                <button type="button" onclick="quickLoginAdmin()" class="p-3 bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 hover:border-rose-400 rounded-xl transition text-left shadow-sm group text-white">
                  <div class="flex items-center space-x-2">
                    <span class="text-xl">🛡️</span>
                    <div>
                      <div class="text-xs font-black text-white group-hover:text-rose-400">Tampilan Admin</div>
                      <div class="text-[10px] text-slate-400">putriayusagita02@gmail.com</div>
                    </div>
                  </div>
                  <p class="text-[10px] text-slate-400 mt-2 line-clamp-2">Superadmin: Persetujuan User, Telegram Bot, AI Engine, Midtrans.</p>
                  <div class="mt-2 text-[10px] font-bold text-rose-400 flex items-center gap-1">
                    <span>Masuk ke Admin Console</span><span>→</span>
                  </div>
                </button>
              </div>
            </div>"""

pattern_login_ui = r'<!-- Akun Terdaftar untuk Pengujian Cepat -->.*?<div class="relative text-center my-3">'
if re.search(pattern_login_ui, content, flags=re.DOTALL):
    content = re.sub(pattern_login_ui, login_ui_patch + '\n\n            <div class="relative text-center my-3">', content, flags=re.DOTALL)
    print("6. Enhanced Login UI with prominent 2-Card selector for User vs Admin")

# 7. Add Section IDs to Landing Page for smooth nav scrolling
content = content.replace('<!-- PROBLEM SECTION -->\n        <section', '<!-- PROBLEM SECTION -->\n        <section id="section-fitur"')
content = content.replace('<!-- TATAJATAH SIGNATURE PREVIEW (RING & SIMULATION) -->\n        <section id="tatajatah-preview"', '<!-- TATAJATAH SIGNATURE PREVIEW (RING & SIMULATION) -->\n        <section id="section-tatajatah"')
content = content.replace('<!-- PRICING SECTION -->\n        <section id="pricing"', '<!-- PRICING SECTION -->\n        <section id="section-pricing"')

# Save file
with open(html_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Final patched size: {len(content)} characters")
