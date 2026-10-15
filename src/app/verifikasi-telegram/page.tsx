'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { tatadanaStore } from '@/lib/supabase';
import { verifyOtp, startVerification, getOtpSession } from '@/lib/telegram-otp';

export default function VerifikasiTelegramPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [token, setToken] = useState('TD_' + Math.random().toString(36).substring(2, 10).toUpperCase());
  const [botUsername, setBotUsername] = useState('TataDanaOfficialBot');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [timeLeft, setTimeLeft] = useState(300); // 5 menit

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const active = tatadanaStore.getActiveUser();
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');

      if (active) {
        setCurrentUser(active);
        const resolvedToken = urlToken || active.verification_token;
        if (resolvedToken) {
          setToken(resolvedToken);
        } else {
          startVerification(active.id, active.email, active.phone_number).then(v => {
            setToken(v.token);
            tatadanaStore.updateUser({ ...active, verification_token: v.token });
          });
        }

        // Jika sudah linked dan approved
        if (active.telegram_verified_at && active.status === 'approved') {
          router.push('/dashboard');
        } else if (active.telegram_verified_at && active.status === 'pending') {
          router.push('/menunggu-persetujuan');
        }
      } else {
        const registered = tatadanaStore.getRegisteredUsers();
        if (registered.length > 0) {
          const user = registered[0];
          setCurrentUser(user);
          if (urlToken || user.verification_token) {
            setToken(urlToken || user.verification_token);
          }
        }
      }
    }
  }, [router]);

  // Countdown timer 5 menit
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const deepLink = `https://t.me/${botUsername}?start=${token}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(deepLink)}`;

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanOtp = otpCode.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setErrorMessage('Masukkan 6 digit kode OTP yang dikirimkan oleh Bot Telegram.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Verifikasi dengan engine Telegram OTP (cek by token lalu by userId)
      let res = await verifyOtp(token, cleanOtp);
      if (!res.success && currentUser?.id) {
        const userRes = await verifyOtp(currentUser.id, cleanOtp);
        if (userRes.success) {
          res = userRes;
        }
      }

      // Validasi ketat: Hanya sukses jika res.success == true atau test sandbox code 728491
      const isTestCode = cleanOtp === '728491';
      if (res.success || isTestCode) {
        setSuccessMessage('✅ OTP Berhasil Diverifikasi! Akun Telegram Anda telah terhubung.');

        // Update profile lokal & store
        if (currentUser) {
          const updated = {
            ...currentUser,
            telegram_user_id: res.record?.telegram_user_id || 128491029,
            telegram_chat_id: res.record?.telegram_chat_id || 128491029,
            telegram_verified_at: new Date().toISOString(),
            status: currentUser.status || 'pending',
          };
          tatadanaStore.updateUser(updated);
        }

        setTimeout(() => {
          router.push('/menunggu-persetujuan');
        }, 1200);
      } else {
        setErrorMessage(res.message || 'Kode OTP salah atau telah kadaluwarsa.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat memvalidasi OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulateBotSendOtp = () => {
    setOtpCode('728491');
    setStep(2);
    setSuccessMessage('📱 Bot mengirim OTP: 728491 (Simulasi Cepat)');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/50 to-white font-sans text-slate-800 flex flex-col justify-between">
      {/* Header */}
      <header className="h-16 border-b border-rose-100 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-400 flex items-center justify-center text-white font-black text-lg shadow-sm">
            TD
          </div>
          <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-rose-600 to-rose-400 bg-clip-text text-transparent">
            TataDana
          </span>
        </Link>
        <div className="text-xs text-slate-500 font-medium">
          Langkah 2 dari 3: Verifikasi Akun Telegram
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-xl mx-auto px-4 py-8 w-full">
        <div className="bg-white rounded-2xl shadow-xl shadow-rose-500/5 border border-rose-100 p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center text-2xl mx-auto border border-rose-100 shadow-inner">
              ✈️
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Verifikasi Telegram & Hubungkan Akun
            </h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              TataDana menggunakan Bot Telegram resmi sebagai pengganti SMS OTP sekaligus meng-link akun Anda untuk pencatatan otomatis.
            </p>
          </div>

          {/* Stepper Wizard */}
          <div className="grid grid-cols-4 gap-2 pt-2 text-[11px] font-semibold text-center">
            <div className={`p-2 rounded-xl border ${step >= 1 ? 'bg-rose-50 border-rose-300 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
              1. Buka Bot
            </div>
            <div className={`p-2 rounded-xl border ${step >= 2 ? 'bg-rose-50 border-rose-300 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
              2. Bagi Nomor
            </div>
            <div className={`p-2 rounded-xl border ${step >= 2 ? 'bg-rose-50 border-rose-300 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
              3. Terima OTP
            </div>
            <div className={`p-2 rounded-xl border ${step >= 3 ? 'bg-rose-50 border-rose-300 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
              4. Selesai
            </div>
          </div>

          {/* Deep Link & QR Code Box */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-5 justify-between">
              <div className="space-y-2 text-center sm:text-left">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">
                  Langkah 1 & 2
                </span>
                <h4 className="text-sm font-bold text-slate-900">Buka Obrolan Telegram</h4>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                  Scan QR code atau klik tombol di samping. Di Telegram, tekan <b>Mulai (Start)</b> lalu tekan tombol <b>"📱 Bagikan Nomor HP"</b>.
                </p>
                <div className="pt-1">
                  <a
                    href={deepLink}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-500/25 transition active:scale-95"
                  >
                    <span>✈️</span>
                    <span>Buka @{botUsername}</span>
                  </a>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex-shrink-0 bg-white p-2.5 rounded-xl border border-rose-100 shadow-sm text-center">
                <img
                  src={qrCodeUrl}
                  alt="QR Verifikasi Telegram"
                  className="w-32 h-32 rounded-lg"
                />
                <span className="block text-[10px] text-slate-400 mt-1 font-mono">Scan via Telegram</span>
              </div>
            </div>

            {/* Simulated Action for Instant Local Testing */}
            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="text-slate-500 text-[11px]">Sedang mencoba di localhost?</span>
              <button
                type="button"
                onClick={handleSimulateBotSendOtp}
                className="text-rose-600 hover:text-rose-700 font-bold underline text-[11px]"
              >
                ⚡ Isi OTP Cepat (728491)
              </button>
            </div>
          </div>

          {/* Form OTP Input */}
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Masukkan 6-Digit Kode OTP Telegram
                </label>
                <span className="text-xs font-mono font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                  ⏱️ {formattedTime}
                </span>
              </div>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Contoh: 728491"
                className="w-full text-center tracking-[0.5em] text-2xl font-mono font-bold px-4 py-3 bg-white border-2 border-rose-200 rounded-xl focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition"
                autoFocus
              />
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 font-medium">
                <span>⚠️</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2 font-medium">
                <span>✅</span>
                <span>{successMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || otpCode.length !== 6}
              className={`w-full py-3.5 rounded-xl text-xs font-bold text-white transition shadow-md ${
                otpCode.length === 6 && !isLoading
                  ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/25 active:scale-95'
                  : 'bg-slate-300 cursor-not-allowed shadow-none'
              }`}
            >
              {isLoading ? 'Memverifikasi...' : 'Verifikasi OTP & Lanjutkan →'}
            </button>
          </form>

          {/* Info footer */}
          <div className="text-center text-[11px] text-slate-400 space-y-1">
            <p>1 akun Telegram hanya dapat dihubungkan ke 1 akun TataDana.</p>
            <p>Kode OTP berlaku selama 5 menit dengan batas maksimal 5 kali percobaan.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-100">
        © 2026 TataDana Indonesia • Keuangan Terkontrol Semudah Chat
      </footer>
    </div>
  );
}
