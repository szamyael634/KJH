import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const revalidate = 0

export default async function BuyerOrdersPage() {
  const supabase = await createClient()
  
  const { data, error: authError } = await supabase.auth.getUser()
  const user = data?.user
  if (!user || authError) {
    redirect('/login')
  }

  // Fetch orders with their items
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        products (title, image_url)
      )
    `)
    .eq('buyer_id', user?.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 pt-12 max-w-5xl mx-auto">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <Link href="/dashboard/buyer" className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-2 mb-2 hover:underline">
            ← Back to Shop
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Order History</h1>
        </div>
      </header>

      {!orders || orders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-100 dark:border-slate-800">
          <div className="text-4xl mb-4">🛒</div>
          <h3 className="text-xl font-bold">No orders yet</h3>
          <p className="text-slate-500 mt-2">Ready to make your first purchase?</p>
          <Link href="/dashboard/buyer" className="mt-6 inline-block bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="px-8 py-4 bg-slate-50 dark:bg-slate-800/50 flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex gap-8">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Order Placed</p>
                    <p className="font-bold text-sm">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Total</p>
                    <p className="font-bold text-sm">${order.total_amount.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <span className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                     order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                     order.status === 'paid' ? 'bg-blue-100 text-blue-700' :
                     'bg-amber-100 text-amber-700'
                   }`}>
                     {order.status}
                   </span>
                   <p className="text-[10px] text-slate-300">#{order.id.slice(0, 8)}</p>
                </div>
              </div>
              
              <div className="p-8">
                {order.order_items.map((item: any) => (
                  <div key={item.id} className="flex gap-4 items-center mb-6 last:mb-0">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800">
                      {item.products?.image_url && (
                        <img src={item.products.image_url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 dark:text-white">{item.products?.title}</h4>
                      <p className="text-xs text-slate-500">Quantity: {item.quantity} • ${item.price_at_purchase} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
