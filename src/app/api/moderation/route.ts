import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ flagged: false });
    }

    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'omni-moderation-latest',
        input: text,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI moderation error:', response.status, await response.text());
      return NextResponse.json({ flagged: false });
    }

    const data = await response.json();
    const flagged = data.results?.[0]?.flagged === true;
    return NextResponse.json({ flagged });
  } catch (error) {
    console.error('Moderation error:', error);
    return NextResponse.json({ flagged: false });
  }
}