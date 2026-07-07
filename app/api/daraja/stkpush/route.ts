import { NextResponse } from 'next/server';
import { rateLimiter } from '../../../../lib/rateLimiter';

const allowedAmounts = [200, 500, 1000];
const phoneRegex = /^254[0-9]{9}$/;

function maskPhone(value?: string) {
  if (!value || value.length < 4) return '****';
  return `${value.slice(0, 4)}*****${value.slice(-3)}`;
}

function getClientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
  return forwarded.split(',')[0].trim() || 'unknown';
}

function getTimestamp() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function generatePassword(shortcode: string, passkey: string, timestamp: string) {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!rateLimiter.check(ip, 3, 5 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
  }

  let payload: any = null;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const phoneNumber = payload?.phoneNumber || payload?.phone || payload?.PartyA;
  const amount = payload?.amount ?? payload?.Amount;

  if (!phoneNumber || amount == null) {
    return NextResponse.json({ error: 'Phone number and amount are required' }, { status: 400 });
  }

  if (!phoneRegex.test(String(phoneNumber))) {
    return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
  }

  const numericAmount = Number(amount);
  if (!Number.isInteger(numericAmount) || !allowedAmounts.includes(numericAmount)) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  const consumerKey = process.env.DARAJA_CONSUMER_KEY;
  const consumerSecret = process.env.DARAJA_CONSUMER_SECRET;
  const passkey = process.env.DARAJA_PASSKEY;
  const shortcode = process.env.DARAJA_SHORTCODE || '174379';
  const baseUrl = process.env.DARAJA_BASE_URL || 'https://sandbox.safaricom.co.ke';
  const callbackUrl = process.env.DARAJA_CALLBACK_URL;
  const callbackSecret = process.env.DARAJA_CALLBACK_SECRET;

  if (!consumerKey || !consumerSecret || !passkey) {
    return NextResponse.json({ error: 'Daraja credentials not configured' }, { status: 500 });
  }

  try {
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const tokenResponse = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      method: 'GET',
      headers: { Authorization: `Basic ${auth}` }
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      console.error('Daraja token fetch failed:', tokenData);
      return NextResponse.json({ error: 'Failed to authenticate with Daraja' }, { status: 500 });
    }

    const timestamp = getTimestamp();
    const password = generatePassword(shortcode, passkey, timestamp);
    const response = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: String(numericAmount),
        PartyA: phoneNumber,
        PartyB: shortcode,
        PhoneNumber: phoneNumber,
        CallBackURL: callbackSecret && callbackUrl ? `${callbackUrl}?secret=${callbackSecret}` : callbackUrl,
        AccountReference: `GEOH${Date.now().toString().slice(-6)}`,
        TransactionDesc: 'GeoHome Kenya - Search Pass'
      })
    });

    const data = await response.json().catch(() => ({ status: response.status }));
    console.info('STK Push attempt', { ip, phone: maskPhone(String(phoneNumber)), amount: numericAmount, result: data?.ResponseDescription || data });

    if (data.ResponseCode === '0' || data.responseCode === '0') {
      return NextResponse.json({
        success: true,
        data: {
          MerchantRequestID: data.MerchantRequestID,
          CheckoutRequestID: data.CheckoutRequestID,
          ResponseCode: data.ResponseCode || data.responseCode,
          ResponseDescription: data.ResponseDescription || data.responseDescription,
          CustomerMessage: data.CustomerMessage
        }
      });
    }

    return NextResponse.json({ success: false, error: data.ResponseDescription || data.error || 'Payment initiation failed', code: data.ResponseCode || data.responseCode }, { status: 400 });
  } catch (error) {
    console.error('STK Push error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
