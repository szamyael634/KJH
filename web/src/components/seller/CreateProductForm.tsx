'use client'

import { useState } from 'react'
import { 
  Plus, 
  Trash2, 
  Tag, 
  Layers, 
  Image as ImageIcon, 
  DollarSign, 
  Package,
  Type,
  ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { cn } from '@/utils/cn'
import { createProductComplexity } from '@/app/dashboard/seller/actions_v2'

export default function CreateProductForm() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Electronics',
    price: '',
    stock: '',
    image_url: ''
  })

  // Variations: { name, price, stock }
  const [variations, setVariations] = useState<any[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const addVariation = () => {
    setVariations([...variations, { name: '', price: formData.price || '0', stock: '1' }])
  }

  const removeVariation = (index: number) => {
    setVariations(variations.filter((_, i) => i !== index))
  }

  const updateVariation = (index: number, field: string, value: string) => {
    const newVars = [...variations]
    newVars[index][field] = value
    setVariations(newVars)
  }

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()])
      }
      setTagInput('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const result = await createProductComplexity(formData, variations, tags)
      if (result?.error) {
        alert(result.error)
        return
      }
      alert('Product created successfully!')
      window.location.reload()
    } catch (err: any) {
      alert(err?.message || 'Failed to publish product.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Basic Info Container */}
      <Card className="p-8 space-y-8 border-none shadow-xl">
        <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-6">
           <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-600">
              <Type className="w-5 h-5" />
           </div>
           <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Basic Details</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Main product information</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Title</label>
                 <Input 
                   placeholder="e.g. Mechanical Gaming Keyboard" 
                   value={formData.title} 
                   onChange={e => setFormData({...formData, title: e.target.value})} 
                   required
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                 <div className="relative">
                    <select 
                      className="w-full h-12 rounded-2xl border border-slate-100 dark:border-slate-800 bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-600 outline-none appearance-none"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                       <option>Electronics</option>
                       <option>Fashion</option>
                       <option>Home & Living</option>
                       <option>Health & Beauty</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                 </div>
              </div>
           </div>
           
           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
              <textarea 
                rows={5}
                className="w-full rounded-2xl border border-slate-100 dark:border-slate-800 bg-background px-4 py-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all resize-none"
                placeholder="Describe your product features, materials, etc."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
           </div>
        </div>
      </Card>

      {/* Pricing & Variations Container */}
      <Card className="p-8 space-y-8 border-none shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-6">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-600">
                 <DollarSign className="w-5 h-5" />
              </div>
              <div>
                 <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Pricing & Inventory</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Define base price and variations</p>
              </div>
           </div>
           <Button type="button" variant="secondary" onClick={addVariation} className="rounded-xl h-9 px-4">
              <Plus className="w-4 h-4 mr-2" /> Add Variation
           </Button>
        </div>

        <div className="grid grid-cols-2 gap-8">
           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Price ($)</label>
              <Input type="number" step="0.01" placeholder="0.00" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Base Stock</label>
              <Input type="number" placeholder="10" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
           </div>
        </div>

        {variations.length > 0 && (
           <div className="space-y-4 pt-4">
              <div className="grid grid-cols-12 gap-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                 <div className="col-span-5">Variation Name</div>
                 <div className="col-span-3">Price ($)</div>
                 <div className="col-span-3">Stock</div>
                 <div className="col-span-1"></div>
              </div>
              <div className="space-y-3">
                 {variations.map((v, i) => (
                    <div key={i} className="grid grid-cols-12 gap-4 items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl animate-in fade-in slide-in-from-left-2 duration-300">
                       <div className="col-span-5">
                          <Input size="sm" className="bg-white border-none" placeholder="e.g. Size Small" value={v.name} onChange={e => updateVariation(i, 'name', e.target.value)} />
                       </div>
                       <div className="col-span-3">
                          <Input size="sm" type="number" className="bg-white border-none" value={v.price} onChange={e => updateVariation(i, 'price', e.target.value)} />
                       </div>
                       <div className="col-span-3">
                          <Input size="sm" type="number" className="bg-white border-none" value={v.stock} onChange={e => updateVariation(i, 'stock', e.target.value)} />
                       </div>
                       <div className="col-span-1 flex justify-center">
                          <button type="button" onClick={() => removeVariation(i)} className="text-slate-300 hover:text-red-500 transition-colors">
                             <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        )}
      </Card>

      {/* Visuals & Tags Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <Card className="p-8 space-y-8 border-none shadow-xl">
            <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-6">
               <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600">
                  <ImageIcon className="w-5 h-5" />
               </div>
               <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Product Visuals</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Main product image URL</p>
               </div>
            </div>
            <div className="space-y-4">
               <Input 
                 placeholder="https://images.unsplash.com/..." 
                 value={formData.image_url} 
                 onChange={e => setFormData({...formData, image_url: e.target.value})} 
               />
               <div className="aspect-video w-full rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-100 dark:border-slate-800">
                  {formData.image_url ? (
                     <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                     <p className="text-xs text-slate-400 font-bold uppercase">No Image Provided</p>
                  )}
               </div>
            </div>
         </Card>

         <Card className="p-8 space-y-8 border-none shadow-xl">
            <div className="flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 pb-6">
               <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-600">
                  <Tag className="w-5 h-5" />
               </div>
               <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Search Optimization</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Smart tags for discovery</p>
               </div>
            </div>
            <div className="space-y-4">
               <Input 
                 placeholder="Type a tag and press Enter..." 
                 value={tagInput}
                 onChange={e => setTagInput(e.target.value)}
                 onKeyDown={handleAddTag}
               />
               <div className="flex flex-wrap gap-2">
                  {tags.map((tag, i) => (
                    <span key={i} className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight text-slate-600 dark:text-slate-300">
                       {tag}
                       <button type="button" onClick={() => setTags(tags.filter((_, j) => i !== j))} className="hover:text-red-500">
                          <X className="w-3 h-3" />
                       </button>
                    </span>
                  ))}
                  {tags.length === 0 && <p className="text-xs text-slate-400 italic">No tags added yet</p>}
               </div>
            </div>
         </Card>
      </div>

      <div className="flex justify-end pt-8">
         <Button type="submit" disabled={isLoading} className="rounded-full px-12 py-7 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-2xl shadow-indigo-200 dark:shadow-none">
            {isLoading ? "Publishing..." : "Publish Product"}
         </Button>
      </div>
    </form>
  )
}

function X({ className }: { className?: string }) {
   return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
   )
}
