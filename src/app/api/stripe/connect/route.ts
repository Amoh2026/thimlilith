// src/app/api/stripe/connect/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { verifyChatUser, unauthorized } from '@/lib/chat/auth-server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return NextResponse.json({ error: "Stripe key not configured" }, { status: 500 });
  }

  // Initialized inside the function to prevent Next.js build errors
  const stripe = new Stripe(stripeKey, {
    apiVersion: '2026-10-28.endive',
  });

  const user = await verifyChatUser(req);
  if (!user) return unauthorized();

  try {
    const userDocRef = adminDb().collection('users').doc(user.uid);
    const userDoc = await userDocRef.get();
    const userData = userDoc.data();

    let stripeAccountId = userData?.stripeAccountId;

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
      await userDocRef.update({ stripeAccountId });
    }

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