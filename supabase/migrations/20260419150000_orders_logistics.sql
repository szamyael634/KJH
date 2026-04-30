-- Order status enum
DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'paid', 'in_transit', 'delivered', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id uuid REFERENCES public.profiles(id) NOT NULL,
  rider_id uuid REFERENCES public.profiles(id),
  total_amount numeric NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  stripe_session_id text UNIQUE,
  created_at timestamp with time zone DEFAULT now()
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) NOT NULL,
  seller_id uuid REFERENCES public.profiles(id) NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price_at_purchase numeric NOT NULL
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Policies for Orders
DROP POLICY IF EXISTS "Buyers can view their own orders." ON public.orders;
CREATE POLICY "Buyers can view their own orders."
  ON public.orders FOR SELECT
  USING ( auth.uid() = buyer_id );

DROP POLICY IF EXISTS "Riders can view orders available for pickup or assigned to them." ON public.orders;
CREATE POLICY "Riders can view orders available for pickup or assigned to them."
  ON public.orders FOR SELECT
  USING ( 
    status = 'paid' OR 
    (rider_id = auth.uid() AND status = 'in_transit') 
  );

DROP POLICY IF EXISTS "Riders can update orders they have claimed." ON public.orders;
CREATE POLICY "Riders can update orders they have claimed."
  ON public.orders FOR UPDATE
  USING ( rider_id = auth.uid() OR (status = 'paid') );

-- Policies for Order Items
DROP POLICY IF EXISTS "Buyers can view their own order items." ON public.order_items;
CREATE POLICY "Buyers can view their own order items."
  ON public.order_items FOR SELECT
  USING ( 
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.buyer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Sellers can view items sold by them." ON public.order_items;
CREATE POLICY "Sellers can view items sold by them."
  ON public.order_items FOR SELECT
  USING ( seller_id = auth.uid() );

-- Function to decrement product stock
CREATE OR REPLACE FUNCTION decrement_stock(p_id uuid, p_qty integer)
RETURNS void AS $$
BEGIN
  UPDATE public.products
  SET stock = stock - p_qty
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
