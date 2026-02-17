
ALTER TABLE public.profiles ADD COLUMN email text;
ALTER TABLE public.companies ADD COLUMN tagline text DEFAULT 'We connect. For real.';
