'use client'

import { createClient } from '@/utils/supabase/client'

/**
 * Ensures a chat room exists between two users.
 * Returns the chat room ID.
 */
export async function getOrCreateChatRoom(user1Id: string, user2Id: string) {
  const supabase = createClient()

  // 1. Find a room where both are participants
  const { data: rooms } = await supabase
    .from('chat_participants')
    .select('chat_room_id')
    .eq('user_id', user1Id)

  if (rooms && rooms.length > 0) {
     const roomIds = rooms.map(r => r.chat_room_id)
     const { data: commonRooms } = await supabase
        .from('chat_participants')
        .select('chat_room_id')
        .in('chat_room_id', roomIds)
        .eq('user_id', user2Id)
        .maybeSingle()

     if (commonRooms) return commonRooms.chat_room_id
  }

  // 2. Create new room if none exists
  const { data: newRoom, error: roomError } = await supabase
    .from('chat_rooms')
    .insert({})
    .select()
    .single()

  if (roomError) throw roomError

  // 3. Add participants
  await supabase.from('chat_participants').insert([
    { chat_room_id: newRoom.id, user_id: user1Id },
    { chat_room_id: newRoom.id, user_id: user2Id }
  ])

  return newRoom.id
}

export async function sendMessage(roomId: string, senderId: string, content: string, imageUrl?: string) {
  const supabase = createClient()
  return await supabase
    .from('messages')
    .insert({
      chat_room_id: roomId,
      sender_id: senderId,
      content,
      image_url: imageUrl
    })
}

export async function getMessages(roomId: string) {
  const supabase = createClient()
  return await supabase
    .from('messages')
    .select('*')
    .eq('chat_room_id', roomId)
    .order('created_at', { ascending: true })
}
