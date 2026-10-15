/**
 * TATADANA TELEGRAM BOT HANDLER
 * 100% Bahasa Indonesia, Timezone Asia/Jakarta (WIB), Idempotency,
 * Format Reply Resmi WIB, Inline Keyboard Callbacks, Commands Lengkap,
 * TataJatah Bot Reply, dan Secret Token Verification.
 */

import {
  parseNaturalLanguageTransaction,
  parseReceiptImage,
  generateBudgetProgressBar,
  normalizeIndonesianAmount,
  ParsedTransaction,
} from './ai-parser';
import { calculateTataJatah, DailyJatahCalculation } from './tata-jatah';

export interface TelegramUserContext {
  userId: string;
  fullName: string;
  plan: 'starter' | 'pro';
  monthlyTxCount: number;
  defaultWalletName: string;
  defaultWalletBalance: number;
  alwaysAskWallet?: boolean;
}

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      first_name: string;
      type: string;
    };
    date: number;
    text?: string;
    photo?: Array<{
      file_id: string;
      file_unique_id: string;
      file_size?: number;
      width: number;
      height: number;
    }>;
    voice?: {
      file_id: string;
      duration: number;
      mime_type?: string;
      file_size?: number;
    };
    audio?: {
      file_id: string;
      duration: number;
      title?: string;
    };
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    message?: {
      message_id: number;
      chat: {
        id: number;
      };
    };
    data: string;
  };
}

/**
 * Verifikasi Secret Token header dari webhook Telegram
 */
export function verifyTelegramSecretToken(headerSecret: string | null, expectedSecret: string): boolean {
  if (!expectedSecret) return true; // jika belum diset di env, lewati
  return headerSecret === expectedSecret;
}

/**
 * Format timestamp WIB Asia/Jakarta
 */
export function formatWIBTimestamp(date: Date = new Date()): string {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const wibDate = new Date(utc + 3600000 * 7);

  const dayName = days[wibDate.getDay()];
  const dayNum = wibDate.getDate();
  const monthName = months[wibDate.getMonth()];
  const year = wibDate.getFullYear();
  const hours = String(wibDate.getHours()).padStart(2, '0');
  const minutes = String(wibDate.getMinutes()).padStart(2, '0');

  return `${dayName}, ${dayNum} ${monthName} ${year} — ${hours}:${minutes} WIB`;
}

export function formatRupiah(amount: number): string {
  return 'Rp' + Math.round(amount).toLocaleString('id-ID');
}

/**
 * Format reply pengeluaran
 */
export function formatExpenseReply(params: {
  amount: number;
  categoryName: string;
  categoryEmoji?: string;
  walletName: string;
  notes: string;
  newBalance: number;
  budgetSpent: number;
  budgetLimit: number;
  transcriptNote?: string;
}): string {
  const timestamp = formatWIBTimestamp();
  const emoji = params.categoryEmoji || '🍜';
  const progress = generateBudgetProgressBar(params.budgetSpent, params.budgetLimit);
  const remainingBudget = Math.max(0, params.budgetLimit - params.budgetSpent);

  let reply = `📅 <b>${timestamp}</b>\n`;
  if (params.transcriptNote) {
    reply += `🎙️ <i>Transkrip: "${params.transcriptNote}"</i>\n`;
  }
  reply += `💸 <b>Pengeluaran tercatat!</b>\n`;
  reply += `├ Nominal : <b>${formatRupiah(params.amount)}</b>\n`;
  reply += `├ Kategori : ${emoji} ${params.categoryName}\n`;
  reply += `├ Dompet : 👛 <b>${params.walletName}</b>\n`;
  reply += `├ Catatan : ${params.notes}\n`;
  reply += `└ Saldo sisa : <b>${formatRupiah(params.newBalance)}</b>\n\n`;

  reply += `📊 <b>Budget ${params.categoryName} bulan ini:</b>\n`;
  reply += `${progress.bar} ${progress.percentage}% — sisa ${formatRupiah(remainingBudget)}\n`;
  reply += `${progress.message}`;

  return reply;
}

/**
 * Format reply pemasukan
 */
export function formatIncomeReply(params: {
  amount: number;
  walletName: string;
  newBalance: number;
  transcriptNote?: string;
}): string {
  const timestamp = formatWIBTimestamp();

  let reply = `📅 <b>${timestamp}</b>\n`;
  if (params.transcriptNote) {
    reply += `🎙️ <i>Transkrip: "${params.transcriptNote}"</i>\n`;
  }
  reply += `💰 <b>Pemasukan tercatat!</b>\n`;
  reply += `├ Nominal : <b>${formatRupiah(params.amount)}</b>\n`;
  reply += `├ Kategori : 💼 Pemasukan\n`;
  reply += `├ Dompet : 👛 <b>${params.walletName}</b>\n`;
  reply += `└ Saldo baru : <b>${formatRupiah(params.newBalance)}</b>\n\n`;
  reply += `💪 <i>Semangat terus! Jangan lupa sisihkan untuk tabungan & jatah harian ya.</i>`;

  return reply;
}

/**
 * Format reply TataJatah via Bot (/jatah)
 */
export function formatJatahReply(jatah: DailyJatahCalculation): string {
  const statusEmoji = jatah.status === 'aman' ? '🟢' : jatah.status === 'hati_hati' ? '🟡' : '🔴';
  const statusText = jatah.status === 'aman' ? 'Aman Terkendali' : jatah.status === 'hati_hati' ? 'Hati-hati (Mendekati Limit)' : 'Lewat Jatah Harian';

  return `🎯 <b>Status TataJatah Harian Kamu</b>\n\n` +
    `├ 🗓️ <b>Sisa Hari Menuju Gajian:</b> ${jatah.daysLeftToPayday} hari\n` +
    `├ 💵 <b>Jatah Harian Aman:</b> <b>${formatRupiah(jatah.safeDailyAllowance)}</b> / hari\n` +
    `├ 🛒 <b>Terpakai Hari Ini:</b> ${formatRupiah(jatah.todaySpent)} (${jatah.spentPercentage}%)\n` +
    `├ 💰 <b>Sisa Jatah Hari Ini:</b> <b>${formatRupiah(jatah.remainingToday)}</b>\n` +
    `└ 🚦 <b>Status:</b> ${statusEmoji} <b>${statusText}</b>\n\n` +
    `🔥 <b>Streak Pencatatan:</b> ${jatah.streakDays} hari berturut-turut!\n` +
    `<i>Buka web TataDana untuk simulasi "Kalau Aku Beli Ini?"</i>`;
}

/**
 * Handle command bantuan (/bantuan)
 */
export function formatHelpReply(): string {
  return `🤖 <b>TataDana Bot — Bantuan & Perintah Lengkap</b>\n\n` +
    `📌 <b>Pencatatan Semudah Chat (WIB):</b>\n` +
    `• <i>"beli bakso 15rb"</i>\n` +
    `• <i>"gajian 5jt"</i>\n` +
    `• <i>"kopi 25k pakai gopay"</i> (otomatis pilih dompet)\n` +
    `• Kirim Voice Note: <i>"bensin motor 30 ribu"</i>\n` +
    `• Kirim Foto Struk Belanja (Khusus Paket Pro 🌟)\n\n` +
    `📋 <b>Daftar Perintah:</b>\n` +
    `├ <code>/saldo</code> — Cek saldo semua dompet\n` +
    `├ <code>/dompet</code> — Daftar & ganti dompet default\n` +
    `├ <code>/jatah</code> — Cek TataJatah harian & streak 🔥\n` +
    `├ <code>/budget</code> — Pantau progress budget kategori\n` +
    `├ <code>/hari ini</code> — Rekap transaksi hari ini\n` +
    `├ <code>/minggu ini</code> — Rekap 7 hari terakhir\n` +
    `├ <code>/bulan ini</code> — Ringkasan cashflow bulan ini\n` +
    `├ <code>/rekap</code> — Rekap menyeluruh & tips hemat\n` +
    `├ <code>/laporan</code> — Link download laporan PDF/Excel\n` +
    `└ <code>/bantuan</code> — Tampilkan pesan panduan ini\n\n` +
    `💡 <i>Semua data tersinkron realtime dengan dashboard web TataDana kamu.</i>`;
}

/**
 * Kirim pesan teks balasan ke Telegram
 */
export async function sendTelegramMessage(
  botToken: string,
  chatId: number | string,
  text: string,
  inlineKeyboard?: Array<Array<{ text: string; callback_data: string }>>
): Promise<boolean> {
  if (!botToken || botToken === 'your-telegram-bot-token') {
    return true; // Mock mode succeed
  }
  try {
    const body: any = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    };
    if (inlineKeyboard && inlineKeyboard.length > 0) {
      body.reply_markup = {
        inline_keyboard: inlineKeyboard,
      };
    }
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return data.ok;
  } catch {
    return false;
  }
}

/**
 * Test Koneksi Token Telegram ke BotFather API
 */
export async function testTelegramBotConnection(botToken: string): Promise<{
  ok: boolean;
  botInfo?: { id: number; is_bot: boolean; first_name: string; username: string };
  errorMessage?: string;
}> {
  if (!botToken || botToken === 'your-telegram-bot-token') {
    return {
      ok: true,
      botInfo: { id: 7128491234, is_bot: true, first_name: 'TataDana Bot', username: 'TataDanaBot' },
    };
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const data = await res.json();
    if (data.ok) {
      return { ok: true, botInfo: data.result };
    }
    return { ok: false, errorMessage: data.description || 'Token tidak valid' };
  } catch (err: any) {
    return { ok: false, errorMessage: err.message || 'Koneksi ke Telegram API gagal' };
  }
}

/**
 * Pasang Webhook Telegram Publik
 */
export async function registerTelegramWebhook(
  botToken: string,
  webhookBaseUrl: string,
  secretToken?: string
): Promise<{ ok: boolean; description?: string }> {
  if (!botToken || botToken === 'your-telegram-bot-token') {
    return { ok: true, description: 'Webhook registered successfully (Mock mode)' };
  }
  try {
    const webhookUrl = `${webhookBaseUrl.replace(/\/$/, '')}/api/telegram/webhook`;
    let url = `https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}&drop_pending_updates=true`;
    if (secretToken) {
      url += `&secret_token=${encodeURIComponent(secretToken)}`;
    }
    const res = await fetch(url);
    const data = await res.json();
    return { ok: data.ok, description: data.description };
  } catch (err: any) {
    return { ok: false, description: err.message || 'Gagal mendaftarkan webhook' };
  }
}

/**
 * Ambil Informasi Status Webhook Telegram (Part 5.1)
 */
export async function getTelegramWebhookInfo(botToken: string): Promise<{
  ok: boolean;
  webhookInfo?: {
    url: string;
    has_custom_certificate: boolean;
    pending_update_count: number;
    last_error_date?: number;
    last_error_message?: string;
  };
  errorMessage?: string;
}> {
  if (!botToken || botToken === 'your-telegram-bot-token') {
    return {
      ok: true,
      webhookInfo: {
        url: 'https://tatadana.vercel.app/api/telegram/webhook',
        has_custom_certificate: false,
        pending_update_count: 0,
      },
    };
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
    const data = await res.json();
    if (data.ok) {
      return { ok: true, webhookInfo: data.result };
    }
    return { ok: false, errorMessage: data.description || 'Gagal mengambil info webhook' };
  } catch (err: any) {
    return { ok: false, errorMessage: err.message || 'Koneksi ke Telegram API gagal' };
  }
}

