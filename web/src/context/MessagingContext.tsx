'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { getMessages, getUserRooms, sendMessage } from '@/app/actions/chat'

type Message = {
  id: string
  chat_room_id: string
  sender_id: string
  content: string
  image_url: string | null
  created_at: string
}

type Room = {
  id: string
  otherParticipant: any
  lastMessage: Message | null
  unreadCount: number
}

type MessagingContextType = {
  rooms: Room[]
  activeRoomId: string | null
  setActiveRoomId: (id: string | null) => void
  messages: Message[]
  send: (roomId: string, senderId: string, content: string, imageUrl?: string) => Promise<void>
  isChatOpen: boolean
  setIsChatOpen: (open: boolean) => void
  userId: string | null
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined)

export function MessagingProvider({ children, userId }: { children: React.ReactNode, userId: string | null }) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isChatOpen, setIsChatOpen] = useState(false)
  const supabase = createClient()

  const refreshRooms = useCallback(async () => {
    if (!userId) return
    const { data } = await getUserRooms(userId)
    setRooms(data || [])
  }, [userId])

  // 1. Fetch initial rooms
  useEffect(() => {
    refreshRooms()
  }, [refreshRooms])

  // 2. Fetch initial messages when room changes
  useEffect(() => {
    if (activeRoomId) {
      getMessages(activeRoomId).then(({ data }) => {
        setMessages(data || [])
      })
    } else {
      setMessages([])
    }
  }, [activeRoomId])

  // 3. Send Message Function
  const send = async (roomId: string, senderId: string, content: string, imageUrl?: string) => {
    const { error } = await sendMessage(roomId, senderId, content, imageUrl)
    if (error) {
       console.error("Message send failed:", error)
       return
    }
    // Optimistic update or refresh messages
    refreshRooms()
  }

  // 4. Setup Real-time listener
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('realtime_messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMessage = payload.new as Message
          
          if (newMessage.chat_room_id === activeRoomId) {
            setMessages((prev) => [...prev, newMessage])
          }
          
          // Always refresh rooms to update "last message"
          refreshRooms()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, activeRoomId, refreshRooms])

  return (
    <MessagingContext.Provider
      value={{
        rooms,
        activeRoomId,
        setActiveRoomId,
        messages,
        send,
        isChatOpen,
        setIsChatOpen,
        userId
      }}
    >
      {children}
    </MessagingContext.Provider>
  )
}

export function useMessaging() {
  const context = useContext(MessagingContext)
  if (context === undefined) {
    throw new Error('useMessaging must be used within a MessagingProvider')
  }
  return context
}
