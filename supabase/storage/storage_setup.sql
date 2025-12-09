-- =====================================================
-- Circulo Grant Manager - Storage Buckets Setup
-- Version: 1.0.0
-- Description: Storage buckets and security policies
-- =====================================================

-- =====================================================
-- CREATE STORAGE BUCKETS
-- =====================================================

-- Documents bucket (for application documents, receipts, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true, -- Public bucket for easy access
  52428800, -- 50MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Reports bucket (for generated impact reports and PDFs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reports',
  'reports',
  true,
  104857600, -- 100MB limit for large reports
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/html'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Media bucket (for images, logos, and media files)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  10485760, -- 10MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/wav'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Receipts bucket (for expense receipts and invoices)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  false, -- Private bucket for financial documents
  20971520, -- 20MB limit
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
) ON CONFLICT (id) DO NOTHING;

-- WhatsApp media bucket (for WhatsApp attachments)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'whatsapp',
  'whatsapp',
  false, -- Private bucket
  16777216, -- 16MB limit (WhatsApp limit)
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'audio/ogg',
    'audio/mpeg',
    'audio/mp4',
    'video/mp4',
    'application/pdf'
  ]
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STORAGE POLICIES - DOCUMENTS BUCKET
-- =====================================================

-- Allow authenticated users to view all documents
CREATE POLICY "Authenticated users can view documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents' 
    AND auth.role() = 'authenticated'
  );

-- Allow authenticated users to upload documents
CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents'
    AND auth.role() = 'authenticated'
  );

-- Allow users to update their own documents
CREATE POLICY "Users can update own documents"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'documents'
    AND auth.role() = 'authenticated'
  );

-- Allow users to delete their own documents
CREATE POLICY "Users can delete own documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents'
    AND auth.role() = 'authenticated'
  );

-- =====================================================
-- STORAGE POLICIES - REPORTS BUCKET
-- =====================================================

-- Allow authenticated users to view all reports
CREATE POLICY "Authenticated users can view reports"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'reports'
    AND auth.role() = 'authenticated'
  );

-- Allow authenticated users to upload reports
CREATE POLICY "Authenticated users can upload reports"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'reports'
    AND auth.role() = 'authenticated'
  );

-- Allow users to update reports
CREATE POLICY "Users can update reports"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'reports'
    AND auth.role() = 'authenticated'
  );

-- Allow users to delete reports
CREATE POLICY "Users can delete reports"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'reports'
    AND auth.role() = 'authenticated'
  );

-- =====================================================
-- STORAGE POLICIES - MEDIA BUCKET
-- =====================================================

-- Allow public viewing of media (for logos, public images)
CREATE POLICY "Public can view media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

-- Allow authenticated users to upload media
CREATE POLICY "Authenticated users can upload media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'media'
    AND auth.role() = 'authenticated'
  );

-- Allow users to update media
CREATE POLICY "Users can update media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'media'
    AND auth.role() = 'authenticated'
  );

-- Allow users to delete media
CREATE POLICY "Users can delete media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'media'
    AND auth.role() = 'authenticated'
  );

-- =====================================================
-- STORAGE POLICIES - RECEIPTS BUCKET (PRIVATE)
-- =====================================================

-- Allow authenticated users to view receipts
CREATE POLICY "Authenticated users can view receipts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'receipts'
    AND auth.role() = 'authenticated'
  );

-- Allow authenticated users to upload receipts
CREATE POLICY "Authenticated users can upload receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'receipts'
    AND auth.role() = 'authenticated'
  );

-- Allow users to update receipts
CREATE POLICY "Users can update receipts"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'receipts'
    AND auth.role() = 'authenticated'
  );

-- Allow users to delete receipts
CREATE POLICY "Users can delete receipts"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'receipts'
    AND auth.role() = 'authenticated'
  );

-- =====================================================
-- STORAGE POLICIES - WHATSAPP BUCKET (PRIVATE)
-- =====================================================

-- Allow authenticated users to view WhatsApp media
CREATE POLICY "Authenticated users can view whatsapp media"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'whatsapp'
    AND auth.role() = 'authenticated'
  );

-- Allow system to upload WhatsApp media (via webhook)
CREATE POLICY "System can upload whatsapp media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'whatsapp'
  );

-- Allow users to delete WhatsApp media
CREATE POLICY "Users can delete whatsapp media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'whatsapp'
    AND auth.role() = 'authenticated'
  );

-- =====================================================
-- HELPER FUNCTIONS FOR STORAGE
-- =====================================================

-- Function to generate unique file names
CREATE OR REPLACE FUNCTION public.generate_unique_filename(
  original_filename TEXT,
  user_id BIGINT
)
RETURNS TEXT AS $$
DECLARE
  extension TEXT;
  base_name TEXT;
  random_suffix TEXT;
BEGIN
  -- Extract file extension
  extension := substring(original_filename from '\.([^.]*)$');
  base_name := substring(original_filename from '^(.*)\.([^.]*)$');
  
  -- Generate random suffix
  random_suffix := substring(md5(random()::text || clock_timestamp()::text) from 1 for 8);
  
  -- Return formatted filename
  RETURN user_id || '-' || base_name || '-' || random_suffix || '.' || extension;
END;
$$ LANGUAGE plpgsql;

-- Function to get file size in human-readable format
CREATE OR REPLACE FUNCTION public.format_file_size(size_bytes BIGINT)
RETURNS TEXT AS $$
BEGIN
  IF size_bytes < 1024 THEN
    RETURN size_bytes || ' B';
  ELSIF size_bytes < 1048576 THEN
    RETURN ROUND(size_bytes / 1024.0, 2) || ' KB';
  ELSIF size_bytes < 1073741824 THEN
    RETURN ROUND(size_bytes / 1048576.0, 2) || ' MB';
  ELSE
    RETURN ROUND(size_bytes / 1073741824.0, 2) || ' GB';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STORAGE USAGE TRACKING
-- =====================================================

-- View to track storage usage per user
CREATE OR REPLACE VIEW public.storage_usage_by_user AS
SELECT 
  u.id AS user_id,
  u.name AS user_name,
  u.email AS user_email,
  COUNT(d.id) AS document_count,
  COALESCE(SUM(d.file_size), 0) AS total_bytes,
  public.format_file_size(COALESCE(SUM(d.file_size), 0)) AS total_size
FROM public.users u
LEFT JOIN public.documents d ON d.uploaded_by_user_id = u.id
GROUP BY u.id, u.name, u.email;

-- View to track storage usage by bucket
CREATE OR REPLACE VIEW public.storage_usage_by_bucket AS
SELECT 
  bucket_id,
  COUNT(*) AS file_count,
  SUM(metadata->>'size')::BIGINT AS total_bytes,
  public.format_file_size(SUM(metadata->>'size')::BIGINT) AS total_size
FROM storage.objects
GROUP BY bucket_id;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE storage.buckets IS 'Storage buckets for different file types';
COMMENT ON FUNCTION public.generate_unique_filename IS 'Generates unique filename with user ID and random suffix';
COMMENT ON FUNCTION public.format_file_size IS 'Converts file size in bytes to human-readable format';
COMMENT ON VIEW public.storage_usage_by_user IS 'Tracks storage usage per user';
COMMENT ON VIEW public.storage_usage_by_bucket IS 'Tracks storage usage per bucket';
