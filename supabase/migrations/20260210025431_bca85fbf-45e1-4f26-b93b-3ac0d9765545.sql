
-- Create storage bucket for assets (profile photos, company logos)
INSERT INTO storage.buckets (id, name, public) VALUES ('assets', 'assets', true);

-- Allow anyone to view files (public bucket)
CREATE POLICY "Public read access" ON storage.objects FOR SELECT USING (bucket_id = 'assets');

-- Allow authenticated company members to upload files to their company folder
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'assets' AND auth.uid() IS NOT NULL
);

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update" ON storage.objects FOR UPDATE USING (
  bucket_id = 'assets' AND auth.uid() IS NOT NULL
);

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete" ON storage.objects FOR DELETE USING (
  bucket_id = 'assets' AND auth.uid() IS NOT NULL
);
