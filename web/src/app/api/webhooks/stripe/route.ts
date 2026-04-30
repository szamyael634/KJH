import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-04-22.dahlia',
  });

  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  const payload = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // 1. Reconstruct order data from metadata
    const buyer_id = session.metadata?.buyer_id;
    const items = JSON.parse(session.metadata?.items || '[]');
    const total_amount = session.amount_total ? session.amount_total / 100 : 0;
    const delivery_address = JSON.parse(session.metadata?.delivery_address || '{}');

    if (!buyer_id) {
       return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
    }

    const supabase = createAdminClient();

    await supabase
      .from('profiles')
      .upsert(
        { id: buyer_id, role: 'buyer' },
        { onConflict: 'id', ignoreDuplicates: true }
      );

    // 2. Create the Order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id,
        total_amount,
        subtotal_amount: Number(session.metadata?.subtotal_amount || 0),
        shipping_fee: Number(session.metadata?.shipping_fee || 0),
        discount_amount: Number(session.metadata?.discount_applied || 0),
        platform_commission_amount: Number(session.metadata?.platform_commission_amount || 0),
        seller_payout_amount: Number(session.metadata?.seller_payout_amount || 0),
        rider_fee: Number(session.metadata?.rider_fee || 0),
        status: 'awaiting_seller_confirmation',
        escrow_status: 'held',
        payment_method: session.metadata?.payment_method || 'card',
        shipping_option: session.metadata?.shipping_option || 'standard',
        delivery_address,
        seller_confirm_by: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        stripe_session_id: session.id,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }

    // 3. Create Order Items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      seller_id: item.seller_id,
      quantity: item.quantity,
      price_at_purchase: item.price
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Order items error:', itemsError);
      // Ideally we should handle rollback here or marking order as failed
    }

    // 4. Update Stock (Simple version: decrement)
    for (const item of items) {
       await supabase.rpc('decrement_stock', { 
         p_id: item.product_id, 
         p_qty: item.quantity 
       });
    }

    console.log('Order fulfilled:', order.id);
  }

  return NextResponse.json({ received: true });
}
