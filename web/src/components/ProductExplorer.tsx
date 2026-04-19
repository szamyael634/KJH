'use client'

import { useState } from 'react'
import AddToCartButton from './AddToCartButton'

export default function ProductExplorer({ initialProducts }: { initialProducts: any[] }) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  const categories = ['All', 'Electronics', 'Gadgets', 'Peripherals', 'Accessories', 'Other']

  const filteredProducts = initialProducts.filter((product) => {
    const matchesSearch = product.title.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="relative flex-1 w-full">
           <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
           <input 
             type="text" 
             placeholder="Search products..." 
             className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-800 dark:text-white"
             value={search}
             onChange={(e) => setSearch(e.target.value)}
           />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat 
                  ? 'bg-slate-900 text-white dark:bg-indigo-600 shadow-lg' 
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
          {filteredProducts.map((item) => (
            <div key={item.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm hover:shadow-xl transition-all cursor-pointer hover:-translate-y-2 border border-slate-100 dark:border-slate-800 flex flex-col group">
              <div className="w-full aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl mb-4 overflow-hidden relative">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium">No Image</div>
                )}
                <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                  {item.category || 'Tech'}
                </div>
              </div>
              <p className="text-xs text-slate-400 mb-1 font-medium">{item.profiles?.full_name || 'Anonymous Seller'}</p>
              <h3 className="font-bold text-slate-900 dark:text-white leading-tight mb-2 h-10 line-clamp-2">{item.title}</h3>
              
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
          <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-4xl">🔍</div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">No results found</h3>
          <p className="text-slate-500 mt-2">Try adjusting your search or category filters.</p>
        </div>
      )}
    </div>
  )
}
