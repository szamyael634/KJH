import { createClient, hasSupabaseEnv } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  Package, 
  DollarSign, 
  TrendingUp, 
  Store,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { cn } from '@/utils/cn'
import SellerDashboardClient from '@/components/seller/SellerDashboardClient'

export default async function SellerDashboard() {
  if (!hasSupabaseEnv()) {
    redirect('/login')
  }

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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-8 py-12 space-y-12">
        {/* Modern Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
             <div className="w-20 h-20 rounded-3xl bg-indigo-600 shadow-2xl shadow-indigo-200 flex items-center justify-center border-4 border-white">
                <Store className="w-10 h-10 text-white" />
             </div>
             <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
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
             <Link href={`/shop/${user.id}`}>
                <Button className="rounded-2xl px-8">View Public Store</Button>
             </Link>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {[
             { label: 'Estimated Inventory Value', value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50' },
             { label: 'Active Products', value: activeProducts, icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50' },
             { label: 'Recent Performance', value: '+14%', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
           ].map((stat, i) => (
             <Card key={i} className="p-8 border-none shadow-sm hover:shadow-xl transition-all duration-300">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6", stat.bg)}>
                   <stat.icon className={cn("w-6 h-6", stat.color)} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
             </Card>
           ))}
        </div>

        <SellerDashboardClient products={products} user={user} activeProducts={activeProducts} />
      </div>
    </div>
  )
}

function Trash2({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
  )
}
