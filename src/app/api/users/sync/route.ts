import { NextRequest, NextResponse } from 'next/server';
import { getSharedUsers, saveSharedUser } from '@/lib/user-store';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const incomingUsers = body.users || [];

    if (Array.isArray(incomingUsers)) {
      for (const u of incomingUsers) {
        saveSharedUser(u);
      }
    }

    return NextResponse.json({ ok: true, users: getSharedUsers() });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
