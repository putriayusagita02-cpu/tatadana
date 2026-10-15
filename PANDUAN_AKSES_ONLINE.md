# 🌐 Panduan Akses Online TataDana Fintech

Aplikasi TataDana kini siap diakses secara online oleh siapa saja di internet (melalui smartphone Android/iOS, tablet, maupun laptop di luar jaringan lokal).

---

## 🚀 Cara Menjalankan Akses Online (1 Kali Klik)

### Opsi A: Menggunakan Batch Launcher (Paling Mudah di Windows)
Cukup klik ganda (double-click) file:
```
start_online.bat
```
Script akan otomatis:
1. Memeriksa ketersediaan Python.
2. Menjalankan backend server TataDana (`server.py`) di port 3000.
3. Menjalankan tunnel runner dengan mode **Auto-Detect** (mendeteksi Cloudflare Tunnel, OpenSSH Pinggy bawaan Windows, atau Localtunnel).
4. Menghasilkan **URL Publik HTTPS** yang aktif.
5. Otomatis menyalin URL ke clipboard Windows dan menghubungkan webhook Telegram `@PasgtaBot`.

---

### Opsi B: Menggunakan Terminal / Command Prompt
Buka Terminal (PowerShell / CMD) di direktori proyek dan jalankan:
```bash
python scripts/tunnel_runner.py
```
Atau untuk langsung mendeteksi tunnel terbaik secara otomatis:
```bash
python scripts/tunnel_runner.py --auto
```

Pilihan tunneling yang didukung secara otomatis:
1. **Cloudflare Quick Tunnel** (jika `cloudflared` terpasang): Menghasilkan domain `https://*.trycloudflare.com`.
2. **Pinggy SSH Tunnel** (menggunakan OpenSSH bawaan Windows 10/11 - *Zero Install*): Menghasilkan domain `https://*.a.pinggy.link`.
3. **Localtunnel** (menggunakan Node.js/npx): Menghasilkan domain `https://*.loca.lt`.
4. **Serveo SSH Tunnel** (menggunakan OpenSSH): Menghasilkan domain `https://*.serveo.net`.
5. **URL Kustom / Ngrok**: Jika Anda sudah menjalankan tunnel sendiri, masukkan URL publiknya di menu opsi 6 untuk otomatis menghubungkan webhook Telegram.

---

## 📱 URL Publik & Struktur Halaman Online

Setelah tunnel aktif, bagikan URL Publik HTTPS yang tampil di terminal kepada siapa saja:

| Halaman | Rute Online | Akses & Keterangan |
| :--- | :--- | :--- |
| **Landing Page Tamu** | `https://<URL-PUBLIK>/` | Default Guest Mode (`AppState.user = null`), menampilkan perkenalan fitur dan tombol Masuk/Daftar. |
| **Pendaftaran Akun** | `https://<URL-PUBLIK>/register` | Pendaftaran akun baru dengan verifikasi OTP Telegram `@PasgtaBot`. Akun baru langsung berstatus `pending`. |
| **Menunggu Persetujuan** | `https://<URL-PUBLIK>/pending-approval` | Halaman tunggu persetujuan dengan polling otomatis ke server backend setiap 3 detik dan tombol manual `[Cek Status Persetujuan]`. |
| **Login Pengguna Biasa** | `https://<URL-PUBLIK>/login` | Halaman login bersih tanpa switcher/demo Superadmin. |
| **Portal Khusus Superadmin** | `https://<URL-PUBLIK>/admin` | Login khusus Superadmin (`putriayusagita02@gmail.com`). Berisi tabel **Persetujuan User** lengkap dengan tombol `[Setujui Akun]` dan `[Tolak Akun]`. |
| **User Dashboard** | `https://<URL-PUBLIK>/dashboard` | Dashboard keuangan utama (hanya dapat dibuka oleh akun yang telah disetujui). |

---

## 🤖 Integrasi Bot Telegram `@PasgtaBot`

- **Username Bot**: `@PasgtaBot`
- **Link Bot Telegram**: [https://t.me/PasgtaBot](https://t.me/PasgtaBot)
- **Deep Link OTP**: `https://t.me/PasgtaBot?start=OTP_<kode>`
- **Webhook Endpoint**: `https://<URL-PUBLIK>/api/telegram/webhook`

### Fitur Telegram Bot:
1. **Pengiriman OTP Registrasi**: Calon pengguna mengklik tombol *"Buka Bot Telegram @PasgtaBot"* di form pendaftaran, bot akan otomatis mengirimkan kode 6-digit OTP.
2. **Catat Transaksi Natural**:
   - `beli bakso 15rb`
   - `kopi 28k pakai gopay`
   - `gajian 6jt masuk bca`
   - `bensin 25ribu tunai`
3. **Perintah Cepat Telegram**:
   - `/saldo` — Cek saldo seluruh rekening & e-wallet
   - `/jatah` — Cek sisa jatah belanja harian (TataJatah)
   - `/budget` — Cek status anggaran per kategori
   - `/hari ini` — Rekap pengeluaran hari ini
   - `/bantuan` — Panduan lengkap penggunaan bot

---

## 🔒 5 Fitur Utama yang Telah Terintegrasi Penuh

1. **Persetujuan Akun Lintas Perangkat**:
   - Pengguna baru mendaftar di HP atau browser apapun -> akun berstatus `pending` dan tersimpan di database server (`registered_users.json`).
   - Superadmin membuka `/admin` dari perangkat berbeda -> akun pendaftar tampil di tabel "Persetujuan User".
   - Superadmin mengklik `[Setujui Akun]` -> server memperbarui status -> HP pengguna yang sedang polling otomatis menerima persetujuan dan langsung beralih ke Dashboard.
2. **Pemisahan Akun & Portal Superadmin**:
   - Halaman `/login` bersih dari demo switcher.
   - Portal `/admin` memiliki login khusus Superadmin (`putriayusagita02@gmail.com`).
3. **OTP Telegram Bot**:
   - Tombol deep link Telegram di halaman pendaftaran otomatis membuka chat `@PasgtaBot`.
4. **Default Mode Tamu (Guest Mode)**:
   - Membuka root `/` selalu menampilkan Landing Page dengan `AppState.user = null`.
   - Tidak ada login paksa di `dashboard.html` maupun `admin.html`.
5. **Input Nominal Fleksibel Bahasa Indonesia**:
   - Mendukung format angka dan teks santai: `Rp50.000`, `50.000`, `50 rb`, `50k`, `1,5jt`, `gocap`, `ceban`, `lima puluh ribu`, `dua ratus lima puluh ribu`, dll.
   - Dilengkapi live preview realtime konversi nominal di formulir transaksi manual.
