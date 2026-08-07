-- ============ community_screenshots ============
CREATE TABLE public.community_screenshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  image_url text NOT NULL,
  biome text NOT NULL DEFAULT 'unknown',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_screenshots TO authenticated;
GRANT ALL ON public.community_screenshots TO service_role;
ALTER TABLE public.community_screenshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "screenshots readable by signed in users" ON public.community_screenshots FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert own screenshot" ON public.community_screenshots FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own screenshot" ON public.community_screenshots FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')) WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "delete own screenshot" ON public.community_screenshots FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_screenshots_updated BEFORE UPDATE ON public.community_screenshots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ community_likes ============
CREATE TABLE public.community_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  screenshot_id uuid NOT NULL REFERENCES public.community_screenshots(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (screenshot_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.community_likes TO authenticated;
GRANT ALL ON public.community_likes TO service_role;
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "likes readable by signed in users" ON public.community_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert own like" ON public.community_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete own like" ON public.community_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ feedback ============
CREATE TABLE public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'feedback',
  title text NOT NULL,
  detail text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback TO authenticated;
GRANT ALL ON public.feedback TO service_role;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own or admin feedback" ON public.feedback FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "insert own feedback" ON public.feedback FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins update feedback" ON public.feedback FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "admins delete feedback" ON public.feedback FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_feedback_updated BEFORE UPDATE ON public.feedback FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ announcements ============
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  audience text NOT NULL DEFAULT 'all',
  channel text NOT NULL DEFAULT 'in_app',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read published announcements" ON public.announcements FOR SELECT TO authenticated USING (published_at IS NOT NULL OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins insert announcements" ON public.announcements FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update announcements" ON public.announcements FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete announcements" ON public.announcements FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_announcements_updated BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ content_items ============
CREATE TABLE public.content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  kind text NOT NULL DEFAULT 'terrain',
  description text NOT NULL DEFAULT '',
  media_count integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_items TO authenticated;
GRANT SELECT ON public.content_items TO anon;
GRANT ALL ON public.content_items TO service_role;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads published content" ON public.content_items FOR SELECT USING (published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins insert content" ON public.content_items FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update content" ON public.content_items FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete content" ON public.content_items FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_content_updated BEFORE UPDATE ON public.content_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ security_events ============
CREATE TABLE public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'admin_action',
  actor text NOT NULL DEFAULT 'system',
  detail text NOT NULL DEFAULT '',
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.security_events TO authenticated;
GRANT ALL ON public.security_events TO service_role;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read security events" ON public.security_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins write security events" ON public.security_events FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ app_settings (singleton) ============
CREATE TABLE public.app_settings (
  id boolean PRIMARY KEY DEFAULT true,
  site_name text NOT NULL DEFAULT 'Terra Explorer',
  tagline text NOT NULL DEFAULT 'Explore Earth in stunning 3D',
  support_email text NOT NULL DEFAULT 'support@terraexplorer.app',
  primary_color text NOT NULL DEFAULT '#3ba9ff',
  theme text NOT NULL DEFAULT 'dark',
  maintenance_mode boolean NOT NULL DEFAULT false,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_settings_singleton CHECK (id)
);
GRANT SELECT, INSERT, UPDATE ON public.app_settings TO authenticated;
GRANT SELECT ON public.app_settings TO anon;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads app settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "admins insert app settings" ON public.app_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update app settings" ON public.app_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_app_settings_updated BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.app_settings (id, features) VALUES (true, '[{"key":"mods","label":"Community mods","enabled":true},{"key":"donations","label":"Donations","enabled":true},{"key":"multiplayer","label":"Multiplayer (beta)","enabled":false},{"key":"stl_export","label":"STL export","enabled":true},{"key":"community","label":"Community feed","enabled":true}]'::jsonb);

-- ============ moderation columns ============
ALTER TABLE public.mods ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.mods ADD COLUMN IF NOT EXISTS downloads integer NOT NULL DEFAULT 0;
ALTER TABLE public.mods ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country text;

-- ============ admin cross-user read policies ============
CREATE POLICY "admins view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "admins update profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins view all stats" ON public.user_stats FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "admins view all donations" ON public.donations FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins view all mods" ON public.mods FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "admins update all mods" ON public.mods FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "admins view all progress" ON public.user_progress FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- ============ leaderboard (safe public projection) ============
CREATE OR REPLACE FUNCTION public.get_leaderboard(_limit integer DEFAULT 20)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar_url text,
  distance_explored numeric,
  collectibles_found integer,
  terrains_generated integer,
  xp integer,
  level integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id,
         COALESCE(p.display_name, 'Explorer'),
         p.avatar_url,
         COALESCE(s.distance_explored, 0),
         COALESCE(s.collectibles_found, 0),
         COALESCE(s.terrains_generated, 0),
         COALESCE(g.xp, 0),
         COALESCE(g.level, 1)
    FROM public.profiles p
    LEFT JOIN public.user_stats s ON s.id = p.id
    LEFT JOIN public.user_progress g ON g.user_id = p.id
   WHERE COALESCE(p.status, 'active') = 'active'
   ORDER BY COALESCE(g.xp, 0) DESC, COALESCE(s.distance_explored, 0) DESC
   LIMIT GREATEST(1, LEAST(COALESCE(_limit, 20), 100));
$$;
REVOKE ALL ON FUNCTION public.get_leaderboard(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(integer) TO authenticated, service_role;

-- ============ admin user directory (includes email, admin only) ============
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id uuid,
  display_name text,
  email text,
  avatar_url text,
  status text,
  country text,
  registered_at timestamptz,
  last_login_at timestamptz,
  xp integer,
  role app_role
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  RETURN QUERY
  SELECT p.id,
         COALESCE(p.display_name, 'Explorer'),
         u.email::text,
         p.avatar_url,
         COALESCE(p.status, 'active'),
         p.country,
         p.created_at,
         u.last_sign_in_at,
         COALESCE(g.xp, 0),
         COALESCE(r.role, 'user'::app_role)
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    LEFT JOIN public.user_progress g ON g.user_id = p.id
    LEFT JOIN LATERAL (
      SELECT ur.role FROM public.user_roles ur
       WHERE ur.user_id = p.id
       ORDER BY CASE ur.role WHEN 'admin' THEN 1 WHEN 'moderator' THEN 2 ELSE 3 END
       LIMIT 1
    ) r ON true
   ORDER BY p.created_at DESC;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_list_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated, service_role;