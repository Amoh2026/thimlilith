// src/app/api/stripe/connect/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { verifyChatUser, unauthorized } from '@/lib/chat/auth-server';
import { adminDb } from '@/lib/firebase/admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-10-28.endive',
});

export async function POST(req: NextRequest) {
  const user = await verifyChatUser(req);
  if (!user) return unauthorized();

  try {
    const userDocRef = adminDb().collection('users').doc(user.uid);
    const userDoc = await userDocRef.get();
    const userData = userDoc.data();

    let stripeAccountId = userData?.stripeAccountId;

    // 1. Create a Stripe Express account if they don't have one
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        metadata: { firebaseUID: user.uid },
        capabilities: {
          transfers: { requested: true },
        },
      });

      stripeAccountId = account.id;
      
      // Save it to Firestore
      await userDocRef.update({ stripeAccountId });
    }

    // 2. Create an onboarding link
    const origin = req.headers.get('origin') || 'http://localhost:3000';
    
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${origin}/en/profile?stripe=refresh`,
      return_url: `${origin}/en/profile?stripe=success`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: any) {
    console.error('Stripe Connect Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}