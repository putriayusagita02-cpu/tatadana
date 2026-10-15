import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { userId, reason } = await req.json();
    if (!userId) {
      return NextResponse.json({ ok: false, message: 'userId wajib disertakan.' }, { status: 400 });
    }

    if (supabaseAdmin) {
      try {
        await supabaseAdmin
          .from('profiles')
          .update({
            status: 'rejected',
            rejection_reason: reason || 'Ditolak oleh Superadmin',
          })
          .eq('id', userId);
      } catch (e) {
        console.warn('Supabase reject status fallback:', e);
      }
    }

    return NextResponse.json({ ok: true, message: 'Akun ditolak.', userId, status: 'rejected' });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
