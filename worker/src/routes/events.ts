import { Hono } from 'hono';
import { authMiddleware, adminMiddleware } from '../lib/auth';
import { createDbClient } from '../db/types';
import type { EnvBinding } from '../schema/env';
import { EventStatus } from '../db/types';

// Define the context type for Hono
interface EventContext {
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

const eventRoutes = new Hono<EventContext>();

// Get all events (public)
eventRoutes.get('/', async (c) => {
  try {
    const { search, category, status, date, organizer, page = '1', limit = '10' } = c.req.query();
    
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query with filters
    let query = db
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
        db.fn.count('registrations.id').as('registration_count'),
        db.fn.countAll().over().as('total_count')
      ])
      .groupBy('events.id');
    
    // Apply filters
    if (search) {
      query = query.where((eb) =>
        eb.or([
          eb('events.name', 'ilike', `%${search}%`),
          eb('events.details', 'ilike', `%${search}%`),
          eb('events.venue', 'ilike', `%${search}%`)
        ])
      );
    }
    
    if (status) {
      query = query.where('events.status', '=', status as EventStatus);
    }
    
    if (date) {
      query = query.where('events.date', '>=', new Date(date));
    }
    
    if (organizer) {
      query = query.where('events.organizer', 'ilike', `%${organizer}%`);
    }
    
    const results = await query
      .orderBy('events.date', 'asc')
      .limit(parseInt(limit))
      .offset(offset)
      .execute();
    
    const totalCount = results.length > 0 ? Number(results[0].total_count) : 0;
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    
    return c.json({
      success: true,
      data: {
        events: results.map(({ total_count, ...event }) => event),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          totalPages,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      },
      message: 'Events retrieved successfully'
    });
    
  } catch (error) {
    console.error('Get events error:', error);
    
    return c.json({
      success: false,
      error: 'Failed to retrieve events',
      message: 'An error occurred while fetching events'
    }, 500);
  }
});

// Get event by ID (public)
eventRoutes.get('/:id', async (c) => {
  try {
    const eventId = c.req.param('id');
    
    if (!eventId) {
      return c.json({
        success: false,
        error: 'Event ID is required',
        message: 'Please provide a valid event ID'
      }, 400);
    }
    
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    
    // Get event details with registration count
    const event = await db
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
        db.fn.count('registrations.id').as('registration_count'),
        db.fn.count(db.case().when('registrations.payment_status', '=', 'paid').then(1).end()).as('paid_registrations'),
        db.fn.count(db.case().when('registrations.payment_status', '=', 'pending').then(1).end()).as('pending_registrations')
      ])
      .where('events.id', '=', eventId)
      .groupBy('events.id')
      .executeTakeFirst();
    
    if (!event) {
      return c.json({
        success: false,
        error: 'Event not found',
        message: 'The requested event does not exist'
      }, 404);
    }
    
    return c.json({
      success: true,
      data: {
        event
      },
      message: 'Event retrieved successfully'
    });
    
  } catch (error) {
    console.error('Get event by ID error:', error);
    
    return c.json({
      success: false,
      error: 'Failed to retrieve event',
      message: 'An error occurred while fetching the event'
    }, 500);
  }
});

// Create new event (admin only)
eventRoutes.post('/', authMiddleware, adminMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const { 
      name, 
      details, 
      date, 
      venue, 
      price, 
      capacity, 
      status = 'published',
      registrationDeadline,
      organizer
    } = body;
    
    // Validation
    if (!name || !details || !date || !venue || !price || !capacity) {
      return c.json({
        success: false,
        error: 'Missing required fields',
        message: 'Name, details, date, venue, price, and capacity are required'
      }, 400);
    }
    
    if (new Date(date) <= new Date()) {
      return c.json({
        success: false,
        error: 'Invalid date',
        message: 'Event date must be in the future'
      }, 400);
    }
    
    if (Number(price) < 0) {
      return c.json({
        success: false,
        error: 'Invalid price',
        message: 'Price cannot be negative'
      }, 400);
    }
    
    if (Number(capacity) <= 0) {
      return c.json({
        success: false,
        error: 'Invalid capacity',
        message: 'Capacity must be greater than 0'
      }, 400);
    }
    
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    
    const result = await db
      .insertInto('events')
      .values({
        name,
        details,
        date,
        venue,
        price: price.toString(),
        capacity: Number(capacity),
        status,
        registration_deadline: registrationDeadline || date,
        organizer: organizer || 'Gowra Events'
      })
      .returningAll()
      .executeTakeFirst();
    
    if (!result) {
      return c.json({
        success: false,
        error: 'Failed to create event',
        message: 'Event creation failed'
      }, 500);
    }
    
    console.log('Event created successfully:', {
      eventId: result.id,
      eventName: result.name,
      organizer: result.organizer,
      adminUser: c.get('user').email
    });
    
    return c.json({
      success: true,
      data: result,
      message: 'Event created successfully'
    }, 201);
    
  } catch (error) {
    console.error('Create event error:', error);
    
    return c.json({
      success: false,
      error: 'Failed to create event',
      message: 'An error occurred while creating the event'
    }, 500);
  }
});

// Update event (admin only)
eventRoutes.put('/:id', authMiddleware, adminMiddleware, async (c) => {
  try {
    const eventId = c.req.param('id');
    const body = await c.req.json();
    
    if (!eventId) {
      return c.json({
        success: false,
        error: 'Event ID is required',
        message: 'Please provide a valid event ID'
      }, 400);
    }
    
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    
    // Check if event exists
    const existingEvent = await db
      .selectFrom('events')
      .selectAll()
      .where('id', '=', eventId)
      .executeTakeFirst();
    
    if (!existingEvent) {
      return c.json({
        success: false,
        error: 'Event not found',
        message: 'The event to update does not exist'
      }, 404);
    }
    
    // Build update object
    const updateData: any = {
      updated_at: new Date()
    };
    
    const allowedFields = [
      'name', 'details', 'date', 'venue', 'price', 
      'capacity', 'status', 'registrationDeadline', 'organizer', 'imageUrl'
    ];
    
    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key) && value !== undefined) {
        if (key === 'registrationDeadline') {
          updateData.registration_deadline = value;
        } else if (key === 'imageUrl') {
          updateData.image_url = value;
        } else {
          updateData[key] = value;
        }
      }
    }
    
    if (Object.keys(updateData).length === 1) { // Only updated_at
      return c.json({
        success: false,
        error: 'No valid fields to update',
        message: 'Please provide at least one field to update'
      }, 400);
    }
    
    const result = await db
      .updateTable('events')
      .set(updateData)
      .where('id', '=', eventId)
      .returningAll()
      .executeTakeFirst();
    
    if (!result) {
      return c.json({
        success: false,
        error: 'Failed to update event',
        message: 'Event update failed'
      }, 500);
    }
    
    console.log('Event updated successfully:', {
      eventId: result.id,
      eventName: result.name,
      adminUser: c.get('user').email
    });
    
    return c.json({
      success: true,
      data: result,
      message: 'Event updated successfully'
    });
    
  } catch (error) {
    console.error('Update event error:', error);
    
    return c.json({
      success: false,
      error: 'Failed to update event',
      message: 'An error occurred while updating the event'
    }, 500);
  }
});

// Delete event (admin only)
eventRoutes.delete('/:id', authMiddleware, adminMiddleware, async (c) => {
  try {
    const eventId = c.req.param('id');
    
    if (!eventId) {
      return c.json({
        success: false,
        error: 'Event ID is required',
        message: 'Please provide a valid event ID'
      }, 400);
    }
    
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    
    // Check if event exists
    const existingEvent = await db
      .selectFrom('events')
      .selectAll()
      .where('id', '=', eventId)
      .executeTakeFirst();
    
    if (!existingEvent) {
      return c.json({
        success: false,
        error: 'Event not found',
        message: 'The event to delete does not exist'
      }, 404);
    }
    
    // Check if there are active registrations
    const registrations = await db
      .selectFrom('registrations')
      .select(db.fn.count('id').as('count'))
      .where('event_id', '=', eventId)
      .executeTakeFirst();
    
    const registrationCount = Number(registrations?.count || 0);
    
    if (registrationCount > 0) {
      return c.json({
        success: false,
        error: 'Cannot delete event',
        message: `Cannot delete event with ${registrationCount} active registrations`
      }, 409);
    }
    
    // Delete the event
    await db
      .deleteFrom('events')
      .where('id', '=', eventId)
      .execute();
    
    console.log('Event deleted successfully:', {
      eventId,
      eventName: existingEvent.name,
      adminUser: c.get('user').email
    });
    
    return c.json({
      success: true,
      message: 'Event deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete event error:', error);
    
    return c.json({
      success: false,
      error: 'Failed to delete event',
      message: 'An error occurred while deleting the event'
    }, 500);
  }
});

// Get event statistics (admin only)
eventRoutes.get('/stats/overview', authMiddleware, adminMiddleware, async (c) => {
  try {
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    
    // Get various event statistics
    const stats = await db
      .selectFrom('events')
      .select([
        db.fn.count('id').as('total_events'),
        db.fn.count(db.case().when('status', '=', 'published').then(1).end()).as('active_events'),
        db.fn.count(db.case().when('status', '=', 'cancelled').then(1).end()).as('cancelled_events'),
        db.fn.count(db.case().when('status', '=', 'completed').then(1).end()).as('completed_events'),
        db.fn.avg('price').as('average_price'),
        db.fn.sum('capacity').as('total_capacity')
      ])
      .executeTakeFirst();
    
    // Get top events by registration count
    const topEvents = await db
      .selectFrom('events')
      .leftJoin('registrations', 'events.id', 'registrations.event_id')
      .select([
        'events.name',
        'events.id',
        db.fn.count('registrations.id').as('registration_count'),
        'events.capacity'
      ])
      .groupBy(['events.id', 'events.name', 'events.capacity'])
      .orderBy('registration_count', 'desc')
      .limit(5)
      .execute();
    
    return c.json({
      success: true,
      data: {
        overview: stats,
        topEvents
      },
      message: 'Event statistics retrieved successfully'
    });
    
  } catch (error) {
    console.error('Get event stats error:', error);
    
    return c.json({
      success: false,
      error: 'Failed to retrieve event statistics',
      message: 'An error occurred while fetching event statistics'
    }, 500);
  }
});

export { eventRoutes };
