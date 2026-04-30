import { createClient } from '@/utils/supabase/server'
import ProductExplorer from '@/components/ProductExplorer'
import Link from 'next/link'
import { 
  Laptop, 
  Smartphone, 
  Keyboard, 
  Headphones, 
  Package, 
  Zap, 
  ArrowRight 
} from 'lucide-react'
import BannerCarousel from '@/components/BannerCarousel'
import { cn } from '@/utils/cn'

export const revalidate = 600 // Cache for 10 minutes

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // 1. Fetch banners
  const { data: banners } = await supabase
    .from('banners')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true })

  // 2. Fetch products from all sellers
  const { data: products } = await supabase
    .from('products')
    .select('*, profiles(full_name, store_name)')
    .order('created_at', { ascending: false })
    .limit(20)

  const categories = [
    { name: 'Electronics', icon: Laptop, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { name: 'Devices', icon: Smartphone, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { name: 'Workspace', icon: Keyboard, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { name: 'Audio', icon: Headphones, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { name: 'Essentials', icon: Package, color: 'text-slate-600', bg: 'bg-slate-50 dark:bg-slate-800' }
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      {/* Dynamic Banner Carousel */}
      <BannerCarousel banners={banners || []} />

      <main className="max-w-7xl mx-auto px-6 md:px-12 -mt-12 relative z-20 space-y-20">
        {/* Category Minimalist Shortcuts */}
        <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
          {categories.map((cat, i) => (
            <Link 
              key={i}
              href={`/search?category=${cat.name}`}
              className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all duration-500 group flex flex-col items-center gap-4 text-center border-none"
            >
              <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110", cat.bg)}>
                <cat.icon className={cn("w-7 h-7", cat.color)} />
              </div>
              <span className="font-black text-sm text-slate-900 dark:text-white tracking-tight">{cat.name}</span>
            </Link>
          ))}
        </section>

        {/* Global Product Discovery */}
        <section className="space-y-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
               <div className="flex items-center gap-2 mb-2 p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-full w-fit pr-4">
                  <div className="bg-indigo-600 p-1 rounded-full"><Zap className="w-3 h-3 text-white" /></div>
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Trending Marketplace Discovery</span>
               </div>
               <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-widest">FLASH DISCOVERY</h2>
            </div>
            <Link href="/search" className="group flex items-center gap-2 text-sm font-black text-indigo-600 uppercase tracking-widest hover:translate-x-1 transition-transform">
               Browse full catalog <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <ProductExplorer initialProducts={products || []} />
        </section>

        {/* Community Trust Section */}
        {!user && (
          <section className="py-20 bg-indigo-600 rounded-[3rem] text-center space-y-8 px-12 relative overflow-hidden shadow-2xl shadow-indigo-100">
             <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
             <div className="relative z-10 space-y-4">
                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">The Future of Local Commerce</h2>
                <p className="text-indigo-100 max-w-xl mx-auto font-medium leading-relaxed">Join thousands of sellers and riders in the most robust minimalist marketplace in the Philippines.</p>
             </div>
             <div className="relative z-10 flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/login?mode=signup" className="bg-white text-indigo-600 px-10 py-4 rounded-full font-black shadow-xl hover:scale-105 transition-all">
                   Join Nexus Community
                </Link>
             </div>
          </section>
        )}
      </main>
    </div>
  )
}
