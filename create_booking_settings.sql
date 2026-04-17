-- Skrypt tworzący tabelę booking_settings
CREATE TABLE IF NOT EXISTS public.booking_settings (
    id integer PRIMARY KEY DEFAULT 1,
    default_start_hour numeric NOT NULL DEFAULT 8.0,
    default_end_hour numeric NOT NULL DEFAULT 18.0,
    closed_days jsonb NOT NULL DEFAULT '[]'::jsonb,
    custom_dates jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Zapewnij, że zawsze będzie tylko jeden rekord z ID = 1
ALTER TABLE public.booking_settings ADD CONSTRAINT booking_settings_single_row CHECK (id = 1);

-- Wstaw początkowy rekord konfiguracyjny (jeśli puste)
INSERT INTO public.booking_settings (id, default_start_hour, default_end_hour, closed_days, custom_dates)
VALUES (1, 8.0, 18.0, '[]'::jsonb, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Konfiguracja zabezpieczeń (Row Level Security)
ALTER TABLE public.booking_settings ENABLE ROW LEVEL SECURITY;

-- Każdy (klient) może ODCZYTAĆ ustawienia
CREATE POLICY "Public read access for booking_settings" 
ON public.booking_settings FOR SELECT 
TO public 
USING (true);

-- Tylko administratorzy mogą aktualizować ustawienia
CREATE POLICY "Admin update access for booking_settings"
ON public.booking_settings FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- Tylko administratorzy mogą wstawiać ustawienia
CREATE POLICY "Admin insert access for booking_settings"
ON public.booking_settings FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);
