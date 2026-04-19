'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

async function checkRiderRole() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
    
  return profile?.role === 'rider' ? user.id : null
}

export async function claimOrder(orderId: string) {
  const riderId = await checkRiderRole()
  if (!riderId) return { error: 'Unauthorized: Riders only' }

  const supabase = await createClient()

  // 1. Verify order is still available ('paid' and no rider assigned)
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('status, rider_id')
    .eq('id', orderId)
    .single()

  if (fetchError || order.status !== 'paid' || order.rider_id) {
    return { error: 'Order is no longer available for pickup' }
  }

  // 2. Claim the order
  const { error: updateError } = await supabase
    .from('orders')
    .update({ 
      rider_id: riderId,
      status: 'in_transit'
    })
    .eq('id', orderId)

  if (updateError) return { error: updateError.message }

  revalidatePath('/dashboard/rider')
  return { success: true }
}

export async function completeDelivery(orderId: string) {
  const riderId = await checkRiderRole()
  if (!riderId) return { error: 'Unauthorized' }

  const supabase = await createClient()

  // 1. Verify this rider is the one delivering it
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('rider_id, status')
    .eq('id', orderId)
    .single()

  if (fetchError || order.rider_id !== riderId || order.status !== 'in_transit') {
    return { error: 'You are not assigned to this delivery or it is in the wrong state' }
  }

  // 2. Complete the delivery
  const { error: updateError } = await supabase
    .from('orders')
    .update({ status: 'delivered' })
    .eq('id', orderId)

  if (updateError) return { error: updateError.message }

  revalidatePath('/dashboard/rider')
  return { success: true }
}
