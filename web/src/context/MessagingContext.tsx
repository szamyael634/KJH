'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { getMessages } from '@/app/actions/chat'

type Message = {
  id: string
  chat_room_id: string
  sender_id: string
  content: string
  image_url: string | null
  created_at: string
}

type MessagingContextType = {
  activeRoomId: string | null
  setActiveRoomId: (id: string | null) => void
  messages: Message[]
  isChatOpen: boolean
  setIsChatOpen: (open: boolean) => void
  userId: string | null
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined)

export function MessagingProvider({ children, userId }: { children: React.ReactNode, userId: string | null }) {
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isChatOpen, setIsChatOpen] = useState(false)
  const supabase = createClient()

  // 1. Fetch initial messages when room changes
  useEffect(() => {
    if (activeRoomId) {
      getMessages(activeRoomId).then(({ data }) => {
        setMessages(data || [])
      })
    } else {
      setMessages([])
    }
  }, [activeRoomId])

  // 2. Setup Real-time listener for current user's rooms
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('realtime_messages')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages' 
        },
        (payload) => {
          const newMessage = payload.new as Message
          // Add message only if it belongs to the active room
          if (newMessage.chat_room_id === activeRoomId) {
              setMessages((prev) => [...prev, newMessage])
          }
          // If the chat is closed, we could show a toast or play a sound here
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, activeRoomId])

  return (
    <MessagingContext.Provider
      value={{
        activeRoomId,
        setActiveRoomId,
        messages,
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
