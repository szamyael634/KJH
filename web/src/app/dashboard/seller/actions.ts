'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createProduct(formData: FormData) {
  const supabase = await createClient()

  // Verify auth session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Get form fields
  const title = formData.get('title') as string
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
