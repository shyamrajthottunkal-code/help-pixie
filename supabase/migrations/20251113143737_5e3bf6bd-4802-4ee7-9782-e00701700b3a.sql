-- Create storage bucket for complaint attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'complaint-attachments',
  'complaint-attachments',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/x-msvideo', 'application/pdf']
);

-- Allow users to upload their own complaint attachments
CREATE POLICY "Users can upload complaint attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'complaint-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own complaint attachments
CREATE POLICY "Users can view their own complaint attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'complaint-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow staff and admins to view all complaint attachments
CREATE POLICY "Staff and admins can view all complaint attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'complaint-attachments' AND
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
);

-- Allow users to delete their own complaint attachments
CREATE POLICY "Users can delete their own complaint attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'complaint-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);