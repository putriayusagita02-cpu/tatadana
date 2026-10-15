import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { updateSharedUserStatus } from '@/lib/user-store';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = body.userId || body.email || body.id;
    if (!identifier) {
      return NextResponse.json({ ok: false, message: 'userId atau email wajib disertakan.' }, { status: 400 });
    }

    const updated = updateSharedUserStatus(identifier, 'approved');

    if (supabaseAdmin) {
      try {
        await supabaseAdmin
          .from('profiles')
          .update({
            status: 'approved',
            approved_at: new Date().toISOString(),
          })
          .or(`id.eq.${identifier},email.eq.${identifier}`);
      } catch (e) {
        console.warn('Supabase update status fallback:', e);
      }
    }

    return NextResponse.json({
      ok: true,
      message: 'Akun berhasil disetujui.',
      user: updated,
      status: 'approved',
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
