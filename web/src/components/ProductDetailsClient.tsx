import { useState, useEffect } from 'react'
import AddToCartButton from '@/components/AddToCartButton'
import { toggleWishlist, getWishlist } from '@/app/actions/wishlist'
import { useMessaging } from '@/context/MessagingContext'
import { getOrCreateChatRoom } from '@/app/actions/chat'

export default function ProductDetailsClient({ product, userId }: { product: any, userId?: string }) {
  const { setActiveRoomId, setIsChatOpen } = useMessaging()
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)

  // ... (previous state and handlers)

  const handleStartChat = async () => {
    if (!userId) {
      alert('Please log in to chat with the seller!')
      return
    }
    try {
      const roomId = await getOrCreateChatRoom(userId, product.seller_id)
      setActiveRoomId(roomId)
      setIsChatOpen(true)
    } catch (err) {
      console.error('Failed to start chat', err)
    }
  }

  useEffect(() => {
    if (userId) {
       getWishlist(userId).then(({ data }) => {
         const exists = data?.some(item => item.product_id === product.id)
         setIsWishlisted(!!exists)
       })
    }
  }, [userId, product.id])

  const increment = () => setQuantity(q => q + 1)
  const decrement = () => setQuantity(q => (q > 1 ? q - 1 : 1))

  const handleWishlist = async () => {
    if (!userId) {
      alert('Please log in to add items to your wishlist!')
      return
    }
    const { error } = await toggleWishlist(product.id, userId)
    if (!error) setIsWishlisted(!isWishlisted)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
      {/* Image Gallery */}
      <div className="space-y-4">
        <div className="aspect-square bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm relative group">
          {product.image_url ? (
            <img src={product.image_url} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">No Image</div>
          )}
          
          <button 
            onClick={handleWishlist}
            className={`absolute top-6 right-6 p-4 rounded-2xl shadow-xl transition-all ${
              isWishlisted 
                ? 'bg-red-500 text-white translate-y-0 opacity-100' 
                : 'bg-white dark:bg-slate-800 text-slate-400 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0'
            }`}
          >
            <svg className="w-6 h-6" fill={isWishlisted ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Info Panel */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full">
            {product.category || 'Tech'}
          </span>
          <div className="flex items-center gap-1 text-amber-500">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            <span className="text-sm font-bold">{product.avg_rating || '5.0'}</span>
            <span className="text-slate-400 text-xs text-medium">({product.review_count || '0'} reviews)</span>
          </div>
        </div>

        <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight mb-4">
          {product.title}
        </h1>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500">
            {product.profiles?.full_name?.charAt(0) || 'S'}
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Sold by</p>
            <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{product.profiles?.full_name || 'Anonymous Seller'}</p>
          </div>
        </div>

        <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-10 text-lg">
          {product.description || 'No description provided for this product.'}
        </p>

        <div className="mt-auto space-y-8">
          <div className="flex items-baseline gap-4">
            <span className="text-4xl font-black text-slate-900 dark:text-white">${product.price}</span>
            <span className="text-slate-400 line-through text-lg">${(product.price * 1.2).toFixed(2)}</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-2xl p-1 shrink-0 border border-slate-200 dark:border-slate-800">
              <button 
                onClick={decrement}
                className="w-12 h-12 flex items-center justify-center text-xl font-bold hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                −
              </button>
              <span className="w-12 text-center font-black text-lg">{quantity}</span>
              <button 
                onClick={increment}
                className="w-12 h-12 flex items-center justify-center text-xl font-bold hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                +
              </button>
            </div>

            <AddToCartButton 
              product={product} 
              quantity={quantity} 
              className="flex-1 py-4 text-lg shadow-xl" 
            />

            <button 
               onClick={handleStartChat}
               className="p-4 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex items-center justify-center"
            >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
               <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl flex items-center justify-center text-xl">🚚</div>
               <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Shipping</p>
                  <p className="text-xs font-bold">Standard Delivery</p>
               </div>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
               <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl flex items-center justify-center text-xl">🛡️</div>
               <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Warranty</p>
                  <p className="text-xs font-bold">7 Days Return</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
