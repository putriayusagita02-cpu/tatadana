/**
 * SUPABASE SERVER CLIENT
 * Digunakan untuk pemanggilan Supabase dari sisi server (Next.js API Routes & Server Components).
 * Dilengkapi sanitasi URL otomatis dan fallback anti-crash saat build time di Vercel.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const CLOUD_SUPABASE_URL = 'https://qjcdgvnmuivxdyofecfy.supabase.co';
export const CLOUD_SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqY2Rndm5tdWl2eGR5b2ZlY2Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwNzI4NDEsImV4cCI6MjEwNzY0ODg0MX0.bLn7oSac9loh9q62kPGh2TtLLrzbq5wYNlOV1WjQglg';
export const CLOUD_SUPABASE_SERVICE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqY2Rndm5tdWl2eGR5b2ZlY2Z5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MjA3Mjg0MSwiZXhwIjoyMTA3NjQ4ODQxfQ.eGm7YOsB8HMJ_8gG06gGLVtj16Vg_RGFc-Ayl-7fCdo';

export function sanitizeSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return CLOUD_SUPABASE_URL;
  }
  let clean = rawUrl.trim();
  if (!clean || clean === 'your-project.supabase.co' || clean === 'https://placeholder-project.supabase.co') {
    return CLOUD_SUPABASE_URL;
  }
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `https://${clean}`;
  }
  try {
    const parsed = new URL(clean);
    return parsed.origin;
  } catch {
    return CLOUD_SUPABASE_URL;
  }
}

export function sanitizeSupabaseKey(rawKey?: string, fallback = CLOUD_SUPABASE_ANON): string {
  if (!rawKey || typeof rawKey !== 'string') return fallback;
  const clean = rawKey.trim();
  if (!clean || clean === 'your-anon-key' || clean === 'placeholder-anon-key') return fallback;
  return clean;
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
