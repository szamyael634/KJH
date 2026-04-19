import { createClient } from '@/utils/supabase/server'
import { claimOrder, completeDelivery } from './actions'
import { redirect } from 'next/navigation'

export const revalidate = 0

export default async function RiderDashboard() {
  const supabase = await createClient()

  const { data, error: authError } = await supabase.auth.getUser()
  const user = data?.user
  if (!user || authError) {
    redirect('/login')
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (!profile || profile.role !== 'rider') {
    redirect('/')
  }

  // 1. Available Orders (Paid, no rider)
  const { data: availableOrders } = await supabase
    .from('orders')
    .select('*, profiles:buyer_id(full_name)')
    .eq('status', 'paid')
    .is('rider_id', null)
    .order('created_at', { ascending: false })

  // 2. Active Deliveries (Assigned to this rider, in_transit)
  const { data: myDeliveries } = await supabase
    .from('orders')
    .select('*, profiles:buyer_id(full_name)')
    .eq('status', 'in_transit')
    .eq('rider_id', user?.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 pt-12 max-w-7xl mx-auto">
      <header className="mb-10 flex py-6 px-8 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Rider Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage pickups and active deliveries.</p>
        </div>
        <div className="flex items-center gap-3 bg-emerald-100 dark:bg-emerald-900/30 px-5 py-2 rounded-2xl border border-emerald-200 dark:border-emerald-800">
           <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
           <span className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Online</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Available for Pickup */}
        <section className="space-y-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Available for Pickup</h2>
            <span className="text-sm text-slate-500">{availableOrders?.length || 0} orders found</span>
          </div>
          
          <div className="flex flex-col gap-4">
            {availableOrders?.length === 0 && (
              <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
                <p className="text-slate-400">Searching for new orders...</p>
              </div>
            )}
            {availableOrders?.map((order) => (
              <div key={order.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex justify-between items-center group">
                <div>
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">New Request</p>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">Delivery to {order.profiles?.full_name || 'Anonymous'}</h3>
                  <p className="text-sm text-slate-500">Order ID: {order.id.slice(0,8)}</p>
                </div>
                <form action={async () => { 'use server'; await claimOrder(order.id); }}>
                  <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2 rounded-xl text-sm font-bold shadow-sm hover:scale-105 transition-transform">
                    Claim
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>

        {/* My Assignments */}
        <section className="space-y-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Active Deliveries</h2>
            <span className="text-sm text-slate-500">{myDeliveries?.length || 0} in progress</span>
          </div>

          <div className="flex flex-col gap-4">
            {myDeliveries?.map((order) => (
              <div key={order.id} className="bg-emerald-50 dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-emerald-100 dark:border-slate-800 flex justify-between items-center ring-2 ring-emerald-500/20">
                <div>
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">In Transit</p>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">Delivery to {order.profiles?.full_name || 'Anonymous'}</h3>
                  <p className="text-sm text-slate-500 italic">Address Placeholder: Mock Street, Tech City</p>
                </div>
                <form action={async () => { 'use server'; await completeDelivery(order.id); }}>
                  <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-md transition-all">
                    Deliver
                  </button>
                </form>
              </div>
            ))}
            {(!myDeliveries || myDeliveries.length === 0) && (
              <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                 <p className="text-slate-400">No active assignments</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
