import { Hono } from 'hono';
import { authMiddleware, adminMiddleware } from '../lib/auth';
import { createDbClient } from '../db/types';
import type { EnvBinding } from '../schema/env';

interface AdminContext {
  Bindings: EnvBinding;
  Variables: {
    user: {
      id: string;
      email: string;
      name?: string;
      created_at: string;
      updated_at: string;
      isAdmin: boolean;
    };
  };
}

const adminRoutes = new Hono<AdminContext>();

// Apply auth and admin middleware to all admin routes
adminRoutes.use('*', authMiddleware);
adminRoutes.use('*', adminMiddleware);

// Get admin dashboard stats
adminRoutes.get('/stats', async (c) => {
  try {
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    
    // Get user count
    const userCount = await db
      .selectFrom('users')
      .select(db.fn.count('id').as('count'))
      .executeTakeFirst();
    
    // Get event count
    const eventCount = await db
      .selectFrom('events')
      .select(db.fn.count('id').as('count'))
      .executeTakeFirst();
    
    // Get registration count
    const registrationCount = await db
      .selectFrom('registrations')
      .select(db.fn.count('id').as('count'))
      .executeTakeFirst();
    
    // Get total revenue
    const revenueResult = await db
      .selectFrom('registrations')
      .select(db.fn.sum('payment_amount').as('total_revenue'))
      .where('payment_status', '=', 'paid')
      .executeTakeFirst();
    
    return c.json({
      success: true,
      stats: {
        totalUsers: Number(userCount?.count || 0),
        totalEvents: Number(eventCount?.count || 0),
        totalRegistrations: Number(registrationCount?.count || 0),
        totalRevenue: Number(revenueResult?.total_revenue || 0),
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return c.json({ error: 'Failed to fetch admin stats' }, 500);
  }
});

// Get all users (admin only)
adminRoutes.get('/users', async (c) => {
  try {
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    
    const users = await db
      .selectFrom('users')
      .select(['id', 'email', 'name', 'created_at', 'updated_at'])
      .orderBy('created_at', 'desc')
      .execute();
    
    return c.json({
      success: true,
      users: users || []
    });
  } catch (error) {
    console.error('Get users error:', error);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

// Get all events (admin only)
adminRoutes.get('/events', async (c) => {
  try {
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    
    const events = await db
      .selectFrom('events')
      .leftJoin('registrations', 'events.id', 'registrations.event_id')
      .select([
        'events.id',
        'events.name',
        'events.organizer',
        'events.details',
        'events.date',
        'events.image_url',
        'events.venue',
        'events.status',
        'events.price',
        'events.capacity',
        'events.registration_deadline',
        'events.created_at',
        'events.updated_at',
        db.fn.count('registrations.id').as('registration_count')
      ])
              .groupBy([
        'events.id', 'events.name', 'events.organizer', 'events.details', 
        'events.date', 'events.image_url', 'events.venue', 'events.status',
        'events.price', 'events.capacity', 'events.registration_deadline',
        'events.created_at', 'events.updated_at'
      ])
      .orderBy('events.created_at', 'desc')
      .execute();
    
    return c.json({
      success: true,
      events: events || []
    });
  } catch (error) {
    console.error('Get events error:', error);
    return c.json({ error: 'Failed to fetch events' }, 500);
  }
});

// Get all registrations (admin only)
adminRoutes.get('/registrations', async (c) => {
  try {
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    
    const registrations = await db
      .selectFrom('registrations')
      .innerJoin('users', 'registrations.user_id', 'users.id')
      .innerJoin('events', 'registrations.event_id', 'events.id')
      .select([
        'registrations.id',
        'registrations.user_id',
        'registrations.event_id',
        'registrations.payment_status',
        'registrations.payment_reference',
        'registrations.payment_amount',
        'registrations.registration_date',
        'registrations.created_at',
        'users.email as user_email',
        'users.name as user_name',
        'events.name as event_name',
        'events.date as event_date'
      ])
      .orderBy('registrations.registration_date', 'desc')
      .execute();
    
    return c.json({
      success: true,
      registrations: registrations || []
    });
  } catch (error) {
    console.error('Get registrations error:', error);
    return c.json({ error: 'Failed to fetch registrations' }, 500);
  }
});

// Create new event (admin only)
adminRoutes.post('/events', async (c) => {
  try {
    const body = await c.req.json();
    const { name, organizer, details, date, imageUrl, venue, price, capacity, registrationDeadline } = body;
    
    if (!name || !organizer || !date || !venue) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    
    const result = await db
      .insertInto('events')
      .values({
        name,
        organizer,
        details,
        date,
        image_url: imageUrl,
        venue,
        price: price || '0',
        capacity,
        registration_deadline: registrationDeadline,
        status: 'published'
      })
      .returningAll()
      .executeTakeFirst();
    
    if (result) {
      return c.json({
        success: true,
        message: 'Event created successfully',
        event: result
      });
    } else {
      return c.json({ error: 'Failed to create event' }, 500);
    }
  } catch (error) {
    console.error('Create event error:', error);
    return c.json({ error: 'Failed to create event' }, 500);
  }
});

// Update event (admin only)
adminRoutes.put('/events/:id', async (c) => {
  try {
    const eventId = c.req.param('id');
    const body = await c.req.json();
    
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    
    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.organizer !== undefined) updateData.organizer = body.organizer;
    if (body.details !== undefined) updateData.details = body.details;
    if (body.date !== undefined) updateData.date = body.date;
    if (body.imageUrl !== undefined) updateData.image_url = body.imageUrl;
    if (body.venue !== undefined) updateData.venue = body.venue;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.capacity !== undefined) updateData.capacity = body.capacity;
    if (body.registrationDeadline !== undefined) updateData.registration_deadline = body.registrationDeadline;
    if (body.status !== undefined) updateData.status = body.status;
    
    const result = await db
      .updateTable('events')
      .set(updateData)
      .where('id', '=', eventId)
      .returningAll()
      .executeTakeFirst();
    
    if (result) {
      return c.json({
        success: true,
        message: 'Event updated successfully',
        event: result
      });
    } else {
      return c.json({ error: 'Event not found' }, 404);
    }
  } catch (error) {
    console.error('Update event error:', error);
    return c.json({ error: 'Failed to update event' }, 500);
  }
});

// Delete event (admin only)
adminRoutes.delete('/events/:id', async (c) => {
  try {
    const eventId = c.req.param('id');
    
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    
    // Check if event has registrations
    const registrations = await db
      .selectFrom('registrations')
      .select(db.fn.count('id').as('count'))
      .where('registrations.event_id', '=', eventId)
      .executeTakeFirst();
    
    if (Number(registrations?.count || 0) > 0) {
      return c.json({ error: 'Cannot delete event with existing registrations' }, 400);
    }
    
    const result = await db
      .deleteFrom('events')
      .where('id', '=', eventId)
      .returning('id')
      .executeTakeFirst();
    
    if (result) {
      return c.json({
        success: true,
        message: 'Event deleted successfully'
      });
    } else {
      return c.json({ error: 'Event not found' }, 404);
    }
  } catch (error) {
    console.error('Delete event error:', error);
    return c.json({ error: 'Failed to delete event' }, 500);
  }
});

export { adminRoutes };
