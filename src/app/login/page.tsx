'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { tatadanaStore, UserProfile } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [authMethod, setAuthMethod] = useState<'password' | 'otp'>('password');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const users = tatadanaStore.getRegisteredUsers();
      setRegisteredUsers(users);
      if (users.length > 0 && !emailOrPhone) {
        setEmailOrPhone(users[0].email);
        setPassword('password123');
      }
    }
  }, []);

  const routeByStatus = (user: any) => {
    // Set cookie for middleware
    if (typeof document !== 'undefined') {
      document.cookie = `tatadana_auth=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=86400`;
    }

    const isSuperadmin =
      user.is_superadmin ||
      user.role === 'superadmin' ||
      user.email?.toLowerCase() === 'putriayusagita02@gmail.com';

    if (isSuperadmin) {
      router.push('/admin');
      return;
    }

    if (!user.telegram_verified_at && !user.telegram_user_id) {
      router.push('/verifikasi-telegram');
      return;
    }

    if (user.status === 'rejected') {
      router.push('/ditolak');
      return;
    }

    if (user.status === 'pending') {
      router.push('/menunggu-persetujuan');
      return;
    }

    router.push('/dashboard');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!emailOrPhone) {
      setErrorMessage('Silakan masukkan email atau nomor HP Anda.');
      return;
    }

    // Cek jika login superadmin putriayusagita02@gmail.com
    if (emailOrPhone.toLowerCase() === 'putriayusagita02@gmail.com') {
      const adminUser = {
        id: 'usr_admin_putri',
        full_name: 'Putri Ayu Sagita (Superadmin)',
        email: 'putriayusagita02@gmail.com',
        phone_number: '+6281299990001',
        phone_verified: true,
        subscription_plan: 'pro',
        default_currency: 'IDR',
        monthly_tx_count: 0,
        is_superadmin: true,
        role: 'superadmin',
        status: 'approved',
        telegram_verified_at: new Date().toISOString(),
      };
      tatadanaStore.updateUser(adminUser as any);
      routeByStatus(adminUser);
      return;
    }

    if (!password) {
      setErrorMessage('Silakan masukkan kata sandi.');
      return;
    }

    const user = tatadanaStore.loginUser(emailOrPhone, password);
    if (!user) {
      setErrorMessage(`Akun "${emailOrPhone}" tidak ditemukan. Pastikan email atau nomor HP sudah benar, atau daftar akun baru.`);
      return;
    }

    routeByStatus(user);
  };

  const handleSelectDemo = (u: any) => {
    setEmailOrPhone(u.email);
    setPassword('password123');
    setErrorMessage('');
  };

  const handleSelectSuperadmin = () => {
    setEmailOrPhone('putriayusagita02@gmail.com');
    setPassword('password123');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white font-sans">
      {/* 40% Branded Left Panel */}
      <div className="hidden md:flex md:w-5/12 bg-gradient-to-tr from-rose-600 via-rose-500 to-pink-500 p-12 text-white flex-col justify-between">
        <div className="space-y-4">
          <Link href="/" className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-2xl shadow-md">
            TD
          </Link>
          <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
            Keuanganmu.<br />Terkontrol Penuh.
          </h2>
          <p className="text-rose-100 text-xs leading-relaxed max-w-xs">
            Mulai catat transaksi semudah kirim chat di Telegram. Semua tersimpan rapi di dashboard TataDana dengan perhitungan jatah harian otomatis.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 text-xs text-rose-50 space-y-1">
          <p className="italic">"TataJatah memandu pengeluaran harianmu tetap aman sampai tanggal gajian 🎯"</p>
          <span className="block text-[10px] text-rose-200 pt-1 font-bold">— TataDana Financial AI</span>
        </div>
      </div>

      {/* 60% Form */}
      <div className="flex-1 p-8 sm:p-14 flex items-center justify-center">
        <div className="w-full max-w-md space-y-5 text-xs">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Masuk ke TataDana</h3>
            <p className="text-slate-500 mt-1">Gunakan email, kata sandi, atau nomor WhatsApp terdaftar.</p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 font-medium">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Email atau Nomor HP
              </label>
              <input
                type="text"
                placeholder="nama@email.com atau 081234567890"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                required
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-rose-500 transition text-slate-800"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-slate-700">Kata Sandi</label>
                <Link href="/forgot-password" className="text-rose-600 hover:underline text-[11px]">
                  Lupa sandi?
                </Link>
              </div>
              <input
                type="password"
                placeholder="Masukkan kata sandi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-rose-500 transition text-slate-800"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-md shadow-rose-500/25 transition active:scale-95 text-xs"
            >
              Masuk Sekarang →
            </button>
          </form>

          {/* Superadmin & Demo Account Selector */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-700 block text-[11px]">⚡ Pilih Akun Pengujian Cepat:</span>
            
            {/* Superadmin shortcut (Part 14.3) */}
            <button
              type="button"
              onClick={handleSelectSuperadmin}
              className="w-full text-left p-2 rounded-xl border border-amber-200 bg-amber-50/80 hover:bg-amber-100/80 transition flex items-center justify-between"
            >
              <div>
                <div className="font-extrabold text-amber-900 text-[11px] flex items-center gap-1">
                  <span>🛡️</span>
                  <span>Putri Ayu Sagita (Superadmin)</span>
                </div>
                <div className="text-[10px] text-amber-700">putriayusagita02@gmail.com</div>
              </div>
              <span className="text-[10px] bg-amber-200/80 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                Admin
              </span>
            </button>

            {registeredUsers.slice(0, 2).map((u: any) => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleSelectDemo(u)}
                className="w-full text-left p-2 rounded-xl border border-slate-200 hover:border-rose-300 bg-white hover:bg-rose-50 transition flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-slate-800 text-[11px]">{u.full_name}</div>
                  <div className="text-[10px] text-slate-500">{u.email}</div>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                  {u.status === 'pending' ? 'Pending' : 'User'}
                </span>
              </button>
            ))}
          </div>

          <p className="text-center text-slate-500 pt-1">
            Belum punya akun?{' '}
            <Link href="/daftar" className="text-rose-600 font-bold hover:underline">
              Daftar akun baru
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
