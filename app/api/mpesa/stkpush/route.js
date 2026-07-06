import { NextResponse } from 'next/server';
import { sendStkPush } from '../../../../lib/daraja';

export async function POST(req) {
  try {
    const body = await req.json();
    const consumerKey = process.env.DARAJA_CONSUMER_KEY;
    const consumerSecret = process.env.DARAJA_CONSUMER_SECRET;
    const businessShortCode = process.env.MPESA_SHORTCODE || '174379';
    const passkey = process.env.MPESA_PASSKEY;
    const callbackUrl = process.env.MPESA_CALLBACK_URL || body.callbackUrl || 'https://example.com/mpesa-callback';

    if(!consumerKey || !consumerSecret || !passkey) {
      return NextResponse.json(
        { error: 'Missing Daraja credentials in env' },
        { status: 400 }
      );
    }

    const amount = body.amount || '1';
    const phoneNumber = body.phoneNumber || body.PartyA;
    if(!phoneNumber) {
      return NextResponse.json({ error: 'phoneNumber is required' }, { status: 400 });
    }

    const result = await sendStkPush({
      consumerKey,
      consumerSecret,
      businessShortCode,
      passkey,
      amount,
      phoneNumber,
      accountReference: body.accountReference || 'Test',
      transactionDesc: body.transactionDesc || 'Payment',
      callbackUrl
    });

    return NextResponse.json(result.data, { status: result.status });
  } catch(err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
