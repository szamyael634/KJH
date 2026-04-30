'use server'

import { createClient } from '@/utils/supabase/server'

export async function getAdminAnalytics() {
  const supabase = await createClient()

  const since = new Date()
  since.setDate(since.getDate() - 6)
  since.setHours(0, 0, 0, 0)

  const [
    ordersResult,
    profilesResult,
    productsResult,
    pendingResult,
    ticketsResult,
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('total_amount, platform_commission_amount, created_at')
      .gte('created_at', since.toISOString()),
    supabase.from('profiles').select('id, role, verification_status'),
    supabase.from('products').select('category'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('verification_status', 'pending'),
    supabase.from('tickets').select('id', { count: 'exact', head: true }).in('status', ['open', 'in-progress']),
  ])

  const orders = ordersResult.data || []
  const profiles = profilesResult.data || []
  const products = productsResult.data || []

  const sales = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(since)
    date.setDate(since.getDate() + index)
    const key = date.toISOString().slice(0, 10)
    const total = orders
      .filter((order) => order.created_at?.slice(0, 10) === key)
      .reduce((sum, order) => sum + Number(order.total_amount || 0), 0)

    return {
      name: date.toLocaleDateString('en-US', { weekday: 'short' }),
      total,
    }
  })

  const categories = Object.entries(
    products.reduce((acc: Record<string, number>, product) => {
      const category = product.category || 'Uncategorized'
      acc[category] = (acc[category] || 0) + 1
      return acc
    }, {})
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  return {
    sales,
    categories,
    stats: {
      activeUsers: profiles.length,
      pendingVerifications: pendingResult.count || profiles.filter((p) => p.verification_status === 'pending').length,
      openTickets: ticketsResult.count || 0,
      totalGmv: orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0),
      platformRevenue: orders.reduce((sum, order) => sum + Number(order.platform_commission_amount || 0), 0),
    }
  }
}

export async function getPendingVerifications() {
  const supabase = await createClient()
  return await supabase
    .from('profiles')
    .select('*, verification_documents(*)')
    .eq('verification_status', 'pending')
}

export async function updateVerificationStatus(profileId: string, status: 'approved' | 'rejected') {
  const supabase = await createClient()
  return await supabase
    .from('profiles')
    .update({ verification_status: status })
    .eq('id', profileId)
}

export async function getBanners() {
  const supabase = await createClient()
  return await supabase.from('banners').select('*').order('sort_order', { ascending: true })
}

export async function createBanner(data: { image_url: string, title?: string, link_url?: string }) {
  const supabase = await createClient()
  return await supabase.from('banners').insert(data)
}
