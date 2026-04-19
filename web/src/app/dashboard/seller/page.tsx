import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { 
  Plus, 
  Package, 
  DollarSign, 
  TrendingUp, 
  ShoppingBag,
  Store,
  LayoutGrid,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import CreateProductForm from '@/components/seller/CreateProductForm'
import { cn } from '@/utils/cn'

export default async function SellerDashboard() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: products } = await supabase
    .from('products')
    .select('*, product_variations(*)')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Simplified stats for the minimalist UI
  const activeProducts = products?.length || 0
  const totalRevenue = products?.reduce((acc, p) => acc + (p.price * p.stock), 0) || 0

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-8 py-12 space-y-12">
        {/* Modern Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
             <div className="w-20 h-20 rounded-3xl bg-indigo-600 shadow-2xl shadow-indigo-200 dark:shadow-none flex items-center justify-center border-4 border-white dark:border-slate-800">
                <Store className="w-10 h-10 text-white" />
             </div>
             <div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                   {profile?.store_name || "Merchant Console"}
                </h1>
                <p className="text-slate-500 font-medium flex items-center gap-2">
                   Managing {activeProducts} active listings
                   <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                   Public URL: <span className="text-indigo-600 font-bold">/shop/{user.id}</span>
                </p>
             </div>
          </div>
          <div className="flex gap-2">
             <Button variant="outline" size="icon" className="rounded-2xl"><Settings className="w-5 h-5" /></Button>
             <Button className="rounded-2xl px-8">View Public Store</Button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {[
             { label: 'Estimated Inventory Value', value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
             { label: 'Active Products', value: activeProducts, icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
             { label: 'Recent Performance', value: '+14%', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
           ].map((stat, i) => (
             <Card key={i} className="p-8 border-none shadow-sm hover:shadow-xl transition-all duration-300">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6", stat.bg)}>
                   <stat.icon className={cn("w-6 h-6", stat.color)} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</h3>
             </Card>
           ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
           {/* Products List */}
           <div className="lg:col-span-7 space-y-8">
              <div className="flex items-center justify-between">
                 <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-3">
                    <LayoutGrid className="w-6 h-6 text-indigo-600" />
                    Your Catalog
                 </h2>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{activeProducts} Total Items</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                             <h4 className="font-black text-slate-900 dark:text-white truncate pr-4">{product.title}</h4>
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
                             <Button variant="destructive" size="sm" className="rounded-xl h-9 w-10 p-0"><Trash2 className="w-4 h-4" /></Button>
                          </div>
                       </div>
                    </Card>
                 ))}
                 
                 {activeProducts === 0 && (
                    <div className="col-span-full py-24 border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem] text-center flex flex-col items-center gap-6 opacity-40">
                       <ShoppingBag className="w-16 h-16" />
                       <div className="space-y-1">
                          <p className="font-black text-lg">No products found</p>
                          <p className="text-sm font-medium">Start adding items to build your storefront.</p>
                       </div>
                    </div>
                 )}
              </div>
           </div>

           {/* Add Product Sidebar */}
           <div className="lg:col-span-5 relative">
              <div className="sticky top-24 space-y-8">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center">
                      <Plus className="w-5 h-5" />
                   </div>
                   <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">New Listing</h2>
                </div>
                <CreateProductForm />
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}

function Trash2({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
  )
}

