'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

export default function BannerCarousel({ banners }: { banners: any[] }) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (banners.length === 0) return
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % banners.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [banners])

  if (banners.length === 0) return (
     <section className="relative w-full h-[400px] bg-slate-100 flex items-center justify-center">
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Nexus Marketplace</p>
     </section>
  )

  return (
    <section className="relative w-full h-[450px] overflow-hidden bg-slate-900 group">
      {banners.map((banner, i) => (
        <div 
          key={banner.id}
          className={cn(
            "absolute inset-0 transition-all duration-1000 ease-in-out",
            current === i ? "opacity-100 scale-100 translate-x-0" : "opacity-0 scale-110 translate-x-32"
          )}
        >
           <img 
             src={banner.image_url} 
             alt="" 
             className="w-full h-full object-cover opacity-60" 
           />
           <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/20 to-transparent flex items-center">
             <div className="max-w-7xl mx-auto w-full px-8 md:px-12">
                <div className="max-w-xl space-y-6">
                   <h2 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tighter">
                      {banner.title || "Next Gen Commerce"}
                   </h2>
                   <Button className="rounded-full px-8 py-6 text-lg" onClick={() => window.location.href = banner.link_url || '#'}>
                      Shop Now <ArrowRight className="ml-2 w-5 h-5" />
                   </Button>
                </div>
             </div>
           </div>
        </div>
      ))}

      {banners.length > 1 && (
        <>
          <button 
            onClick={() => setCurrent((c) => (c - 1 + banners.length) % banners.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-all"
          >
             <ChevronLeft className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setCurrent((c) => (c + 1) % banners.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-all"
          >
             <ChevronRight className="w-6 h-6" />
          </button>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
             {banners.map((_, i) => (
                <button 
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={cn(
                    "w-8 h-1 transition-all rounded-full",
                    current === i ? "bg-white" : "bg-white/30"
                  )}
                />
             ))}
          </div>
        </>
      )}
    </section>
  )
}
