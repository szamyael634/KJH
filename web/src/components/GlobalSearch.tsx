'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Package, Store, User, Loader2 } from 'lucide-react'
import { getSearchSuggestions } from '@/app/actions/search'
import { Input } from './ui/Input'
import { Card } from './ui/Card'
import { cn } from '@/utils/cn'

export default function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2) {
        setIsLoading(true)
        const { data } = await getSearchSuggestions(query)
        setSuggestions(data || [])
        setIsOpen(true)
        setIsLoading(false)
      } else {
        setSuggestions([])
        setIsOpen(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = (item: any) => {
    setIsOpen(false)
    setQuery('')
    if (item.type === 'product') {
      router.push(`/products/${item.id}`)
    } else if (item.type === 'seller' || item.type === 'rider') {
      router.push(`/shop/${item.id}`)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`)
      setIsOpen(false)
    }
  }

  return (
    <div className="relative w-full max-w-xl group" ref={containerRef}>
      <form onSubmit={handleSearchSubmit} className="relative">
        <Input
          type="text"
          placeholder="Search for anything..."
          className="pl-12 pr-10 bg-slate-100 dark:bg-slate-800 border-none shadow-none focus:ring-2 focus:ring-indigo-500 transition-all rounded-full h-11"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
        </div>
      </form>

      {isOpen && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2">
            {suggestions.map((item, index) => (
              <button
                key={`${item.type}-${item.id}-${index}`}
                onClick={() => handleSelect(item)}
                className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-900 overflow-hidden flex items-center justify-center shrink-0">
                  {item.image_url ? (
                    <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-slate-400">
                      {item.type === 'product' && <Package className="w-5 h-5" />}
                      {(item.type === 'seller' || item.type === 'rider') && <Store className="w-5 h-5" />}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.title}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    {item.type === 'product' && <><Package className="w-2.5 h-2.5" /> Product</>}
                    {item.type === 'seller' && <><Store className="w-2.5 h-2.5" /> Store</>}
                    {item.type === 'rider' && <><User className="w-2.5 h-2.5" /> Rider</>}
                  </p>
                </div>
              </button>
            ))}
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/50 p-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Press Enter to search all results</p>
             <button 
               onClick={handleSearchSubmit}
               className="text-[10px] text-indigo-600 font-bold uppercase hover:underline"
             >
               View All
             </button>
          </div>
        </Card>
      )}
    </div>
  )
}
