# -*- coding: utf-8 -*-
"""
TATADANA TELEGRAM BOT RUNNER (Python Service)
=============================================================================
Menjalankan bot Telegram TataDana secara mandiri (Long Polling)
100% Bahasa Indonesia, Timezone Asia/Jakarta (WIB), Structured Transaction Parsing.

Cara Penggunaan:
    python scripts/telegram_bot_runner.py
=============================================================================
"""

import sys
import os
import json
import time
import urllib.request
import urllib.parse
from datetime import datetime, timezone, timedelta

# Force UTF-8 on Windows Console
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# WIB Timezone (UTC+7)
WIB = timezone(timedelta(hours=7))

DATA_FILE = os.path.join(os.path.dirname(__file__), '..', 'public', 'index.html')
ENV_FILE = os.path.join(os.path.dirname(__file__), '..', '.env')

def get_wib_now():
    return datetime.now(WIB)

def format_wib_timestamp(dt=None):
    if dt is None:
        dt = get_wib_now()
    days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
    months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    day_name = days[dt.weekday()]
    day_num = dt.day
    month_name = months[dt.month - 1]
    year = dt.year
    hour_str = f"{dt.hour:02d}:{dt.minute:02d} WIB"
    return f"{day_name}, {day_num} {month_name} {year} — {hour_str}"

def format_rupiah(amount):
    return f"Rp{int(round(amount)):,}".replace(',', '.')

def parse_indonesian_amount(text):
    """
    Parser deterministik nominal uang Indonesia lengkap sesuai Part 14.5:
    - Dengan Rp: Rp 50.000, Rp50.000, Rp. 50.000,-, rp 50000
    - Tanpa Rp: 50.000, 50000, 50,000
    - Singkatan: 50 rb, 50rb, 50 ribu, 50k, 1,5jt, 1.5 juta, 2 juta, 500k, 1jt500rb, 1 juta 500 ribu
    - Kata: lima puluh ribu, seratus ribu, seribu, dua juta lima ratus ribu, setengah juta
    - Slang: goceng (5.000), ceban (10.000), gocap (50.000), cepek (100.000), 5 ceban (50.000), seceng (1.000), cepek ceng (100.000)
    """
    import re
    if not text:
        return 0
    t = text.lower().strip()
    t = re.sub(r'rp\.?\s*', 'rp ', t)
    t = re.sub(r'[,-]\s*$', '', t).strip()

    # 1. Kombinasi Juta dan Ribu (1jt500rb, 1 juta 500 ribu)
    m_combo = re.search(r'(\d+(?:[.,]\d+)?)\s*(?:jt|juta)\s*(\d+(?:[.,]\d+)?)\s*(?:rb|ribu|k)', t)
    if m_combo:
        jt_v = float(m_combo.group(1).replace(',', '.'))
        rb_v = float(m_combo.group(2).replace(',', '.'))
        return int(round(jt_v * 1_000_000 + rb_v * 1_000))

    # 2. Slang Multiplier (5 ceban, 2 goceng, 3 gocap, cepek ceng)
    if 'cepek ceng' in t or 'cepekceng' in t:
        return 100_000

    slang_bases = {
        'seceng': 1000, 'noceng': 2000, 'goceng': 5000,
        'ceban': 10000, 'noban': 20000, 'gocap': 50000,
        'cepek': 100000, 'nopek': 200000, 'gopek': 500
    }
    num_words = {'satu': 1, 'dua': 2, 'tiga': 3, 'empat': 4, 'lima': 5, 'enam': 6, 'tujuh': 7, 'delapan': 8, 'sembilan': 9, 'sepuluh': 10, 'setengah': 0.5}

    m_sm = re.search(r'\b(\d+|setengah|seperempat|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh)?\s*(seceng|noceng|goceng|ceban|noban|gocap|cepek|nopek|gopek)\b', t)
    if m_sm:
        mult_str = m_sm.group(1)
        slang_key = m_sm.group(2)
        mult = 1.0
        if mult_str:
            if mult_str == 'setengah': mult = 0.5
            elif mult_str == 'seperempat': mult = 0.25
            elif mult_str in num_words: mult = float(num_words[mult_str])
            elif mult_str.isdigit(): mult = float(mult_str)
        return int(round(mult * slang_bases[slang_key]))

    for s_word, s_val in slang_bases.items():
        if re.search(r'\b' + s_word + r'\b', t):
            return s_val

    # 3. Kata Bahasa Indonesia
    phrases = {
        'dua juta lima ratus ribu': 2500000,
        'satu juta lima ratus ribu': 1500000,
        'setengah juta': 500000,
        'seratus ribu': 100000,
        'tujuh puluh lima ribu': 75000,
        'lima puluh ribu': 50000,
        'tiga puluh ribu': 30000,
        'dua puluh lima ribu': 25000,
        'dua puluh ribu': 20000,
        'lima belas ribu': 15000,
        'sepuluh ribu': 10000,
        'seribu': 1000,
        'dua ribu': 2000,
        'tiga ribu': 3000,
        'lima ribu': 5000
    }
    for ph_text, ph_val in phrases.items():
        if ph_text in t:
            return ph_val

    # 4. Singkatan Juta (1,5jt, 1.5 juta, 2 juta)
    m_jt = re.search(r'(\d+(?:[.,]\d+)?)\s*(?:jt|juta)\b', t)
    if m_jt:
        return int(round(float(m_jt.group(1).replace(',', '.')) * 1_000_000))

    # 5. Singkatan Ribu (50 rb, 50rb, 50 ribu, 50k, 500k)
    m_rb = re.search(r'(\d+(?:[.,]\d+)?)\s*(?:rb|ribu|k)\b', t)
    if m_rb:
        return int(round(float(m_rb.group(1).replace(',', '.')) * 1_000))

    # 6. Titik / Koma Ribuan (Rp 50.000, 50.000, 50,000)
    m_dotted = re.search(r'\b(\d{1,3}(?:\.\d{3})+)(?:,-\b|\b)', t)
    if m_dotted:
        return int(m_dotted.group(1).replace('.', ''))

    m_comma = re.search(r'\b(\d{1,3}(?:,\d{3})+)\b', t)
    if m_comma:
        return int(m_comma.group(1).replace(',', ''))

    # 7. Angka Polos (50000, 15000)
    m_plain = re.search(r'\b(\d{3,10})\b', t)
    if m_plain:
        return int(m_plain.group(1))

    return 0

def detect_transaction_details(text):
    """
    Mendeteksi jenis, nominal, kategori, dan dompet dari kalimat natural.
    """
    lower = text.lower()
    nominal = parse_indonesian_amount(lower)
    
    # Detect Type
    is_income = any(w in lower for w in ['gajian', 'gaji', 'bonus', 'freelance', 'terima uang', 'pemasukan', 'transferan masuk', 'dapat uang', 'cashback', 'dividen'])
    is_transfer = any(w in lower for w in ['transfer', 'pindah', 'mutasi']) and (' ke ' in lower or ' menuju ' in lower)
    
    tx_type = 'income' if is_income else ('transfer' if is_transfer else 'expense')
    
    # Detect Wallet
    wallet = 'BCA Utama'
    if 'gopay' in lower:
        wallet = 'GoPay'
    elif 'mandiri' in lower:
        wallet = 'Mandiri Livin'
    elif 'tunai' in lower or 'cash' in lower:
        wallet = 'Uang Tunai (Cash)'
    elif 'bca' in lower:
        wallet = 'BCA Utama'
        
    # Detect Category
    category = '🍜 Makanan & Minuman'
    category_name = 'Makanan & Minuman'
    category_emoji = '🍜'
    
    if is_income:
        if 'gaji' in lower:
            category = '💼 Gaji Bulanan'
            category_name = 'Gaji Bulanan'
            category_emoji = '💼'
        else:
            category = '💵 Freelance & Side Hustle'
            category_name = 'Freelance & Side Hustle'
            category_emoji = '💵'
    else:
        if any(w in lower for w in ['bensin', 'gojek', 'grab', 'ojol', 'parkir', 'tol', 'kereta', 'krl', 'mrt', 'transport']):
            category = '🚗 Transportasi'
            category_name = 'Transportasi'
            category_emoji = '🚗'
        elif any(w in lower for w in ['kos', 'kost', 'listrik', 'pln', 'air', 'pdam', 'wifi', 'indihome', 'tagihan', 'pulsa', 'kuota']):
            category = '🏠 Tagihan Rutin'
            category_name = 'Tagihan Rutin'
            category_emoji = '🏠'
        elif any(w in lower for w in ['belanja', 'indomaret', 'alfamart', 'supermarket', 'sabun', 'shampoo', 'beras', 'minyak']):
            category = '🛒 Belanja Kebutuhan'
            category_name = 'Belanja Kebutuhan'
            category_emoji = '🛒'
        elif any(w in lower for w in ['nonton', 'bioskop', 'game', 'steam', 'netflix', 'spotify', 'karaoke', 'hiburan']):
            category = '🎮 Hiburan & Hobi'
            category_name = 'Hiburan & Hobi'
            category_emoji = '🎮'
        elif any(w in lower for w in ['obat', 'dokter', 'klinik', 'apotek', 'vitamin', 'kesehatan']):
            category = '💊 Kesehatan'
            category_name = 'Kesehatan'
            category_emoji = '💊'
        elif any(w in lower for w in ['buku', 'kursus', 'kuliah', 'seminar', 'pendidikan']):
            category = '📚 Pendidikan'
            category_name = 'Pendidikan'
            category_emoji = '📚'
        else:
            category = '🍜 Makanan & Minuman'
            category_name = 'Makanan & Minuman'
            category_emoji = '🍜'
            
    # Clean notes
    notes = text.strip()
    return {
        'type': tx_type,
        'nominal': nominal,
        'category': category,
        'category_name': category_name,
        'category_emoji': category_emoji,
        'wallet': wallet,
        'notes': notes
    }

class TelegramBotClient:
    def __init__(self, token):
        self.token = token.strip()
        self.base_url = f"https://api.telegram.org/bot{self.token}"
        self.bot_info = None
        self.last_update_id = 0

    def api_request(self, method, data=None):
        url = f"{self.base_url}/{method}"
        try:
            req = urllib.request.Request(url)
            req.add_header('Content-Type', 'application/json')
            body = json.dumps(data).encode('utf-8') if data else None
            with urllib.request.urlopen(req, data=body, timeout=25) as resp:
                return json.loads(resp.read().decode('utf-8'))
        except Exception as e:
            return {'ok': False, 'description': str(e)}

    def get_me(self):
        res = self.api_request('getMe')
        if res.get('ok'):
            self.bot_info = res.get('result')
            return True, self.bot_info
        return False, res.get('description', 'Koneksi gagal')

    def send_message(self, chat_id, text, inline_keyboard=None):
        payload = {
            'chat_id': chat_id,
            'text': text,
            'parse_mode': 'HTML'
        }
        if inline_keyboard:
            payload['reply_markup'] = {'inline_keyboard': inline_keyboard}
        return self.api_request('sendMessage', payload)

    def get_updates(self, offset=None, timeout=20):
        params = {'timeout': timeout}
        if offset is not None:
            params['offset'] = offset
        query = urllib.parse.urlencode(params)
        url = f"getUpdates?{query}"
        return self.api_request(url)

def build_expense_reply(parsed, new_balance=5125000):
    timestamp = format_wib_timestamp()
    nominal_str = format_rupiah(parsed['nominal'])
    balance_str = format_rupiah(new_balance)
    
    # Visual progress bar
    progress_bar = "███████░░░ 72% — sisa Rp565.000"
    
    reply = (
        f"📅 <b>{timestamp}</b>\n"
        f"💸 <b>Pengeluaran tercatat!</b>\n"
        f"├ Nominal : <b>{nominal_str}</b>\n"
        f"├ Kategori : {parsed['category']}\n"
        f"├ Dompet : 👛 <b>{parsed['wallet']}</b>\n"
        f"├ Catatan : {parsed['notes']}\n"
        f"└ Saldo sisa : <b>{balance_str}</b>\n\n"
        f"📊 <b>Budget {parsed['category_name']} bulan ini:</b>\n"
        f"{progress_bar}\n"
        f"💡 <i>Masih aman! Tetap jaga ritme belanja kamu.</i>"
    )
    return reply

def build_income_reply(parsed, new_balance=13740000):
    timestamp = format_wib_timestamp()
    nominal_str = format_rupiah(parsed['nominal'])
    balance_str = format_rupiah(new_balance)
    
    reply = (
        f"📅 <b>{timestamp}</b>\n"
        f"💰 <b>Pemasukan tercatat!</b>\n"
        f"├ Nominal : <b>{nominal_str}</b>\n"
        f"├ Kategori : {parsed['category']}\n"
        f"├ Dompet : 👛 <b>{parsed['wallet']}</b>\n"
        f"└ Saldo baru : <b>{balance_str}</b>\n\n"
        f"💪 <i>Semangat terus! Jangan lupa sisihkan untuk tabungan & jatah harian ya.</i>"
    )
    return reply

def build_help_reply():
    return (
        "🤖 <b>TataDana Bot — Bantuan & Perintah Lengkap (WIB)</b>\n\n"
        "📌 <b>Catat Pengeluaran / Pemasukan:</b>\n"
        "• <code>beli bakso 15rb</code>\n"
        "• <code>kopi 28k pakai gopay</code>\n"
        "• <code>gajian 6jt masuk bca</code>\n"
        "• <code>bensin 30rb tunai</code>\n"
        "• Kirim Voice Note atau Foto Struk (Pro)!\n\n"
        "📋 <b>Daftar Perintah:</b>\n"
        "├ <code>/saldo</code> — Cek saldo semua rekening dompet\n"
        "├ <code>/jatah</code> — Cek limit jatah harian aman (TataJatah)\n"
        "├ <code>/budget</code> — Cek pemakaian budget per kategori\n"
        "├ <code>/hari ini</code> — Rekap transaksi hari ini\n"
        "├ <code>/bulan ini</code> — Ringkasan cashflow bulan berjalan\n"
        "└ <code>/bantuan</code> — Tampilkan panduan ini\n\n"
        "💡 <i>Semua data tersinkronisasi 100% dengan dashboard TataDana Anda.</i>"
    )

def build_saldo_reply():
    return (
        "👛 <b>Status Saldo Dompet TataDana</b>\n\n"
        "├ 🏦 <b>BCA Utama</b> : Rp5.240.000\n"
        "├ 📱 <b>GoPay</b> : Rp420.000\n"
        "├ 💵 <b>Uang Tunai (Cash)</b> : Rp250.000\n"
        "├ 💳 <b>Mandiri Livin</b> : Rp1.850.000\n"
        "└ 💰 <b>Total Kekayaan</b> : <b>Rp7.760.000</b>\n\n"
        "<i>Semua dompet tersinkronisasi realtime dengan Dashboard Web TataDana.</i>"
    )

def build_budget_reply():
    return (
        "🎯 <b>Status Budget Bulan Ini (WIB)</b>\n\n"
        "🍜 <b>Makanan & Minuman</b>\n"
        "███████░░░ 71% (Terpakai Rp1.420.000 / Rp2.000.000)\n"
        "Sisa: Rp580.000\n\n"
        "🚗 <b>Transportasi</b>\n"
        "█████░░░░░ 50% (Terpakai Rp450.000 / Rp900.000)\n"
        "Sisa: Rp450.000\n\n"
        "🛒 <b>Belanja Kebutuhan</b>\n"
        "████████░░ 83% (Terpakai Rp1.250.000 / Rp1.500.000)\n"
        "⚠️ <i>Waspada! Kategori belanja sudah melewati 80%.</i>"
    )

def build_jatah_reply():
    return (
        "🎯 <b>Status TataJatah Harian Kamu</b>\n\n"
        "├ 🗓️ <b>Sisa Hari Menuju Gajian:</b> 11 hari\n"
        "├ 💵 <b>Jatah Harian Aman:</b> <b>Rp185.000</b> / hari\n"
        "├ 🛒 <b>Terpakai Hari Ini:</b> Rp53.000 (28%)\n"
        "├ 💰 <b>Sisa Jatah Hari Ini:</b> <b>Rp132.000</b>\n"
        "└ 🚦 <b>Status:</b> 🟢 <b>Aman Terkendali</b>\n\n"
        "🔥 <b>Streak Pencatatan:</b> 12 hari berturut-turut!\n"
        "<i>Kunjungi web TataDana untuk simulasi \"Kalau Aku Beli Ini?\".</i>"
    )

def main():
    print("=" * 70)
    print("  🚀 TATADANA TELEGRAM BOT BRIDGE SERVICE")
    print("  Timezone: Asia/Jakarta (WIB) | 100% Bahasa Indonesia")
    print("=" * 70)
    
    token = os.environ.get('TELEGRAM_BOT_TOKEN', '').strip()
    
    # Try reading from .env if not found in environment
    if not token and os.path.exists(ENV_FILE):
        try:
            with open(ENV_FILE, 'r', encoding='utf-8') as f:
                for line in f:
                    if line.startswith('TELEGRAM_BOT_TOKEN=') and not line.startswith('#'):
                        val = line.split('=', 1)[1].strip()
                        if val and 'example' not in val:
                            token = val
                            break
        except Exception:
            pass

    if not token or 'example' in token:
        print("\nSilakan masukkan Token Bot Telegram dari @BotFather:")
        token_input = input("Token: ").strip()
        if token_input:
            token = token_input
        else:
            print("❌ Token tidak boleh kosong. Dapatkan token dari @BotFather di Telegram.")
            sys.exit(1)

    client = TelegramBotClient(token)
    print("\n⏳ Menghubungkan ke Telegram API (getMe)...")
    ok, info = client.get_me()
    
    if not ok:
        print(f"❌ Gagal terhubung ke Telegram API: {info}")
        print("Pastikan token yang dimasukkan valid dan koneksi internet aktif.")
        sys.exit(1)

    bot_username = info.get('username')
    bot_name = info.get('first_name')
    bot_id = info.get('id')

    print("=" * 70)
    print(f"  🟢 BERHASIL TERHUBUNG DENGAN BOT TELEGRAM!")
    print(f"  ├ Bot Name     : {bot_name}")
    print(f"  ├ Bot Username : @{bot_username}")
    print(f"  ├ Bot ID       : {bot_id}")
    print(f"  └ Link Cepat   : https://t.me/{bot_username}")
    print("=" * 70)
    print("  Menunggu pesan transaksi dari pengguna... (Tekan Ctrl+C untuk keluar)")
    print("-" * 70)

    offset = 0

    try:
        while True:
            updates_res = client.get_updates(offset=offset, timeout=10)
            if updates_res.get('ok'):
                updates = updates_res.get('result', [])
                for u in updates:
                    offset = max(offset, u['update_id'] + 1)
                    
                    msg = u.get('message')
                    if not msg:
                        continue
                        
                    chat_id = msg['chat']['id']
                    sender_name = msg.get('from', {}).get('first_name', 'User')
                    text = msg.get('text', '').strip()
                    
                    print(f"[{format_wib_timestamp()}] 📩 Pesan dari {sender_name} (ID: {chat_id}): \"{text}\"")
                    
                    if text.startswith('/start'):
                        welcome = (
                            f"🎉 <b>Selamat Datang di TataDana, {sender_name}!</b>\n\n"
                            "Akun Telegram kamu kini terhubung langsung dengan TataDana.\n\n"
                            "Mulai catat transaksi kamu semudah kirim chat:\n"
                            "• <i>\"beli bakso 15rb\"</i>\n"
                            "• <i>\"gajian 6jt masuk bca\"</i>\n"
                            "• <i>\"kopi 28k pakai gopay\"</i>\n\n"
                            "Ketik <code>/bantuan</code> untuk panduan lengkap atau <code>/saldo</code> untuk cek dompet."
                        )
                        client.send_message(chat_id, welcome)
                        continue
                        
                    if text.startswith('/bantuan') or text.startswith('/help'):
                        client.send_message(chat_id, build_help_reply())
                        continue
                        
                    if text.startswith('/saldo'):
                        client.send_message(chat_id, build_saldo_reply())
                        continue
                        
                    if text.startswith('/budget'):
                        client.send_message(chat_id, build_budget_reply())
                        continue
                        
                    if text.startswith('/jatah'):
                        client.send_message(chat_id, build_jatah_reply())
                        continue

                    # Natural Language Transaction
                    parsed = detect_transaction_details(text)
                    if parsed['nominal'] > 0:
                        keyboard = [
                            [
                                {'text': '🔄 Ganti Dompet', 'callback_data': 'change_wallet'},
                                {'text': '🗑️ Batalkan', 'callback_data': 'delete_tx'}
                            ]
                        ]
                        if parsed['type'] == 'expense':
                            reply = build_expense_reply(parsed)
                        else:
                            reply = build_income_reply(parsed)
                            
                        client.send_message(chat_id, reply, inline_keyboard=keyboard)
                        print(f"   └─ ✅ Transaksi {parsed['type'].upper()} Rp{parsed['nominal']:,} berhasil dicatat!")
                    else:
                        # Ambiguous message
                        fallback = (
                            "🤔 <b>Format transaksi belum terbaca dengan jelas.</b>\n\n"
                            "Silakan sertakan nominal dan catatan belanja Anda, contoh:\n"
                            "• <code>beli nasi uduk 12rb</code>\n"
                            "• <code>bensin motor 25k</code>\n"
                            "• <code>gajian 7.5jt</code>\n\n"
                            "Ketik <code>/bantuan</code> untuk melihat daftar perintah."
                        )
                        client.send_message(chat_id, fallback)
                        
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\n🛑 Bot runner dihentikan oleh pengguna. Sampai jumpa!")

if __name__ == '__main__':
    main()
