# 🚀 Panduan Lengkap Deploy TataDana ke Online (Supabase + GitHub + Vercel)

Dokumen ini adalah panduan langkah demi langkah untuk membuat aplikasi **TataDana** dapat diakses oleh siapa saja di internet secara permanen, online 24 jam nonstop, tanpa bergantung pada laptop lokal Anda.

---

## 📋 Ikhtisar Arsitektur Online
- **Supabase**: Menyimpan Database PostgreSQL, Autentikasi Pengguna, Storage Foto/Laporan, dan RLS Security.
- **GitHub**: Menyimpan repositori kode sumber proyek secara aman dan tersinkronisasi.
- **Vercel**: Hosting Cloud Serverless gratis terbaik di dunia untuk aplikasi Next.js (online 24/7 dengan SSL HTTPS otomatis).
- **Telegram Bot (@PasgtaBot)**: Menerima webhook langsung dari cloud Vercel untuk pencatatan transaksi & OTP.

---

## 🛠️ LANGKAH 1: Setup Supabase (Database & Storage)

### 1.1 Buat Project Baru
1. Buka [https://supabase.com](https://supabase.com) dan login (bisa login dengan akun GitHub).
2. Klik tombol **"New Project"**.
3. Isi data:
   - **Name**: `tatadana`
   - **Database Password**: Buat password yang kuat (dan catat password tersebut).
   - **Region**: Pilih `Singapore (ap-southeast-1)` (terdekat dengan Indonesia untuk latency tercepat).
4. Klik **"Create new project"** dan tunggu 1-2 menit hingga statusnya aktif.

### 1.2 Eksekusi Skema Database (SQL Editor)
1. Di dashboard Supabase, klik menu **SQL Editor** (ikon terminal di sidebar kiri).
2. Klik **"New query"**.
3. Buka file [`supabase/combined_migrations.sql`](./supabase/combined_migrations.sql) di laptop Anda, salin (**Copy**) seluruh isinya.
4. Tempel (**Paste**) ke dalam SQL Editor Supabase.
5. Klik tombol hijau **"Run"** (atau tekan `Ctrl + Enter`).
6. Pastikan muncul pesan: `Success. No rows returned`.
   *(Catatan: Semua policy sudah dilengkapi `DROP POLICY IF EXISTS` sehingga bebas dari error `42710 policy already exists`).*

### 1.3 Siapkan Storage Buckets
1. Di sidebar kiri Supabase, klik menu **Storage** (ikon ember/bucket).
2. Klik **"New bucket"**:
   - Bucket 1:
     - Name: `avatars`
     - **Public bucket**: Centang **ON** (hijau).
     - Klik **Save**.
   - Bucket 2:
     - Name: `exports`
     - **Public bucket**: Biarkan **OFF** (Private).
     - Klik **Save**.

### 1.4 Pengaturan Autentikasi (Auth)
1. Di sidebar kiri, klik **Authentication** -> **Providers**.
2. Pastikan **Email** aktif (**Enabled**).
3. Matikan **Phone** (pilih **Disabled**) karena nomor telepon pengguna diverifikasi melalui OTP bot Telegram (@PasgtaBot), bukan SMS berbayar.

### 1.5 Ambil Kredensial API Supabase
1. Di sidebar kiri bawah, klik **Project Settings** (ikon gerigi) -> pilih **Data API**.
2. Simpan 3 nilai berikut untuk Langkah 3 (Vercel):
   - **Project URL**: contoh `https://abcdefghijklm.supabase.co`
   - **anon public key**: string panjang berawalan `eyJ...`
   - **service_role secret key**: string panjang rahasia di bawah bagian `service_role` (klik tombol *Reveal*).

---

## 🐙 LANGKAH 2: Upload Kode ke GitHub

### 2.1 Buat Repository Baru di GitHub
1. Buka [https://github.com/new](https://github.com/new).
2. Isi **Repository name**: `tatadana`.
3. Pilih opsi **Private** (atau Public sesuai preferensi Anda).
4. Biarkan opsi *"Add a README file"*, *.gitignore*, dan *license* tidak dicentang (karena proyek lokal kita sudah memilikinya).
5. Klik tombol hijau **"Create repository"**.

### 2.2 Push Kode dari Laptop ke GitHub
Buka terminal (PowerShell atau VS Code Terminal) di folder `C:\Users\Asus\.gemini\antigravity\scratch\tatadana`:

```powershell
# 1. Inisialisasi git lokal
git init

# 2. Tambahkan semua file (kecuali yang diatur di .gitignore)
git add .

# 3. Buat commit pertama
git commit -m "feat: TataDana fullstack fintech application ready for Vercel deployment"

# 4. Ganti branch utama menjadi main
git branch -M main

# 5. Hubungkan ke repository GitHub Anda (ganti <username-github-anda>)
git remote add origin https://github.com/<username-github-anda>/tatadana.git

# 6. Upload kode ke GitHub
git push -u origin main
```

*(Jika diminta login oleh GitHub, pilih Sign in with Browser dan setujui otorisasi).*

---

## ⚡ LANGKAH 3: Deploy ke Vercel (Online 24/7)

### 3.1 Hubungkan GitHub ke Vercel
1. Buka [https://vercel.com](https://vercel.com) dan login menggunakan akun **GitHub** Anda.
2. Di dashboard Vercel, klik tombol **"Add New..."** lalu pilih **"Project"**.
3. Di daftar repositori, cari repositori **`tatadana`** yang baru Anda buat, lalu klik **"Import"**.

### 3.2 Konfigurasi Environment Variables di Vercel
Sebelum mengklik tombol deploy, buka bagian accordion **"Environment Variables"** dan tambahkan variabel-variabel berikut satu per satu:

| Name | Value | Keterangan |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Diambil dari Supabase Settings API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` | Diambil dari Supabase Settings API (anon public) |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | Diambil dari Supabase Settings API (service_role secret) |
| `TELEGRAM_BOT_TOKEN` | `8725228830:AAF_56hbKIHdFIO7dWEEBaFo8dsFn5zoqDc` | Token Bot Telegram @PasgtaBot |
| `TELEGRAM_BOT_USERNAME` | `PasgtaBot` | Username Bot Telegram |
| `TELEGRAM_WEBHOOK_SECRET` | `tatadana_secret_webhook_key_2026` | Kunci rahasia pengaman webhook |
| `ENCRYPTION_KEY` | `c7e3f2a8901b4d5e6f7a8b9c0d1e2f3a` | Kunci enkripsi token internal |
| `SUPERADMIN_EMAIL` | `putriayusagita02@gmail.com` | Email akun superadmin utama |

### 3.3 Deploy!
1. Klik tombol **"Deploy"**.
2. Vercel akan otomatis melakukan build Next.js dalam 1-2 menit.
3. Setelah selesai, akan muncul animasi konfeti dan ucapan selamat beserta tautan domain online Anda, contoh:  
   👉 **`https://tatadana-fintech.vercel.app`**

---

## 🤖 LANGKAH 4: Sambungkan Webhook Telegram ke Domain Vercel

Setelah mendapatkan domain Vercel Anda (misalnya `https://tatadana-fintech.vercel.app`), Anda perlu mengarahkan bot Telegram ke domain tersebut agar bot dapat memproses chat secara realtime 24 jam.

Cukup buka browser Anda dan kunjungi URL berikut (ganti domain dengan domain Vercel Anda):

```text
https://api.telegram.org/bot8725228830:AAF_56hbKIHdFIO7dWEEBaFo8dsFn5zoqDc/setWebhook?url=https://<domain-vercel-anda>.vercel.app/api/telegram/webhook&secret_token=tatadana_secret_webhook_key_2026
```

Jika berhasil, browser akan menampilkan pesan:
```json
{
  "ok": true,
  "result": true,
  "description": "Webhook was set"
}
```

---

## ✅ LANGKAH 5: Verifikasi & Uji Coba

1. **Buka Aplikasi dari HP/Laptop**:
   - Kunjungi `https://<domain-vercel-anda>.vercel.app` -> Muncul Landing Page modern (Mode Tamu).
   - Kunjungi `https://<domain-vercel-anda>.vercel.app/login` -> Form Login User.
   - Kunjungi `https://<domain-vercel-anda>.vercel.app/admin` -> Portal Superadmin khusus `putriayusagita02@gmail.com`.
2. **Uji Coba Registrasi & OTP**:
   - Buka `/register`, masukkan nama & nomor HP.
   - Klik minta OTP -> Buka Telegram [@PasgtaBot](https://t.me/PasgtaBot) -> Terima OTP -> Masukkan di web.
   - Status user akan `pending`.
3. **Uji Coba Approval**:
   - Buka `/admin`, login dengan `putriayusagita02@gmail.com`.
   - Di tabel "Persetujuan User", klik **[✓ Setujui Akun]**.
   - Halaman user seketika berpindah ke **Dashboard** secara realtime!
4. **Uji Coba Pencatatan Transaksi**:
   - Kirim chat ke bot Telegram: *"beli makan siang 35 rb pakai bca"*.
   - Bot membalas rekap pengeluaran dan status sisa TataJatah harian.
   - Transaksi langsung muncul di Dashboard web!
