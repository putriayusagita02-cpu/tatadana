import { NextRequest, NextResponse } from 'next/server';
import { decideRoute, AuthUserContext, AppType } from '@/lib/auth-guard';

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;
  const hostname = req.headers.get('host') || '';

  // 1. Tentukan jenis aplikasi berdasarkan domain atau header
  // e.g. admin.tatadana.id -> admin app; app.tatadana.id -> user app
  const isAdminDomain = hostname.startsWith('admin.') || hostname.includes('admin-tatadana');
  const appType: AppType = isAdminDomain || pathname.startsWith('/admin') ? 'admin' : 'user';

  // 2. Ambil token sesi atau user data dari cookie
  // Mendukung standard Supabase cookie maupun cookie aplikasi tatadana_auth
  const authCookie = req.cookies.get('tatadana_auth')?.value || req.cookies.get('sb-access-token')?.value;
  let user: AuthUserContext | null = null;

  if (authCookie) {
    try {
      // Jika cookie berisi JSON profil
      if (authCookie.startsWith('{')) {
        user = JSON.parse(authCookie);
      } else {
        // Fallback user placeholder jika hanya berupa JWT token
        user = {
          id: 'usr_authenticated',
          role: 'user',
          status: 'approved',
          telegram_verified_at: new Date().toISOString(),
        };
      }
    } catch (e) {
      user = null;
    }
  }

  // 3. Evaluasi navigasi dengan decideRoute
  const decision = decideRoute(pathname, user, appType);

  if (!decision.allow && decision.redirectUrl) {
    const redirectUrl = new URL(decision.redirectUrl, req.url);
    if (decision.reason) {
      redirectUrl.searchParams.set('reason', encodeURIComponent(decision.reason));
    }
    return NextResponse.redirect(redirectUrl);
  }

  // 4. Lanjutkan request dengan header konteks
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-tatadana-app-type', appType);
  if (user?.id) {
    requestHeaders.set('x-tatadana-user-id', user.id);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static assets (.svg, .png, .jpg, .jpeg, .gif, .webp)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
