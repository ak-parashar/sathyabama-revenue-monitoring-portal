
-- Fix: Restrict activity_logs INSERT to only system/trigger context
-- The actual inserts come from SECURITY DEFINER trigger functions,
-- so we restrict direct user inserts to only their own user_id
DROP POLICY "System can insert activity logs" ON public.activity_logs;

CREATE POLICY "Users can insert own activity logs"
  ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
