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

  // 1. Verify order is still available and no rider assigned.
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('status, rider_id')
    .eq('id', orderId)
    .single()

  if (fetchError || order.status !== 'ready_for_pickup' || order.rider_id) {
    return { error: 'Order is no longer available for pickup' }
  }

  // 2. Claim the order
  const { error: updateError } = await supabase
    .from('orders')
    .update({ 
      rider_id: riderId,
      status: 'assigned',
      assigned_at: new Date().toISOString()
    })
    .eq('id', orderId)

  if (updateError) return { error: updateError.message }

  revalidatePath('/dashboard/rider')
  return { success: true }
}

export async function markArrivedAtSeller(orderId: string) {
  const riderId = await checkRiderRole()
  if (!riderId) return { error: 'Unauthorized' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('orders')
    .update({ status: 'arrived_at_seller', rider_arrived_seller_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('rider_id', riderId)
    .in('status', ['assigned'])

  if (error) return { error: error.message }

  revalidatePath('/dashboard/rider')
  return { success: true }
}

export async function markPackagePickedUp(orderId: string) {
  const riderId = await checkRiderRole()
  if (!riderId) return { error: 'Unauthorized' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('orders')
    .update({ status: 'in_transit', picked_up_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('rider_id', riderId)
    .in('status', ['assigned', 'arrived_at_seller'])

  if (error) return { error: error.message }

  revalidatePath('/dashboard/rider')
  return { success: true }
}

export async function markArrivedAtDelivery(orderId: string) {
  const riderId = await checkRiderRole()
  if (!riderId) return { error: 'Unauthorized' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('orders')
    .update({ status: 'arrived_at_delivery', rider_arrived_delivery_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('rider_id', riderId)
    .eq('status', 'in_transit')

  if (error) return { error: error.message }

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

  if (fetchError || order.rider_id !== riderId || !['in_transit', 'arrived_at_delivery'].includes(order.status)) {
    return { error: 'You are not assigned to this delivery or it is in the wrong state' }
  }

  // 2. Complete the delivery
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'delivered',
      delivered_at: new Date().toISOString(),
      return_window_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    })
    .eq('id', orderId)

  if (updateError) return { error: updateError.message }

  revalidatePath('/dashboard/rider')
  return { success: true }
}

export async function markDeliveryAttempted(orderId: string, note = 'Buyer unavailable') {
  const riderId = await checkRiderRole()
  if (!riderId) return { error: 'Unauthorized' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('orders')
    .update({
      status: 'delivery_attempted',
      delivery_issue_note: note,
      delivery_attempts: 1,
    })
    .eq('id', orderId)
    .eq('rider_id', riderId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/rider')
  return { success: true }
}
