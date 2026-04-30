-- Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications." ON public.notifications;
CREATE POLICY "Users can view their own notifications."
  ON public.notifications FOR SELECT
  USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can update their own notifications." ON public.notifications;
CREATE POLICY "Users can update their own notifications."
  ON public.notifications FOR UPDATE
  USING ( auth.uid() = user_id );

-- Enable Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- 1. Trigger for Buyers (Order Status Updates)
CREATE OR REPLACE FUNCTION public.handle_buyer_notification()
RETURNS trigger AS $$
BEGIN
  IF (OLD.status IS DISTINCT FROM NEW.status) THEN
    IF (NEW.status = 'paid') THEN
      INSERT INTO public.notifications (user_id, title, message)
      VALUES (NEW.buyer_id, 'Payment Successful', 'Your order #' || substring(NEW.id::text, 1, 8) || ' has been confirmed!');
    ELSIF (NEW.status = 'in_transit') THEN
      INSERT INTO public.notifications (user_id, title, message)
      VALUES (NEW.buyer_id, 'Order Shipped', 'Your order #' || substring(NEW.id::text, 1, 8) || ' is on its way!');
    ELSIF (NEW.status = 'delivered') THEN
      INSERT INTO public.notifications (user_id, title, message)
      VALUES (NEW.buyer_id, 'Order Delivered', 'Great news! Your order #' || substring(NEW.id::text, 1, 8) || ' has been delivered.');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_status_update ON public.orders;
CREATE TRIGGER on_order_status_update
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE public.handle_buyer_notification();

-- 2. Trigger for Sellers (New Sales)
CREATE OR REPLACE FUNCTION public.handle_seller_notification()
RETURNS trigger AS $$
DECLARE
  v_buyer_name text;
BEGIN
  -- We notify sellers when an order is MARKED as 'paid'
  -- This handles the case where orders are updated to paid via webhook
  IF (NEW.status = 'paid' AND (OLD.status IS DISTINCT FROM NEW.status)) THEN
    SELECT full_name INTO v_buyer_name FROM public.profiles WHERE id = NEW.buyer_id;
    
    -- Insert a notification for every UNIQUE seller in this order
    INSERT INTO public.notifications (user_id, title, message)
    SELECT DISTINCT seller_id, 'New Sale!', 'You have a new order from ' || COALESCE(v_buyer_name, 'a customer') || '. Check your dashboard!'
    FROM public.order_items
    WHERE order_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_item_created ON public.order_items;
DROP TRIGGER IF EXISTS on_order_paid_seller_notify ON public.orders;
CREATE TRIGGER on_order_paid_seller_notify
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE public.handle_seller_notification();
