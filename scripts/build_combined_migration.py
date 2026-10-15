import os

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
mig_dir = os.path.join(base_dir, 'supabase', 'migrations')
output_path = os.path.join(base_dir, 'supabase', 'combined_migrations.sql')

mig_files = [
    '20261013000000_init_tatadana.sql',
    '20261013000001_tatadana_core.sql',
    '20261014000000_part14_revisi_dosen.sql'
]

combined_sql = """-- =============================================================================
-- TATADANA FINTECH SAAS — COMPLETE CONSOLIDATED POSTGRESQL & SUPABASE MIGRATION
-- =============================================================================
-- Tanggal: 15 Oktober 2026
-- Target: Supabase Postgres (Database & Auth & Storage)
-- Zona Waktu: Asia/Jakarta (WIB, UTC+7)
-- =============================================================================
-- CARA MENJALANKAN:
-- 1. Buka Supabase Dashboard Anda (https://supabase.com/dashboard)
-- 2. Pilih Project Anda -> Klik menu "SQL Editor" di sidebar kiri.
-- 3. Klik "New query", paste seluruh isi file ini, lalu tekan tombol "RUN" (Ctrl + Enter).
-- 4. Semua tabel, RLS, triggers saldo otomatis, dan superadmin putriayusagita02@gmail.com
--    akan terkonfigurasi secara instan dan sempurna!
-- =============================================================================

"""

for fname in mig_files:
    fpath = os.path.join(mig_dir, fname)
    if os.path.exists(fpath):
        combined_sql += f"\n\n-- =============================================================================\n"
        combined_sql += f"-- BAGIAN: {fname}\n"
        combined_sql += f"-- =============================================================================\n\n"
        with open(fpath, 'r', encoding='utf-8') as f:
            combined_sql += f.read()

# Add extra seed and superadmin insertion guarantee
combined_sql += """

-- =============================================================================
-- BAGIAN TAMBAHAN: INISIALISASI SUPERADMIN & REALTIME
-- =============================================================================

-- Pastikan email admin putriayusagita02@gmail.com terdaftar di admin_emails
INSERT INTO public.admin_emails (email)
VALUES ('putriayusagita02@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- Aktifkan Supabase Realtime untuk tabel-tabel transaksi dan wallet
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
  EXCEPTION WHEN duplicate_object THEN
    -- already added
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
  EXCEPTION WHEN duplicate_object THEN
    -- already added
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  EXCEPTION WHEN duplicate_object THEN
    -- already added
  END;
END $$;
"""

with open(output_path, 'w', encoding='utf-8') as f:
    f.write(combined_sql)

print(f"Successfully generated: {output_path}")
print(f"Total size: {len(combined_sql)} characters")
