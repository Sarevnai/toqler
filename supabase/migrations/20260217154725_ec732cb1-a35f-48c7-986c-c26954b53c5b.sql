ALTER TABLE profile_layouts
  ADD COLUMN accent_color text NOT NULL DEFAULT '#D4E84B',
  ADD COLUMN bg_color text NOT NULL DEFAULT '#f5f4f0',
  ADD COLUMN card_color text NOT NULL DEFAULT '#ffffff',
  ADD COLUMN text_color text NOT NULL DEFAULT '#1a1a1a',
  ADD COLUMN font_family text NOT NULL DEFAULT 'Inter';