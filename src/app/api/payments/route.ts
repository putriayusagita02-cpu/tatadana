import { NextRequest, NextResponse } from 'next/server';

let paymentOrders = [
  {
    orderId: 'TRX-PRO-20261013-001',
    userName: 'Rian Pratama',
    userEmail: 'rian@example.com',
    plan: 'pro',
    amount: 99000,
    paymentMethod: 'manual_transfer',
    proofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
    status: 'pending',
    createdAt: '2026-10-13 13:45 WIB',
  },
  {
    orderId: 'TRX-PRO-20261013-002',
    userName: 'Siti Aminah',
    userEmail: 'siti@example.com',
    plan: 'pro',
    amount: 99000,
    paymentMethod: 'midtrans_qris',
    proofUrl: null,
    status: 'approved',
    createdAt: '2026-10-13 11:20 WIB',
  },
];

export async function GET() {
  return NextResponse.json({ success: true, orders: paymentOrders });
}

export async function POST(req: NextRequest) {
  try {
    const { action, orderId, adminNotes } = await req.json();

    const order = paymentOrders.find(o => o.orderId === orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 });
    }

    if (action === 'approve') {
      order.status = 'approved';
      return NextResponse.json({
        success: true,
        message: `Pembayaran ${orderId} berhasil di-approve! User otomatis menjadi Pro.`,
        order,
      });
    } else if (action === 'reject') {
      order.status = 'rejected';
      return NextResponse.json({
        success: true,
        message: `Pembayaran ${orderId} ditolak. Catatan: ${adminNotes || 'Bukti transfer tidak valid'}`,
        order,
      });
    }

    return NextResponse.json({ error: 'Aksi tidak valid' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal memproses pembayaran' }, { status: 500 });
  }
}
