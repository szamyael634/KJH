import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import ProductExplorer from '@/components/ProductExplorer'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ShopPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch Seller Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!profile || profile.role !== 'seller') {
    notFound()
  }

  // Fetch Seller Products
  const { data: products } = await supabase
    .from('products')
    .select('*, profiles(full_name)')
    .eq('seller_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Shop Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 py-16">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 rounded-[32px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-5xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            {profile.store_logo_url ? (
              <img src={profile.store_logo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              profile.store_name?.charAt(0) || profile.full_name?.charAt(0) || 'S'
            )}
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">{profile.store_name || profile.full_name}</h1>
            <p className="text-slate-500 max-w-xl mx-auto md:mx-0 mb-6">{profile.store_description || `Welcome to ${profile.store_name || profile.full_name}'s official store. Explore our premium collection.`}</p>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
               <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{products?.length || 0}</span>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Products</span>
               </div>
               <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
               <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">4.9</span>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Rating</span>
               </div>
               <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
               <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">99%</span>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Response</span>
               </div>
            </div>
          </div>
          
          <div className="flex gap-3">
             <button className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:scale-105 transition-transform">
                Follow
             </button>
             <button className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 px-6 py-3 rounded-2xl font-bold hover:bg-slate-50 transition-colors">
                Contact
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-12">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-8">All Items</h2>
        <ProductExplorer initialProducts={products || []} />
      </main>
    </div>
  )
}
