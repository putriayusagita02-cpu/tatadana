/**
 * SUPABASE BROWSER CLIENT
 * Digunakan untuk pemanggilan Supabase dari sisi klien (React Client Components).
 * Dilengkapi sanitasi URL otomatis dan fallback anti-crash saat build time di Vercel.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { sanitizeSupabaseUrl, sanitizeSupabaseKey, CLOUD_SUPABASE_URL, CLOUD_SUPABASE_ANON } from './server';

let browserClient: SupabaseClient | null = null;

export function createBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient;

  const safeUrl = sanitizeSupabaseUrl(
    typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_SUPABASE_URL
      : (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)
  );
  const safeAnonKey = sanitizeSupabaseKey(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'placeholder-anon-key'
  );

  try {
    browserClient = createClient(safeUrl, safeAnonKey, {
      auth: {
        persistSession: typeof window !== 'undefined',
        autoRefreshToken: typeof window !== 'undefined',
        detectSessionInUrl: typeof window !== 'undefined',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
  } catch (e) {
    console.warn('[Supabase Browser Fallback Client Active]:', e);
    browserClient = createClient(CLOUD_SUPABASE_URL, CLOUD_SUPABASE_ANON, {
      auth: { persistSession: false },
    });
  }

  return browserClient;
}

export const supabaseBrowser = createBrowserClient();
