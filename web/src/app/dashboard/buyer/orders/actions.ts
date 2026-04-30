'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function confirmReceipt(orderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('buyer_id, status')
    .eq('id', orderId)
    .single()

  if (fetchError || order.buyer_id !== user.id) {
    return { error: 'Order not found' }
  }

  if (!['delivered', 'arrived_at_delivery'].includes(order.status)) {
    return { error: 'This order is not ready for receipt confirmation.' }
  }

  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'buyer_confirmed',
      buyer_confirmed_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  if (updateError) return { error: updateError.message }

  await supabase.rpc('release_order_payouts', { p_order_id: orderId })

  revalidatePath('/dashboard/buyer/orders')
  revalidatePath('/dashboard/seller')
  revalidatePath('/dashboard/rider')
  return { success: true }
}
