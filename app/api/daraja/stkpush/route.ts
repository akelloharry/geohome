import { NextResponse } from 'next/server';
import { checkRateLimit } from '../../../../lib/rateLimiter';

function maskPhone(p) {
  if (!p || p.length < 4) return '****';
  return p.slice(0, 4) + '*****' + p.slice(-3);
}

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => null);
    if (!payload) return NextResponse.json({ error: 'Empty or malformed JSON' }, { status: 400 });

    const { phoneNumber, amount } = payload;

    if (!phoneNumber || !amount) {
      return NextResponse.json({ error: 'Phone number and amount are required' }, { status: 400 });
    }

    // Validate phone number
    const phoneRegex = /^254[0-9]{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
    }

    // Validate amount
    const allowedAmounts = [200, 500, 1000];
    const numericAmount = Number(amount);
    if (!Number.isInteger(numericAmount) || !allowedAmounts.includes(numericAmount)) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Rate limiting by IP
    const forwarded = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
    const ip = forwarded.split(',')[0].trim() || 'unknown';
    if (!checkRateLimit(ip)) return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });

    const consumerKey = process.env.DARAJA_CONSUMER_KEY;
    const consumerSecret = process.env.DARAJA_CONSUMER_SECRET;
    const passkey = process.env.DARAJA_PASSKEY;
    const shortcode = process.env.DARAJA_SHORTCODE || '174379';
    const callbackUrl = process.env.DARAJA_CALLBACK_URL;

    if (!consumerKey || !consumerSecret || !passkey) {
      return NextResponse.json({ error: 'Daraja credentials not configured' }, { status: 500 });
    }

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const baseUrl = process.env.DARAJA_BASE_URL || 'https://sandbox.safaricom.co.ke';

    const tokenRes = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      method: 'GET',
      headers: { Authorization: `Basic ${auth}` },
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return NextResponse.json({ error: 'Failed to get access token', details: tokenData }, { status: 500 });
    const accessToken = tokenData.access_token;

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

    const response = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: String(numericAmount),
        PartyA: phoneNumber,
        PartyB: shortcode,
        PhoneNumber: phoneNumber,
        CallBackURL: callbackUrl,
        AccountReference: `GEOH${Date.now().toString().slice(-6)}`,
        TransactionDesc: 'GeoHome Kenya - Search Pass',
      }),
    });

    const data = await response.json().catch(() => ({ status: response.status }));

    // Log attempt (mask phone)
    console.info('STK Push attempt', { ip, phone: maskPhone(phoneNumber), amount: numericAmount, result: data?.ResponseDescription || data });

    if (data.ResponseCode === '0' || data.responseCode === '0') {
      return NextResponse.json({ success: true, data: { MerchantRequestID: data.MerchantRequestID, CheckoutRequestID: data.CheckoutRequestID, ResponseCode: data.ResponseCode || data.responseCode, ResponseDescription: data.ResponseDescription || data.responseDescription, CustomerMessage: data.CustomerMessage } });
    }

    return NextResponse.json({ success: false, error: data.ResponseDescription || data.error || 'Payment initiation failed', code: data.ResponseCode || data.responseCode }, { status: 400 });
  } catch (error) {
    console.error('STK Push error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
