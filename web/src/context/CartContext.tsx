'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export type CartItem = {
  product_id: string
  seller_id: string
  title: string
  price: number
  quantity: number
  image_url: string | null
}

type CartContextType = {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  totalPrice: number
  itemCount: number
  isCartOpen: boolean
  setIsCartOpen: (open: boolean) => void
  voucher: string | null
  discount: number
  applyVoucher: (code: string | null, value: number) => void
  canUseCart: boolean
  defaultDeliveryAddress: string
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({
  children,
  userId,
  userRole,
  defaultDeliveryAddress = '',
}: {
  children: React.ReactNode
  userId: string | null
  userRole: string | null
  defaultDeliveryAddress?: string
}) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const canUseCart = userRole === 'buyer' || !userRole
  const cartKey = userId ? `kjh-cart-${userId}` : 'kjh-cart-guest'

  // Load from local storage on mount
  useEffect(() => {
    if (!canUseCart) {
      setItems([])
      setIsCartOpen(false)
      setIsInitialized(true)
      return
    }

    const savedCart = localStorage.getItem(cartKey)
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart))
      } catch (e) {
        console.error('Failed to parse cart', e)
      }
    } else {
      setItems([])
    }
    setIsInitialized(true)
  }, [cartKey, canUseCart])

  // Save to local storage on change
  useEffect(() => {
    if (isInitialized && canUseCart) {
      localStorage.setItem(cartKey, JSON.stringify(items))
    }
  }, [items, isInitialized, cartKey, canUseCart])

  const addItem = (newItem: CartItem) => {
    if (!canUseCart) return
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === newItem.product_id)
      if (existing) {
        return prev.map((i) =>
          i.product_id === newItem.product_id
            ? { ...i, quantity: i.quantity + newItem.quantity }
            : i
        )
      }
      return [...prev, newItem]
    })
    setIsCartOpen(true) // Auto-open when adding
  }

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }
    setItems((prev) =>
      prev.map((i) => (i.product_id === productId ? { ...i, quantity } : i))
    )
  }

  const clearCart = () => setItems([])

  const [voucher, setVoucher] = useState<string | null>(null)
  const [discount, setDiscount] = useState(0)

  const applyVoucher = (code: string | null, value: number) => {
    setVoucher(code)
    setDiscount(value)
  }

  const rawTotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const totalPrice = Math.max(0, rawTotal - discount)
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalPrice,
        itemCount,
              isCartOpen,
        setIsCartOpen,
        voucher,
        discount,
        applyVoucher,
        canUseCart,
        defaultDeliveryAddress,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
