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
import { cancelSellerOrder, confirmOrder, markOrderPreparing, markReadyForPickup, updateStoreProfile } from './actions'

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

  const { data: sellerOrderItems } = await supabase
    .from('order_items')
    .select(`
      id,
      quantity,
      price_at_purchase,
      products (title, image_url),
      orders!inner (
        id,
        status,
        total_amount,
        payment_method,
        shipping_option,
        delivery_address,
        seller_confirm_by,
        created_at,
        profiles:buyer_id(full_name)
      )
    `)
    .eq('seller_id', user.id)
    .order('created_at', { referencedTable: 'orders', ascending: false })

  const orderMap = new Map<string, any>()
  for (const item of sellerOrderItems || []) {
    const order = Array.isArray(item.orders) ? item.orders[0] : item.orders
    if (!order) continue
    const existing = orderMap.get(order.id) || { ...order, items: [] }
    existing.items.push(item)
    orderMap.set(order.id, existing)
  }
  const sellerOrders = Array.from(orderMap.values())

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

        <section className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-5">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Store Settings</h2>
            <p className="text-sm text-slate-500">These details update your public storefront.</p>
          </div>
          <form action={updateStoreProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="store_name" defaultValue={profile?.store_name || ''} placeholder="Store name" className="rounded-2xl bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            <input name="store_logo_url" defaultValue={profile?.store_logo_url || ''} placeholder="Logo URL" className="rounded-2xl bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            <input name="store_banner_url" defaultValue={profile?.store_banner_url || ''} placeholder="Banner URL" className="rounded-2xl bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            <input name="store_address" defaultValue={profile?.store_address_json?.address || ''} placeholder="Pickup/store address" className="rounded-2xl bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
            <textarea name="store_description" defaultValue={profile?.store_description || ''} placeholder="Store description" rows={3} className="md:col-span-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            <div className="md:col-span-2 flex justify-end">
              <Button className="rounded-2xl px-8">Save Store</Button>
            </div>
          </form>
        </section>

        <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Order Fulfillment</h2>
              <p className="text-sm text-slate-500">Confirm, prepare, and release packed orders for rider pickup.</p>
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{sellerOrders.length} orders</span>
          </div>
          <div className="divide-y divide-slate-100">
            {sellerOrders.length === 0 && (
              <div className="p-10 text-center text-slate-400 font-medium">No seller orders yet.</div>
            )}
            {sellerOrders.map((order) => (
              <div key={order.id} className="p-6 flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">#{order.id.slice(0, 8)}</span>
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest">
                      {String(order.status).replaceAll('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400">{order.payment_method} / {order.shipping_option}</span>
                  </div>
                  <p className="font-bold text-slate-900">Buyer: {order.profiles?.full_name || 'Anonymous buyer'}</p>
                  <p className="text-sm text-slate-500">
                    Deliver to: {order.delivery_address?.address || 'No address supplied'}
                  </p>
                  <div className="text-xs text-slate-500">
                    {order.items.map((item: any) => (
                      <span key={item.id} className="mr-3">
                        {item.quantity}x {item.products?.title || 'Product'}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {order.status === 'awaiting_seller_confirmation' && (
                    <>
                      <form action={async () => { 'use server'; await confirmOrder(order.id) }}>
                        <Button size="sm" className="rounded-xl">Confirm</Button>
                      </form>
                      <form action={async () => { 'use server'; await cancelSellerOrder(order.id) }}>
                        <Button size="sm" variant="outline" className="rounded-xl">Cancel</Button>
                      </form>
                    </>
                  )}
                  {order.status === 'preparing' && (
                    <form action={async () => { 'use server'; await markReadyForPickup(order.id) }}>
                      <Button size="sm" className="rounded-xl">Ready for Pickup</Button>
                    </form>
                  )}
                  {order.status === 'paid' && (
                    <form action={async () => { 'use server'; await markOrderPreparing(order.id) }}>
                      <Button size="sm" className="rounded-xl">Start Preparing</Button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

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
