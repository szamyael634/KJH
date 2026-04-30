import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-04-22.dahlia',
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
    let deliveryAddress = null;
    let shippingOption = 'standard';
    let paymentMethod = 'card';

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      const itemsStr = formData.get('items') as string;
      items = JSON.parse(itemsStr);
      voucherCode = formData.get('voucherCode') as string;
      deliveryAddress = formData.get('deliveryAddress') as string;
      shippingOption = (formData.get('shippingOption') as string) || 'standard';
      paymentMethod = (formData.get('paymentMethod') as string) || 'card';
    } else {
      const body = await req.json();
      items = body.items;
      voucherCode = body.voucherCode;
      deliveryAddress = body.deliveryAddress;
      shippingOption = body.shippingOption || 'standard';
      paymentMethod = body.paymentMethod || 'card';
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          role: 'buyer',
          full_name: user.user_metadata?.full_name || user.email || null,
          avatar_url: user.user_metadata?.avatar_url || null,
        },
        { onConflict: 'id', ignoreDuplicates: true }
      );

    const subtotalAmount = items.reduce((acc: number, item: any) => acc + Number(item.price) * Number(item.quantity), 0);
    const shippingFee = shippingOption === 'express' ? 12 : 5;
    const riderFee = shippingOption === 'express' ? 8 : 4;

    // Re-verify voucher to prevent tampering
    let discountAmount = 0;
    if (voucherCode) {
      const { data: voucher } = await supabase
        .from('vouchers')
        .select('*')
        .eq('code', voucherCode)
        .maybeSingle();

      if (voucher && (!voucher.expires_at || new Date(voucher.expires_at) > new Date())) {
        if (voucher.seller_id) {
          const sellerTotal = items
            .filter((item: any) => item.seller_id === voucher.seller_id)
            .reduce((acc: number, item: any) => acc + item.price * item.quantity, 0);
          if (sellerTotal > 0) {
            discountAmount = voucher.discount_type === 'percent' ? (sellerTotal * voucher.discount_value) / 100 : Math.min(sellerTotal, voucher.discount_value);
          }
        } else {
          discountAmount = voucher.discount_type === 'percent' ? (subtotalAmount * voucher.discount_value) / 100 : Math.min(subtotalAmount, voucher.discount_value);
        }
      }
    }

    const payableAmount = Math.max(0, subtotalAmount + shippingFee - discountAmount);
    const platformCommissionAmount = Number((subtotalAmount * 0.10).toFixed(2));
    const sellerPayoutAmount = Math.max(0, subtotalAmount - platformCommissionAmount - discountAmount);

    if (paymentMethod === 'cod') {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_id: user.id,
          total_amount: payableAmount,
          subtotal_amount: subtotalAmount,
          shipping_fee: shippingFee,
          discount_amount: discountAmount,
          platform_commission_amount: platformCommissionAmount,
          seller_payout_amount: sellerPayoutAmount,
          rider_fee: riderFee,
          status: 'awaiting_seller_confirmation',
          escrow_status: 'held',
          payment_method: 'cod',
          shipping_option: shippingOption,
          delivery_address: typeof deliveryAddress === 'string' ? { address: deliveryAddress } : deliveryAddress,
          seller_confirm_by: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (orderError) {
        return NextResponse.json({ error: orderError.message }, { status: 500 });
      }

      const orderItems = items.map((item: any) => ({
        order_id: order.id,
        product_id: item.product_id,
        seller_id: item.seller_id,
        quantity: item.quantity,
        price_at_purchase: item.price,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) {
        return NextResponse.json({ error: itemsError.message }, { status: 500 });
      }

      return NextResponse.json({ orderId: order.id, redirectUrl: '/dashboard/buyer/orders' });
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

    if (shippingFee > 0) {
      line_items.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${shippingOption === 'express' ? 'Express' : 'Standard'} shipping`,
          },
          unit_amount: Math.round(shippingFee * 100),
        },
        quantity: 1,
      });
    }

    const discounts = [];
    if (discountAmount > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: Math.round(discountAmount * 100),
        currency: 'usd',
        duration: 'once',
        name: voucherCode ? `Voucher ${voucherCode}` : 'Order discount',
      });
      discounts.push({ coupon: coupon.id });
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      discounts,
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/dashboard/buyer?success=true`,
      cancel_url: `${req.headers.get('origin')}/dashboard/buyer?canceled=true`,
      metadata: {
        buyer_id: user.id,
        voucher_code: voucherCode || '',
        discount_applied: discountAmount.toString(),
        subtotal_amount: subtotalAmount.toString(),
        shipping_fee: shippingFee.toString(),
        shipping_option: shippingOption,
        payment_method: paymentMethod,
        platform_commission_amount: platformCommissionAmount.toString(),
        seller_payout_amount: sellerPayoutAmount.toString(),
        rider_fee: riderFee.toString(),
        delivery_address: JSON.stringify(typeof deliveryAddress === 'string' ? { address: deliveryAddress } : deliveryAddress || {}),
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
