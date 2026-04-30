'use client'

import { useState } from 'react'
import { 
  Plus, 
  Package, 
  ShoppingBag,
  LayoutGrid,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import CreateProductForm from '@/components/seller/CreateProductForm'
import { cn } from '@/utils/cn'

interface SellerDashboardClientProps {
  products: any[] | null
  user: any
  activeProducts: number
}

export default function SellerDashboardClient({ products, user, activeProducts }: SellerDashboardClientProps) {
  const [showAddForm, setShowAddForm] = useState(false)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
      {/* Products List */}
      <div className={cn("space-y-8 transition-all duration-500", showAddForm ? "lg:col-span-7" : "lg:col-span-12")}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
            <LayoutGrid className="w-6 h-6 text-indigo-600" />
            Your Catalog
          </h2>
          <div className="flex items-center gap-4">
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{activeProducts} Total Items</p>
             {!showAddForm && (
               <Button onClick={() => setShowAddForm(true)} size="sm" className="rounded-xl">
                 <Plus className="w-4 h-4 mr-2" /> Add Product
               </Button>
             )}
          </div>
        </div>

        <div className={cn("grid grid-cols-1 gap-6", showAddForm ? "md:grid-cols-2" : "md:grid-cols-3 lg:grid-cols-4")}>
          {products?.map((product) => (
            <Card key={product.id} className="group overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-500">
              <div className="aspect-[4/3] relative overflow-hidden bg-slate-100">
                {product.image_url ? (
                  <img src={product.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-20"><ShoppingBag className="w-12 h-12" /></div>
                )}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-black text-slate-900 shadow-sm">
                  ${product.price}
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h4 className="font-black text-slate-900 truncate pr-4">{product.title}</h4>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{product.category}</p>
                </div>
                
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-tighter">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Package className="w-3.5 h-3.5" />
                    <span>{product.stock} in stock</span>
                  </div>
                  {product.product_variations?.length > 0 && (
                    <div className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {product.product_variations.length} Variations
                    </div>
                  )}
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <Button variant="outline" size="sm" className="flex-1 rounded-xl h-9">Edit</Button>
                </div>
              </div>
            </Card>
          ))}
          
          {activeProducts === 0 && (
            <div className="col-span-full py-24 border-4 border-dashed border-slate-100 rounded-[3rem] text-center flex flex-col items-center gap-6 opacity-40">
              <ShoppingBag className="w-16 h-16" />
              <div className="space-y-1">
                <p className="font-black text-lg">No products found</p>
                <p className="text-sm font-medium">Start adding items to build your storefront.</p>
              </div>
              <Button onClick={() => setShowAddForm(true)} variant="outline" className="rounded-full">Add Your First Product</Button>
            </div>
          )}
        </div>
      </div>

      {/* Add Product Sidebar */}
      {showAddForm && (
        <div className="lg:col-span-5 relative animate-in slide-in-from-right-8 duration-500">
          <div className="sticky top-24 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tighter">New Listing</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowAddForm(false)} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>
            <CreateProductForm />
          </div>
        </div>
      )}
    </div>
  )
}
