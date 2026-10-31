// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  // 👇 Stripe init MUST be inside the handler
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!stripeKey || !webhookSecret) {
    return new NextResponse('Stripe keys not configured', { status: 500 });
  }
  
  const stripe = new Stripe(stripeKey, { apiVersion: '2026-09-30.endive' });
  
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const uid = session.client_reference_id;
    const type = session.metadata?.type;
    const plan = session.metadata?.plan;
    const donationAmount = Number(session.metadata?.donationAmount || 0);

    if (uid) {
      const db = adminDb();
      const userRef = db.collection('users').doc(uid);

      if (type === 'room_join') {
        const roomId = session.metadata?.roomId;
        if (roomId && uid) {
          await db.collection('rooms').doc(roomId).update({
            members: FieldValue.arrayUnion(uid)
          });
        }
      } else if (type === 'donation') {
        await userRef.set({
          isDonator: true,
          totalDonated: FieldValue.increment(donationAmount),
        }, { merge: true });
      } else if (plan) {
        const now = Date.now();
        let expiresAt = now + (plan === 'session' ? 24*60*60*1000 : plan === 'monthly' ? 30*24*60*60*1000 : 365*24*60*60*1000);
        await userRef.set({
          isPremium: true,
          premiumPlan: plan,
          premiumExpiresAt: expiresAt,
        }, { merge: true });
      }
    }
  }
  return new NextResponse(null, { status: 200 });
}