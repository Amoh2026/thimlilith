// src/app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { verifyChatUser, unauthorized } from '@/lib/chat/auth-server';
import { adminDb } from '@/lib/firebase/admin'; // Added for Tip logic

const DIGITAL_SERVICES_TAX_CODE = 'txcd_10000000';

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json({ error: "Stripe key not configured on server" }, { status: 500 });
  }
  const stripe = new Stripe(stripeKey, { apiVersion: '2026-10-28.endive' });

  const user = await verifyChatUser(req);
  if (!user) return unauthorized();

  try {
    // Added creatorId to destructuring for Tips
    const { type, plan, amount, roomId, creatorId } = await req.json(); 
    let lineItems = [];
    let metadata: any = { uid: user.uid, type };
    let payment_intent_data: any = undefined; // For the Tip split

    if (type === 'room_join') {
      if (!amount || amount < 1) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
      if (!roomId) return NextResponse.json({ error: "Missing room ID" }, { status: 400 });
      
      lineItems = [{
        price_data: {
          currency: 'eur',
          product_data: { 
            name: 'Premium Room Access', 
            description: 'Monthly access to a private Thajmaath',
            tax_code: DIGITAL_SERVICES_TAX_CODE
          },
          unit_amount: amount * 100,
        },
        quantity: 1,
      }];
      metadata.roomId = roomId;
    } else if (type === 'donation') {
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
    } else if (type === 'tip') {
      // 🚨 NEW: 90/10 SPLIT LOGIC
      if (!amount || amount < 1) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
      if (!creatorId) return NextResponse.json({ error: "Missing creator ID" }, { status: 400 });

      // 1. Fetch creator to get their Stripe Account ID
      const creatorDoc = await adminDb().collection('users').doc(creatorId).get();
      const creatorData = creatorDoc.data();
      
      if (!creatorData?.stripeAccountId || !creatorData?.payoutsEnabled) {
        return NextResponse.json({ error: "Creator cannot receive tips right now (Stripe onboarding incomplete)." }, { status: 400 });
      }

      // 2. Calculate the 10% platform fee (in cents)
      const amountInCents = amount * 100;
      const platformFee = Math.round(amountInCents * 0.10); 

      lineItems = [{
        price_data: {
          currency: 'eur',
          product_data: { 
            name: 'Send a Tip 👑', 
            description: `Support ${creatorData.displayName || 'this creator'}`,
          },
          unit_amount: amountInCents,
        },
        quantity: 1,
      }];

      // 3. Set up Destination Charge (90% to creator, 10% stays with platform)
      payment_intent_data = {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: creatorData.stripeAccountId,
        },
      };
      
      metadata.creatorId = creatorId;
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
      // Your original redirect fix kept intact:
      success_url: metadata.roomId 
        ? `${req.headers.get('origin')}/en/rooms/${metadata.roomId}?payment=success`
        : `${req.headers.get('origin')}/en/rooms?payment=success`,
      cancel_url: metadata.roomId 
        ? `${req.headers.get('origin')}/en/rooms/${metadata.roomId}?payment=cancelled`
        : `${req.headers.get('origin')}/en/rooms?payment=cancelled`,
      client_reference_id: user.uid,
      metadata: metadata,
      // Inject the Tip split configuration if it's a tip
      ...(payment_intent_data && { payment_intent_data }), 
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}