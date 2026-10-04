CREATE TABLE public.discord_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  title text NOT NULL,
  status text NOT NULL,
  http_status integer,
  error text,
  duration_ms integer,
  triggered_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.discord_deliveries TO authenticated;
GRANT ALL ON public.discord_deliveries TO service_role;
ALTER TABLE public.discord_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read deliveries" ON public.discord_deliveries FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX discord_deliveries_created_idx ON public.discord_deliveries (created_at DESC);

ALTER TABLE public.feedback
  ADD COLUMN ai_summary text,
  ADD COLUMN ai_category text,
  ADD COLUMN ai_priority text,
  ADD COLUMN ai_rationale text,
  ADD COLUMN ai_actions jsonb,
  ADD COLUMN triaged_at timestamptz;