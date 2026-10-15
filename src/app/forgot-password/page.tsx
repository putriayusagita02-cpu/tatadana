'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('dimas@tatadana.id');
  const [sent, setSent] = useState(false);

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 font-sans">
      <div className="bg-white p-8 rounded-3xl border border-rose-100 shadow-xl w-full max-w-md space-y-5 text-xs">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 font-bold text-xl flex items-center justify-center mx-auto shadow-sm">
            🔑
          </div>
          <h3 className="text-xl font-bold text-slate-900">Atur Ulang Kata Sandi</h3>
          <p className="text-slate-500 text-[11px]">
            Masukkan email terdaftar Anda untuk menerima tautan pemulihan kata sandi.
          </p>
        </div>

        {sent ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 space-y-2 text-center">
            <span className="text-2xl block">✉️</span>
            <p className="font-bold">Tautan Reset Terkirim!</p>
            <p className="text-[11px] text-emerald-700">
              Instruksi atur ulang kata sandi telah dikirim ke <strong>{email}</strong>. Silakan periksa kotak masuk atau spam.
            </p>
            <div className="pt-2">
              <Link href="/login" className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold inline-block">
                Kembali ke Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Email Terdaftar</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-rose-500"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow transition"
            >
              Kirim Tautan Reset
            </button>
          </form>
        )}

        <div className="text-center pt-2">
          <Link href="/login" className="text-rose-600 hover:underline font-semibold">
            ← Kembali ke halaman login
          </Link>
        </div>
      </div>
    </div>
  );
}
