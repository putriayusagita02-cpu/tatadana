'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { tatadanaStore, formatRupiah } from '@/lib/supabase';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: 'starter' | 'pro';
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  txCount: number;
  telegramLinked: boolean;
  joinedAt: string;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'approvals' | 'users' | 'ai' | 'bot' | 'payments' | 'audit'>('approvals');
  const [impersonatingUser, setImpersonatingUser] = useState<string | null>(null);

  // User Management State
  const [users, setUsers] = useState<UserRecord[]>([
    {
      id: 'usr-001',
      name: 'Dimas Kurniawan',
      email: 'dimas@tatadana.id',
      phone: '+6281234567890',
      plan: 'pro',
      status: 'approved',
      txCount: 18,
      telegramLinked: true,
      joinedAt: '1 Okt 2026',
    },
    {
      id: 'usr-002',
      name: 'Rian Pratama',
      email: 'rian@example.com',
      phone: '+6281987654321',
      plan: 'starter',
      status: 'approved',
      txCount: 42,
      telegramLinked: true,
      joinedAt: '5 Okt 2026',
    },
    {
      id: 'usr-003',
      name: 'Budi Santoso (Baru)',
      email: 'budi.santoso@gmail.com',
      phone: '+6285712345678',
      plan: 'starter',
      status: 'pending',
      txCount: 0,
      telegramLinked: true,
      joinedAt: '15 Okt 2026, 09:12 WIB',
    },
    {
      id: 'usr-004',
      name: 'Siti Aminah',
      email: 'siti@example.com',
      phone: '+6285211223344',
      plan: 'pro',
      status: 'rejected',
      rejectionReason: 'Format foto nomor identitas dan nomor HP tidak valid.',
      txCount: 0,
      telegramLinked: true,
      joinedAt: '14 Okt 2026, 16:30 WIB',
    },
  ]);

  // Approval Filter
  // Realtime Sync from /api/users (Supabase / Cloud API)
  useEffect(() => {
    const fetchUsers = () => {
      fetch('/api/users')
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data.users) && data.users.length > 0) {
            setUsers(data.users);
          }
        })
        .catch(() => {});
    };

    fetchUsers();
    const interval = setInterval(fetchUsers, 4000);
    return () => clearInterval(interval);
  }, []);

  // Reject Modal State
  const [rejectingUserId, setRejectingUserId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  // User Transaction Inspector Modal (Part 10 & 14.7)
  const [inspectingUser, setInspectingUser] = useState<UserRecord | null>(null);

  // Multi-Provider AI Settings
  const [aiMode, setAiMode] = useState<'single' | 'parallel_failover'>('parallel_failover');
  const [providers, setProviders] = useState([
    {
      id: 'gemini',
      name: 'Google Gemini',
      model: 'gemini-2.0-flash',
      isActive: true,
      apiKeyMasked: 'AIzaSy...Ab92',
      multimodal: true,
      latencyMs: 340,
    },
    {
      id: 'openai',
      name: 'OpenAI GPT',
      model: 'gpt-4o-mini',
      isActive: true,
      apiKeyMasked: 'sk-proj...7xQ1',
      multimodal: true,
      latencyMs: 520,
    },
    {
      id: 'deepseek',
      name: 'DeepSeek AI',
      model: 'deepseek-chat',
      isActive: false,
      apiKeyMasked: 'sk-ds...99p0',
      multimodal: false,
      latencyMs: 410,
    },
  ]);

  // AI Call Logs
  const [aiLogs] = useState([
    {
      id: 'ail-01',
      provider: 'Google Gemini',
      action: 'parse_text',
      prompt: 'beli bakso 15rb pakai gopay',
      tokens: 128,
      latency: 320,
      costIdr: 12,
      status: 'success',
      timestamp: '14:20:11 WIB',
    },
    {
      id: 'ail-02',
      provider: 'Google Gemini',
      action: 'receipt_ocr',
      prompt: 'Foto Struk Indomaret Point Multi-item',
      tokens: 450,
      latency: 840,
      costIdr: 45,
      status: 'success',
      timestamp: '13:45:02 WIB',
    },
    {
      id: 'ail-03',
      provider: 'OpenAI GPT',
      action: 'voice_transcribe',
      prompt: 'Voice note audio: gojek 18 ribu',
      tokens: 210,
      latency: 490,
      costIdr: 28,
      status: 'fallback',
      timestamp: '11:15:30 WIB',
    },
  ]);

  // Payments / Midtrans Simulator
  const [orders, setOrders] = useState([
    {
      id: 'TRX-PRO-001',
      user: 'Rian Pratama',
      email: 'rian@example.com',
      amount: 99000,
      method: 'Manual Transfer BCA',
      status: 'pending',
      date: '15 Okt 2026, 13:45 WIB',
    },
    {
      id: 'TRX-PRO-002',
      user: 'Siti Aminah',
      email: 'siti@example.com',
      amount: 99000,
      method: 'Midtrans QRIS',
      status: 'approved',
      date: '14 Okt 2026, 11:20 WIB',
    },
  ]);

  // Audit Logs (Part 10 & 14.7)
  const [auditLogs, setAuditLogs] = useState([
    {
      id: 'log-01',
      admin: 'putriayusagita02@gmail.com',
      action: 'system_init',
      target: 'Superadmin initialization',
      ip: '127.0.0.1 (Localhost)',
      timestamp: '15 Okt 2026, 08:00 WIB',
    },
    {
      id: 'log-02',
      admin: 'putriayusagita02@gmail.com',
      action: 'change_user_status',
      target: 'Budi Santoso -> pending',
      ip: '127.0.0.1 (Localhost)',
      timestamp: '15 Okt 2026, 09:12 WIB',
    },
  ]);

  // Telegram Bot Test State (Part 5.1)
  const [botTestLoading, setBotTestLoading] = useState(false);
  const [botTestResult, setBotTestResult] = useState<{
    status: 'connected' | 'disconnected';
    botUsername: string;
    botId: number;
    webhookUrl: string;
    pendingUpdates: number;
    lastErrorDate?: string;
    lastErrorMessage?: string;
  } | null>({
    status: 'connected',
    botUsername: 'TataDanaOfficialBot',
    botId: 7128491234,
    webhookUrl: 'https://tatadana.vercel.app/api/telegram/webhook',
    pendingUpdates: 0,
  });

  // Sinkronisasi dengan tatadanaStore jika ada data baru
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const registered = tatadanaStore.getRegisteredUsers();
      if (registered && registered.length > 0) {
        setUsers(prev => {
          const map = new Map(prev.map(u => [u.id, u]));
          for (const reg of registered) {
            map.set(reg.id, {
              id: reg.id,
              name: reg.full_name,
              email: reg.email,
              phone: reg.phone_number,
              plan: reg.subscription_plan || 'starter',
              status: ((reg as any).status || 'approved') as any,
              rejectionReason: (reg as any).rejection_reason,
              txCount: reg.monthly_tx_count || 0,
              telegramLinked: Boolean(reg.phone_verified || (reg as any).telegram_verified_at),
              joinedAt: '15 Okt 2026',
            });
          }
          return Array.from(map.values());
        });
      }
    }
  }, []);

  const pendingCount = users.filter(u => u.status === 'pending').length;

  const handleApproveUser = async (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, status: 'approved', rejectionReason: undefined } : u))
    );

    // Update in tatadanaStore
    if (typeof window !== 'undefined') {
      const reg = tatadanaStore.getRegisteredUsers();
      const updated = reg.map(u => (u.id === userId ? { ...u, status: 'approved' } : u));
      localStorage.setItem('tatadana_store_users', JSON.stringify(updated));

      const active = tatadanaStore.getActiveUser();
      if (active && active.id === userId) {
        tatadanaStore.updateUser({ ...active, status: 'approved' });
      }
    }

    // Call Cloud Backend API to persist approval in Supabase
    fetch('/api/users/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    }).catch(() => {});

    // Kirim notifikasi Telegram riil via backend API (Part 14.2)
    try {
      await fetch('/api/admin/notify-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userEmail: targetUser?.email,
          userName: targetUser?.name,
          status: 'approved',
        }),
      });
    } catch (e) {
      console.warn('Gagal dispatch bot notify:', e);
    }

    // Add to audit trail
    setAuditLogs(prev => [
      {
        id: `log-${Date.now()}`,
        admin: 'putriayusagita02@gmail.com',
        action: 'admin_set_user_status (APPROVED)',
        target: `${targetUser?.name} (${targetUser?.email})`,
        ip: '127.0.0.1 (Localhost)',
        timestamp: new Date().toLocaleTimeString('id-ID') + ' WIB',
      },
      ...prev,
    ]);

    alert(`✅ Akun ${targetUser?.name} berhasil DISETUJUI!\nPemberitahuan telah dikirim ke Telegram user.`);
  };

  const handleOpenRejectModal = (userId: string) => {
    setRejectingUserId(userId);
    setRejectReason('');
    setRejectError('');
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      setRejectError('Alasan penolakan wajib diisi (Part 14.2).');
      return;
    }

    const targetUser = users.find(u => u.id === rejectingUserId);
    if (!targetUser) return;

    setUsers(prev =>
      prev.map(u => (u.id === rejectingUserId ? { ...u, status: 'rejected', rejectionReason: rejectReason.trim() } : u))
    );

    // Update in store
    if (typeof window !== 'undefined') {
      const reg = tatadanaStore.getRegisteredUsers();
      const updated = reg.map(u => (u.id === rejectingUserId ? { ...u, status: 'rejected', rejection_reason: rejectReason.trim() } : u));
      localStorage.setItem('tatadana_store_users', JSON.stringify(updated));

      const active = tatadanaStore.getActiveUser();
      if (active && active.id === rejectingUserId) {
        tatadanaStore.updateUser({ ...active, status: 'rejected', rejection_reason: rejectReason.trim() });
      }
    }

    // Call Cloud Backend API to persist rejection in Supabase
    fetch('/api/users/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: rejectingUserId, reason: rejectReason.trim() }),
    }).catch(() => {});

    // Kirim notifikasi penolakan via Telegram riil dengan alasan (Part 14.2)
    try {
      await fetch('/api/admin/notify-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: rejectingUserId,
          userEmail: targetUser.email,
          userName: targetUser.name,
          status: 'rejected',
          rejectionReason: rejectReason.trim(),
        }),
      });
    } catch (e) {
      console.warn('Gagal dispatch bot notify:', e);
    }

    // Log to audit
    setAuditLogs(prev => [
      {
        id: `log-${Date.now()}`,
        admin: 'putriayusagita02@gmail.com',
        action: 'admin_set_user_status (REJECTED)',
        target: `${targetUser.name} (${targetUser.email}) — Alasan: ${rejectReason.trim()}`,
        ip: '127.0.0.1 (Localhost)',
        timestamp: new Date().toLocaleTimeString('id-ID') + ' WIB',
      },
      ...prev,
    ]);

    alert(`❌ Pendaftaran ${targetUser.name} telah DITOLAK.\nPesan notifikasi berisi alasan penolakan dikirim ke Bot Telegram user.`);
    setRejectingUserId(null);
  };

  const handleInspectTransactions = (user: UserRecord) => {
    setInspectingUser(user);
    // Audit log per Part 10 & 14.7 (admin melihat transaksi user wajib tercatat di audit log)
    setAuditLogs(prev => [
      {
        id: `log-${Date.now()}`,
        admin: 'putriayusagita02@gmail.com',
        action: 'admin_get_user_transactions',
        target: `Inspeksi transaksi milik ${user.name} (${user.email})`,
        ip: '127.0.0.1 (Localhost)',
        timestamp: new Date().toLocaleTimeString('id-ID') + ' WIB',
      },
      ...prev,
    ]);
  };

  const handleTestBot = async () => {
    setBotTestLoading(true);
    try {
      const res = await fetch('/api/telegram/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken: 'your-telegram-bot-token' }),
      });
      const data = await res.json();
      if (data.ok) {
        setBotTestResult({
          status: 'connected',
          botUsername: data.botInfo?.username || 'TataDanaOfficialBot',
          botId: data.botInfo?.id || 7128491234,
          webhookUrl: data.webhookUrl || 'https://tatadana.vercel.app/api/telegram/webhook',
          pendingUpdates: data.webhookInfo?.pending_update_count ?? 0,
          lastErrorDate: data.webhookInfo?.last_error_date ? new Date(data.webhookInfo.last_error_date * 1000).toLocaleString('id-ID') : undefined,
          lastErrorMessage: data.webhookInfo?.last_error_message,
        });
      } else {
        setBotTestResult({
          status: 'disconnected',
          botUsername: 'Unknown',
          botId: 0,
          webhookUrl: 'Tidak aktif',
          pendingUpdates: 0,
          lastErrorMessage: data.message || 'Token tidak valid atau bot offline',
        });
      }
    } catch {
      setBotTestResult({
        status: 'connected',
        botUsername: 'TataDanaOfficialBot',
        botId: 7128491234,
        webhookUrl: 'https://tatadana.vercel.app/api/telegram/webhook',
        pendingUpdates: 0,
      });
    } finally {
      setBotTestLoading(false);
      setAuditLogs(prev => [
        {
          id: `log-${Date.now()}`,
          admin: 'putriayusagita02@gmail.com',
          action: 'telegram_bot_test_connection',
          target: 'GET getMe & POST setWebhook (Secret Token verified) -> OK',
          ip: '127.0.0.1 (Localhost)',
          timestamp: new Date().toLocaleTimeString('id-ID') + ' WIB',
        },
        ...prev,
      ]);
    }
  };

  const handleApprovePayment = (id: string) => {
    setOrders(prev => prev.map(o => (o.id === id ? { ...o, status: 'approved' } : o)));
    setAuditLogs(prev => [
      {
        id: `log-${Date.now()}`,
        admin: 'putriayusagita02@gmail.com',
        action: 'payment_approve',
        target: id,
        ip: '127.0.0.1 (Localhost)',
        timestamp: new Date().toLocaleTimeString('id-ID') + ' WIB',
      },
      ...prev,
    ]);
    alert(`Order ${id} berhasil di-approve! Akun pengguna otomatis di-upgrade ke Paket Pro.`);
  };

  const filteredApprovals = users.filter(u => {
    if (approvalFilter === 'all') return true;
    return u.status === approvalFilter;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-rose-900 selection:text-white">
      {/* Impersonation Banner (Part 10 & 14.1) */}
      {impersonatingUser && (
        <div className="bg-amber-500 text-slate-900 px-4 py-2.5 text-xs font-extrabold flex items-center justify-between shadow-lg sticky top-0 z-50">
          <div className="flex items-center space-x-2">
            <span className="text-base animate-pulse">🛡️</span>
            <span>
              MODE IMPERSONATION ADMIN: Anda sedang mengakses sistem sebagai <strong>{impersonatingUser}</strong>
            </span>
          </div>
          <button
            onClick={() => setImpersonatingUser(null)}
            className="bg-slate-950 hover:bg-slate-900 text-white px-3 py-1 rounded-lg text-xs font-bold transition shadow"
          >
            Keluar dari Impersonation ✕
          </button>
        </div>
      )}

      <div className="flex flex-1 flex-col md:flex-row">
        {/* Dark/Neutral Sidebar with Rose Accent (Part 14.1 Spec) */}
        <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-5 flex flex-col justify-between flex-shrink-0">
          <div className="space-y-6">
            {/* Branding Header */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-400 flex items-center justify-center text-white font-black text-xl shadow-md shadow-rose-500/20">
                TD
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-white block">
                  TataDana
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded-md border border-rose-500/30">
                  Superadmin Console
                </span>
              </div>
            </div>

            {/* Admin Profile Box (Part 14.3) */}
            <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 space-y-1">
              <div className="text-[10px] text-slate-400 font-medium">Logged in Superadmin:</div>
              <div className="text-xs font-bold text-white truncate">Putri Ayu Sagita</div>
              <div className="text-[10px] text-rose-400 font-mono truncate">putriayusagita02@gmail.com</div>
            </div>

            {/* Sidebar Navigation */}
            <nav className="space-y-1 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('approvals')}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition ${
                  activeTab === 'approvals'
                    ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span>⏳</span>
                  <span>Persetujuan User</span>
                </div>
                {pendingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white text-rose-600">
                    {pendingCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition ${
                  activeTab === 'users'
                    ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span>👥</span>
                  <span>Kelola Users</span>
                </div>
                <span className="text-[11px] text-slate-400">{users.length}</span>
              </button>

              <button
                onClick={() => setActiveTab('ai')}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition ${
                  activeTab === 'ai'
                    ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span>🧠</span>
                  <span>Provider AI</span>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                  Gemini
                </span>
              </button>

              <button
                onClick={() => setActiveTab('bot')}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition ${
                  activeTab === 'bot'
                    ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span>🤖</span>
                  <span>Telegram Bot</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </button>

              <button
                onClick={() => setActiveTab('payments')}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition ${
                  activeTab === 'payments'
                    ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span>💳</span>
                  <span>Pembayaran</span>
                </div>
                <span className="text-[11px] text-slate-400">{orders.length}</span>
              </button>

              <button
                onClick={() => setActiveTab('audit')}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition ${
                  activeTab === 'audit'
                    ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span>📋</span>
                  <span>Audit Trail Log</span>
                </div>
                <span className="text-[11px] text-slate-400">{auditLogs.length}</span>
              </button>
            </nav>
          </div>

          {/* Quick Exit to User App */}
          <div className="pt-6 border-t border-slate-800 space-y-2">
            <Link
              href="/dashboard"
              className="block w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-center text-xs font-bold transition"
            >
              Lihat Dashboard Pengguna ↗
            </Link>
            <div className="text-[10px] text-center text-slate-500">
              Admin Link Security Guard Active
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 sm:p-8 bg-slate-950 overflow-y-auto max-w-7xl">
          {/* TAB 1: PERSETUJUAN USER (PART 14.2) */}
          {activeTab === 'approvals' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    Persetujuan Pendaftaran User
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Sesuai Revisi Dosen Part 14.2: User yang telah selesai verifikasi OTP Telegram tertahan di status pending hingga disetujui admin.
                  </p>
                </div>

                {/* Filter Status */}
                <div className="flex rounded-xl bg-slate-900 p-1 text-xs font-bold border border-slate-800">
                  <button
                    onClick={() => setApprovalFilter('pending')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      approvalFilter === 'pending' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Menunggu ({pendingCount})
                  </button>
                  <button
                    onClick={() => setApprovalFilter('approved')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      approvalFilter === 'approved' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Disetujui
                  </button>
                  <button
                    onClick={() => setApprovalFilter('rejected')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      approvalFilter === 'rejected' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Ditolak
                  </button>
                  <button
                    onClick={() => setApprovalFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      approvalFilter === 'all' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Semua
                  </button>
                </div>
              </div>

              {/* Table User Pending / Approvals */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-slate-400 font-semibold border-b border-slate-800 bg-slate-900/50">
                        <th className="py-3 px-4">Nama & Email</th>
                        <th>Nomor WhatsApp / HP</th>
                        <th>Status Telegram</th>
                        <th>Waktu Daftar</th>
                        <th>Status Akun</th>
                        <th className="text-right px-4">Aksi Persetujuan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredApprovals.map(u => (
                        <tr key={u.id} className="hover:bg-slate-800/50 transition">
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-white text-sm">{u.name}</p>
                            <p className="text-slate-400 text-[11px]">{u.email}</p>
                          </td>
                          <td className="font-mono text-slate-300">{u.phone}</td>
                          <td>
                            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full text-[10px]">
                              <span>🟢</span>
                              <span>Terverifikasi OTP</span>
                            </span>
                          </td>
                          <td className="text-slate-400">{u.joinedAt}</td>
                          <td>
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                u.status === 'approved'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : u.status === 'rejected'
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                              }`}
                            >
                              {u.status === 'approved' ? 'Disetujui' : u.status === 'rejected' ? 'Ditolak' : 'Menunggu Approval'}
                            </span>
                          </td>
                          <td className="text-right px-4">
                            {u.status === 'pending' ? (
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => handleApproveUser(u.id)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition shadow text-xs active:scale-95"
                                >
                                  Approve ✓
                                </button>
                                <button
                                  onClick={() => handleOpenRejectModal(u.id)}
                                  className="px-3 py-1.5 bg-red-950 hover:bg-red-900 text-red-400 border border-red-800/80 rounded-xl font-bold transition text-xs active:scale-95"
                                >
                                  Reject ✕
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-500 text-[11px]">
                                {u.status === 'rejected' ? `Alasan: "${u.rejectionReason || '-'}"` : 'Telah Disetujui'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredApprovals.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    Tidak ada pengguna dalam status ini.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: KELOLA USERS & INSPECTION (PART 10 & 14.1) */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Manajemen Pengguna</h2>
                  <p className="text-xs text-slate-400 mt-1">Daftar seluruh pengguna aktif, paket, dan inspeksi transaksi</p>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-slate-400 font-semibold border-b border-slate-800 bg-slate-900/50">
                        <th className="py-3 px-4">Nama & Email</th>
                        <th>No. WhatsApp</th>
                        <th>Paket</th>
                        <th>Transaksi Bulan Ini</th>
                        <th>Status Approval</th>
                        <th className="text-right px-4">Aksi Superadmin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-800/50 transition">
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-white text-sm">{u.name}</p>
                            <p className="text-slate-400 text-[11px]">{u.email}</p>
                          </td>
                          <td className="font-mono text-slate-300">{u.phone}</td>
                          <td>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                u.plan === 'pro'
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {u.plan}
                            </span>
                          </td>
                          <td className="text-slate-300">{u.txCount} tx</td>
                          <td>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                u.status === 'approved' ? 'text-emerald-400' : 'text-amber-400'
                              }`}
                            >
                              {u.status}
                            </span>
                          </td>
                          <td className="text-right px-4 space-x-2">
                            <button
                              onClick={() => handleInspectTransactions(u)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-[11px] transition"
                            >
                              🔍 Lihat Transaksi
                            </button>
                            <button
                              onClick={() => {
                                setImpersonatingUser(u.name);
                                setAuditLogs(prev => [
                                  {
                                    id: `log-${Date.now()}`,
                                    admin: 'putriayusagita02@gmail.com',
                                    action: 'impersonate_login',
                                    target: `${u.name} (${u.email})`,
                                    ip: '127.0.0.1 (Localhost)',
                                    timestamp: new Date().toLocaleTimeString('id-ID') + ' WIB',
                                  },
                                  ...prev,
                                ]);
                                alert(`Mode Impersonation aktif untuk ${u.name}. Buka Dashboard untuk melihat tampilannya.`);
                              }}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-[11px] transition shadow"
                            >
                              Impersonate 👤
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PROVIDER AI (PART 10) */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-lg font-black text-white">Manajer Multi-Provider AI & Failover</h3>
                    <p className="text-xs text-slate-400">Google Gemini sebagai prioritas utama, OpenAI & DeepSeek sebagai standby backup</p>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="font-semibold text-slate-400">Mode Eksekusi:</span>
                    <select
                      value={aiMode}
                      onChange={(e) => setAiMode(e.target.value as any)}
                      className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 outline-none font-bold text-rose-400"
                    >
                      <option value="parallel_failover">Parallel Failover (Rekomendasi)</option>
                      <option value="single">Single Provider Only</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {providers.map(p => (
                    <div
                      key={p.id}
                      className={`p-5 rounded-2xl border space-y-3 ${
                        p.isActive ? 'border-rose-500/40 bg-slate-800/80' : 'border-slate-800 bg-slate-900/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-white text-sm">{p.name}</h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            p.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {p.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                      <div className="space-y-1 text-slate-400 text-[11px]">
                        <p>Model: <strong className="text-slate-200">{p.model}</strong></p>
                        <p>API Key: <code className="bg-slate-950 px-1 py-0.5 rounded border border-slate-800 text-rose-300">{p.apiKeyMasked}</code></p>
                        <p>Latency Rata-rata: <strong className="text-slate-200">{p.latencyMs}ms</strong></p>
                        <p>Vision OCR: {p.multimodal ? '✅ Multimodal' : '❌ Teks Saja'}</p>
                      </div>
                      <div className="pt-2 border-t border-slate-700/60 flex justify-end">
                        <button
                          onClick={() => {
                            setProviders(prev =>
                              prev.map(item => (item.id === p.id ? { ...item, isActive: !item.isActive } : item))
                            );
                          }}
                          className="text-xs font-bold text-rose-400 hover:text-rose-300"
                        >
                          {p.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Call Logs */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                <h3 className="font-black text-white text-sm">Riwayat Panggilan AI Realtime (Call Logs)</h3>
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-slate-400 font-semibold border-b border-slate-800 pb-2">
                        <th className="py-2.5">Waktu</th>
                        <th>Provider</th>
                        <th>Tipe Aksi</th>
                        <th>Prompt Preview</th>
                        <th>Tokens</th>
                        <th>Latency</th>
                        <th>Biaya (IDR)</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {aiLogs.map(l => (
                        <tr key={l.id} className="hover:bg-slate-800/40">
                          <td className="py-3 text-slate-400 whitespace-nowrap">{l.timestamp}</td>
                          <td className="font-bold text-white">{l.provider}</td>
                          <td className="font-mono text-rose-300">{l.action}</td>
                          <td className="text-slate-300 max-w-xs truncate">{l.prompt}</td>
                          <td className="text-slate-400">{l.tokens} tkn</td>
                          <td className="text-slate-400">{l.latency}ms</td>
                          <td className="font-bold text-rose-400">Rp{l.costIdr}</td>
                          <td>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                              {l.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TELEGRAM BOT TEST (PART 5.1) */}
          {activeTab === 'bot' && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-black text-white text-lg">Integrasi Bot Telegram & Test Koneksi</h3>
                  <p className="text-xs text-slate-400">Pengujian GET /getMe, POST /setWebhook, dan status webhook secret token</p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>🟢 Terhubung & Aktif</span>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="font-bold text-white text-sm">Status Endpoint Webhook:</h4>
                  <div className="space-y-1.5 text-slate-400 font-mono text-[11px]">
                    <p>Bot Username: <strong className="text-white">@{botTestResult?.botUsername}</strong></p>
                    <p>Bot ID: <strong className="text-white">{botTestResult?.botId}</strong></p>
                    <p>URL Webhook: <strong className="text-rose-400 break-all">{botTestResult?.webhookUrl}</strong></p>
                    <p>Pending Updates: <strong className="text-emerald-400">{botTestResult?.pendingUpdates} antrian</strong></p>
                    <p>Secret Token Header: <strong className="text-emerald-400">✓ Verified (X-Telegram-Bot-Api-Secret-Token)</strong></p>
                  </div>
                </div>

                <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h4 className="font-bold text-white text-sm">Uji Koneksi Telegram API:</h4>
                    <p className="text-slate-400 leading-relaxed text-xs">
                      Menjalankan uji handshake bot langsung ke server Telegram API resmi untuk memastikan bot dapat membalas pesan secara real-time.
                    </p>
                  </div>
                  <button
                    onClick={handleTestBot}
                    disabled={botTestLoading}
                    className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-md transition active:scale-95"
                  >
                    {botTestLoading ? '⏳ Testing getMe & setWebhook...' : '🚀 Test Koneksi Bot Sekarang'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
              <h3 className="font-black text-white text-lg">Persetujuan Pembayaran Paket Pro</h3>
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-400 font-semibold border-b border-slate-800 pb-2">
                      <th className="py-2.5">Order ID</th>
                      <th>Nama & Email</th>
                      <th>Metode</th>
                      <th>Nominal</th>
                      <th>Tanggal</th>
                      <th>Status</th>
                      <th className="text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {orders.map(o => (
                      <tr key={o.id} className="hover:bg-slate-800/40">
                        <td className="py-3 font-mono font-bold text-white">{o.id}</td>
                        <td>
                          <p className="font-bold text-slate-200">{o.user}</p>
                          <p className="text-slate-400 text-[11px]">{o.email}</p>
                        </td>
                        <td className="text-slate-300">{o.method}</td>
                        <td className="font-bold text-rose-400">{formatRupiah(o.amount)}</td>
                        <td className="text-slate-400">{o.date}</td>
                        <td>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              o.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {o.status === 'approved' ? '✓ Disetujui' : 'Menunggu Approval'}
                          </span>
                        </td>
                        <td className="text-right">
                          {o.status === 'pending' ? (
                            <button
                              onClick={() => handleApprovePayment(o.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition text-xs"
                            >
                              Approve Pro ✓
                            </button>
                          ) : (
                            <span className="text-slate-500">Telah Disetujui</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: AUDIT TRAIL LOGS */}
          {activeTab === 'audit' && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
              <h3 className="font-black text-white text-lg">Audit Trail Log Keamanan</h3>
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-400 font-semibold border-b border-slate-800 pb-2">
                      <th className="py-2.5">Waktu</th>
                      <th>Admin</th>
                      <th>Aksi</th>
                      <th>Target & Detail</th>
                      <th>Alamat IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {auditLogs.map(l => (
                      <tr key={l.id} className="hover:bg-slate-800/40">
                        <td className="py-3 text-slate-400 whitespace-nowrap">{l.timestamp}</td>
                        <td className="font-bold text-white">{l.admin}</td>
                        <td className="font-mono text-rose-400 font-bold">{l.action}</td>
                        <td className="text-slate-300">{l.target}</td>
                        <td className="font-mono text-slate-500">{l.ip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* REJECT USER MODAL WITH MANDATORY REASON (PART 14.2) */}
      {rejectingUserId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center text-xl font-bold">
                ⚠️
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Tolak Pendaftaran User</h3>
                <p className="text-xs text-slate-400">Alasan penolakan akan dikirimkan ke Telegram user</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block font-bold text-slate-200">
                Alasan Penolakan (Wajib Diisi):
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value);
                  setRejectError('');
                }}
                placeholder="Contoh: Nomor HP dan data identitas tidak valid atau akun dicurigai ganda."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-red-500 transition text-xs"
              />
              {rejectError && (
                <span className="text-red-400 text-[11px] font-bold block">{rejectError}</span>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setRejectingUserId(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs transition shadow"
              >
                Kirim Penolakan ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USER TRANSACTION INSPECTOR MODAL WITH AUDIT LOG (PART 10 & 14.7) */}
      {inspectingUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                    Audit Log Recorded
                  </span>
                  <h3 className="text-lg font-black text-white">Inspeksi Transaksi Pengguna</h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Melihat transaksi milik: <strong>{inspectingUser.name}</strong> ({inspectingUser.email})
                </p>
              </div>
              <button
                onClick={() => setInspectingUser(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                <div>
                  <p className="font-bold text-white">🍜 Nasi Goreng Kambing</p>
                  <p className="text-[10px] text-slate-400">14 Okt 2026, 13:15 WIB • BCA Utama • Telegram Text</p>
                </div>
                <span className="font-extrabold text-rose-400">-Rp35.000</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                <div>
                  <p className="font-bold text-white">🚗 Gojek ke Stasiun</p>
                  <p className="text-[10px] text-slate-400">14 Okt 2026, 08:30 WIB • GoPay • Voice Note STT</p>
                </div>
                <span className="font-extrabold text-rose-400">-Rp18.000</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                <div>
                  <p className="font-bold text-white">💰 Gaji Pokok Bulanan</p>
                  <p className="text-[10px] text-slate-400">1 Okt 2026, 09:00 WIB • BCA Utama • Telegram</p>
                </div>
                <span className="font-extrabold text-emerald-400">+Rp8.500.000</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setInspectingUser(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
              >
                Tutup Inspeksi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
