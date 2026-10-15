import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { format, startDate, endDate, category, wallet, userPlan } = await req.json();

    // 1. Restriction Check: Paket Starter hanya dapat ringkasan, tidak bisa export PDF/Excel
    if (userPlan === 'starter') {
      return NextResponse.json(
        {
          error: 'Paket Starter tidak mendukung export file PDF/Excel. Silakan upgrade ke paket Pro (Rp99.000 Sekali Bayar).',
          code: 'UPGRADE_REQUIRED',
        },
        { status: 403 }
      );
    }

    const type = format === 'pdf' ? 'pdf' : 'xlsx';
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const fileName = `Laporan_Keuangan_TataDana_${startDate || 'periode'}_sd_${endDate || 'aktif'}_${timestamp}.${type}`;

    // Sample generated payload metadata
    const reportData = {
      id: `exp-${Date.now()}`,
      fileName,
      format: type,
      period: `${startDate || 'Semua'} s/d ${endDate || 'Sekarang'}`,
      generatedAt: new Date().toISOString(),
      fileSize: type === 'pdf' ? '245 KB' : '88 KB',
      downloadUrl: `/api/reports/export?format=${type}&download=true&startDate=${startDate || ''}&endDate=${endDate || ''}`,
      summary: {
        totalIncome: 10800000,
        totalExpense: 237500,
        netCashflow: 10562500,
        transactionCount: 5,
      },
    };

    return NextResponse.json({
      success: true,
      message: `Laporan ${type.toUpperCase()} berhasil di-generate.`,
      data: reportData,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal generate laporan' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') || 'csv';
  const userPlan = searchParams.get('userPlan') || 'pro';
  const startDate = searchParams.get('startDate') || '2026-10-01';
  const endDate = searchParams.get('endDate') || '2026-10-31';

  if (userPlan === 'starter') {
    return NextResponse.json(
      { error: 'Paket Starter tidak mendukung unduhan berkas. Upgrade ke Pro.' },
      { status: 403 }
    );
  }

  const timestamp = new Date().toISOString().slice(0, 10);

  if (format === 'pdf') {
    const streamContent = `BT\n/F1 14 Tf\n50 780 Td\n(TATADANA - Laporan Keuangan Periode ${startDate} sd ${endDate}) Tj\n/F1 10 Tf\n50 750 Td\n(Zona Waktu: WIB | Diterbitkan Resmi oleh TataDana Fintech) Tj\n50 720 Td\n(Total Pemasukan: Rp10.800.000  |  Total Pengeluaran: Rp237.500) Tj\n50 700 Td\n(Net Cashflow: +Rp10.562.500  |  Status: Sehat & Terkendali) Tj\nET`;
    const streamLength = streamContent.length;

    const bodyParts = [
      '%PDF-1.4\n',
      '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
      '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
      '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
      '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
      `5 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
    ];

    let offset = 0;
    const offsets: number[] = [0];
    for (let i = 0; i < bodyParts.length; i++) {
      if (i > 0) offsets.push(offset);
      offset += bodyParts[i].length;
    }

    let xref = `xref\n0 6\n0000000000 65535 f \n`;
    for (let i = 1; i <= 5; i++) {
      xref += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
    }

    const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF\n`;
    const content = bodyParts.join('') + xref + trailer;
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Laporan_TataDana_${timestamp}.pdf"`,
      },
    });
  }

  // Default: CSV with UTF-8 BOM
  const csvData = `\uFEFF"No","Tanggal (WIB)","Pos / Kategori","Dompet","Jenis","Nominal","Deskripsi"
"1","2026-10-13 13:15 WIB","Makanan & Minuman","BCA Utama","Pengeluaran",35000,"Nasi Goreng Kambing"
"2","2026-10-13 08:30 WIB","Transportasi","GoPay","Pengeluaran",18000,"Gojek ke Stasiun"
"3","2026-10-12 19:40 WIB","Belanja Kebutuhan","BCA Utama","Pengeluaran",184500,"Struk Indomaret Point"
"4","2026-10-01 09:00 WIB","Gaji Bulanan","BCA Utama","Pemasukan",8500000,"Transfer Gaji Perusahaan"
"5","2026-10-05 15:20 WIB","Freelance & Side Hustle","Mandiri Livin","Pemasukan",2300000,"Project Web Design Client"
"","","TOTAL PEMASUKAN","","Pemasukan",10800000,""
"","","TOTAL PENGELUARAN","","Pengeluaran",237500,""
"","","NET CASHFLOW","","",10562500,""`;

  return new NextResponse(csvData, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="Laporan_TataDana_${timestamp}.csv"`,
    },
  });
}
