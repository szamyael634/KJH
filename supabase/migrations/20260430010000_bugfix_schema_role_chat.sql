-- Bugfix hardening for deployed schema cache, role signup, and chat RLS.

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS subtotal_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS shipping_fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS platform_commission_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS seller_payout_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS rider_fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS escrow_status text DEFAULT 'held',
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

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS store_banner_url text,
ADD COLUMN IF NOT EXISTS store_address_json jsonb,
ADD COLUMN IF NOT EXISTS rider_status text DEFAULT 'offline',
ADD COLUMN IF NOT EXISTS rating_avg numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating_count integer DEFAULT 0;

ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create chat rooms." ON public.chat_rooms;
CREATE POLICY "Users can create chat rooms." ON public.chat_rooms FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view rooms they participate in." ON public.chat_rooms;
CREATE POLICY "Users can view rooms they participate in." ON public.chat_rooms FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants
    WHERE chat_participants.chat_room_id = chat_rooms.id
      AND chat_participants.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can add themselves to chat rooms." ON public.chat_participants;
CREATE POLICY "Users can add themselves to chat rooms." ON public.chat_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add other chat participants." ON public.chat_participants;
CREATE POLICY "Users can add other chat participants." ON public.chat_participants FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_participants existing
    WHERE existing.chat_room_id = chat_participants.chat_room_id
      AND existing.user_id = auth.uid()
  )
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  assigned_role user_role;
BEGIN
  BEGIN
    assigned_role := (new.raw_user_meta_data->>'role')::user_role;
  EXCEPTION WHEN OTHERS THEN
    assigned_role := 'buyer'::user_role;
  END;

  IF assigned_role IS NULL THEN
    assigned_role := 'buyer'::user_role;
  END IF;

  INSERT INTO public.profiles (
    id,
    role,
    full_name,
    avatar_url,
    first_name,
    middle_name,
    last_name,
    suffix,
    dob,
    username,
    display_name,
    address_json,
    store_name,
    store_description,
    store_logo_url,
    store_banner_url,
    store_address_json,
    verification_status
  )
  VALUES (
    new.id,
    assigned_role,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'display_name'),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'middle_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'suffix',
    NULLIF(new.raw_user_meta_data->>'dob', '')::date,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'display_name',
    COALESCE(new.raw_user_meta_data->'address_json', '{}'::jsonb),
    new.raw_user_meta_data->>'store_name',
    new.raw_user_meta_data->>'store_description',
    new.raw_user_meta_data->>'store_logo_url',
    new.raw_user_meta_data->>'store_banner_url',
    COALESCE(new.raw_user_meta_data->'store_address_json', new.raw_user_meta_data->'address_json', '{}'::jsonb),
    CASE WHEN assigned_role IN ('seller', 'rider') THEN 'pending' ELSE 'approved' END
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    address_json = COALESCE(public.profiles.address_json, EXCLUDED.address_json),
    store_address_json = COALESCE(public.profiles.store_address_json, EXCLUDED.store_address_json);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

NOTIFY pgrst, 'reload schema';
