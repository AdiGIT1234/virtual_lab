-- ============================================================
-- Migration 003: Base tables that migrations 001 and 002
-- assumed already existed but never created.
--
-- Run BEFORE 001 and 002 (or on a fresh project alongside them
-- — all statements are idempotent / IF NOT EXISTS safe).
--
-- Run in: Supabase SQL Editor  (Project → SQL Editor → New query)
-- ============================================================


-- ── 1. profiles ─────────────────────────────────────────────────────────────
-- Stores display name + institute for each authenticated user.
-- `id` mirrors auth.users(id) so you can JOIN freely.

CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        DEFAULT '',
  institute   TEXT        DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own profile
DROP POLICY IF EXISTS "profiles_self_select" ON public.profiles;
CREATE POLICY "profiles_self_select"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_self_insert" ON public.profiles;
CREATE POLICY "profiles_self_insert"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
CREATE POLICY "profiles_self_update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Service role (backend / admin portal) can read all profiles
DROP POLICY IF EXISTS "profiles_service_read" ON public.profiles;
CREATE POLICY "profiles_service_read"
  ON public.profiles FOR SELECT
  TO service_role
  USING (true);

-- Auto-update updated_at on every change
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ── 2. Auto-create profile on sign-up ───────────────────────────────────────
-- When a user signs up Supabase inserts into auth.users.
-- This trigger immediately creates the matching profiles row using
-- the name/institute they passed in signUp({ options: { data: {...} } }).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, institute)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name',      ''),
    COALESCE(NEW.raw_user_meta_data->>'institute',  '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ── 3. saved_experiments ─────────────────────────────────────────────────────
-- Persists a student's in-progress and completed experiment state.
-- Migration 001 only does ALTER TABLE on this, assuming it exists first.

CREATE TABLE IF NOT EXISTS public.saved_experiments (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  experiment_id  TEXT        NOT NULL,
  title          TEXT        DEFAULT '',
  code           TEXT        DEFAULT '',
  result_json    JSONB,
  -- progress columns (also in migration 001 ADD COLUMN IF NOT EXISTS — idempotent)
  completed      BOOLEAN     DEFAULT false,
  pretest_score  INTEGER,
  posttest_score INTEGER,
  time_spent_ms  INTEGER,
  last_tab       TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now(),
  -- Unique constraint required by every upsert({ onConflict: "user_id,experiment_id" })
  CONSTRAINT saved_experiments_user_exp_unique UNIQUE (user_id, experiment_id)
);

ALTER TABLE public.saved_experiments ENABLE ROW LEVEL SECURITY;

-- Students can fully manage their own rows
DROP POLICY IF EXISTS "saved_exp_self_all" ON public.saved_experiments;
CREATE POLICY "saved_exp_self_all"
  ON public.saved_experiments FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can read all rows (admin activity tab)
DROP POLICY IF EXISTS "saved_exp_service_read" ON public.saved_experiments;
CREATE POLICY "saved_exp_service_read"
  ON public.saved_experiments FOR SELECT
  TO service_role
  USING (true);

DROP TRIGGER IF EXISTS saved_experiments_updated_at ON public.saved_experiments;
CREATE TRIGGER saved_experiments_updated_at
  BEFORE UPDATE ON public.saved_experiments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS saved_exp_user_idx ON public.saved_experiments (user_id);
CREATE INDEX IF NOT EXISTS saved_exp_exp_idx  ON public.saved_experiments (experiment_id);


-- ── 4. Backfill profiles for any users who signed up before this trigger ──
-- Safe no-op if profiles table was already populated.
INSERT INTO public.profiles (id, name, institute)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'name',     ''),
  COALESCE(u.raw_user_meta_data->>'institute', '')
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;
