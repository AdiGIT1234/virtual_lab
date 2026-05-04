-- ============================================================
-- Migration: quiz_attempts + saved_experiments enhancements
-- Run in: Supabase SQL Editor
-- ============================================================

-- 1. quiz_attempts — one row per quiz submission
-- A user can re-take a quiz; each attempt is its own row.
-- The LATEST row per (user_id, experiment_id, quiz_type) is
-- used for scoring in the admin dashboard.
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  experiment_id TEXT        NOT NULL,
  quiz_type     TEXT        NOT NULL CHECK (quiz_type IN ('pretest', 'posttest')),
  answers       JSONB       NOT NULL DEFAULT '[]',
  score         INTEGER     NOT NULL DEFAULT 0,
  total         INTEGER     NOT NULL DEFAULT 0,
  passed        BOOLEAN     GENERATED ALWAYS AS (score::float / NULLIF(total, 0) >= 0.7) STORED,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- RLS: users see only their own attempts; service role bypasses.
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_quiz_attempts"
  ON public.quiz_attempts FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS quiz_attempts_user_idx ON public.quiz_attempts (user_id);
CREATE INDEX IF NOT EXISTS quiz_attempts_exp_idx  ON public.quiz_attempts (experiment_id);
CREATE INDEX IF NOT EXISTS quiz_attempts_type_idx ON public.quiz_attempts (quiz_type);

-- 2. Extend saved_experiments with completion + time-tracking columns
ALTER TABLE public.saved_experiments
  ADD COLUMN IF NOT EXISTS completed      BOOLEAN     DEFAULT false,
  ADD COLUMN IF NOT EXISTS pretest_score  INTEGER,
  ADD COLUMN IF NOT EXISTS posttest_score INTEGER,
  ADD COLUMN IF NOT EXISTS time_spent_ms  INTEGER,
  ADD COLUMN IF NOT EXISTS last_tab       TEXT;         -- tracks how far the user got

-- 3. chat_sessions — optional but useful for support / RAG context
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  messages   JSONB       NOT NULL DEFAULT '[]',
  context    TEXT,       -- e.g. experiment_id or 'sandbox'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_chats"
  ON public.chat_sessions FOR ALL
  USING  (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE INDEX IF NOT EXISTS chat_sessions_user_idx ON public.chat_sessions (user_id);
