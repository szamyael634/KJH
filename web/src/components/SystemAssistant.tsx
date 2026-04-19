'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  Bot, 
  X, 
  Send, 
  Ticket, 
  MessageCircle, 
  HelpCircle,
  ChevronDown,
  Loader2,
  CheckCircle2
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

export default function SystemAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<'chat' | 'ticket' | 'home'>('home')
  const [messages, setMessages] = useState<any[]>([
    { role: 'assistant', content: 'Hello! I am your Nexus System Assistant. How can I help you today?' }
  ])
  const [input, setInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [ticketSuccess, setTicketSuccess] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMsg = { role: 'user', content: input }
    setMessages([...messages, userMsg])
    setInput('')

    // Simulate bot response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `I've received your query about "${input}". For immediate assistance, you can also open a support ticket from the main menu.` 
      }])
    }, 1000)
  }

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Simulate API call
    await new Promise(r => setTimeout(r, 1500))
    setIsSubmitting(false)
    setTicketSuccess(true)
    setTimeout(() => {
      setTicketSuccess(false)
      setView('home')
    }, 3000)
  }

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group border-4 border-white dark:border-slate-800"
        >
          <Bot className="w-8 h-8 group-hover:rotate-12 transition-all" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 rounded-full border-2 border-white dark:border-slate-800 animate-pulse"></span>
        </button>
      )}

      {isOpen && (
        <Card className="w-[380px] h-[550px] shadow-3xl border-none flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
          {/* Header */}
          <div className="bg-slate-900 text-white p-6 relative">
             <button 
               onClick={() => setIsOpen(false)}
               className="absolute top-6 right-6 p-1 hover:bg-white/10 rounded-lg transition-colors"
             >
                <X className="w-5 h-5" />
             </button>
             <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center">
                   <Bot className="w-7 h-7" />
                </div>
                <div>
                   <h3 className="font-black text-lg tracking-tight">System Assistant</h3>
                   <div className="flex items-center gap-1.5 opacity-60">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Active AI Support</span>
                   </div>
                </div>
             </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950/50">
             {view === 'home' && (
                <div className="p-6 space-y-6">
                   <div className="space-y-2">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">What can I do for you?</p>
                      <p className="text-xs text-slate-500">Choose an option below to get started or ask me a question.</p>
                   </div>
                   <div className="grid gap-3">
                      <button 
                        onClick={() => setView('chat')}
                        className="w-full flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-600 hover:bg-slate-50 transition-all text-left"
                      >
                         <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-600">
                            <MessageCircle className="w-5 h-5" />
                         </div>
                         <div className="flex-1">
                            <p className="text-sm font-black text-slate-900 dark:text-white">Chat with AI Assistant</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Fast Answers</p>
                         </div>
                      </button>

                      <button 
                        onClick={() => setView('ticket')}
                        className="w-full flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-600 hover:bg-slate-50 transition-all text-left"
                      >
                         <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-600">
                            <Ticket className="w-5 h-5" />
                         </div>
                         <div className="flex-1">
                            <p className="text-sm font-black text-slate-900 dark:text-white">Submit Support Ticket</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Human Review</p>
                         </div>
                      </button>

                      <button className="w-full flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-600 hover:bg-slate-50 transition-all text-left">
                         <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-600">
                            <HelpCircle className="w-5 h-5" />
                         </div>
                         <div className="flex-1">
                            <p className="text-sm font-black text-slate-900 dark:text-white">Documentation</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Help Guide</p>
                         </div>
                      </button>
                   </div>
                </div>
             )}

             {view === 'chat' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                   <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      {messages.map((m, i) => (
                         <div key={i} className={cn("flex flex-col", m.role === 'user' ? "items-end" : "items-start")}>
                            <div className={cn(
                              "max-w-[85%] px-4 py-3 rounded-2xl text-xs font-medium leading-relaxed",
                              m.role === 'user' ? "bg-indigo-600 text-white rounded-br-none" : "bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-bl-none border border-slate-100 dark:border-slate-800 shadow-sm"
                            )}>
                               {m.content}
                            </div>
                         </div>
                      ))}
                      <div ref={scrollRef} />
                   </div>
                   <form onSubmit={handleSend} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        type="button"
                        onClick={() => setView('home')}
                        className="shrink-0"
                      >
                         <ChevronDown className="w-5 h-5" />
                      </Button>
                      <Input 
                        placeholder="Type your question..." 
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        className="h-10 rounded-xl text-xs bg-slate-50 dark:bg-slate-800"
                      />
                      <Button size="icon" className="shrink-0 w-10 h-10 rounded-xl">
                         <Send className="w-4 h-4" />
                      </Button>
                   </form>
                </div>
             )}

             {view === 'ticket' && (
                <div className="p-6">
                   {ticketSuccess ? (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-4 pt-12">
                         <CheckCircle2 className="w-16 h-16 text-emerald-500 animate-in zoom-in" />
                         <h3 className="text-lg font-black text-slate-900 dark:text-white">Ticket Submitted!</h3>
                         <p className="text-xs text-slate-500">We will get back to you within 24 hours. You can track this in your dashboard.</p>
                      </div>
                   ) : (
                      <form onSubmit={handleCreateTicket} className="space-y-4">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Problem Category</label>
                            <select className="w-full h-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-xs focus:ring-2 focus:ring-indigo-600 outline-none">
                               <option>Payment Issue</option>
                               <option>Seller Report</option>
                               <option>App Bug</option>
                               <option>Other</option>
                            </select>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject</label>
                            <Input placeholder="Briefly describe the issue" className="h-11 text-xs" required />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Details</label>
                            <textarea className="w-full h-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-xs focus:ring-2 focus:ring-indigo-600 outline-none resize-none" placeholder="Provide more context..." required />
                         </div>
                         <div className="flex gap-3 pt-4">
                            <Button variant="outline" className="flex-1" type="button" onClick={() => setView('home')}>Cancel</Button>
                            <Button className="flex-1" type="submit" disabled={isSubmitting}>
                               {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Ticket"}
                            </Button>
                         </div>
                      </form>
                   )}
                </div>
             )}
          </div>
        </Card>
      )}
    </div>
  )
}
