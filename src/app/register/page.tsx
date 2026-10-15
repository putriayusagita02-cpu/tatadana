'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { tatadanaStore } from '@/lib/supabase';
import { startVerification } from '@/lib/telegram-otp';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName || !email || !phone || !password) {
      setErrorMessage('Semua kolom wajib diisi.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    const registeredUsers = tatadanaStore.getRegisteredUsers();
    const existing = registeredUsers.find(
      u => u.email.toLowerCase() === email.toLowerCase() ||
           u.phone_number.replace(/[^0-9]/g, '') === phone.replace(/[^0-9]/g, '')
    );

    if (existing) {
      setErrorMessage('Email atau nomor WhatsApp/HP ini sudah terdaftar. Silakan login.');
      return;
    }

    setIsLoading(true);

    try {
      // Buat user baru dengan status awal 'pending' (Part 14.2)
      const newUser = tatadanaStore.registerUser(fullName, email, phone, password);

      // Pastikan status adalah pending
      const pendingUser = {
        ...newUser,
        status: 'pending',
        role: 'user',
        telegram_verified_at: null,
      };
      tatadanaStore.updateUser(pendingUser as any);

      // Mulai verifikasi Telegram OTP (Part 14.4)
      const verification = await startVerification(pendingUser.id, email, phone);

      const userWithToken = {
        ...pendingUser,
        verification_token: verification.token,
      };
      tatadanaStore.updateUser(userWithToken as any);

      // Set cookie sesi
      if (typeof document !== 'undefined') {
        document.cookie = `tatadana_auth=${encodeURIComponent(JSON.stringify(userWithToken))}; path=/; max-age=86400`;
      }

      // Arahkan ke Langkah 2: Verifikasi Telegram dengan token
      router.push(`/verifikasi-telegram?token=${verification.token}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mendaftar akun baru.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white font-sans">
      {/* 40% Panel */}
      <div className="hidden md:flex md:w-5/12 bg-gradient-to-tr from-rose-600 via-rose-500 to-pink-500 p-12 text-white flex-col justify-between">
        <div className="space-y-4">
          <Link href="/" className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-2xl shadow-md">
            TD
          </Link>
          <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
            Kendalikan<br />Masa Depanmu.
          </h2>
          <p className="text-rose-100 text-xs leading-relaxed max-w-xs">
            Daftar sekarang dan nikmati pencatatan keuangan semudah kirim chat di Telegram dengan perlindungan budget & TataJatah pintar.
          </p>
        </div>
        <div className="space-y-2 text-xs text-rose-100">
          <div className="flex items-center gap-2"><span>✅</span><span>Verifikasi nomor HP via Bot Telegram (tanpa biaya SMS)</span></div>
          <div className="flex items-center gap-2"><span>✅</span><span>Perhitungan jatah harian otomatis sampai gajian</span></div>
          <div className="flex items-center gap-2"><span>✅</span><span>Deteksi dompet & struk multi-item AI Gemini</span></div>
        </div>
      </div>

      {/* 60% Form */}
      <div className="flex-1 p-8 sm:p-14 flex items-center justify-center">
        <div className="w-full max-w-md space-y-5 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
              Langkah 1 dari 3: Data Akun
            </span>
            <h3 className="text-2xl font-bold text-slate-900 mt-2">Buat Akun TataDana</h3>
            <p className="text-slate-500 mt-0.5">Daftar gratis. Akun akan dihubungkan ke Telegram pada langkah berikutnya.</p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 font-medium">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                placeholder="Contoh: Dimas Kurniawan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-rose-500 transition text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Alamat Email</label>
              <input
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-rose-500 transition text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nomor WhatsApp / HP Aktif</label>
              <input
                type="tel"
                placeholder="081234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-rose-500 transition text-slate-800"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Nomor ini akan diverifikasi lewat Bot Telegram pada langkah selanjutnya.</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kata Sandi</label>
              <input
                type="password"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-rose-500 transition text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Konfirmasi Kata Sandi</label>
              <input
                type="password"
                placeholder="Ketik ulang kata sandi"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-rose-500 transition text-slate-800"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-md shadow-rose-500/25 transition active:scale-95 text-xs"
            >
              {isLoading ? 'Mendaftarkan Akun...' : 'Lanjut ke Verifikasi Telegram →'}
            </button>
          </form>

          <p className="text-center text-slate-500 pt-1">
            Sudah punya akun?{' '}
            <Link href="/masuk" className="text-rose-600 font-bold hover:underline">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
