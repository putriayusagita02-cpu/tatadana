import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSharedUsers, saveSharedUser } from '@/lib/user-store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped = data.map((p: any) => ({
          id: p.id,
          name: p.full_name || p.name || 'Pengguna',
          email: p.email,
          phone: p.phone_number || p.phone || '',
          plan: p.subscription_plan || 'starter',
          status: p.status || 'pending',
          approvalStatus: p.status || 'pending',
          rejectionReason: p.rejection_reason || '',
          joinedAt: p.created_at || 'Hari ini',
          registeredAt: p.created_at || 'Hari ini',
          isSuperadmin: p.role === 'superadmin' || p.is_superadmin || p.email === 'putriayusagita02@gmail.com',
        }));
        return NextResponse.json({ ok: true, users: mapped });
      }
    }
  } catch (e) {
    // Fallback to shared in-memory users
  }

  return NextResponse.json({ ok: true, users: getSharedUsers() });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newUser = saveSharedUser(body);

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from('profiles').insert({
          id: newUser.id,
          full_name: newUser.name,
          email: newUser.email,
          phone_number: newUser.phone,
          status: newUser.status || 'pending',
          subscription_plan: newUser.plan || 'starter',
        });
      } catch (e) {
        console.warn('Supabase profile insert fallback:', e);
      }
    }

    return NextResponse.json({ ok: true, user: newUser });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
