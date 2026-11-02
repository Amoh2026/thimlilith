// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { adminDb } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    console.error('❌ Missing Stripe environment variables');
    return NextResponse.json({ error: 'Stripe configuration missing' }, { status: 500 });
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2026-10-28.endive',
  });

  const payload = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed:`, err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'account.updated':
        const account = event.data.object as Stripe.Account;
        const usersRef = adminDb().collection('users');
        const snapshot = await usersRef.where('stripeAccountId', '==', account.id).get();

        if (snapshot.empty) {
          console.warn(`⚠️ No user found with stripeAccountId: ${account.id}`);
          break;
        }

        const updatePromises = snapshot.docs.map((doc) => {
          return doc.ref.update({
            payoutsEnabled: account.payouts_enabled,
            chargesEnabled: account.charges_enabled,
            detailsSubmitted: account.details_submitted,
            updatedAt: new Date(),
          });
        });

        await Promise.all(updatePromises);
        console.log(`✅ Updated payout status for user(s) with Stripe ID: ${account.id}`);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}