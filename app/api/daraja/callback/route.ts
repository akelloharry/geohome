import { NextResponse } from 'next/server';
import supabaseAdmin from '../../../../lib/supabaseAdmin';

function maskPhone(p) {
  if (!p || p.length < 4) return '****';
  return p.slice(0, 4) + '*****' + p.slice(-3);
}

export async function POST(request: Request) {
  try {
    // Verify secret on callback URL
    const url = new URL(request.url);
    const secret = url.searchParams.get('secret');
    if (secret !== process.env.DARAJA_CALLBACK_SECRET) {
      console.warn('Daraja callback unauthorized attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.info('📥 Daraja callback received (masked):', JSON.stringify(body?.Body?.stkCallback?.MerchantRequestID || 'no-id'));

    const stkCallback = body.Body?.stkCallback;
    if (!stkCallback) return NextResponse.json({ error: 'Invalid callback data' }, { status: 400 });

    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

    if (ResultCode === 0 || ResultCode === '0') {
      const metadata = CallbackMetadata?.Item || [];
      const amount = metadata.find((item: any) => item.Name === 'Amount')?.Value;
      const phoneNumber = metadata.find((item: any) => item.Name === 'PhoneNumber')?.Value;
      const transactionId = metadata.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value;

      console.info('✅ Payment successful:', { CheckoutRequestID, transactionId, amount, phone: maskPhone(phoneNumber) });

      // Idempotency: check if transaction already recorded
      const { data: existing, error: selErr } = await supabaseAdmin
        .from('search_passes')
        .select('id')
        .eq('payment_ref', transactionId)
        .maybeSingle();

      if (selErr) console.error('Supabase select error:', selErr);
      if (existing) {
        console.info('Callback already processed for', transactionId);
        return NextResponse.json({ success: true, already_processed: true });
      }

      const { error: insertErr } = await supabaseAdmin.from('search_passes').insert({
        expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        paid_amount: amount,
        payment_ref: transactionId,
      });

      if (insertErr) {
        console.error('Failed to create search pass:', insertErr);
        return NextResponse.json({ error: 'DB insert failed' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    console.warn('❌ Payment failed:', { CheckoutRequestID, ResultCode, ResultDesc });
    return NextResponse.json({ success: false, error: ResultDesc });
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
