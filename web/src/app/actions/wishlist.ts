'use client'

import { createClient } from '@/utils/supabase/client'

export async function toggleWishlist(productId: string, userId: string) {
  const supabase = createClient()

  // 1. Check if it exists
  const { data: existing } = await supabase
    .from('wishlist')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle()

  if (existing) {
    // Remove if exists
    return await supabase
      .from('wishlist')
      .delete()
      .eq('id', existing.id)
  } else {
    // Add if not exists
    return await supabase
      .from('wishlist')
      .insert({
        user_id: userId,
        product_id: productId
      })
  }
}

export async function getWishlist(userId: string) {
  const supabase = createClient()
  return await supabase
    .from('wishlist')
    .select('product_id')
    .eq('user_id', userId)
}
