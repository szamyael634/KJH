'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const supabase = createClient()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.is_read).length

  useEffect(() => {
    // 1. Initial Fetch
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)
      if (data) setNotifications(data)
    }

    fetchNotifications()

    // 2. Realtime Listener
    const channel = supabase
      .channel('realtime:notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev].slice(0, 10))
          // Play a sound or show a toast if desired
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markAllAsRead = async () => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
    
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center justify-center p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <svg className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in zoom-in duration-200">
          <header className="px-6 py-4 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
            <h3 className="font-bold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-[10px] font-bold text-indigo-600 hover:underline"
              >
                Mark all as read
              </button>
            )}
          </header>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <span className="text-2xl">🎉</span>
                <p className="text-xs text-slate-500 font-medium">All caught up!</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`px-6 py-4 border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${!n.is_read ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h4 className={`text-sm ${!n.is_read ? 'font-bold' : 'font-medium'}`}>{n.title}</h4>
                    {!n.is_read && <span className="w-2 h-2 bg-indigo-600 rounded-full mt-1.5 shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">{new Date(n.created_at).toLocaleTimeString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
