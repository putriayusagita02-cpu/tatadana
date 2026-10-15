import os
import re

html_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'index.html')
html_path = os.path.abspath(html_path)

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Insert Guide right above Chat History inside Telegram Modal
guide_banner_html = """      <!-- TATA CARA PENGGUNAAN APLIKASI & BOT (TEPAT DI ATAS CHAT BOT) -->
      <div id="bot-guide-container" class="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-b border-amber-200 px-4 py-2.5 transition-all">
        <div class="flex items-center justify-between cursor-pointer select-none" onclick="toggleBotGuide()">
          <div class="flex items-center space-x-2 text-xs font-bold text-amber-900">
            <span class="text-base">📖</span>
            <span>Tata Cara Penggunaan Bot & Aplikasi</span>
            <span class="text-[9px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">Panduan Interaktif</span>
          </div>
          <button type="button" class="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1">
            <span id="guide-toggle-text">Buka Panduan</span>
            <span id="guide-toggle-icon">▼</span>
          </button>
        </div>

        <!-- Panel Panduan yang Dapat Dibuka/Tutup -->
        <div id="bot-guide-panel" class="hidden mt-2.5 pt-2.5 border-t border-amber-200 space-y-2 text-xs text-slate-700 max-h-64 overflow-y-auto pr-1">
          <!-- Item 1: Cara Catat -->
          <div class="bg-white p-2.5 rounded-xl border border-amber-200 shadow-2xs space-y-1">
            <div class="flex items-center justify-between">
              <h4 class="font-bold text-slate-800 text-[11px] flex items-center gap-1.5 text-rose-600">
                <span>✍️</span> 1. Cara Mencatat Transaksi (Teks, Suara, Foto Struk)
              </h4>
              <span class="text-[9px] text-slate-400 italic">Klik contoh di bawah untuk langsung mencoba</span>
            </div>
            <p class="text-[10px] text-slate-600">Ketik pesan natural di chat bot, AI otomatis memilah jenis transaksi, nominal, dompet, dan kategori:</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px] pt-0.5">
              <div class="p-2 bg-rose-50/70 rounded-lg border border-rose-100 space-y-1">
                <span class="font-bold text-rose-700 block">💸 Catat Pengeluaran:</span>
                <div class="cursor-pointer hover:bg-rose-100 p-1 rounded font-mono text-slate-700 transition" onclick="sendQuickMessage('beli bakso 15rb')">• <code>beli bakso 15rb</code></div>
                <div class="cursor-pointer hover:bg-rose-100 p-1 rounded font-mono text-slate-700 transition" onclick="sendQuickMessage('kopi 28k pakai gopay')">• <code>kopi 28k pakai gopay</code></div>
                <div class="cursor-pointer hover:bg-rose-100 p-1 rounded font-mono text-slate-700 transition" onclick="sendQuickMessage('bayar listrik 200rb via mandiri')">• <code>bayar listrik 200rb via mandiri</code></div>
              </div>
              <div class="p-2 bg-emerald-50/70 rounded-lg border border-emerald-100 space-y-1">
                <span class="font-bold text-emerald-700 block">💰 Catat Pemasukan:</span>
                <div class="cursor-pointer hover:bg-emerald-100 p-1 rounded font-mono text-slate-700 transition" onclick="sendQuickMessage('gajian 5jt masuk bca')">• <code>gajian 5jt masuk bca</code></div>
                <div class="cursor-pointer hover:bg-emerald-100 p-1 rounded font-mono text-slate-700 transition" onclick="sendQuickMessage('bonus freelance 1.5jt')">• <code>bonus freelance 1.5jt</code></div>
                <div class="cursor-pointer hover:bg-emerald-100 p-1 rounded font-mono text-slate-700 transition" onclick="sendQuickMessage('terima transfer 300k')">• <code>terima transfer 300k</code></div>
              </div>
            </div>
            <div class="text-[9px] text-slate-500 pt-1 flex items-center justify-between">
              <span>🎙️ Voice Note: Klik ikon mic untuk rekam suara</span>
              <span>📷 Struk: Klik ikon kamera untuk scan struk belanja (Pro)</span>
            </div>
          </div>

          <!-- Item 2: Cara Pilih Dompet -->
          <div class="bg-white p-2.5 rounded-xl border border-amber-200 shadow-2xs space-y-1">
            <h4 class="font-bold text-slate-800 text-[11px] flex items-center gap-1.5 text-sky-600">
              <span>👛</span> 2. Memilih Dompet (BCA, GoPay, Tunai, Mandiri)
            </h4>
            <ul class="list-disc list-inside text-[10px] space-y-0.5 text-slate-600 pl-1">
              <li><strong>Sebut di kalimat:</strong> Sisipkan kata kunci <em>"pakai gopay"</em>, <em>"via bca"</em>, <em>"lewat mandiri"</em>, atau <em>"tunai"</em>.</li>
              <li><strong>Tombol Inline:</strong> Klik tombol <code>[🔄 Ganti Dompet]</code> pada balasan bot untuk memindahkan rekening transaksi.</li>
              <li><strong>Transfer Antar-Dompet:</strong> Ketik <code>transfer 200rb dari bca ke gopay</code> untuk mutasi saldo antar-rekening.</li>
            </ul>
          </div>

          <!-- Item 3: Perintah Bot (Commands) -->
          <div class="bg-white p-2.5 rounded-xl border border-amber-200 shadow-2xs space-y-1">
            <h4 class="font-bold text-slate-800 text-[11px] flex items-center gap-1.5 text-indigo-600">
              <span>⚡</span> 3. Perintah Utama Bot (Klik untuk Mencoba)
            </h4>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[10px]">
              <button onclick="sendQuickMessage('/saldo')" class="p-1.5 bg-slate-50 hover:bg-rose-50 border rounded-lg text-left font-mono"><strong>/saldo</strong>: Cek dompet</button>
              <button onclick="sendQuickMessage('/jatah')" class="p-1.5 bg-slate-50 hover:bg-rose-50 border rounded-lg text-left font-mono text-brand-600"><strong>/jatah</strong>: Safe daily limit</button>
              <button onclick="sendQuickMessage('/budget')" class="p-1.5 bg-slate-50 hover:bg-rose-50 border rounded-lg text-left font-mono"><strong>/budget</strong>: Cek pos anggaran</button>
              <button onclick="sendQuickMessage('/hari ini')" class="p-1.5 bg-slate-50 hover:bg-rose-50 border rounded-lg text-left font-mono"><strong>/hari ini</strong>: Rekap harian</button>
            </div>
          </div>

          <!-- Item 4: Fitur TataJatah & Laporan -->
          <div class="bg-white p-2.5 rounded-xl border border-amber-200 shadow-2xs space-y-0.5">
            <h4 class="font-bold text-slate-800 text-[11px] flex items-center gap-1.5 text-emerald-600">
              <span>🎯</span> 4. Fitur Signature "TataJatah" & Laporan
            </h4>
            <p class="text-[10px] text-slate-600 leading-relaxed">
              • <strong>Jatah Harian Aman:</strong> Dihitung otomatis dari total saldo dikurangi tagihan dan target tabungan, dibagi sisa hari menuju gajian.<br>
              • <strong>Rollover:</strong> Uang hemat hari ini otomatis menambah jatah belanja esok hari.<br>
              • <strong>Laporan Web:</strong> Kunjungi tab 📊 <strong>Laporan</strong> di dashboard untuk rekap grafik dan ekspor file PDF/Excel.
            </p>
          </div>
        </div>
      </div>
"""

target_header_close = """        <button onclick="closeTelegramSimulator()" class="text-white/80 hover:text-white text-lg font-bold">✕</button>
      </div>"""

if target_header_close in content and "id=\"bot-guide-container\"" not in content:
    content = content.replace(target_header_close, target_header_close + "\n\n" + guide_banner_html, 1)
    print("1. Added Guide Banner right above chat history.")
else:
    print("1. Note: Guide banner already exists or target_header_close not found.")

# 2. Add 'Tata Cara Penggunaan' pill in Quick Commands bar
old_quick_bar = """      <!-- Quick Commands Bar -->
      <div class="px-3 py-2 bg-slate-100 border-t border-slate-200 flex items-center space-x-2 overflow-x-auto text-[11px]">"""

new_quick_bar = """      <!-- Quick Commands Bar -->
      <div class="px-3 py-2 bg-slate-100 border-t border-slate-200 flex items-center space-x-2 overflow-x-auto text-[11px]">
        <button onclick="toggleBotGuide(true)" class="bg-amber-100 border border-amber-300 text-amber-900 hover:bg-amber-200 px-2.5 py-1 rounded-full whitespace-nowrap font-bold transition flex items-center gap-1 shadow-2xs">
          <span>📖</span>
          <span>Tata Cara Penggunaan</span>
        </button>"""

if old_quick_bar in content:
    content = content.replace(old_quick_bar, new_quick_bar, 1)
    print("2. Added Guide Pill to Quick Commands bar.")

# 3. Add 'Tata Cara Pakai' button in Header Navigation (renderHeaderNav)
old_nav_btn = """<button onclick="openTelegramSimulator()" class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-600 border border-sky-200 rounded-lg text-xs font-semibold hover:bg-sky-100 transition shadow-sm">
            <span>✈️</span>
            <span>Simulator Telegram</span>
          </button>"""

new_nav_btn = """<button onclick="openAppGuideModal()" class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold hover:bg-amber-100 transition shadow-sm" title="Tata Cara Penggunaan Aplikasi TataDana">
            <span>📖</span>
            <span>Tata Cara Pakai</span>
          </button>
          <button onclick="openTelegramSimulator()" class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-600 border border-sky-200 rounded-lg text-xs font-semibold hover:bg-sky-100 transition shadow-sm">
            <span>✈️</span>
            <span>Simulator Telegram</span>
          </button>"""

content = content.replace(old_nav_btn, new_nav_btn)
print("3. Added 'Tata Cara Pakai' button to header navigation.")

# 4. Add Dedicated App Guide Modal HTML right before closing body
guide_modal_html = """
  <!-- STANDALONE MODAL TATA CARA PENGGUNAAN APLIKASI -->
  <div id="app-guide-modal" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm hidden flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-rose-100 overflow-hidden flex flex-col max-h-[90vh]">
      <!-- Header Modal -->
      <div class="bg-gradient-to-r from-amber-500 via-brand-500 to-rose-500 px-6 py-4 flex items-center justify-between text-white">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xl shadow-sm">📖</div>
          <div>
            <h3 class="font-bold text-base">Tata Cara Penggunaan TataDana</h3>
            <p class="text-xs text-amber-100">Panduan lengkap mengelola keuangan semudah kirim chat Telegram</p>
          </div>
        </div>
        <button onclick="closeAppGuideModal()" class="text-white/80 hover:text-white text-xl font-bold transition">✕</button>
      </div>

      <!-- Content Body -->
      <div class="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 leading-relaxed">
        <!-- Section 1 -->
        <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
          <div class="flex items-center space-x-2">
            <span class="w-6 h-6 rounded-full bg-brand-500 text-white font-bold flex items-center justify-center text-xs">1</span>
            <h4 class="font-extrabold text-slate-900 text-sm">Menghubungkan Bot Telegram ke Akun TataDana</h4>
          </div>
          <p class="text-slate-600 pl-8">
            • Buka menu <strong>Pengaturan</strong> di dashboard, lalu pilih tab <strong>Bot Telegram</strong>.<br>
            • Klik tombol <strong>"Hubungkan Telegram"</strong> untuk mendapatkan kode unik (misal: <code>/start LINK-8849</code>).<br>
            • Buka Telegram dan kirim pesan kode tersebut ke <strong>@TataDanaBot</strong>. Status koneksi akan langsung berubah menjadi 🟢 <strong>Terhubung</strong> secara realtime!
          </p>
        </div>

        <!-- Section 2 -->
        <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
          <div class="flex items-center space-x-2">
            <span class="w-6 h-6 rounded-full bg-brand-500 text-white font-bold flex items-center justify-center text-xs">2</span>
            <h4 class="font-extrabold text-slate-900 text-sm">Mencatat Pengeluaran & Pemasukan Sehari-hari</h4>
          </div>
          <p class="text-slate-600 pl-8">
            Ketik kalimat sehari-hari tanpa perlu membuka form rumit:<br>
            • <strong>Pengeluaran:</strong> <code>beli bakso 15rb</code>, <code>kopi 28k pakai gopay</code>, <code>bensin 30ribu tunai</code>.<br>
            • <strong>Pemasukan:</strong> <code>gajian 6jt masuk bca</code>, <code>bonus freelance 1.5jt</code>, <code>terima uang 200rb</code>.<br>
            • <strong>Voice Note (VN):</strong> Kirim rekaman suara saat di jalan, AI akan mentranskripsikannya otomatis.<br>
            • <strong>Foto Struk (Pro):</strong> Foto struk belanjaanmu (Indomaret, Alfamart, dll), AI Vision akan membaca tiap baris belanjaan secara terperinci.
          </p>
        </div>

        <!-- Section 3 -->
        <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
          <div class="flex items-center space-x-2">
            <span class="w-6 h-6 rounded-full bg-brand-500 text-white font-bold flex items-center justify-center text-xs">3</span>
            <h4 class="font-extrabold text-slate-900 text-sm">Memilih & Memindahkan Dompet (BCA, GoPay, Tunai, Mandiri)</h4>
          </div>
          <p class="text-slate-600 pl-8">
            • Sebutkan nama dompet di dalam pesan (misal: <em>"pakai gopay"</em> atau <em>"masuk bca"</em>).<br>
            • Jika lupa menyebut dompet, bot akan memakai dompet default dan memberikan tombol <code>[🔄 Ganti Dompet]</code> yang bisa Anda klik untuk memindahkan mutasi.<br>
            • Untuk transfer antar dompet: ketik <code>transfer 200rb dari bca ke gopay</code>.
          </p>
        </div>

        <!-- Section 4 -->
        <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
          <div class="flex items-center space-x-2">
            <span class="w-6 h-6 rounded-full bg-brand-500 text-white font-bold flex items-center justify-center text-xs">4</span>
            <h4 class="font-extrabold text-slate-900 text-sm">Fitur Signature "TataJatah" (Jatah Harian Aman)</h4>
          </div>
          <p class="text-slate-600 pl-8">
            • TataDana menjawab pertanyaan: <em>"Hari ini aku boleh jajan berapa supaya gajiku cukup sampai akhir bulan?"</em><br>
            • Ketik <code>/jatah</code> di bot untuk melihat jatah harianmu hari ini.<br>
            • Gunakan fitur simulasi <em>"Kalau Aku Beli Ini?"</em> di dashboard sebelum membeli barang impian agar keuangan tetap aman.
          </p>
        </div>
      </div>

      <!-- Footer Modal CTA -->
      <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <span class="text-xs text-slate-500">TataDana • Fintech Indonesia WIB</span>
        <div class="flex items-center gap-2">
          <button onclick="closeAppGuideModal()" class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition">Tutup</button>
          <button onclick="closeAppGuideModal(); openTelegramSimulator(); toggleBotGuide(true);" class="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-1.5">
            <span>🚀</span>
            <span>Buka & Coba Chat Bot Sekarang</span>
          </button>
        </div>
      </div>
    </div>
  </div>
"""

# Insert modal before </main> or at the end
if "id=\"app-guide-modal\"" not in content:
    content = content.replace("  <!-- TELEGRAM SIMULATOR MODAL", guide_modal_html + "\n\n  <!-- TELEGRAM SIMULATOR MODAL", 1)
    print("4. Added App Guide Modal HTML.")

# 5. Add JavaScript functions: toggleBotGuide, openAppGuideModal, closeAppGuideModal
guide_js_code = """
    // =========================================================================
    // TATA CARA PENGGUNAAN HANDLERS
    // =========================================================================
    function toggleBotGuide(forceOpen) {
      const panel = document.getElementById('bot-guide-panel');
      const text = document.getElementById('guide-toggle-text');
      const icon = document.getElementById('guide-toggle-icon');
      if (!panel) return;

      if (forceOpen === true || panel.classList.contains('hidden')) {
        panel.classList.remove('hidden');
        if (text) text.innerText = 'Tutup Panduan';
        if (icon) icon.innerText = '▲';
      } else {
        panel.classList.add('hidden');
        if (text) text.innerText = 'Buka Panduan';
        if (icon) icon.innerText = '▼';
      }
    }

    function openAppGuideModal() {
      const modal = document.getElementById('app-guide-modal');
      if (modal) modal.classList.remove('hidden');
    }

    function closeAppGuideModal() {
      const modal = document.getElementById('app-guide-modal');
      if (modal) modal.classList.add('hidden');
    }
"""

if "function toggleBotGuide" not in content:
    content = content.replace("function openTelegramSimulator() {", guide_js_code + "\n    function openTelegramSimulator() {", 1)
    print("5. Added JavaScript handlers for guide toggles.")

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: Bot guide feature added above chat bot and in navigation!")
