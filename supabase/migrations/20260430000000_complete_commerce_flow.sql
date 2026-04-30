-- Complete commerce flow support for buyer, seller, rider, and admin workflows.

ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'awaiting_seller_confirmation';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'preparing';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'ready_for_pickup';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'assigned';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'arrived_at_seller';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'arrived_at_delivery';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'buyer_confirmed';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'completed';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'delivery_attempted';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'return_requested';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'return_approved';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'return_in_transit';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'returned';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'refunded';

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS store_banner_url text,
ADD COLUMN IF NOT EXISTS store_address_json jsonb,
ADD COLUMN IF NOT EXISTS rider_status text DEFAULT 'offline' CHECK (rider_status IN ('offline', 'available', 'on_delivery')),
ADD COLUMN IF NOT EXISTS rating_avg numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating_count integer DEFAULT 0;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS weight_kg numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS dimensions_json jsonb;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS subtotal_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS shipping_fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS platform_commission_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS seller_payout_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS rider_fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS escrow_status text DEFAULT 'held' CHECK (escrow_status IN ('held', 'released', 'refunded', 'disputed')),
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'card',
ADD COLUMN IF NOT EXISTS shipping_option text DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS delivery_address jsonb,
ADD COLUMN IF NOT EXISTS seller_confirm_by timestamp with time zone,
ADD COLUMN IF NOT EXISTS seller_confirmed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS ready_for_pickup_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS assigned_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS rider_arrived_seller_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS picked_up_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS rider_arrived_delivery_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS delivered_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS buyer_confirmed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS cancellation_reason text,
ADD COLUMN IF NOT EXISTS delivery_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_issue_note text,
ADD COLUMN IF NOT EXISTS return_window_ends_at timestamp with time zone;

CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now()
);

INSERT INTO public.platform_settings (key, value)
VALUES
  ('commission', '{"rate": 0.10}'::jsonb),
  ('shipping', '{"standard": 5, "express": 12}'::jsonb),
  ('returns', '{"window_days": 7}'::jsonb),
  ('escrow', '{"auto_confirm_hours": 48}'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance numeric NOT NULL DEFAULT 0,
  pending_balance numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wallet_ledger (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id uuid REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  entry_type text NOT NULL CHECK (entry_type IN ('seller_payout', 'rider_fee', 'commission', 'refund', 'adjustment')),
  amount numeric NOT NULL,
  note text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.return_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  buyer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  seller_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  rider_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason text NOT NULL,
  evidence_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'disputed', 'rejected', 'picked_up', 'returned', 'refunded')),
  seller_response text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.service_reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  reviewer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  target_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('seller', 'rider')),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  response text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(order_id, reviewer_id, target_id, target_type)
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Buyers can create their own orders." ON public.orders;
CREATE POLICY "Buyers can create their own orders." ON public.orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Sellers can view orders containing their items." ON public.orders;
CREATE POLICY "Sellers can view orders containing their items." ON public.orders FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.order_items
    WHERE order_items.order_id = orders.id
      AND order_items.seller_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Sellers can update orders containing their items." ON public.orders;
CREATE POLICY "Sellers can update orders containing their items." ON public.orders FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.order_items
    WHERE order_items.order_id = orders.id
      AND order_items.seller_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Buyers can confirm their own orders." ON public.orders;
CREATE POLICY "Buyers can confirm their own orders." ON public.orders FOR UPDATE USING (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Buyers can create order items for their orders." ON public.order_items;
CREATE POLICY "Buyers can create order items for their orders." ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
      AND orders.buyer_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can view their own wallet." ON public.wallets;
CREATE POLICY "Users can view their own wallet." ON public.wallets FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own wallet ledger." ON public.wallet_ledger;
CREATE POLICY "Users can view their own wallet ledger." ON public.wallet_ledger FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.wallets WHERE wallets.id = wallet_id AND wallets.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can manage wallets." ON public.wallets;
CREATE POLICY "Admins can manage wallets." ON public.wallets FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can manage wallet ledger." ON public.wallet_ledger;
CREATE POLICY "Admins can manage wallet ledger." ON public.wallet_ledger FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Users can view related return requests." ON public.return_requests;
CREATE POLICY "Users can view related return requests." ON public.return_requests FOR SELECT USING (
  auth.uid() IN (buyer_id, seller_id, rider_id)
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Buyers can create return requests." ON public.return_requests;
CREATE POLICY "Buyers can create return requests." ON public.return_requests FOR INSERT WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Sellers and admins can update return requests." ON public.return_requests;
CREATE POLICY "Sellers and admins can update return requests." ON public.return_requests FOR UPDATE USING (
  auth.uid() = seller_id
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Service reviews are publicly viewable." ON public.service_reviews;
CREATE POLICY "Service reviews are publicly viewable." ON public.service_reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Buyers can write service reviews for their orders." ON public.service_reviews;
CREATE POLICY "Buyers can write service reviews for their orders." ON public.service_reviews FOR INSERT WITH CHECK (
  auth.uid() = reviewer_id
  AND EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND buyer_id = auth.uid() AND status IN ('delivered', 'buyer_confirmed', 'completed'))
);

DROP POLICY IF EXISTS "Platform settings are public." ON public.platform_settings;
CREATE POLICY "Platform settings are public." ON public.platform_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage platform settings." ON public.platform_settings;
CREATE POLICY "Admins can manage platform settings." ON public.platform_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE OR REPLACE FUNCTION public.ensure_wallet(p_user_id uuid)
RETURNS uuid AS $$
DECLARE
  v_wallet_id uuid;
BEGIN
  INSERT INTO public.wallets (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO UPDATE SET updated_at = now()
  RETURNING id INTO v_wallet_id;

  RETURN v_wallet_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.release_order_payouts(p_order_id uuid)
RETURNS void AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_seller record;
  v_seller_wallet uuid;
  v_rider_wallet uuid;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;

  IF v_order.id IS NULL OR v_order.escrow_status <> 'held' THEN
    RETURN;
  END IF;

  FOR v_seller IN
    SELECT seller_id, SUM(price_at_purchase * quantity) AS gross_amount
    FROM public.order_items
    WHERE order_id = p_order_id
    GROUP BY seller_id
  LOOP
    v_seller_wallet := public.ensure_wallet(v_seller.seller_id);

    UPDATE public.wallets
    SET balance = balance + GREATEST(v_seller.gross_amount - (v_seller.gross_amount * 0.10), 0),
        updated_at = now()
    WHERE id = v_seller_wallet;

    INSERT INTO public.wallet_ledger (wallet_id, order_id, entry_type, amount, note)
    VALUES (v_seller_wallet, p_order_id, 'seller_payout', GREATEST(v_seller.gross_amount - (v_seller.gross_amount * 0.10), 0), 'Escrow released to seller');
  END LOOP;

  IF v_order.rider_id IS NOT NULL AND v_order.rider_fee > 0 THEN
    v_rider_wallet := public.ensure_wallet(v_order.rider_id);

    UPDATE public.wallets
    SET balance = balance + v_order.rider_fee,
        updated_at = now()
    WHERE id = v_rider_wallet;

    INSERT INTO public.wallet_ledger (wallet_id, order_id, entry_type, amount, note)
    VALUES (v_rider_wallet, p_order_id, 'rider_fee', v_order.rider_fee, 'Delivery fee credited');
  END IF;

  UPDATE public.orders
  SET escrow_status = 'released',
      status = 'completed',
      completed_at = now()
  WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
