'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '@/context/CartContext'

export default function Navbar({ session }: { session: any }) {
  const pathname = usePathname()
  const { itemCount, setIsCartOpen } = useCart()
  
  // Don't show generic nav on auth pages
  if (pathname.startsWith('/login')) return null

  const userRole = session?.user?.user_metadata?.role || "buyer" // default or fetched role from session

  return (
    <nav className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/70 border-b border-slate-200 dark:bg-slate-900/70 dark:border-slate-800 transition-all">
      <div className="flex h-16 items-center px-4 md:px-8 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2 mr-6 font-bold text-xl tracking-tight text-indigo-600 dark:text-indigo-400">
          Nexus
        </Link>
        <div className="flex-1 flex gap-4 text-sm font-medium text-slate-600 dark:text-slate-300">
          <Link href={`/dashboard/${userRole}`} className="hover:text-indigo-600 dark:hover:text-white transition-colors">
            {userRole.charAt(0).toUpperCase() + userRole.slice(1)} Dashboard
          </Link>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsCartOpen(true)}
            className="group relative flex items-center justify-center p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <svg className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full ring-2 ring-white dark:ring-slate-900 animate-in zoom-in duration-200">
                {itemCount}
              </span>
            )}
          </button>

          {session ? (
            <form action="/auth/signout" method="post">
              <button className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                Log Out
              </button>
            </form>
          ) : (
            <Link href="/login" className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-6 py-2 rounded-full text-sm font-bold shadow-sm hover:shadow-md transition-all">
              Log In
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
