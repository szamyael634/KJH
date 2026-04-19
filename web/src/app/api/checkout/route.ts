import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-03-25.dahlia',
    });

    const supabase = await createClient();
    const { data, error: authError } = await supabase.auth.getUser();
    const user = data?.user;

    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';
    let items = [];
    let voucherCode = null;

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      const itemsStr = formData.get('items') as string;
      items = JSON.parse(itemsStr);
      voucherCode = formData.get('voucherCode') as string;
    } else {
      const body = await req.json();
      items = body.items;
      voucherCode = body.voucherCode;
    }

    // Re-verify voucher to prevent tampering
    let discountAmount = 0;
    if (voucherCode) {
        const { data: voucher } = await supabase
            .from('vouchers')
            .select('*')
            .eq('code', voucherCode)
            .maybeSingle();

        if (voucher && (!voucher.expires_at || new Date(voucher.expires_at) > new Date())) {
            const rawTotal = items.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0);
            if (voucher.seller_id) {
                const sellerTotal = items
                    .filter((item: any) => item.seller_id === voucher.seller_id)
                    .reduce((acc: number, item: any) => acc + item.price * item.quantity, 0);
                if (sellerTotal > 0) {
                    discountAmount = voucher.discount_type === 'percent' ? (sellerTotal * voucher.discount_value) / 100 : Math.min(sellerTotal, voucher.discount_value);
                }
            } else {
                discountAmount = voucher.discount_type === 'percent' ? (rawTotal * voucher.discount_value) / 100 : Math.min(rawTotal, voucher.discount_value);
            }
        }
    }

    // Map items to Stripe line items
    const line_items = items.map((item: any) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.title,
        },
        unit_amount: Math.round(item.price * 100), 
      },
      quantity: item.quantity,
    }));

    // Add discount as a negative line item if exists
    if (discountAmount > 0) {
        line_items.push({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: `Discount (${voucherCode})`,
                },
                unit_amount: -Math.round(discountAmount * 100),
            },
            quantity: 1,
        });
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/dashboard/buyer?success=true`,
      cancel_url: `${req.headers.get('origin')}/dashboard/buyer?canceled=true`,
      metadata: {
        buyer_id: user.id,
        voucher_code: voucherCode || '',
        discount_applied: discountAmount.toString(),
        items: JSON.stringify(items.map((i: any) => ({
            product_id: i.product_id,
            seller_id: i.seller_id,
            quantity: i.quantity,
            price: i.price
        })))
      },
    });

    // If it's a form post, we must redirect. If it's a JSON call, we return the URL.
    if (contentType.includes('application/x-www-form-urlencoded')) {
        return Response.redirect(session.url as string, 303);
    }

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
