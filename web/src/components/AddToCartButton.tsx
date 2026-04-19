import { useState } from 'react'
import { useCart, CartItem } from '@/context/CartContext'

export default function AddToCartButton({ 
  product,
  quantity = 1,
  className = ""
}: { 
  product: { 
    id: string, 
    seller_id: string, 
    title: string, 
    price: number, 
    image_url: string | null 
  },
  quantity?: number,
  className?: string
}) {
  const { addItem } = useCart()
  const [isAdded, setIsAdded] = useState(false)

  const handleAdd = () => {
    addItem({
      product_id: product.id,
      seller_id: product.seller_id,
      title: product.title,
      price: product.price,
      image_url: product.image_url,
      quantity: quantity
    })
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 2000)
  }

  return (
    <button 
      onClick={handleAdd}
      className={`w-full ${isAdded ? 'bg-emerald-500 text-white' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'} rounded-xl py-3 text-sm font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all ${className}`}
    >
      {isAdded ? '✓ Added' : 'Add to Cart'}
    </button>
  )
}
