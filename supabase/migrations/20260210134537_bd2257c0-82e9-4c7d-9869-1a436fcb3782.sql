
ALTER TABLE public.nfc_cards ADD COLUMN slug text;
ALTER TABLE public.nfc_cards ADD COLUMN slug_locked boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX idx_nfc_cards_slug ON public.nfc_cards(slug) WHERE slug IS NOT NULL;

-- Allow public slug resolution for NFC redirect (unauthenticated visitors)
CREATE POLICY "Public slug resolution" ON public.nfc_cards
  FOR SELECT USING (slug IS NOT NULL);
