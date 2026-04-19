import { createClient } from '@/utils/supabase/server'

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
      <header className="mb-10 flex py-6 px-8 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Discover</h1>
          <p className="text-slate-500 mt-1">Explore premium tech products from verified sellers.</p>
        </div>
        
        {/* Placeholder Cart Button */}
        <button className="flex items-center justify-center p-3 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors">
          <svg className="w-6 h-6 text-slate-700 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
        </button>
      </header>

      {products && products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((item) => (
            <div key={item.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm hover:shadow-xl transition-all cursor-pointer hover:-translate-y-2 border border-slate-100 dark:border-slate-800 flex flex-col group">
              <div className="w-full aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl mb-4 overflow-hidden relative">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium">No Image</div>
                )}
              </div>
              <p className="text-xs text-slate-400 mb-1 font-medium">{item.profiles?.full_name || 'Anonymous Seller'}</p>
              <h3 className="font-bold text-slate-900 dark:text-white leading-tight mb-2">{item.title}</h3>
              
              <div className="mt-auto pt-4 flex items-center justify-between">
                <p className="text-indigo-600 dark:text-indigo-400 font-extrabold text-lg">${item.price}</p>
                <form action="/api/checkout" method="POST">
                  <input type="hidden" name="items" value={JSON.stringify([{ 
                    price: item.price, 
                    quantity: 1, 
                    title: item.title,
                    product_id: item.id,
                    seller_id: item.seller_id
                  }])} />
                  <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg px-4 py-2 text-sm font-bold shadow-sm hover:opacity-90 transition-opacity">
                    Buy
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center flex flex-col items-center">
          <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
             <span className="text-4xl text-slate-300">📦</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Store is empty</h3>
          <p className="text-slate-500 mt-2 max-w-md">No products have been listed by any sellers yet. Check back soon!</p>
        </div>
      )}
    </div>
  )
}
