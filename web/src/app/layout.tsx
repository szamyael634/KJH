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

function formatAddress(address: any) {
  if (!address || typeof address !== 'object') return ''
  return [
    address.houseNumber,
    address.street,
    address.barangayName || address.barangay,
    address.municipalityName || address.municipality,
    address.provinceName || address.province,
    address.regionName || address.region,
  ].filter(Boolean).join(', ')
}

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
  const { data: profile } = supabase && userId
    ? await supabase
      .from('profiles')
      .select('role, address_json')
      .eq('id', userId)
      .maybeSingle()
    : { data: null }
  const userRole = profile?.role || null
  const defaultDeliveryAddress = formatAddress(profile?.address_json)

  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <CartProvider userId={userId} userRole={userRole} defaultDeliveryAddress={defaultDeliveryAddress}>
          <MessagingProvider userId={userId}>
            <Navbar session={session} userRole={userRole} />
            <CartSidebar />
            <main className="flex-1 flex flex-col w-full relative">{children}</main>
            <SystemAssistant />
          </MessagingProvider>
        </CartProvider>
      </body>
    </html>
  )
}
