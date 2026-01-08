-- Add location column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS location TEXT;

-- Create Product Images Table
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on product_images
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Policies for Product Images
CREATE POLICY "Allow public read access" ON public.product_images
    FOR SELECT USING (true);

CREATE POLICY "Allow admin insert" ON public.product_images
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );

CREATE POLICY "Allow admin delete" ON public.product_images
    FOR DELETE USING (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );
