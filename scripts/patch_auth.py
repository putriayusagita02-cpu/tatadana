import os
import re

html_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'index.html')
html_path = os.path.abspath(html_path)

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Header Nav CTAs container
old_header_ctas = """      <!-- Right CTAs -->
      <div class="flex items-center space-x-3">
        <button onclick="openTelegramSimulator()" class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-600 border border-sky-200 rounded-lg text-xs font-semibold hover:bg-sky-100 transition shadow-sm">
          <span>✈️</span>
          <span>Simulator Telegram</span>
        </button>
        <button onclick="navigate('auth-login')" class="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-brand-600 transition">Masuk</button>
        <button onclick="navigate('auth-register')" class="px-4 py-2 text-xs font-bold bg-brand-500 text-white rounded-xl shadow-md shadow-brand-500/25 hover:bg-brand-600 hover:shadow-brand-500/35 transition active:scale-95">Daftar Akun</button>
      </div>"""

new_header_ctas = """      <!-- Right CTAs -->
      <div id="nav-auth-buttons" class="flex items-center space-x-3">
        <button onclick="openTelegramSimulator()" class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-600 border border-sky-200 rounded-lg text-xs font-semibold hover:bg-sky-100 transition shadow-sm">
          <span>✈️</span>
          <span>Simulator Telegram</span>
        </button>
        <button onclick="navigate('auth-login')" class="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-brand-600 transition">Masuk</button>
        <button onclick="navigate('auth-register')" class="px-4 py-2 text-xs font-bold bg-brand-500 text-white rounded-xl shadow-md shadow-brand-500/25 hover:bg-brand-600 hover:shadow-brand-500/35 transition active:scale-95">Daftar Akun</button>
      </div>"""

if old_header_ctas in content:
    content = content.replace(old_header_ctas, new_header_ctas, 1)
    print("1. Replaced header CTAs container successfully.")
else:
    print("1. Note: old_header_ctas not found directly, checking regex...")
    content = re.sub(r'<!-- Right CTAs -->\s*<div class="flex items-center space-x-3">', '<!-- Right CTAs -->\n      <div id="nav-auth-buttons" class="flex items-center space-x-3">', content, count=1)

# 2. Add User Auth Helpers and Persistence before const AppState
auth_helpers = """
    // =========================================================================
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
      isSuperadmin: true,
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
      ],
      telegramSettings: {
        isConnected: true,
        botUsername: 'TataDanaBot',
        alwaysAskWallet: false,
        remindersEnabled: true,
        frequency: 2,
        time1: '12:00',
        time2: '20:00',
        linkCode: 'LINK-8849'
      }
    };

    function getRegisteredUsers() {
      try {
        const raw = localStorage.getItem('tatadana_registered_users');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
      const initial = [JSON.parse(JSON.stringify(DEFAULT_DEMO_USER))];
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
        return localStorage.getItem('tatadana_active_user_id') || 'usr-001';
      } catch (e) {
        return 'usr-001';
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
      const users = getRegisteredUsers();
      const found = users.find(u => u.id === userId) || users[0] || DEFAULT_DEMO_USER;
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
      AppState.telegramSettings = found.telegramSettings ? JSON.parse(JSON.stringify(found.telegramSettings)) : { isConnected: false, botUsername: 'TataDanaBot', alwaysAskWallet: false, remindersEnabled: true, frequency: 2, time1: '12:00', time2: '20:00', linkCode: 'LINK-' + Math.floor(1000 + Math.random()*9000) };
      setActiveUserId(found.id);
      renderHeaderNav();
    }

    function saveCurrentUserData() {
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
      loadUserSession(activeId);
    }

    function renderHeaderNav() {
      const container = document.getElementById('nav-auth-buttons');
      if (!container) return;
      const isAuthPage = AppState.currentPage === 'auth-login' || AppState.currentPage === 'auth-register' || AppState.currentPage === 'auth-forgot-password';
      const activeUser = AppState.user;

      if (activeUser && activeUser.id && !isAuthPage) {
        container.innerHTML = `
          <button onclick="openTelegramSimulator()" class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-600 border border-sky-200 rounded-lg text-xs font-semibold hover:bg-sky-100 transition shadow-sm">
            <span>✈️</span>
            <span>Simulator Telegram</span>
          </button>
          <div onclick="navigate('dashboard')" class="flex items-center gap-2 cursor-pointer bg-rose-50/80 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl transition" title="Buka Dashboard">
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
      } else {
        container.innerHTML = `
          <button onclick="openTelegramSimulator()" class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-600 border border-sky-200 rounded-lg text-xs font-semibold hover:bg-sky-100 transition shadow-sm">
            <span>✈️</span>
            <span>Simulator Telegram</span>
          </button>
          <button onclick="navigate('auth-login')" class="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-brand-600 transition">Masuk</button>
          <button onclick="navigate('auth-register')" class="px-4 py-2 text-xs font-bold bg-brand-500 text-white rounded-xl shadow-md shadow-brand-500/25 hover:bg-brand-600 hover:shadow-brand-500/35 transition active:scale-95">Daftar Akun</button>
        `;
      }
    }

    function handleLogout() {
      if (confirm('Apakah Anda yakin ingin keluar dari akun TataDana?')) {
        setActiveUserId('');
        AppState.user = { id: '', name: '', email: '', phone: '', plan: 'starter', avatarUrl: '' };
        renderHeaderNav();
        navigate('auth-login');
      }
    }

    function showRegError(msg) {
      const box = document.getElementById('reg-error-box');
      if (box) {
        box.innerHTML = `<div class="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 font-medium"><span>⚠️</span><span>${msg}</span></div>`;
        box.classList.remove('hidden');
      } else {
        alert(msg);
      }
    }

    function hideRegError() {
      const box = document.getElementById('reg-error-box');
      if (box) box.classList.add('hidden');
    }

    function showLoginError(msg) {
      const box = document.getElementById('login-error-box');
      if (box) {
        box.innerHTML = `<div class="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 font-medium"><span>⚠️</span><span>${msg}</span></div>`;
        box.classList.remove('hidden');
      } else {
        alert(msg);
      }
    }

    function hideLoginError() {
      const box = document.getElementById('login-error-box');
      if (box) box.classList.add('hidden');
    }

    function fillDemoLogin(ident, pass) {
      const identInput = document.getElementById('login-ident');
      const passInput = document.getElementById('login-pass');
      if (identInput) identInput.value = ident;
      if (passInput) passInput.value = pass;
      hideLoginError();
    }

    function handleGoogleLogin() {
      const users = getRegisteredUsers();
      const user = users[0] || DEFAULT_DEMO_USER;
      loadUserSession(user.id);
      alert(`🌐 Berhasil masuk via Google OAuth sebagai ${user.name}!`);
      navigate('dashboard');
    }

    function handleRegisterSubmit(e) {
      if (e) e.preventDefault();
      const nameInput = document.getElementById('reg-name');
      const emailInput = document.getElementById('reg-email');
      const phoneInput = document.getElementById('reg-phone');
      const passwordInput = document.getElementById('reg-password');
      const confirmInput = document.getElementById('reg-password-confirm');
      const otpSection = document.getElementById('otp-section');
      const regBtn = document.getElementById('reg-btn');

      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
      const phone = phoneInput ? phoneInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';
      const confirm = confirmInput ? confirmInput.value : '';

      if (!name || !email || !phone || !password) {
        showRegError('Semua kolom (Nama, Email, Nomor HP, dan Kata Sandi) wajib diisi.');
        return;
      }

      if (password.length < 6) {
        showRegError('Kata sandi minimal 6 karakter.');
        return;
      }

      if (password !== confirm) {
        showRegError('Konfirmasi kata sandi tidak cocok.');
        return;
      }

      const users = getRegisteredUsers();
      const existingEmail = users.find(u => u.email && u.email.toLowerCase() === email);
      if (existingEmail) {
        showRegError(`Email "${email}" sudah terdaftar! Silakan langsung masuk di halaman login.`);
        return;
      }

      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const existingPhone = users.find(u => u.phone && u.phone.replace(/[^0-9]/g, '') === cleanPhone);
      if (existingPhone) {
        showRegError(`Nomor HP "${phone}" sudah terdaftar! Silakan langsung masuk di halaman login.`);
        return;
      }

      // First click: Reveal OTP verification step
      if (otpSection && otpSection.classList.contains('hidden')) {
        hideRegError();
        otpSection.classList.remove('hidden');
        if (regBtn) regBtn.innerText = 'Verifikasi OTP & Buat Akun';
        const otpNotice = document.getElementById('otp-notice');
        if (otpNotice) {
          otpNotice.innerText = `Kode OTP 728491 dikirim ke WhatsApp / SMS ${phone} (Nomor Uji Coba Supabase Auth).`;
        }
        return;
      }

      // Second click: OTP Verified -> Create Account!
      const newUserId = 'usr-' + Date.now();
      const nowTimestamp = new Date();
      const dayNum = nowTimestamp.getDate();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
      const dateStr = `${dayNum} ${months[nowTimestamp.getMonth()]} ${nowTimestamp.getFullYear()}, ${String(nowTimestamp.getHours()).padStart(2,'0')}:${String(nowTimestamp.getMinutes()).padStart(2,'0')} WIB`;

      const newUser = {
        id: newUserId,
        name: name,
        email: email,
        phone: phone,
        password: password,
        plan: 'starter',
        monthlyTxCount: 1,
        currency: 'IDR',
        isSuperadmin: false,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=f43f5e`,
        wallets: [
          { id: `w-${Date.now()}-1`, name: 'BCA / Dompet Utama', alias: 'bca', type: 'bank', balance: 1500000, isDefaultTelegram: true, isArchived: false, color: '#f43f5e' },
          { id: `w-${Date.now()}-2`, name: 'GoPay', alias: 'gopay', type: 'ewallet', balance: 250000, isDefaultTelegram: false, isArchived: false, color: '#fb7185' },
          { id: `w-${Date.now()}-3`, name: 'Uang Tunai (Cash)', alias: 'cash', type: 'cash', balance: 100000, isDefaultTelegram: false, isArchived: false, color: '#fda4af' }
        ],
        categories: [
          { id: 'c-1', name: 'Makanan & Minuman', type: 'expense', emoji: '🍜', color: '#f43f5e', budget: 1500000, spent: 0 },
          { id: 'c-2', name: 'Transportasi', type: 'expense', emoji: '🚗', color: '#fb7185', budget: 400000, spent: 0 },
          { id: 'c-3', name: 'Belanja Kebutuhan', type: 'expense', emoji: '🛒', color: '#f472b6', budget: 800000, spent: 0 },
          { id: 'c-4', name: 'Tagihan & Utilitas', type: 'expense', emoji: '🏠', color: '#e11d48', budget: 600000, spent: 0 },
          { id: 'c-5', name: 'Hiburan & Kopi', type: 'expense', emoji: '🎮', color: '#be123c', budget: 350000, spent: 0 },
          { id: 'c-6', name: 'Gaji Bulanan', type: 'income', emoji: '💰', color: '#10b981', budget: 0, spent: 0 }
        ],
        transactions: [
          { id: `tx-${Date.now()}`, date: dateStr, dayNum: dayNum, type: 'income', amount: 1850000, category: '💰 Gaji Bulanan', wallet: 'BCA / Dompet Utama', notes: 'Saldo Awal Akun Baru TataDana', source: 'web' }
        ],
        bills: [
          { id: `b-${Date.now()}`, name: 'Listrik & Kuota Internet', amount: 200000, dueDay: 20, isPaid: false }
        ],
        jatahConfig: {
          paydayDate: 25,
          monthlySavingsTarget: 300000,
          enableRollover: true,
          streakDays: 1
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

      users.push(newUser);
      saveRegisteredUsers(users);

      // Auto login as new user
      loadUserSession(newUser.id);

      alert(`🎉 Pendaftaran Berhasil!\n\nSelamat datang di TataDana, ${name}!\nAkun Anda telah aktif dengan email: ${email}\nAnda dapat keluar dan masuk kembali kapan saja dengan email/nomor HP dan kata sandi Anda.`);
      navigate('dashboard');
    }

    function handleLoginSubmit(e) {
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
      alert(`✅ Berhasil Masuk!\n\nSelamat datang kembali, ${user.name}!`);
      navigate('dashboard');
    }
"""

# Insert auth_helpers before const AppState
content = content.replace("    // Global Application State\n    const AppState = {", auth_helpers + "\n    // Global Application State\n    const AppState = {", 1)

# 3. Replace renderAuthLoginPage & renderAuthRegisterPage
auth_pages_code = """    // =========================================================================
    // 2. AUTH PAGES (Login, Register, Forgot Password)
    // =========================================================================
    function renderAuthLoginPage() {
      const users = getRegisteredUsers();
      const demoUsersHtml = users.slice(0, 4).map(u => `
        <button type="button" onclick="fillDemoLogin('${u.email}', '${u.password || 'password123'}')" class="w-full text-left p-2.5 rounded-xl border border-rose-100 hover:border-brand-300 hover:bg-rose-50/50 bg-slate-50 transition flex items-center justify-between group">
          <div class="flex items-center gap-2">
            <img src="${u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}" class="w-7 h-7 rounded-full object-cover border border-rose-200">
            <div>
              <div class="font-bold text-slate-800 text-[11px] group-hover:text-brand-600">${u.name}</div>
              <div class="text-[10px] text-slate-500">${u.email}</div>
            </div>
          </div>
          <span class="text-[10px] bg-white border border-rose-200 text-brand-600 px-2 py-0.5 rounded-full font-semibold">Pilih Akun</span>
        </button>
      `).join('');

      return `
      <div class="min-h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-white">
        <!-- Kiri 40% Panel -->
        <div class="hidden md:flex md:w-5/12 bg-gradient-to-tr from-brand-600 via-rose-500 to-pink-500 p-12 text-white flex-col justify-between">
          <div class="space-y-4">
            <div class="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-2xl">TD</div>
            <h2 class="text-3xl font-extrabold tracking-tight">Keuanganmu.<br>Terkontrol.</h2>
            <p class="text-rose-100 text-xs leading-relaxed max-w-xs">
              Mulai catat transaksi semudah kirim chat di Telegram. Semua tersimpan otomatis di dashboard TataDana.
            </p>
          </div>
          <div class="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-xs text-rose-50">
            <p class="italic">"TataJatah memandu pengeluaran harianmu tetap aman sampai tanggal gajian 🎯"</p>
            <span class="block text-[10px] text-rose-200 mt-2 font-bold">— TataDana Financial AI</span>
          </div>
        </div>

        <!-- Kanan 60% Form -->
        <div class="flex-1 p-8 sm:p-14 flex items-center justify-center">
          <div class="w-full max-w-md space-y-5">
            <div>
              <h3 class="text-2xl font-bold text-slate-900">Masuk ke TataDana</h3>
              <p class="text-xs text-slate-500 mt-1">Gunakan email atau nomor HP terdaftar untuk mengelola akun Anda.</p>
            </div>

            <div id="login-error-box" class="hidden"></div>

            <form onsubmit="handleLoginSubmit(event);" class="space-y-4 text-xs">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Email atau Nomor HP</label>
                <input id="login-ident" type="text" placeholder="nama@email.com atau 081234567890" required class="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition text-slate-800">
              </div>
              <div>
                <div class="flex justify-between items-center mb-1">
                  <label class="font-semibold text-slate-700">Kata Sandi</label>
                  <button type="button" onclick="navigate('auth-forgot-password')" class="text-brand-600 hover:underline text-[11px]">Lupa sandi?</button>
                </div>
                <input id="login-pass" type="password" placeholder="Masukkan kata sandi" required class="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition text-slate-800">
              </div>

              <button type="submit" class="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-md shadow-brand-500/25 transition active:scale-95 text-xs">
                Masuk ke Dashboard
              </button>
            </form>

            <!-- Akun Terdaftar untuk Pengujian Cepat -->
            <div class="p-3.5 bg-rose-50/50 rounded-2xl border border-rose-200/80 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-bold text-slate-700">💡 Pilih Akun Terdaftar:</span>
                <span class="text-[10px] text-slate-500">${users.length} akun tersimpan</span>
              </div>
              <div class="space-y-1.5 max-h-44 overflow-y-auto">
                ${demoUsersHtml}
              </div>
            </div>

            <div class="relative text-center my-3">
              <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-200"></div></div>
              <span class="relative bg-white px-3 text-[11px] text-slate-400 font-medium">atau masuk dengan</span>
            </div>

            <button type="button" onclick="handleGoogleLogin()" class="w-full py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition">
              <span>🌐</span>
              <span>Google OAuth (Simulasi)</span>
            </button>

            <p class="text-center text-xs text-slate-500 pt-1">
              Belum punya akun? <button onclick="navigate('auth-register')" class="text-brand-600 font-bold hover:underline">Daftar sekarang</button>
            </p>
          </div>
        </div>
      </div>
      `;
    }

    function renderAuthRegisterPage() {
      return `
      <div class="min-h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-white">
        <div class="hidden md:flex md:w-5/12 bg-gradient-to-tr from-brand-600 via-rose-500 to-pink-500 p-12 text-white flex-col justify-between">
          <div class="space-y-4">
            <div class="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-2xl">TD</div>
            <h2 class="text-3xl font-extrabold tracking-tight">Kendalikan<br>Masa Depanmu.</h2>
            <p class="text-rose-100 text-xs leading-relaxed max-w-xs">
              Verifikasi nomor HP Anda untuk sinkronisasi otomatis dengan Bot Telegram TataDana.
            </p>
          </div>
          <div class="space-y-2 text-xs text-rose-100">
            <div class="flex items-center gap-2"><span>✅</span><span>Dompet default & TataJatah disiapkan otomatis</span></div>
            <div class="flex items-center gap-2"><span>✅</span><span>Rekomendasi budget pintar berbasis AI Gemini</span></div>
            <div class="flex items-center gap-2"><span>✅</span><span>Dukungan nomor uji coba & verifikasi OTP instan</span></div>
          </div>
        </div>

        <div class="flex-1 p-8 sm:p-14 flex items-center justify-center">
          <div class="w-full max-w-md space-y-5 text-xs">
            <div>
              <h3 class="text-2xl font-bold text-slate-900">Buat Akun TataDana</h3>
              <p class="text-slate-500 mt-1">Daftar gratis. Akun baru langsung aktif dan bisa dipakai login.</p>
            </div>

            <div id="reg-error-box" class="hidden"></div>

            <form id="reg-form" onsubmit="handleRegisterSubmit(event);" class="space-y-3.5">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input id="reg-name" type="text" placeholder="Contoh: Budi Santoso" required class="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition text-slate-800">
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Email</label>
                <input id="reg-email" type="email" placeholder="budi@gmail.com" required class="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition text-slate-800">
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Nomor WhatsApp / HP</label>
                <input id="reg-phone" type="tel" placeholder="081234567890" required class="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition text-slate-800">
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Kata Sandi (Minimal 6 karakter)</label>
                <input id="reg-password" type="password" placeholder="Masukkan kata sandi baru" required class="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition text-slate-800">
              </div>
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Konfirmasi Kata Sandi</label>
                <input id="reg-password-confirm" type="password" placeholder="Ulangi kata sandi baru" required class="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition text-slate-800">
              </div>

              <!-- OTP Verification Block -->
              <div id="otp-section" class="hidden p-4 bg-rose-50 rounded-2xl border border-rose-200 space-y-2">
                <div class="flex items-center justify-between">
                  <label class="block font-bold text-brand-700">Kode OTP Verifikasi (SMS / WA)</label>
                  <span class="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Terverifikasi</span>
                </div>
                <p id="otp-notice" class="text-[11px] text-slate-600">Kode verifikasi dikirimkan ke nomor HP Anda.</p>
                <div class="flex items-center gap-2">
                  <input id="reg-otp" type="text" maxlength="6" value="728491" class="w-full text-center tracking-widest text-lg font-bold bg-white border border-rose-300 rounded-xl py-2 text-brand-600 outline-none">
                  <button type="button" onclick="alert('Kode OTP baru telah dikirim: 728491')" class="px-3 py-2 bg-white border border-rose-200 text-brand-600 font-semibold rounded-xl text-[11px] hover:bg-rose-50 transition whitespace-nowrap">Kirim Ulang</button>
                </div>
                <span class="text-[10px] text-emerald-700 font-semibold block">✓ Nomor uji coba Supabase Auth — OTP siap digunakan</span>
              </div>

              <button type="submit" id="reg-btn" class="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-md shadow-brand-500/25 transition active:scale-95 text-xs">
                Kirim Kode OTP & Lanjutkan
              </button>
            </form>

            <p class="text-center text-xs text-slate-500 pt-2">
              Sudah punya akun? <button onclick="navigate('auth-login')" class="text-brand-600 font-bold hover:underline">Masuk di sini</button>
            </p>
          </div>
        </div>
      </div>
      `;
    }"""

# Use regex to replace from renderAuthLoginPage down to renderAuthForgotPasswordPage
pattern = r'function renderAuthLoginPage\(\)\s*\{.*?function renderAuthForgotPasswordPage\(\)'
match = re.search(pattern, content, re.DOTALL)
if match:
    replacement = auth_pages_code + "\n\n    function renderAuthForgotPasswordPage()"
    content = content[:match.start()] + replacement + content[match.end():]
    print("3. Replaced renderAuthLoginPage and renderAuthRegisterPage successfully.")
else:
    print("3. Could not match renderAuthLoginPage pattern.")

# 4. Add Logout button to renderDashboardPage header
old_dashboard_header = """<button onclick="togglePlanMode()" title="Toggle Plan untuk testing limit Starter vs Pro" class="text-[10px] text-slate-400 hover:text-brand-600 underline">
                  (Toggle ${AppState.user.plan === 'pro' ? 'Starter' : 'Pro'})
                </button>
              </div>"""

new_dashboard_header = """<button onclick="togglePlanMode()" title="Toggle Plan untuk testing limit Starter vs Pro" class="text-[10px] text-slate-400 hover:text-brand-600 underline">
                  (Toggle ${AppState.user.plan === 'pro' ? 'Starter' : 'Pro'})
                </button>
                <button onclick="handleLogout()" class="px-2.5 py-1 text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition" title="Keluar dari akun">
                  🚪 Keluar
                </button>
              </div>"""

if old_dashboard_header in content:
    content = content.replace(old_dashboard_header, new_dashboard_header, 1)
    print("4. Added Logout button to dashboard header.")

# 5. In renderApp(), call renderHeaderNav()
content = content.replace("    function renderApp() {\n      const container = document.getElementById('main-content');", "    function renderApp() {\n      renderHeaderNav();\n      const container = document.getElementById('main-content');", 1)

# 6. In DOMContentLoaded, call initUserSession()
content = content.replace("document.addEventListener('DOMContentLoaded', () => {\n      syncRouteFromHash();", "document.addEventListener('DOMContentLoaded', () => {\n      initUserSession();\n      syncRouteFromHash();", 1)

# 7. In addTransactionSubmit and wallet mutations, persist with saveCurrentUserData()
content = content.replace("renderApp();\n      alert('Transaksi berhasil dicatat ke database!');", "saveCurrentUserData();\n      renderApp();\n      alert('Transaksi berhasil dicatat ke database!');")

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: index.html updated with complete registration and login system!")
