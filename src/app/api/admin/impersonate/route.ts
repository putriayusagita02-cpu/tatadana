import { NextRequest, NextResponse } from 'next/server';

let auditLogs = [
  {
    id: 'log-01',
    adminEmail: 'superadmin@tatadana.id',
    action: 'impersonate_login',
    targetUserEmail: 'rian@example.com',
    targetUserName: 'Rian Pratama',
    ipAddress: '180.252.110.4',
    timestamp: '2026-10-13 14:15:20 WIB',
    details: 'Membuka dashboard user untuk troubleshoot transaksi Telegram',
  },
];

export async function GET() {
  return NextResponse.json({ success: true, logs: auditLogs });
}

export async function POST(req: NextRequest) {
  try {
    const { targetUserId, targetUserEmail, targetUserName, adminEmail } = await req.json();

    const newLog = {
      id: `log-${Date.now()}`,
      adminEmail: adminEmail || 'superadmin@tatadana.id',
      action: 'impersonate_login',
      targetUserEmail,
      targetUserName,
      ipAddress: '127.0.0.1 (Localhost)',
      timestamp: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB',
      details: 'Admin masuk ke akun user melalui fitur impersonation',
    };

    auditLogs.unshift(newLog);

    return NextResponse.json({
      success: true,
      message: `Impersonation berhasil. Anda sekarang melihat antarmuka sebagai ${targetUserName}.`,
      impersonatedUser: {
        id: targetUserId,
        email: targetUserEmail,
        name: targetUserName,
      },
      auditLog: newLog,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal melakukan impersonation' }, { status: 500 });
  }
}
