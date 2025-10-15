import { createDbClient, type DatabaseClient } from '../db/types';
import type { EnvBinding } from '../schema/env';

export async function issueTicketsForOrder(env: EnvBinding, db: DatabaseClient, orderId: string) {
  // Check if issuance already exists
  const existing = await db
    .selectFrom('ticket_issuances')
    .selectAll()
    .where('order_id', '=', orderId)
    .executeTakeFirst();
  if (existing) return { alreadyIssued: true };

  const order = await db
    .selectFrom('orders')
    .selectAll()
    .where('id', '=', orderId)
    .executeTakeFirst();
  if (!order) throw new Error('Order not found');
  if (order.status !== 'paid') throw new Error('Order not paid');

  // For now, we only record issuance; real ticket creation can be wired here
  await db
    .insertInto('ticket_issuances')
    .values({ order_id: order.id, user_id: order.user_id, event_id: order.event_id })
    .execute();

  return { issued: true };
}


