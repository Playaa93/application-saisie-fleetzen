-- Policies pour le bucket intervention-photos

-- Policy 1: Permettre à tout le monde d'uploader des photos
CREATE POLICY "Allow public uploads"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'intervention-photos');

-- Policy 2: Permettre à tout le monde de lire les photos
CREATE POLICY "Allow public reads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'intervention-photos');

-- Policy 3: Permettre la suppression (optionnel, pour cleanup)
CREATE POLICY "Allow authenticated deletes"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'intervention-photos');
