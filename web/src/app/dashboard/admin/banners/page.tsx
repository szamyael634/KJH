'use client'

import { useState, useEffect } from 'react'
import { 
  ImagePlus, 
  Trash2, 
  ExternalLink, 
  Plus, 
  GripVertical, 
  Eye, 
  EyeOff,
  Layout
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { getBanners, createBanner } from '@/app/actions/admin'

export default function BannerManagement() {
  const [banners, setBanners] = useState<any[]>([])
  const [newBanner, setNewBanner] = useState({ image_url: '', title: '', link_url: '' })
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    loadBanners()
  }, [])

  const loadBanners = async () => {
    const { data } = await getBanners()
    setBanners(data || [])
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await createBanner(newBanner)
    setNewBanner({ image_url: '', title: '', link_url: '' })
    setIsAdding(false)
    loadBanners()
  }

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Marketing Banners</h1>
          <p className="text-sm font-medium text-slate-500">Manage the hero content shown to public visitors.</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="rounded-2xl">
           <Plus className="w-5 h-5 mr-2" /> Add New Banner
        </Button>
      </header>

      {isAdding && (
         <Card className="p-8 border-indigo-600 bg-indigo-50/30 animate-in slide-in-from-top-4 duration-300">
            <form onSubmit={handleCreate} className="space-y-6">
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Image URL</label>
                     <Input 
                       value={newBanner.image_url} 
                       onChange={e => setNewBanner({...newBanner, image_url: e.target.value})} 
                       placeholder="https://..."
                       required 
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Banner Title (Optional)</label>
                     <Input 
                       value={newBanner.title} 
                       onChange={e => setNewBanner({...newBanner, title: e.target.value})} 
                       placeholder="Summer Electronics Sale" 
                     />
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Link URL</label>
                  <Input 
                    value={newBanner.link_url} 
                    onChange={e => setNewBanner({...newBanner, link_url: e.target.value})} 
                    placeholder="/search?category=electronics" 
                  />
               </div>
               <div className="flex gap-4">
                  <Button variant="outline" className="flex-1" type="button" onClick={() => setIsAdding(false)}>Cancel</Button>
                  <Button className="flex-1" type="submit">Create Banner</Button>
               </div>
            </form>
         </Card>
      )}

      <div className="grid gap-6">
        {banners.length === 0 ? (
          <div className="py-24 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] text-center flex flex-col items-center gap-4 opacity-50">
             <Layout className="w-12 h-12" />
             <p className="font-bold text-sm">No active banners found</p>
          </div>
        ) : (
          banners.map((banner) => (
            <Card key={banner.id} className="overflow-hidden flex items-center group shadow-sm hover:shadow-xl transition-all duration-500">
               <div className="w-64 h-36 bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 relative">
                  <img src={banner.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-black/20" />
               </div>
               <div className="flex-1 p-8">
                  <div className="flex items-center gap-3 mb-2">
                     <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{banner.title || 'Untitled Banner'}</h3>
                     {banner.active ? <Eye className="w-4 h-4 text-emerald-500" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                     <ExternalLink className="w-3 h-3" />
                     {banner.link_url || 'No redirect link'}
                  </div>
               </div>
               <div className="p-8 flex gap-2">
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600 rounded-xl">
                     <GripVertical className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500 rounded-xl">
                     <Trash2 className="w-5 h-5" />
                  </Button>
               </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
