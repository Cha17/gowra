import type { Context, Next } from 'hono';
import type { EnvBinding } from '../schema/env';

function timingSafeEqual(a: string, b: string) {
  const aLen = a.length;
  const bLen = b.length;
  let match = aLen === bLen;
  const len = Math.min(aLen, bLen);
  for (let i = 0; i < len; i++) {
    match = match && a.charCodeAt(i) === b.charCodeAt(i);
  }
  return match;
}

export async function verifyWebhookMiddleware(c: Context<{ Bindings: EnvBinding }>, next: Next) {
  const secret = c.env.WEBHOOK_SECRET;
  if (!secret) return c.text('Unauthorized', 401);

  const signature = c.req.header('x-webhook-signature') || '';
  // Note: Replace with provider-specific signature scheme if available
  // For now, expect exact match with shared secret for simplicity
  if (!timingSafeEqual(signature, secret)) {
    return c.text('Unauthorized', 401);
  }

  await next();
}


