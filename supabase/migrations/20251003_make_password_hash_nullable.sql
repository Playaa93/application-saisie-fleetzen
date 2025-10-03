-- Migration: Make password_hash nullable in agents table
-- Reason: Auth is now handled by Supabase Auth (auth.users), password_hash is legacy

ALTER TABLE agents
ALTER COLUMN password_hash DROP NOT NULL;

-- Add comment explaining the change
COMMENT ON COLUMN agents.password_hash IS 'Legacy field - Authentication is now handled by Supabase Auth. This field is kept for backwards compatibility but is no longer required.';
