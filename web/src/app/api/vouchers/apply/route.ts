import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const { code, items } = await req.json()
    const supabase = await createClient()

    // 1. Fetch voucher
    const { data: voucher, error } = await supabase
      .from('vouchers')
      .select('*')
      .eq('code', code)
      .maybeSingle()

    if (error || !voucher) {
      return NextResponse.json({ error: 'Invalid voucher code' }, { status: 400 })
    }

    // 2. Check expiry
    if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Voucher has expired' }, { status: 400 })
    }

    // 3. Calculate discount
    let discount = 0
    const rawTotal = items.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0)

    if (voucher.seller_id) {
      // Store-specific: Only apply to items from this seller
      const sellerTotal = items
        .filter((item: any) => item.seller_id === voucher.seller_id)
        .reduce((acc: number, item: any) => acc + item.price * item.quantity, 0)

      if (sellerTotal === 0) {
        return NextResponse.json({ error: 'Voucher is not applicable to these items' }, { status: 400 })
      }

      if (voucher.discount_type === 'percent') {
        discount = (sellerTotal * voucher.discount_value) / 100
      } else {
        discount = Math.min(sellerTotal, voucher.discount_value)
      }
    } else {
      // Global: Apply to whole total
      if (voucher.discount_type === 'percent') {
        discount = (rawTotal * voucher.discount_value) / 100
      } else {
        discount = Math.min(rawTotal, voucher.discount_value)
      }
    }

    return NextResponse.json({ code: voucher.code, discount: Math.round(discount * 100) / 100 })
  } catch (err: any) {
    return NextResponse.json({ error: 'Voucher application failed' }, { status: 500 })
  }
}
