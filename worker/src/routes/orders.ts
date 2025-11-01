import { Hono } from 'hono';
import { authMiddleware } from '../lib/auth';
import type { EnvBinding } from '../schema/env';
import { createDbClient } from '../db/types';

interface OrdersContext {
  Bindings: EnvBinding;
  Variables: {
    user: {
      id: string;
      email: string;
      isAdmin: boolean;
    };
  };
}

export const ordersRoutes = new Hono<OrdersContext>();

// Create an order
ordersRoutes.post('/', authMiddleware, async (c) => {
  try {
    const { eventId, userId, totalAmount, currency } = await c.req.json();
    
    console.log('Order creation request:', { eventId, userId, totalAmount, currency });
    
    if (!eventId || !userId || !totalAmount || !currency) {
      console.log('Missing required fields:', { eventId: !!eventId, userId: !!userId, totalAmount: !!totalAmount, currency: !!currency });
      return c.json({ 
        success: false, 
        error: 'Missing required fields',
        message: 'eventId, userId, totalAmount, and currency are required'
      }, 400);
    }
    
    if (currency !== 'PHP') {
      return c.json({ 
        success: false, 
        error: 'Only PHP currency is supported',
        message: 'Currency must be PHP'
      }, 400);
    }

    if (totalAmount <= 0) {
      return c.json({ 
        success: false, 
        error: 'Invalid total amount',
        message: 'Total amount must be greater than 0'
      }, 400);
    }

    const db = createDbClient({ connection_string: c.env.DATABASE_URL });

    // Check if event exists
    const eventExists = await db
      .selectFrom('events')
      .select('id')
      .where('id', '=', eventId)
      .executeTakeFirst();

    if (!eventExists) {
      return c.json({ 
        success: false, 
        error: 'Event not found',
        message: 'The specified event does not exist'
      }, 404);
    }

    // Check if user exists
    const userExists = await db
      .selectFrom('users')
      .select('id')
      .where('id', '=', userId)
      .executeTakeFirst();

    if (!userExists) {
      return c.json({ 
        success: false, 
        error: 'User not found',
        message: 'The specified user does not exist'
      }, 404);
    }

    const inserted = await db
      .insertInto('orders')
      .values({
        event_id: eventId,
        user_id: userId,
        total_amount: totalAmount,
        currency,
        status: 'pending',
      })
      .returningAll()
      .executeTakeFirst();

    if (!inserted) {
      console.error('Failed to insert order into database');
      return c.json({ 
        success: false, 
        error: 'Failed to create order',
        message: 'Database insertion failed'
      }, 500);
    }

    console.log('Order created successfully:', inserted.id);
    return c.json({ success: true, data: inserted }, 201);
  } catch (error) {
    console.error('Create order error:', error);
    return c.json({ 
      success: false, 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, 500);
  }
});

// Get user orders
ordersRoutes.get('/my-orders', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const db = createDbClient({ connection_string: c.env.DATABASE_URL });

    const orders = await db
      .selectFrom('orders')
      .leftJoin('events', 'orders.event_id', 'events.id')
      .select([
        'orders.id',
        'orders.event_id',
        'orders.user_id',
        'orders.total_amount',
        'orders.currency',
        'orders.status',
        'orders.created_at',
        'orders.updated_at',
        'events.name as event_name',
        'events.date as event_date',
        'events.venue as event_venue',
        'events.organizer as event_organizer',
        'events.image_url as event_image'
      ])
      .where('orders.user_id', '=', user.id)
      .orderBy('orders.created_at', 'desc')
      .execute();

    return c.json({ 
      success: true, 
      data: { orders },
      message: 'Orders retrieved successfully'
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    return c.json({ 
      success: false, 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, 500);
  }
});


