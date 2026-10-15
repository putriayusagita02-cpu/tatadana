'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { tatadanaStore } from '@/lib/supabase';

export default function DitolakPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [reason, setReason] = useState<string>('Pendaftaran tidak memenuhi kriteria verifikasi identitas finansial.');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const active = tatadanaStore.getActiveUser();
      if (active) {
        setCurrentUser(active);
        if (active.rejection_reason) {
          setReason(active.rejection_reason);
        }
      }
    }
  }, []);

  const handleResetForRetry = () => {
    if (currentUser) {
      const reset = {
        ...currentUser,
        status: 'approved',
      };
      tatadanaStore.updateUser(reset);
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col justify-between">
      {/* Header */}
      <header className="h-16 border-b border-rose-100 bg-white/90 backdrop-blur-md px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-400 flex items-center justify-center text-white font-black text-lg shadow-sm">
            TD
          </div>
          <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-rose-600 to-rose-400 bg-clip-text text-transparent">
            TataDana
          </span>
        </Link>
        <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-bold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          <span>Status: Pendaftaran Ditolak</span>
        </span>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-12 w-full">
        <div className="bg-white rounded-3xl shadow-xl shadow-red-500/5 border border-red-100 p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center text-3xl mx-auto border border-red-200 shadow-inner">
            ❌
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Pendaftaran Tidak Disetujui
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Mohon maaf, permohonan akses akun TataDana untuk akun <b>{currentUser?.email || 'anda'}</b> belum dapat kami setujui saat ini.
            </p>
          </div>

          {/* Rejection Reason Card */}
          <div className="bg-red-50/70 border border-red-200 rounded-2xl p-4 text-left space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-red-900">
              <span>⚠️</span>
              <span>Alasan Penolakan dari Admin:</span>
            </div>
            <p className="text-xs text-red-800 italic leading-relaxed pl-5">
              "{reason}"
            </p>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Pemberitahuan resmi beserta alasan penolakan di atas juga telah dikirimkan secara otomatis ke chat akun Telegram Anda.
          </p>

          <div className="space-y-2 pt-2">
            <button
              onClick={handleResetForRetry}
              className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/25 transition active:scale-95"
            >
              🔄 Ajukan Ulang / Reset Akun Pengujian
            </button>
            <Link
              href="/"
              className="block w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-100">
        © 2026 TataDana Indonesia • Layanan Bantuan: support@tatadana.id
      </footer>
    </div>
  );
}
