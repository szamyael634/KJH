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
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';
    let items = [];

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      const itemsStr = formData.get('items') as string;
      items = JSON.parse(itemsStr);
    } else {
      const body = await req.json();
      items = body.items;
    }

    // Map items to Stripe line items
    const line_items = items.map((item: any) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.title,
        },
        unit_amount: Math.round(item.price * 100), // Stripe expects cents
      },
      quantity: item.quantity,
    }));

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/dashboard/buyer?success=true`,
      cancel_url: `${req.headers.get('origin')}/dashboard/buyer?canceled=true`,
      metadata: {
        buyer_id: user.id,
        // Serializing product data for the webhook to reconstruct order_items
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
