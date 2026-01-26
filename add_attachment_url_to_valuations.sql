-- Add attachment_url column to valuations table
ALTER TABLE valuations ADD COLUMN IF NOT EXISTS attachment_url text;

-- Policy to allow public to upload to valuation-images bucket
-- Note: Buckets often need to be created in the Storage dashboard, but we can set policies if it exists.
-- This assumes 'valuation-images' bucket exists.

-- Allow public uploads to 'valuation-images' bucket
create policy "Public Access to Valuation Images"
on storage.objects for insert
to public
with check ( bucket_id = 'valuation-images' );

-- Allow public to select (view) their own uploaded images (or make it public)
create policy "Public Read Valuation Images"
on storage.objects for select
to public
using ( bucket_id = 'valuation-images' );
