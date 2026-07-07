import { NextResponse } from 'next/server';

export async function GET() {
  const consumerKey = process.env.DARAJA_CONSUMER_KEY;
  const consumerSecret = process.env.DARAJA_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    return NextResponse.json({ error: 'Daraja credentials not configured' }, { status: 500 });
  }

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  const baseUrl = process.env.DARAJA_BASE_URL || 'https://sandbox.safaricom.co.ke';

  try {
    const response = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      method: 'GET',
      headers: { Authorization: `Basic ${auth}` }
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Token error:', error);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}
