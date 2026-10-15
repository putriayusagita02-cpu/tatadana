/**
 * TATADANA AUTH GUARD & ROUTE DECIDER
 * Sesuai Part 14.1, 14.2, 14.6 Spesifikasi TataDana:
 * - Dua domain / sub-aplikasi: User App dan Admin App
 * - Non-authenticated user pada link user hanya melihat Landing Page (/)
 * - Akses /dashboard tanpa login dialihkan ke /masuk (atau /login)
 * - User terdaftar melalui alur:
 *   1. Belum link Telegram -> /verifikasi-telegram
 *   2. Pending approval -> /menunggu-persetujuan
 *   3. Ditolak -> /ditolak
 *   4. Approved -> /dashboard
 * - Akun admin superadmin (putriayusagita02@gmail.com) langsung approved ke /admin
 * - Akses silang user biasa ke /admin ditolak
 */

export interface AuthUserContext {
  id: string;
  email?: string | null;
  role?: 'user' | 'superadmin' | string;
  status?: 'pending' | 'approved' | 'rejected' | string;
  phone?: string | null;
  telegram_user_id?: number | string | null;
  telegram_verified_at?: string | null;
  is_impersonating?: boolean;
}

export interface RouteDecision {
  allow: boolean;
  redirectUrl?: string;
  reason?: string;
}

export type AppType = 'user' | 'admin';

/**
 * Menentukan rute yang diizinkan untuk navigasi berdasarkan status sesi user
 */
export function decideRoute(
  pathname: string,
  user: AuthUserContext | null,
  appType: AppType = 'user'
): RouteDecision {
  const normalizedPath = pathname.toLowerCase();

  // Public asset / internal API check
  if (
    normalizedPath.startsWith('/_next') ||
    normalizedPath.startsWith('/api') ||
    normalizedPath.startsWith('/favicon.ico') ||
    normalizedPath.includes('.') // file extension like .png, .css
  ) {
    return { allow: true };
  }

  // ---------------------------------------------------------------------------
  // A. ADMIN APP DOMAIN / CONSOLE ROUTING
  // ---------------------------------------------------------------------------
  if (appType === 'admin' || normalizedPath.startsWith('/admin')) {
    // 1. Tanpa sesi
    if (!user) {
      if (normalizedPath === '/login' || normalizedPath === '/masuk' || normalizedPath === '/admin/login') {
        return { allow: true };
      }
      return {
        allow: false,
        redirectUrl: '/login?role=admin',
        reason: 'Admin authentication required',
      };
    }

    // 2. Cek apakah user adalah superadmin
    const isSuperadmin =
      user.role === 'superadmin' ||
      user.email?.toLowerCase() === 'putriayusagita02@gmail.com';

    if (!isSuperadmin) {
      // Jika diakses pada domain admin (appType === 'admin'), redirect ke User App URL atau /masuk
      // untuk mencegah infinite redirect loop di domain admin (Part 14.1)
      const userAppUrl = process.env.NEXT_PUBLIC_USER_APP_URL || process.env.USER_APP_URL;
      const redirectTarget = appType === 'admin'
        ? (userAppUrl ? `${userAppUrl.replace(/\/$/, '')}/dashboard` : '/masuk?reason=admin_access_denied')
        : '/dashboard';

      return {
        allow: false,
        redirectUrl: redirectTarget,
        reason: 'User biasa dilarang mengakses Admin Console (Akses silang ditolak)',
      };
    }

    // Admin login page redirect ke /admin jika sudah login
    if (normalizedPath === '/login' || normalizedPath === '/masuk' || normalizedPath === '/admin/login') {
      return {
        allow: false,
        redirectUrl: '/admin',
        reason: 'Superadmin sudah login',
      };
    }

    return { allow: true };
  }

  // ---------------------------------------------------------------------------
  // B. USER APP DOMAIN ROUTING
  // ---------------------------------------------------------------------------

  // 1. Pengunjung Tanpa Sesi (Guest)
  if (!user) {
    // Landing page diizinkan
    if (normalizedPath === '/' || normalizedPath === '/landing') {
      return { allow: true };
    }

    // Halaman otentikasi diizinkan
    if (
      normalizedPath === '/login' ||
      normalizedPath === '/masuk' ||
      normalizedPath === '/register' ||
      normalizedPath === '/daftar' ||
      normalizedPath === '/forgot-password'
    ) {
      return { allow: true };
    }

    // Rute terproteksi /dashboard dialihkan ke /masuk
    if (
      normalizedPath.startsWith('/dashboard') ||
      normalizedPath === '/verifikasi-telegram' ||
      normalizedPath === '/menunggu-persetujuan' ||
      normalizedPath === '/ditolak'
    ) {
      return {
        allow: false,
        redirectUrl: '/masuk',
        reason: 'Wajib login untuk mengakses area pengguna',
      };
    }

    // Rute lain fallback ke landing page
    return { allow: true };
  }

  // 2. User Sudah Login (Authenticated)

  // Cek jika akun adalah superadmin khusus
  const isSuperadmin =
    user.role === 'superadmin' ||
    user.email?.toLowerCase() === 'putriayusagita02@gmail.com';

  // Landing page tetap bisa diakses oleh user yang sudah login
  if (normalizedPath === '/' || normalizedPath === '/landing') {
    return { allow: true };
  }

  // Superadmin bebas akses dashboard manapun
  if (isSuperadmin) {
    if (normalizedPath === '/login' || normalizedPath === '/masuk' || normalizedPath === '/register' || normalizedPath === '/daftar') {
      return { allow: false, redirectUrl: '/dashboard' };
    }
    return { allow: true };
  }

  // Evaluasi tahap onboarding & persetujuan user biasa
  const isTelegramLinked = Boolean(user.telegram_user_id || user.telegram_verified_at);
  const status = (user.status || 'pending').toLowerCase();

  // Tahap 1: Belum Verifikasi Telegram
  if (!isTelegramLinked) {
    if (normalizedPath === '/verifikasi-telegram') {
      return { allow: true };
    }
    return {
      allow: false,
      redirectUrl: '/verifikasi-telegram',
      reason: 'Harus verifikasi akun via Telegram Bot terlebih dahulu',
    };
  }

  // Tahap 2: Akun Ditolak oleh Admin
  if (status === 'rejected') {
    if (normalizedPath === '/ditolak') {
      return { allow: true };
    }
    return {
      allow: false,
      redirectUrl: '/ditolak',
      reason: 'Akun ditolak oleh admin TataDana',
    };
  }

  // Tahap 3: Akun Menunggu Persetujuan Admin (Pending)
  if (status === 'pending') {
    if (normalizedPath === '/menunggu-persetujuan') {
      return { allow: true };
    }
    return {
      allow: false,
      redirectUrl: '/menunggu-persetujuan',
      reason: 'Akun masih menunggu persetujuan superadmin',
    };
  }

  // Tahap 4: Akun Approved
  if (status === 'approved') {
    // Jika mencoba akses halaman registrasi / login / status pending -> lempar ke dashboard
    if (
      normalizedPath === '/login' ||
      normalizedPath === '/masuk' ||
      normalizedPath === '/register' ||
      normalizedPath === '/daftar' ||
      normalizedPath === '/verifikasi-telegram' ||
      normalizedPath === '/menunggu-persetujuan' ||
      normalizedPath === '/ditolak'
    ) {
      return {
        allow: false,
        redirectUrl: '/dashboard',
        reason: 'Akun aktif langsung diarahkan ke Dashboard',
      };
    }

    return { allow: true };
  }

  return { allow: true };
}
