
-- Add slug column to companies
ALTER TABLE public.companies ADD COLUMN slug text;

-- Create unique index
CREATE UNIQUE INDEX companies_slug_unique ON public.companies (slug);

-- Populate existing companies with slug derived from name
UPDATE public.companies 
SET slug = lower(
  regexp_replace(
    regexp_replace(
      translate(name, 'áàãâéèêíìîóòõôúùûçÁÀÃÂÉÈÊÍÌÎÓÒÕÔÚÙÛÇ', 'aaaaeeeiiioooouuucAAAAEEEIIIOOOOUUUC'),
      '[^a-zA-Z0-9\s-]', '', 'g'
    ),
    '\s+', '-', 'g'
  )
);

-- Create trigger function to auto-generate slug on insert
CREATE OR REPLACE FUNCTION public.generate_company_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(
      regexp_replace(
        regexp_replace(
          translate(NEW.name, 'áàãâéèêíìîóòõôúùûçÁÀÃÂÉÈÊÍÌÎÓÒÕÔÚÙÛÇ', 'aaaaeeeiiioooouuucAAAAEEEIIIOOOOUUUC'),
          '[^a-zA-Z0-9\s-]', '', 'g'
        ),
        '\s+', '-', 'g'
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_company_slug
BEFORE INSERT ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.generate_company_slug();
