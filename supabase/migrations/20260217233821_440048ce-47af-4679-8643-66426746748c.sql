
ALTER TABLE public.profiles
ADD COLUMN photo_offset_x integer NOT NULL DEFAULT 50,
ADD COLUMN photo_offset_y integer NOT NULL DEFAULT 30;
