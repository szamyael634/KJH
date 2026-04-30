-- 1. Profiles Extension
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS middle_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS suffix text,
ADD COLUMN IF NOT EXISTS dob date,
ADD COLUMN IF NOT EXISTS address_json jsonb,
ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS username text UNIQUE,
ADD COLUMN IF NOT EXISTS display_name text,
ADD COLUMN IF NOT EXISTS is_warned boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false;

-- 2. System Banners
CREATE TABLE IF NOT EXISTS public.banners (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url text NOT NULL,
  title text,
  link_url text,
  active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Banners are viewable by everyone" ON public.banners;
CREATE POLICY "Banners are viewable by everyone" ON public.banners FOR SELECT USING (active = true);
DROP POLICY IF EXISTS "Admins can manage banners" ON public.banners;
CREATE POLICY "Admins can manage banners" ON public.banners FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 3. Product Variations
CREATE TABLE IF NOT EXISTS public.product_variations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL, -- e.g., "Size: XL"
  price numeric NOT NULL,
  stock integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Variations viewable by everyone" ON public.product_variations;
CREATE POLICY "Variations viewable by everyone" ON public.product_variations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Sellers can manage their own variations" ON public.product_variations;
CREATE POLICY "Sellers can manage their own variations" ON public.product_variations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND seller_id = auth.uid())
);

-- 4. Product Tags
CREATE TABLE IF NOT EXISTS public.product_tags (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  tag text NOT NULL,
  UNIQUE(product_id, tag)
);

ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tags viewable by everyone" ON public.product_tags;
CREATE POLICY "Tags viewable by everyone" ON public.product_tags FOR SELECT USING (true);

-- 5. Ticketing System
CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL, -- e.g., 'Payment', 'Seller Help', 'Report'
  subject text NOT NULL,
  status text DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved', 'closed')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id uuid REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  image_url text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see their own tickets" ON public.tickets;
CREATE POLICY "Users can see their own tickets" ON public.tickets FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can see all tickets" ON public.tickets;
CREATE POLICY "Admins can see all tickets" ON public.tickets FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
DROP POLICY IF EXISTS "Users can see messages for their tickets" ON public.ticket_messages;
CREATE POLICY "Users can see messages for their tickets" ON public.ticket_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.tickets WHERE id = ticket_id AND user_id = auth.uid())
);

-- 6. Verification Documents
CREATE TABLE IF NOT EXISTS public.verification_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  document_url text NOT NULL,
  type text NOT NULL, -- e.g., 'ID', 'Permit'
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can see their own docs" ON public.verification_documents;
CREATE POLICY "Users can see their own docs" ON public.verification_documents FOR SELECT USING (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Admins can manage docs" ON public.verification_documents;
CREATE POLICY "Admins can manage docs" ON public.verification_documents FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 7. Search Suggestions RPC
CREATE OR REPLACE FUNCTION public.get_search_suggestions(query text)
RETURNS TABLE (
  id uuid,
  title text,
  type text,
  image_url text
) AS $$
BEGIN
  RETURN QUERY
    -- Products
    (SELECT p.id, p.title, 'product'::text as type, p.image_url 
     FROM public.products p 
     WHERE p.title ILIKE '%' || query || '%' 
     LIMIT 3)
    UNION ALL
    -- Stores/Sellers
    (SELECT pr.id, COALESCE(pr.store_name, pr.full_name) as title, pr.role as type, COALESCE(pr.store_logo_url, pr.avatar_url) as image_url
     FROM public.profiles pr 
     WHERE (pr.store_name ILIKE '%' || query || '%' OR pr.full_name ILIKE '%' || query || '%')
     AND pr.role IN ('seller', 'rider')
     LIMIT 3);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
