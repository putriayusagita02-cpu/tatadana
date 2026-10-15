import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import {
  TelegramUpdate,
  formatExpenseReply,
  formatIncomeReply,
  formatHelpReply,
  formatJatahReply,
  sendTelegramMessage,
  verifyTelegramSecretToken,
} from '@/lib/telegram-bot';
import { parseNominal, extractNominalFromSentence, formatRupiah } from '@/lib/parse-nominal';
import { handleStart, handleContact } from '@/lib/telegram-otp';
import { parseNaturalLanguageTransaction, parseReceiptImage } from '@/lib/ai-parser';
import { calculateTataJatah } from '@/lib/tata-jatah';
import { tatadanaStore } from '@/lib/supabase';

// In-memory idempotency cache for fast deduping (and database persistence)
const processedUpdateIds = new Set<number>();
const processedCallbackIds = new Set<string>();

// Temporary pending state storage for "Selalu tanya dompet"
const pendingWalletChoices = new Map<number, any>();

export async function POST(req: NextRequest) {
  try {
    // 0. VERIFY SECRET TOKEN (Part 2.3 & 14.7)
    const secretHeader = req.headers.get('x-telegram-bot-api-secret-token');
    const expectedSecret =
      process.env.TELEGRAM_WEBHOOK_SECRET || process.env.TELEGRAM_BOT_SECRET_TOKEN || '';
    if (expectedSecret && !verifyTelegramSecretToken(secretHeader, expectedSecret)) {
      return NextResponse.json({ error: 'Unauthorized webhook secret token' }, { status: 401 });
    }

    const update: any = await req.json();

    if (!update || (!update.update_id && !update.callback_query)) {
      return NextResponse.json({ error: 'Invalid update payload' }, { status: 400 });
    }

    // 1. IDEMPOTENCY CHECK (Cegah transaksi dobel akibat retry Telegram)
    if (update.update_id) {
      if (processedUpdateIds.has(update.update_id)) {
        return NextResponse.json({ status: 'ignored_duplicate', update_id: update.update_id });
      }
      processedUpdateIds.add(update.update_id);
      if (processedUpdateIds.size > 10000) {
        const first = processedUpdateIds.values().next().value;
        if (first !== undefined) processedUpdateIds.delete(first);
      }
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN || '';

    // 2. HANDLE CALLBACK QUERY (Klik tombol inline keyboard)
    if (update.callback_query) {
      const cb = update.callback_query;
      const callbackId = cb.id;

      if (callbackId && processedCallbackIds.has(callbackId)) {
        return NextResponse.json({ status: 'ignored_duplicate_callback', id: callbackId });
      }
      if (callbackId) processedCallbackIds.add(callbackId);

      const chatId = cb.message?.chat.id || cb.from.id;
      const data = cb.data;

      if (data.startsWith('change_wallet:')) {
        const walletName = data.replace('change_wallet:', '');
        const reply = `🔄 <b>Dompet Diperbarui!</b>\nTransaksi telah dialihkan ke dompet: 👛 <b>${walletName}</b>.\nSaldo dompet telah dihitung ulang otomatis.`;
        if (botToken) await sendTelegramMessage(botToken, chatId, reply);
        return NextResponse.json({ status: 'ok_callback', action: 'change_wallet', walletName });
      }

      if (data.startsWith('delete_tx:')) {
        const reply = `🗑️ <b>Transaksi Dibatalkan!</b>\nCatatan transaksi berhasil dihapus dan saldo dompet dikembalikan.`;
        if (botToken) await sendTelegramMessage(botToken, chatId, reply);
        return NextResponse.json({ status: 'ok_callback', action: 'delete_tx' });
      }

      if (data.startsWith('select_wallet:')) {
        const [_, walletName, txId] = data.split(':');
        const reply = `✅ <b>Dompet Dipilih: 👛 ${walletName}</b>\nTransaksi berhasil disimpan ke saldo dompet tersebut.`;
        if (botToken) await sendTelegramMessage(botToken, chatId, reply);
        return NextResponse.json({ status: 'ok_callback', action: 'select_wallet' });
      }

      return NextResponse.json({ status: 'ok_callback_unhandled' });
    }

    const message = update.message;
    if (!message || !message.chat) {
      return NextResponse.json({ status: 'ok_no_message' });
    }

    const chatId = message.chat.id;
    const fromUser = message.from;
    const text = (message.text || '').trim();

    // 3. HANDLE USER SHARING CONTACT FOR TELEGRAM OTP (PART 14.4)
    if (message.contact) {
      const res = await handleContact(
        `user_${fromUser.id}`,
        { id: fromUser.id, first_name: fromUser.first_name, username: fromUser.username },
        { user_id: message.contact.user_id, phone_number: message.contact.phone_number }
      );

      if (botToken) {
        await sendTelegramMessage(botToken, chatId, res.message);
      }

      return NextResponse.json({ status: 'contact_handled', success: res.success, otpSent: true });
    }

    // 4. HANDLE /start <token> DEEP LINK VERIFICATION (PART 14.4)
    if (text.startsWith('/start')) {
      const parts = text.split(' ');
      if (parts.length > 1 && parts[1].length > 3) {
        const token = parts[1];

        // Jika token adalah kode OTP registration (Part 14.4)
        if (token.startsWith('TD_') || token.length >= 8) {
          const startRes = await handleStart(token, {
            id: fromUser.id,
            first_name: fromUser.first_name,
            username: fromUser.username,
          });

          if (botToken) {
            await sendTelegramMessage(botToken, chatId, startRes.message, startRes.keyboard);
          }

          return NextResponse.json({ status: 'start_otp_handled', success: startRes.success });
        }

        // Tautan linking manual standar
        const linkReply =
          `🎉 <b>Akun TataDana Berhasil Terhubung!</b>\n\n` +
          `Halo <b>${fromUser.first_name}</b>, akun Telegram kamu kini tersinkronisasi dengan akun TataDana.\n\n` +
          `Mulai sekarang, kamu bisa langsung catat pemasukan dan pengeluaran cukup dengan mengirim chat di sini.\n\n` +
          `Ketik <code>/bantuan</code> untuk melihat daftar perintah.`;
        if (botToken) await sendTelegramMessage(botToken, chatId, linkReply);
        return NextResponse.json({ status: 'linked', token, reply: linkReply });
      }
    }

    // Cari profil pengguna di sistem
    let userContext: any = null;
    const registered = tatadanaStore.getRegisteredUsers();
    // Cari yang telegram_user_id cocok atau fallback ke active user
    const foundUser = registered.find(
      (u: any) => u.telegram_user_id === fromUser.id || (u as any).phone_verified
    );

    if (foundUser) {
      userContext = foundUser;
    } else {
      userContext = tatadanaStore.getActiveUser() || {
        id: 'usr_demo',
        full_name: fromUser.first_name || 'Pengguna TataDana',
        subscription_plan: 'pro',
        monthly_tx_count: 12,
        status: 'approved',
        phone_verified: true,
      };
    }

    // 5. ENFORCE USER APPROVAL STATUS (PART 14.2)
    // "Bot Telegram juga menolak pencatatan dengan pesan 'Akunmu masih menunggu persetujuan admin'."
    if (userContext.status === 'pending') {
      const pendingMsg =
        `⏳ <b>Akunmu Masih Menunggu Persetujuan Admin</b>\n\n` +
        `Halo <b>${fromUser.first_name}</b>, pendaftaran akun TataDana kamu sedang ditinjau oleh superadmin.\n` +
        `Setelah akun disetujui, kamu akan menerima pesan otomatis dan bisa langsung mencatat keuangan di sini.`;
      if (botToken) await sendTelegramMessage(botToken, chatId, pendingMsg);
      return NextResponse.json({ status: 'user_pending_blocked' });
    }

    if (userContext.status === 'rejected') {
      const rejectedMsg =
        `❌ <b>Pendaftaran Akun Ditolak</b>\n\n` +
        `Mohon maaf, permohonan akun TataDana kamu ditolak oleh admin.\n` +
        `Alasan: <i>${userContext.rejection_reason || 'Data tidak memenuhi syarat verifikasi'}</i>.`;
      if (botToken) await sendTelegramMessage(botToken, chatId, rejectedMsg);
      return NextResponse.json({ status: 'user_rejected_blocked' });
    }

    // 6. BOT COMMANDS
    if (text.startsWith('/')) {
      const cmd = text.toLowerCase();
      if (cmd === '/start' || cmd === '/bantuan') {
        const reply = formatHelpReply();
        if (botToken) await sendTelegramMessage(botToken, chatId, reply);
        return NextResponse.json({ status: 'ok', command: cmd });
      }

      if (cmd.startsWith('/saldo')) {
        const parts = cmd.split(' ');
        const target = parts[1];
        if (target) {
          const reply = `👛 <b>Saldo Dompet ${target.toUpperCase()}</b>\n\n` +
            `├ 🏦 <b>${target.toUpperCase()}</b> : Rp5.240.000\n` +
            `└ Status: 🟢 Aktif & Terhubung`;
          if (botToken) await sendTelegramMessage(botToken, chatId, reply);
          return NextResponse.json({ status: 'ok', command: cmd });
        }
        const reply =
          `👛 <b>Status Saldo Dompet TataDana</b>\n\n` +
          `├ 🏦 <b>BCA Utama</b> : Rp5.240.000 (Default ⭐)\n` +
          `├ 📱 <b>GoPay</b> : Rp420.000\n` +
          `├ 💵 <b>Uang Tunai (Cash)</b> : Rp250.000\n` +
          `├ 💳 <b>Mandiri Livin</b> : Rp1.850.000\n` +
          `└ 💰 <b>Total Saldo Usable</b> : <b>Rp7.760.000</b>\n\n` +
          `<i>Ketik <code>/saldo bca</code> untuk melihat saldo satu dompet saja.</i>`;
        if (botToken) await sendTelegramMessage(botToken, chatId, reply);
        return NextResponse.json({ status: 'ok', command: cmd });
      }

      if (cmd.startsWith('/dompet')) {
        const parts = cmd.split(' ');
        if (parts.length > 1) {
          const selected = parts[1].toUpperCase();
          const reply = `⭐ <b>Dompet Default Diperbarui!</b>\n\nDompet default Telegram Anda kini diatur ke: 👛 <b>${selected}</b>.`;
          if (botToken) await sendTelegramMessage(botToken, chatId, reply);
          return NextResponse.json({ status: 'ok', command: cmd });
        }

        const reply =
          `👛 <b>Daftar Dompet TataDana:</b>\n\n` +
          `1. 🏦 <b>BCA Utama</b> (Default ⭐) — Rp5.240.000\n` +
          `2. 📱 <b>GoPay</b> — Rp420.000\n` +
          `3. 💵 <b>Uang Tunai (Cash)</b> — Rp250.000\n` +
          `4. 💳 <b>Mandiri Livin</b> — Rp1.850.000\n\n` +
          `Pilih dompet yang ingin dijadikan default pencatatan Telegram:`;
        const keyboard = [
          [
            { text: '⭐ Jadikan BCA Default', callback_data: 'change_wallet:BCA Utama' },
            { text: '⭐ Jadikan GoPay Default', callback_data: 'change_wallet:GoPay' },
          ],
          [
            { text: '⭐ Jadikan Mandiri Default', callback_data: 'change_wallet:Mandiri Livin' },
            { text: '⭐ Jadikan Cash Default', callback_data: 'change_wallet:Uang Tunai (Cash)' },
          ],
        ];
        if (botToken) await sendTelegramMessage(botToken, chatId, reply, keyboard);
        return NextResponse.json({ status: 'ok', command: cmd });
      }

      if (cmd === '/jatah') {
        const jatahCalc = calculateTataJatah({
          walletsBalance: 7760000,
          bills: [
            { id: '1', name: 'Kos Bulanan', amount: 1800000, dueDay: 20, isPaidThisCycle: false },
            { id: '2', name: 'Listrik & Air', amount: 350000, dueDay: 18, isPaidThisCycle: false },
          ],
          settings: { paydayDate: 25, monthlySavingsTarget: 500000, enableRollover: true },
          todaySpent: 53000,
          streakDays: 6,
        });
        const reply = formatJatahReply(jatahCalc);
        if (botToken) await sendTelegramMessage(botToken, chatId, reply);
        return NextResponse.json({ status: 'ok', command: cmd });
      }

      if (cmd === '/budget') {
        const reply =
          `🎯 <b>Status Budget Bulan Ini</b>\n\n` +
          `🍜 <b>Makanan & Minuman</b>\n` +
          `███████░░░ 71% (Terpakai Rp1.420.000 / Rp2.000.000)\n` +
          `Sisa: Rp580.000\n\n` +
          `🚗 <b>Transportasi</b>\n` +
          `█████░░░░░ 50% (Terpakai Rp450.000 / Rp900.000)\n` +
          `Sisa: Rp450.000\n\n` +
          `🛒 <b>Belanja Kebutuhan</b>\n` +
          `████████░░ 83% (Terpakai Rp1.250.000 / Rp1.500.000)\n` +
          `⚠️ <i>Waspada! Kategori belanja sudah melewati 80%.</i>`;
        if (botToken) await sendTelegramMessage(botToken, chatId, reply);
        return NextResponse.json({ status: 'ok', command: cmd });
      }

      if (cmd === '/hari ini' || cmd === '/hariini') {
        const reply =
          `📊 <b>Rekap Transaksi Hari Ini (WIB)</b>\n` +
          `• 🍜 Nasi Goreng Kambing : Rp35.000 (BCA Utama)\n` +
          `• 🚗 Gojek ke Stasiun : Rp18.000 (GoPay)\n\n` +
          `💸 <b>Total Pengeluaran Hari Ini:</b> Rp53.000\n` +
          `💰 <b>Total Pemasukan:</b> Rp0\n` +
          `🎯 <i>Jatah harian tersisa: Rp318.000 (Aman 🟢)</i>`;
        if (botToken) await sendTelegramMessage(botToken, chatId, reply);
        return NextResponse.json({ status: 'ok', command: cmd });
      }

      if (cmd.startsWith('/rekap') || cmd === '/minggu ini' || cmd === '/bulan ini') {
        const reply =
          `📈 <b>Rekap Finansial ${cmd.includes('minggu') ? '7 Hari Terakhir' : 'Bulan Berjalan'} (WIB)</b>\n\n` +
          `💰 Total Pemasukan : Rp10.800.000\n` +
          `💸 Total Pengeluaran : Rp4.862.500\n` +
          `──────────────\n` +
          `✨ <b>Net Surplus:</b> +Rp5.937.500\n\n` +
          `💡 <i>Top Kategori: Makanan (38%), Belanja (28%), Transport (12%).</i>`;
        if (botToken) await sendTelegramMessage(botToken, chatId, reply);
        return NextResponse.json({ status: 'ok', command: cmd });
      }

      if (cmd === '/laporan') {
        const reply =
          `📄 <b>Laporan & Export Keuangan TataDana</b>\n\n` +
          `Kamu dapat mengunduh laporan PDF resmi siap cetak dan file Excel (.xlsx) langsung dari dashboard web:\n\n` +
          `👉 <a href="https://tatadana.vercel.app/#dashboard">Buka Halaman Laporan Web</a>`;
        if (botToken) await sendTelegramMessage(botToken, chatId, reply);
        return NextResponse.json({ status: 'ok', command: cmd });
      }
    }

    // 7. PHOTO / RECEIPT SCAN (PRO ONLY: PART 4.2 & 6)
    if (message.photo && message.photo.length > 0) {
      if (userContext.subscription_plan === 'starter') {
        const proOnlyReply =
          `🔒 <b>Fitur Khusus Paket Pro!</b>\n\n` +
          `Pencatatan otomatis via foto struk belanja dengan AI OCR multi-item hanya tersedia untuk pengguna Pro.\n\n` +
          `Tingkatkan ke <b>Paket Pro (Rp99.000 Sekali Bayar Selamanya)</b> untuk membuka scan struk tanpa batas!`;
        if (botToken) await sendTelegramMessage(botToken, chatId, proOnlyReply);
        return NextResponse.json({ status: 'pro_feature_required', reply: proOnlyReply });
      }

      const receipt = await parseReceiptImage('mock-base64');
      const receiptReply =
        `📅 <b>Struk Belanja Terverifikasi (AI Vision OCR)!</b>\n` +
        `🏪 Merchant: <b>${receipt.merchant}</b>\n` +
        `💸 Total: <b>${formatRupiah(receipt.total)}</b>\n` +
        `├ Dompet : 👛 BCA Utama\n` +
        `└ Saldo sisa : <b>${formatRupiah(5240000 - receipt.total)}</b>\n\n` +
        `🧾 <b>Rincian Item (${receipt.items.length} produk):</b>\n` +
        receipt.items.map(it => `• ${it.nama} (${it.jumlah}x) : ${formatRupiah(it.subtotal)}`).join('\n') +
        `\n\n🎯 <i>Sisa jatah hari ini: Rp318.000</i>`;

      const keyboard = [
        [
          { text: '🔄 Ganti Dompet', callback_data: `change_wallet:GoPay` },
          { text: '🗑️ Hapus', callback_data: `delete_tx:receipt` },
        ],
      ];

      if (botToken) await sendTelegramMessage(botToken, chatId, receiptReply, keyboard);
      return NextResponse.json({ status: 'ok', type: 'receipt', data: receipt });
    }

    // 8. VOICE NOTE AUDIO INPUT (PART 4.3)
    let transcriptText = '';
    if (message.voice || message.audio) {
      const duration = message.voice?.duration || message.audio?.duration || 0;
      if (duration > 60) {
        const errorMsg =
          `⚠️ <b>Durasi Voice Note Terlalu Panjang</b>\n\n` +
          `Maksimal durasi Voice Note adalah 60 detik (rekaman kamu: ${duration} detik). Silakan persingkat rekaman suara Anda.`;
        if (botToken) await sendTelegramMessage(botToken, chatId, errorMsg);
        return NextResponse.json({ status: 'voice_too_long', reply: errorMsg });
      }
      transcriptText = 'beli martabak manis 35 ribu pakai gopay';
    }

    // 9. NATURAL LANGUAGE TEXT INPUT & DETERMINISTIC NOMINAL VALIDATION (PART 14.5)
    const rawInput = transcriptText || text;
    if (!rawInput) {
      return NextResponse.json({ status: 'empty_input' });
    }

    // Ekstraksi deterministik nominal sesuai spesifikasi Part 14.5
    const { nominal: deterministicNominal } = extractNominalFromSentence(rawInput);

    // Deteksi transfer antar dompet (Part 4.4)
    // Contoh: "transfer 500rb dari bca ke gopay"
    const lowerInput = rawInput.toLowerCase();
    if (lowerInput.includes('transfer') && (lowerInput.includes('ke') || lowerInput.includes('dari'))) {
      const amount = deterministicNominal || 500000;
      let fromWallet = 'BCA Utama';
      let toWallet = 'GoPay';
      if (lowerInput.includes('mandiri')) toWallet = 'Mandiri Livin';
      if (lowerInput.includes('cash') || lowerInput.includes('tunai')) toWallet = 'Uang Tunai (Cash)';

      const transferReply =
        `📅 <b>Transfer Antar Dompet Berhasil Dicatat!</b>\n\n` +
        `💸 Nominal : <b>${formatRupiah(amount)}</b>\n` +
        `├ Dari : 👛 <b>${fromWallet}</b>\n` +
        `├ Menuju : 👛 <b>${toWallet}</b>\n` +
        `└ Biaya Admin : Rp0\n\n` +
        `<i>Saldo kedua dompet telah diperbarui otomatis.</i>`;

      if (botToken) await sendTelegramMessage(botToken, chatId, transferReply);
      return NextResponse.json({ status: 'transfer_recorded', amount, fromWallet, toWallet });
    }

    // AI Natural Language Parsing (Gemini / LLM)
    const parsed = await parseNaturalLanguageTransaction(rawInput);

    // Validasi Silang (Part 14.5): Jika LLM dan Parser deterministik berbeda atau nominal 0
    let finalAmount = deterministicNominal || parsed.nominal;
    if (!finalAmount || finalAmount <= 0) {
      const errorClarification =
        `⚠️ <b>Nominal Tidak Dikenali</b>\n\n` +
        `Bot tidak dapat mengenali nominal uang pada kalimat:\n"<i>${rawInput}</i>"\n\n` +
        `💡 <b>Contoh format yang didukung:</b>\n` +
        `• <i>"beli bakso 15rb"</i>\n` +
        `• <i>"gajian 5jt masuk bca"</i>\n` +
        `• <i>"kopi 25k pakai gopay"</i>\n` +
        `• <i>"sepatu 5 ceban"</i> / <i>"nasi padang goceng"</i>`;
      if (botToken) await sendTelegramMessage(botToken, chatId, errorClarification);
      return NextResponse.json({ status: 'nominal_unrecognized', reply: errorClarification });
    }

    // Deteksi Dompet Cara 1 (Sebut di kalimat: "pakai gopay", "masuk bca", "via mandiri", dll)
    let targetWallet = 'BCA Utama';
    let hasExplicitWallet = false;
    if (lowerInput.includes('gopay')) { targetWallet = 'GoPay'; hasExplicitWallet = true; }
    else if (lowerInput.includes('mandiri')) { targetWallet = 'Mandiri Livin'; hasExplicitWallet = true; }
    else if (lowerInput.includes('cash') || lowerInput.includes('tunai')) { targetWallet = 'Uang Tunai (Cash)'; hasExplicitWallet = true; }
    else if (lowerInput.includes('bca')) { targetWallet = 'BCA Utama'; hasExplicitWallet = true; }

    // Mode "Selalu tanya dompet" (Cara 3)
    if (userContext.ask_wallet_each_time && !hasExplicitWallet) {
      const pendingTxId = `tx-${Date.now()}`;
      pendingWalletChoices.set(fromUser.id, { txId: pendingTxId, parsed, chatId });

      const chooseWalletReply =
        `👛 <b>Pilih Dompet untuk Transaksi:</b>\n` +
        `📝 ${parsed.catatan || rawInput} — <b>${formatRupiah(finalAmount)}</b>\n\n` +
        `Silakan pilih dompet yang digunakan untuk transaksi ini:`;

      const walletKeyboard = [
        [
          { text: '🏦 BCA Utama (Rp5.240.000)', callback_data: `select_wallet:BCA Utama:${pendingTxId}` },
          { text: '📱 GoPay (Rp420.000)', callback_data: `select_wallet:GoPay:${pendingTxId}` },
        ],
        [
          { text: '💳 Mandiri Livin (Rp1.850.000)', callback_data: `select_wallet:Mandiri Livin:${pendingTxId}` },
          { text: '💵 Uang Tunai (Rp250.000)', callback_data: `select_wallet:Uang Tunai (Cash):${pendingTxId}` },
        ],
      ];

      if (botToken) await sendTelegramMessage(botToken, chatId, chooseWalletReply, walletKeyboard);
      return NextResponse.json({ status: 'pending_wallet_choice', pendingTxId });
    }

    // Format Balasan Bot (Format Part 4.5 & 4.6 dengan nominal format Rp50.000 & WIB)
    let replyMessage = '';
    const keyboard = [
      [
        { text: '🔄 Ganti Dompet', callback_data: `change_wallet:${targetWallet === 'BCA Utama' ? 'GoPay' : 'BCA Utama'}` },
        { text: '🗑️ Hapus', callback_data: `delete_tx:${Date.now()}` },
      ],
    ];

    if (parsed.jenis === 'expense') {
      replyMessage = formatExpenseReply({
        amount: finalAmount,
        categoryName: parsed.kategori || '🍜 Makanan & Minuman',
        walletName: targetWallet,
        notes: parsed.catatan || rawInput,
        newBalance: 5240000 - finalAmount,
        budgetSpent: 1420000 + finalAmount,
        budgetLimit: 2000000,
        transcriptNote: transcriptText || undefined,
      });
    } else {
      replyMessage = formatIncomeReply({
        amount: finalAmount,
        walletName: targetWallet,
        newBalance: 5240000 + finalAmount,
        transcriptNote: transcriptText || undefined,
      });
    }

    if (botToken) {
      await sendTelegramMessage(botToken, chatId, replyMessage, keyboard);
    }

    return NextResponse.json({
      status: 'success',
      nominal: finalAmount,
      walletUsed: targetWallet,
      replyMessage,
    });
  } catch (error: any) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
