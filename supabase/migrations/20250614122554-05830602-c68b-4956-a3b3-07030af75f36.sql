
-- Create storage policies for the bucket (in case they don't exist)
DO $$ 
BEGIN
  -- Try to create the upload policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow public uploads to infant-images'
  ) THEN
    CREATE POLICY "Allow public uploads to infant-images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'infant-images');
  END IF;

  -- Try to create the access policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow public access to infant-images'
  ) THEN
    CREATE POLICY "Allow public access to infant-images" ON storage.objects
    FOR SELECT USING (bucket_id = 'infant-images');
  END IF;
END $$;

-- Update the existing infants table to ensure all required columns
ALTER TABLE public.infants 
ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Make id the primary key if it isn't already
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'infants_pkey'
  ) THEN
    ALTER TABLE public.infants ADD PRIMARY KEY (id);
  END IF;
END $$;

-- Ensure the table has the correct structure
ALTER TABLE public.infants 
ALTER COLUMN age TYPE INTEGER,
ALTER COLUMN height TYPE DOUBLE PRECISION,
ALTER COLUMN weight TYPE DOUBLE PRECISION,
ALTER COLUMN front_url TYPE TEXT,
ALTER COLUMN left_url TYPE TEXT,
ALTER COLUMN right_url TYPE TEXT;

-- Add RLS policies for the infants table
ALTER TABLE public.infants ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'infants' 
    AND policyname = 'Allow public inserts to infants'
  ) THEN
    CREATE POLICY "Allow public inserts to infants" ON public.infants
    FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'infants' 
    AND policyname = 'Allow public reads from infants'
  ) THEN
    CREATE POLICY "Allow public reads from infants" ON public.infants
    FOR SELECT USING (true);
  END IF;
END $$;
