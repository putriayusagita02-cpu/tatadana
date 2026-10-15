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
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.is_superadmin());

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id OR public.is_superadmin());

-- Wallets: user owns wallets
CREATE POLICY "Users can manage own wallets" ON public.wallets
    FOR ALL USING (auth.uid() = user_id OR public.is_superadmin());

-- Categories: user can manage own categories + read defaults
CREATE POLICY "Users can manage own categories or read defaults" ON public.categories
    FOR ALL USING (auth.uid() = user_id OR is_default = true OR public.is_superadmin());

-- Budgets: user owns budgets
CREATE POLICY "Users can manage own budgets" ON public.budgets
    FOR ALL USING (auth.uid() = user_id OR public.is_superadmin());

-- Transactions: user owns transactions
CREATE POLICY "Users can manage own transactions" ON public.transactions
    FOR ALL USING (auth.uid() = user_id OR public.is_superadmin());

-- Transaction items: user owns transaction items via transaction
CREATE POLICY "Users can manage own transaction items" ON public.transaction_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.transactions 
            WHERE transactions.id = transaction_items.transaction_id 
            AND (transactions.user_id = auth.uid() OR public.is_superadmin())
        )
    );

-- Telegram connections & reminders
CREATE POLICY "Users can manage own telegram connection" ON public.telegram_connections
    FOR ALL USING (auth.uid() = user_id OR public.is_superadmin());

CREATE POLICY "Users can manage own telegram reminders" ON public.telegram_reminders
    FOR ALL USING (auth.uid() = user_id OR public.is_superadmin());

-- Report exports
CREATE POLICY "Users can view own report exports" ON public.report_exports
    FOR ALL USING (auth.uid() = user_id OR public.is_superadmin());

-- Payment transactions
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
