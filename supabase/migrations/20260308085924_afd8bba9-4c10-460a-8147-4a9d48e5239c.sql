
-- Create mods table for cloud persistence
CREATE TABLE public.mods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  author TEXT NOT NULL DEFAULT 'Unknown',
  description TEXT DEFAULT '',
  mod_type TEXT NOT NULL DEFAULT 'player',
  config JSONB NOT NULL DEFAULT '{}',
  model_path TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mods ENABLE ROW LEVEL SECURITY;

-- Users can read their own mods
CREATE POLICY "Users can read own mods" ON public.mods
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own mods
CREATE POLICY "Users can insert own mods" ON public.mods
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own mods
CREATE POLICY "Users can update own mods" ON public.mods
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own mods
CREATE POLICY "Users can delete own mods" ON public.mods
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create storage bucket for mod files
INSERT INTO storage.buckets (id, name, public)
VALUES ('mods', 'mods', true);

-- Storage policies
CREATE POLICY "Authenticated users can upload mod files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'mods' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read own mod files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'mods' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public can read mod files"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'mods');

CREATE POLICY "Users can delete own mod files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'mods' AND (storage.foldername(name))[1] = auth.uid()::text);
