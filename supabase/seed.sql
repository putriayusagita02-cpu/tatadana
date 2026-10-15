-- ==============================================================================
-- TATADANA SEED DATA
-- File: supabase/seed.sql
-- Digunakan untuk instant testing database Supabase lokal/cloud
-- ==============================================================================

-- 1. Insert Profile Demo (Dimas Kurniawan)
INSERT INTO public.profiles (
    id, full_name, email, phone_number, phone_verified, default_currency, subscription_plan, subscription_status, is_superadmin
) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Dimas Kurniawan',
    'dimas@tatadana.id',
    '+6281234567890',
    true,
    'IDR',
    'pro',
    'active',
    true
) ON CONFLICT (id) DO NOTHING;

-- 2. Insert Wallets
INSERT INTO public.wallets (
    id, user_id, name, alias, type, balance, is_default_telegram, color
) VALUES
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'BCA Utama', 'bca', 'bank', 5240000, true, '#F43F5E'),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b02', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'GoPay', 'gopay', 'ewallet', 420000, false, '#FB7185'),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b03', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Uang Tunai (Cash)', 'cash', 'cash', 250000, false, '#FDA4AF'),
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b04', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Mandiri Livin', 'mandiri', 'bank', 1850000, false, '#E11D48')
ON CONFLICT (id) DO NOTHING;

-- 3. Jatah Settings
INSERT INTO public.jatah_settings (
    user_id, payday_date, monthly_savings_target, enable_rollover
) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 25, 500000, true
) ON CONFLICT (user_id) DO NOTHING;

-- 4. Recurring Bills
INSERT INTO public.bills (
    id, user_id, name, amount, due_day, is_paid_this_cycle
) VALUES
(gen_random_uuid(), 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Kos Bulanan', 1800000, 20, false),
(gen_random_uuid(), 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Listrik PLN & Air', 350000, 18, false),
(gen_random_uuid(), 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Internet Wifi', 300000, 15, true)
ON CONFLICT DO NOTHING;

-- 5. Streaks
INSERT INTO public.streaks (
    user_id, current_streak_days, longest_streak_days, last_logged_date, badges
) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    12,
    18,
    CURRENT_DATE,
    '["streak_3", "streak_7"]'::jsonb
) ON CONFLICT (user_id) DO NOTHING;
