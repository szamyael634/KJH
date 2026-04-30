'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

async function getSellerId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, sellerId: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  return { supabase, sellerId: profile?.role === 'seller' ? user.id : null }
}

export async function createProduct(formData: FormData) {
  const supabase = await createClient()

  // Verify auth session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Get form fields
  const title = formData.get('title') as string
  const category = formData.get('category') as string
  const description = formData.get('description') as string
  const price = parseFloat(formData.get('price') as string)
  const stock = parseInt(formData.get('stock') as string, 10)
  const file = formData.get('image') as File

  let image_url = null

  // 1. Upload image if provided
  if (file && file.size > 0) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Math.random()}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('product-images')
      .upload(fileName, file)

    if (uploadError) {
      return { error: `Failed to upload image: ${uploadError.message}` }
    }

    // Get public URL
    const { data: publicUrlData } = supabase
      .storage
      .from('product-images')
      .getPublicUrl(fileName)
      
    image_url = publicUrlData.publicUrl
  }

  // 2. Insert product into DB
  const { error: dbError } = await supabase
    .from('products')
    .insert({
      seller_id: user.id,
      title,
      category,
      description,
      price,
      stock,
      image_url,
    })

  if (dbError) {
    return { error: `Failed to create product: ${dbError.message}` }
  }

  revalidatePath('/dashboard/seller')
  revalidatePath('/dashboard/buyer')
  return { success: true }
}

async function sellerOwnsOrder(supabase: Awaited<ReturnType<typeof createClient>>, orderId: string, sellerId: string) {
  const { data } = await supabase
    .from('order_items')
    .select('id')
    .eq('order_id', orderId)
    .eq('seller_id', sellerId)
    .limit(1)
    .maybeSingle()

  return Boolean(data)
}

async function updateSellerOrder(orderId: string, status: string, patch: Record<string, unknown> = {}) {
  const { supabase, sellerId } = await getSellerId()
  if (!sellerId) return { error: 'Unauthorized: sellers only' }

  const ownsOrder = await sellerOwnsOrder(supabase, orderId, sellerId)
  if (!ownsOrder) return { error: 'Order not found for this seller' }

  const { error } = await supabase
    .from('orders')
    .update({ status, ...patch })
    .eq('id', orderId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/seller')
  revalidatePath('/dashboard/rider')
  revalidatePath('/dashboard/buyer/orders')
  return { success: true }
}

export async function confirmOrder(orderId: string) {
  return updateSellerOrder(orderId, 'preparing', { seller_confirmed_at: new Date().toISOString() })
}

export async function cancelSellerOrder(orderId: string) {
  return updateSellerOrder(orderId, 'cancelled', {
    cancellation_reason: 'Cancelled by seller',
    escrow_status: 'refunded',
  })
}

export async function markOrderPreparing(orderId: string) {
  return updateSellerOrder(orderId, 'preparing')
}

export async function markReadyForPickup(orderId: string) {
  return updateSellerOrder(orderId, 'ready_for_pickup', { ready_for_pickup_at: new Date().toISOString() })
}
