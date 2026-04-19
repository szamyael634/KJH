import { createClient } from '@/utils/supabase/server'
import AddToCartButton from '@/components/AddToCartButton'

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
              </div>

              <div className="mt-4">
                <AddToCartButton product={item} />
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
