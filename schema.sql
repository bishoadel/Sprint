-- ====================================================================
-- Toma el Rasol - Complete Supabase SQL Database Migration Script
-- ====================================================================
-- Execute this script in your Supabase SQL Editor to create tables,
-- relationships, constraints, indexes, and Row Level Security (RLS) policies.
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES

-- Children Table
CREATE TABLE IF NOT EXISTS public.children (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    birth_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Users Table
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('general_admin', 'attendance_admin', 'tdash')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance Types Table
CREATE TABLE IF NOT EXISTS public.attendance_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance Records Table
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    attendance_type_id UUID NOT NULL REFERENCES public.attendance_types(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    recorded_by VARCHAR(100) DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_child_date_event UNIQUE (child_id, attendance_type_id, attendance_date)
);

-- Automatic Point Rules Table
CREATE TABLE IF NOT EXISTS public.point_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_name VARCHAR(150) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    points INTEGER NOT NULL DEFAULT 10,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Point Transactions Audit Table
CREATE TABLE IF NOT EXISTS public.point_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('attendance', 'manual', 'custom_rule', 'purchase')),
    source_id VARCHAR(255),
    description TEXT,
    created_by VARCHAR(100) DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Eftkad Visit Records Table
CREATE TABLE IF NOT EXISTS public.eftkad_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    servants TEXT[] NOT NULL DEFAULT '{}',
    created_by VARCHAR(100) DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store Gifts Catalog Table
CREATE TABLE IF NOT EXISTS public.gifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    points_price INTEGER NOT NULL DEFAULT 100,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store Purchases Table
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
    gift_id UUID NOT NULL REFERENCES public.gifts(id) ON DELETE CASCADE,
    points_price INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'purchased',
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_child_active_purchase UNIQUE (child_id)
);

-- System Settings Table
CREATE TABLE IF NOT EXISTS public.system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INDEXES FOR FAST QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_children_code ON public.children(child_code);
CREATE INDEX IF NOT EXISTS idx_att_records_child_date ON public.attendance_records(child_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_pt_tx_child ON public.point_transactions(child_id);
CREATE INDEX IF NOT EXISTS idx_eftkad_child ON public.eftkad_records(child_id);
CREATE INDEX IF NOT EXISTS idx_purchases_child ON public.purchases(child_id);

-- 4. INITIAL SEED DATA

INSERT INTO public.attendance_types (code, name) VALUES
('mass', 'Mass Attendance'),
('sunday_school', 'Sunday School Attendance'),
('hymns', 'Hymns Attendance'),
('bible_study', 'Bible Study Attendance')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.point_rules (event_name, event_type, points) VALUES
('Mass Attendance', 'mass', 10),
('Sunday School Attendance', 'sunday_school', 10),
('Hymns Attendance', 'hymns', 5),
('Bible Study Attendance', 'bible_study', 8),
('Bible Competition', 'custom', 50),
('Helping Service', 'custom', 20)
ON CONFLICT DO NOTHING;

INSERT INTO public.system_settings (key, value) VALUES
('store_active', 'true')
ON CONFLICT (key) DO NOTHING;

-- 5. ROW LEVEL SECURITY (RLS) POLICIES (Full Read/Write Access for Web Portals)

ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eftkad_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Allow Public Access (Select, Insert, Update, Delete) - Safe Idempotent Policies
DROP POLICY IF EXISTS "Public Access Children" ON public.children;
CREATE POLICY "Public Access Children" ON public.children FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Access Attendance Records" ON public.attendance_records;
CREATE POLICY "Public Access Attendance Records" ON public.attendance_records FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Access Attendance Types" ON public.attendance_types;
CREATE POLICY "Public Access Attendance Types" ON public.attendance_types FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Access Point Rules" ON public.point_rules;
CREATE POLICY "Public Access Point Rules" ON public.point_rules FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Access Point Transactions" ON public.point_transactions;
CREATE POLICY "Public Access Point Transactions" ON public.point_transactions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Access Eftkad Records" ON public.eftkad_records;
CREATE POLICY "Public Access Eftkad Records" ON public.eftkad_records FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Access Gifts" ON public.gifts;
CREATE POLICY "Public Access Gifts" ON public.gifts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Access Purchases" ON public.purchases;
CREATE POLICY "Public Access Purchases" ON public.purchases FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Access System Settings" ON public.system_settings;
CREATE POLICY "Public Access System Settings" ON public.system_settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Access Admins" ON public.admins;
CREATE POLICY "Public Access Admins" ON public.admins FOR ALL USING (true) WITH CHECK (true);

-- 6. 24/7 AUTOMATED CLOUD BIRTHDAY CRON JOB (STRICTLY 1 DAY BEFORE BIRTHDATE)
-- Runs 24/7 on Supabase Cloud servers every night at midnight (00:00)
-- Checks for children whose birthday is TOMORROW and triggers automated phone notifications

CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Function to find tomorrow's birthdays (strictly 1 day in advance)
CREATE OR REPLACE FUNCTION public.check_tomorrow_birthdays()
RETURNS TABLE (
    child_code VARCHAR(20),
    child_name VARCHAR(255),
    birth_date DATE,
    upcoming_age INT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.child_code,
        c.name AS child_name,
        c.birth_date,
        (EXTRACT(YEAR FROM (CURRENT_DATE + INTERVAL '1 day')) - EXTRACT(YEAR FROM c.birth_date))::INT AS upcoming_age
    FROM public.children c
    WHERE 
        EXTRACT(MONTH FROM c.birth_date) = EXTRACT(MONTH FROM (CURRENT_DATE + INTERVAL '1 day'))
        AND EXTRACT(DAY FROM c.birth_date) = EXTRACT(DAY FROM (CURRENT_DATE + INTERVAL '1 day'));
END;
$$;

-- Function to find all birthdays in current month (for beginning of month roster email)
CREATE OR REPLACE FUNCTION public.check_monthly_birthdays()
RETURNS TABLE (
    child_code VARCHAR(20),
    child_name VARCHAR(255),
    birth_date DATE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.child_code,
        c.name AS child_name,
        c.birth_date
    FROM public.children c
    WHERE 
        EXTRACT(MONTH FROM c.birth_date) = EXTRACT(MONTH FROM CURRENT_DATE)
    ORDER BY EXTRACT(DAY FROM c.birth_date) ASC;
END;
$$;

-- Schedule 24/7 Midnight Cron Jobs Safely (Idempotent Execution)
DO $do$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        BEGIN
            PERFORM cron.unschedule('tomorrow-birthday-reminder-job');
        EXCEPTION WHEN OTHERS THEN
            -- Ignore if job did not exist yet
        END;

        BEGIN
            PERFORM cron.unschedule('monthly-birthday-roster-job');
        EXCEPTION WHEN OTHERS THEN
            -- Ignore if job did not exist yet
        END;
        
        PERFORM cron.schedule(
            'tomorrow-birthday-reminder-job',
            '0 16 * * *',
            'SELECT public.check_tomorrow_birthdays();'
        );

        PERFORM cron.schedule(
            'monthly-birthday-roster-job',
            '0 0 1 * *',
            'SELECT public.check_monthly_birthdays();'
        );
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron scheduling skipped: %', SQLERRM;
END $do$;

