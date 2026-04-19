import { createClient } from '@/utils/supabase/server'
import { createProduct } from './actions'

export default async function SellerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch true dynamic stats
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('seller_id', user?.id)

  const activeProductsCount = products?.length || 0

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 pt-12 max-w-7xl mx-auto flex gap-8 flex-col lg:flex-row">
      <div className="flex-1">
        <header className="mb-10 flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Seller Console</h1>
            <p className="text-slate-500">Manage your storefront and orders.</p>
          </div>
          <div className="h-16 w-16 rounded-full border-4 border-indigo-500 bg-indigo-100 flex items-center justify-center text-xl font-bold text-indigo-700">
            {user?.email?.[0].toUpperCase() || 'S'}
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-medium text-slate-500 mb-1">Active Products</h3>
            <span className="text-3xl font-bold text-slate-900 dark:text-white">{activeProductsCount}</span>
          </div>
        </div>

        <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6">
          <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Your Products</h2>
          {activeProductsCount === 0 ? (
            <p className="text-slate-500 text-sm">No products listed yet. Create one to get started!</p>
          ) : (
            <div className="flex flex-col gap-4">
              {products?.map((product) => (
                <div key={product.id} className="flex gap-4 items-center border border-slate-100 dark:border-slate-800 p-4 rounded-xl">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.title} className="w-16 h-16 object-cover rounded-md bg-slate-100" />
                  ) : <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-md"></div>}
                  <div className="flex-1">
                    <h4 className="font-bold">{product.title}</h4>
                    <p className="text-sm text-slate-500">${product.price} - Stock: {product.stock}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="w-full lg:w-[400px]">
        <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 sticky top-24">
          <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">Add New Product</h2>
          <form action={async (f) => { 'use server'; await createProduct(f); }} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
              <input name="title" required className="mt-1 w-full rounded-md px-3 py-2 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
              <textarea name="description" rows={3} className="mt-1 w-full rounded-md px-3 py-2 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"></textarea>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Price ($)</label>
                <input name="price" type="number" step="0.01" required className="mt-1 w-full rounded-md px-3 py-2 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Stock</label>
                <input name="stock" type="number" required defaultValue="1" className="mt-1 w-full rounded-md px-3 py-2 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Product Image</label>
              <input name="image" type="file" accept="image/*" className="mt-1 w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900/30 dark:file:text-indigo-400" />
            </div>

            <button type="submit" className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-sm">
              Publish Product
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
