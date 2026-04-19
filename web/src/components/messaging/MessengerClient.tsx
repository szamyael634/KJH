'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  MessageSquare, 
  UserPlus, 
  MoreVertical, 
  Send, 
  Image as ImageIcon,
  ChevronLeft,
  Plus
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useMessaging } from '@/context/MessagingContext'
import { createClient } from '@/utils/supabase/client'

export default function MessengerClient({ userId }: { userId: string }) {
  const supabase = createClient()
  const { rooms, activeRoomId, setActiveRoomId, messages, send } = useMessaging()
  const [searchTerm, setSearchTerm] = useState('')
  const [messageInput, setMessageInput] = useState('')
  const [showSidebar, setShowSidebar] = useState(true)

  // Auto-hide sidebar on mobile if rooms are selected
  useEffect(() => {
    if (activeRoomId && window.innerWidth < 768) {
      setShowSidebar(false)
    }
  }, [activeRoomId])

  const activeRoom = rooms.find(r => r.id === activeRoomId)
  
  const handleSend = async () => {
    if (!messageInput.trim() || !activeRoomId) return
    await send(activeRoomId, userId, messageInput)
    setMessageInput('')
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar - Chat List */}
      <div className={cn(
        "w-full md:w-96 flex flex-col border-r border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all",
        !showSidebar && "hidden md:flex"
      )}>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Messages</h1>
            <Button variant="ghost" size="icon" className="rounded-full">
               <Plus className="w-5 h-5" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search conversations..." 
              className="pl-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-6 space-y-1">
          {rooms.map((room) => {
            const lastMessage = room.lastMessage
            return (
              <button
                key={room.id}
                onClick={() => setActiveRoomId(room.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-4 rounded-2xl transition-all group",
                  activeRoomId === room.id 
                    ? "bg-indigo-50 dark:bg-indigo-900/20" 
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border-2 border-transparent group-hover:border-indigo-200">
                  {room.otherParticipant?.avatar_url ? (
                    <img src={room.otherParticipant.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <UserPlus className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className={cn(
                      "text-sm font-black truncate",
                      activeRoomId === room.id ? "text-indigo-600 dark:text-indigo-400" : "text-slate-900 dark:text-white"
                    )}>
                      {room.otherParticipant?.display_name || room.otherParticipant?.full_name || 'Anonymous User'}
                    </h3>
                    {lastMessage && (
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter shrink-0">
                        {new Date(lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate leading-relaxed">
                    {lastMessage ? lastMessage.content : 'No messages yet'}
                  </p>
                </div>
                {room.unreadCount > 0 && (
                  <div className="w-2 h-2 rounded-full bg-indigo-600 shadow-lg shadow-indigo-200" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Chat View */}
      <div className={cn(
        "flex-1 flex flex-col transition-all bg-slate-50 dark:bg-slate-950",
        showSidebar && "hidden md:flex"
      )}>
        {activeRoom ? (
          <>
            {/* Chat Header */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-white dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden -ml-2"
                  onClick={() => setShowSidebar(true)}
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 overflow-hidden flex items-center justify-center">
                  {activeRoom.otherParticipant?.avatar_url ? (
                    <img src={activeRoom.otherParticipant.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-indigo-600 font-bold text-sm">
                      {activeRoom.otherParticipant?.display_name?.[0] || 'U'}
                    </div>
                  )}
                </div>
                <div>
                   <h2 className="text-sm font-black text-slate-900 dark:text-white leading-none mb-1">
                      {activeRoom.otherParticipant?.display_name || activeRoom.otherParticipant?.full_name}
                   </h2>
                   <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Online</span>
                   </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                 <Button variant="ghost" size="icon" className="rounded-full"><Search className="w-5 h-5 text-slate-400" /></Button>
                 <Button variant="ghost" size="icon" className="rounded-full"><MoreVertical className="w-5 h-5 text-slate-400" /></Button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg, i) => {
                const isMine = msg.sender_id === userId
                return (
                  <div key={msg.id} className={cn("flex flex-col", isMine ? "items-end" : "items-start")}>
                    <div className={cn(
                      "max-w-[80%] px-5 py-3 rounded-3xl text-sm shadow-sm transition-all",
                      isMine 
                        ? "bg-indigo-600 text-white rounded-br-none" 
                        : "bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-bl-none border border-slate-100 dark:border-slate-800"
                    )}>
                      {msg.content}
                    </div>
                    <span className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter px-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-t border-white dark:border-slate-800">
               <div className="max-w-4xl mx-auto flex items-end gap-3">
                  <div className="flex-1 relative">
                     <textarea 
                       rows={1}
                       placeholder="Aa"
                       value={messageInput}
                       onChange={e => setMessageInput(e.target.value)}
                       onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                       className="w-full bg-slate-100 dark:bg-slate-800 rounded-3xl px-6 py-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all border-none resize-none"
                     />
                     <button className="absolute right-4 bottom-4 p-1 text-slate-400 hover:text-indigo-600 transition-colors">
                        <ImageIcon className="w-5 h-5" />
                     </button>
                  </div>
                  <Button 
                    className="rounded-full w-12 h-12 p-0 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200 dark:shadow-none"
                    onClick={handleSend}
                    disabled={!messageInput.trim()}
                  >
                     <Send className="w-5 h-5" />
                  </Button>
               </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
             <div className="w-24 h-24 rounded-3xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center animate-bounce">
                <MessageSquare className="w-12 h-12 text-indigo-600" />
             </div>
             <div className="max-w-sm space-y-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Select a conversation</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">Choose from your existing chats or start a new conversation with a seller, rider, or store.</p>
             </div>
             <Button variant="outline" className="rounded-full px-8">Start new chat</Button>
          </div>
        )}
      </div>
    </div>
  )
}
