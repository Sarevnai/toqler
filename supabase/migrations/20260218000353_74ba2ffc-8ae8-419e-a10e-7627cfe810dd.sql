
ALTER TABLE public.profile_layouts
  ADD COLUMN button_color text NOT NULL DEFAULT '#D4E84B',
  ADD COLUMN button_text_color text NOT NULL DEFAULT '#1a1a1a',
  ADD COLUMN cover_url text,
  ADD COLUMN bg_image_url text;
