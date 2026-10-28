// src/app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { verifyChatUser, unauthorized } from '@/lib/chat/auth-server';

// Use the latest API version that supports Managed Payments
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { 
  apiVersion: '2026-09-30.endive' 
});

const DIGITAL_SERVICES_TAX_CODE = 'txcd_10000000';

export async function POST(req: NextRequest) {
  const user = await verifyChatUser(req);
  if (!user) return unauthorized();

  try {
    const { type, plan, amount } = await req.json();
    let lineItems = [];
    let metadata: any = { uid: user.uid, type };

    if (type === 'donation') {
      if (!amount || amount < 1) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
      lineItems = [{
        price_data: {
          currency: 'eur',
          product_data: { 
            name: 'Support Thimlilith ❤️', 
            description: 'Thank you for preserving the Kabyle language!',
            tax_code: DIGITAL_SERVICES_TAX_CODE
          },
          unit_amount: amount * 100,
        },
        quantity: 1,
      }];
      metadata.donationAmount = amount.toString();
    } else {
      const prices: Record<string, number> = { session: 199, monthly: 499, yearly: 3999 };
      if (!prices[plan]) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
      lineItems = [{
        price_data: {
          currency: 'eur',
          product_data: { 
            name: plan === 'session' ? 'Session Pass (24h)' : plan === 'monthly' ? 'Monthly Premium' : 'Yearly Premium',
            tax_code: DIGITAL_SERVICES_TAX_CODE
          },
          unit_amount: prices[plan],
        },
        quantity: 1,
      }];
      metadata.plan = plan;
    }

    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/en/rooms?payment=success`,
      cancel_url: `${req.headers.get('origin')}/en/rooms?payment=cancelled`,
      client_reference_id: user.uid,
      metadata: metadata,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}