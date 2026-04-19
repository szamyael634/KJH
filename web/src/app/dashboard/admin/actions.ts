'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

async function checkAdminRole() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
    
  return profile?.role === 'admin'
}

export async function deleteProduct(productId: string) {
  const isAdmin = await checkAdminRole()
  if (!isAdmin) return { error: 'Unauthorized Access' }

  const supabase = await createClient()
  const { error } = await supabase.from('products').delete().eq('id', productId)

  if (error) return { error: error.message }
  
  revalidatePath('/dashboard/admin')
  revalidatePath('/dashboard/buyer')
  return { success: true }
}

export async function toggleUserBan(userId: string, currentBanStatus: boolean) {
  const isAdmin = await checkAdminRole()
  if (!isAdmin) return { error: 'Unauthorized Access' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ is_banned: !currentBanStatus })
    .eq('id', userId)

  if (error) return { error: error.message }
  
  revalidatePath('/dashboard/admin')
  return { success: true }
}
