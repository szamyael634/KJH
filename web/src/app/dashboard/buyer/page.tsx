import { createClient } from '@/utils/supabase/server'
import ProductExplorer from '@/components/ProductExplorer'
import Link from 'next/link'

export const revalidate = 0 // always fresh data for shop

export default async function BuyerDashboard() {
  const supabase = await createClient()

  // Fetch all products across all sellers
  const { data: products } = await supabase
    .from('products')
    .select(`*, profiles(full_name)`)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 pt-12 max-w-7xl mx-auto">
      <header className="mb-10 flex flex-col md:flex-row py-6 px-8 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Discover</h1>
          <p className="text-slate-500 mt-1">Explore premium tech products from verified sellers.</p>
        </div>
        <Link 
          href="/dashboard/buyer/orders" 
          className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-all font-bold text-sm text-slate-700 dark:text-slate-300 shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 11-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
          Order History
        </Link>
      </header>

      <ProductExplorer initialProducts={products || []} />
    </div>
  )
}
