-- Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policies for Products Table
CREATE POLICY "Allow public read access" ON public.products
    FOR SELECT USING (true);

CREATE POLICY "Allow admin insert" ON public.products
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );

CREATE POLICY "Allow admin update" ON public.products
    FOR UPDATE USING (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );

CREATE POLICY "Allow admin delete" ON public.products
    FOR DELETE USING (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );

-- Storage Bucket for Product Images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Admin Upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images' 
    AND auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );

CREATE POLICY "Admin Delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images' 
    AND auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );
