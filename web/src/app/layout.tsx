import type { Metadata } from 'next'
import { Outfit, Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import CartSidebar from '@/components/CartSidebar'
import SystemAssistant from '@/components/SystemAssistant'
import { createClient, hasSupabaseEnv } from '@/utils/supabase/server'
import { CartProvider } from '@/context/CartContext'
import { MessagingProvider } from '@/context/MessagingContext'

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
})

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Nexus Marketplace',
  description: 'Premium minimalist eCommerce platform',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = hasSupabaseEnv() ? await createClient() : null
  const { data } = supabase ? await supabase.auth.getSession() : { data: null }
  const session = data?.session
  const userId = session?.user?.id || null

  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <CartProvider>
          <MessagingProvider userId={userId}>
            <Navbar session={session} />
            <CartSidebar />
            <main className="flex-1 flex flex-col w-full relative">{children}</main>
            <SystemAssistant />
          </MessagingProvider>
        </CartProvider>
      </body>
    </html>
  )
}
