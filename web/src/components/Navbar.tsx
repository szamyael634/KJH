'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  ShoppingBag, 
  MessageSquare, 
  Bell, 
  User, 
  LayoutDashboard, 
  LogOut 
} from 'lucide-react'
import { useCart } from '@/context/CartContext'
import GlobalSearch from '@/components/GlobalSearch'
import NotificationBell from '@/components/NotificationBell'
import { Button } from './ui/Button'

export default function Navbar({ session }: { session: any }) {
  const pathname = usePathname()
  const { itemCount, setIsCartOpen } = useCart()
  const userId = session?.user?.id
  
  // Don't show generic nav on auth pages
  if (pathname.startsWith('/login') || pathname.startsWith('/auth')) return null

  const userRole = session?.user?.user_metadata?.role || "buyer" 

  return (
    <nav className="sticky top-0 z-40 w-full glass transition-all">
      <div className="flex h-16 items-center px-4 md:px-8 max-w-7xl mx-auto gap-4 md:gap-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-black text-2xl tracking-tighter text-slate-900 dark:text-white shrink-0">
          NEXUS
          <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
        </Link>
        
        {/* Search Bar - Center */}
        <div className="flex-1 max-w-2xl hidden md:block">
          <GlobalSearch />
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-1 md:gap-3">
          {/* Public / Search Link for Mobile or extra nav */}
          <Link href="/search" className="p-2 text-slate-500 hover:text-indigo-600 transition-colors md:hidden">
            <ShoppingBag className="w-6 h-6" />
          </Link>

          {/* Messages */}
          {userId && (
            <Link href="/messages" className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-all relative">
              <MessageSquare className="w-6 h-6" />
              {/* Optional: unread count dot */}
            </Link>
          )}

          {/* Notifications */}
          {userId && <NotificationBell userId={userId} />}

          {/* Cart */}
          <button 
            onClick={() => setIsCartOpen(true)}
            className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-all relative"
          >
            <ShoppingBag className="w-6 h-6" />
            {itemCount > 0 && (
              <span className="absolute top-1 right-1 bg-indigo-600 text-white text-[10px] font-black w-4 h-4 flex items-center justify-center rounded-full ring-2 ring-white dark:ring-slate-900 animate-in zoom-in duration-300">
                {itemCount}
              </span>
            )}
          </button>

          {/* Profile / Auth */}
          {session ? (
            <div className="flex items-center gap-2 ml-2">
              <Link href={`/dashboard/${userRole}`}>
                <Button variant="ghost" size="icon" className="rounded-full overflow-hidden border border-slate-100 dark:border-slate-800">
                  {session.user.user_metadata.avatar_url ? (
                    <img src={session.user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </Button>
              </Link>
              <form action="/auth/signout" method="post">
                <button className="p-2.5 text-slate-400 hover:text-red-500 transition-colors tooltip" title="Log Out">
                  <LogOut className="w-5 h-5" />
                </button>
              </form>
            </div>
          ) : (
            <Link href="/login" className="ml-2">
              <Button size="sm" className="rounded-full">Log In</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
