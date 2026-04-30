'use client'

import { useState } from 'react'
import { useCart } from '@/context/CartContext'

export default function CartSidebar() {
  const { 
    items, 
    isCartOpen, 
    setIsCartOpen, 
    removeItem, 
    updateQuantity, 
    totalPrice,
    clearCart,
    voucher,
    discount,
    applyVoucher
  } = useCart()

  const [couponInput, setCouponInput] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [shippingOption, setShippingOption] = useState('standard')
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [isApplying, setIsApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleApplyVoucher = async () => {
    if (!couponInput) return
    setIsApplying(true)
    setError(null)
    try {
      const resp = await fetch('/api/vouchers/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput, items })
      })
      const data = await resp.json()
      if (data.error) throw new Error(data.error)
      applyVoucher(data.code, data.discount)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsApplying(false)
    }
  }

  if (!isCartOpen) return null

  const handleCheckout = async () => {
    try {
      if (!deliveryAddress.trim()) {
        setError('Delivery address is required.')
        return
      }

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          voucherCode: voucher,
          deliveryAddress,
          shippingOption,
          paymentMethod,
        }),
      })
      const data = await response.json()
      if (data.error) throw new Error(data.error)
      if (data.url) {
        window.location.href = data.url
      } else if (data.redirectUrl) {
        clearCart()
        window.location.href = data.redirectUrl
      }
    } catch (err: any) {
      setError(err.message || 'Checkout failed')
    }
  }

  const shippingFee = shippingOption === 'express' ? 12 : 5
  const orderTotal = Math.max(0, totalPrice + shippingFee)

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
      
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          
          <header className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Shopping Cart</h2>
            <button onClick={() => setIsCartOpen(false)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-4xl">🛒</div>
                <p className="text-slate-500">Your cart is empty.</p>
                <button onClick={() => setIsCartOpen(false)} className="text-indigo-600 font-bold hover:underline">Continue Shopping</button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.product_id} className="flex gap-4 items-start pb-6 border-b border-slate-50 dark:border-slate-800 last:border-0">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden shrink-0">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">No Image</div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-bold text-slate-900 dark:text-white leading-tight">{item.title}</h4>
                    <p className="text-indigo-600 font-bold text-sm">${item.price}</p>
                    
                    <div className="flex items-center gap-4 mt-2">
                       <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg">
                          <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)} className="px-3 py-1 hover:bg-slate-50 dark:hover:bg-slate-800">-</button>
                          <span className="px-3 text-sm font-bold">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)} className="px-3 py-1 hover:bg-slate-50 dark:hover:bg-slate-800">+</button>
                       </div>
                       <button onClick={() => removeItem(item.product_id)} className="text-xs text-red-500 hover:underline">Remove</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {items.length > 0 && (
            <footer className="px-6 py-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-6">
              
              {/* Voucher Section */}
              <div className="space-y-3">
                 <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Coupon Code" 
                      className="flex-1 bg-white dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                    />
                    <button 
                      onClick={handleApplyVoucher}
                      disabled={isApplying}
                      className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50"
                    >
                      {isApplying ? '...' : 'Apply'}
                    </button>
                 </div>
                 {error && <p className="text-[10px] text-red-500 font-bold">{error}</p>}
                 {voucher && <p className="text-[10px] text-emerald-500 font-bold">✓ Applied: {voucher}</p>}
              </div>

              <div className="space-y-2">
                <textarea
                  placeholder="Delivery address"
                  className="w-full bg-white dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={3}
                  value={deliveryAddress}
                  onChange={(event) => setDeliveryAddress(event.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    className="bg-white dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                    value={shippingOption}
                    onChange={(event) => setShippingOption(event.target.value)}
                  >
                    <option value="standard">Standard shipping</option>
                    <option value="express">Express shipping</option>
                  </select>
                  <select
                    className="bg-white dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                  >
                    <option value="card">Card / e-wallet</option>
                    <option value="cod">Cash on delivery</option>
                  </select>
                </div>
                <div className="flex justify-between items-center text-slate-500 text-sm">
                  <span>Subtotal</span>
                  <span>${items.reduce((acc, i) => acc + i.price * i.quantity, 0).toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between items-center text-emerald-600 text-sm font-bold">
                    <span>Discount</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-slate-500 text-sm">
                  <span>Shipping</span>
                  <span>${shippingFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-900 dark:text-white font-black text-2xl pt-2">
                  <span>Total</span>
                  <span>${orderTotal.toFixed(2)}</span>
                </div>
              </div>

              <button 
                onClick={handleCheckout}
                className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5"
              >
                Go to Checkout
              </button>
              <p className="text-[10px] text-slate-400 text-center uppercase tracking-widest leading-loose">
                Shipping and taxes calculated at checkout
              </p>
            </footer>
          )}
        </div>
      </div>
    </div>
  )
}
