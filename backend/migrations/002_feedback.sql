-- Migration 002: user feedback table
-- Run once in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS feedback (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  experiment_id text,
  rating      int         CHECK (rating >= 1 AND rating <= 5),
  message     text        NOT NULL,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own rows
CREATE POLICY IF NOT EXISTS "feedback_insert" ON feedback
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own feedback
CREATE POLICY IF NOT EXISTS "feedback_select_own" ON feedback
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
