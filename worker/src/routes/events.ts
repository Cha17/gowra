import { Hono } from 'hono';
import { createDbClient } from '../db/types';
import { requireAuth, requireOrganizer, requireEventOwnership } from '../middlewares/auth';
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

// Get single event by ID (no authentication required)
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
      event
    });
  } catch (error) {
    console.error('Get event error:', error);
    return c.json({ 
      success: false, 
      error: 'Internal server error' 
    }, 500);
  }
});

// Create new event (organizers only)
eventRoutes.post('/', requireAuth, requireOrganizer, async (c) => {
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
    
    // Create event
    const newEvent = await db
      .insertInto('events')
      .values({
        name,
        details: details || null,
        date: new Date(date),
        image_url: imageUrl || null,
        venue,
        status: status || 'draft',
        price: price || 0,
        capacity: capacity || null,
        registration_deadline: registrationDeadline ? new Date(registrationDeadline) : null,
        organizer: user.name || '',
        organizer_id: user.id,
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

// Get organizer's events (organizers only)
eventRoutes.get('/my-events', requireAuth, requireOrganizer, async (c) => {
  try {
    const user = c.get('user');
    console.log('🔍 User context:', { id: user.id, name: user.name, role: user.role });
    
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });

    // Get events owned by this organizer - using legacy organizer field temporarily
    console.log('🔍 Querying events for organizer:', user.id, 'name:', user.name);
    const events = await db
      .selectFrom('events')
      .selectAll()
      .where((eb) => eb('organizer', '=', user.name || ''))
      .orderBy('created_at', 'desc')
      .execute();
    console.log('✅ Events query completed, found:', events.length);

    return c.json({
      success: true,
      events
    });
  } catch (error) {
    console.error('Get my events error:', error);
    return c.json({ 
      success: false, 
      error: 'Internal server error' 
    }, 500);
  }
});

// Get organizer dashboard analytics (organizers only)
eventRoutes.get('/dashboard-analytics', requireAuth, requireOrganizer, async (c) => {
  try {
    const user = c.get('user');
    console.log('🔍 User context for analytics:', { id: user.id, name: user.name, role: user.role });
    
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });

    // Get events owned by this organizer - using legacy organizer field temporarily
    console.log('🔍 Querying events for organizer:', user.id, 'name:', user.name);
    const events = await db
      .selectFrom('events')
      .selectAll()
      .where((eb) => eb('organizer', '=', user.name || ''))
      .execute();
    console.log('✅ Events query completed, found:', events.length);

    // Get total registrations for all organizer's events
    const eventIds = events.map(e => e.id);
    let totalAttendees = 0;
    let activeEvents = 0;

    if (eventIds.length > 0) {
      const registrations = await db
        .selectFrom('registrations')
        .selectAll()
        .where((eb) => eb('event_id', 'in', eventIds))
        .execute();
      
      totalAttendees = registrations.length;
    }

    // Calculate statistics
    const totalEvents = events.length;
    activeEvents = events.filter(e => e.status === 'published').length;
    
    // Calculate average attendance percentage
    let avgAttendance = 0;
    if (totalEvents > 0) {
      const totalCapacity = events.reduce((sum, e) => sum + (e.capacity || 0), 0);
      if (totalCapacity > 0) {
        avgAttendance = Math.round((totalAttendees / totalCapacity) * 100);
      }
    }

    return c.json({
      success: true,
      analytics: {
        totalEvents,
        totalAttendees,
        avgAttendance,
        activeEvents
      }
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    return c.json({ 
      success: false, 
      error: 'Internal server error' 
    }, 500);
  }
});

// Update event (event owner only)
eventRoutes.put('/:id', requireAuth, requireEventOwnership, async (c) => {
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
eventRoutes.delete('/:id', requireAuth, requireEventOwnership, async (c) => {
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
