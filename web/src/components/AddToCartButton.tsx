'use client'

import { useCart, CartItem } from '@/context/CartContext'

export default function AddToCartButton({ 
  product 
}: { 
  product: { 
    id: string, 
    seller_id: string, 
    title: string, 
    price: number, 
    image_url: string | null 
  } 
}) {
  const { addItem } = useCart()

  const handleAdd = () => {
    addItem({
      product_id: product.id,
      seller_id: product.seller_id,
      title: product.title,
      price: product.price,
      image_url: product.image_url,
      quantity: 1
    })
  }

  return (
    <button 
      onClick={handleAdd}
      className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl py-3 text-sm font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
    >
      Add to Cart
    </button>
  )
}
