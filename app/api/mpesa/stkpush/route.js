import { NextResponse } from 'next/server';
import { sendStkPush } from '../../../../lib/daraja';

export async function POST(req) {
  try {
    const body = await req.json();
    const consumerKey = process.env.DARAJA_CONSUMER_KEY;
    const consumerSecret = process.env.DARAJA_CONSUMER_SECRET;
    const businessShortCode = process.env.MPESA_SHORTCODE || body.shortcode || '174379';
    const passkey = process.env.MPESA_PASSKEY;
    const callbackUrl = process.env.MPESA_CALLBACK_URL || body.callbackUrl || 'https://example.com/mpesa-callback';

    const amount = body.amount || body.Amount || '1';
    const phoneNumber = body.phoneNumber || body.phone || body.PartyA;
    const accountReference = body.accountReference || body.account || 'Test';
    const transactionDesc = body.transactionDesc || body.description || 'Payment';

    if (!phoneNumber) {
      return NextResponse.json({ error: 'phoneNumber is required' }, { status: 400 });
    }

    if (!consumerKey || !consumerSecret || !passkey) {
      return NextResponse.json({
        status: 'mocked',
        message: 'STK Push simulated (credentials missing)',
        payload: body,
        checkoutRequestID: 'MOCK123456789'
      });
    }

    const result = await sendStkPush({
      consumerKey,
      consumerSecret,
      businessShortCode,
      passkey,
      amount,
      phoneNumber,
      accountReference,
      transactionDesc,
      callbackUrl
    });

    return NextResponse.json(result.data, { status: result.status });
  } catch (err) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
