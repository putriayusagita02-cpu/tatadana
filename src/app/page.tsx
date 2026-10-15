'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { tatadanaStore } from '@/lib/supabase';

export default function HomePage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [simPurchase, setSimPurchase] = useState<number>(350000);
  const [simName, setSimName] = useState<string>('Sepatu Olahraga Running');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const active = tatadanaStore.getActiveUser();
      if (active) {
        setCurrentUser(active);
      }
    }
  }, []);

  // Interactive allowance simulation logic
  const currentDailyAllowance = 371000;
  const daysLeft = 12;
  const currentTotalUsable = currentDailyAllowance * daysLeft;
  const newTotalUsable = Math.max(0, currentTotalUsable - simPurchase);
  const newDailyAllowance = Math.round(newTotalUsable / daysLeft);
  const diffPerDay = currentDailyAllowance - newDailyAllowance;
  const percentImpact = currentDailyAllowance > 0 ? Math.round((diffPerDay / currentDailyAllowance) * 100) : 0;

  const faqs = [
    {
      q: 'Apa itu TataDana dan bagaimana cara kerjanya?',
      a: 'TataDana adalah aplikasi manajemen keuangan pribadi terintegrasi Bot Telegram resmi. Kamu tidak perlu membuka aplikasi rumit untuk mencatat keuangan; cukup ketik chat natural (misal: "beli bakso 15rb pakai gopay"), kirim voice note, atau foto struk belanja di Telegram. Transaksi langsung tersinkronisasi realtime ke dashboard web.',
    },
    {
      q: 'Apakah bisa foto struk belanja di paket Starter?',
      a: 'Di paket Starter, kamu bisa mencatat via teks chat natural dan voice note. Fitur scan struk belanja dengan AI Vision OCR multi-item tersedia eksklusif pada paket Pro seharga Rp99.000 sekali bayar selamanya.',
    },
    {
      q: 'Bagaimana keamanan data transaksi saya di TataDana?',
      a: 'Sangat aman dan terisolasi. Database TataDana dilindungi Row Level Security (RLS) PostgreSQL Supabase, webhook secret token verification, dan hashing HMAC OTP. Kami tidak pernah meminta kredensial perbankan atau PIN dompet digital Anda.',
    },
    {
      q: 'Apakah saya bisa memilih dompet BCA / Mandiri / GoPay langsung dari bot?',
      a: 'Bisa banget! Ada 3 cara: (1) Sebut langsung di kalimat chat ("beli sate 25rb pakai gopay"), (2) Tekan tombol [🔄 Ganti Dompet] pada balasan bot, atau (3) Aktifkan mode "Selalu tanya dompet" di menu Pengaturan sehingga bot menampilkan tombol pilihan dompet sebelum menyimpan.',
    },
    {
      q: 'Apakah saya perlu membuat bot Telegram sendiri lewat BotFather?',
      a: 'Tidak perlu sama sekali! TataDana menyediakan 1 bot bersama yang langsung siap pakai. Kamu cukup menghubungkan akun web dengan menekan /start atau scan QR code yang disediakan.',
    },
    {
      q: 'Apa itu fitur signature TataJatah?',
      a: 'TataJatah adalah algoritma pengendali pengeluaran harian. Rumusnya: (Total Saldo Dompet - Sisa Tagihan Wajib Sebelum Gajian - Target Tabungan) / Sisa Hari Sampai Gajian. Fitur ini memberi kamu nominal belanja aman per hari agar gaji tidak habis sebelum tanggal gajian tiba.',
    },
    {
      q: 'Bisakah saya mengekspor laporan keuangan ke Excel atau PDF?',
      a: 'Tentu saja! Pengguna paket Pro dapat mengekspor rekap keuangan lengkap dengan detail per merchant dan rincian belanja ke file PDF resmi siap cetak atau file spreadsheet Microsoft Excel (.xlsx) kapan saja.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-rose-100 selection:text-rose-600">
      {/* 1. NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-rose-100 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-400 flex items-center justify-center text-white font-black text-xl shadow-md shadow-rose-500/20">
              TD
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-rose-600 to-rose-400 bg-clip-text text-transparent">
                TataDana
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full border border-rose-200">
                Fintech ID • WIB
              </span>
            </div>
          </Link>

          {/* Center Navigation Links - Hanya menu landing page untuk umum */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
            <a href="#problems" className="hover:text-rose-600 transition">Mengapa Kami</a>
            <a href="#features" className="hover:text-rose-600 transition">Fitur Unggulan</a>
            <a href="#tatajatah" className="hover:text-rose-600 transition font-semibold text-rose-600 flex items-center gap-1">
              <span>TataJatah</span>
              <span className="text-[10px] bg-rose-100 text-rose-600 px-1.5 py-0.2 rounded font-bold">Signature</span>
            </a>
            <a href="#pricing" className="hover:text-rose-600 transition">Harga</a>
            <a href="#faq" className="hover:text-rose-600 transition">FAQ</a>
          </nav>

          {/* Right CTAs - Berganti secara dinamis jika user sudah login (Part 14.6) */}
          <div className="flex items-center space-x-3">
            {currentUser ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-md shadow-rose-500/25 transition active:scale-95 flex items-center gap-1.5"
              >
                <span>🚀</span>
                <span>Buka Dashboard ({currentUser.full_name?.split(' ')[0]})</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/masuk"
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-rose-600 transition"
                >
                  Masuk
                </Link>
                <Link
                  href="/daftar"
                  className="px-4 py-2 text-xs font-bold bg-rose-500 text-white rounded-xl shadow-md shadow-rose-500/25 hover:bg-rose-600 transition active:scale-95"
                >
                  Coba Gratis
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 text-center">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold mb-6 animate-pulse">
          <span>✨</span>
          <span>Catat keuangan langsung dari Telegram</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight sm:leading-none">
          Gaji habis sebelum akhir bulan? Sudah saatnya kamu tahu{' '}
          <span className="bg-gradient-to-r from-rose-600 via-rose-500 to-pink-500 bg-clip-text text-transparent">
            ke mana uangmu pergi.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          TataDana mencatat setiap pengeluaranmu langsung dari chat Telegram atau foto struk — sisanya kami yang urus dengan formula <strong>TataJatah</strong> pintar.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          {currentUser ? (
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-4 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl shadow-xl shadow-rose-500/30 text-base transition active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Buka Dashboard Saya</span>
              <span>→</span>
            </Link>
          ) : (
            <Link
              href="/daftar"
              className="w-full sm:w-auto px-8 py-4 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl shadow-xl shadow-rose-500/30 text-base transition active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Mulai Gratis Sekarang</span>
              <span>→</span>
            </Link>
          )}
          <a
            href="#preview"
            className="w-full sm:w-auto px-8 py-4 bg-white border border-rose-200 hover:border-rose-400 text-rose-600 font-bold rounded-2xl shadow-sm text-base transition flex items-center justify-center gap-2"
          >
            <span>Lihat cara kerjanya →</span>
          </a>
        </div>

        {/* Hero Video Placeholder (Part 7 Spec) */}
        <div className="mt-12 max-w-2xl mx-auto">
          {/* // TODO: ganti dengan video asli demo TataDana */}
          <div className="p-4 bg-white rounded-2xl border border-rose-100 shadow-sm flex items-center justify-center text-xs text-slate-400 gap-2">
            <span>📹</span>
            <span>Video Teaser TataDana Finansial (Placeholder // TODO: ganti dengan video asli)</span>
          </div>
        </div>

        {/* 3. INTERACTIVE DASHBOARD PREVIEW (Part 7: Dummy interaktif, bisa diklik, preview chat Telegram asli) */}
        <div id="preview" className="mt-10 max-w-3xl mx-auto bg-white rounded-3xl border border-rose-100 shadow-2xl overflow-hidden text-left">
          <div className="bg-gradient-to-r from-sky-500 to-sky-600 px-5 py-3.5 flex items-center justify-between text-white">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-base">🤖</div>
              <div>
                <h4 className="font-bold text-sm">TataDana Bot (@TataDanaOfficialBot)</h4>
                <p className="text-[11px] text-sky-100 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                  <span>Online • Webhook Active (WIB)</span>
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-white/20 rounded-full">Interactive Preview</span>
          </div>

          <div className="p-5 sm:p-6 space-y-4 bg-slate-50 text-xs">
            {/* User message */}
            <div className="flex justify-end">
              <div className="bg-rose-500 text-white p-3 rounded-2xl rounded-tr-sm max-w-xs shadow-sm">
                beli bakso 15rb pakai gopay
              </div>
            </div>

            {/* Official Bot reply (Format Part 4.5) */}
            <div className="flex items-start space-x-2.5">
              <div className="w-7 h-7 rounded-full bg-sky-500 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0">TD</div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-3.5 max-w-md shadow-sm space-y-2 text-slate-700 leading-relaxed">
                <p className="text-[10px] text-slate-400">📅 Selasa, 13 Oktober 2026 — 14:20 WIB</p>
                <p className="font-bold text-slate-900">💸 Pengeluaran tercatat!</p>
                <div className="space-y-0.5 text-[11px]">
                  <p>├ Nominal : <strong>Rp15.000</strong></p>
                  <p>├ Kategori : 🍜 Makanan & Minuman</p>
                  <p>├ Dompet : 👛 <strong>GoPay</strong></p>
                  <p>├ Catatan : beli bakso 15rb pakai gopay</p>
                  <p>└ Saldo : <strong>Rp405.000</strong></p>
                </div>
                <div className="p-2 bg-rose-50 rounded-lg text-[10px] text-rose-700 font-semibold space-y-1">
                  <p>📊 Budget Makanan bulan ini:</p>
                  <p>███████░░░ 71% — sisa Rp580.000</p>
                  <p className="text-emerald-700 pt-0.5 font-bold">🎯 Sisa jatah hari ini: Rp356.000</p>
                </div>
                {/* Inline Keyboard Buttons */}
                <div className="flex gap-2 pt-1">
                  <button onClick={() => alert('Fitur demo inline button: Mengganti dompet dari bot')} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-md font-bold text-slate-700 transition">
                    🔄 Ganti Dompet
                  </button>
                  <button onClick={() => alert('Fitur demo inline button: Membatalkan transaksi')} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-md font-bold text-slate-700 transition">
                    🗑️ Hapus
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PROBLEM SECTION (Bullet masalah problem aware) */}
      <section id="problems" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">Problem Aware</span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-3">Mengapa Kebiasaan Mencatat Keuangan Sering Gagal?</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl font-bold">⏳</div>
            <h3 className="font-extrabold text-base text-slate-900">"Buka aplikasi keuangan? Nanti dulu deh..."</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Aplikasi biasa terlalu lambat dan rumit. Harus login berkali-kali dan mengisi formulir panjang hanya untuk mencatat segelas es kopi.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl font-bold">💸</div>
            <h3 className="font-extrabold text-base text-slate-900">"Kok uangnya habis ya? Padahal kayak tidak beli apa-apa"</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pengeluaran mikro Rp15rb - Rp30rb per hari tidak terasa dan menumpuk hingga jutaan rupiah tanpa jejak yang jelas.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl font-bold">📅</div>
            <h3 className="font-extrabold text-base text-slate-900">"Udah niat bikin budget, tapi seminggu lupa"</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tidak ada pemicu otomatis yang mengingatkan di aplikasi chat yang setiap saat kamu gunakan.
            </p>
          </div>
        </div>

        {/* Transisi Solusi */}
        <div className="text-center mt-12 py-8 bg-gradient-to-r from-rose-50 to-pink-50 rounded-3xl border border-rose-100">
          <p className="text-base sm:text-lg font-bold text-slate-700">
            "Bagaimana kalau mencatat keuangan semudah kirim pesan ke teman?"
          </p>
          <p className="text-xl sm:text-2xl font-black text-rose-600 mt-1">
            Introducing TataDana 🌸
          </p>
        </div>
      </section>

      {/* 5. FITUR UNGGULAN (3 Layout Bergantian: Part 7) */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">Fitur Utama</span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-3">Segalanya Lebih Mudah dan Terkontrol</h2>
        </div>

        <div className="space-y-12">
          {/* Fitur 1: Catat via Telegram */}
          <div className="bg-white p-8 sm:p-12 rounded-3xl border border-rose-100 shadow-sm flex flex-col md:flex-row items-center gap-8">
            <div className="w-16 h-16 rounded-3xl bg-rose-500 text-white flex items-center justify-center text-3xl font-black shadow-lg shadow-rose-500/25 flex-shrink-0">
              💬
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="text-xl font-extrabold text-slate-900">1. Catat via Telegram (Teks, VN, Foto Struk, & Pilih Dompet)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tulis chat bahasa kasual Indonesia (*"beli sate 25rb pakai gopay"*), kirim Voice Note audio hingga 60 detik, atau foto struk belanjaanmu. AI langsung mendeteksi dompet BCA, Mandiri, GoPay, atau Tunai.
              </p>
              <div className="flex flex-wrap gap-2 pt-2 text-[11px] font-semibold text-rose-700">
                <span className="bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">✓ Teks Slang Indonesia</span>
                <span className="bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">✓ Voice Note STT</span>
                <span className="bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">✓ AI OCR Multi-Item Struk</span>
                <span className="bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">✓ Multi-Wallet Switching</span>
              </div>
            </div>
          </div>

          {/* Fitur 2: Laporan & Export Otomatis */}
          <div className="bg-white p-8 sm:p-12 rounded-3xl border border-rose-100 shadow-sm flex flex-col md:flex-row-reverse items-center gap-8">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-600 to-rose-400 text-white flex items-center justify-center text-3xl font-black shadow-lg shadow-rose-500/25 flex-shrink-0">
              📊
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="text-xl font-extrabold text-slate-900">2. Laporan Lengkap & Export PDF / Excel (.xlsx)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tabel transaksi native dengan sorting, pencarian catatan, filter kategori, wallet, dan rentang tanggal global WIB. Dapatkan dokumen laporan PDF profesional siap cetak atau berkas spreadsheet Excel kapan saja.
              </p>
              <div className="flex flex-wrap gap-2 pt-2 text-[11px] font-semibold text-rose-700">
                <span className="bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">✓ Filter Tanggal Global WIB</span>
                <span className="bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">✓ Export PDF & Excel On-Demand</span>
                <span className="bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">✓ Signed URL Supabase Storage</span>
              </div>
            </div>
          </div>

          {/* Fitur 3: AI Financial Advisor */}
          <div className="bg-white p-8 sm:p-12 rounded-3xl border border-rose-100 shadow-sm flex flex-col md:flex-row items-center gap-8">
            <div className="w-16 h-16 rounded-3xl bg-pink-500 text-white flex items-center justify-center text-3xl font-black shadow-lg shadow-pink-500/25 flex-shrink-0">
              🤖
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="text-xl font-extrabold text-slate-900">3. AI Financial Advisor & Tanya Data</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Penasihat keuangan otomatis yang mendeteksi lonjakan pengeluaran kategori &gt;50%, memberi peringatan dini sebelum gajian, dan menjawab pertanyaan santai seperti *"Bulan ini habis berapa buat makan?"*.
              </p>
              <div className="flex flex-wrap gap-2 pt-2 text-[11px] font-semibold text-rose-700">
                <span className="bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">✓ Alert Budget 80% & 100% via Telegram</span>
                <span className="bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">✓ Rekomendasi Solusi Penghematan</span>
                <span className="bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">✓ Read-Only Data Security</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SECTION TATAJATAH SIGNATURE */}
      <section id="tatajatah" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
        <div className="bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 rounded-3xl p-8 sm:p-14 text-white shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider px-3.5 py-1 bg-white/20 rounded-full backdrop-blur-md">
                Signature Feature
              </span>
              <h3 className="text-3xl sm:text-4xl font-black leading-tight">
                "Jatah harianmu, dihitung otomatis"
              </h3>
              <p className="text-rose-100 text-sm leading-relaxed">
                Hari ini aku boleh jajan berapa supaya uangku cukup sampai gajian? TataDana menjawabnya secara presisi dengan formula cerdas:
              </p>
              <div className="p-4 bg-black/20 rounded-2xl font-mono text-xs text-rose-100 leading-relaxed border border-white/10">
                Jatah Harian = (Saldo Dompet Pilihan - Sisa Tagihan Wajib - Target Tabungan) ÷ Sisa Hari Sampai Gajian
              </div>
            </div>

            {/* Interactive Simulator */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-6 text-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h4 className="font-bold text-sm">Simulasi: "Kalau aku beli ini?"</h4>
                  <p className="text-[11px] text-slate-400">Preview kalkulasi seketika</p>
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  🟢 Status Aman
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rencana Belanja</label>
                  <input
                    type="text"
                    value={simName}
                    onChange={(e) => setSimName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nominal (Rp)</label>
                  <input
                    type="number"
                    value={simPurchase}
                    onChange={(e) => setSimPurchase(Number(e.target.value) || 0)}
                    className="w-full text-base font-bold text-rose-600 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Simulation Result */}
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Jatah Harian Saat Ini:</span>
                  <strong>Rp371.000 / hari</strong>
                </div>
                <div className="flex justify-between items-center text-slate-900 font-bold">
                  <span>Jatah Harian Baru:</span>
                  <span className="text-base text-rose-600">Rp{newDailyAllowance.toLocaleString('id-ID')} / hari</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Jatah harianmu turun dari Rp371.000 jadi Rp{newDailyAllowance.toLocaleString('id-ID')} sampai gajian (-{percentImpact}%).
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. TESTIMONIALS (Masonry grid placeholder: Part 7) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">Testimoni</span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-3">Kata Mereka yang Mengendalikan Arus Kas</h2>
        </div>

        {/* // TODO: ganti dengan testimoni asli */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold">DK</div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Dimas Kurniawan</h4>
                <p className="text-[11px] text-slate-400">Karyawan Swasta (26 th)</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed italic">
              "Sebelumnya saya selalu boncos di minggu ketiga. Berkat fitur TataJatah dan kemudahan mencatat di Telegram, saya langsung tahu sisa jatah makan harian saya."
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold">SA</div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Siti Aminah</h4>
                <p className="text-[11px] text-slate-400">Freelancer (28 th)</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed italic">
              "Fitur scan struk belanja OCR sangat membantu! Cukup foto struk belanja Indomaret, semua rincian item langsung masuk ke laporan Excel."
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold">RP</div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Rian Pratama</h4>
                <p className="text-[11px] text-slate-400">Mahasiswa (22 th)</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed italic">
              "Streak catat 🔥 bikin ketagihan. Setiap makan warteg atau ngopi tinggal kirim chat di bot. Praktis banget tanpa instal aplikasi berat."
            </p>
          </div>
        </div>
      </section>

      {/* 8. PRICING (Part 7: 2 Kolom Starter | Pro, tanpa toggle) */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">Paket Langganan</span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-3">Investasi Terjangkau untuk Masa Depan Finansial</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Starter Plan */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                Starter
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-black text-slate-900">Rp49.000</span>
                <span className="text-xs text-slate-400 font-semibold">/ bulan</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Catat via teks dan VN Telegram, pilih dompet dari bot, maksimal 50 transaksi/bulan, 3 wallet, 5 kategori budget.
              </p>
              <ul className="text-xs space-y-3 text-slate-600 pt-2">
                <li className="flex items-center gap-2"><span>✓</span><span>Catat via teks & Voice Note Telegram</span></li>
                <li className="flex items-center gap-2"><span>✓</span><span>Pilih dompet langsung dari bot</span></li>
                <li className="flex items-center gap-2"><span>✓</span><span>Maksimal 50 transaksi/bulan & 3 wallet</span></li>
                <li className="flex items-center gap-2"><span>✓</span><span>TataJatah dasar & streak 🔥</span></li>
                <li className="flex items-center gap-2 text-slate-400"><span>✕</span><span>Input foto struk AI OCR (Khusus Pro)</span></li>
                <li className="flex items-center gap-2 text-slate-400"><span>✕</span><span>AI Financial Advisor & Export PDF/Excel</span></li>
              </ul>
            </div>
            <Link
              href="/daftar"
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs text-center transition"
            >
              Mulai Starter
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-white rounded-3xl border-2 border-rose-500 p-8 space-y-6 flex flex-col justify-between shadow-xl relative">
            <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-rose-600 to-rose-400 text-white font-extrabold text-[10px] uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
              Pilihan Terbaik ★
            </div>
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                Pro
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-black text-rose-600">Rp99.000</span>
                <span className="text-xs text-slate-400 font-semibold">/ sekali bayar</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Akses penuh tanpa batas selamanya dengan AI OCR struk belanja, laporan unlimited, dan AI Financial Advisor.
              </p>
              <ul className="text-xs space-y-3 text-slate-700 pt-2 font-medium">
                <li className="flex items-center gap-2 text-emerald-600 font-bold"><span>✓</span><span>Transaksi, wallet, & kategori UNLIMITED</span></li>
                <li className="flex items-center gap-2 text-emerald-600 font-bold"><span>✓</span><span>Input foto struk belanja dengan AI Vision OCR</span></li>
                <li className="flex items-center gap-2 text-emerald-600 font-bold"><span>✓</span><span>Export laporan unlimited ke PDF & Excel (.xlsx)</span></li>
                <li className="flex items-center gap-2 text-emerald-600 font-bold"><span>✓</span><span>AI Financial Advisor & Tanya Data via bot</span></li>
                <li className="flex items-center gap-2 text-emerald-600 font-bold"><span>✓</span><span>TataJatah Penuh (Kalender Heatmap, Simulasi, Prediksi)</span></li>
                <li className="flex items-center gap-2 text-emerald-600 font-bold"><span>✓</span><span>Filter rentang tanggal kustom global WIB</span></li>
              </ul>
            </div>
            <Link
              href="/daftar"
              className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs text-center shadow-lg shadow-rose-500/25 transition active:scale-95"
            >
              Pilih Paket Pro Sekarang →
            </Link>
          </div>
        </div>
      </section>

      {/* 9. FAQ SECTION (Minimal 7 Pertanyaan: Part 7) */}
      <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">Tanya Jawab</span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-3">Pertanyaan yang Sering Diajukan</h2>
        </div>

        <div className="space-y-3 text-xs">
          {faqs.map((f, idx) => (
            <div key={idx} className="bg-white border border-rose-100 rounded-2xl overflow-hidden transition">
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full p-4 text-left font-bold text-slate-900 flex items-center justify-between hover:text-rose-600 transition"
              >
                <span>{f.q}</span>
                <span className="text-rose-500 text-base">{activeFaq === idx ? '▲' : '▼'}</span>
              </button>
              {activeFaq === idx && (
                <div className="px-4 pb-4 pt-1 text-slate-600 leading-relaxed border-t border-slate-50">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 10. FINAL CTA BANNER (Part 7: gradient rose/orange) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
        <div className="bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 rounded-3xl p-10 sm:p-16 text-center text-white space-y-6 shadow-xl">
          <h2 className="text-3xl sm:text-5xl font-black max-w-2xl mx-auto leading-tight">
            Mulai kendalikan keuanganmu hari ini.
          </h2>
          <p className="text-rose-100 text-sm max-w-xl mx-auto leading-relaxed">
            Bergabunglah dengan ribuan karyawan dan generasi muda Indonesia yang kini bebas dari kecemasan tanggal tua.
          </p>
          <div className="pt-2">
            <Link
              href={currentUser ? '/dashboard' : '/daftar'}
              className="inline-block px-8 py-4 bg-white text-rose-600 font-extrabold rounded-2xl shadow-xl hover:bg-rose-50 transition text-sm"
            >
              {currentUser ? 'Buka Dashboard Saya →' : 'Daftar Akun Gratis Sekarang →'}
            </Link>
          </div>
        </div>
      </section>

      {/* 11. 4-COLUMN FOOTER (Part 7) */}
      <footer className="mt-24 border-t border-rose-100 py-16 bg-white text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Kolom 1: Logo + Tagline + Sosmed */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-rose-500 flex items-center justify-center text-white font-black">TD</div>
              <span className="text-lg font-black text-rose-600">TataDana</span>
            </div>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Catat keuangan semudah chat — langsung dari Telegram kamu.
            </p>
            <div className="flex gap-2 text-slate-400 text-sm pt-1">
              <span>📱 @TataDanaBot</span>
            </div>
          </div>

          {/* Kolom 2: Produk */}
          <div>
            <h5 className="font-bold text-slate-900 mb-3">Produk</h5>
            <ul className="space-y-2 text-slate-600">
              <li><a href="#features" className="hover:text-rose-600">Catat via Telegram</a></li>
              <li><a href="#tatajatah" className="hover:text-rose-600">TataJatah Signature</a></li>
              <li><a href="#features" className="hover:text-rose-600">AI Vision OCR Struk</a></li>
              <li><a href="#pricing" className="hover:text-rose-600">Paket & Harga</a></li>
            </ul>
          </div>

          {/* Kolom 3: Perusahaan */}
          <div>
            <h5 className="font-bold text-slate-900 mb-3">Perusahaan</h5>
            <ul className="space-y-2 text-slate-600">
              <li><a href="#problems" className="hover:text-rose-600">Tentang Kami</a></li>
              <li><a href="#problems" className="hover:text-rose-600">Visi Inklusi Keuangan</a></li>
              <li><a href="#faq" className="hover:text-rose-600">Pusat Bantuan</a></li>
            </ul>
          </div>

          {/* Kolom 4: Legal & Kontak */}
          <div>
            <h5 className="font-bold text-slate-900 mb-3">Legal & Kontak</h5>
            <ul className="space-y-2 text-slate-600 text-[11px]">
              <li><span className="hover:text-rose-600 cursor-pointer">Kebijakan Privasi</span></li>
              <li><span className="hover:text-rose-600 cursor-pointer">Syarat & Ketentuan</span></li>
              <li><span>Email: support@tatadana.id</span></li>
              <li><span>Timezone: Asia/Jakarta (WIB)</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400">
          <p>© 2026 TataDana Indonesia. Hak cipta dilindungi.</p>
          <p>Fintech SaaS Indonesia Berstandar WIB & Row Level Security</p>
        </div>
      </footer>
    </div>
  );
}
