-- Run this script in your Supabase SQL Editor

-- 1. Create Profiles Table (to store user name)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Create Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    "ID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    "Tanggal" TEXT,
    "Waktu" TEXT,
    "Tipe" TEXT,
    "Kategori" TEXT,
    "Nominal" NUMERIC,
    "Catatan" TEXT
);

-- 3. Create Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    "ID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    "Nama" TEXT,
    "Icon" TEXT,
    "Warna" TEXT,
    "is_default" BOOLEAN DEFAULT FALSE
);

-- 4. Create Budgets Table
CREATE TABLE IF NOT EXISTS public.budgets (
    "ID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    "Kategori" TEXT,
    "Nominal" NUMERIC,
    "Timestamp" TEXT
);

-- 5. Create Agendas Table
CREATE TABLE IF NOT EXISTS public.agendas (
    "ID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    "Title" TEXT,
    "Date" TEXT,
    "Priority" TEXT,
    "Notes" TEXT,
    "IsCompleted" BOOLEAN DEFAULT FALSE
);

-- 6. Set up RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;

-- 6.1 Create Allowed Users Table (Whitelist)
CREATE TABLE IF NOT EXISTS public.allowed_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.allowed_users ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies to avoid errors on re-run
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Allow authenticated users to read whitelist" ON public.allowed_users;
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
    DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
    DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
    DROP POLICY IF EXISTS "Users can manage their own transactions" ON public.transactions;
    DROP POLICY IF EXISTS "Users can view default categories or their own" ON public.categories;
    DROP POLICY IF EXISTS "Users can manage their own categories" ON public.categories;
    DROP POLICY IF EXISTS "Users can manage their own budgets" ON public.budgets;
    DROP POLICY IF EXISTS "Users can manage their own agendas" ON public.agendas;
END $$;

-- Re-create policies
CREATE POLICY "Allow authenticated users to read whitelist" ON public.allowed_users
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage their own transactions" ON public.transactions 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view default categories or their own" ON public.categories 
    FOR SELECT USING (is_default = true OR auth.uid() = user_id);
CREATE POLICY "Users can manage their own categories" ON public.categories 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own budgets" ON public.budgets 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own agendas" ON public.agendas 
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. Insert Default Categories (Using ON CONFLICT to avoid duplicates)
INSERT INTO public.categories ("Nama", "Icon", "Warna", "is_default") 
VALUES 
('Food', 'Utensils', 'text-primary', true),
('Household', 'Home', 'text-tertiary', true),
('Kids', 'Baby', 'text-secondary', true),
('Skincare', 'Sparkles', 'text-primary', true),
('Transport', 'Car', 'text-tertiary', true),
('Savings', 'PiggyBank', 'text-secondary', true)
ON CONFLICT DO NOTHING;

-- 7.1 Insert Whitelist Users
INSERT INTO public.allowed_users (email) VALUES ('rizqofadhilah@gmail.com')
ON CONFLICT DO NOTHING;

-- 8. Trigger for creating a profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger BEFORE creating to avoid the "already exists" error
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
