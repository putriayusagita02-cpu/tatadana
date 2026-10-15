# -*- coding: utf-8 -*-
import sys
import os

if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

html_path = os.path.join(os.path.dirname(__file__), '..', 'public', 'index.html')
with open(html_path, 'r', encoding='utf-8') as f:
    text = f.read()

checks = [
    ('input-telegram-token', 'Input token Telegram (@BotFather)'),
    ('input-telegram-webhook', 'Input Webhook URL'),
    ('btn-test-conn', 'Tombol Test Koneksi & Sambungkan'),
    ('testBotConnection', 'Fungsi verifikasi getMe ke Telegram API'),
    ('setTelegramWebhookManual', 'Fungsi pasang webhook manual'),
    ('startBrowserTelegramPolling', 'Engine sinkronisasi real-time browser'),
    ('handleLiveTelegramUpdate', 'Handler pesan teks, nominal IDR & perintah bot'),
    ('disconnectTelegramBot', 'Fungsi pemutusan bot'),
    ('Panduan Menghubungkan Bot Telegram (4 Langkah Cepat)', 'Panduan inline BotFather (Part 5)'),
]

all_passed = True
for needle, desc in checks:
    if needle in text:
        print(f"  [OK] {desc}")
    else:
        print(f"  [FAILED] {desc} (target: '{needle}' tidak ditemukan)")
        all_passed = False

if all_passed:
    print("\n[SUCCESS] Seluruh modul integrasi Bot Telegram berhasil terpasang sempurna!")
else:
    sys.exit(1)
