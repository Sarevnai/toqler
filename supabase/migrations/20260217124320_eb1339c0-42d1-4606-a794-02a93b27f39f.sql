ALTER TABLE public.profile_layouts
  ADD COLUMN IF NOT EXISTS show_bio boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_contact boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_social boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_video boolean NOT NULL DEFAULT true;