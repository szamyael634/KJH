'use client'

import { useState, useRef, useEffect } from 'react'
import { useMessaging } from '@/context/MessagingContext'
import { sendMessage } from '@/app/actions/chat'
import { createClient } from '@/utils/supabase/client'

export default function ChatWindow() {
  const { 
    activeRoomId, 
    messages, 
    userId, 
    isChatOpen, 
    setIsChatOpen 
  } = useMessaging()

  const [input, setInput] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || !activeRoomId || !userId) return

    const content = input
    setInput('')
    await sendMessage(activeRoomId, userId, content)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeRoomId || !userId) return

    setIsUploading(true)
    try {
      const fileName = `${activeRoomId}/${Date.now()}-${file.name}`
      const { data, error } = await supabase.storage
        .from('chat-attachments')
        .upload(fileName, file)

      if (error) throw error

      const imageUrl = supabase.storage.from('chat-attachments').getPublicUrl(data.path).data.publicUrl
      await sendMessage(activeRoomId, userId, '', imageUrl)
    } catch (err) {
      console.error('Upload failed', err)
      alert('Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  if (!userId) return null // Hide chat for guests

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
      {/* Floating Chat Bubble */}
      {!isChatOpen && (
        <button 
          onClick={() => setIsChatOpen(true)}
          className="w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
        >
          <svg className="w-8 h-8 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
        </button>
      )}

      {/* Main Chat Window */}
      {isChatOpen && (
        <div className="w-[380px] h-[520px] bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
          <header className="px-6 py-5 bg-indigo-600 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-black">?</div>
               <div>
                  <h3 className="font-bold text-sm">Nexus Support / Seller</h3>
                  <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest flex items-center gap-1">
                     <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span> Online
                  </p>
               </div>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="hover:bg-white/10 p-2 rounded-xl transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 dark:bg-slate-950/50">
            {messages.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-center opacity-40 grayscale space-y-3">
                  <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center text-3xl font-black">👋</div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Start a conversation!</p>
               </div>
            ) : (
                messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col ${msg.sender_id === userId ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm font-medium shadow-sm ${
                        msg.sender_id === userId 
                          ? 'bg-indigo-600 text-white rounded-tr-none' 
                          : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-none border border-slate-100 dark:border-slate-700'
                      }`}>
                        {msg.image_url && (
                           <img src={msg.image_url} alt="Attachment" className="rounded-lg mb-2 max-w-full" />
                        )}
                        <p>{msg.content}</p>
                      </div>
                      <span className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <footer className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <form onSubmit={handleSend} className="flex gap-2">
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || !activeRoomId}
                className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                {isUploading ? '...' : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>}
              </button>
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*"
              />
              <input 
                type="text" 
                placeholder={activeRoomId ? "Write something..." : "Select a seller to chat"}
                disabled={!activeRoomId}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              />
              <button 
                type="submit"
                disabled={!input.trim() || !activeRoomId}
                className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
              </button>
            </form>
          </footer>
        </div>
      )}
    </div>
  )
}
