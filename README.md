# 🌸 TataDana — Aplikasi Manajemen Keuangan Terintegrasi Telegram Bot

> **Tagline:** *Catat keuangan semudah chat — langsung dari Telegram kamu*  
> **Tema Desain:** Soft Pink / Rose Quartz (`#F43F5E`, `#FB7185`) & Putih Bersih Modern Fintech  
> **Standar Waktu:** Asia/Jakarta (Waktu Indonesia Barat / WIB, UTC+7) 100%  
> **Status:** Production-Ready Fullstack SaaS (Next.js 15 + Supabase + Telegram Bot Engine)

---

## 📑 Daftar Isi Dokumentasi
1. [Bagian A: Ringkasan Produk & Visi Finansial](#-bagian-a-ringkasan-produk--visi-finansial)
2. [Bagian B: Arsitektur Sistem & Tech Stack](#-bagian-b-arsitektur-sistem--tech-stack)
3. [Bagian C: Skema Database & Migrasi Supabase](#-bagian-c-skema-database--migrasi-supabase)
4. [Bagian D: TataJatah — Fitur Signature Finansial](#-bagian-d-tatajatah--fitur-signature-finansial)
5. [Bagian E: Integrasi Telegram Bot & Webhook Engine](#-bagian-e-integrasi-telegram-bot--webhook-engine)
6. [Bagian F: Multi-Provider AI Engine & Failover](#-bagian-f-multi-provider-ai-engine--failover)
7. [Bagian G: Web Dashboard & Fitur Pengguna](#-bagian-g-web-dashboard--fitur-pengguna)
8. [Bagian H: Superadmin Console & Keamanan](#-bagian-h-superadmin-console--keamanan)
9. [Bagian I: Panduan Menjalankan di Komputer Lokal (Localhost Quickstart)](#-bagian-i-panduan-menjalankan-di-komputer-lokal)
10. [Bagian J: Environment Variables & Deployment Checklist](#-bagian-j-environment-variables--deployment-checklist)
11. [Bagian K: Revisi Dosen & Aturan Prioritas Tertinggi (Part 14 Spesifikasi Lengkap)](#-bagian-k-revisi-dosen--aturan-prioritas-tertinggi-part-14-spesifikasi-lengkap)

---

## 🎯 Bagian A: Ringkasan Produk & Visi Finansial

### 1. Latar Belakang Masalah
Banyak masyarakat Indonesia, terutama karyawan berpenghasilan UMK, freelancer dengan arus kas tidak tentu, dan mahasiswa perantau, mengalami sindrom "gaji habis sebelum akhir bulan". Kebiasaan mencatat keuangan sering gagal karena:
- Aplikasi perbankan dan pencatatan konvensional terlalu rumit (banyak menu, login berulang).
- Pengeluaran mikro (kopi, cemilan, parkir, jajan online) terlewat dan terakumulasi besar.
- Tidak adanya batasan belanja harian yang jelas sehingga uang dibelanjakan tanpa perhitungan.

### 2. Solusi TataDana
TataDana menghadirkan pencatatan keuangan instan melalui aplikasi yang setiap hari sudah dibuka pengguna: **Telegram**.
- **Tanpa Buka Aplikasi Tambahan:** Cukup ketik kalimat sehari-hari (*"beli bakso 15rb"*), kirim Voice Note, atau foto struk belanjaan.
- **TataJatah:** Menghitung jatah belanja harian aman agar pengguna selalu tahu batas pengeluaran per hari hingga tanggal gajian berikutnya.
- **Disiplin Finansial Positif:** Fitur streak 🔥 dan simulasi instan *"Kalau Aku Beli Ini?"* mencegah pembelian impulsif sebelum gajian.

---

## 🏗️ Bagian B: Arsitektur Sistem & Tech Stack

```
                          ┌────────────────────────┐
                          │     Telegram User      │
                          └───────────┬────────────┘
                                      │ (Teks Kasual / VN / Struk)
                                      ▼
                          ┌────────────────────────┐
                          │ Telegram Bot API Server │
                          └───────────┬────────────┘
                                      │ HTTPS Webhook POST
                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        TATADANA FULLSTACK CORE                         │
│                                                                        │
│   Next.js 15 App Router (/api/telegram/webhook)                        │
│   ├── Dual App Routing: app.tatadana.id (User) vs admin.tatadana.id    │
│   ├── Idempotency Check (update_id deduping)                           │
│   ├── Telegram OTP Engine (HMAC-SHA256, 5 min expiry, 5x max attempts)│
│   ├── Deterministic Nominal Parser (parse-nominal.ts, slang & words)   │
│   ├── Multi-Provider AI (Gemini 2.0 Flash / OpenAI / DeepSeek)         │
│   └── TataJatah Engine (Safe Daily Allowance & Streak Calculator)      │
└─────────────────────────────────────┬──────────────────────────────────┘
                                      │ Database Query & RLS
                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   SUPABASE POSTGRESQL & STORAGE                        │
│   ├── admin_emails (putriayusagita02@gmail.com superadmin bypass)     │
│   ├── profiles.status ('pending', 'approved', 'rejected')              │
│   ├── telegram_otps (token, otp_hash, attempts, expiry)               │
│   ├── Triggers Saldo Otomatis (AFTER INSERT/UPDATE/DELETE)             │
│   ├── RLS Helper Functions: is_admin() & is_approved()                 │
│   └── Storage Buckets: 'avatars' (public) & 'exports' (signed URLs)    │
└────────────────────────────────────────────────────────────────────────┘
```

- **Frontend & App Engine:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Lucide Icons, Plus Jakarta Sans.
- **Database & Storage:** Supabase PostgreSQL dengan Row Level Security (RLS) & Triggers Saldo Otomatis.
- **AI Multimodal Provider:** Google Gemini 2.0 Flash (Default Utama), OpenAI GPT-4o-mini (Failover), DeepSeek Chat.
- **Local Fallback:** Interactive in-memory fallback adapter yang memungkinkan seluruh aplikasi langsung diuji tanpa setup Supabase eksternal.

---

## 🗄️ Bagian C: Skema Database & Migrasi Supabase

File migrasi database tersedia di:
- Inisialisasi: `supabase/migrations/20261013000000_init_tatadana.sql`
- Revisi Dosen Part 14: `supabase/migrations/20261014000000_part14_revisi_dosen.sql`
- Seed data instan: `supabase/seed.sql`

### 1. Struktur Tabel Utama
- `admin_emails`: Daftar email admin resmi (`putriayusagita02@gmail.com`) yang otomatis memperoleh role superadmin dan status `approved` tanpa melewati antrian persetujuan atau OTP Telegram.
- `profiles`: Data pengguna, nomor HP, peran (`user`, `superadmin`), status (`pending`, `approved`, `rejected`), alasan penolakan (`rejection_reason`), status verifikasi, dan avatar URL.
- `telegram_otps`: Penyimpanan sesi OTP Telegram, token pendaftaran, hash kode OTP (HMAC-SHA256), timestamp kedaluwarsa 5 menit, dan penghitung percobaan (maksimal 5x).
- `wallets`: Multi-wallet (bank BCA/Mandiri, e-wallet GoPay/OVO, cash tunai), alias tag, saldo, dan penanda default Telegram.
- `categories`: Kategori pemasukan & pengeluaran lengkap dengan emoji (🍜 🚗 🛒 💰) dan warna.
- `budgets`: Limit budget bulanan per kategori dengan pelacak notifikasi alert 80% dan 100%.
- `transactions`: Catatan transaksi lengkap (amount, date WIB, source: telegram/voice/ocr/web).
- `transaction_items`: Rincian per item belanja untuk hasil scan struk AI (nama barang, qty, harga satuan, subtotal).
- `transfers`: Pencatatan mutasi saldo antar dompet beserta fee transaksi.
- `telegram_updates`: Log idempotency `update_id` Telegram untuk mencegah pencatatan ganda.
- `bills`: Tagihan rutin bulanan (kos, listrik PLN, wifi, cicilan) dengan toggle status bayar per siklus.
- `jatah_settings`: Parameter tanggal gajian, target tabungan, dan aktivasi rollover sisa jatah harian.
- `daily_jatah`: Log jatah harian dan status kepatuhan (🟢 aman, 🟡 hati-hati, 🔴 lewat jatah).
- `streaks`: Penghitung hari berturut-turut pencatatan keuangan dan reward badge (3, 7, 14, 30 hari).
- `ai_providers` & `ai_logs`: Konfigurasi provider AI dan audit performa (tokens, latency, estimasi biaya).
- `payments`: Riwayat tagihan upgrade paket Pro (Midtrans QRIS / transfer bank manual).
- `audit_logs`: Pencatatan ketat aktivitas penolakan user, persetujuan user, inspeksi transaksi, dan audit impersonation admin.

### 2. Fungsi RLS Helper & Trigger
- `is_admin()`: Mengembalikan `true` jika user login terdaftar di `admin_emails` atau memiliki `role = 'superadmin'`.
- `is_approved()`: Mengembalikan `true` jika user login memiliki status `approved` atau merupakan admin.
- `trg_profile_admin_check`: Trigger otomatis pada tabel `profiles` saat insert/update email, langsung menjadikan user `superadmin` dan `approved` jika emailnya ada di `admin_emails`.
- `admin_set_user_status(user_id, status, reason)`: Fungsi yang dilindungi `is_admin()` untuk menyetujui atau menolak pendaftaran user dengan alasan wajib jika ditolak, disertai pencatatan audit log otomatis.
- `admin_get_user_transactions(user_id)`: Fungsi inspeksi transaksi user oleh superadmin dengan pencatatan audit log otomatis.

---

## 🎯 Bagian D: TataJatah — Fitur Signature Finansial

TataJatah adalah formula paten TataDana yang memecahkan masalah kehabisan uang sebelum akhir bulan:

### 1. Formula Safe Daily Allowance
$$\text{Jatah Harian Aman} = \frac{\text{Total Saldo Dompet} - \text{Sisa Tagihan Rutin Belum Bayar} - \text{Target Tabungan Bulanan}}{\text{Sisa Hari Menuju Tanggal Gajian}}$$

### 2. Tiga Status Indikator Visual
- 🟢 **Aman Terkendali:** Pengeluaran hari ini $< 70\%$ dari jatah harian.
- 🟡 **Hati-hati:** Pengeluaran hari ini $70\% - 100\%$ dari jatah harian (mendekati batas).
- 🔴 **Lewat Jatah:** Pengeluaran hari ini $> 100\%$ dari jatah harian.

### 3. Simulasi *"Kalau Aku Beli Ini?"*
Modal interaktif di mana pengguna memasukkan harga barang yang ingin dibeli (misal sepatu Rp350.000). Sistem seketika menghitung:
- Penurunan nominal jatah per hari untuk sisa hari yang ada.
- Persentase dampak terhadap arus kas.
- Rekomendasi AI: *Aman Dibeli*, *Pertimbangkan Lagi*, atau *Berisiko Tinggi Defisit*.

### 4. Streak Pencatatan 🔥
Mendorong kebiasaan mencatat setiap hari dengan milestone badges:
- 🔥 3 Hari Konsisten
- ⚡ 7 Hari Pejuang Jatah
- 🏆 14 Hari Master Budget
- 👑 30 Hari Pengendali Finansial

---

## 🤖 Bagian E: Integrasi Telegram Bot & Webhook Engine

Endpoint Webhook: `/api/telegram/webhook`  
Spesifikasi Bot: Menggunakan token bot resmi dari @BotFather dan verifikasi rahasia header `X-Telegram-Bot-Api-Secret-Token`.

### 1. Alur Pendaftaran & OTP Telegram (Part 14.4)
1. Pengguna mendaftar di Web App (`/register`).
2. Web App menghasilkan token pendaftaran unik dan tautan deep-link `https://t.me/TataDanaBot?start=REG_<token>`.
3. Pengguna membuka bot dan menekan Start. Bot menampilkan tombol *"Bagikan Nomor HP Saya (Kontak Resmi)"*.
4. Bot memvalidasi kepemilikan kontak (`contact.user_id === from.id`).
5. Bot menghasilkan 6 digit angka OTP, menyimpannya dalam hash HMAC-SHA256 dengan batas 5 menit dan maksimal 5 kali percobaan di tabel `telegram_otps`.
6. Pengguna memasukkan kode OTP di Web App `/verifikasi-telegram`.
7. Setelah OTP valid, pengguna diarahkan ke layar `/menunggu-persetujuan` hingga disetujui Superadmin di `/admin`.

### 2. Parser Nominal Deterministik (Part 14.5)
TataDana menerapkan modul parser deterministik (`src/lib/parse-nominal.ts`) yang mampu mengenali seluruh format mata uang Indonesia:
- **Prefix / Suffix Resmi:** `"Rp50.000"`, `"IDR 75.000"`, `"Rp 1.500.000"`
- **Singkatan Populer:** `"15rb"` $\to$ 15.000, `"2.5jt"` $\to$ 2.500.000, `"50k"` $\to$ 50.000, `"100 rebu"` $\to$ 100.000, `"1jt500rb"` $\to$ 1.500.000
- **Angka Terbilang Bahasa Indonesia:** `"dua puluh lima ribu"` $\to$ 25.000, `"satu juta lima ratus ribu rupiah"` $\to$ 1.500.000, `"tiga ratus ribu"` $\to$ 300.000
- **Slang / Percakapan Sehari-hari:** `"goceng"` $\to$ 5.000, `"ceban"` $\to$ 10.000, `"gocap"` $\to$ 50.000, `"cepek"` $\to$ 100, `"noceng"` $\to$ 2.000, `"seceng"` $\to$ 1.000, `"5 ceban"` $\to$ 50.000, `"cepek ceng"` $\to$ 100.000
- **Deteksi Dompet & Pos Otomatis:** *"makan siang bakso 25k pakai gopay"* langsung mendeteksi nominal 25.000, kategori makanan, dan memotong dompet GoPay.

### 3. Daftar Perintah Bot Lengkap
- `/start`: Pendaftaran akun atau deep-link OTP verifikasi.
- `/saldo`: Cek saldo semua dompet dan total aset secara instan.
- `/dompet`: Tampilkan dompet aktif dan ganti default via inline keyboard.
- `/jatah`: Ringkasan status TataJatah harian, sisa jatah hari ini, dan streak 🔥.
- `/budget`: Status persentase pemakaian budget kategori dengan visual bar.
- `/hari ini`: Rekap pengeluaran dan pemasukan pada hari berjalan (WIB).
- `/minggu ini`: Rekap transaksi 7 hari terakhir.
- `/bulan ini`: Ringkasan cashflow bulan berjalan dan net surplus.
- `/rekap`: Evaluasi keuangan dan saran hemat proaktif.
- `/laporan`: Tautan langsung untuk download laporan PDF/Excel di web.
- `/bantuan`: Panduan format pesan kasual dan daftar perintah.

---

## 🧠 Bagian F: Multi-Provider AI Engine & Failover

Dikelola melalui Superadmin Console di `/admin`:
1. **Google Gemini (Gemini 2.0 Flash):**
   - Default utama untuk parsing teks, ekstraksi struk belanja OCR multimodal, dan transkrip audio voice note.
2. **OpenAI GPT (GPT-4o-mini):**
   - Standby provider yang otomatis dipanggil jika Gemini mengalami timeout atau rate limit.
3. **DeepSeek (DeepSeek Chat V3):**
   - Secondary failover opsional untuk efisiensi biaya komputasi tinggi.
4. **Mode Operasi:**
   - *Single Provider:* Menggunakan hanya satu provider terpilih.
   - *Paralel Failover:* Otomatis mengalihkan permintaan ke standby provider jika provider utama gagal.

---

## 💻 Bagian G: Web Dashboard & Fitur Pengguna

Aplikasi web dapat diakses di `/dashboard`:
- **🏠 Beranda:** Hero Card TataJatah dengan SVG progress ring, 4 Stat Cards, grafik bar cashflow, breakdown kategori, dan mutasi terbaru.
- **💳 Transaksi:** Tabel mutasi lengkap dengan filter pencarian, filter dompet, filter jenis, dan **DateRangeFilter dinamis** yang tersinkronisasi URL query (`?from=&to=&range=`).
- **📊 Laporan & Native Export (PDF & Excel):**
  - Pembuatan berkas **PDF Resmi** on-demand berbasis standar binary PDF 1.4 yang dapat diunduh langsung (`.pdf`).
  - Pembuatan berkas **Spreadsheet Excel** on-demand dengan UTF-8 BOM, pemformatan kolom keuangan, dan baris total net cashflow (`.csv` / `.xlsx`).
  - Metrik periode aktif (Total Pemasukan, Total Pengeluaran, Net Cashflow, Rasio Tabungan) yang dihitung secara dinamis sesuai rentang tanggal aktif.
- **🎯 Budget Bulanan:** Progress bar interaktif dengan indikator visual alert 80% dan 100%.
- **👛 Multi-Wallet:** Manajemen banyak rekening/e-wallet dengan alias tag, toggle default bot, dan tombol arsip.
- **🗓️ Kalender Jatah:** Heatmap kalender bulanan dengan pewarnaan kepatuhan jatah harian (hijau/kuning/merah) dan modal detail transaksi per tanggal.
- **⚙️ Pengaturan:** Profil dengan upload foto avatar ke Supabase Storage (`avatars`), integrasi token bot Telegram, reminder harian WIB, manajemen kategori, dan konfigurasi tagihan rutin TataJatah.

---

## 🛡️ Bagian H: Superadmin Console & Keamanan

Dikelola di subdomain terpisah `/admin` (`admin.tatadana.id`):
- **Superadmin Pertama Otomatis (Part 14.3):** Akun `putriayusagita02@gmail.com` otomatis berstatus superadmin dan approved tanpa verifikasi OTP atau persetujuan pihak lain.
- **Persetujuan Pendaftaran User (Part 14.2):**
  - Daftar antrian user baru berstatus `pending` lengkap dengan nomor HP dan nama.
  - Tombol **Setujui**: Mengubah status user menjadi `approved`, membuka akses dashboard seketika via Supabase Realtime.
  - Tombol **Tolak**: Membuka modal dengan **alasan penolakan wajib** (tidak boleh kosong), mencatat ke audit log, dan mengarahkan user ke `/ditolak`.
- **Inspeksi Transaksi Pengguna (Part 14.7):**
  - Superadmin dapat memeriksa seluruh riwayat transaksi setiap pengguna.
  - Setiap akses inspeksi dicatat secara permanen di tabel `audit_logs` demi kepatuhan privasi finansial.
- **Audit Logs:** Pencatatan aktivitas persetujuan, penolakan, impersonation, dan perubahan provider AI dengan timestamp WIB dan alamat IP.

---

## 🚀 Bagian I: Panduan Menjalankan di Komputer Lokal

### Opsi 1: Mode Next.js 15 Fullstack Development (Direkomendasikan)
```bash
npm install
npm run dev
```
Buka browser di: **[http://localhost:3000](http://localhost:3000)**

### Opsi 2: Mode Instan Node.js
```bash
node server.js
```
Buka browser di: **[http://localhost:3000](http://localhost:3000)**

### Opsi 3: Mode Instan Python (Zero Dependency)
```bash
python server.py
```
Buka browser di: **[http://localhost:3000](http://localhost:3000)**

---

## ⚙️ Bagian J: Environment Variables & Deployment Checklist

### 1. Salin File `.env`
```bash
cp .env.example .env
```
Isi konfigurasi pada file `.env`:
- `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPERADMIN_EMAIL=putriayusagita02@gmail.com`
- `ADMIN_EMAILS=putriayusagita02@gmail.com`
- `TELEGRAM_BOT_TOKEN` (didapat dari @BotFather)
- `TELEGRAM_BOT_SECRET_TOKEN` (token rahasia untuk header webhook)
- `TELEGRAM_OTP_SECRET` (kunci rahasia HMAC-SHA256 untuk hash OTP)
- `WEBHOOK_BASE_URL` (URL HTTPS publik aplikasi Anda)
- `GEMINI_API_KEY` (kunci API Google Gemini)

### 2. Pengujian Bot Telegram Asli
Jalankan bot runner mandiri:
```bash
python scripts/telegram_bot_runner.py
```
Masukkan token bot dari @BotFather. Bot seketika online dan tersinkronisasi dengan database!

---

## 🏛️ Bagian K: Revisi Dosen & Aturan Prioritas Tertinggi (Part 14 Spesifikasi Lengkap)

Bagian ini mendokumentasikan pemenuhan seluruh butir revisi dosen prioritas tertinggi (Part 14):

### 14.1 Dua Aplikasi Terpisah (User & Admin)
- **User App:** `app.tatadana.id` (atau `/` pada localhost). Memiliki layout consumer fintech, soft pink rose, fitur TataJatah, mutasi, dan laporan.
- **Admin App:** `admin.tatadana.id` (atau `/admin` pada localhost). Memiliki layout dark slate modern, sidebar rose accent, menu Persetujuan User, Kelola User, Provider AI, dan Audit Trail.
- **Middleware Guard (`src/middleware.ts` & `src/lib/auth-guard.ts`):** Fungsi `decideRoute` mengevaluasi host/domain dan status login. Tamu yang membuka `/admin` otomatis diarahkan ke `/masuk?redirect=/admin`. Tamu yang membuka `/dashboard` diarahkan ke `/login`.

### 14.2 Alur Persetujuan Registrasi User
- Pengguna mendaftar $\to$ Verifikasi OTP Telegram $\to$ Layar Tunggu `/menunggu-persetujuan` dengan listener Supabase Realtime $\to$ Admin menyetujui di `/admin` $\to$ User otomatis masuk ke `/dashboard`.
- Jika Admin menolak pendaftaran di `/admin`, muncul modal dengan **alasan penolakan wajib**. User diarahkan ke `/ditolak` dengan alasan penolakan ditampilkan jelas.

### 14.3 Setup Superadmin Pertama (`admin_emails`)
- Akun resmi dosen: `putriayusagita02@gmail.com`.
- Terdaftar di tabel `public.admin_emails`.
- Trigger `handle_admin_email_onboarding` otomatis menjadikan email tersebut `superadmin` dan `approved` tanpa memerlukan OTP Telegram maupun persetujuan admin lain.
- Pada halaman `/login` dan `/masuk`, disediakan tombol shortcut instan 1-klik untuk login sebagai Superadmin Dosen.

### 14.4 OTP Telegram Menggantikan SMS OTP
- Verifikasi nomor telepon menggunakan Telegram Bot, bukan SMS OTP konvensional.
- Bot memvalidasi bahwa `contact.user_id === from.id` (mencegah manipulasi kontak orang lain).
- Token registrasi disimpan di tabel `telegram_otps` dengan hash HMAC-SHA256 (`otp_hash`), kedaluwarsa 5 menit, dan proteksi maksimal 5 kali percobaan.

### 14.5 Parser Nominal Deterministik (`src/lib/parse-nominal.ts`)
- Mampu mengekstrak nominal dari kalimat bahasa Indonesia apa pun tanpa ketergantungan mutlak pada LLM.
- Mendukung slang: *goceng* (5.000), *ceban* (10.000), *gocap* (50.000), *cepek* (100), *noceng* (2.000), *5 ceban* (50.000), *cepek ceng* (100.000).
- Mendukung gabungan: *1jt500rb* (1.500.000), *15 rebu* (15.000), *25k* (25.000).
- Telah diuji dengan 30+ unit test komprehensif di `tests/parse-nominal.test.ts`.

### 14.6 Proteksi Halaman Landing Page
- Pengguna tamu (guest) yang membuka root `/` hanya melihat landing page publik (hero, fitur, demo interaktif bot Telegram, paket harga, FAQ).
- Navigasi tidak membocorkan tautan langsung ke `/dashboard` untuk tamu. Ketika pengguna telah login, tombol CTA di navbar dan hero secara cerdas berganti menjadi *"Buka Dashboard ➔"*.

### 14.7 Supabase CLI Migration Commands & Storage
Perintah resmi Supabase CLI untuk migrasi dan replikasi skema:
```bash
# 1. Login ke Supabase CLI
supabase login

# 2. Inisialisasi proyek Supabase lokal
supabase init

# 3. Jalankan container Supabase lokal (Postgres, Auth, Storage, Realtime)
supabase start

# 4. Terapkan seluruh migrasi berurutan
supabase migration up

# 5. Alternatif: Terapkan migrasi langsung ke project remote Supabase
supabase db push

# 6. Reset database lokal (Drop skema, re-apply semua migrasi, dan eksekusi seed.sql)
supabase db reset

# 7. Pembuatan bucket storage dengan kebijakan RLS ketat
# Bucket 'avatars' (public view, user upload/update/delete restricted)
supabase storage new avatars --public

# Bucket 'exports' (private, signed URLs only)
supabase storage new exports --private
```

### 14.8 Tabel Kepatuhan Definisi Selesai (Definition of Done)

| No | Kriteria Definisi Selesai | Status | Keterangan Implementasi |
|:---|:---|:---:|:---|
| 1 | 2 Aplikasi Terpisah (User `app.tatadana.id` & Admin `admin.tatadana.id`) | ✅ 100% | Layout terpisah, `decideRoute` & Next.js middleware, role protection `is_admin()`. |
| 2 | Alur Persetujuan Registrasi User (`profiles.status`: pending, approved, rejected) | ✅ 100% | Realtime status listener di `/menunggu-persetujuan`, modal penolakan dengan alasan wajib di `/admin`. |
| 3 | Superadmin Pertama `putriayusagita02@gmail.com` di `admin_emails` | ✅ 100% | Bypass OTP & approval otomatis via trigger Postgres `handle_admin_email_onboarding`. |
| 4 | OTP Telegram via Bot Resmi menggantikan SMS OTP | ✅ 100% | Verifikasi `contact.user_id === from.id`, HMAC-SHA256 hash, 5 menit kedaluwarsa, 5x limit. |
| 5 | Parser Nominal Deterministik (`parse-nominal.ts`) | ✅ 100% | Mendukung seluruh singkatan (rb, jt, k), angka terbilang, dan slang (*goceng, ceban, gocap, cepek, 5 ceban*). |
| 6 | Landing Page Terlindungi untuk Tamu | ✅ 100% | Root `/` hanya menampilkan landing page; `/dashboard` terproteksi di balik autentikasi. |
| 7 | Storage Buckets (`avatars`, `exports`) & Supabase CLI Migrations | ✅ 100% | Bucket avatars publik & exports private dengan kebijakan RLS berbasis kepemilikan user. |
| 8 | Laporan Native Export (PDF & Excel) & DateRangeFilter Dinamis | ✅ 100% | Filter rentang tanggal tersinkronisasi URL (`?from=&to=&range=`), generator blob on-demand PDF 1.4 dan Excel CSV. |
