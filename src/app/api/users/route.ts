import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// In-memory fallback
let memoryUsers: any[] = [
  {
    id: 'usr-001',
    name: 'Dimas Kurniawan',
    email: 'dimas@tatadana.id',
    phone: '081234567890',
    plan: 'pro',
    status: 'approved',
    joinedAt: '01 Okt 2026',
    isSuperadmin: false,
    approvalStatus: 'approved',
  },
  {
    id: 'usr-admin-01',
    name: 'Putri Ayu Sagita',
    email: 'putriayusagita02@gmail.com',
    phone: '081299990001',
    plan: 'pro',
    status: 'approved',
    joinedAt: '01 Okt 2026',
    isSuperadmin: true,
    approvalStatus: 'approved',
  },
];

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
          isSuperadmin: p.role === 'superadmin' || p.is_superadmin || p.email === 'putriayusagita02@gmail.com',
        }));
        return NextResponse.json({ ok: true, users: mapped });
      }
    }
  } catch (e) {
    // Fallback to memoryUsers
  }

  return NextResponse.json({ ok: true, users: memoryUsers });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone } = body;

    const newUser = {
      id: `usr-${Date.now()}`,
      name: name || 'Pengguna Baru',
      email: (email || '').toLowerCase(),
      phone: phone || '',
      plan: 'starter',
      status: 'pending',
      approvalStatus: 'pending',
      joinedAt: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      isSuperadmin: false,
    };

    memoryUsers.unshift(newUser);

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
        console.warn('Supabase profile insert fallback:', e);
      }
    }

    return NextResponse.json({ ok: true, user: newUser });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
