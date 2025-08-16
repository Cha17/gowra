import { Hono } from 'hono';
import { createDbClient } from '../db/types';
import { requireOrganizer, requireEventOwnership } from '../middlewares/auth';
import type { EnvBinding } from '../schema/env';

const eventRoutes = new Hono<{ Bindings: EnvBinding }>();

// Get public events (no authentication required)
eventRoutes.get('/', async (c) => {
  try {
    const { status, limit, search, organizer, page } = c.req.query();
    
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    
    let query = db
      .selectFrom('events')
      .selectAll();
    
    // Filter by status if provided
    if (status && ['draft', 'published', 'cancelled', 'completed'].includes(status)) {
      query = query.where('status', '=', status as any);
    }
    
    // Filter by organizer if provided
    if (organizer) {
      query = query.where('organizer', 'ilike', `%${organizer}%`);
    }
    
    // Search in name and details if provided
    if (search) {
      query = query.where((eb) => 
        eb.or([
          eb('name', 'ilike', `%${search}%`),
          eb('details', 'ilike', `%${search}%`)
        ])
      );
    }
    
    // Get total count for pagination
    const countQuery = query;
    const totalEvents = await countQuery.execute();
    const total = totalEvents.length;
    
    // Apply pagination if page is provided
    if (page) {
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit || '9');
      if (!isNaN(pageNum) && !isNaN(limitNum)) {
        const offset = (pageNum - 1) * limitNum;
        query = query.offset(offset).limit(limitNum);
      }
    } else if (limit) {
      // Apply limit if provided (for home page)
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum)) {
        query = query.limit(limitNum);
      }
    }
    
    // Order by creation date (newest first)
    query = query.orderBy('created_at', 'desc');
    
    const events = await query.execute();
    
    // Calculate pagination info
    const limitNum = parseInt(limit || '9');
    const currentPage = parseInt(page || '1');
    const totalPages = Math.ceil(total / limitNum);
    
    return c.json({
      success: true,
      data: {
        events,
        pagination: {
          page: currentPage,
          limit: limitNum,
          total,
          totalPages,
          hasNext: currentPage < totalPages,
          hasPrev: currentPage > 1
        }
      }
    });
  } catch (error) {
    console.error('Get public events error:', error);
    return c.json({ 
      success: false, 
      error: 'Internal server error' 
    }, 500);
  }
});

// Create new event (organizers only)
eventRoutes.post('/', requireOrganizer, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { 
      name, 
      details, 
      date, 
      imageUrl, 
      venue, 
      price, 
      capacity, 
      registrationDeadline 
    } = body;
    
    // Validation
    if (!name || !date || !venue) {
      return c.json({
        success: false,
        error: 'Name, date, and venue are required' 
      }, 400);
    }
    
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    
    // Create new event with organizer_id
    const newEvent = await db
      .insertInto('events')
      .values({
        name,
        organizer: user.name || user.email, // Keep legacy field for compatibility
        details: details || null,
        date: new Date(date),
        image_url: imageUrl || null,
        venue,
        status: 'draft',
        price: price || 0,
        capacity: capacity || null,
        registration_deadline: registrationDeadline ? new Date(registrationDeadline) : null,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returningAll()
      .executeTakeFirst();
    
    if (newEvent) {
      return c.json({
        success: true,
        message: 'Event created successfully',
        event: newEvent
      });
    } else {
      return c.json({ 
        success: false, 
        error: 'Failed to create event' 
      }, 500);
    }
  } catch (error) {
    console.error('Create event error:', error);
      return c.json({
        success: false,
      error: 'Internal server error' 
      }, 500);
    }
});

// Get single event by ID (public, no authentication required)
eventRoutes.get('/:id', async (c) => {
  try {
    const eventId = c.req.param('id');
    
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    
    const event = await db
      .selectFrom('events')
      .selectAll()
      .where('id', '=', eventId)
      .executeTakeFirst();
    
    if (!event) {
      return c.json({ 
        success: false, 
        error: 'Event not found' 
      }, 404);
    }
    
    return c.json({
      success: true,
      data: {
        event
      }
    });
  } catch (error) {
    console.error('Get event error:', error);
    return c.json({ 
      success: false, 
      error: 'Internal server error' 
    }, 500);
  }
});

// Get organizer's events (organizers only)
eventRoutes.get('/my-events', requireOrganizer, async (c) => {
  try {
    const user = c.get('user');
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });

    // Get events owned by this organizer
    const events = await db
      .selectFrom('events')
      .selectAll()
      .where('organizer', '=', user.name || user.email) // Use legacy organizer field for now
      .orderBy('created_at', 'desc')
      .execute();

    return c.json({
      success: true,
      events,
      count: events.length
    });
  } catch (error) {
    console.error('Get my events error:', error);
    return c.json({
      success: false,
      error: 'Internal server error' 
    }, 500);
  }
});

// Update event (event owner only)
eventRoutes.put('/:id', requireEventOwnership, async (c) => {
  try {
    const eventId = c.req.param('id');
    const body = await c.req.json();
    const { 
      name, 
      details, 
      date, 
      imageUrl, 
      venue, 
      price, 
      capacity, 
      registrationDeadline,
      status 
    } = body;

    // Validation
    if (!name || !date || !venue) {
      return c.json({
        success: false,
        error: 'Name, date, and venue are required' 
      }, 400);
    }
    
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    
    // Update event
    const updatedEvent = await db
      .updateTable('events')
      .set({
        name,
        details: details || null,
        date: new Date(date),
        image_url: imageUrl || null,
        venue,
        status: status || 'draft',
        price: price || 0,
        capacity: capacity || null,
        registration_deadline: registrationDeadline ? new Date(registrationDeadline) : null,
      updated_at: new Date()
      })
      .where('id', '=', eventId)
      .returningAll()
      .executeTakeFirst();
    
    if (updatedEvent) {
      return c.json({
        success: true,
        message: 'Event updated successfully',
        event: updatedEvent
      });
    } else {
      return c.json({
        success: false,
        error: 'Failed to update event' 
      }, 500);
    }
  } catch (error) {
    console.error('Update event error:', error);
    return c.json({
      success: false,
      error: 'Internal server error' 
    }, 500);
  }
});

// Delete event (event owner only)
eventRoutes.delete('/:id', requireEventOwnership, async (c) => {
  try {
    const eventId = c.req.param('id');
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    
    // Delete event
    const result = await db
      .deleteFrom('events')
      .where('id', '=', eventId)
      .execute();
    
    if (result.length > 0) {
    return c.json({
      success: true,
      message: 'Event deleted successfully'
    });
    } else {
    return c.json({
      success: false,
        error: 'Event not found or already deleted' 
      }, 404);
    }
  } catch (error) {
    console.error('Delete event error:', error);
    return c.json({
      success: false,
      error: 'Internal server error' 
    }, 500);
  }
});

export { eventRoutes };
