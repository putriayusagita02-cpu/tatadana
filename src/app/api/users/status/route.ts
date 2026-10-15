import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSharedUsers } from '@/lib/user-store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = (searchParams.get('id') || searchParams.get('userId') || searchParams.get('email') || '').toLowerCase().trim();

    if (!id) {
      return NextResponse.json({ ok: true, found: false, approvalStatus: 'pending' });
    }

    // 1. Check Supabase profiles table
    if (supabaseAdmin) {
      try {
        const { data } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .or(`id.eq.${id},email.eq.${id}`)
          .maybeSingle();

        if (data) {
          return NextResponse.json({
            ok: true,
            found: true,
            approvalStatus: data.status || 'pending',
            user: data,
          });
        }
      } catch (e) {
        // Fallback
      }
    }

    // 2. Check Shared in-memory users
    const users = getSharedUsers();
    const found = users.find(u => u.id === id || (u.email && u.email.toLowerCase() === id));

    if (found) {
      return NextResponse.json({
        ok: true,
        found: true,
        approvalStatus: found.approvalStatus || found.status || 'pending',
        user: found,
      });
    }

    return NextResponse.json({ ok: true, found: false, approvalStatus: 'pending' });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
