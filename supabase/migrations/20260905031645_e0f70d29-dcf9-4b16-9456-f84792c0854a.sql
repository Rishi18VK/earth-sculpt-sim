CREATE TABLE public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid,
  actor_label text NOT NULL DEFAULT 'system',
  source text NOT NULL DEFAULT 'web',
  action text NOT NULL,
  target_type text,
  target_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'success',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.admin_audit_logs TO authenticated;
GRANT ALL ON public.admin_audit_logs TO service_role;

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit logs"
  ON public.admin_audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_admin_audit_logs_created_at ON public.admin_audit_logs (created_at DESC);
CREATE INDEX idx_admin_audit_logs_action ON public.admin_audit_logs (action);
CREATE INDEX idx_admin_audit_logs_actor ON public.admin_audit_logs (actor_user_id);

CREATE TABLE public.discord_admin_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_user_id text NOT NULL UNIQUE,
  discord_username text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note text,
  active boolean NOT NULL DEFAULT true,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.discord_admin_links TO authenticated;
GRANT ALL ON public.discord_admin_links TO service_role;

ALTER TABLE public.discord_admin_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read discord links"
  ON public.discord_admin_links FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can add discord links"
  ON public.discord_admin_links FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update discord links"
  ON public.discord_admin_links FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete discord links"
  ON public.discord_admin_links FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_discord_admin_links_discord_user_id ON public.discord_admin_links (discord_user_id);

CREATE TRIGGER trg_discord_links_updated
  BEFORE UPDATE ON public.discord_admin_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();