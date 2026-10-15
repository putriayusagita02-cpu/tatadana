import { NextRequest, NextResponse } from 'next/server';
import {
  testTelegramBotConnection,
  registerTelegramWebhook,
  getTelegramWebhookInfo,
} from '@/lib/telegram-bot';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const botTokenInput = body?.botToken || process.env.TELEGRAM_BOT_TOKEN;
    const { webhookBaseUrl } = body || {};

    if (!botTokenInput || typeof botTokenInput !== 'string') {
      return NextResponse.json(
        { ok: false, message: 'Bot Token wajib diisi atau dikonfigurasi di TELEGRAM_BOT_TOKEN.' },
        { status: 400 }
      );
    }

    const cleanToken = botTokenInput.trim();

    // 1. Validasi format token dasar (jika bukan mock token)
    if (cleanToken !== 'your-telegram-bot-token' && !/^\d{8,12}:[A-Za-z0-9_-]{35}$/.test(cleanToken)) {
      return NextResponse.json({
        ok: false,
        message: 'Format token tidak valid. Pastikan token disalin lengkap dari @BotFather.',
      });
    }

    // 2. Test Koneksi memanggil Telegram API: getMe (Part 5 Langkah 3)
    const testResult = await testTelegramBotConnection(cleanToken);
    if (!testResult.ok || !testResult.botInfo) {
      return NextResponse.json({
        ok: false,
        status: 'disconnected',
        message: `Koneksi gagal: ${testResult.errorMessage || 'Token Telegram salah atau bot dinonaktifkan.'}`,
      });
    }

    // 3. Pasang Webhook otomatis dengan Secret Token (Part 5.1)
    const baseUrl = webhookBaseUrl || process.env.WEBHOOK_BASE_URL || 'https://tatadana.vercel.app';
    const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET || 'tatadana_webhook_secret_key';
    const webhookResult = await registerTelegramWebhook(cleanToken, baseUrl, secretToken);

    // 4. Ambil Webhook Info aktual dari Telegram API (Part 5.1)
    const infoResult = await getTelegramWebhookInfo(cleanToken);

    return NextResponse.json({
      ok: true,
      status: 'connected',
      botInfo: testResult.botInfo,
      webhookRegistered: webhookResult.ok,
      webhookUrl: `${baseUrl}/api/telegram/webhook`,
      webhookInfo: infoResult.webhookInfo || {
        url: `${baseUrl}/api/telegram/webhook`,
        has_custom_certificate: false,
        pending_update_count: 0,
      },
      message: `Berhasil terhubung dengan bot @${testResult.botInfo.username}! Webhook aktif dengan Secret Token.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error.message || 'Terjadi kesalahan sistem saat menghubungkan bot.' },
      { status: 500 }
    );
  }
}
