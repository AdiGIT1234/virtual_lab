-- ============================================================
-- Migration 001: experiments table + quiz_attempts + progress
-- Run in: Supabase SQL Editor  (Project → SQL Editor → New query)
-- ============================================================

-- ── 1. Master experiment definitions ────────────────────────────────────────
-- Mirrors the JSON files in backend/data/experiments/*.json
-- Populated by running: python backend/migrate_experiments.py

CREATE TABLE IF NOT EXISTS public.experiments (
  id          TEXT        PRIMARY KEY,          -- e.g. "exp01_led_blinking"
  title       TEXT        NOT NULL,
  difficulty  TEXT        NOT NULL DEFAULT 'Beginner',
  aim         TEXT,
  objective   TEXT,
  theory      TEXT,                             -- HTML allowed
  procedure   JSONB       DEFAULT '[]',         -- array of step strings
  pretest     JSONB       DEFAULT '[]',         -- array of question objects
  posttest    JSONB       DEFAULT '[]',         -- array of question objects
  feedback    TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Public read (anyone can load experiments), service role manages writes
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "experiments_public_read"
  ON public.experiments FOR SELECT
  USING (true);

-- Trigger: auto-update updated_at on every row update
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS experiments_updated_at ON public.experiments;
CREATE TRIGGER experiments_updated_at
  BEFORE UPDATE ON public.experiments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ── 2. Quiz attempts ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  experiment_id TEXT        NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
  quiz_type     TEXT        NOT NULL CHECK (quiz_type IN ('pretest', 'posttest')),
  answers       JSONB       NOT NULL DEFAULT '[]',
  score         INTEGER     NOT NULL DEFAULT 0,
  total         INTEGER     NOT NULL DEFAULT 0,
  passed        BOOLEAN     GENERATED ALWAYS AS (
                  score::float / NULLIF(total, 0) >= 0.7
                ) STORED,
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_quiz_attempts"
  ON public.quiz_attempts FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS quiz_attempts_user_idx ON public.quiz_attempts (user_id);
CREATE INDEX IF NOT EXISTS quiz_attempts_exp_idx  ON public.quiz_attempts (experiment_id);


-- ── 3. saved_experiments — add completion + progress columns ─────────────────
ALTER TABLE public.saved_experiments
  ADD COLUMN IF NOT EXISTS completed       BOOLEAN     DEFAULT false,
  ADD COLUMN IF NOT EXISTS pretest_score   INTEGER,
  ADD COLUMN IF NOT EXISTS posttest_score  INTEGER,
  ADD COLUMN IF NOT EXISTS time_spent_ms   INTEGER,
  ADD COLUMN IF NOT EXISTS last_tab        TEXT;


-- ── 4. chat_sessions (optional) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  messages   JSONB       NOT NULL DEFAULT '[]',
  context    TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_chats"
  ON public.chat_sessions FOR ALL
  USING  (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
