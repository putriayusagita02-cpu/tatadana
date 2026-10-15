-- =============================================================================
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



-- =============================================================================
-- BAGIAN: 20261013000000_init_tatadana.sql
-- =============================================================================

-- ==============================================================================
-- TATADANA DATABASE SCHEMA (Supabase Postgres)
-- File: supabase/migrations/20261013000000_init_tatadana.sql
-- Standar Fintech SaaS Indonesia: Timezone Asia/Jakarta (WIB, UTC+7)
-- Triggers Saldo Otomatis, RLS, Multi-Wallet, TataJatah, Webhook Idempotency
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

SET timezone = 'Asia/Jakarta';

-- ------------------------------------------------------------------------------
-- 1. PROFILES & SUBSCRIPTIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone_number TEXT UNIQUE,
    phone_verified BOOLEAN DEFAULT false,
    avatar_url TEXT,
    default_currency TEXT DEFAULT 'IDR',
    subscription_plan TEXT DEFAULT 'starter' CHECK (subscription_plan IN ('starter', 'pro')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'past_due')),
    monthly_tx_count INTEGER DEFAULT 0,
    monthly_tx_reset_at DATE DEFAULT CURRENT_DATE,
    is_superadmin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan TEXT NOT NULL CHECK (plan IN ('starter', 'pro')),
    billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'lifetime')),
    price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
    starts_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- ------------------------------------------------------------------------------
-- 2. WALLETS (Multi-Wallet: BCA, Mandiri, Cash, GoPay, OVO, dll)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    alias TEXT,
    type TEXT NOT NULL DEFAULT 'bank' CHECK (type IN ('bank', 'ewallet', 'cash', 'investment', 'other')),
    account_number TEXT,
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    is_default_telegram BOOLEAN NOT NULL DEFAULT false,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    color TEXT DEFAULT '#F43F5E',
    icon TEXT DEFAULT 'wallet',
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_default_wallet_per_user 
ON public.wallets (user_id) 
WHERE is_default_telegram = true AND is_archived = false;

-- ------------------------------------------------------------------------------
-- 3. CATEGORIES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL jika global default
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    emoji TEXT NOT NULL DEFAULT '🏷️',
    color TEXT NOT NULL DEFAULT '#FB7185',
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- ------------------------------------------------------------------------------
-- 4. BUDGETS (Monthly budget per category with alert tracker 80% & 100%)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK (year >= 2024),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    alert_80_sent BOOLEAN DEFAULT false,
    alert_100_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    CONSTRAINT unique_user_category_month_year UNIQUE (user_id, category_id, month, year)
);

-- ------------------------------------------------------------------------------
-- 5. TRANSACTIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    description TEXT,
    notes TEXT,
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    source TEXT NOT NULL DEFAULT 'telegram' CHECK (source IN ('telegram', 'web', 'receipt_ocr', 'voice_note')),
    raw_input TEXT,
    receipt_image_url TEXT,
    transfer_to_wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
    is_split_parent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- ------------------------------------------------------------------------------
-- 6. TRANSACTION ITEMS (Untuk struk belanja multi-item OCR)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- ------------------------------------------------------------------------------
-- 7. TRANSFERS (Pencatatan mutasi antar dompet eksplisit)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    from_wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
    to_wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    fee NUMERIC(15, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    transfer_date TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- ------------------------------------------------------------------------------
-- 8. TELEGRAM INTEGRATION (Idempotency, Link Codes, Pending Wallet Choice)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.telegram_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    update_id BIGINT NOT NULL UNIQUE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    processed_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    status TEXT DEFAULT 'processed',
    response_payload JSONB
);

CREATE TABLE IF NOT EXISTS public.telegram_link_codes (
    code TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

CREATE TABLE IF NOT EXISTS public.telegram_pending (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_user_id BIGINT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    pending_action TEXT NOT NULL, -- 'choose_wallet'
    pending_payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS public.telegram_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    telegram_user_id BIGINT UNIQUE,
    telegram_username TEXT,
    telegram_chat_id BIGINT,
    bot_token_encrypted TEXT,
    always_ask_wallet BOOLEAN DEFAULT false,
    is_connected BOOLEAN DEFAULT false,
    connected_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

CREATE TABLE IF NOT EXISTS public.telegram_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT true,
    frequency INTEGER DEFAULT 1 CHECK (frequency IN (1, 2)), -- Maksimal 2x/hari
    time_1 TIME DEFAULT '12:00:00',
    time_2 TIME DEFAULT '20:00:00',
    preview_message TEXT DEFAULT '⏰ Reminder Keuangan! Jangan lupa catat pengeluaran hari ini ya 📝',
    last_sent_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- ------------------------------------------------------------------------------
-- 9. TATAJATAH SIGNATURE SYSTEM (Bills, Jatah Settings, Daily Rollover, Streaks)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- 'Kos-kosan', 'Listrik PLN', 'Cicilan Motor'
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
    is_paid_this_cycle BOOLEAN DEFAULT false,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

CREATE TABLE IF NOT EXISTS public.jatah_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    payday_date INTEGER NOT NULL DEFAULT 25 CHECK (payday_date BETWEEN 1 AND 31),
    monthly_savings_target NUMERIC(15, 2) NOT NULL DEFAULT 500000,
    enable_rollover BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

CREATE TABLE IF NOT EXISTS public.daily_jatah (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    safe_daily_allowance NUMERIC(15, 2) NOT NULL,
    total_spent_today NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'aman' CHECK (status IN ('aman', 'hati_hati', 'lewat')),
    days_left_to_payday INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    CONSTRAINT unique_user_daily_jatah UNIQUE (user_id, date)
);

CREATE TABLE IF NOT EXISTS public.streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    current_streak_days INTEGER NOT NULL DEFAULT 0,
    longest_streak_days INTEGER NOT NULL DEFAULT 0,
    last_logged_date DATE,
    badges JSONB DEFAULT '[]'::jsonb, -- ['streak_3', 'streak_7', 'streak_14', 'streak_30']
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- ------------------------------------------------------------------------------
-- 10. MULTI-PROVIDER AI CONFIGURATION & CALL LOGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name TEXT NOT NULL UNIQUE CHECK (provider_name IN ('gemini', 'openai', 'deepseek')),
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1,
    api_key_encrypted TEXT,
    model_name TEXT NOT NULL,
    config_options JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

CREATE TABLE IF NOT EXISTS public.ai_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    provider TEXT NOT NULL,
    action_type TEXT NOT NULL, -- 'parse_text', 'receipt_ocr', 'voice_transcribe', 'financial_advisor'
    input_preview TEXT,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    duration_ms INTEGER DEFAULT 0,
    estimated_cost_idr NUMERIC(10, 2) DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('success', 'error', 'fallback')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- ------------------------------------------------------------------------------
-- 11. AUDIT LOGS, PAYMENTS, & EXPORTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    order_id TEXT NOT NULL UNIQUE,
    amount NUMERIC(15, 2) NOT NULL,
    plan TEXT NOT NULL CHECK (plan IN ('starter', 'pro')),
    payment_method TEXT NOT NULL, -- 'midtrans_qris', 'midtrans_bca_va', 'manual_transfer'
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    proof_image_url TEXT,
    admin_notes TEXT,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

CREATE TABLE IF NOT EXISTS public.exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL CHECK (report_type IN ('pdf', 'excel')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size_bytes INTEGER DEFAULT 0,
    download_url TEXT,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- ------------------------------------------------------------------------------
-- 12. AUTOMATIC WALLET BALANCE RECALCULATION TRIGGERS
-- ------------------------------------------------------------------------------
-- Fungsi otomatis memperbarui saldo saat transaksi dibuat, diubah, atau dihapus
CREATE OR REPLACE FUNCTION public.handle_transaction_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- JIKA INSERT TRANSAKSI
    IF (TG_OP = 'INSERT') THEN
        IF NEW.type = 'expense' THEN
            UPDATE public.wallets 
            SET balance = balance - NEW.amount, updated_at = NOW() AT TIME ZONE 'Asia/Jakarta'
            WHERE id = NEW.wallet_id;
        ELSIF NEW.type = 'income' THEN
            UPDATE public.wallets 
            SET balance = balance + NEW.amount, updated_at = NOW() AT TIME ZONE 'Asia/Jakarta'
            WHERE id = NEW.wallet_id;
        ELSIF NEW.type = 'transfer' AND NEW.transfer_to_wallet_id IS NOT NULL THEN
            UPDATE public.wallets 
            SET balance = balance - NEW.amount, updated_at = NOW() AT TIME ZONE 'Asia/Jakarta'
            WHERE id = NEW.wallet_id;
            UPDATE public.wallets 
            SET balance = balance + NEW.amount, updated_at = NOW() AT TIME ZONE 'Asia/Jakarta'
            WHERE id = NEW.transfer_to_wallet_id;
        END IF;
        RETURN NEW;

    -- JIKA UPDATE TRANSAKSI
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Kembalikan efek lama
        IF OLD.type = 'expense' THEN
            UPDATE public.wallets SET balance = balance + OLD.amount WHERE id = OLD.wallet_id;
        ELSIF OLD.type = 'income' THEN
            UPDATE public.wallets SET balance = balance - OLD.amount WHERE id = OLD.wallet_id;
        ELSIF OLD.type = 'transfer' AND OLD.transfer_to_wallet_id IS NOT NULL THEN
            UPDATE public.wallets SET balance = balance + OLD.amount WHERE id = OLD.wallet_id;
            UPDATE public.wallets SET balance = balance - OLD.amount WHERE id = OLD.transfer_to_wallet_id;
        END IF;
        -- Terapkan efek baru
        IF NEW.type = 'expense' THEN
            UPDATE public.wallets SET balance = balance - NEW.amount, updated_at = NOW() AT TIME ZONE 'Asia/Jakarta' WHERE id = NEW.wallet_id;
        ELSIF NEW.type = 'income' THEN
            UPDATE public.wallets SET balance = balance + NEW.amount, updated_at = NOW() AT TIME ZONE 'Asia/Jakarta' WHERE id = NEW.wallet_id;
        ELSIF NEW.type = 'transfer' AND NEW.transfer_to_wallet_id IS NOT NULL THEN
            UPDATE public.wallets SET balance = balance - NEW.amount, updated_at = NOW() AT TIME ZONE 'Asia/Jakarta' WHERE id = NEW.wallet_id;
            UPDATE public.wallets SET balance = balance + NEW.amount, updated_at = NOW() AT TIME ZONE 'Asia/Jakarta' WHERE id = NEW.transfer_to_wallet_id;
        END IF;
        RETURN NEW;

    -- JIKA DELETE TRANSAKSI
    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.type = 'expense' THEN
            UPDATE public.wallets SET balance = balance + OLD.amount, updated_at = NOW() AT TIME ZONE 'Asia/Jakarta' WHERE id = OLD.wallet_id;
        ELSIF OLD.type = 'income' THEN
            UPDATE public.wallets SET balance = balance - OLD.amount, updated_at = NOW() AT TIME ZONE 'Asia/Jakarta' WHERE id = OLD.wallet_id;
        ELSIF OLD.type = 'transfer' AND OLD.transfer_to_wallet_id IS NOT NULL THEN
            UPDATE public.wallets SET balance = balance + OLD.amount, updated_at = NOW() AT TIME ZONE 'Asia/Jakarta' WHERE id = OLD.wallet_id;
            UPDATE public.wallets SET balance = balance - OLD.amount, updated_at = NOW() AT TIME ZONE 'Asia/Jakarta' WHERE id = OLD.transfer_to_wallet_id;
        END IF;
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_recalc_transaction_wallet ON public.transactions;
CREATE TRIGGER trg_recalc_transaction_wallet
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.handle_transaction_wallet_balance();

-- Trigger untuk tabel transfers eksplisit
CREATE OR REPLACE FUNCTION public.handle_transfer_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.wallets 
        SET balance = balance - (NEW.amount + NEW.fee), updated_at = NOW() AT TIME ZONE 'Asia/Jakarta'
        WHERE id = NEW.from_wallet_id;
        
        UPDATE public.wallets 
        SET balance = balance + NEW.amount, updated_at = NOW() AT TIME ZONE 'Asia/Jakarta'
        WHERE id = NEW.to_wallet_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.wallets 
        SET balance = balance + (OLD.amount + OLD.fee), updated_at = NOW() AT TIME ZONE 'Asia/Jakarta'
        WHERE id = OLD.from_wallet_id;
        
        UPDATE public.wallets 
        SET balance = balance - OLD.amount, updated_at = NOW() AT TIME ZONE 'Asia/Jakarta'
        WHERE id = OLD.to_wallet_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_recalc_transfers_wallet ON public.transfers;
CREATE TRIGGER trg_recalc_transfers_wallet
AFTER INSERT OR DELETE ON public.transfers
FOR EACH ROW EXECUTE FUNCTION public.handle_transfer_wallet_balance();

-- ------------------------------------------------------------------------------
-- 13. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jatah_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_jatah ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND is_superadmin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
CREATE POLICY "Users can manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id OR public.is_superadmin());
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id OR public.is_superadmin());
DROP POLICY IF EXISTS "Users can manage own wallets" ON public.wallets;
CREATE POLICY "Users can manage own wallets" ON public.wallets FOR ALL USING (auth.uid() = user_id OR public.is_superadmin());
DROP POLICY IF EXISTS "Users can manage own categories or defaults" ON public.categories;
CREATE POLICY "Users can manage own categories or defaults" ON public.categories FOR ALL USING (auth.uid() = user_id OR is_default = true OR public.is_superadmin());
DROP POLICY IF EXISTS "Users can manage own budgets" ON public.budgets;
CREATE POLICY "Users can manage own budgets" ON public.budgets FOR ALL USING (auth.uid() = user_id OR public.is_superadmin());
DROP POLICY IF EXISTS "Users can manage own transactions" ON public.transactions;
CREATE POLICY "Users can manage own transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id OR public.is_superadmin());
DROP POLICY IF EXISTS "Users can manage own transaction items" ON public.transaction_items;
CREATE POLICY "Users can manage own transaction items" ON public.transaction_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.transactions WHERE transactions.id = transaction_items.transaction_id AND (transactions.user_id = auth.uid() OR public.is_superadmin()))
);
DROP POLICY IF EXISTS "Users can manage own transfers" ON public.transfers;
CREATE POLICY "Users can manage own transfers" ON public.transfers FOR ALL USING (auth.uid() = user_id OR public.is_superadmin());
DROP POLICY IF EXISTS "Users can manage own telegram connection" ON public.telegram_connections;
CREATE POLICY "Users can manage own telegram connection" ON public.telegram_connections FOR ALL USING (auth.uid() = user_id OR public.is_superadmin());
DROP POLICY IF EXISTS "Users can manage own telegram reminders" ON public.telegram_reminders;
CREATE POLICY "Users can manage own telegram reminders" ON public.telegram_reminders FOR ALL USING (auth.uid() = user_id OR public.is_superadmin());
DROP POLICY IF EXISTS "Users can manage own bills" ON public.bills;
CREATE POLICY "Users can manage own bills" ON public.bills FOR ALL USING (auth.uid() = user_id OR public.is_superadmin());
DROP POLICY IF EXISTS "Users can manage own jatah settings" ON public.jatah_settings;
CREATE POLICY "Users can manage own jatah settings" ON public.jatah_settings FOR ALL USING (auth.uid() = user_id OR public.is_superadmin());
DROP POLICY IF EXISTS "Users can manage own daily jatah" ON public.daily_jatah;
CREATE POLICY "Users can manage own daily jatah" ON public.daily_jatah FOR ALL USING (auth.uid() = user_id OR public.is_superadmin());
DROP POLICY IF EXISTS "Users can manage own streaks" ON public.streaks;
CREATE POLICY "Users can manage own streaks" ON public.streaks FOR ALL USING (auth.uid() = user_id OR public.is_superadmin());
DROP POLICY IF EXISTS "Users can manage own exports" ON public.exports;
CREATE POLICY "Users can manage own exports" ON public.exports FOR ALL USING (auth.uid() = user_id OR public.is_superadmin());
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id OR public.is_superadmin());

-- ------------------------------------------------------------------------------
-- 14. DEFAULT SEED DATA
-- ------------------------------------------------------------------------------
INSERT INTO public.categories (name, type, emoji, color, is_default) VALUES
('Makanan & Minuman', 'expense', '🍜', '#F43F5E', true),
('Transportasi', 'expense', '🚗', '#FB7185', true),
('Belanja Kebutuhan', 'expense', '🛒', '#F472B6', true),
('Hiburan & Kopi', 'expense', '🎮', '#E11D48', true),
('Tagihan & Utilitas', 'expense', '🏠', '#BE123C', true),
('Kesehatan & Medis', 'expense', '💊', '#FDA4AF', true),
('Pendidikan & Buku', 'expense', '📚', '#FB116E', true),
('Gaji Bulanan', 'income', '💰', '#10B981', true),
('Freelance & Proyek', 'income', '💻', '#059669', true),
('Investasi & Dividen', 'income', '📈', '#34D399', true)
ON CONFLICT DO NOTHING;

INSERT INTO public.ai_providers (provider_name, is_active, priority, model_name) VALUES
('gemini', true, 1, 'gemini-2.0-flash'),
('openai', true, 2, 'gpt-4o-mini'),
('deepseek', true, 3, 'deepseek-chat')
ON CONFLICT (provider_name) DO NOTHING;


-- =============================================================================
-- BAGIAN: 20261013000001_tatadana_core.sql
-- =============================================================================

-- ==============================================================================
-- TATADANA DATABASE SCHEMA (Supabase Postgres)
-- ==============================================================================
-- Standar Fintech Indonesia: Timezone Asia/Jakarta (WIB), Multi-Wallet,
-- Idempotency Webhook Telegram, Multi-Provider AI Config, dan Audit Log.
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set default timezone to Asia/Jakarta (WIB)
SET timezone = 'Asia/Jakarta';

-- ------------------------------------------------------------------------------
-- 1. PROFILES & USERS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT UNIQUE,
    phone_verified BOOLEAN DEFAULT false,
    avatar_url TEXT,
    default_currency TEXT DEFAULT 'IDR',
    subscription_plan TEXT DEFAULT 'starter' CHECK (subscription_plan IN ('starter', 'pro')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'past_due')),
    monthly_tx_count INTEGER DEFAULT 0,
    monthly_tx_reset_at DATE DEFAULT CURRENT_DATE,
    is_superadmin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- ------------------------------------------------------------------------------
-- 2. WALLETS (Multi-Wallet: BCA, Mandiri, Cash, GoPay, OVO, dll)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'bank' CHECK (type IN ('bank', 'ewallet', 'cash', 'investment', 'other')),
    account_number TEXT,
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    is_default_telegram BOOLEAN NOT NULL DEFAULT false,
    color TEXT DEFAULT '#F43F5E',
    icon TEXT DEFAULT 'wallet',
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- Ensure only one default telegram wallet per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_default_wallet_per_user 
ON public.wallets (user_id) 
WHERE is_default_telegram = true;

-- ------------------------------------------------------------------------------
-- 3. CATEGORIES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL if global default
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    emoji TEXT NOT NULL DEFAULT '🏷️',
    color TEXT NOT NULL DEFAULT '#FB7185',
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- ------------------------------------------------------------------------------
-- 4. BUDGETS (Monthly budget per category with alert tracker)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK (year >= 2024),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    alert_80_sent BOOLEAN DEFAULT false,
    alert_100_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    CONSTRAINT unique_user_category_month_year UNIQUE (user_id, category_id, month, year)
);

-- ------------------------------------------------------------------------------
-- 5. TRANSACTIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    description TEXT,
    notes TEXT,
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    source TEXT NOT NULL DEFAULT 'telegram' CHECK (source IN ('telegram', 'web', 'receipt_ocr', 'voice_note')),
    raw_input TEXT,
    receipt_image_url TEXT,
    transfer_to_wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
    is_split_parent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- ------------------------------------------------------------------------------
-- 6. TRANSACTION ITEMS (Untuk struk belanja multi-item: rokok, buah, dll)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- ------------------------------------------------------------------------------
-- 7. TELEGRAM CONNECTIONS & REMINDERS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.telegram_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    telegram_user_id BIGINT UNIQUE,
    telegram_username TEXT,
    telegram_chat_id BIGINT,
    bot_token_encrypted TEXT,
    is_connected BOOLEAN DEFAULT false,
    connected_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

CREATE TABLE IF NOT EXISTS public.telegram_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT true,
    frequency INTEGER DEFAULT 1 CHECK (frequency IN (1, 2)), -- Maksimal 2x/hari
    time_1 TIME DEFAULT '12:00:00',
    time_2 TIME DEFAULT '20:00:00',
    preview_message TEXT DEFAULT '⏰ Reminder Keuangan! Jangan lupa catat pengeluaran hari ini ya 📝',
    last_sent_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- ------------------------------------------------------------------------------
-- 8. WEBHOOK IDEMPOTENCY (Mencegah transaksi dobel dari retry Telegram)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhook_idempotency (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    update_id BIGINT NOT NULL UNIQUE,
    processed_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    status TEXT DEFAULT 'processed',
    response_payload JSONB
);

-- ------------------------------------------------------------------------------
-- 9. MULTI-PROVIDER AI CONFIGURATION & AUDIT LOGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_provider_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name TEXT NOT NULL UNIQUE CHECK (provider_name IN ('gemini', 'openai', 'deepseek')),
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1,
    api_key_encrypted TEXT,
    model_name TEXT NOT NULL,
    config_options JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

CREATE TABLE IF NOT EXISTS public.ai_system_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    mode TEXT DEFAULT 'single' CHECK (mode IN ('single', 'parallel_failover')),
    primary_provider TEXT DEFAULT 'gemini',
    fallback_provider TEXT DEFAULT 'openai',
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    CONSTRAINT single_row_check CHECK (id = 1)
);

CREATE TABLE IF NOT EXISTS public.ai_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    provider TEXT NOT NULL,
    action_type TEXT NOT NULL, -- 'parse_text', 'receipt_ocr', 'voice_transcribe', 'financial_advisor'
    input_preview TEXT,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    duration_ms INTEGER DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('success', 'error', 'fallback')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- ------------------------------------------------------------------------------
-- 10. AUDIT LOGS (Untuk tracking impersonation & akses data transaksi user)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- 'impersonate_login', 'view_user_transactions', 'manual_payment_approval'
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- ------------------------------------------------------------------------------
-- 11. EXPORT LAPORAN & STORAGE METADATA
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.report_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL CHECK (report_type IN ('pdf', 'excel')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size_bytes INTEGER DEFAULT 0,
    download_url TEXT,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- ------------------------------------------------------------------------------
-- 12. MIDTRANS & PAYMENT TRANSACTIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    order_id TEXT NOT NULL UNIQUE,
    amount NUMERIC(15, 2) NOT NULL,
    plan TEXT NOT NULL CHECK (plan IN ('starter', 'pro')),
    payment_method TEXT NOT NULL, -- 'midtrans_qris', 'midtrans_bca_va', 'manual_transfer'
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    proof_image_url TEXT,
    admin_notes TEXT,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- ------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND is_superadmin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: user can read/update their own profile, admin can read all
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.is_superadmin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id OR public.is_superadmin());

-- Wallets: user owns wallets
DROP POLICY IF EXISTS "Users can manage own wallets" ON public.wallets;
CREATE POLICY "Users can manage own wallets" ON public.wallets
    FOR ALL USING (auth.uid() = user_id OR public.is_superadmin());

-- Categories: user can manage own categories + read defaults
DROP POLICY IF EXISTS "Users can manage own categories or read defaults" ON public.categories;
CREATE POLICY "Users can manage own categories or read defaults" ON public.categories
    FOR ALL USING (auth.uid() = user_id OR is_default = true OR public.is_superadmin());

-- Budgets: user owns budgets
DROP POLICY IF EXISTS "Users can manage own budgets" ON public.budgets;
CREATE POLICY "Users can manage own budgets" ON public.budgets
    FOR ALL USING (auth.uid() = user_id OR public.is_superadmin());

-- Transactions: user owns transactions
DROP POLICY IF EXISTS "Users can manage own transactions" ON public.transactions;
CREATE POLICY "Users can manage own transactions" ON public.transactions
    FOR ALL USING (auth.uid() = user_id OR public.is_superadmin());

-- Transaction items: user owns transaction items via transaction
DROP POLICY IF EXISTS "Users can manage own transaction items" ON public.transaction_items;
CREATE POLICY "Users can manage own transaction items" ON public.transaction_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.transactions 
            WHERE transactions.id = transaction_items.transaction_id 
            AND (transactions.user_id = auth.uid() OR public.is_superadmin())
        )
    );

-- Telegram connections & reminders
DROP POLICY IF EXISTS "Users can manage own telegram connection" ON public.telegram_connections;
CREATE POLICY "Users can manage own telegram connection" ON public.telegram_connections
    FOR ALL USING (auth.uid() = user_id OR public.is_superadmin());

DROP POLICY IF EXISTS "Users can manage own telegram reminders" ON public.telegram_reminders;
CREATE POLICY "Users can manage own telegram reminders" ON public.telegram_reminders
    FOR ALL USING (auth.uid() = user_id OR public.is_superadmin());

-- Report exports
DROP POLICY IF EXISTS "Users can view own report exports" ON public.report_exports;
CREATE POLICY "Users can view own report exports" ON public.report_exports
    FOR ALL USING (auth.uid() = user_id OR public.is_superadmin());

-- Payment transactions
DROP POLICY IF EXISTS "Users can view own payments" ON public.payment_transactions;
CREATE POLICY "Users can view own payments" ON public.payment_transactions
    FOR SELECT USING (auth.uid() = user_id OR public.is_superadmin());

-- Seed Default Categories & Initial AI Settings
INSERT INTO public.categories (name, type, emoji, color, is_default) VALUES
('Makanan & Minuman', 'expense', '🍜', '#F43F5E', true),
('Transportasi', 'expense', '🚗', '#FB7185', true),
('Belanja Kebutuhan', 'expense', '🛒', '#F472B6', true),
('Hiburan & Rekreasi', 'expense', '🎮', '#E11D48', true),
('Tagihan & Utilitas', 'expense', '🏠', '#BE123C', true),
('Kesehatan & Medis', 'expense', '💊', '#FDA4AF', true),
('Pendidikan & Buku', 'expense', '📚', '#FB116E', true),
('Gaji & Upah', 'income', '💰', '#10B981', true),
('Freelance & Proyek', 'income', '💻', '#059669', true),
('Investasi & Bunga', 'income', '📈', '#34D399', true)
ON CONFLICT DO NOTHING;

INSERT INTO public.ai_system_settings (id, mode, primary_provider, fallback_provider)
VALUES (1, 'parallel_failover', 'gemini', 'openai')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.ai_provider_configs (provider_name, is_active, priority, model_name) VALUES
('gemini', true, 1, 'gemini-2.0-flash'),
('openai', true, 2, 'gpt-4o-mini'),
('deepseek', true, 3, 'deepseek-chat')
ON CONFLICT (provider_name) DO NOTHING;


-- =============================================================================
-- BAGIAN: 20261014000000_part14_revisi_dosen.sql
-- =============================================================================

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
