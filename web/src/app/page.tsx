import { createClient } from '@/utils/supabase/server'
import ProductExplorer from '@/components/ProductExplorer'
import Link from 'next/link'

export const revalidate = 3600 // Cache for 1 hour

export default async function Home() {
  const supabase = await createClient()
  
  // Fetch products with seller info
  const { data: products } = await supabase
    .from('products')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(20)

  const categories = [
    { name: 'Electronics', icon: '💻' },
    { name: 'Gadgets', icon: '📱' },
    { name: 'Peripherals', icon: '⌨️' },
    { name: 'Accessories', icon: '🎧' },
    { name: 'Other', icon: '📦' }
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Hero Section (Placeholder for dynamic banners) */}
      <section className="relative w-full h-[300px] md:h-[450px] bg-indigo-600 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/80 to-transparent z-10"></div>
        <img 
          src="https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=2070&auto=format&fit=crop" 
          alt="Hero Banner" 
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="relative z-20 max-w-7xl mx-auto h-full flex flex-col justify-center px-8 md:px-12 text-white">
          <span className="text-yellow-400 font-bold uppercase tracking-widest text-sm mb-4">Summer Sale 2026</span>
          <h1 className="text-4xl md:text-6xl font-black mb-6 max-w-2xl leading-tight">
            Next Gen Tech <br/> At Local Prices.
          </h1>
          <div className="flex gap-4">
            <Link href="/login" className="bg-white text-indigo-600 px-8 py-3 rounded-full font-bold shadow-xl hover:scale-105 transition-transform">
              Join the Shop
            </Link>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 md:px-8 -mt-10 relative z-30">
        {/* Category Shortcuts */}
        <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-12">
          {categories.map((cat) => (
            <Link 
              key={cat.name}
              href={`/search?category=${cat.name}`}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-3 hover:shadow-xl hover:-translate-y-1 transition-all group"
            >
              <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                {cat.icon}
              </div>
              <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{cat.name}</span>
            </Link>
          ))}
        </section>

        {/* Dynamic Product Discovery */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-indigo-600">🔥</span> Flash Discovery
            </h2>
            <Link href="/search" className="text-sm font-bold text-indigo-600 hover:underline">View All</Link>
          </div>
          
          <ProductExplorer initialProducts={products || []} />
        </section>
      </main>
    </div>
  )
}
