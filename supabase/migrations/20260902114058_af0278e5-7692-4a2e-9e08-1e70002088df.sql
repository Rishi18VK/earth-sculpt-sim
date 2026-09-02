CREATE TABLE public.model_customizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  location_id text NOT NULL,
  model_id text NOT NULL DEFAULT 'default',
  name text NOT NULL DEFAULT 'Custom Version',
  configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_shared boolean NOT NULL DEFAULT false,
  share_token text NOT NULL DEFAULT encode(gen_random_bytes(12), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX model_customizations_share_token_idx ON public.model_customizations (share_token);
CREATE INDEX model_customizations_user_idx ON public.model_customizations (user_id, location_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.model_customizations TO authenticated;
GRANT SELECT ON public.model_customizations TO anon;
GRANT ALL ON public.model_customizations TO service_role;

ALTER TABLE public.model_customizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own customizations"
  ON public.model_customizations FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Shared customizations are publicly readable"
  ON public.model_customizations FOR SELECT TO anon, authenticated
  USING (is_shared = true);

CREATE TRIGGER update_model_customizations_updated_at
  BEFORE UPDATE ON public.model_customizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();