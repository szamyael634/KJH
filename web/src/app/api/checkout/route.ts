import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia', // Latest Stripe API version compatible with the library
});

export async function POST(req: Request) {
  try {
    const { items } = await req.json();

    // Create Checkout Sessions from body params.
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items, // Example: [{ price: 'price_1xxx', quantity: 1 }]
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/dashboard/buyer?success=true`,
      cancel_url: `${req.headers.get('origin')}/dashboard/buyer?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
