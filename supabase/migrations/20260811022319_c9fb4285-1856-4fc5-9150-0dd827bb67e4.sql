-- 1. Remove client write paths on progression tables
DROP POLICY IF EXISTS "own progress insert" ON public.user_progress;
DROP POLICY IF EXISTS "own progress update" ON public.user_progress;
DROP POLICY IF EXISTS "own ach insert" ON public.user_achievements;
DROP POLICY IF EXISTS "own daily insert" ON public.daily_rewards_log;

REVOKE INSERT, UPDATE, DELETE ON public.user_progress FROM authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON public.user_achievements FROM authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON public.daily_rewards_log FROM authenticated, anon;

GRANT SELECT ON public.user_progress TO authenticated;
GRANT SELECT ON public.user_achievements TO authenticated;
GRANT SELECT ON public.daily_rewards_log TO authenticated;
GRANT ALL ON public.user_progress TO service_role;
GRANT ALL ON public.user_achievements TO service_role;
GRANT ALL ON public.daily_rewards_log TO service_role;

-- 2. SECURITY DEFINER functions must not be callable by API roles.
REVOKE ALL ON FUNCTION public.get_leaderboard(integer) FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.admin_list_users() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO service_role;