'use server'

import { createClient, hasSupabaseEnv } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createProductComplexity(formData: any, variations: any[], tags: string[]) {
  try {
    if (!hasSupabaseEnv()) {
      return { error: 'Supabase is not configured for this deployment.' }
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) return { error: authError.message }
    if (!user) return { error: 'Please sign in before publishing products.' }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          role: 'seller',
          full_name: user.user_metadata?.full_name || user.email || null,
          avatar_url: user.user_metadata?.avatar_url || null,
        },
        { onConflict: 'id', ignoreDuplicates: true }
      )

    if (profileError) {
      return { error: `Failed to prepare seller profile: ${profileError.message}` }
    }

    const title = String(formData.title || '').trim()
    if (!title) return { error: 'Product title is required.' }

    // 1. Insert Product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        seller_id: user.id,
        title,
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        stock: parseInt(formData.stock, 10) || 0,
        category: formData.category,
        image_url: formData.image_url
      })
      .select()
      .single()

    if (productError) return { error: `Failed to create product: ${productError.message}` }
    if (!product) return { error: 'Failed to create product.' }

    // 2. Insert Variations if any
    const validVariations = variations.filter((v) => String(v.name || '').trim())
    if (validVariations.length > 0) {
      const variationsData = validVariations.map((v) => ({
        product_id: product.id,
        name: String(v.name).trim(),
        price: parseFloat(v.price) || 0,
        stock: parseInt(v.stock, 10) || 0
      }))
      
      const { error: varError } = await supabase
        .from('product_variations')
        .insert(variationsData)
        
      if (varError) return { error: `Product was created, but variations failed: ${varError.message}` }
    }

    // 3. Insert Tags if any
    const validTags = tags.map((t) => t.trim()).filter(Boolean)
    if (validTags.length > 0) {
      const tagsData = validTags.map((tag) => ({
        product_id: product.id,
        tag
      }))

      const { error: tagError } = await supabase
        .from('product_tags')
        .insert(tagsData)
        
      if (tagError) return { error: `Product was created, but tags failed: ${tagError.message}` }
    }

    revalidatePath('/dashboard/seller')
    return { success: true, productId: product.id }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown publish error'
    return { error: `Failed to publish product: ${message}` }
  }
}
