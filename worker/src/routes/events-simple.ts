import { Hono } from 'hono';
import { createDbClient } from '../db/types';
import { requireAuth, requireOrganizer } from '../middlewares/auth';
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

// Get organizer's events (organizers only)
eventRoutes.get('/my-events', requireAuth, requireOrganizer, async (c) => {
  try {
    const user = c.get('user');
    console.log('🔍 User context:', { id: user.id, name: user.name, role: user.role });
    
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });

    // Get events owned by this organizer
    const events = await db
      .selectFrom('events')
      .selectAll()
      .where((eb) => eb('organizer_id', '=', user.id))
      .orderBy('created_at', 'desc')
      .execute();
    
    console.log('✅ Found events for organizer:', events.length);
    
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

    // Get events owned by this organizer
    const events = await db
      .selectFrom('events')
      .selectAll()
      .where((eb) => eb('organizer_id', '=', user.id))
      .execute();
    
    console.log('✅ Found events for analytics:', events.length);

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

// Create new event (organizers only)
eventRoutes.post('/', requireAuth, requireOrganizer, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    console.log('🔍 Creating event with data:', body);
    
    // Validation
    if (!body.name || !body.date || !body.venue) {
      return c.json({
        success: false,
        error: 'Name, date, and venue are required' 
      }, 400);
    }
    
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    
    // Create event in database
    const newEvent = await db
      .insertInto('events')
      .values({
        name: body.name,
        details: body.details || null,
        date: new Date(body.date),
        image_url: body.imageUrl || null,
        venue: body.venue,
        status: body.status || 'published',
        price: body.price || 0,
        capacity: body.capacity || null,
        registration_deadline: body.registrationDeadline ? new Date(body.registrationDeadline) : null,
        organizer: user.name || '',
        organizer_id: user.id,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returningAll()
      .executeTakeFirst();
    
    if (newEvent) {
      console.log('✅ Event created successfully:', newEvent.id);
      return c.json({
        success: true,
        message: 'Event created successfully',
        event: {
          id: newEvent.id,
          name: newEvent.name,
          status: newEvent.status
        }
      });
    } else {
      console.error('❌ Failed to create event in database');
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

// Update event (event owner only)
eventRoutes.put('/:id', requireAuth, requireOrganizer, async (c) => {
  try {
    const eventId = c.req.param('id');
    const user = c.get('user');
    console.log('🔍 Update event - User context:', { id: user.id, name: user.name, role: user.role });
    console.log('🔍 Update event - Event ID:', eventId);
    const body = await c.req.json();
    console.log('🔍 Update event - Request body:', body);
    
    // Check if user owns this event
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    
    const existingEvent = await db
      .selectFrom('events')
      .select(['organizer_id'])
      .where('id', '=', eventId)
      .executeTakeFirst();
    
    if (!existingEvent) {
      return c.json({ 
        success: false, 
        error: 'Event not found' 
      }, 404);
    }
    
    if (existingEvent.organizer_id !== user.id) {
      return c.json({ 
        success: false, 
        error: 'You can only edit your own events' 
      }, 403);
    }
    
    // Update event
    const updatedEvent = await db
      .updateTable('events')
      .set({
        name: body.name,
        details: body.details || null,
        date: new Date(body.date),
        image_url: body.imageUrl || null,
        venue: body.venue,
        status: body.status || 'published',
        price: body.price || 0,
        capacity: body.capacity || null,
        registration_deadline: body.registrationDeadline ? new Date(body.registrationDeadline) : null,
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
eventRoutes.delete('/:id', requireAuth, requireOrganizer, async (c) => {
  try {
    const eventId = c.req.param('id');
    const user = c.get('user');
    
    // Check if user owns this event
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    
    const existingEvent = await db
      .selectFrom('events')
      .select(['organizer_id'])
      .where('id', '=', eventId)
      .executeTakeFirst();
    
    if (!existingEvent) {
      return c.json({ 
        success: false, 
        error: 'Event not found' 
      }, 404);
    }
    
    if (existingEvent.organizer_id !== user.id) {
      return c.json({ 
        success: false, 
        error: 'You can only delete your own events' 
      }, 403);
    }
    
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
        error: 'Failed to delete event' 
      }, 500);
    }
  } catch (error) {
    console.error('Delete event error:', error);
    return c.json({
      success: false,
      error: 'Internal server error'
    }, 500);
  }
});

// Get single event by ID (public access - no authentication required)
// This must come AFTER all specific routes to avoid catching them
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
      },
      message: 'Event retrieved successfully'
    });
  } catch (error) {
    console.error('Get event error:', error);
    return c.json({ 
      success: false, 
      error: 'Internal server error' 
    }, 500);
  }
});

// Get event-specific analytics (organizers only)
// This must come AFTER the /:id route to avoid conflicts
eventRoutes.get('/:id/analytics', requireAuth, requireOrganizer, async (c) => {
  try {
    const eventId = c.req.param('id');
    const user = c.get('user');
    
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });

    // Check if user owns this event
    const event = await db
      .selectFrom('events')
      .select(['id', 'organizer_id', 'capacity'])
      .where('id', '=', eventId)
      .executeTakeFirst();

    if (!event) {
      return c.json({ 
        success: false, 
        error: 'Event not found' 
      }, 404);
    }

    if (event.organizer_id !== user.id) {
      return c.json({ 
        success: false, 
        error: 'You can only view analytics for your own events' 
      }, 403);
    }

    // Get registrations for this event
    console.log('🔍 Fetching registrations for event:', eventId);
    const registrations = await db
      .selectFrom('registrations')
      .selectAll()
      .where('event_id', '=', eventId)
      .orderBy('created_at', 'desc')
      .execute();
    
    console.log('✅ Found registrations:', registrations.length);

    // Get users who registered (for attendee names and emails)
    const userIds = registrations.map(r => r.user_id);
    console.log('🔍 User IDs from registrations:', userIds);
    let attendees: any[] = [];
    
    if (userIds.length > 0) {
      attendees = await db
        .selectFrom('users')
        .select(['id', 'name', 'email'])
        .where((eb) => eb('id', 'in', userIds))
        .execute();
      console.log('✅ Found attendees:', attendees.length);
    }

    // Calculate analytics
    const totalRegistrations = registrations.length;
    const capacityUtilization = event.capacity 
      ? Math.round((totalRegistrations / event.capacity) * 100) 
      : 0;

    // Group registrations by payment status
    const statusCounts = registrations.reduce((acc, reg) => {
      const status = reg.payment_status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Create recent registrations with attendee info
    const recentRegistrations = registrations.slice(0, 10).map(reg => {
      const attendee = attendees.find(a => a.id === reg.user_id);
      return {
        id: reg.id,
        attendee_name: attendee?.name || 'Unknown',
        email: attendee?.email || 'No email',
        status: reg.payment_status,
        registered_at: reg.created_at,
      };
    });

    return c.json({
      success: true,
      analytics: {
        totalRegistrations,
        capacityUtilization,
        registrationBreakdown: {
          confirmed: statusCounts.paid || 0,
          pending: statusCounts.pending || 0,
          cancelled: (statusCounts.failed || 0) + (statusCounts.refunded || 0),
        },
        recentRegistrations,
      }
    });
  } catch (error) {
    console.error('Get event analytics error:', error);
    return c.json({ 
      success: false, 
      error: 'Internal server error' 
    }, 500);
  }
});

export { eventRoutes };
