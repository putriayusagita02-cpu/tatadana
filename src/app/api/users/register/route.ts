import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { saveSharedUser } from '@/lib/user-store';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const userData = raw.user || raw;

    const newUser = saveSharedUser(userData);

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('profiles').insert({
          id: newUser.id,
          full_name: newUser.name,
          email: newUser.email,
          phone_number: newUser.phone,
          status: 'pending',
          subscription_plan: 'starter',
        });
      } catch (e) {
        console.warn('Supabase register profile insert fallback:', e);
      }
    }

    return NextResponse.json({ ok: true, user: newUser });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
