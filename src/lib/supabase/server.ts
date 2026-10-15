/**
 * SUPABASE SERVER CLIENT
 * Digunakan untuk pemanggilan Supabase dari sisi server (Next.js API Routes & Server Components).
 * Dilengkapi sanitasi URL otomatis dan fallback anti-crash saat build time di Vercel.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function sanitizeSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return 'https://placeholder-project.supabase.co';
  }
  let clean = rawUrl.trim();
  if (!clean || clean === 'your-project.supabase.co') {
    return 'https://placeholder-project.supabase.co';
  }
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `https://${clean}`;
  }
  try {
    const parsed = new URL(clean);
    return parsed.origin;
  } catch {
    return 'https://placeholder-project.supabase.co';
  }
}

export function sanitizeSupabaseKey(rawKey?: string, fallback = 'placeholder-anon-key'): string {
  if (!rawKey || typeof rawKey !== 'string') return fallback;
  const clean = rawKey.trim();
  return clean || fallback;
}

let serverAdminClient: SupabaseClient | null = null;
let serverUserClient: SupabaseClient | null = null;

export function createServerClient(useServiceRole = false): SupabaseClient {
  const safeUrl = sanitizeSupabaseUrl(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  );
  
  const rawKey = useServiceRole
    ? (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const safeKey = sanitizeSupabaseKey(rawKey, useServiceRole ? 'placeholder-service-key' : 'placeholder-anon-key');

  if (useServiceRole && serverAdminClient) return serverAdminClient;
  if (!useServiceRole && serverUserClient) return serverUserClient;

  let client: SupabaseClient;
  try {
    client = createClient(safeUrl, safeKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  } catch (e) {
    console.warn('[Supabase Server Fallback Client Active]:', e);
    client = createClient('https://placeholder-project.supabase.co', 'placeholder-anon-key', {
      auth: { persistSession: false },
    });
  }

  if (useServiceRole) {
    serverAdminClient = client;
  } else {
    serverUserClient = client;
  }

  return client;
}

export const supabaseServer = createServerClient(false);
export const supabaseAdmin = createServerClient(true);
