# -*- coding: utf-8 -*-
"""
Script to patch public/index.html:
1. Fix TataJatah hardcoded date 13: make it dynamically use current WIB date (e.g. 14 Okt+), dynamic payday countdown, and dynamic calendar.
2. Update icons:
   - Chat Bot icon: replace ✈️ with 💬
   - User Guide icon: replace 📖 with 📘
3. Rename all 'Tata Cara Pakai' / 'Tata Cara Penggunaan' to 'User Guide'.
4. Add 'FAQ & Help Center' button in the top navigation bar (desktop & mobile).
5. Add '#faq-help-center-modal' with search filter, categorized FAQ accordions, and support contacts.
6. Fix new manual transaction creation to record current WIB date and dayNum instead of hardcoded 13.
"""

import sys
import re

INDEX_PATH = r"C:\Users\Asus\.gemini\antigravity\scratch\tatadana\public\index.html"

def main():
    with open(INDEX_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    orig_len = len(content)
    print(f"Original content length: {orig_len}")

    # =========================================================================
    # 1. ADD FAQ & HELP CENTER MODAL HTML right before the app-guide-modal
    # =========================================================================
    faq_modal_html = '''
  <!-- MODAL FAQ & HELP CENTER (PUSAT BANTUAN TANDANA) -->
  <div id="faq-help-center-modal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm hidden flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-rose-100 overflow-hidden flex flex-col max-h-[90vh]">
      <!-- Header Modal -->
      <div class="bg-gradient-to-r from-brand-600 via-rose-500 to-pink-500 px-6 py-4 flex items-center justify-between text-white shadow-md">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xl shadow-sm">❓</div>
          <div>
            <h3 class="font-bold text-base">FAQ & Help Center TataDana</h3>
            <p class="text-xs text-rose-100">Pusat bantuan, panduan lengkap, dan jawaban pertanyaan umum</p>
          </div>
        </div>
        <button onclick="closeFaqHelpModal()" class="text-white/80 hover:text-white text-xl font-bold transition">✕</button>
      </div>

      <!-- Search & Category Filters -->
      <div class="p-4 bg-rose-50/50 border-b border-rose-100 space-y-3">
        <div class="relative">
          <input type="text" id="faq-search-input" oninput="searchFaq(this.value)" placeholder="🔍 Cari pertanyaan atau kata kunci bantuan (contoh: bot, gajian, transfer, struk, budget)..." class="w-full bg-white border border-rose-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500">
        </div>
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button data-category="all" onclick="filterFaqCategory('all')" class="faq-category-btn px-3 py-1.5 rounded-xl font-bold text-xs bg-brand-500 text-white shadow-sm transition">Semua</button>
          <button data-category="umum" onclick="filterFaqCategory('umum')" class="faq-category-btn px-3 py-1.5 rounded-xl font-semibold text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 transition">📌 Umum</button>
          <button data-category="bot" onclick="filterFaqCategory('bot')" class="faq-category-btn px-3 py-1.5 rounded-xl font-semibold text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 transition">💬 Telegram Bot</button>
          <button data-category="jatah" onclick="filterFaqCategory('jatah')" class="faq-category-btn px-3 py-1.5 rounded-xl font-semibold text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 transition">🎯 TataJatah</button>
          <button data-category="pro" onclick="filterFaqCategory('pro')" class="faq-category-btn px-3 py-1.5 rounded-xl font-semibold text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 transition">💎 Paket Pro & Bayar</button>
          <button data-category="kontak" onclick="filterFaqCategory('kontak')" class="faq-category-btn px-3 py-1.5 rounded-xl font-semibold text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 transition">📞 Hubungi Support</button>
        </div>
      </div>

      <!-- FAQ Items Body -->
      <div id="faq-items-container" class="p-6 overflow-y-auto space-y-3 text-xs text-slate-700 leading-relaxed">
        
        <!-- FAQ 1: Umum -->
        <div class="faq-item bg-white border border-rose-100 rounded-2xl overflow-hidden shadow-2xs" data-category="umum">
          <div class="p-3.5 bg-rose-50/40 hover:bg-rose-50 cursor-pointer flex items-center justify-between font-bold text-slate-900 transition" onclick="toggleFaqAccordion('faq-ans-1')">
            <span class="flex items-center gap-2"><span>❓</span> Apa itu TataDana dan bagaimana cara kerjanya?</span>
            <span id="faq-ans-1-icon" class="text-rose-500 font-bold">▼</span>
          </div>
          <div id="faq-ans-1" class="hidden p-4 border-t border-rose-100 bg-white text-slate-600 space-y-2">
            <p>TataDana adalah platform manajemen keuangan pribadi modern yang terintegrasi langsung dengan Telegram Bot dan Web App. Anda cukup mengirim pesan natural sehari-hari, rekaman suara (Voice Note), atau foto struk belanja ke bot Telegram.</p>
            <p>Semua data transaksi otomatis tersimpan 100% secara real-time ke database Supabase dan langsung tampil di Dashboard Web Anda tanpa perlu input manual berulang.</p>
          </div>
        </div>

        <!-- FAQ 2: Keamanan & Akun -->
        <div class="faq-item bg-white border border-rose-100 rounded-2xl overflow-hidden shadow-2xs" data-category="umum">
          <div class="p-3.5 bg-rose-50/40 hover:bg-rose-50 cursor-pointer flex items-center justify-between font-bold text-slate-900 transition" onclick="toggleFaqAccordion('faq-ans-2')">
            <span class="flex items-center gap-2"><span>🔒</span> Apakah data keuangan saya aman dan terisolasi dari akun lain?</span>
            <span id="faq-ans-2-icon" class="text-rose-500 font-bold">▼</span>
          </div>
          <div id="faq-ans-2" class="hidden p-4 border-t border-rose-100 bg-white text-slate-600 space-y-2">
            <p>Sangat aman. TataDana menggunakan Row Level Security (RLS) PostgreSQL pada Supabase dan enkripsi token. Data setiap akun terisolasi penuh: saat Anda membuat akun baru, data Anda bersih dimulai dari saldo Rp 0, 0 pemasukan, dan 0 pengeluaran.</p>
          </div>
        </div>

        <!-- FAQ 3: Bot Telegram -->
        <div class="faq-item bg-white border border-rose-100 rounded-2xl overflow-hidden shadow-2xs" data-category="bot">
          <div class="p-3.5 bg-rose-50/40 hover:bg-rose-50 cursor-pointer flex items-center justify-between font-bold text-slate-900 transition" onclick="toggleFaqAccordion('faq-ans-3')">
            <span class="flex items-center gap-2"><span>💬</span> Bagaimana cara menghubungkan akun TataDana dengan Telegram Bot?</span>
            <span id="faq-ans-3-icon" class="text-rose-500 font-bold">▼</span>
          </div>
          <div id="faq-ans-3" class="hidden p-4 border-t border-rose-100 bg-white text-slate-600 space-y-2">
            <p>1. Buka menu <strong>Pengaturan</strong> &gt; Tab <strong>Telegram</strong> di Dashboard TataDana.<br>
            2. Klik tombol <strong>"Hubungkan Telegram"</strong> untuk melihat kode tautan (contoh: <code>LINK-8849</code>).<br>
            3. Buka Telegram dan kirim perintah <code>/start LINK-8849</code> ke bot kami. Status koneksi akan seketika berubah menjadi 🟢 <strong>Terhubung</strong>.</p>
          </div>
        </div>

        <!-- FAQ 4: Format Chat Bot -->
        <div class="faq-item bg-white border border-rose-100 rounded-2xl overflow-hidden shadow-2xs" data-category="bot">
          <div class="p-3.5 bg-rose-50/40 hover:bg-rose-50 cursor-pointer flex items-center justify-between font-bold text-slate-900 transition" onclick="toggleFaqAccordion('faq-ans-4')">
            <span class="flex items-center gap-2"><span>🤖</span> Kalimat dan perintah apa saja yang bisa dipahami oleh bot?</span>
            <span id="faq-ans-4-icon" class="text-rose-500 font-bold">▼</span>
          </div>
          <div id="faq-ans-4" class="hidden p-4 border-t border-rose-100 bg-white text-slate-600 space-y-2">
            <p>AI TataDana mengenali format bahasa santai Indonesia:<br>
            • <em>"beli bakso 15rb"</em> (Otomatis pengeluaran Rp 15.000 ke kategori Makanan)<br>
            • <em>"kopi 28k pakai gopay"</em> (Pengeluaran dompet GoPay)<br>
            • <em>"gajian 6jt masuk bca"</em> (Pemasukan Rp 6.000.000 ke BCA)<br>
            • <em>"transfer 100rb dari bca ke gopay"</em> (Mutasi antar dompet)<br>
            • Perintah cepat: <code>/saldo</code>, <code>/jatah</code>, <code>/budget</code>, <code>/hari ini</code>, <code>/minggu ini</code>, <code>/bulan ini</code>, <code>/rekap</code>, <code>/bantuan</code>.<br>
            • Anda juga bisa kirim <strong>Voice Note</strong> atau <strong>Foto Struk Belanja</strong> (AI OCR Vision multi-item).</p>
          </div>
        </div>

        <!-- FAQ 5: TataJatah -->
        <div class="faq-item bg-white border border-rose-100 rounded-2xl overflow-hidden shadow-2xs" data-category="jatah">
          <div class="p-3.5 bg-rose-50/40 hover:bg-rose-50 cursor-pointer flex items-center justify-between font-bold text-slate-900 transition" onclick="toggleFaqAccordion('faq-ans-5')">
            <span class="flex items-center gap-2"><span>🎯</span> Bagaimana cara kerja fitur signature "TataJatah"?</span>
            <span id="faq-ans-5-icon" class="text-rose-500 font-bold">▼</span>
          </div>
          <div id="faq-ans-5" class="hidden p-4 border-t border-rose-100 bg-white text-slate-600 space-y-2">
            <p>TataJatah menghitung <strong>Jatah Harian Aman</strong> Anda setiap hari secara dinamis berdasarkan zona waktu WIB:<br>
            <code class="block font-mono bg-rose-50 text-brand-600 p-2 rounded-xl border border-rose-100 my-1">Jatah Harian = (Saldo Dompet - Tagihan Wajib Belum Bayar - Target Tabungan) ÷ Sisa Hari ke Gajian</code>
            Jika pengeluaran hari ini masih di bawah batas jatah harian, status Anda 🟢 <strong>Aman</strong> dan Streak kedisiplinan 🔥 Anda bertambah.</p>
          </div>
        </div>

        <!-- FAQ 6: Lewat Jatah -->
        <div class="faq-item bg-white border border-rose-100 rounded-2xl overflow-hidden shadow-2xs" data-category="jatah">
          <div class="p-3.5 bg-rose-50/40 hover:bg-rose-50 cursor-pointer flex items-center justify-between font-bold text-slate-900 transition" onclick="toggleFaqAccordion('faq-ans-6')">
            <span class="flex items-center gap-2"><span>⚠️</span> Apa yang terjadi jika pengeluaran saya melebihi jatah harian?</span>
            <span id="faq-ans-6-icon" class="text-rose-500 font-bold">▼</span>
          </div>
          <div id="faq-ans-6" class="hidden p-4 border-t border-rose-100 bg-white text-slate-600 space-y-2">
            <p>Status akan berubah menjadi 🔴 <strong>Lewat Jatah</strong>. Algoritma TataJatah akan otomatis membagi sisa saldo tersisa ke hari-hari berikutnya, sehingga batas jatah harian hari berikutnya disesuaikan agar Anda tetap bertahan tanpa defisit sampai hari gajian.</p>
          </div>
        </div>

        <!-- FAQ 7: Paket Pro & Midtrans -->
        <div class="faq-item bg-white border border-rose-100 rounded-2xl overflow-hidden shadow-2xs" data-category="pro">
          <div class="p-3.5 bg-rose-50/40 hover:bg-rose-50 cursor-pointer flex items-center justify-between font-bold text-slate-900 transition" onclick="toggleFaqAccordion('faq-ans-7')">
            <span class="flex items-center gap-2"><span>💎</span> Apa keunggulan Paket Pro dibanding Starter?</span>
            <span id="faq-ans-7-icon" class="text-rose-500 font-bold">▼</span>
          </div>
          <div id="faq-ans-7" class="hidden p-4 border-t border-rose-100 bg-white text-slate-600 space-y-2">
            <p>• <strong>Starter (Rp 49.000/tahun):</strong> Teks bot tanpa batas, voice note dasar, multi-wallet 3 dompet, laporan bulanan.<br>
            • <strong>Pro (Rp 99.000/tahun):</strong> Semua fitur Starter + OCR Foto Struk Belanja multi-item tanpa batas, unlimited dompet, AI Financial Advisor proaktif, export PDF & Excel bertanda tangan digital, serta prioritas CS 24/7.</p>
          </div>
        </div>

        <!-- FAQ 8: Layanan Support & Kontak -->
        <div class="faq-item bg-white border border-rose-100 rounded-2xl overflow-hidden shadow-2xs" data-category="kontak">
          <div class="p-3.5 bg-rose-50/40 hover:bg-rose-50 cursor-pointer flex items-center justify-between font-bold text-slate-900 transition" onclick="toggleFaqAccordion('faq-ans-8')">
            <span class="flex items-center gap-2"><span>📞</span> Bagaimana cara menghubungi Customer Support jika mengalami kendala?</span>
            <span id="faq-ans-8-icon" class="text-rose-500 font-bold">▼</span>
          </div>
          <div id="faq-ans-8" class="p-4 border-t border-rose-100 bg-white text-slate-600 space-y-3">
            <p>Tim Customer Support TataDana siap membantu Anda setiap hari (Senin - Minggu, 08:00 - 21:00 WIB):</p>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <a href="https://wa.me/6281234567890" target="_blank" class="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-center transition flex flex-col items-center">
                <span class="text-xl">💬</span>
                <span class="font-bold text-emerald-800 text-[11px] mt-1">WhatsApp CS</span>
                <span class="text-[9px] text-emerald-600">+62 812-3456-7890</span>
              </a>
              <a href="mailto:support@tatadana.id" class="p-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-center transition flex flex-col items-center">
                <span class="text-xl">✉️</span>
                <span class="font-bold text-brand-800 text-[11px] mt-1">Email Resmi</span>
                <span class="text-[9px] text-brand-600">support@tatadana.id</span>
              </a>
              <a href="https://t.me/tatadana_support" target="_blank" class="p-3 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl text-center transition flex flex-col items-center">
                <span class="text-xl">✈️</span>
                <span class="font-bold text-sky-800 text-[11px] mt-1">Telegram CS</span>
                <span class="text-[9px] text-sky-600">@tatadana_support</span>
              </a>
            </div>
          </div>
        </div>

      </div>

      <!-- Footer Modal -->
      <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <span class="text-xs text-slate-500 font-medium">Butuh panduan lengkap? Klik User Guide.</span>
        <div class="flex items-center gap-2">
          <button onclick="closeFaqHelpModal()" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition">Tutup</button>
          <button onclick="closeFaqHelpModal(); openAppGuideModal();" class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-1.5">
            <span>📘</span>
            <span>Buka User Guide</span>
          </button>
        </div>
      </div>
    </div>
  </div>
'''

    if 'id="faq-help-center-modal"' not in content:
        content = content.replace('<!-- STANDALONE MODAL TATA CARA PENGGUNAAN APLIKASI -->', faq_modal_html + '\n  <!-- STANDALONE MODAL USER GUIDE -->')
        content = content.replace('<!-- STANDALONE MODAL USER GUIDE -->', faq_modal_html + '\n  <!-- STANDALONE MODAL USER GUIDE -->') if 'id="faq-help-center-modal"' not in content else content

    # =========================================================================
    # 2. UPDATE MODAL TATA CARA PENGGUNAAN -> USER GUIDE
    # =========================================================================
    content = content.replace('<div class="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xl shadow-sm">📖</div>', '<div class="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xl shadow-sm">📘</div>')
    content = content.replace('<h3 class="font-bold text-base">Tata Cara Penggunaan TataDana</h3>', '<h3 class="font-bold text-base">User Guide TataDana</h3>')

    # In top of bot simulator
    content = content.replace('<!-- TATA CARA PENGGUNAAN APLIKASI & BOT (TEPAT DI ATAS CHAT BOT) -->', '<!-- USER GUIDE & TATA CARA (TEPAT DI ATAS CHAT BOT) -->')
    content = content.replace('<span class="text-base">📖</span>\n            <span>Tata Cara Penggunaan Bot & Aplikasi</span>', '<span class="text-base">📘</span>\n            <span>User Guide & Panduan Bot</span>')
    content = content.replace('<span class="text-base">📖</span>\r\n            <span>Tata Cara Penggunaan Bot & Aplikasi</span>', '<span class="text-base">📘</span>\r\n            <span>User Guide & Panduan Bot</span>')
    
    # In quick bar in bot simulator
    old_qb = '''<button onclick="toggleBotGuide(true)" class="bg-amber-100 border border-amber-300 text-amber-900 hover:bg-amber-200 px-2.5 py-1 rounded-full whitespace-nowrap font-bold transition flex items-center gap-1 shadow-2xs">
          <span>📖</span>
          <span>Tata Cara Penggunaan</span>
        </button>'''
    new_qb = '''<button onclick="toggleBotGuide(true)" class="bg-amber-100 border border-amber-300 text-amber-900 hover:bg-amber-200 px-2.5 py-1 rounded-full whitespace-nowrap font-bold transition flex items-center gap-1 shadow-2xs">
          <span>📘</span>
          <span>User Guide</span>
        </button>'''
    content = content.replace(old_qb, new_qb)
    content = content.replace('<span>📖</span>\n          <span>Tata Cara Penggunaan</span>', '<span>📘</span>\n          <span>User Guide</span>')
    content = content.replace('<span>📖</span>\r\n          <span>Tata Cara Penggunaan</span>', '<span>📘</span>\r\n          <span>User Guide</span>')

    # =========================================================================
    # 3. UPDATE STATIC NAV HEADER (lines ~70-98)
    # =========================================================================
    # Add FAQ & Help Center button in desktop static nav & right CTAs
    old_static_right_cta = '''      <!-- Right CTAs -->
      <div id="nav-auth-buttons" class="flex items-center space-x-3">
        <button onclick="openTelegramSimulator()" class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-600 border border-sky-200 rounded-lg text-xs font-semibold hover:bg-sky-100 transition shadow-sm">
          <span>✈️</span>
          <span>Simulator Telegram</span>
        </button>
        <button onclick="navigate('auth-login')" class="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-brand-600 transition">Masuk</button>
        <button onclick="navigate('auth-register')" class="px-4 py-2 text-xs font-bold bg-brand-500 text-white rounded-xl shadow-md shadow-brand-500/25 hover:bg-brand-600 hover:shadow-brand-500/35 transition active:scale-95">Daftar Akun</button>
      </div>'''

    new_static_right_cta = '''      <!-- Right CTAs -->
      <div id="nav-auth-buttons" class="flex items-center space-x-2">
        <button onclick="openAppGuideModal()" class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold hover:bg-amber-100 transition shadow-sm" title="User Guide TataDana">
          <span>📘</span>
          <span>User Guide</span>
        </button>
        <button onclick="openFaqHelpModal()" class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold hover:bg-rose-100 transition shadow-sm" title="FAQ & Help Center TataDana">
          <span>❓</span>
          <span>FAQ & Help Center</span>
        </button>
        <button onclick="openTelegramSimulator()" class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-600 border border-sky-200 rounded-lg text-xs font-semibold hover:bg-sky-100 transition shadow-sm">
          <span>💬</span>
          <span>Chat Bot Telegram</span>
        </button>
        <button onclick="navigate('auth-login')" class="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-brand-600 transition">Masuk</button>
        <button onclick="navigate('auth-register')" class="px-4 py-2 text-xs font-bold bg-brand-500 text-white rounded-xl shadow-md shadow-brand-500/25 hover:bg-brand-600 hover:shadow-brand-500/35 transition active:scale-95">Daftar Akun</button>
      </div>'''
    content = content.replace(old_static_right_cta, new_static_right_cta)

    # In center nav links, add FAQ & Help Center button as well
    old_nav_faq = """<button onclick="navigate('landing', 'faq')" class="hover:text-brand-500 transition">FAQ</button>"""
    new_nav_faq = """<button onclick="openFaqHelpModal()" class="hover:text-brand-500 transition flex items-center gap-1 text-slate-700 font-medium"><span>❓</span><span>FAQ & Help Center</span></button>"""
    content = content.replace(old_nav_faq, new_nav_faq)

    # =========================================================================
    # 4. UPDATE DYNAMIC renderHeaderNav() FUNCTION
    # =========================================================================
    # Replace renderHeaderNav implementation
    nav_fn_pattern = r"function renderHeaderNav\(\) \{[\s\S]*?function handleLogout\(\)"
    
    new_nav_fn = '''function renderHeaderNav() {
      const container = document.getElementById('nav-auth-buttons');
      if (!container) return;
      const isAuthPage = AppState.currentPage === 'auth-login' || AppState.currentPage === 'auth-register' || AppState.currentPage === 'auth-forgot-password';
      const activeUser = AppState.user;

      if (activeUser && activeUser.id && !isAuthPage) {
        container.innerHTML = `
          <button onclick="openAppGuideModal()" class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold hover:bg-amber-100 transition shadow-sm" title="User Guide TataDana">
            <span>📘</span>
            <span>User Guide</span>
          </button>
          <button onclick="openFaqHelpModal()" class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold hover:bg-rose-100 transition shadow-sm" title="FAQ & Help Center TataDana">
            <span>❓</span>
            <span>FAQ & Help Center</span>
          </button>
          <button onclick="openTelegramSimulator()" class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-600 border border-sky-200 rounded-lg text-xs font-semibold hover:bg-sky-100 transition shadow-sm">
            <span>💬</span>
            <span>Chat Bot</span>
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
          <button onclick="openAppGuideModal()" class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold hover:bg-amber-100 transition shadow-sm" title="User Guide TataDana">
            <span>📘</span>
            <span>User Guide</span>
          </button>
          <button onclick="openFaqHelpModal()" class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold hover:bg-rose-100 transition shadow-sm" title="FAQ & Help Center TataDana">
            <span>❓</span>
            <span>FAQ & Help Center</span>
          </button>
          <button onclick="openTelegramSimulator()" class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-600 border border-sky-200 rounded-lg text-xs font-semibold hover:bg-sky-100 transition shadow-sm">
            <span>💬</span>
            <span>Chat Bot</span>
          </button>
          <button onclick="navigate('auth-login')" class="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-brand-600 transition">Masuk</button>
          <button onclick="navigate('auth-register')" class="px-4 py-2 text-xs font-bold bg-brand-500 text-white rounded-xl shadow-md shadow-brand-500/25 hover:bg-brand-600 hover:shadow-brand-500/35 transition active:scale-95">Daftar Akun</button>
        `;
      }
    }

    function handleLogout()'''
    
    content = re.sub(nav_fn_pattern, new_nav_fn, content, count=1)

    # =========================================================================
    # 5. DYNAMIC WIB DATE HELPER & TATAJATAH STATE FIX
    # =========================================================================
    # Let's inspect getTataJatahState() and replace it with dynamic calculation
    old_jatah_state = '''    // Hitung TataJatah Realtime
    function getTataJatahState() {
      const totalBalance = AppState.wallets.filter(w => !w.isArchived).reduce((acc, w) => acc + w.balance, 0);
      const unpaidBills = AppState.bills.filter(b => !b.isPaid).reduce((acc, b) => acc + b.amount, 0);
      const savings = AppState.jatahConfig.monthlySavingsTarget;
      const today = 13; // 13 Okt
      const daysLeft = Math.max(1, AppState.jatahConfig.paydayDate - today);
      const usableBalance = Math.max(0, totalBalance - unpaidBills - savings);
      const safeDailyAllowance = Math.round(usableBalance / daysLeft);

      // Total spent today (tgl 13)
      const todaySpent = AppState.transactions.filter(t => t.dayNum === today && t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
      let spentPct = 0;
      let status = 'aman';
      if (safeDailyAllowance > 0) {
        spentPct = Math.round((todaySpent / safeDailyAllowance) * 100);
        if (spentPct > 100) status = 'lewat';
        else if (spentPct >= 70) status = 'hati_hati';
      } else {
        if (todaySpent > 0) {
          spentPct = 999;
          status = 'lewat';
        }
      }

      const remainingToday = Math.max(0, safeDailyAllowance - todaySpent);

      return {
        totalBalance,
        unpaidBills,
        savings,
        daysLeft,
        safeDailyAllowance,
        todaySpent,
        remainingToday,
        spentPct,
        status,
        streakDays: AppState.jatahConfig.streakDays,
      };
    }'''

    new_jatah_state = '''    // Helper WIB Date (Asia/Jakarta, UTC+7)
    function getWIBDate() {
      try {
        const str = new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
        return new Date(str);
      } catch(e) {
        return new Date();
      }
    }

    // Hitung TataJatah Realtime (Dinamis Mengikuti Tanggal Hari Ini WIB)
    function getTataJatahState() {
      const totalBalance = AppState.wallets.filter(w => !w.isArchived).reduce((acc, w) => acc + w.balance, 0);
      const unpaidBills = AppState.bills.filter(b => !b.isPaid).reduce((acc, b) => acc + b.amount, 0);
      const savings = AppState.jatahConfig.monthlySavingsTarget;
      
      const nowWIB = getWIBDate();
      const today = nowWIB.getDate();
      const currentMonth = nowWIB.getMonth();
      const currentYear = nowWIB.getFullYear();
      const monthsIndoShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
      const monthsIndoFull = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const currentMonthName = monthsIndoShort[currentMonth];
      const currentFullMonthName = monthsIndoFull[currentMonth];

      // Perhitungan sisa hari sampai gajian dinamis
      const payday = AppState.jatahConfig.paydayDate || 25;
      let daysLeft = 1;
      if (today < payday) {
        daysLeft = payday - today;
      } else if (today === payday) {
        daysLeft = 1; // Hari gajian!
      } else {
        // Jika sudah lewat tanggal gajian bulan ini, hitung sisa hari ke gajian bulan berikutnya
        const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        daysLeft = (daysInCurrentMonth - today) + payday;
      }
      daysLeft = Math.max(1, daysLeft);

      const usableBalance = Math.max(0, totalBalance - unpaidBills - savings);
      const safeDailyAllowance = Math.round(usableBalance / daysLeft);

      // Total pengeluaran hari ini dinamis berdasarkan today
      const todaySpent = AppState.transactions.filter(t => t.dayNum === today && t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
      let spentPct = 0;
      let status = 'aman';
      if (safeDailyAllowance > 0) {
        spentPct = Math.round((todaySpent / safeDailyAllowance) * 100);
        if (spentPct > 100) status = 'lewat';
        else if (spentPct >= 70) status = 'hati_hati';
      } else {
        if (todaySpent > 0) {
          spentPct = 999;
          status = 'lewat';
        }
      }

      const remainingToday = Math.max(0, safeDailyAllowance - todaySpent);

      return {
        totalBalance,
        unpaidBills,
        savings,
        usableBalance,
        today,
        currentMonth,
        currentYear,
        currentMonthName,
        currentFullMonthName,
        daysLeft,
        safeDailyAllowance,
        todaySpent,
        remainingToday,
        spentPct,
        status,
        streakDays: AppState.jatahConfig.streakDays,
      };
    }'''

    content = content.replace(old_jatah_state, new_jatah_state)

    # =========================================================================
    # 6. UPDATE BERANDA TAB (Hero card date and countdown)
    # =========================================================================
    content = content.replace(
        '<span class="text-[11px] font-bold text-slate-500">Pengeluaran Hari Ini (13 Okt)</span>',
        '<span class="text-[11px] font-bold text-slate-500">Pengeluaran Hari Ini (${jatah.today} ${jatah.currentMonthName})</span>'
    )
    content = content.replace(
        'menuju gajian (tanggal 25)',
        'menuju gajian (tanggal ${AppState.jatahConfig.paydayDate})'
    )

    # =========================================================================
    # 7. UPDATE KALENDER HEATMAP (Dynamic today marker and status)
    # =========================================================================
    old_cal_loop = '''        let status = 'none';
        if (i < 13) {
          if (spent > jatah.safeDailyAllowance) status = 'lewat';
          else if (spent > 0.7 * jatah.safeDailyAllowance) status = 'hati_hati';
          else if (spent > 0) status = 'aman';
          else status = 'aman';
        } else if (i === 13) {
          status = jatah.status;
        } else {
          status = 'future';
        }'''

    new_cal_loop = '''        let status = 'none';
        if (i < jatah.today) {
          if (spent > jatah.safeDailyAllowance) status = 'lewat';
          else if (spent > 0.7 * jatah.safeDailyAllowance) status = 'hati_hati';
          else if (spent > 0) status = 'aman';
          else status = 'aman';
        } else if (i === jatah.today) {
          status = jatah.status;
        } else {
          status = 'future';
        }'''
    content = content.replace(old_cal_loop, new_cal_loop)

    content = content.replace(
        'd.day === 13 ?',
        'd.day === jatah.today ?'
    )
    content = content.replace(
        'Kalender Heatmap TataJatah (Oktober 2026)',
        'Kalender Heatmap TataJatah (${jatah.currentFullMonthName} ${jatah.currentYear})'
    )
    content = content.replace(
        "if (title) title.innerText = `Detail Transaksi — ${dayNum} Oktober 2026`;",
        "const nowWIB = getWIBDate(); const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']; if (title) title.innerText = `Detail Transaksi — ${dayNum} ${months[nowWIB.getMonth()]} ${nowWIB.getFullYear()}`;"
    )

    # =========================================================================
    # 8. UPDATE SETTINGS SUBTAB LABEL (Panduan Cara Pakai -> User Guide)
    # =========================================================================
    content = content.replace('📖 Panduan Cara Pakai', '📘 User Guide')
    content = content.replace('Panduan Cara Pakai Bot TataDana 🤖', 'User Guide & Panduan Bot TataDana 📘')

    # =========================================================================
    # 9. UPDATE MANUAL TRANSACTION & TRANSFER CREATION (Dynamic Date)
    # =========================================================================
    old_tx_submit = '''      if (currentTxType === 'transfer') {
        const fromW = walInput?.value || 'BCA Utama';
        const toW = destWalInput?.value || 'GoPay';
        AppState.transactions.unshift({
          id: `tx-${Date.now()}`,
          date: '13 Okt 2026, 14:45 WIB',
          dayNum: 13,
          type: 'transfer',
          amount: amount,
          category: '🔄 Transfer Antar Dompet',
          wallet: `${fromW} ➔ ${toW}`,
          notes: notInput?.value || `Transfer ke ${toW}`,
          source: 'web'
        });

        // Update balances
        const s = AppState.wallets.find(w => w.name === fromW);
        const d = AppState.wallets.find(w => w.name === toW);
        if (s) s.balance -= amount;
        if (d) d.balance += amount;
      } else {
        AppState.transactions.unshift({
          id: `tx-${Date.now()}`,
          date: '13 Okt 2026, 14:45 WIB',
          dayNum: 13,
          type: currentTxType,
          amount: amount,
          category: catInput?.value || '🍜 Makanan & Minuman',
          wallet: walInput?.value || 'BCA Utama',
          notes: notInput?.value || (currentTxType === 'income' ? 'Pemasukan Manual' : 'Pengeluaran Manual'),
          source: 'web'
        });'''

    new_tx_submit = '''      const nowWIB = getWIBDate();
      const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
      const currentDayNum = nowWIB.getDate();
      const currentTxDateStr = `${currentDayNum} ${monthsShort[nowWIB.getMonth()]} ${nowWIB.getFullYear()}, ${String(nowWIB.getHours()).padStart(2,'0')}:${String(nowWIB.getMinutes()).padStart(2,'0')} WIB`;

      if (currentTxType === 'transfer') {
        const fromW = walInput?.value || 'BCA Utama';
        const toW = destWalInput?.value || 'GoPay';
        AppState.transactions.unshift({
          id: `tx-${Date.now()}`,
          date: currentTxDateStr,
          dayNum: currentDayNum,
          type: 'transfer',
          amount: amount,
          category: '🔄 Transfer Antar Dompet',
          wallet: `${fromW} ➔ ${toW}`,
          notes: notInput?.value || `Transfer ke ${toW}`,
          source: 'web'
        });

        // Update balances
        const s = AppState.wallets.find(w => w.name === fromW);
        const d = AppState.wallets.find(w => w.name === toW);
        if (s) s.balance -= amount;
        if (d) d.balance += amount;
      } else {
        AppState.transactions.unshift({
          id: `tx-${Date.now()}`,
          date: currentTxDateStr,
          dayNum: currentDayNum,
          type: currentTxType,
          amount: amount,
          category: catInput?.value || '🍜 Makanan & Minuman',
          wallet: walInput?.value || 'BCA Utama',
          notes: notInput?.value || (currentTxType === 'income' ? 'Pemasukan Manual' : 'Pengeluaran Manual'),
          source: 'web'
        });'''

    content = content.replace(old_tx_submit, new_tx_submit)

    # =========================================================================
    # 10. ADD FAQ MODAL JAVASCRIPT HANDLERS
    # =========================================================================
    faq_handlers_js = '''
    // =========================================================================
    // FAQ & HELP CENTER HANDLERS
    // =========================================================================
    function openFaqHelpModal() {
      const modal = document.getElementById('faq-help-center-modal');
      if (modal) modal.classList.remove('hidden');
    }

    function closeFaqHelpModal() {
      const modal = document.getElementById('faq-help-center-modal');
      if (modal) modal.classList.add('hidden');
    }

    function toggleFaqAccordion(id) {
      const el = document.getElementById(id);
      const icon = document.getElementById(id + '-icon');
      if (!el) return;
      if (el.classList.contains('hidden')) {
        el.classList.remove('hidden');
        if (icon) icon.innerText = '▲';
      } else {
        el.classList.add('hidden');
        if (icon) icon.innerText = '▼';
      }
    }

    function filterFaqCategory(cat) {
      const buttons = document.querySelectorAll('.faq-category-btn');
      buttons.forEach(btn => {
        if (btn.dataset.category === cat) {
          btn.className = 'faq-category-btn px-3 py-1.5 rounded-xl font-bold text-xs bg-brand-500 text-white shadow-sm transition';
        } else {
          btn.className = 'faq-category-btn px-3 py-1.5 rounded-xl font-semibold text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 transition';
        }
      });
      const items = document.querySelectorAll('.faq-item');
      items.forEach(item => {
        if (cat === 'all' || item.dataset.category === cat) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    }

    function searchFaq(query) {
      const q = query.toLowerCase().trim();
      const items = document.querySelectorAll('.faq-item');
      items.forEach(item => {
        const text = item.innerText.toLowerCase();
        if (!q || text.includes(q)) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    }
'''

    if 'function openFaqHelpModal()' not in content:
        content = content.replace('function openAppGuideModal() {', faq_handlers_js + '\n    function openAppGuideModal() {')

    # Other icon replacements
    content = content.replace('<span>✈️</span>\n          <span>Simulator Telegram</span>', '<span>💬</span>\n          <span>Simulator Telegram</span>')
    content = content.replace('<span>✈️</span>\r\n          <span>Simulator Telegram</span>', '<span>💬</span>\r\n          <span>Simulator Telegram</span>')
    content = content.replace('✈️ Buka Demo Telegram Bot', '💬 Buka Demo Telegram Bot')
    content = content.replace('Test Telegram Bot</span>', 'Chat Bot</span>')

    with open(INDEX_PATH, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Patched successfully! New length: {len(content)}")

if __name__ == '__main__':
    main()
