
ALTER TABLE public.profile_layouts
  ADD COLUMN icon_bg_color text NOT NULL DEFAULT '#f5f4f0',
  ADD COLUMN icon_color text NOT NULL DEFAULT '#1a1a1a';
