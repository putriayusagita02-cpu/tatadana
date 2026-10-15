-- ==============================================================================
-- TATADANA SUPABASE MIGRATION: REVISI DOSEN & ATURAN PRIORITAS TERTINGGI (PART 14)
-- File: supabase/migrations/20261014000000_part14_revisi_dosen.sql
-- 14.1 2 Aplikasi Terpisah (User & Admin) + RLS is_admin()
-- 14.2 Persetujuan User oleh Admin: profiles.status (pending, approved, rejected)
-- 14.3 Akun Admin Superadmin putriayusagita02@gmail.com di admin_emails
-- 14.4 OTP Telegram (telegram_otps HMAC hash, 5 min expiry, 5x max attempts)
-- 14.7 Storage Buckets (avatars, exports) & Strict RLS is_approved()
-- ==============================================================================

-- 1. TABEL ADMIN EMAILS
CREATE TABLE IF NOT EXISTS public.admin_emails (
    email TEXT PRIMARY KEY,
    notes TEXT DEFAULT 'Superadmin TataDana',
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- Daftarkan email superadmin resmi dosen
INSERT INTO public.admin_emails (email, notes)
VALUES ('putriayusagita02@gmail.com', 'Superadmin Utama TataDana Dosen')
ON CONFLICT (email) DO NOTHING;

-- 2. PENAMBAHAN KOLOM PADA PROFILES
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'superadmin', 'admin')),
ADD COLUMN IF NOT EXISTS telegram_user_id BIGINT UNIQUE,
ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT,
ADD COLUMN IF NOT EXISTS telegram_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ask_wallet_each_time BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 3. TABEL TELEGRAM OTPS (PART 14.4)
CREATE TABLE IF NOT EXISTS public.telegram_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    phone_number TEXT,
    otp_hash TEXT,
    telegram_user_id BIGINT,
    telegram_chat_id BIGINT,
    attempts INTEGER DEFAULT 0,
    resend_count INTEGER DEFAULT 0,
    token_expires_at TIMESTAMPTZ NOT NULL,
    otp_expires_at TIMESTAMPTZ,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

CREATE INDEX IF NOT EXISTS idx_telegram_otps_token ON public.telegram_otps (token);
CREATE INDEX IF NOT EXISTS idx_telegram_otps_telegram_user ON public.telegram_otps (telegram_user_id);

-- 4. FUNGSI RLS HELPER: is_admin() & is_approved()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (role = 'superadmin' OR is_superadmin = true)
    ) OR EXISTS (
        SELECT 1 FROM auth.users u
        JOIN public.admin_emails a ON LOWER(u.email) = LOWER(a.email)
        WHERE u.id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_approved()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND status = 'approved'
    ) OR public.is_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. TRIGGER ONBOARDING ADMIN OTOMATIS (PART 14.3)
CREATE OR REPLACE FUNCTION public.handle_admin_email_onboarding()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.admin_emails WHERE LOWER(email) = LOWER(NEW.email)) THEN
        NEW.role := 'superadmin';
        NEW.is_superadmin := true;
        NEW.status := 'approved';
        NEW.phone_verified := true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_profile_admin_check ON public.profiles;
CREATE TRIGGER trg_profile_admin_check
BEFORE INSERT OR UPDATE OF email ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_admin_email_onboarding();

-- Update profil yang sudah ada jika email cocok
UPDATE public.profiles
SET role = 'superadmin', is_superadmin = true, status = 'approved', phone_verified = true
WHERE LOWER(email) IN (SELECT LOWER(email) FROM public.admin_emails);

-- 6. FUNGSI ADMIN: admin_set_user_status (PART 14.2)
CREATE OR REPLACE FUNCTION public.admin_set_user_status(
    p_user_id UUID,
    p_status TEXT,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_admin_id UUID := auth.uid();
    v_old_status TEXT;
    v_user_email TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Akses ditolak: Hanya superadmin yang dapat mengubah status persetujuan user.';
    END IF;

    IF p_status NOT IN ('pending', 'approved', 'rejected') THEN
        RAISE EXCEPTION 'Status tidak valid. Pilihan: pending, approved, rejected.';
    END IF;

    IF p_status = 'rejected' AND (p_reason IS NULL OR TRIM(p_reason) = '') THEN
        RAISE EXCEPTION 'Penolakan wajib menyertakan alasan.';
    END IF;

    SELECT status, email INTO v_old_status, v_user_email 
    FROM public.profiles WHERE id = p_user_id;

    UPDATE public.profiles
    SET status = p_status,
        rejection_reason = CASE WHEN p_status = 'rejected' THEN p_reason ELSE NULL END,
        updated_at = NOW() AT TIME ZONE 'Asia/Jakarta'
    WHERE id = p_user_id;

    -- Catat di tabel audit_logs
    INSERT INTO public.audit_logs (admin_id, target_user_id, action, details)
    VALUES (
        v_admin_id,
        p_user_id,
        'change_user_status',
        jsonb_build_object(
            'old_status', v_old_status,
            'new_status', p_status,
            'reason', p_reason,
            'target_email', v_user_email,
            'timestamp', NOW() AT TIME ZONE 'Asia/Jakarta'
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'user_id', p_user_id,
        'status', p_status,
        'reason', p_reason
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. FUNGSI ADMIN: admin_get_user_transactions DENGAN AUDIT LOG (PART 14.7)
CREATE OR REPLACE FUNCTION public.admin_get_user_transactions(p_user_id UUID)
RETURNS SETOF public.transactions AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Akses ditolak: Hanya superadmin yang berhak memeriksa transaksi pengguna.';
    END IF;

    -- Audit log otomatis setiap admin melihat transaksi user
    INSERT INTO public.audit_logs (admin_id, target_user_id, action, details)
    VALUES (
        auth.uid(),
        p_user_id,
        'view_user_transactions',
        jsonb_build_object('timestamp', NOW() AT TIME ZONE 'Asia/Jakarta')
    );

    RETURN QUERY
    SELECT * FROM public.transactions
    WHERE user_id = p_user_id
    ORDER BY transaction_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. PERKUAT RLS: USER HANYA BISA BACA DATA JIKA is_approved() = TRUE (PART 14.2)
DROP POLICY IF EXISTS "Users can manage own wallets" ON public.wallets;
CREATE POLICY "Users can manage own wallets" ON public.wallets
FOR ALL USING ((auth.uid() = user_id AND public.is_approved()) OR public.is_admin());

DROP POLICY IF EXISTS "Users can manage own transactions" ON public.transactions;
CREATE POLICY "Users can manage own transactions" ON public.transactions
FOR ALL USING ((auth.uid() = user_id AND public.is_approved()) OR public.is_admin());

DROP POLICY IF EXISTS "Users can manage own transaction items" ON public.transaction_items;
CREATE POLICY "Users can manage own transaction items" ON public.transaction_items
FOR ALL USING (
    (EXISTS (
        SELECT 1 FROM public.transactions 
        WHERE transactions.id = transaction_items.transaction_id 
          AND transactions.user_id = auth.uid()
    ) AND public.is_approved()) OR public.is_admin()
);

DROP POLICY IF EXISTS "Users can manage own transfers" ON public.transfers;
CREATE POLICY "Users can manage own transfers" ON public.transfers
FOR ALL USING ((auth.uid() = user_id AND public.is_approved()) OR public.is_admin());

DROP POLICY IF EXISTS "Users can manage own budgets" ON public.budgets;
CREATE POLICY "Users can manage own budgets" ON public.budgets
FOR ALL USING ((auth.uid() = user_id AND public.is_approved()) OR public.is_admin());

DROP POLICY IF EXISTS "Users can manage own bills" ON public.bills;
CREATE POLICY "Users can manage own bills" ON public.bills
FOR ALL USING ((auth.uid() = user_id AND public.is_approved()) OR public.is_admin());

DROP POLICY IF EXISTS "Users can manage own jatah settings" ON public.jatah_settings;
CREATE POLICY "Users can manage own jatah settings" ON public.jatah_settings
FOR ALL USING ((auth.uid() = user_id AND public.is_approved()) OR public.is_admin());

DROP POLICY IF EXISTS "Users can manage own daily jatah" ON public.daily_jatah;
CREATE POLICY "Users can manage own daily jatah" ON public.daily_jatah
FOR ALL USING ((auth.uid() = user_id AND public.is_approved()) OR public.is_admin());

DROP POLICY IF EXISTS "Users can manage own streaks" ON public.streaks;
CREATE POLICY "Users can manage own streaks" ON public.streaks
FOR ALL USING ((auth.uid() = user_id AND public.is_approved()) OR public.is_admin());

-- 9. STORAGE BUCKETS SETUP & STORAGE RLS POLICIES (PART 11.2 & 14.7)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true),
       ('exports', 'exports', false)
ON CONFLICT (id) DO NOTHING;

-- Policy avatars: User hanya bisa upload, ubah, dan hapus foto profil miliknya sendiri
DROP POLICY IF EXISTS "Avatar bucket user upload" ON storage.objects;
CREATE POLICY "Avatar bucket user upload" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin())
);

DROP POLICY IF EXISTS "Avatar bucket user update" ON storage.objects;
CREATE POLICY "Avatar bucket user update" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'avatars' AND 
    (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin())
);

DROP POLICY IF EXISTS "Avatar bucket user delete" ON storage.objects;
CREATE POLICY "Avatar bucket user delete" ON storage.objects
FOR DELETE USING (
    bucket_id = 'avatars' AND 
    (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin())
);

DROP POLICY IF EXISTS "Avatar bucket public view" ON storage.objects;
CREATE POLICY "Avatar bucket public view" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Policy exports: User hanya bisa mengakses berkas export miliknya sendiri
DROP POLICY IF EXISTS "Exports bucket user manage" ON storage.objects;
CREATE POLICY "Exports bucket user manage" ON storage.objects
FOR ALL USING (
    bucket_id = 'exports' AND 
    (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin())
);
