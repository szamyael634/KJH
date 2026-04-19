import { createClient } from '@/utils/supabase/server'
import ProductExplorer from '@/components/ProductExplorer'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function SearchPage({ 
  searchParams 
}: { 
  searchParams: { q?: string, category?: string } 
}) {
  const { q, category } = await searchParams
  const supabase = await createClient()

  // Fetch all products for the client-side explorer to handle
  // In a larger app, we would do server-side filtering here
  const { data: products } = await supabase
    .from('products')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-8">
          <nav className="mb-4">
            <ul className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <li><Link href="/" className="hover:text-indigo-600 transition-colors">Home</Link></li>
              <li className="text-slate-200">/</li>
              <li className="text-slate-600 dark:text-slate-300">Search Results</li>
            </ul>
          </nav>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {q ? `Results for "${q}"` : category ? `Category: ${category}` : 'Browse All Products'}
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-12">
        <ProductExplorer 
          initialProducts={products || []} 
          initialSearch={q || ''} 
          initialCategory={category || 'All'} 
        />
      </main>
    </div>
  )
}
