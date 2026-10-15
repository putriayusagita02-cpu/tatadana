/**
 * SUPABASE SERVER CLIENT
 * Digunakan untuk pemanggilan Supabase dari sisi server (Next.js API Routes & Server Components).
 * Menggunakan SUPABASE_SERVICE_ROLE_KEY untuk operasi administratif yang aman (bypass RLS secara terkontrol).
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let serverAdminClient: SupabaseClient | null = null;

export function createServerClient(useServiceRole = false): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const apiKey = useServiceRole
    ? (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-service-key')
    : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key');

  if (useServiceRole && serverAdminClient) {
    return serverAdminClient;
  }

  const client = createClient(supabaseUrl, apiKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  if (useServiceRole) {
    serverAdminClient = client;
  }

  return client;
}

export const supabaseServer = createServerClient(false);
export const supabaseAdmin = createServerClient(true);
