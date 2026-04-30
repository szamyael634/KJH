-- 1. Chat Rooms
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Chat Participants
CREATE TABLE IF NOT EXISTS public.chat_participants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_room_id uuid REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(chat_room_id, user_id)
);

ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view rooms they are in." ON public.chat_participants;
CREATE POLICY "Users can view rooms they are in." ON public.chat_participants FOR SELECT USING ( auth.uid() = user_id );

-- 3. Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_room_id uuid REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text,
  image_url text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view messages in their rooms." ON public.messages;
CREATE POLICY "Users can view messages in their rooms." 
  ON public.messages FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.chat_participants WHERE chat_room_id = messages.chat_room_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can send messages to their rooms." ON public.messages;
CREATE POLICY "Users can send messages to their rooms." 
  ON public.messages FOR INSERT 
  WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.chat_participants WHERE chat_room_id = messages.chat_room_id AND user_id = auth.uid()));

-- Enable Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;

-- 4. Storage Bucket for Chat Attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Chat Attachments View" ON storage.objects;
CREATE POLICY "Public Chat Attachments View"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'chat-attachments' );

DROP POLICY IF EXISTS "Authenticated Users can Upload Chat Attachments" ON storage.objects;
CREATE POLICY "Authenticated Users can Upload Chat Attachments"
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'chat-attachments' AND auth.uid() IS NOT NULL );
