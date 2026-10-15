'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { tatadanaStore } from '@/lib/supabase';
import { createBrowserClient } from '@/lib/supabase/browser';

export default function MenungguPersetujuanPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const active = tatadanaStore.getActiveUser();
      if (active) {
        setCurrentUser(active);
        setStatus(active.status || 'pending');
        if (active.status === 'approved') {
          router.push('/dashboard');
        } else if (active.status === 'rejected') {
          router.push('/ditolak');
        }
      } else {
        const registered = tatadanaStore.getRegisteredUsers();
        if (registered.length > 0) {
          setCurrentUser(registered[0]);
          setStatus(registered[0].status || 'pending');
        }
      }

      // Supabase Realtime subscription listener
      try {
        const supabase = createBrowserClient();
        const channel = supabase
          .channel('user-approval-status')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'profiles',
              filter: active?.id ? `id=eq.${active.id}` : undefined,
            },
            (payload: any) => {
              const newStatus = payload.new?.status;
              if (newStatus === 'approved') {
                setStatus('approved');
                if (active) tatadanaStore.updateUser({ ...active, status: 'approved' });
                router.push('/dashboard');
              } else if (newStatus === 'rejected') {
                setStatus('rejected');
                if (active) tatadanaStore.updateUser({ ...active, status: 'rejected', rejection_reason: payload.new?.rejection_reason });
                router.push('/ditolak');
              }
            }
          )
          .subscribe();

        // Local storage event listener for cross-tab realtime updates (e.g. admin approve in other tab)
        const handleStorageChange = (e: StorageEvent) => {
          if (e.key === 'tatadana_store_users' || e.key === 'tatadana_active_user') {
            const updated = tatadanaStore.getActiveUser();
            if (updated?.status === 'approved') {
              setStatus('approved');
              router.push('/dashboard');
            } else if (updated?.status === 'rejected') {
              setStatus('rejected');
              router.push('/ditolak');
            }
          }
        };
        window.addEventListener('storage', handleStorageChange);

        return () => {
          supabase.removeChannel(channel);
          window.removeEventListener('storage', handleStorageChange);
        };
      } catch (e) {
        console.warn('Realtime listener fallback active');
      }
    }
  }, [router]);

  const handleSimulateAdminApprove = () => {
    setIsSimulating(true);
    setTimeout(() => {
      if (currentUser) {
        const updated = {
          ...currentUser,
          status: 'approved',
        };
        tatadanaStore.updateUser(updated);
        // Also update in registered list
        const registered = tatadanaStore.getRegisteredUsers();
        const updatedList = registered.map(u => (u.id === currentUser.id ? { ...u, status: 'approved' } : u));
        localStorage.setItem('tatadana_store_users', JSON.stringify(updatedList));
      }
      setStatus('approved');
      setIsSimulating(false);
      router.push('/dashboard');
    }, 1000);
  };

  const handleSimulateAdminReject = () => {
    if (currentUser) {
      const updated = {
        ...currentUser,
        status: 'rejected',
        rejection_reason: 'Data nomor telepon dan identitas tidak valid atau mencurigakan.',
      };
      tatadanaStore.updateUser(updated);
    }
    setStatus('rejected');
    router.push('/ditolak');
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
        <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold flex items-center gap-1.5 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span>Status: Menunggu Persetujuan Admin</span>
        </span>
      </header>

      {/* Main Content */}
      <main className="max-w-xl mx-auto px-4 py-12 w-full">
        <div className="bg-white rounded-3xl shadow-xl shadow-rose-500/5 border border-rose-100 p-8 sm:p-10 space-y-7 text-center relative overflow-hidden">
          {/* Decorative background glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

          {/* Icon */}
          <div className="relative">
            <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center text-3xl mx-auto border border-amber-200 shadow-inner animate-bounce">
              ⏳
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="w-24 h-24 rounded-full border-2 border-amber-300 animate-ping opacity-25"></span>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Pendaftaran Anda Sedang Ditinjau
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Halo <b>{currentUser?.full_name || 'Pengguna TataDana'}</b>, nomor telepon dan akun Telegram Anda telah terverifikasi. Untuk menjaga keamanan platform SaaS fintech kami, akun baru memerlukan persetujuan superadmin.
            </p>
          </div>

          {/* User Verification Summary Box */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-left space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Nama Akun:</span>
              <span className="font-bold text-slate-900">{currentUser?.full_name || 'Dimas Kurniawan'}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Email:</span>
              <span className="font-bold text-slate-900">{currentUser?.email || 'dimas@tatadana.id'}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Nomor WhatsApp / HP:</span>
              <span className="font-bold text-slate-900">{currentUser?.phone_number || '+6281234567890'}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 font-medium">Status Telegram:</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <span>🟢</span>
                <span>Terhubung & Terverifikasi OTP</span>
              </span>
            </div>
          </div>

          {/* Live Realtime Notification Banner */}
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5 text-left">
            <span className="text-base flex-shrink-0">📡</span>
            <div className="space-y-0.5">
              <p className="font-bold text-rose-900">Koneksi Realtime Aktif</p>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                Halaman ini akan otomatis berpindah ke Dashboard begitu superadmin menekan tombol <b>"Approve"</b> di Admin Console. Anda tidak perlu me-refresh browser.
              </p>
            </div>
          </div>

          {/* Developer / Testing Controls for Localhost Evaluation */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
              Panel Pengujian Cepat Localhost
            </span>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={handleSimulateAdminApprove}
                disabled={isSimulating}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition active:scale-95"
              >
                {isSimulating ? 'Memproses...' : '✅ Simulasi Admin Approve (Masuk Dashboard)'}
              </button>
              <button
                type="button"
                onClick={handleSimulateAdminReject}
                className="px-4 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-xs font-bold transition active:scale-95"
              >
                ❌ Simulasi Reject
              </button>
            </div>
            <div className="pt-2">
              <Link
                href="/admin"
                className="text-[11px] font-bold text-slate-500 hover:text-slate-900 underline"
              >
                Buka Admin Console (Menu Persetujuan User) →
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-100">
        © 2026 TataDana Indonesia • SaaS Fintech Terintegrasi Telegram Bot
      </footer>
    </div>
  );
}
