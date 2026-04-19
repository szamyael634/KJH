'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navbar({ session }: { session: any }) {
  const pathname = usePathname()
  
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
        <div className="flex items-center gap-4">
          {session ? (
            <form action="/auth/signout" method="post">
              <button className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                Log Out
              </button>
            </form>
          ) : (
            <Link href="/login" className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-2 rounded-full text-sm font-bold shadow-sm hover:shadow-md transition-all">
              Log In
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
