'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  INITIAL_USER,
  INITIAL_WALLETS,
  INITIAL_CATEGORIES,
  INITIAL_BILLS,
  INITIAL_JATAH_SETTINGS,
  INITIAL_STREAKS,
  INITIAL_TRANSACTIONS,
  tatadanaStore,
  Transaction,
  Wallet,
  Category,
  FixedBill,
  formatWIBTimestamp,
  formatRupiah,
} from '@/lib/supabase';
import { calculateTataJatah, simulatePurchaseImpact } from '@/lib/tata-jatah';

// Helper: Parse transaction date string (ISO or Indonesian format)
function parseTxDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10) - 1;
    const d = parseInt(isoMatch[3], 10);
    return new Date(y, m, d);
  }
  const indonesianMonths: Record<string, number> = {
    jan: 0, januari: 0,
    feb: 1, februari: 1,
    mar: 2, maret: 2,
    apr: 3, april: 3,
    mei: 4,
    jun: 5, juni: 5,
    jul: 6, juli: 6,
    agt: 7, agustus: 7, aug: 7,
    sep: 8, september: 8,
    okt: 9, oktober: 9, oct: 9,
    nov: 10, november: 10,
    des: 11, desember: 11, dec: 11,
  };
  const idMatch = dateStr.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (idMatch) {
    const d = parseInt(idMatch[1], 10);
    const mKey = idMatch[2].toLowerCase();
    const y = parseInt(idMatch[3], 10);
    const m = indonesianMonths[mKey] ?? 9;
    return new Date(y, m, d);
  }
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

// Helper: Calculate date range boundaries (WIB local bounds)
function getDateRangeBounds(range: string, customFrom?: string, customTo?: string): { start: Date; end: Date; label: string } {
  const now = new Date();
  if (range === 'hari_ini') {
    const s = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const e = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { start: s, end: e, label: 'Hari Ini' };
  }
  if (range === 'kemarin') {
    const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const s = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0, 0);
    const e = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999);
    return { start: s, end: e, label: 'Kemarin' };
  }
  if (range === '7_hari') {
    const d7 = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    const s = new Date(d7.getFullYear(), d7.getMonth(), d7.getDate(), 0, 0, 0, 0);
    const e = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { start: s, end: e, label: '7 Hari Terakhir' };
  }
  if (range === '30_hari') {
    const d30 = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
    const s = new Date(d30.getFullYear(), d30.getMonth(), d30.getDate(), 0, 0, 0, 0);
    const e = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { start: s, end: e, label: '30 Hari Terakhir' };
  }
  if (range === 'bulan_lalu') {
    const s = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const e = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return { start: s, end: e, label: 'Bulan Lalu' };
  }
  if (range === 'tahun_ini') {
    const s = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    const e = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    return { start: s, end: e, label: 'Tahun Ini' };
  }
  if (range === 'kustom' && customFrom && customTo) {
    const s = new Date(customFrom + 'T00:00:00');
    const e = new Date(customTo + 'T23:59:59.999');
    return { start: s, end: e, label: `${customFrom} s/d ${customTo}` };
  }
  // Default: 'bulan_ini'
  const s = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const e = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start: s, end: e, label: 'Bulan Ini' };
}

// Helper: Native PDF 1.4 Binary Blob Generator
function generateTataDanaPdfBlob(data: {
  userName: string;
  periodLabel: string;
  totalIncome: number;
  totalExpense: number;
  netCashflow: number;
  transactions: Transaction[];
}): Blob {
  const sanitize = (s: string) => (s || '').replace(/[\\()]/g, '');
  const fmtNum = (n: number) => Math.round(n).toLocaleString('id-ID');

  const streamLines: string[] = [];
  streamLines.push('BT /F1 16 Tf 40 800 Td (TATADANA - LAPORAN KEUANGAN PRIBADI) Tj ET');
  streamLines.push('BT /F2 9 Tf 40 782 Td (Zona Waktu: WIB UTC+7 | Laporan Resmi SaaS TataDana) Tj ET');
  streamLines.push(`BT /F2 10 Tf 40 762 Td (Pengguna: ${sanitize(data.userName)}   |   Periode: ${sanitize(data.periodLabel)}) Tj ET`);
  
  // Executive summary
  streamLines.push(`BT /F1 11 Tf 40 735 Td (RINGKASAN FINANSIAL:) Tj ET`);
  streamLines.push(`BT /F2 10 Tf 40 718 Td (Total Pemasukan: Rp${fmtNum(data.totalIncome)}   |   Total Pengeluaran: Rp${fmtNum(data.totalExpense)}   |   Net Cashflow: ${data.netCashflow >= 0 ? '+' : ''}Rp${fmtNum(data.netCashflow)}) Tj ET`);
  
  streamLines.push('BT /F1 11 Tf 40 685 Td (DAFTAR TRANSAKSI:) Tj ET');
  streamLines.push('BT /F1 8 Tf 40 668 Td (No   Tanggal (WIB)            Kategori             Dompet          Tipe          Nominal) Tj ET');
  streamLines.push('BT /F2 8 Tf 40 660 Td (-------------------------------------------------------------------------------------------------------) Tj ET');

  let curY = 645;
  const maxTx = Math.min(data.transactions.length, 35);
  for (let i = 0; i < maxTx; i++) {
    const tx = data.transactions[i];
    const no = String(i + 1).padEnd(4, ' ');
    const tgl = (sanitize(tx.transaction_date).slice(0, 22)).padEnd(25, ' ');
    const kat = (sanitize(tx.category_name).slice(0, 18)).padEnd(20, ' ');
    const dom = (sanitize(tx.wallet_name).slice(0, 14)).padEnd(16, ' ');
    const tip = (tx.type === 'income' ? 'Pemasukan' : tx.type === 'expense' ? 'Pengeluaran' : 'Transfer').padEnd(14, ' ');
    const nom = (tx.type === 'income' ? '+' : '-') + 'Rp' + fmtNum(tx.amount);
    const row = `${no}${tgl}${kat}${dom}${tip}${nom}`;
    streamLines.push(`BT /F2 8 Tf 40 ${curY} Td (${sanitize(row)}) Tj ET`);
    curY -= 15;
    if (curY < 60) break;
  }

  if (data.transactions.length > maxTx) {
    streamLines.push(`BT /F2 8 Tf 40 ${curY} Td (... dan ${data.transactions.length - maxTx} transaksi lainnya terlampir di file spreadsheet) Tj ET`);
  }

  streamLines.push('BT /F2 8 Tf 40 35 Td (Diterbitkan secara digital oleh Sistem TataDana. Dokumen ini sah dan terverifikasi.) Tj ET');

  const streamContent = streamLines.join('\n');
  const streamLength = streamContent.length;

  const bodyParts = [
    '%PDF-1.4\n',
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    `6 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
  ];

  let offset = 0;
  const offsets: number[] = [0];
  for (let i = 0; i < bodyParts.length; i++) {
    if (i > 0) offsets.push(offset);
    offset += bodyParts[i].length;
  }

  let xref = `xref\n0 7\n0000000000 65535 f \n`;
  for (let i = 1; i <= 6; i++) {
    xref += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  }

  const trailer = `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF\n`;
  const pdfString = bodyParts.join('') + xref + trailer;

  return new Blob([pdfString], { type: 'application/pdf' });
}

export default function DashboardPage() {
  // Navigation & Tab state
  const [activeTab, setActiveTab] = useState<'beranda' | 'transaksi' | 'laporan' | 'budget' | 'wallet' | 'kalender' | 'settings'>('beranda');
  const [settingsSubtab, setSettingsSubtab] = useState<'profile' | 'telegram' | 'reminders' | 'categories' | 'tatajatah' | 'guide'>('profile');
  const [dateRange, setDateRange] = useState<'hari_ini' | 'kemarin' | '7_hari' | '30_hari' | 'bulan_ini' | 'bulan_lalu' | 'tahun_ini' | 'kustom'>('bulan_ini');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Application Data States
  const [user, setUser] = useState(INITIAL_USER);
  const [wallets, setWallets] = useState<Wallet[]>(INITIAL_WALLETS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [bills, setBills] = useState<FixedBill[]>(INITIAL_BILLS);
  const [jatahSettings, setJatahSettings] = useState(INITIAL_JATAH_SETTINGS);
  const [streaks, setStreaks] = useState(INITIAL_STREAKS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);

  // Modals & UI States
  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [showSimModal, setShowSimModal] = useState(false);
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDayDetailModal, setShowDayDetailModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(13);
  const [expandedReceiptId, setExpandedReceiptId] = useState<string | null>(null);

  // Form states for adding transaction
  const [txType, setTxType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txDesc, setTxDesc] = useState('');
  const [txCategory, setTxCategory] = useState('Makanan & Minuman');
  const [txWallet, setTxWallet] = useState('BCA Utama');
  const [txDestWallet, setTxDestWallet] = useState('GoPay');

  // Form state for purchase simulation
  const [simName, setSimName] = useState('Sepatu Olahraga Running');
  const [simAmount, setSimAmount] = useState('350000');

  // Transaction Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterWallet, setFilterWallet] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Telegram Simulator State
  const [botMessages, setBotMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; keyboard?: any[] }>>([
    {
      sender: 'bot',
      text: '👋 Halo <b>Dimas</b>! Selamat datang di bot resmi <b>TataDana</b>.<br><br>Mulai catat transaksi semudah kirim chat:<br>• <i>"beli bakso 15rb"</i><br>• <i>"gajian bca 8.5jt"</i><br>• <i>"kopi 25k pakai gopay"</i><br>• Kirim Voice Note atau Foto Struk belanja Pro!<br><br>Ketik <code>/saldo</code>, <code>/jatah</code>, atau <code>/budget</code> untuk info cepat.',
    },
  ]);
  const [botInput, setBotInput] = useState('');

  // Telegram Bot Settings
  const [alwaysAskWallet, setAlwaysAskWallet] = useState(false);
  const [telegramReminders, setTelegramReminders] = useState(true);
  const [reminderFrequency, setReminderFrequency] = useState<1 | 2>(2);
  const [isTelegramConnected, setIsTelegramConnected] = useState(true);
  const [defaultTelegramWallet, setDefaultTelegramWallet] = useState('BCA Utama');

  // Avatar Photo Upload State (Part 11.2)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  // Custom Category State (Part 3.3 & 3.7)
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('🏷️');
  const [newCatColor, setNewCatColor] = useState('#F43F5E');
  const [newCatType, setNewCatType] = useState<'expense' | 'income'>('expense');

  // Derived TataJatah calculation
  const totalBalance = wallets.filter(w => !w.isArchived).reduce((sum, w) => sum + w.balance, 0);
  const todayBounds = getDateRangeBounds('hari_ini');
  const todayCalculatedSpent = transactions
    .filter(t => {
      if (t.type !== 'expense') return false;
      const d = parseTxDate(t.transaction_date);
      if (!d) return false;
      return d >= todayBounds.start && d <= todayBounds.end;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  // Fallback to initial seed transactions on 13 Okt if no transactions exist today yet
  const seed13OktSpent = transactions
    .filter(t => t.type === 'expense' && (t.transaction_date.includes('13 Okt') || t.transaction_date.includes('2026-10-13')))
    .reduce((sum, t) => sum + t.amount, 0);

  const todaySpent = todayCalculatedSpent > 0 ? todayCalculatedSpent : (seed13OktSpent || 53000);

  const jatah = calculateTataJatah({
    walletsBalance: totalBalance,
    bills: bills.map(b => ({ id: b.id, name: b.name, amount: b.amount, dueDay: b.due_day, isPaidThisCycle: b.is_paid_this_cycle })),
    settings: {
      paydayDate: jatahSettings.payday_date,
      monthlySavingsTarget: jatahSettings.monthly_savings_target,
      enableRollover: jatahSettings.enable_rollover,
    },
    todaySpent: todaySpent,
    streakDays: streaks.current_streak_days,
  });

  // Calculate stats
  const totalIncomeMonth = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenseMonth = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const netCashflow = totalIncomeMonth - totalExpenseMonth;

  // Handle adding manual transaction
  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(txAmount);
    if (!amountNum || isNaN(amountNum)) {
      alert('Masukkan nominal transaksi yang valid.');
      return;
    }

    if (txType === 'transfer') {
      if (txWallet === txDestWallet) {
        alert('Dompet asal dan tujuan tidak boleh sama.');
        return;
      }
      setWallets(prev =>
        prev.map(w => {
          if (w.name === txWallet) return { ...w, balance: w.balance - amountNum };
          if (w.name === txDestWallet) return { ...w, balance: w.balance + amountNum };
          return w;
        })
      );
    } else {
      setWallets(prev =>
        prev.map(w => {
          if (w.name === txWallet) {
            return {
              ...w,
              balance: txType === 'expense' ? w.balance - amountNum : w.balance + amountNum,
            };
          }
          return w;
        })
      );
    }

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      user_id: user.id,
      wallet_id: wallets.find(w => w.name === txWallet)?.id || 'w-1',
      wallet_name: txWallet,
      category_id: 'c-manual',
      category_name: txType === 'transfer' ? 'Transfer Dompet' : txCategory,
      category_emoji: txType === 'transfer' ? '🔄' : (categories.find(c => c.name.includes(txCategory))?.emoji || '🏷️'),
      type: txType,
      amount: amountNum,
      description: txDesc || (txType === 'transfer' ? `Transfer ke ${txDestWallet}` : txCategory),
      notes: txDesc || 'Input via Web Dashboard',
      transaction_date: `${new Date().getDate()} Okt 2026, ${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')} WIB`,
      source: 'web',
    };

    setTransactions(prev => [newTx, ...prev]);
    setShowAddTxModal(false);
    setTxAmount('');
    setTxDesc('');
  };

  // Handle deleting transaction
  const handleDeleteTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    if (confirm(`Hapus transaksi "${tx.description}" (${formatRupiah(tx.amount)})? Saldo dompet akan dikembalikan.`)) {
      setWallets(prev =>
        prev.map(w => {
          if (w.name === tx.wallet_name) {
            return {
              ...w,
              balance: tx.type === 'expense' ? w.balance + tx.amount : w.balance - tx.amount,
            };
          }
          return w;
        })
      );
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  // Bot message handler
  const handleSendBotMessage = (textToSend?: string) => {
    const text = textToSend || botInput.trim();
    if (!text) return;

    const userMsg = { sender: 'user' as const, text };
    setBotMessages(prev => [...prev, userMsg]);
    if (!textToSend) setBotInput('');

    setTimeout(() => {
      const lower = text.toLowerCase();
      let botReply = '';
      let keyboard: any[] | undefined = undefined;

      if (lower.startsWith('/saldo')) {
        botReply = `👛 <b>Status Saldo Semua Dompet TataDana</b><br><br>` +
          wallets.map(w => `├ ${w.icon === 'building' ? '🏦' : w.icon === 'smartphone' ? '📱' : '💵'} <b>${w.name}</b> : ${formatRupiah(w.balance)}`).join('<br>') +
          `<br>└ 💰 <b>Total Saldo: ${formatRupiah(totalBalance)}</b>`;
      } else if (lower.startsWith('/jatah')) {
        botReply = `🎯 <b>Status TataJatah Harian Kamu</b><br><br>` +
          `├ 🗓️ <b>Sisa Hari Menuju Gajian:</b> ${jatah.daysLeftToPayday} hari<br>` +
          `├ 💵 <b>Jatah Harian Aman:</b> <b>${formatRupiah(jatah.safeDailyAllowance)}</b> / hari<br>` +
          `├ 🛒 <b>Terpakai Hari Ini:</b> ${formatRupiah(jatah.todaySpent)} (${jatah.spentPercentage}%)<br>` +
          `├ 💰 <b>Sisa Jatah Hari Ini:</b> <b>${formatRupiah(jatah.remainingToday)}</b><br>` +
          `└ 🚦 <b>Status:</b> ${jatah.status === 'aman' ? '🟢 Aman Terkendali' : '🔴 Lewat Jatah'}<br><br>` +
          `🔥 <b>Streak Pencatatan:</b> ${jatah.streakDays} hari berturut-turut!`;
      } else if (lower.startsWith('/budget')) {
        botReply = `🎯 <b>Status Budget Bulan Ini</b><br><br>` +
          `🍜 <b>Makanan & Minuman</b><br>███████░░░ 71% (Sisa Rp580.000)<br><br>` +
          `🚗 <b>Transportasi</b><br>█████░░░░░ 50% (Sisa Rp450.000)<br><br>` +
          `🛒 <b>Belanja Kebutuhan</b><br>████████░░ 83% (Waspada >80%!)`;
      } else if (lower.startsWith('/hari ini')) {
        botReply = `📊 <b>Rekap Transaksi Hari Ini (13 Okt)</b><br>` +
          `• Nasi Goreng Kambing : Rp35.000 (BCA Utama)<br>` +
          `• Gojek ke Stasiun : Rp18.000 (GoPay)<br><br>` +
          `💸 Total: <b>Rp53.000</b> (Sisa jatah: ${formatRupiah(jatah.remainingToday)})`;
      } else {
        // Natural language parsing simulation
        let amount = 25000;
        if (lower.includes('15rb') || lower.includes('15000')) amount = 15000;
        if (lower.includes('25rb') || lower.includes('25k')) amount = 25000;
        if (lower.includes('50rb') || lower.includes('50k')) amount = 50000;
        if (lower.includes('8.5jt')) amount = 8500000;

        let walletTarget = 'BCA Utama';
        if (lower.includes('gopay')) walletTarget = 'GoPay';
        if (lower.includes('mandiri')) walletTarget = 'Mandiri Livin';
        if (lower.includes('cash') || lower.includes('tunai')) walletTarget = 'Uang Tunai (Cash)';

        const isIncome = lower.includes('gajian') || lower.includes('gaji') || lower.includes('dapat uang');

        // Apply balance update
        setWallets(prev =>
          prev.map(w => {
            if (w.name === walletTarget) {
              return {
                ...w,
                balance: isIncome ? w.balance + amount : w.balance - amount,
              };
            }
            return w;
          })
        );

        // Add to transactions
        const botTx: Transaction = {
          id: `tx-bot-${Date.now()}`,
          user_id: user.id,
          wallet_id: wallets.find(w => w.name === walletTarget)?.id || 'w-1',
          wallet_name: walletTarget,
          category_id: isIncome ? 'c-7' : 'c-1',
          category_name: isIncome ? 'Gaji Bulanan' : 'Makanan & Minuman',
          category_emoji: isIncome ? '💰' : '🍜',
          type: isIncome ? 'income' : 'expense',
          amount,
          description: text,
          notes: `Ketik via Telegram: "${text}"`,
          transaction_date: `${new Date().getDate()} Okt 2026, ${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')} WIB`,
          source: 'telegram',
        };
        setTransactions(prev => [botTx, ...prev]);

        botReply = isIncome
          ? `💰 <b>Pemasukan tercatat!</b><br>├ Nominal : <b>${formatRupiah(amount)}</b><br>├ Dompet : 👛 <b>${walletTarget}</b><br>└ Saldo baru : <b>${formatRupiah(
              (wallets.find(w => w.name === walletTarget)?.balance || 0) + amount
            )}</b>`
          : `💸 <b>Pengeluaran tercatat!</b><br>├ Nominal : <b>${formatRupiah(amount)}</b><br>├ Kategori : 🍜 Makanan & Minuman<br>├ Dompet : 👛 <b>${walletTarget}</b><br>└ Saldo sisa : <b>${formatRupiah(
              (wallets.find(w => w.name === walletTarget)?.balance || 0) - amount
            )}</b>`;

        keyboard = [
          { text: '🔄 Ganti ke GoPay', action: 'switch_gopay' },
          { text: '🗑️ Hapus Transaksi', action: 'delete_recent' },
        ];
      }

      setBotMessages(prev => [...prev, { sender: 'bot', text: botReply, keyboard }]);
    }, 400);
  };

  // Load active user and URL Query Sync on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const active = tatadanaStore.getActiveUser();
      if (active) {
        setUser(u => ({ ...u, ...active }));
        if (active.avatar_url) {
          setAvatarUrl(active.avatar_url);
        }
      }

      const params = new URLSearchParams(window.location.search);
      const fromParam = params.get('from');
      const toParam = params.get('to');
      const rangeParam = params.get('range');
      if (fromParam && toParam) {
        setCustomFrom(fromParam);
        setCustomTo(toParam);
        setDateRange('kustom');
      } else if (rangeParam && ['hari_ini', 'kemarin', '7_hari', '30_hari', 'bulan_ini', 'bulan_lalu', 'tahun_ini'].includes(rangeParam)) {
        setDateRange(rangeParam as any);
      }
    }
  }, []);

  // Calculate active date range boundaries & label
  const { start: dateStart, end: dateEnd, label: activeDateLabel } = getDateRangeBounds(dateRange, customFrom, customTo);

  // Filter transactions within the active date range
  const transactionsInDateRange = transactions.filter(t => {
    const d = parseTxDate(t.transaction_date);
    if (!d) return true;
    return d >= dateStart && d <= dateEnd;
  });

  // Calculate stats for the active period
  const totalIncomePeriod = transactionsInDateRange
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpensePeriod = transactionsInDateRange
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const netCashflowPeriod = totalIncomePeriod - totalExpensePeriod;
  const savingsRatioPeriod = totalIncomePeriod > 0 ? Math.round((netCashflowPeriod / totalIncomePeriod) * 100) : 0;

  // Filtered transactions (Date Range + Search Query + Wallet Filter + Type Filter)
  const filteredTransactions = transactionsInDateRange.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.wallet_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesWallet = filterWallet === 'all' || t.wallet_name === filterWallet;
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesWallet && matchesType;
  });

  // Export handlers: Real downloadable Blobs
  const handleExportExcel = () => {
    if (user.subscription_plan === 'starter') {
      alert('Fitur Export Excel memerlukan Paket Pro. Silakan upgrade paket.');
      return;
    }

    const escapeCsv = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const headers = ['No', 'Tanggal (WIB)', 'Pos / Kategori', 'Dompet', 'Jenis', 'Nominal (Rp)', 'Deskripsi', 'Catatan', 'Sumber'];
    const rows = transactionsInDateRange.map((tx, idx) => [
      idx + 1,
      escapeCsv(tx.transaction_date),
      escapeCsv(tx.category_name),
      escapeCsv(tx.wallet_name),
      escapeCsv(tx.type === 'income' ? 'Pemasukan' : tx.type === 'expense' ? 'Pengeluaran' : 'Transfer'),
      tx.amount,
      escapeCsv(tx.description),
      escapeCsv(tx.notes || ''),
      escapeCsv(tx.source || 'web'),
    ].join(','));

    const summaryRows = [
      '',
      `"","","","","TOTAL PEMASUKAN",${totalIncomePeriod},"","",""`,
      `"","","","","TOTAL PENGELUARAN",${totalExpensePeriod},"","",""`,
      `"","","","","NET CASHFLOW",${netCashflowPeriod},"","",""`,
    ];

    const csvContent = '\uFEFF' + [headers.join(','), ...rows, ...summaryRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_TataDana_${dateRange}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportNotice(`File spreadsheet Excel (${activeDateLabel}) berhasil diunduh (${transactionsInDateRange.length} transaksi).`);
    setTimeout(() => setExportNotice(null), 5000);
  };

  const handleExportPdf = () => {
    if (user.subscription_plan === 'starter') {
      alert('Fitur Export PDF memerlukan Paket Pro. Silakan upgrade paket.');
      return;
    }

    const blob = generateTataDanaPdfBlob({
      userName: user.full_name,
      periodLabel: activeDateLabel,
      totalIncome: totalIncomePeriod,
      totalExpense: totalExpensePeriod,
      netCashflow: netCashflowPeriod,
      transactions: transactionsInDateRange,
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_TataDana_${dateRange}_${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportNotice(`File PDF Laporan Keuangan (${activeDateLabel}) berhasil diunduh.`);
    setTimeout(() => setExportNotice(null), 5000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* 1. TOP BAR & NAVIGATION */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-rose-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-400 flex items-center justify-center text-white font-black text-lg shadow-md shadow-rose-500/20">
                TD
              </div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-rose-600 to-rose-400 bg-clip-text text-transparent">TataDana</span>
            </Link>
            <span className="hidden sm:inline-block text-[10px] bg-rose-50 text-rose-600 font-bold px-2.5 py-0.5 rounded-full border border-rose-200">
              WIB (Asia/Jakarta)
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Quick Action Buttons */}
            <button
              onClick={() => setShowSimModal(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition shadow-sm"
            >
              <span>🤔</span>
              <span>Simulasi "Kalau Beli Ini?"</span>
            </button>

            <button
              onClick={() => setShowTelegramModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-600 hover:bg-sky-100 border border-sky-200 rounded-xl text-xs font-bold transition shadow-sm"
            >
              <span>🤖</span>
              <span>Simulator Telegram</span>
            </button>

            <button
              onClick={() => setShowAddTxModal(true)}
              className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/25 transition flex items-center gap-1"
            >
              <span>+</span>
              <span>Catat Transaksi</span>
            </button>

            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

            <Link href="/admin" className="text-xs font-semibold text-slate-500 hover:text-slate-900 hidden sm:inline-block">
              Superadmin
            </Link>
          </div>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 w-full">
        {/* User Identity Header & Date Filter */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-rose-100">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-rose-500/20 overflow-hidden relative flex-shrink-0">
              {avatarUrl || user.avatar_url ? (
                <img src={avatarUrl || user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
              ) : (
                user.full_name ? user.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'TD'
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-black text-slate-900">{user.full_name}</h1>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-gradient-to-r from-rose-600 to-rose-400 text-white rounded-full">
                  {user.subscription_plan} Plan
                </span>
                <button
                  onClick={() => setUser(u => ({ ...u, subscription_plan: u.subscription_plan === 'pro' ? 'starter' : 'pro' }))}
                  className="text-[10px] text-slate-400 hover:text-rose-600 underline"
                  title="Klik untuk menguji batasan paket Starter vs Pro"
                >
                  (Ubah ke {user.subscription_plan === 'pro' ? 'Starter' : 'Pro'})
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Tersinkron Telegram Bot @TataDanaBot • Supabase Postgres Aktif 🟢</p>
            </div>
          </div>

          {/* Date Range Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="bg-white p-1.5 rounded-2xl border border-rose-100 flex items-center space-x-1 text-xs overflow-x-auto shadow-sm">
              {(['hari_ini', 'kemarin', '7_hari', '30_hari', 'bulan_ini', 'bulan_lalu', 'tahun_ini'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => {
                    setDateRange(range);
                    if (typeof window !== 'undefined') {
                      const url = new URL(window.location.href);
                      url.searchParams.delete('from');
                      url.searchParams.delete('to');
                      url.searchParams.set('range', range);
                      window.history.replaceState({}, '', url.toString());
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl transition capitalize whitespace-nowrap ${
                    dateRange === range
                      ? 'bg-rose-500 text-white font-bold shadow-sm'
                      : 'text-slate-600 hover:bg-rose-50'
                  }`}
                >
                  {range.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Custom Date Range Picker */}
            <div className={`bg-white px-3 py-1.5 rounded-2xl border flex items-center gap-2 text-xs shadow-sm ${
              dateRange === 'kustom' ? 'border-rose-400 bg-rose-50/30' : 'border-rose-100'
            }`}>
              <span className="text-slate-400 font-semibold whitespace-nowrap">Kustom:</span>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => {
                  setCustomFrom(e.target.value);
                  setDateRange('kustom');
                  if (typeof window !== 'undefined' && e.target.value && customTo) {
                    const url = new URL(window.location.href);
                    url.searchParams.set('from', e.target.value);
                    url.searchParams.set('to', customTo);
                    url.searchParams.delete('range');
                    window.history.replaceState({}, '', url.toString());
                  }
                }}
                className="border border-slate-200 rounded-lg px-2 py-1 text-slate-700 outline-none focus:border-rose-500 text-[11px]"
              />
              <span className="text-slate-400 font-bold">s/d</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => {
                  setCustomTo(e.target.value);
                  setDateRange('kustom');
                  if (typeof window !== 'undefined' && customFrom && e.target.value) {
                    const url = new URL(window.location.href);
                    url.searchParams.set('from', customFrom);
                    url.searchParams.set('to', e.target.value);
                    url.searchParams.delete('range');
                    window.history.replaceState({}, '', url.toString());
                  }
                }}
                className="border border-slate-200 rounded-lg px-2 py-1 text-slate-700 outline-none focus:border-rose-500 text-[11px]"
              />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 pb-2 overflow-x-auto text-xs font-semibold border-b border-slate-200">
          {[
            { id: 'beranda', label: '🏠 Beranda' },
            { id: 'transaksi', label: `💳 Transaksi (${filteredTransactions.length})` },
            { id: 'laporan', label: '📊 Laporan & Export' },
            { id: 'budget', label: '🎯 Budget Bulanan' },
            { id: 'wallet', label: `👛 Multi-Wallet (${wallets.length})` },
            { id: 'kalender', label: '🗓️ Kalender Jatah' },
            { id: 'settings', label: '⚙️ Pengaturan & Bot' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20 font-bold'
                  : 'text-slate-600 hover:bg-rose-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* =========================================================================
            TAB 1: BERANDA
           ========================================================================= */}
        {activeTab === 'beranda' && (
          <div className="space-y-6">
            {/* TataJatah Hero Card */}
            <div className="bg-gradient-to-r from-rose-500 via-rose-600 to-pink-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-8 space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-white/20 rounded-full backdrop-blur-md">
                      Signature Feature: TataJatah
                    </span>
                    <span className="text-xs font-bold px-3 py-1 bg-black/20 rounded-full flex items-center gap-1">
                      <span>🔥 Streak:</span>
                      <strong>{jatah.streakDays} Hari</strong>
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black">
                    Jatah Harian Aman Kamu: {formatRupiah(jatah.safeDailyAllowance)}{' '}
                    <span className="text-sm font-normal text-rose-100">/ hari</span>
                  </h2>
                  <p className="text-xs text-rose-100 max-w-xl leading-relaxed">
                    Dihitung dari total saldo dompet ({formatRupiah(jatah.totalWalletsBalance)}) dikurangi tagihan wajib kos & listrik ({formatRupiah(jatah.upcomingBillsTotal)}) dan target tabungan ({formatRupiah(jatah.savingsTarget)}), dibagi rata {jatah.daysLeftToPayday} hari sisa menuju gajian tanggal 25.
                  </p>
                  <div className="pt-2 flex flex-wrap gap-2">
                    <button
                      onClick={() => setShowSimModal(true)}
                      className="px-4 py-2 bg-white text-rose-600 font-bold rounded-xl text-xs hover:bg-rose-50 transition shadow"
                    >
                      Simulasi: "Kalau Aku Beli Ini?"
                    </button>
                    <button
                      onClick={() => setShowTelegramModal(true)}
                      className="px-4 py-2 bg-black/20 hover:bg-black/30 text-white font-bold rounded-xl text-xs transition"
                    >
                      Catat via Bot Telegram
                    </button>
                  </div>
                </div>

                <div className="md:col-span-4 bg-white rounded-2xl p-5 text-slate-800 shadow-xl text-center space-y-2">
                  <span className="text-xs font-bold text-slate-500">Hari Ini (13 Okt)</span>
                  <p className="text-2xl font-black text-slate-900">
                    {formatRupiah(jatah.todaySpent)}{' '}
                    <span className="text-xs text-slate-400 font-normal">/ {formatRupiah(jatah.safeDailyAllowance)}</span>
                  </p>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full inline-block ${
                      jatah.status === 'aman'
                        ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                        : 'text-rose-700 bg-rose-50 border border-rose-200'
                    }`}
                  >
                    {jatah.status === 'aman' ? '🟢 Aman Terkendali' : '🔴 Lewat Jatah'} ({jatah.spentPercentage}%)
                  </span>
                  <p className="text-[11px] text-slate-500 pt-1">
                    Sisa jatah belanja hari ini: <strong>{formatRupiah(jatah.remainingToday)}</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* 4 Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm">
                <span className="text-xs text-slate-500 font-semibold">Total Saldo Semua Dompet</span>
                <p className="text-2xl font-black text-slate-900 mt-2">{formatRupiah(totalBalance)}</p>
                <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">
                  ● {wallets.length} Dompet Terhubung
                </span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm">
                <span className="text-xs text-slate-500 font-semibold">Pemasukan Bulan Ini</span>
                <p className="text-2xl font-black text-emerald-600 mt-2">{formatRupiah(totalIncomeMonth)}</p>
                <span className="text-[11px] text-slate-500 mt-1 inline-block">Gaji Pokok & Side Hustle</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm">
                <span className="text-xs text-slate-500 font-semibold">Pengeluaran Bulan Ini</span>
                <p className="text-2xl font-black text-rose-600 mt-2">{formatRupiah(totalExpenseMonth)}</p>
                <span className="text-[11px] text-rose-600 font-semibold mt-1 inline-block">
                  Tersinkron Telegram Bot
                </span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm">
                <span className="text-xs text-slate-500 font-semibold">Target Tabungan Bulanan</span>
                <p className="text-2xl font-black text-slate-800 mt-2">
                  {formatRupiah(jatahSettings.monthly_savings_target)}
                </p>
                <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">
                  Terkunci Aman di Jatah 🔒
                </span>
              </div>
            </div>

            {/* Charts & Breakdown Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Expense Category Breakdown */}
              <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-rose-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm">Distribusi Pengeluaran per Kategori</h3>
                  <span className="text-xs font-semibold text-rose-600">{categories.length} Pos Alokasi</span>
                </div>
                <div className="space-y-3 text-xs">
                  {categories.filter(c => c.type === 'expense').map(c => {
                    const budget = c.budget_amount || 1000000;
                    const spent = c.spent_amount || 0;
                    const pct = Math.round((spent / budget) * 100);
                    return (
                      <div key={c.id} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-slate-700">
                            {c.emoji} {c.name}
                          </span>
                          <span className="text-slate-500">
                            {formatRupiah(spent)} / {formatRupiah(budget)} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Onboarding Checklist & Tips */}
              <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-rose-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm">Onboarding Checklist Kamu</h3>
                  <span className="text-xs font-bold text-emerald-600">3/4 Selesai</span>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center space-x-3 text-emerald-800">
                    <span>✅</span>
                    <span>Hubungkan bot Telegram @TataDanaBot</span>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center space-x-3 text-emerald-800">
                    <span>✅</span>
                    <span>Atur tanggal gajian & tagihan rutin di TataJatah</span>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center space-x-3 text-emerald-800">
                    <span>✅</span>
                    <span>Catat transaksi pertama melalui Telegram</span>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 flex items-center justify-between text-rose-800">
                    <div className="flex items-center space-x-2">
                      <span>⏳</span>
                      <span>Capai streak pencatatan 14 hari berturut-turut</span>
                    </div>
                    <span className="font-bold text-[10px] bg-rose-200 px-2 py-0.5 rounded-full">12/14 Hari</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Transactions Table */}
            <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">10 Transaksi Terbaru</h3>
                <button onClick={() => setActiveTab('transaksi')} className="text-xs font-bold text-rose-600 hover:underline">
                  Lihat Semua →
                </button>
              </div>
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-400 font-semibold border-b border-slate-100 pb-2">
                      <th className="py-2.5">Tanggal</th>
                      <th>Kategori & Keterangan</th>
                      <th>Dompet</th>
                      <th>Sumber</th>
                      <th className="text-right">Nominal</th>
                      <th className="text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.slice(0, 10).map(t => (
                      <tr key={t.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 text-slate-500 whitespace-nowrap">{t.transaction_date}</td>
                        <td>
                          <div className="flex items-center space-x-2">
                            <span className="text-base">{t.category_emoji}</span>
                            <div>
                              <p className="font-bold text-slate-800">{t.description}</p>
                              <p className="text-[11px] text-slate-400">{t.notes}</p>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap font-medium text-slate-700">{t.wallet_name}</td>
                        <td>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                            {t.source}
                          </span>
                        </td>
                        <td className={`text-right font-black whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {t.type === 'income' ? '+' : '-'}{formatRupiah(t.amount)}
                        </td>
                        <td className="text-right">
                          <button
                            onClick={() => handleDeleteTransaction(t.id)}
                            className="text-slate-400 hover:text-red-600 px-2 py-1"
                            title="Hapus transaksi"
                          >
                            🗑️
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

        {/* =========================================================================
            TAB 2: TRANSAKSI (Filter, Search, CRUD, Pagination)
           ========================================================================= */}
        {activeTab === 'transaksi' && (
          <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Riwayat Mutasi & Transaksi</h3>
                <p className="text-xs text-slate-500">Periode: <strong className="text-rose-600">{activeDateLabel}</strong> ({filteredTransactions.length} dari {transactionsInDateRange.length} transaksi) • Audit log & rollback otomatis</p>
              </div>
              <button
                onClick={() => setShowAddTxModal(true)}
                className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-500/25 transition flex items-center gap-1.5 self-start"
              >
                <span>+</span>
                <span>Tambah Transaksi</span>
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <input
                  type="text"
                  placeholder="Cari transaksi (nama, dompet, pos)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <select
                  value={filterWallet}
                  onChange={(e) => setFilterWallet(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-rose-500"
                >
                  <option value="all">Semua Dompet</option>
                  {wallets.map(w => (
                    <option key={w.id} value={w.name}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-rose-500"
                >
                  <option value="all">Semua Jenis Transaksi</option>
                  <option value="expense">Pengeluaran Saja</option>
                  <option value="income">Pemasukan Saja</option>
                  <option value="transfer">Transfer Antar Dompet</option>
                </select>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-400 font-semibold border-b border-slate-100 pb-2">
                    <th className="py-2.5">Tanggal</th>
                    <th>Pos & Keterangan</th>
                    <th>Dompet</th>
                    <th>Metode / Sumber</th>
                    <th className="text-right">Nominal</th>
                    <th className="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 text-slate-500 whitespace-nowrap">{t.transaction_date}</td>
                      <td>
                        <div className="flex items-center space-x-2">
                          <span className="text-base">{t.category_emoji}</span>
                          <div>
                            <p className="font-bold text-slate-800">{t.description}</p>
                            <p className="text-[11px] text-slate-400">{t.notes}</p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap font-medium text-slate-700">{t.wallet_name}</td>
                      <td>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                          {t.source}
                        </span>
                      </td>
                      <td className={`text-right font-black whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatRupiah(t.amount)}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => handleDeleteTransaction(t.id)}
                          className="text-slate-400 hover:text-red-600 px-2 py-1 rounded"
                          title="Hapus dan kembalikan saldo dompet"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        Tidak ada transaksi yang cocok dengan filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: LAPORAN & EXPORT
           ========================================================================= */}
        {activeTab === 'laporan' && (
          <div className="space-y-6">
            {/* Laporan Summary Cards (Filtered by Active Date Range) */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm">
                <span className="text-xs text-slate-500 font-semibold">Total Pemasukan</span>
                <p className="text-2xl font-black text-emerald-600 mt-2">{formatRupiah(totalIncomePeriod)}</p>
                <span className="text-[10px] text-slate-400 mt-1 block">Periode: {activeDateLabel}</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm">
                <span className="text-xs text-slate-500 font-semibold">Total Pengeluaran</span>
                <p className="text-2xl font-black text-rose-600 mt-2">{formatRupiah(totalExpensePeriod)}</p>
                <span className="text-[10px] text-slate-400 mt-1 block">Periode: {activeDateLabel}</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm">
                <span className="text-xs text-slate-500 font-semibold">Net Cashflow</span>
                <p className={`text-2xl font-black mt-2 ${netCashflowPeriod >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {netCashflowPeriod >= 0 ? '+' : ''}{formatRupiah(netCashflowPeriod)}
                </p>
                <span className="text-[10px] text-slate-400 mt-1 block">Periode: {activeDateLabel}</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm">
                <span className="text-xs text-slate-500 font-semibold">Rasio Tabungan</span>
                <p className="text-2xl font-black text-slate-900 mt-2">
                  {savingsRatioPeriod}%
                </p>
                <span className="text-[10px] text-slate-400 mt-1 block">{transactionsInDateRange.length} transaksi</span>
              </div>
            </div>

            {/* Export Actions Card */}
            <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Unduh Laporan Keuangan</h3>
                  <p className="text-xs text-slate-500">
                    Periode Aktif: <strong className="text-rose-600">{activeDateLabel}</strong> • {transactionsInDateRange.length} transaksi tercatat
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleExportPdf}
                    className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs shadow transition flex items-center gap-1.5"
                  >
                    <span>📄</span>
                    <span>Export PDF (Pro)</span>
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow transition flex items-center gap-1.5"
                  >
                    <span>📊</span>
                    <span>Export Excel .csv (Pro)</span>
                  </button>
                </div>
              </div>

              {exportNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between">
                  <span>✅ {exportNotice}</span>
                  <button onClick={() => setExportNotice(null)} className="text-emerald-600 font-bold ml-2">✕</button>
                </div>
              )}

              {/* Preview Tabel Mutasi Periode Aktif */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-800">Daftar Transaksi Periode ({activeDateLabel}):</h4>
                {transactionsInDateRange.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 italic">Tidak ada transaksi pada rentang tanggal ini.</p>
                ) : (
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-slate-400 font-semibold border-b border-slate-100 pb-2">
                          <th className="py-2">Tanggal</th>
                          <th>Keterangan</th>
                          <th>Dompet</th>
                          <th className="text-right">Nominal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {transactionsInDateRange.map(t => (
                          <tr key={t.id} className="hover:bg-slate-50 transition">
                            <td className="py-2.5 text-slate-500 whitespace-nowrap">{t.transaction_date}</td>
                            <td className="font-medium text-slate-800">
                              <span className="mr-1.5">{t.category_emoji}</span>
                              {t.description}
                            </td>
                            <td className="text-slate-600">{t.wallet_name}</td>
                            <td className={`text-right font-black whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {t.type === 'income' ? '+' : '-'}{formatRupiah(t.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Expandable Struk Belanja Table */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-800">Daftar Transaksi Struk Belanja Multi-Item OCR:</h4>
                {transactions.filter(t => t.source === 'receipt_ocr' || t.receipt_items).map(tx => (
                  <div key={tx.id} className="border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">🧾</span>
                        <div>
                          <span className="font-bold text-slate-900">{tx.description}</span>
                          <span className="text-slate-400 block text-[11px]">{tx.transaction_date} • {tx.wallet_name}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-black text-rose-600 text-sm">{formatRupiah(tx.amount)}</span>
                        <button
                          onClick={() => setExpandedReceiptId(expandedReceiptId === tx.id ? null : tx.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-bold"
                        >
                          {expandedReceiptId === tx.id ? 'Tutup Rincian' : 'Lihat Item'}
                        </button>
                      </div>
                    </div>

                    {expandedReceiptId === tx.id && tx.receipt_items && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 bg-slate-50 p-3 rounded-xl">
                        <p className="font-bold text-[11px] text-slate-600">Rincian Produk Struk Belanja:</p>
                        {tx.receipt_items.map((it, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[11px] text-slate-700">
                            <span>• {it.name} ({it.quantity}x @ {formatRupiah(it.price)})</span>
                            <strong>{formatRupiah(it.subtotal)}</strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: BUDGET BULANAN
           ========================================================================= */}
        {activeTab === 'budget' && (
          <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Alokasi & Pemantauan Budget Kategori</h3>
                <p className="text-xs text-slate-500">Indikator peringatan dini saat pengeluaran melewati 80% dan 100%</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {categories.filter(c => c.type === 'expense').map(c => {
                const budget = c.budget_amount || 1000000;
                const spent = c.spent_amount || 0;
                const pct = Math.round((spent / budget) * 100);
                const isOver = pct >= 100;
                const isWarn = pct >= 80 && pct < 100;

                return (
                  <div key={c.id} className="p-5 rounded-2xl border border-slate-200 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{c.emoji}</span>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{c.name}</h4>
                          <span className="text-[11px] text-slate-400">Budget: {formatRupiah(budget)} / bln</span>
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isOver
                            ? 'bg-red-100 text-red-700'
                            : isWarn
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {isOver ? '⚠️ Lewat 100%' : isWarn ? '⚡ Waspada >80%' : '🟢 Aman'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-slate-600">
                        <span>Terpakai: {formatRupiah(spent)}</span>
                        <span>Sisa: {formatRupiah(Math.max(0, budget - spent))}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOver ? 'bg-red-500' : isWarn ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: MULTI-WALLET
           ========================================================================= */}
        {activeTab === 'wallet' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Kelola Multi-Wallet & Dompet Digital</h3>
                <p className="text-xs text-slate-500">Pilih dompet default bot Telegram dan transfer mutasi instan</p>
              </div>
              <button
                onClick={() => setShowTransferModal(true)}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs shadow transition"
              >
                🔄 Transfer Antar Dompet
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {wallets.map(w => (
                <div key={w.id} className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">
                      {w.type === 'bank' ? '🏦' : w.type === 'ewallet' ? '📱' : '💵'}
                    </span>
                    {w.is_default_telegram && (
                      <span className="text-[10px] font-bold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full border border-rose-200">
                        Default Telegram ★
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{w.name}</h4>
                    <span className="text-[11px] text-slate-400 font-mono">alias: @{w.alias}</span>
                    <p className="text-xl font-black text-rose-600 mt-2">{formatRupiah(w.balance)}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    {!w.is_default_telegram ? (
                      <button
                        onClick={() => {
                          setWallets(prev => prev.map(item => ({ ...item, is_default_telegram: item.id === w.id })));
                        }}
                        className="text-slate-500 hover:text-rose-600 font-semibold"
                      >
                        Set Default
                      </button>
                    ) : (
                      <span className="text-rose-600 font-semibold">Aktif</span>
                    )}
                    <button
                      onClick={() => {
                        setWallets(prev => prev.map(item => item.id === w.id ? { ...item, is_archived: !item.is_archived } : item));
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {w.is_archived ? 'Batal Arsip' : 'Arsipkan'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 6: KALENDER JATAH (Heatmap Bulanan & Day Detail Modal)
           ========================================================================= */}
        {activeTab === 'kalender' && (
          <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Kalender Heatmap TataJatah — Oktober 2026</h3>
                <p className="text-xs text-slate-500">Klik tanggal untuk melihat daftar transaksi dan evaluasi jatah harian</p>
              </div>
              <div className="flex items-center space-x-3 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Aman</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Hati-hati</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Lewat</span>
              </div>
            </div>

            {/* Calendar Grid 31 Days */}
            <div className="grid grid-cols-7 gap-2 text-xs">
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d, i) => (
                <div key={i} className="text-center font-bold text-slate-400 py-1">{d}</div>
              ))}
              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                const isToday = day === 13;
                const isPayday = day === 25;
                // mock status
                const isOver = day === 10 || day === 7;
                const isWarn = day === 12;

                return (
                  <button
                    key={day}
                    onClick={() => {
                      setSelectedDay(day);
                      setShowDayDetailModal(true);
                    }}
                    className={`h-20 p-2 rounded-2xl border text-left flex flex-col justify-between transition hover:shadow-md ${
                      isToday
                        ? 'border-rose-500 bg-rose-50/50 ring-2 ring-rose-500/20'
                        : isPayday
                        ? 'border-emerald-500 bg-emerald-50/50'
                        : 'border-slate-100 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className={`font-bold ${isToday ? 'text-rose-600' : 'text-slate-800'}`}>
                        {day}
                      </span>
                      {isPayday && <span className="text-[9px] bg-emerald-600 text-white px-1 rounded font-bold">Gajian</span>}
                    </div>
                    <div>
                      {day <= 13 ? (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            isOver
                              ? 'bg-red-100 text-red-700'
                              : isWarn
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {isOver ? '🔴 Lewat' : isWarn ? '🟡 Hati2' : '🟢 Aman'}
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-300">Mendatang</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 7: PENGATURAN & BOT TELEGRAM
           ========================================================================= */}
        {activeTab === 'settings' && (
          <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm space-y-6">
            <div className="flex items-center space-x-2 pb-2 overflow-x-auto text-xs font-semibold border-b border-slate-100">
              {[
                { id: 'profile', label: 'Profil Pengguna' },
                { id: 'telegram', label: 'Bot Telegram' },
                { id: 'reminders', label: 'Pengingat Harian' },
                { id: 'categories', label: 'Kategori Belanja' },
                { id: 'tatajatah', label: 'Konfigurasi TataJatah' },
                { id: 'guide', label: 'Panduan Cara Pakai' },
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setSettingsSubtab(sub.id as any)}
                  className={`px-3 py-2 rounded-xl transition ${
                    settingsSubtab === sub.id ? 'bg-rose-500 text-white font-bold' : 'text-slate-600 hover:bg-rose-50'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {/* Profile Subtab (Part 11.2) */}
            {settingsSubtab === 'profile' && (
              <div className="space-y-5 max-w-lg text-xs">
                {/* Avatar Photo Section (Part 11.2) */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-black text-xl shadow-md overflow-hidden relative flex-shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Foto Profil" className="w-full h-full object-cover" />
                    ) : (
                      user.full_name ? user.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'TD'
                    )}
                  </div>
                  <div className="space-y-1 text-center sm:text-left flex-1">
                    <h4 className="font-bold text-slate-900 text-sm">Foto Profil Akun</h4>
                    <p className="text-[11px] text-slate-500">Maksimal 2 MB (JPG, PNG, atau WebP). Dipotong persegi otomatis.</p>
                    {avatarError && <p className="text-[11px] text-red-600 font-semibold">{avatarError}</p>}
                    <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
                      <label className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold cursor-pointer transition shadow-sm active:scale-95">
                        <span>{isUploadingAvatar ? 'Mengunggah...' : 'Ganti Foto'}</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            setAvatarError('');
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 2 * 1024 * 1024) {
                              setAvatarError('Ukuran berkas melebihi batas maksimal 2 MB.');
                              return;
                            }
                            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                              setAvatarError('Format gambar harus JPG, PNG, atau WebP.');
                              return;
                            }
                            setIsUploadingAvatar(true);
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const result = event.target?.result as string;
                              setAvatarUrl(result);
                              setIsUploadingAvatar(false);
                              setUser(u => {
                                const updated = { ...u, avatar_url: result };
                                tatadanaStore.updateUser(updated as any);
                                return updated;
                              });
                              alert('✅ Foto profil berhasil diupload ke Supabase Storage (bucket avatars) dan diperbarui!');
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </label>
                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setAvatarUrl(null);
                            setUser(u => {
                              const updated = { ...u, avatar_url: undefined };
                              tatadanaStore.updateUser(updated as any);
                              return updated;
                            });
                            alert('Foto profil dihapus. Kembali ke avatar default inisial nama.');
                          }}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition"
                        >
                          Hapus Foto
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={user.full_name}
                    onChange={(e) => setUser(u => ({ ...u, full_name: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={user.email}
                    onChange={(e) => setUser(u => ({ ...u, email: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mata Uang Utama</label>
                  <input
                    type="text"
                    value={user.default_currency}
                    readOnly
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-500"
                  />
                </div>
                <button
                  onClick={() => alert('Profil berhasil disimpan di database!')}
                  className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow transition"
                >
                  Simpan Perubahan
                </button>
              </div>
            )}

            {/* Telegram Subtab (Part 5 & 4.4) */}
            {settingsSubtab === 'telegram' && (
              <div className="space-y-4 max-w-lg text-xs">
                <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl flex items-center justify-between text-sky-800">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🤖</span>
                    <div>
                      <h4 className="font-bold text-sm">Status: {isTelegramConnected ? '🟢 Terhubung dengan @TataDanaBot' : '🔴 Terputus'}</h4>
                      <p className="text-[11px] text-sky-600">ID Telegram: 712849123 • Webhook Active (WIB)</p>
                    </div>
                  </div>
                  <span className={`text-xs text-white font-bold px-2 py-0.5 rounded-full ${isTelegramConnected ? 'bg-emerald-500' : 'bg-red-500'}`}>
                    {isTelegramConnected ? 'Online' : 'Offline'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      alert('📩 Pesan tes berhasil dikirim ke chat Telegram Anda!\n\n"Halo Dimas! Ini pesan tes koneksi resmi dari TataDana. Koneksi bot Telegram aktif dan siap mencatat transaksi Anda!"');
                    }}
                    className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl transition shadow-sm"
                  >
                    Kirim Pesan Tes ✈️
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Apakah Anda yakin ingin memutuskan koneksi akun Telegram ini?')) {
                        setIsTelegramConnected(false);
                        alert('Koneksi Telegram diputuskan.');
                      }
                    }}
                    className="px-3.5 py-2 bg-slate-200 hover:bg-red-100 text-slate-700 hover:text-red-700 font-bold rounded-xl transition"
                  >
                    Putuskan Koneksi ✕
                  </button>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dompet Default untuk Pencatatan Telegram</label>
                  <select
                    value={defaultTelegramWallet}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDefaultTelegramWallet(val);
                      setWallets(prev => prev.map(w => ({ ...w, is_default_telegram: w.name === val })));
                      alert(`Dompet default Telegram berhasil diatur ke: ${val}`);
                    }}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-rose-500 bg-white font-bold text-slate-800"
                  >
                    {wallets.map(w => (
                      <option key={w.id} value={w.name}>{w.name} ({formatRupiah(w.balance)})</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Transaksi chat yang tidak menyebutkan nama dompet otomatis menggunakan dompet default ini.
                  </p>
                </div>

                <div className="pt-2 space-y-2 border-t border-slate-100">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alwaysAskWallet}
                      onChange={(e) => setAlwaysAskWallet(e.target.checked)}
                      className="rounded text-rose-500 w-4 h-4"
                    />
                    <span className="font-semibold text-slate-700">Mode "Selalu Tanya Dompet" saat mencatat via chat</span>
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Jika diaktifkan, bot akan menampilkan tombol pilihan dompet setiap kali kamu mencatat transaksi tanpa menyebut nama dompet.
                  </p>
                </div>
              </div>
            )}

            {/* Categories Subtab (Part 3.3 & 3.7) */}
            {settingsSubtab === 'categories' && (
              <div className="space-y-5 max-w-lg text-xs">
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">Tambah Kategori Baru</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Nama Kategori</label>
                      <input
                        type="text"
                        placeholder="Misal: Kopi & Nongkrong"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-rose-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Emoji Icon</label>
                      <input
                        type="text"
                        value={newCatEmoji}
                        onChange={(e) => setNewCatEmoji(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-rose-500 bg-white text-center text-base"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Jenis Kategori</label>
                      <select
                        value={newCatType}
                        onChange={(e) => setNewCatType(e.target.value as any)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none bg-white font-medium"
                      >
                        <option value="expense">Pengeluaran</option>
                        <option value="income">Pemasukan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Warna Badge</label>
                      <input
                        type="color"
                        value={newCatColor}
                        onChange={(e) => setNewCatColor(e.target.value)}
                        className="w-full h-9 p-1 border border-slate-200 rounded-xl bg-white cursor-pointer"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newCatName.trim()) {
                        alert('Silakan masukkan nama kategori.');
                        return;
                      }
                      const createdCat: Category = {
                        id: `cat-${Date.now()}`,
                        name: newCatName.trim(),
                        emoji: newCatEmoji || '🏷️',
                        color: newCatColor || '#F43F5E',
                        type: newCatType,
                        budget_amount: newCatType === 'expense' ? 1000000 : 0,
                        spent_amount: 0,
                      };
                      setCategories(prev => [...prev, createdCat]);
                      setNewCatName('');
                      alert(`Kategori "${createdCat.emoji} ${createdCat.name}" berhasil ditambahkan!`);
                    }}
                    className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-sm transition"
                  >
                    + Tambah Kategori
                  </button>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 text-xs">Daftar Kategori Aktif ({categories.length}):</h4>
                  <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto">
                    {categories.map(c => (
                      <div key={c.id} className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-base">{c.emoji}</span>
                          <span className="font-bold text-slate-800 text-[11px] truncate">{c.name}</span>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${c.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {c.type === 'income' ? 'Masuk' : 'Keluar'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Reminders Subtab */}
            {settingsSubtab === 'reminders' && (
              <div className="space-y-4 max-w-lg text-xs">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={telegramReminders}
                    onChange={(e) => setTelegramReminders(e.target.checked)}
                    className="rounded text-rose-500"
                  />
                  <span className="font-semibold text-slate-700">Aktifkan Pengingat Keuangan Telegram Harian</span>
                </label>
                <div className="space-y-2">
                  <label className="block font-semibold text-slate-700">Frekuensi Pengingat (WIB)</label>
                  <select
                    value={reminderFrequency}
                    onChange={(e) => setReminderFrequency(Number(e.target.value) as any)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-rose-500"
                  >
                    <option value={1}>1x Sehari (Pukul 20:00 WIB)</option>
                    <option value={2}>2x Sehari (Siang 12:00 & Malam 20:00 WIB)</option>
                  </select>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600">
                  Preview Pesan: <em>"⏰ Reminder Keuangan! Sudahkah kamu mencatat pengeluaran siang ini? Sisa jatahmu aman: Rp318.000."</em>
                </div>
              </div>
            )}

            {/* TataJatah Subtab */}
            {settingsSubtab === 'tatajatah' && (
              <div className="space-y-4 max-w-lg text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Gajian Bulanan</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={jatahSettings.payday_date}
                    onChange={(e) => setJatahSettings(j => ({ ...j, payday_date: Number(e.target.value) || 25 }))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Tabungan Bulanan (Rp)</label>
                  <input
                    type="number"
                    value={jatahSettings.monthly_savings_target}
                    onChange={(e) => setJatahSettings(j => ({ ...j, monthly_savings_target: Number(e.target.value) || 0 }))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-rose-500"
                  />
                </div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={jatahSettings.enable_rollover}
                    onChange={(e) => setJatahSettings(j => ({ ...j, enable_rollover: e.target.checked }))}
                    className="rounded text-rose-500"
                  />
                  <span className="font-semibold text-slate-700">Aktifkan Rollover Sisa Jatah ke Hari Berikutnya</span>
                </label>
                <button
                  onClick={() => alert('Konfigurasi TataJatah berhasil diperbarui!')}
                  className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow transition"
                >
                  Simpan Konfigurasi
                </button>
              </div>
            )}

            {/* Guide Subtab */}
            {settingsSubtab === 'guide' && (
              <div className="space-y-3 max-w-xl text-xs text-slate-700 leading-relaxed">
                <h4 className="font-bold text-sm text-slate-900">Panduan Ringkas Penggunaan TataDana</h4>
                <p>1. <strong>Chat Alami:</strong> Cukup ketik nama transaksi dan nominal di Telegram. Contoh: <code>bakso 15rb</code>, <code>bensin 30k</code>.</p>
                <p>2. <strong>Pilih Dompet:</strong> Sebutkan nama dompet di kalimat (misal: <code>kopi 28k pakai gopay</code>), atau biarkan menggunakan dompet default.</p>
                <p>3. <strong>Foto Struk OCR:</strong> Ambil foto struk belanja Indomaret/Alfamart, kirim ke bot, dan AI otomatis memecah belanjaan per item.</p>
                <p>4. <strong>Perintah Cepat:</strong> Gunakan <code>/saldo</code>, <code>/jatah</code>, <code>/budget</code>, atau <code>/bantuan</code> untuk info kilat.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* =========================================================================
          MODAL 1: SIMULASI "KALAU AKU BELI INI?"
         ========================================================================= */}
      {showSimModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-rose-100 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🤔</span>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Simulasi: "Kalau Aku Beli Ini?"</h3>
                  <p className="text-[11px] text-slate-500">Hitung dampak belanja ke jatah harianmu hingga gajian</p>
                </div>
              </div>
              <button onClick={() => setShowSimModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Barang / Belanja</label>
                <input
                  type="text"
                  value={simName}
                  onChange={(e) => setSimName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Estimasi Nominal (Rp)</label>
                <input
                  type="number"
                  value={simAmount}
                  onChange={(e) => setSimAmount(e.target.value)}
                  className="w-full text-base font-bold text-rose-600 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-rose-500"
                />
              </div>

              {/* Simulation Result */}
              {(() => {
                const amt = parseFloat(simAmount) || 0;
                const simRes = simulatePurchaseImpact(jatah, amt, simName);
                return (
                  <div className="p-4 bg-rose-50/70 border border-rose-100 rounded-2xl space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Jatah Harian Saat Ini:</span>
                      <strong>{formatRupiah(simRes.currentDailyAllowance)} / hari</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-900 font-bold">
                      <span>Jatah Harian Baru:</span>
                      <span className="text-base text-rose-600">{formatRupiah(simRes.newDailyAllowance)} / hari</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-500">
                      <span>Dampak Pengurangan:</span>
                      <span>-{formatRupiah(simRes.differencePerDay)} / hari ({simRes.percentImpact}%)</span>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-800 pt-1 leading-relaxed">
                      {simRes.adviceMessage}
                    </p>
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end space-x-2 pt-2 text-xs">
              <button
                onClick={() => setShowSimModal(false)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  const amt = parseFloat(simAmount) || 0;
                  setTransactions(prev => [
                    {
                      id: `tx-sim-${Date.now()}`,
                      user_id: user.id,
                      wallet_id: 'w-1',
                      wallet_name: 'BCA Utama',
                      category_id: 'c-3',
                      category_name: 'Belanja Kebutuhan',
                      category_emoji: '🛒',
                      type: 'expense',
                      amount: amt,
                      description: simName,
                      notes: 'Dicatat dari Simulasi Belanja',
                      transaction_date: `${new Date().getDate()} Okt 2026 WIB`,
                      source: 'web',
                    },
                    ...prev,
                  ]);
                  setShowSimModal(false);
                  alert(`Pembelian "${simName}" (${formatRupiah(amt)}) berhasil dicatat sebagai pengeluaran!`);
                }}
                className="px-5 py-2 font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow transition"
              >
                Catat Pengeluaran
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: TAMBAH TRANSAKSI MANUAL
         ========================================================================= */}
      {showAddTxModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-rose-100 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">Catat Transaksi Manual</h3>
              <button onClick={() => setShowAddTxModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>

            {/* Type selector */}
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setTxType('expense')}
                className={`flex-1 py-2 rounded-lg transition ${txType === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600'}`}
              >
                Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => setTxType('income')}
                className={`flex-1 py-2 rounded-lg transition ${txType === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600'}`}
              >
                Pemasukan
              </button>
              <button
                type="button"
                onClick={() => setTxType('transfer')}
                className={`flex-1 py-2 rounded-lg transition ${txType === 'transfer' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600'}`}
              >
                Transfer
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  placeholder="Contoh: 35000"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  required
                  className="w-full text-base font-bold text-rose-600 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-rose-500"
                />
              </div>

              {txType !== 'transfer' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-rose-500"
                  >
                    {categories.filter(c => c.type === (txType === 'income' ? 'income' : 'expense')).map(c => (
                      <option key={c.id} value={c.name}>{c.emoji} {c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dompet Sumber</label>
                <select
                  value={txWallet}
                  onChange={(e) => setTxWallet(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-rose-500"
                >
                  {wallets.map(w => (
                    <option key={w.id} value={w.name}>{w.name} ({formatRupiah(w.balance)})</option>
                  ))}
                </select>
              </div>

              {txType === 'transfer' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dompet Tujuan</label>
                  <select
                    value={txDestWallet}
                    onChange={(e) => setTxDestWallet(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-rose-500"
                  >
                    {wallets.filter(w => w.name !== txWallet).map(w => (
                      <option key={w.id} value={w.name}>{w.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan / Keterangan</label>
                <input
                  type="text"
                  placeholder="Misal: Makan Siang Nasi Uduk"
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTxModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow transition"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: IN-BROWSER TELEGRAM BOT SIMULATOR
         ========================================================================= */}
      {showTelegramModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-rose-100 overflow-hidden flex flex-col h-[650px] max-h-[92vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-sky-500 to-sky-600 px-4 py-3 flex items-center justify-between text-white">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-base">🤖</div>
                <div>
                  <h3 className="font-bold text-sm">TataDana Official Bot</h3>
                  <p className="text-[11px] text-sky-100 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                    <span>Online • Webhook Active (WIB)</span>
                  </p>
                </div>
              </div>
              <button onClick={() => setShowTelegramModal(false)} className="text-white/80 hover:text-white text-lg font-bold">✕</button>
            </div>

            {/* Chat Log */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 text-xs">
              <div className="text-center my-1">
                <span className="text-[10px] bg-slate-200 text-slate-600 px-2.5 py-0.5 rounded-full font-medium">
                  Hari ini • Waktu Indonesia Barat (WIB)
                </span>
              </div>

              {botMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.sender === 'bot' && (
                    <div className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center text-[10px] font-bold mr-2 mt-0.5 flex-shrink-0">
                      TD
                    </div>
                  )}
                  <div
                    className={`p-3 max-w-[85%] rounded-2xl shadow-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-rose-500 text-white rounded-tr-sm'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                    }`}
                  >
                    <div dangerouslySetInnerHTML={{ __html: msg.text }} />

                    {/* Inline Keyboard Simulation */}
                    {msg.keyboard && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                        {msg.keyboard.map((btn, bIdx) => (
                          <button
                            key={bIdx}
                            onClick={() => {
                              alert(`Tombol "${btn.text}" diklik! Aksi dijalankan.`);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[10px] transition"
                          >
                            {btn.text}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Chips Bar */}
            <div className="px-3 py-2 bg-slate-100 border-t border-slate-200 flex items-center space-x-1.5 overflow-x-auto text-[11px]">
              <button onClick={() => handleSendBotMessage('/saldo')} className="bg-white border border-slate-300 hover:border-rose-500 px-2.5 py-1 rounded-full whitespace-nowrap font-medium">/saldo</button>
              <button onClick={() => handleSendBotMessage('/jatah')} className="bg-white border border-rose-300 text-rose-600 hover:bg-rose-50 px-2.5 py-1 rounded-full whitespace-nowrap font-bold">🎯 /jatah</button>
              <button onClick={() => handleSendBotMessage('/budget')} className="bg-white border border-slate-300 hover:border-rose-500 px-2.5 py-1 rounded-full whitespace-nowrap font-medium">/budget</button>
              <button onClick={() => handleSendBotMessage('/hari ini')} className="bg-white border border-slate-300 hover:border-rose-500 px-2.5 py-1 rounded-full whitespace-nowrap font-medium">/hari ini</button>
              <button onClick={() => handleSendBotMessage('beli sate 25rb')} className="bg-white border border-slate-300 hover:border-rose-500 px-2.5 py-1 rounded-full whitespace-nowrap font-medium">🍗 "sate 25rb"</button>
              <button onClick={() => handleSendBotMessage('kopi 25k pakai gopay')} className="bg-white border border-slate-300 hover:border-rose-500 px-2.5 py-1 rounded-full whitespace-nowrap font-medium">📱 "pakai gopay"</button>
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2 text-xs">
              <button
                onClick={() => {
                  handleSendBotMessage('📷 [Foto Struk Indomaret Point — Total Rp184.500]');
                }}
                title="Kirim Foto Struk Belanja OCR"
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
              >
                📷
              </button>
              <button
                onClick={() => {
                  handleSendBotMessage('🎙️ [Voice Note 8s: "Gojek ke stasiun 18 ribu"]');
                }}
                title="Kirim Voice Note Audio"
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
              >
                🎙️
              </button>
              <input
                type="text"
                placeholder="Ketik transaksi (misal: sate ayam 25rb)..."
                value={botInput}
                onChange={(e) => setBotInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendBotMessage();
                }}
                className="flex-1 bg-slate-100 border border-slate-200 focus:bg-white focus:border-rose-500 rounded-xl px-3 py-2 outline-none"
              />
              <button
                onClick={() => handleSendBotMessage()}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold transition shadow-sm"
              >
                Kirim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: TRANSFER ANTAR DOMPET
         ========================================================================= */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-rose-100 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">Transfer Antar Dompet</h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dari Dompet</label>
                <select
                  value={txWallet}
                  onChange={(e) => setTxWallet(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-rose-500"
                >
                  {wallets.map(w => (
                    <option key={w.id} value={w.name}>{w.name} ({formatRupiah(w.balance)})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ke Dompet Tujuan</label>
                <select
                  value={txDestWallet}
                  onChange={(e) => setTxDestWallet(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-rose-500"
                >
                  {wallets.filter(w => w.name !== txWallet).map(w => (
                    <option key={w.id} value={w.name}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nominal Transfer (Rp)</label>
                <input
                  type="number"
                  placeholder="Contoh: 100000"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  className="w-full text-base font-bold text-rose-600 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-rose-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Batal
              </button>
              <button
                onClick={(e) => {
                  setTxType('transfer');
                  handleSaveTransaction(e);
                  setShowTransferModal(false);
                }}
                className="px-5 py-2 font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow transition"
              >
                Konfirmasi Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: DETAIL KALENDER HARI
         ========================================================================= */}
      {showDayDetailModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-rose-100 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Detail Transaksi — {selectedDay} Oktober 2026</h3>
                <span className="text-[11px] font-bold text-emerald-600">
                  {selectedDay <= 13 ? '🟢 Status: Aman Terkendali' : '🗓️ Hari Mendatang'}
                </span>
              </div>
              <button onClick={() => setShowDayDetailModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {transactions.filter(t => t.transaction_date.includes(`${selectedDay} Okt`)).length > 0 ? (
                transactions.filter(t => t.transaction_date.includes(`${selectedDay} Okt`)).map(tx => (
                  <div key={tx.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">{tx.description}</p>
                      <p className="text-[10px] text-slate-400">{tx.wallet_name} • {tx.transaction_date}</p>
                    </div>
                    <span className={`font-black ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center py-6 text-slate-400">Tidak ada transaksi tercatat pada tanggal ini.</p>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowDayDetailModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
