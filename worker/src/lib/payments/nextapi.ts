import type { EnvBinding } from "../../schema/env";

export type CreateIntentInput = {
  amount: number;
  currency: string; // e.g., 'PHP'
  reference: string; // internal reference to reconcile
  description?: string;
  metadata?: Record<string, string | number | boolean>;
};

export type CreateIntentResult = {
  intentId: string;
  status: 'pending' | 'requires_action' | 'succeeded' | 'failed' | 'cancelled';
  checkoutUrl?: string;
  qrData?: string; // raw data to render QR
  providerReference?: string; // external reference/id
};

export type GetStatusResult = {
  intentId: string;
  status: 'pending' | 'requires_action' | 'succeeded' | 'failed' | 'cancelled';
  paidAt?: string;
  failureCode?: string;
};

function buildAuthHeader(env: EnvBinding): string {
  const key = env.NEXTPAY_API_KEY;
  const secret = env.NEXTPAY_SECRET_KEY;
  const token = Buffer.from(`${key}:${secret}`).toString('base64');
  return `Basic ${token}`;
}

export async function createPaymentIntent(
  env: EnvBinding,
  input: CreateIntentInput,
): Promise<CreateIntentResult> {
  const baseUrl = env.NEXTAPI_BASE_URL.replace(/\/$/, '');
  const rawPath = env.NEXTAPI_CREATE_INTENT_PATH || '/payments/intents';
  const path = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  const url = `${baseUrl}${path}`;

  // Convert amount to cents (NextPay expects amount_cents)
  const amountCents = Math.round(input.amount * 100);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': buildAuthHeader(env),
    },
    body: JSON.stringify({
      account_id: env.NEXTPAY_ACCOUNT_ID,
      currency: input.currency,
      amount_cents: amountCents,
      reference_number: input.reference,
      payment_methods: {
        qrph: {
          enabled: true,
        },
        online_banking: true,
      },
      description: input.description,
      metadata: input.metadata,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`createPaymentIntent failed: ${res.status} ${text}`);
  }

  const data = await res.json() as any;
  return {
    intentId: data.payment_intent_id || data.id || data.intentId,
    status: data.status || 'pending',
    checkoutUrl: data.checkout_url || data.checkoutUrl,
    qrData: data.qr_data || data.qrData || data.qr || undefined,
    providerReference: data.reference_number || data.reference || data.providerReference,
  };
}

export async function getPaymentStatus(
  env: EnvBinding,
  intentId: string,
): Promise<GetStatusResult> {
  const baseUrl = env.NEXTAPI_BASE_URL.replace(/\/$/, '');
  const template = env.NEXTAPI_GET_INTENT_PATH || `/payments/intents/{id}`;
  const replaced = template
    .replace('{id}', encodeURIComponent(intentId))
    .replace(':payment_intent_id', encodeURIComponent(intentId));
  const path = replaced.startsWith('/') ? replaced : `/${replaced}`;
  const url = `${baseUrl}${path}`;

  const res = await fetch(url, {
    headers: {
      'Authorization': buildAuthHeader(env),
      // ...(env.NEXTPAY_ACCOUNT_ID ? { 'X-Account-Id': env.NEXTPAY_ACCOUNT_ID } : {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`getPaymentStatus failed: ${res.status} ${text}`);
  }

  const data = await res.json() as any;
  return {
    intentId: data.id || intentId,
    status: data.status,
    paidAt: data.paidAt,
    failureCode: data.failureCode,
  };
}


