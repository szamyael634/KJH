'use server'

import { createClient } from '@/utils/supabase/server'

export async function getAdminAnalytics() {
  const supabase = await createClient()
  
  // 1. Sales over time (last 7 days)
  // 2. Top categories
  // 3. User growth
  
  // For now, return mock data reflecting the structure for Recharts
  return {
    sales: [
      { name: 'Mon', total: 4000 },
      { name: 'Tue', total: 3000 },
      { name: 'Wed', total: 5000 },
      { name: 'Thu', total: 2780 },
      { name: 'Fri', total: 1890 },
      { name: 'Sat', total: 2390 },
      { name: 'Sun', total: 3490 },
    ],
    categories: [
      { name: 'Electronics', count: 400 },
      { name: 'Fashion', count: 300 },
      { name: 'Home', count: 200 },
      { name: 'Beauty', count: 150 },
    ],
    stats: {
      activeUsers: 1254,
      pendingVerifications: 12,
      openTickets: 5,
      totalGmv: 45290.40
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
