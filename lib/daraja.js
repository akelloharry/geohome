function pad(n){return n<10? '0'+n: n}
export function getTimestamp(){
  const d = new Date();
  const Y = d.getFullYear();
  const M = pad(d.getMonth()+1);
  const D = pad(d.getDate());
  const h = pad(d.getHours());
  const m = pad(d.getMinutes());
  const s = pad(d.getSeconds());
  return `${Y}${M}${D}${h}${m}${s}`;
}

export function generatePassword(businessShortCode, passkey, timestamp){
  const raw = `${businessShortCode}${passkey}${timestamp}`;
  return Buffer.from(raw).toString('base64');
}

export async function getAccessToken(consumerKey, consumerSecret){
  const basic = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  const url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
  const res = await fetch(url, { headers: { Authorization: `Basic ${basic}` } });
  if (!res.ok) throw new Error(`Token request failed: ${res.status}`);
  const data = await res.json();
  return data.access_token || data.accessToken || data.token;
}

export async function sendStkPush({consumerKey, consumerSecret, businessShortCode, passkey, amount, phoneNumber, accountReference, transactionDesc, callbackUrl}){
  const token = await getAccessToken(consumerKey, consumerSecret);
  const timestamp = getTimestamp();
  const Password = generatePassword(businessShortCode, passkey, timestamp);

  const body = {
    BusinessShortCode: businessShortCode,
    Password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: String(amount),
    PartyA: phoneNumber,
    PartyB: businessShortCode,
    PhoneNumber: phoneNumber,
    CallBackURL: callbackUrl,
    AccountReference: accountReference || 'Test',
    TransactionDesc: transactionDesc || 'Payment'
  };

  const res = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const resp = await res.json().catch(()=>({status: res.status}));
  return { status: res.status, ok: res.ok, data: resp };
}

export default { getTimestamp, generatePassword, getAccessToken, sendStkPush };
