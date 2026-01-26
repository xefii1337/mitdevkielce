-- Create the storage bucket 'valuation-images'
insert into storage.buckets (id, name, public)
values ('valuation-images', 'valuation-images', true)
on conflict (id) do nothing;

-- Ensure public access policies exist (re-applying just in case)
create policy "Public Access to Valuation Images"
on storage.objects for insert
to public
with check ( bucket_id = 'valuation-images' );

create policy "Public Read Valuation Images"
on storage.objects for select
to public
using ( bucket_id = 'valuation-images' );
