import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ProductDetailsClient from '@/components/ProductDetailsClient'

export const dynamic = 'force-dynamic'

export default async function ProductPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch User Session
  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id

  const { data: product } = await supabase
    .from('products')
    .select('*, profiles(full_name)')
    .eq('id', id)
    .maybeSingle()

  if (!product) {
    notFound()
  }

  // Fetch Reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, profiles(full_name, avatar_url)')
    .eq('product_id', id)
    .order('created_at', { ascending: false })

  // Check if user has purchased this item (to allow reviewing)
  let hasPurchased = false
  if (userId) {
    const { data: orders } = await supabase
      .from('order_items')
      .select('id')
      .eq('product_id', id)
      .eq('order_id', (await supabase.from('orders').select('id').eq('buyer_id', userId)).data?.[0]?.id || '') // Simplistic check for now
    hasPurchased = (orders?.length || 0) > 0
  }

  // Fetch related products (same category)
  const { data: related } = await supabase
    .from('products')
    .select('id, title, price, image_url, category')
    .eq('category', product.category)
    .neq('id', id)
    .limit(4)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <nav className="max-w-7xl mx-auto px-8 py-6">
        <ul className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
          <li><Link href="/" className="hover:text-indigo-600">Home</Link></li>
          <li className="text-slate-200">/</li>
          <li><Link href="/search" className="hover:text-indigo-600">Products</Link></li>
          <li className="text-slate-200">/</li>
          <li className="text-slate-600 dark:text-slate-300">{product.title}</li>
        </ul>
      </nav>

      <main className="max-w-7xl mx-auto px-8">
        <ProductDetailsClient product={product} userId={userId} />

        {/* Reviews Section */}
        <section className="mt-24 space-y-12">
           <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-8">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">Customer Feedback</h2>
              <div className="flex items-center gap-4">
                 <div className="text-right">
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{product.avg_rating || '5.0'}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aggregate Rating</p>
                 </div>
                 <div className="flex gap-0.5 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-6 h-6" fill={i < Math.round(product.avg_rating || 5) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    ))}
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-8">
                 {reviews && reviews.length > 0 ? (
                    reviews.map((review: any) => (
                      <div key={review.id} className="p-8 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                         <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold overflow-hidden">
                                  {review.profiles?.avatar_url ? (
                                    <img src={review.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                  ) : review.profiles?.full_name?.charAt(0) || 'U'}
                               </div>
                               <div>
                                  <p className="text-sm font-bold text-slate-900 dark:text-white">{review.profiles?.full_name || 'Anonymous User'}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{new Date(review.created_at).toLocaleDateString()}</p>
                               </div>
                            </div>
                            <div className="flex gap-0.5 text-amber-500">
                               {[...Array(5)].map((_, i) => (
                                 <svg key={i} className="w-4 h-4" fill={i < review.rating ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                               ))}
                            </div>
                         </div>
                         <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                            {review.comment}
                         </p>
                      </div>
                    ))
                 ) : (
                    <div className="py-12 bg-slate-100/50 dark:bg-slate-900/50 rounded-[32px] border border-dashed border-slate-200 dark:border-slate-800 text-center">
                       <p className="text-slate-400 font-bold italic">No reviews yet. Be the first to share your thoughts!</p>
                    </div>
                 )}
              </div>

              <div className="space-y-6">
                 {hasPurchased ? (
                    <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-[32px] border border-indigo-100 dark:border-indigo-900/20">
                       <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Write a Review</h3>
                       <p className="text-xs font-semibold text-slate-500 mb-6">Share your experience with this product to help others!</p>
                       <Link href="/dashboard/buyer/orders" className="block w-full text-center bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:scale-[1.02] transition-transform">
                          Leave Feedback
                       </Link>
                    </div>
                 ) : (
                    <div className="p-6 bg-slate-100 dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800">
                       <h3 className="text-lg font-black text-slate-400 mb-2">Write a Review</h3>
                       <p className="text-xs font-semibold text-slate-500">Only verified buyers can leave reviews for this product.</p>
                    </div>
                 )}
              </div>
           </div>
        </section>

        {/* Related Products */}
        {related && related.length > 0 && (
          <section className="mt-24 space-y-8">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((item) => (
                <Link 
                  key={item.id} 
                  href={`/products/${item.id}`}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:-translate-y-2 transition-all group"
                >
                  <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden mb-4">
                    <img src={item.image_url || ''} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={item.title} />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2 line-clamp-1">{item.title}</h3>
                  <p className="text-indigo-600 dark:text-indigo-400 font-extrabold">${item.price}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
