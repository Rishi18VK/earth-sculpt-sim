
-- 1. mods UPDATE policy: add WITH CHECK
DROP POLICY IF EXISTS "Users can update own mods" ON public.mods;
CREATE POLICY "Users can update own mods" ON public.mods
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Revoke EXECUTE on SECURITY DEFINER trigger function from public roles
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 3. Hide public tables from pg_graphql (REST/PostgREST still works)
REVOKE USAGE ON SCHEMA graphql FROM anon, authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA graphql FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA graphql FROM anon, authenticated;

-- 4. Remove broad anon SELECT on storage.objects for mods bucket (stops listing).
-- Public bucket direct URLs (via /object/public/...) continue to work without this policy.
DROP POLICY IF EXISTS "Public can read mod files" ON storage.objects;
