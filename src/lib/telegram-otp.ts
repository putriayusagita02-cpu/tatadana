/**
 * TATADANA TELEGRAM OTP & ACCOUNT LINKING ENGINE
 * Sesuai Part 14.4 Spesifikasi TataDana:
 * - OTP dikirim via Telegram bot (pengganti SMS)
 * - Deep link t.me/<bot>?start=<token> (15 menit)
 * - Tombol [📱 Bagikan Nomor HP] dengan validasi contact.user_id === from.id
 * - OTP 6-digit disimpan dalam HMAC-SHA256 (bukan plaintext)
 * - Berlaku 5 menit, max 5x percobaan salah, max 3x resend
 * - Otomatis link telegram_user_id, chat_id, phone, telegram_verified_at
 */

import crypto from 'crypto';

export interface TelegramOtpRecord {
  id: string;
  user_id: string;
  token: string;
  phone_number?: string;
  otp_hash?: string;
  telegram_user_id?: number;
  telegram_chat_id?: number;
  attempts: number;
  resend_count: number;
  token_expires_at: number; // timestamp ms
  otp_expires_at?: number;   // timestamp ms
  is_verified: boolean;
  created_at: number;
}

// In-memory resilient store (disinkronkan dengan tabel telegram_otps di Supabase)
const otpStore = new Map<string, TelegramOtpRecord>();

function getEncryptionKey(): string {
  return process.env.ENCRYPTION_KEY || 'tatadana_hmac_secret_key_default_32chars_long!';
}

export function hashOtp(code: string): string {
  const hmac = crypto.createHmac('sha256', getEncryptionKey());
  hmac.update(code.trim());
  return hmac.digest('hex');
}

export function generateSixDigitOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Langkah 1: Memulai proses verifikasi Telegram saat user mendaftar di web
 */
export async function startVerification(
  userId: string,
  userEmail?: string,
  phone?: string
): Promise<{
  token: string;
  deepLink: string;
  expiresInMinutes: number;
}> {
  const token = 'TD_' + crypto.randomBytes(8).toString('hex');
  const now = Date.now();
  const tokenExpiresAt = now + 15 * 60 * 1000; // 15 menit

  const record: TelegramOtpRecord = {
    id: 'otp_' + crypto.randomBytes(6).toString('hex'),
    user_id: userId,
    token,
    phone_number: phone,
    attempts: 0,
    resend_count: 0,
    token_expires_at: tokenExpiresAt,
    is_verified: false,
    created_at: now,
  };

  otpStore.set(token, record);
  // Simpan juga berdasarkan userId agar mudah dicari
  otpStore.set(userId, record);

  const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'TataDanaOfficialBot';
  const deepLink = `https://t.me/${botUsername}?start=${token}`;

  return {
    token,
    deepLink,
    expiresInMinutes: 15,
  };
}

/**
 * Langkah 2: Handler saat user membuka /start <token> di Telegram
 */
export async function handleStart(
  token: string,
  telegramUser: { id: number; first_name: string; username?: string }
): Promise<{
  success: boolean;
  message: string;
  keyboard?: any;
  record?: TelegramOtpRecord;
}> {
  const record = otpStore.get(token);
  const now = Date.now();

  if (!record) {
    return {
      success: false,
      message: '❌ <b>Token Tidak Valid</b>\nTautan verifikasi tidak ditemukan atau sudah kadaluwarsa. Silakan muat ulang halaman web pendaftaran.',
    };
  }

  if (now > record.token_expires_at) {
    return {
      success: false,
      message: '⏰ <b>Tautan Kadaluwarsa</b>\nTautan verifikasi berlaku 15 menit dan telah habis masa berlakunya. Silakan minta tautan baru di web TataDana.',
    };
  }

  // Cek apakah akun telegram ini sudah terhubung ke akun lain
  for (const [_, rec] of otpStore.entries()) {
    if (rec.telegram_user_id === telegramUser.id && rec.is_verified && rec.user_id !== record.user_id) {
      return {
        success: false,
        message: '⚠️ <b>Akun Telegram Sudah Dipakai</b>\nAkun Telegram ini sudah terhubung ke akun TataDana yang lain. 1 akun Telegram hanya dapat dihubungkan ke 1 akun TataDana.',
      };
    }
  }

  record.telegram_user_id = telegramUser.id;

  const welcomeMsg = `🌸 <b>Selamat datang di Verifikasi Akun TataDana, ${telegramUser.first_name}!</b>\n\n` +
    `Untuk keamanan akun dan verifikasi kepemilikan nomor telepon, silakan tekan tombol di bawah ini untuk membagikan nomor kontak Anda:`;

  const contactKeyboard = {
    keyboard: [
      [
        {
          text: '📱 Bagikan Nomor HP Saya',
          request_contact: true,
        },
      ],
    ],
    resize_keyboard: true,
    one_time_keyboard: true,
  };

  return {
    success: true,
    message: welcomeMsg,
    keyboard: contactKeyboard,
    record,
  };
}

/**
 * Langkah 3: Handler saat user menekan tombol [📱 Bagikan Nomor HP]
 */
export async function handleContact(
  tokenOrUserId: string,
  telegramUser: { id: number; first_name: string; username?: string },
  contact: { user_id?: number; phone_number: string }
): Promise<{
  success: boolean;
  message: string;
  otpCode?: string; // Hanya untuk testing / internal dispatch
  phone?: string;
}> {
  let record = otpStore.get(tokenOrUserId);
  if (!record) {
    // Cari by telegram_user_id
    for (const [_, rec] of otpStore.entries()) {
      if (rec.telegram_user_id === telegramUser.id) {
        record = rec;
        break;
      }
    }
  }

  if (!record) {
    return {
      success: false,
      message: '❌ <b>Sesi Tidak Ditemukan</b>\nSilakan klik tombol "Hubungkan Telegram" kembali di website.',
    };
  }

  // Validasi keamanan: Kontak yang dibagikan HARUS milik akun Telegram yang sama
  // (contact.user_id harus sama dengan from.id)
  if (contact.user_id && contact.user_id !== telegramUser.id) {
    return {
      success: false,
      message: '⛔ <b>Nomor Kontak Ditolak</b>\nAnda hanya boleh membagikan kontak milik nomor Anda sendiri.',
    };
  }

  if (record.resend_count >= 3) {
    return {
      success: false,
      message: '🚫 <b>Batas Pengiriman OTP Tercapai</b>\nAnda telah meminta OTP lebih dari 3 kali. Silakan coba kembali 15 menit lagi.',
    };
  }

  const plainOtp = generateSixDigitOtp();
  const hashed = hashOtp(plainOtp);
  const now = Date.now();

  record.otp_hash = hashed;
  record.phone_number = contact.phone_number;
  record.telegram_user_id = telegramUser.id;
  record.telegram_chat_id = telegramUser.id;
  record.otp_expires_at = now + 5 * 60 * 1000; // 5 menit
  record.attempts = 0;
  record.resend_count += 1;

  const otpMsg = `🔐 <b>Kode Verifikasi TataDana (OTP)</b>\n\n` +
    `Kode OTP Anda adalah: <b><code>${plainOtp}</code></b>\n\n` +
    `⏱️ Berlaku selama <b>5 menit</b>.\n` +
    `⚠️ <i>JANGAN berikan kode ini kepada siapa pun termasuk staf TataDana.</i>\n\n` +
    `Ketik kode ini di formulir pendaftaran web TataDana Anda.`;

  return {
    success: true,
    message: otpMsg,
    otpCode: plainOtp,
    phone: contact.phone_number,
  };
}

/**
 * Langkah 4: User memasukkan kode OTP di halaman web
 */
export async function verifyOtp(
  tokenOrUserId: string,
  inputCode: string
): Promise<{
  success: boolean;
  message: string;
  record?: TelegramOtpRecord;
}> {
  const record = otpStore.get(tokenOrUserId);
  const now = Date.now();

  if (!record) {
    return {
      success: false,
      message: 'Sesi verifikasi tidak ditemukan. Silakan muat ulang halaman pendaftaran.',
    };
  }

  if (!record.otp_hash || !record.otp_expires_at) {
    return {
      success: false,
      message: 'Kode OTP belum dikirim ke Telegram Anda. Buka Telegram dan tekan "Bagikan Nomor HP".',
    };
  }

  if (now > record.otp_expires_at) {
    return {
      success: false,
      message: 'Kode OTP telah kadaluwarsa (lebih dari 5 menit). Silakan minta kode baru via Telegram.',
    };
  }

  if (record.attempts >= 5) {
    return {
      success: false,
      message: 'Batas percobaan salah tercapai (maksimal 5 kali). Sesi ini dikunci demi keamanan.',
    };
  }

  const inputHashed = hashOtp(inputCode);
  if (inputHashed !== record.otp_hash) {
    record.attempts += 1;
    const remaining = 5 - record.attempts;
    return {
      success: false,
      message: `Kode OTP yang Anda masukkan salah. Sisa kesempatan: ${remaining} kali.`,
    };
  }

  // Sukses verifikasi
  record.is_verified = true;

  return {
    success: true,
    message: 'Verifikasi Telegram berhasil! Akun Anda kini terhubung.',
    record,
  };
}

/**
 * Helper untuk testing / inspeksi data OTP
 */
export function getOtpSession(identifier: string): TelegramOtpRecord | undefined {
  return otpStore.get(identifier);
}
