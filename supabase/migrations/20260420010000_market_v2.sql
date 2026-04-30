-- 1. Store Profiles Enhancement
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS store_name text,
ADD COLUMN IF NOT EXISTS store_description text,
ADD COLUMN IF NOT EXISTS store_logo_url text;

-- 2. Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reviews are viewable by everyone." ON public.reviews;
CREATE POLICY "Reviews are viewable by everyone." ON public.reviews FOR SELECT USING ( true );
DROP POLICY IF EXISTS "Authenticated users can write reviews." ON public.reviews;
CREATE POLICY "Authenticated users can write reviews." ON public.reviews FOR INSERT WITH CHECK ( auth.uid() = user_id );

-- 3. Wishlist Table
CREATE TABLE IF NOT EXISTS public.wishlist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own wishlist." ON public.wishlist;
CREATE POLICY "Users can manage their own wishlist." ON public.wishlist FOR ALL USING ( auth.uid() = user_id );

-- 4. Vouchers Table
CREATE TABLE IF NOT EXISTS public.vouchers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text UNIQUE NOT NULL,
  discount_type text CHECK (discount_type IN ('percent', 'fixed')) NOT NULL,
  discount_value numeric NOT NULL,
  seller_id uuid REFERENCES public.profiles(id), -- NULL means global
  expires_at timestamp with time zone,
  usage_limit integer DEFAULT 100,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Vouchers are viewable by everyone." ON public.vouchers;
CREATE POLICY "Vouchers are viewable by everyone." ON public.vouchers FOR SELECT USING ( true );

-- 5. Product Rating Aggregation
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS avg_rating numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0;

-- Function to update product rating
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE') THEN
    UPDATE public.products
    SET 
      avg_rating = (SELECT COALESCE(AVG(rating), 0) FROM public.reviews WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)),
      review_count = (SELECT COUNT(*) FROM public.reviews WHERE product_id = COALESCE(NEW.product_id, OLD.product_id))
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_change ON public.reviews;
CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE PROCEDURE public.update_product_rating();
