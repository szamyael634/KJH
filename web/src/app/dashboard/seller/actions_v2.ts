'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createProductComplexity(formData: any, variations: any[], tags: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 1. Insert Product
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      seller_id: user.id,
      title: formData.title,
      description: formData.description,
      price: parseFloat(formData.price) || 0,
      stock: parseInt(formData.stock, 10) || 0,
      category: formData.category,
      image_url: formData.image_url
    })
    .select()
    .single()

  if (productError) throw productError

  // 2. Insert Variations if any
  if (variations.length > 0) {
    const variationsData = variations.map(v => ({
      product_id: product.id,
      name: v.name,
      price: parseFloat(v.price) || 0,
      stock: parseInt(v.stock, 10) || 0
    }))
    
    const { error: varError } = await supabase
      .from('product_variations')
      .insert(variationsData)
      
    if (varError) throw varError
  }

  // 3. Insert Tags if any
  if (tags.length > 0) {
    const tagsData = tags.map(t => ({
      product_id: product.id,
      tag: t.trim()
    }))

    const { error: tagError } = await supabase
      .from('product_tags')
      .insert(tagsData)
      
    if (tagError) throw tagError
  }

  revalidatePath('/dashboard/seller')
  return { success: true, productId: product.id }
}
