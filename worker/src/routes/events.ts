import { Hono } from 'hono';
import { createDbClient } from '../db/types';
import { requireOrganizer, requireEventOwnership } from '../middlewares/auth';
import type { EnvBinding } from '../schema/env';

const eventRoutes = new Hono<{ Bindings: EnvBinding }>();

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
