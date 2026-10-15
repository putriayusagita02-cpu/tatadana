import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram-bot';

export async function POST(req: NextRequest) {
  try {
    const { userId, userEmail, userName, telegramChatId, status, rejectionReason } = await req.json();

    const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    const chatId = telegramChatId || 128491029; // default / fallback telegram chat ID

    let message = '';
    if (status === 'approved') {
      message =
        `🎉 <b>Selamat, Akun TataDana Anda Disetujui!</b>\n\n` +
        `Halo <b>${userName || 'Pengguna TataDana'}</b>, pendaftaran akun Anda telah diverifikasi dan disetujui oleh Superadmin.\n\n` +
        `Mulai sekarang, Anda dapat langsung mencatat pemasukan, pengeluaran, transfer dompet, serta pantau TataJatah harian langsung dari chat Telegram ini.\n\n` +
        `Ketik <code>/start</code> atau <code>/bantuan</code> untuk panduan lengkap.`;
    } else if (status === 'rejected') {
      message =
        `❌ <b>Pendaftaran Akun TataDana Ditolak</b>\n\n` +
        `Mohon maaf <b>${userName || 'Pengguna'}</b>, permohonan pendaftaran akun TataDana Anda tidak dapat kami setujui.\n\n` +
        `<b>Alasan Penolakan:</b>\n<i>${rejectionReason || 'Data verifikasi tidak memenuhi standar keamanan fintech'}</i>\n\n` +
        `Silakan periksa kembali data Anda atau hubungi dukungan admin jika ada pertanyaan.`;
    }

    if (botToken && chatId) {
      await sendTelegramMessage(botToken, chatId, message);
    }

    return NextResponse.json({
      success: true,
      deliveredToChatId: chatId,
      status,
      message: `Notifikasi Telegram berhasil dikirim ke ${userName || userEmail}.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Gagal mengirim notifikasi status user' },
      { status: 500 }
    );
  }
}
