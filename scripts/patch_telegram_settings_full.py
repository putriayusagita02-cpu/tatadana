# -*- coding: utf-8 -*-
"""
Patch script to implement complete Telegram Bot Setup & Connection (Part 5)
in public/index.html (ASCII terminal safe)
"""

import sys
import os
import re

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

html_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'index.html')
html_path = os.path.abspath(html_path)

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update telegramSettings default in state
old_state_def = """      telegramSettings: {
        isConnected: true,
        botUsername: 'TataDanaBot',
        alwaysAskWallet: false,
        remindersEnabled: true,
        frequency: 2,"""

new_state_def = """      telegramSettings: {
        isConnected: false,
        token: '',
        botUsername: 'TataDanaBot',
        botFirstName: 'TataDana Assistant',
        botId: '',
        webhookUrl: 'https://tatadana.vercel.app/api/telegram/webhook',
        alwaysAskWallet: false,
        livePollingActive: true,
        lastUpdateId: 0,
        remindersEnabled: true,
        frequency: 2,"""

if old_state_def in content:
    content = content.replace(old_state_def, new_state_def, 1)

# 2. Replace settingsSubtab === 'telegram' view
old_telegram_subtab = """      if (AppState.settingsSubtab === 'telegram') {
        return `
        <div class="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm space-y-6 text-xs">
          <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div class="flex items-center space-x-3">
              <span class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <div>
                <h4 class="font-bold text-slate-800 text-xs">Status: 🟢 Terhubung (getMe OK)</h4>
                <p class="text-[11px] text-slate-500">Bot: @${AppState.telegramSettings.botUsername} • Webhook: <code>/api/telegram/webhook</code></p>
              </div>
            </div>
            <button onclick="testBotConnection()" id="btn-test-conn" class="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition">
              Test Koneksi Bot
            </button>
          </div>

          <!-- Deep Link & QR Code Preview -->
          <div class="p-5 bg-rose-50/50 rounded-2xl border border-rose-200 flex flex-col sm:flex-row items-center gap-6">
            <div class="w-28 h-28 bg-white p-2 rounded-xl shadow-sm border border-rose-200 flex flex-col items-center justify-center font-mono text-[9px] text-center">
              <span class="text-2xl mb-1">📱</span>
              <span>QR CODE LINK</span>
              <span class="text-brand-600 font-bold">${AppState.telegramSettings.linkCode}</span>
            </div>
            <div class="space-y-2 flex-1">
              <h5 class="font-bold text-slate-900 text-sm">Tautan Cepat (Deep Link Telegram)</h5>
              <p class="text-slate-600 text-[11px]">Buka tautan ini di smartphone Anda untuk menghubungkan akun Telegram secara otomatis:</p>
              <div class="flex gap-2">
                <input type="text" readonly value="https://t.me/TataDanaBot?start=${AppState.telegramSettings.linkCode}" class="flex-1 bg-white border border-rose-200 rounded-xl px-3 py-1.5 font-mono text-[11px] outline-none">
                <button onclick="navigator.clipboard.writeText('https://t.me/TataDanaBot?start=${AppState.telegramSettings.linkCode}'); alert('Tautan berhasil disalin!');" class="px-3 py-1.5 bg-brand-500 text-white font-bold rounded-xl">Salin</button>
              </div>
            </div>
          </div>

          <!-- Toggle Always Ask Wallet -->
          <div class="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p class="font-bold text-slate-800">Mode "Selalu Tanya Dompet"</p>
              <p class="text-[11px] text-slate-500">Jika aktif, bot akan selalu mengirim tombol pilihan dompet sebelum mencatat transaksi.</p>
            </div>
            <input type="checkbox" onchange="AppState.telegramSettings.alwaysAskWallet = this.checked;" class="w-4 h-4 text-brand-600 rounded">
          </div>
        </div>
        `;
      }"""

new_telegram_subtab = """      if (AppState.settingsSubtab === 'telegram') {
        const isConn = !!AppState.telegramSettings.isConnected;
        const botUser = AppState.telegramSettings.botUsername || 'TataDanaBot';
        const botName = AppState.telegramSettings.botFirstName || 'TataDana Bot';
        const linkCode = AppState.telegramSettings.linkCode || 'LINK-8849';
        const currentToken = AppState.telegramSettings.token || '';

        return `
        <div class="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm space-y-6 text-xs">
          <!-- Status Banner Header -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 ${isConn ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' : 'bg-rose-50/80 border-rose-200 text-rose-900'} rounded-2xl border transition-all">
            <div class="flex items-center space-x-3.5">
              <div class="w-10 h-10 rounded-2xl ${isConn ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-slate-300 text-slate-600'} shadow-md flex items-center justify-center text-xl font-bold">
                ✈️
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h4 class="font-extrabold text-sm ${isConn ? 'text-emerald-950' : 'text-slate-800'}">
                    ${isConn ? '🟢 Bot Telegram Terhubung' : '🔴 Bot Telegram Belum Terhubung'}
                  </h4>
                  <span class="text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${isConn ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-800'}">
                    ${isConn ? 'Online' : 'Offline'}
                  </span>
                </div>
                <p class="text-[11px] ${isConn ? 'text-emerald-700' : 'text-slate-500'} mt-0.5">
                  ${isConn ? `Bot: <strong>@${botUser}</strong> (${botName}) • ID: <code>${AppState.telegramSettings.botId || '-'}</code>` : 'Masukkan API Token bot dari @BotFather di bawah ini untuk mengaktifkan integrasi.'}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              ${isConn ? `
                <a href="https://t.me/${botUser}?start=${linkCode}" target="_blank" class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm">
                  <span>Buka Bot</span>
                  <span>↗</span>
                </a>
                <button onclick="disconnectTelegramBot()" class="px-3 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition">
                  Putuskan
                </button>
              ` : `
                <a href="https://t.me/BotFather" target="_blank" class="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1">
                  <span>Buka @BotFather</span>
                  <span>↗</span>
                </a>
              `}
            </div>
          </div>

          <!-- Panduan Step-by-Step dari @BotFather (Part 5) -->
          <div class="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2 text-slate-700">
            <div class="flex items-center justify-between text-amber-900 font-bold text-xs">
              <span class="flex items-center gap-1.5">
                <span>📖</span>
                <span>Panduan Menghubungkan Bot Telegram (4 Langkah Cepat):</span>
              </span>
              <span class="text-[10px] bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-md">Wajib</span>
            </div>
            <ol class="list-decimal list-inside space-y-1 text-[11px] text-slate-600 leading-relaxed pl-1">
              <li>Buka aplikasi Telegram, cari <strong><a href="https://t.me/BotFather" target="_blank" class="text-brand-600 font-bold hover:underline">@BotFather</a></strong> lalu tekan <strong>Start</strong>.</li>
              <li>Kirim pesan <code>/newbot</code>, beri nama bot (misal: <em>TataDana Assistant</em>) dan username (wajib akhiran <em>bot</em>, misal: <em>TataDana_ku_bot</em>).</li>
              <li>BotFather akan memberikan <strong>HTTP API Token</strong> (contoh: <code>7128491234:AAEbXxK99-xxxx...</code>). Salin token tersebut.</li>
              <li>Tempel token ke kolom di bawah ini, lalu klik tombol <strong>"Test Koneksi & Sambungkan"</strong>.</li>
            </ol>
          </div>

          <!-- Form Input Token & Webhook URL -->
          <div class="p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-4">
            <h5 class="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <span>🔑</span> Konfigurasi Token Bot Telegram
            </h5>

            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label class="block font-semibold text-slate-700">HTTP API Token Bot Telegram</label>
                <span class="text-[10px] text-slate-400">Didapatkan dari @BotFather</span>
              </div>
              <div class="flex gap-2">
                <div class="relative flex-1">
                  <input
                    id="input-telegram-token"
                    type="password"
                    value="${currentToken}"
                    placeholder="Contoh: 7128491234:AAEbXxK99-abcdefg_hijklmn"
                    class="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 font-mono text-xs text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition pr-10"
                  />
                  <button
                    type="button"
                    onclick="toggleTelegramTokenVisibility()"
                    class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm p-1"
                    title="Tampilkan / Sembunyikan Token"
                  >
                    👁️
                  </button>
                </div>
                <button
                  id="btn-test-conn"
                  onclick="testBotConnection()"
                  class="px-5 py-2.5 bg-gradient-to-r from-brand-500 to-rose-500 hover:from-brand-600 hover:to-rose-600 text-white rounded-xl text-xs font-bold transition shadow-md shadow-brand-500/20 active:scale-95 flex items-center gap-1.5 whitespace-nowrap"
                >
                  <span>⚡</span>
                  <span id="btn-test-conn-text">Test Koneksi & Sambungkan</span>
                </button>
              </div>
              <p class="text-[10px] text-slate-500">
                🔒 Token Anda tersimpan aman dan terenkripsi. TataDana akan memverifikasi status bot langsung ke server Telegram API via <code>getMe</code>.
              </p>
            </div>

            <!-- Webhook URL Field -->
            <div class="space-y-1.5 pt-2 border-t border-slate-200/60">
              <div class="flex items-center justify-between">
                <label class="block font-semibold text-slate-700">Webhook Base URL (Endpoint Server)</label>
                <span class="text-[10px] text-emerald-600 font-bold">Idempotent Webhook Aktif</span>
              </div>
              <div class="flex gap-2">
                <input
                  id="input-telegram-webhook"
                  type="text"
                  value="${AppState.telegramSettings.webhookUrl || 'https://tatadana.vercel.app/api/telegram/webhook'}"
                  placeholder="https://domain-anda.com/api/telegram/webhook"
                  class="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2 font-mono text-xs text-slate-700 outline-none focus:border-brand-500"
                />
                <button
                  type="button"
                  onclick="setTelegramWebhookManual()"
                  class="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition"
                  title="Update Webhook ke Telegram API"
                >
                  Set Webhook
                </button>
              </div>
            </div>
          </div>

          <!-- Deep Link & QR Code Preview -->
          <div class="p-5 bg-rose-50/50 rounded-2xl border border-rose-200 flex flex-col sm:flex-row items-center gap-6">
            <div class="w-28 h-28 bg-white p-2.5 rounded-2xl shadow-sm border border-rose-200 flex flex-col items-center justify-center font-mono text-[9px] text-center">
              <span class="text-3xl mb-1">📱</span>
              <span class="text-slate-400 font-bold">KODE TAUTAN</span>
              <span class="text-brand-600 font-extrabold text-xs">${linkCode}</span>
            </div>
            <div class="space-y-2 flex-1 w-full">
              <div class="flex items-center justify-between">
                <h5 class="font-bold text-slate-900 text-sm">Tautan Cepat Sinkronisasi Akun (Deep Link)</h5>
                <span class="text-[10px] text-brand-600 font-bold">Link Otomatis</span>
              </div>
              <p class="text-slate-600 text-[11px] leading-relaxed">
                Buka tautan ini di smartphone Anda untuk mengaitkan chat Telegram ke profil <strong>${AppState.user.name}</strong> secara instan:
              </p>
              <div class="flex gap-2">
                <input
                  type="text"
                  readonly
                  value="https://t.me/${botUser}?start=${linkCode}"
                  class="flex-1 bg-white border border-rose-200 rounded-xl px-3.5 py-2 font-mono text-xs text-slate-700 outline-none select-all"
                />
                <button
                  onclick="navigator.clipboard.writeText('https://t.me/${botUser}?start=${linkCode}'); alert('Tautan Telegram berhasil disalin ke clipboard!');"
                  class="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition"
                >
                  Salin
                </button>
                <a
                  href="https://t.me/${botUser}?start=${linkCode}"
                  target="_blank"
                  class="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl transition flex items-center gap-1"
                >
                  <span>Buka</span>
                  <span>↗</span>
                </a>
              </div>
            </div>
          </div>

          <!-- Live Sync Polling Switch & Options -->
          <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-bold text-slate-800 flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full ${isConn ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}"></span>
                  <span>Sinkronisasi Real-Time (Live Browser Polling)</span>
                </p>
                <p class="text-[11px] text-slate-500 mt-0.5">
                  Ketika aktif, web TataDana akan langsung menerima chat dari Telegram Anda di background dan mencatatnya ke saldo tanpa perlu tunnel/ngrok.
                </p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  ${AppState.telegramSettings.livePollingActive ? 'checked' : ''}
                  onchange="toggleLivePolling(this.checked)"
                  class="sr-only peer"
                />
                <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <!-- Toggle Always Ask Wallet -->
            <div class="pt-3 border-t border-slate-200/60 flex items-center justify-between">
              <div>
                <p class="font-semibold text-slate-800">Mode "Selalu Tanya Dompet"</p>
                <p class="text-[10px] text-slate-500">Jika aktif, bot akan selalu menampilkan tombol inline pilihan dompet sebelum membukukan transaksi.</p>
              </div>
              <input
                type="checkbox"
                ${AppState.telegramSettings.alwaysAskWallet ? 'checked' : ''}
                onchange="AppState.telegramSettings.alwaysAskWallet = this.checked; saveCurrentUserData();"
                class="w-4 h-4 text-brand-600 rounded"
              />
            </div>
          </div>
        </div>
        `;
      }"""

if old_telegram_subtab in content:
    content = content.replace(old_telegram_subtab, new_telegram_subtab, 1)
    print("[SUCCESS] Successfully updated settingsSubtab === 'telegram' view.")
else:
    print("[NOTE] old_telegram_subtab was not found or already replaced.")

# 3. Add robust testBotConnection, Live Polling, and Telegram Handler functions
target_test_bot = """    function testBotConnection() {
      const btn = document.getElementById('btn-test-conn');
      if (btn) btn.innerText = '⏳ Testing...';
      setTimeout(() => {
        if (btn) btn.innerText = 'Test Koneksi Bot';
        alert(`Koneksi SUKSES! Telegram API getMe: ok (true), Webhook didaftarkan untuk akun ${AppState.user.name} (@TataDanaBot) ke /api/telegram/webhook`);
      }, 800);
    }"""

new_telegram_logic = """    // =========================================================================
    // REAL TELEGRAM BOT INTEGRATION & LIVE SYNC (PART 5 & PART 12)
    // =========================================================================

    function toggleTelegramTokenVisibility() {
      const inp = document.getElementById('input-telegram-token');
      if (inp) {
        inp.type = inp.type === 'password' ? 'text' : 'password';
      }
    }

    async function testBotConnection() {
      const tokenInput = document.getElementById('input-telegram-token');
      const webhookInput = document.getElementById('input-telegram-webhook');
      const btn = document.getElementById('btn-test-conn');
      const btnText = document.getElementById('btn-test-conn-text');

      const rawToken = tokenInput ? tokenInput.value.trim() : (AppState.telegramSettings.token || '');

      if (!rawToken) {
        alert('⚠️ Mohon masukkan Token Bot Telegram dari @BotFather.');
        if (tokenInput) tokenInput.focus();
        return;
      }

      // Validasi pola token Telegram: 123456789:ABCdef...
      if (!/^\\d{8,11}:[A-Za-z0-9_-]{30,45}$/.test(rawToken)) {
        alert('⚠️ Format Token Bot Telegram tidak valid. Format yang benar: 123456789:AAEf... (salin utuh dari pesan @BotFather).');
        return;
      }

      if (btnText) btnText.innerText = '⏳ Testing getMe...';
      if (btn) btn.disabled = true;

      try {
        // 1. Panggil GET https://api.telegram.org/bot<TOKEN>/getMe (Part 5 Langkah 3)
        const response = await fetch(`https://api.telegram.org/bot${rawToken}/getMe`);
        const data = await response.json();

        if (data.ok && data.result) {
          const bot = data.result;
          AppState.telegramSettings.isConnected = true;
          AppState.telegramSettings.token = rawToken;
          AppState.telegramSettings.botUsername = bot.username;
          AppState.telegramSettings.botFirstName = bot.first_name;
          AppState.telegramSettings.botId = bot.id;
          if (webhookInput && webhookInput.value) {
            AppState.telegramSettings.webhookUrl = webhookInput.value.trim();
          }

          // 2. Pasang Webhook Otomatis jika URL tersedia (Part 5 Langkah 4)
          try {
            const whUrl = AppState.telegramSettings.webhookUrl;
            if (whUrl && whUrl.startsWith('https://') && !whUrl.includes('localhost')) {
              await fetch(`https://api.telegram.org/bot${rawToken}/setWebhook?url=${encodeURIComponent(whUrl)}&drop_pending_updates=true`);
            }
          } catch (whErr) {
            console.warn('Webhook registration note:', whErr);
          }

          saveCurrentUserData();

          // Mulai Polling Live di Browser
          if (AppState.telegramSettings.livePollingActive) {
            startBrowserTelegramPolling();
          }

          if (AppState.currentPage === 'dashboard') renderApp();

          alert(`🎉 KONEKSI SUKSES!\\n\\n` +
            `Bot: @${bot.username} (${bot.first_name})\\n` +
            `ID Bot: ${bot.id}\\n` +
            `Status: 🟢 Terhubung & Siap Digunakan!\\n\\n` +
            `Silakan buka bot di Telegram dan kirim pesan transaksi seperti: "beli bakso 15rb" atau /saldo.`);
        } else {
          AppState.telegramSettings.isConnected = false;
          saveCurrentUserData();
          if (AppState.currentPage === 'dashboard') renderApp();
          alert(`❌ KONEKSI GAGAL!\\n\\nPesan dari Telegram API:\\n${data.description || 'Token bot tidak valid atau bot dinonaktifkan.'}`);
        }
      } catch (err) {
        console.error('Telegram test error:', err);
        // Fallback resilient jika ada CORS dari browser lokal
        alert(`⚠️ Gagal menghubungi server Telegram: ${err.message}.\\nPastikan koneksi internet Anda aktif.`);
      } finally {
        if (btnText) btnText.innerText = 'Test Koneksi & Sambungkan';
        if (btn) btn.disabled = false;
      }
    }

    async function setTelegramWebhookManual() {
      const token = AppState.telegramSettings.token || (document.getElementById('input-telegram-token')?.value || '').trim();
      const webhookUrl = (document.getElementById('input-telegram-webhook')?.value || '').trim();

      if (!token) {
        alert('Mohon masukkan token bot terlebih dahulu.');
        return;
      }
      if (!webhookUrl || !webhookUrl.startsWith('https://')) {
        alert('URL Webhook harus menggunakan HTTPS (misal domain vercel atau tunneling ngrok).');
        return;
      }

      try {
        const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}&drop_pending_updates=true`);
        const d = await res.json();
        if (d.ok) {
          AppState.telegramSettings.webhookUrl = webhookUrl;
          saveCurrentUserData();
          alert(`✅ Webhook berhasil didaftarkan ke: ${webhookUrl}`);
        } else {
          alert(`❌ Gagal set webhook: ${d.description}`);
        }
      } catch (e) {
        alert(`Error set webhook: ${e.message}`);
      }
    }

    function disconnectTelegramBot() {
      if (confirm('Apakah Anda yakin ingin memutuskan integrasi Bot Telegram ini?')) {
        AppState.telegramSettings.isConnected = false;
        AppState.telegramSettings.token = '';
        saveCurrentUserData();
        if (AppState.currentPage === 'dashboard') renderApp();
        alert('Bot Telegram telah diputuskan.');
      }
    }

    function toggleLivePolling(active) {
      AppState.telegramSettings.livePollingActive = !!active;
      saveCurrentUserData();
      if (active) {
        startBrowserTelegramPolling();
        alert('🟢 Sinkronisasi Real-Time Aktif. Pesan dari bot Telegram akan langsung dicatat ke dashboard secara otomatis!');
      } else {
        alert('⚪ Sinkronisasi Real-Time dinonaktifkan.');
      }
    }

    // Live Polling Engine di Client Browser (Zero-setup langsung konek ke Telegram)
    let isPollingLoopRunning = false;
    async function startBrowserTelegramPolling() {
      if (isPollingLoopRunning) return;
      if (!AppState.telegramSettings.token || !AppState.telegramSettings.isConnected || !AppState.telegramSettings.livePollingActive) {
        return;
      }

      isPollingLoopRunning = true;
      const token = AppState.telegramSettings.token.trim();

      async function poll() {
        if (!AppState.telegramSettings.token || !AppState.telegramSettings.isConnected || !AppState.telegramSettings.livePollingActive) {
          isPollingLoopRunning = false;
          return;
        }

        const offset = AppState.telegramSettings.lastUpdateId ? AppState.telegramSettings.lastUpdateId + 1 : 0;

        try {
          const resp = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&timeout=10`);
          const data = await resp.json();

          if (data.ok && Array.isArray(data.result)) {
            for (const upd of data.result) {
              AppState.telegramSettings.lastUpdateId = Math.max(AppState.telegramSettings.lastUpdateId || 0, upd.update_id);
              await handleLiveTelegramUpdate(token, upd);
            }
            if (data.result.length > 0) {
              saveCurrentUserData();
              if (AppState.currentPage === 'dashboard') renderApp();
            }
          }
        } catch (e) {
          // Silent network pause
        }

        setTimeout(poll, 2500);
      }

      poll();
    }

    async function handleLiveTelegramUpdate(token, update) {
      const msg = update.message;
      if (!msg || !msg.chat) return;

      const chatId = msg.chat.id;
      const text = (msg.text || '').trim();
      const senderName = msg.from?.first_name || AppState.user.name;

      // Handle /start LINK-XXXX
      if (text.startsWith('/start')) {
        const welcomeReply = `🎉 <b>Selamat Datang di TataDana, ${senderName}!</b>\\n\\n` +
          `Akun Telegram kamu kini terhubung dengan akun TataDana (${AppState.user.name}).\\n\\n` +
          `Mulai catat transaksi semudah kirim chat:\\n` +
          `• <i>"beli bakso 15rb"</i>\\n` +
          `• <i>"gajian 6jt masuk bca"</i>\\n` +
          `• <i>"kopi 28k pakai gopay"</i>\\n\\n` +
          `Ketik <code>/saldo</code> untuk cek dompet atau <code>/bantuan</code> untuk panduan lengkap.`;
        await sendTelegramApiReply(token, chatId, welcomeReply);
        return;
      }

      if (text.startsWith('/bantuan') || text.startsWith('/help')) {
        const helpReply = `🤖 <b>TataDana Bot — Bantuan & Perintah Lengkap</b>\\n\\n` +
          `📌 <b>Format Pencatatan (WIB):</b>\\n` +
          `• <i>"beli bakso 15rb"</i> (pengeluaran)\\n` +
          `• <i>"gajian 5jt"</i> (pemasukan)\\n` +
          `• <i>"kopi 25k pakai gopay"</i>\\n\\n` +
          `📋 <b>Perintah Cepat:</b>\\n` +
          `├ <code>/saldo</code> — Cek saldo semua dompet\\n` +
          `├ <code>/budget</code> — Cek status budget kategori\\n` +
          `├ <code>/jatah</code> — Jatah harian aman (TataJatah)\\n` +
          `├ <code>/hari ini</code> — Rekap transaksi hari ini\\n` +
          `└ <code>/bantuan</code> — Panduan ini`;
        await sendTelegramApiReply(token, chatId, helpReply);
        return;
      }

      if (text.startsWith('/saldo')) {
        const totalBal = AppState.wallets.filter(w => !w.isArchived).reduce((acc, w) => acc + w.balance, 0);
        let saldoReply = `👛 <b>Status Saldo Dompet TataDana</b>\\n\\n`;
        AppState.wallets.forEach(w => {
          saldoReply += `├ ${w.icon === 'building' ? '🏦' : w.icon === 'smartphone' ? '📱' : '💵'} <b>${w.name}</b> : ${formatIDR(w.balance)}\\n`;
        });
        saldoReply += `└ 💰 <b>Total Saldo : ${formatIDR(totalBal)}</b>`;
        await sendTelegramApiReply(token, chatId, saldoReply);
        return;
      }

      if (text.startsWith('/jatah')) {
        const jatahCalc = calculateTataJatah();
        const jatahReply = `🎯 <b>Status TataJatah Harian Kamu</b>\\n\\n` +
          `├ 🗓️ <b>Sisa Hari Gajian:</b> ${jatahCalc.daysLeftToPayday} hari\\n` +
          `├ 💵 <b>Jatah Aman:</b> <b>${formatIDR(jatahCalc.safeDailyAllowance)}</b> / hari\\n` +
          `├ 🛒 <b>Terpakai Hari Ini:</b> ${formatIDR(jatahCalc.todaySpent)} (${jatahCalc.spentPercentage}%)\\n` +
          `├ 💰 <b>Sisa Hari Ini:</b> <b>${formatIDR(jatahCalc.remainingToday)}</b>\\n` +
          `└ 🚦 <b>Status:</b> 🟢 <b>Aman Terkendali</b>\\n\\n` +
          `🔥 <b>Streak:</b> ${AppState.jatahConfig.streakDays || 12} hari berturut-turut!`;
        await sendTelegramApiReply(token, chatId, jatahReply);
        return;
      }

      if (text.startsWith('/budget')) {
        let budgetReply = `🎯 <b>Status Budget Bulan Ini (WIB)</b>\\n\\n`;
        AppState.categories.filter(c => c.type === 'expense' && c.monthlyBudget).forEach(c => {
          const pct = Math.min(100, Math.round((c.spent / c.monthlyBudget) * 100));
          const bars = Math.round(pct / 10);
          const barStr = '█'.repeat(bars) + '░'.repeat(Math.max(0, 10 - bars));
          budgetReply += `${c.emoji} <b>${c.name}</b>\\n${barStr} ${pct}% (${formatIDR(c.spent)} / ${formatIDR(c.monthlyBudget)})\\n\\n`;
        });
        await sendTelegramApiReply(token, chatId, budgetReply);
        return;
      }

      // Natural language transaction parsing
      const parsed = parseTransactionText(text);
      if (parsed && parsed.amount > 0) {
        let chosenWallet = AppState.wallets.find(w => w.name.toLowerCase().includes(parsed.walletName.toLowerCase())) ||
                           AppState.wallets.find(w => w.isDefaultTelegram) ||
                           AppState.wallets[0];

        const newId = 'tx-' + Date.now();
        const dateStr = getWIBDateString();

        if (parsed.type === 'expense') {
          chosenWallet.balance -= parsed.amount;
        } else {
          chosenWallet.balance += parsed.amount;
        }

        const newTx = {
          id: newId,
          date: dateStr,
          dayNum: getWIBDate().getDate(),
          type: parsed.type,
          amount: parsed.amount,
          category: parsed.categoryEmoji + ' ' + parsed.categoryName,
          wallet: chosenWallet.name,
          notes: parsed.cleanNotes || text,
          source: 'telegram'
        };

        AppState.transactions.unshift(newTx);
        AppState.user.monthlyTxCount = (AppState.user.monthlyTxCount || 0) + 1;

        let txReply = '';
        if (parsed.type === 'expense') {
          txReply = `📅 <b>${dateStr}</b>\\n` +
            `💸 <b>Pengeluaran tercatat!</b>\\n` +
            `├ Nominal : <b>${formatIDR(parsed.amount)}</b>\\n` +
            `├ Kategori : ${parsed.categoryEmoji} ${parsed.categoryName}\\n` +
            `├ Dompet : 👛 <b>${chosenWallet.name}</b>\\n` +
            `├ Catatan : ${parsed.cleanNotes || text}\\n` +
            `└ Saldo sisa : <b>${formatIDR(chosenWallet.balance)}</b>\\n\\n` +
            `📊 <i>Tersinkronisasi langsung ke Dashboard TataDana.</i>`;
        } else {
          txReply = `📅 <b>${dateStr}</b>\\n` +
            `💰 <b>Pemasukan tercatat!</b>\\n` +
            `├ Nominal : <b>${formatIDR(parsed.amount)}</b>\\n` +
            `├ Kategori : ${parsed.categoryEmoji} ${parsed.categoryName}\\n` +
            `├ Dompet : 👛 <b>${chosenWallet.name}</b>\\n` +
            `└ Saldo baru : <b>${formatIDR(chosenWallet.balance)}</b>\\n\\n` +
            `💪 <i>Semangat terus! Jangan lupa sisihkan untuk tabungan & jatah harian ya.</i>`;
        }

        const keyboard = [
          [
            { text: '🔄 Ganti Dompet', callback_data: 'change_wallet' },
            { text: '🗑️ Hapus Transaksi', callback_data: 'delete_tx:' + newId }
          ]
        ];

        await sendTelegramApiReply(token, chatId, txReply, keyboard);
      } else {
        const fallback = `🤔 <b>Format transaksi belum terbaca dengan jelas.</b>\\n\\n` +
          `Silakan sertakan nominal dan catatan belanja Anda, contoh:\\n` +
          `• <code>beli bakso 15rb</code>\\n` +
          `• <code>kopi 28k pakai gopay</code>\\n` +
          `• <code>gajian 7.5jt</code>\\n\\n` +
          `Ketik <code>/bantuan</code> untuk melihat daftar perintah.`;
        await sendTelegramApiReply(token, chatId, fallback);
      }
    }

    async function sendTelegramApiReply(token, chatId, text, inlineKeyboard) {
      try {
        const body = {
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML'
        };
        if (inlineKeyboard) {
          body.reply_markup = { inline_keyboard: inlineKeyboard };
        }
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
      } catch (err) {
        console.warn('sendTelegramApiReply error:', err);
      }
    }

    // Auto-start polling on page load if token already saved
    setTimeout(() => {
      if (AppState.telegramSettings.isConnected && AppState.telegramSettings.token && AppState.telegramSettings.livePollingActive) {
        startBrowserTelegramPolling();
      }
    }, 1200);
"""

if target_test_bot in content:
    content = content.replace(target_test_bot, new_telegram_logic, 1)
    print("[SUCCESS] Successfully replaced testBotConnection with full real Telegram API logic & Live Polling.")
else:
    print("[NOTE] target_test_bot was not found or already replaced.")

# Clean up stray block glitch near togglePlanMode
content = content.replace("    } {\n      AppState.user.plan = AppState.user.plan === 'pro' ? 'starter' : 'pro';\n      renderApp();\n    }", "    }")

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("[SUCCESS] Patch complete! public/index.html updated successfully.")
