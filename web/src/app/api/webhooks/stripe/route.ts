import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';

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

    if (!buyer_id) {
       return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
    }

    const supabase = await createClient();

    // 2. Create the Order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id,
        total_amount,
        status: 'paid',
        stripe_session_id: session.id
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
