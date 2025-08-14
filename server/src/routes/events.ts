import { Hono } from 'hono';
import { authMiddleware, adminMiddleware } from '../lib/auth';
import { getDb, getSql } from '../db';
import { log } from '../lib/logger';

// Define the context type for Hono
interface EventContext {
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

// ===== PHASE 3, STEP 3.4: EVENTS API ROUTES =====

// Get all events (public)
eventRoutes.get('/', async (c) => {
  try {
    const { search, category, status, date, organizer, page = '1', limit = '10' } = c.req.query();
    
    const db = await getDb();
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build dynamic query based on filters
    let whereConditions = [];
    let queryParams = [];
    
    if (search) {
      whereConditions.push(`(e.name ILIKE $1 OR e.description ILIKE $1 OR e.venue ILIKE $1)`);
      queryParams.push(`%${search}%`);
    }
    
    if (category) {
      whereConditions.push(`e.category = $${queryParams.length + 1}`);
      queryParams.push(category);
    }
    
    if (status) {
      whereConditions.push(`e.status = $${queryParams.length + 1}`);
      queryParams.push(status);
    }
    
    if (date) {
      whereConditions.push(`e.date >= $${queryParams.length + 1}`);
      queryParams.push(date);
    }
    
    if (organizer) {
      whereConditions.push(`e.organizer ILIKE $${queryParams.length + 1}`);
      queryParams.push(`%${organizer}%`);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM events e
      ${whereClause}
    `;
    
    const countResult = await db.execute(countQuery, queryParams);
    const totalCount = parseInt(countResult.rows[0]?.total || '0');
    
    // Get events with pagination
    const eventsQuery = `
      SELECT 
        e.*,
        COUNT(r.id) as registration_count,
        COALESCE(SUM(CASE WHEN r.payment_status = 'paid' THEN 1 ELSE 0 END), 0) as paid_registrations
      FROM events e
      LEFT JOIN registrations r ON e.id = r.event_id
      ${whereClause}
      GROUP BY e.id
      ORDER BY e.date ASC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
    
    const eventsResult = await db.execute(eventsQuery, [...queryParams, parseInt(limit), offset]);
    const events = eventsResult.rows || [];
    
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    
    return c.json({
      success: true,
      data: {
        events,
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
    log.error('Get events error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      query: c.req.query()
    });
    
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
    
    const db = await getDb();
    
    // Get event details with registration count
    const eventQuery = `
      SELECT 
        e.*,
        COUNT(r.id) as registration_count,
        COALESCE(SUM(CASE WHEN r.payment_status = 'paid' THEN 1 ELSE 0 END), 0) as paid_registrations,
        COALESCE(SUM(CASE WHEN r.payment_status = 'pending' THEN 1 ELSE 0 END), 0) as pending_registrations
      FROM events e
      LEFT JOIN registrations r ON e.id = r.event_id
      WHERE e.id = $1
      GROUP BY e.id
    `;
    
    const eventResult = await db.execute(eventQuery, [eventId]);
    
    if (!eventResult.rows || eventResult.rows.length === 0) {
      return c.json({
        success: false,
        error: 'Event not found',
        message: 'The requested event does not exist'
      }, 404);
    }
    
    const event = eventResult.rows[0];
    
    // Get event categories if they exist
    const categoriesQuery = `
      SELECT DISTINCT category 
      FROM events 
      WHERE category IS NOT NULL 
      ORDER BY category
    `;
    
    const categoriesResult = await db.execute(categoriesQuery);
    const categories = categoriesResult.rows?.map((row: any) => row.category) || [];
    
    return c.json({
      success: true,
      data: {
        event,
        categories
      },
      message: 'Event retrieved successfully'
    });
    
  } catch (error) {
    log.error('Get event by ID error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      eventId: c.req.param('id')
    });
    
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
      description, 
      date, 
      venue, 
      price, 
      capacity, 
      category, 
      status = 'active',
      registration_deadline,
      organizer
    } = body;
    
    // Validation
    if (!name || !description || !date || !venue || !price || !capacity) {
      return c.json({
        success: false,
        error: 'Missing required fields',
        message: 'Name, description, date, venue, price, and capacity are required'
      }, 400);
    }
    
    if (new Date(date) <= new Date()) {
      return c.json({
        success: false,
        error: 'Invalid date',
        message: 'Event date must be in the future'
      }, 400);
    }
    
    if (price < 0) {
      return c.json({
        success: false,
        error: 'Invalid price',
        message: 'Price cannot be negative'
      }, 400);
    }
    
    if (capacity <= 0) {
      return c.json({
        success: false,
        error: 'Invalid capacity',
        message: 'Capacity must be greater than 0'
      }, 400);
    }
    
    const db = await getDb();
    
    const createQuery = `
      INSERT INTO events (
        name, description, date, venue, price, capacity, 
        category, status, registration_deadline, organizer, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *
    `;
    
    const result = await db.execute(createQuery, [
      name, description, date, venue, price, capacity, 
      category, status, registration_deadline || date, organizer
    ]);
    
    if (!result.rows || result.rows.length === 0) {
      return c.json({
        success: false,
        error: 'Failed to create event',
        message: 'Event creation failed'
      }, 500);
    }
    
    const newEvent = result.rows[0];
    
    log.info('Event created successfully', {
      eventId: newEvent.id,
      eventName: newEvent.name,
      organizer: newEvent.organizer,
      adminUser: c.get('user').email
    });
    
    return c.json({
      success: true,
      data: newEvent,
      message: 'Event created successfully'
    }, 201);
    
  } catch (error) {
    log.error('Create event error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminUser: c.get('user')?.email
    });
    
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
    
    const db = await getDb();
    
    // Check if event exists
    const existingEvent = await db.execute(
      'SELECT * FROM events WHERE id = $1',
      [eventId]
    );
    
    if (!existingEvent.rows || existingEvent.rows.length === 0) {
      return c.json({
        success: false,
        error: 'Event not found',
        message: 'The event to update does not exist'
      }, 404);
    }
    
    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;
    
    const allowedFields = [
      'name', 'description', 'date', 'venue', 'price', 
      'capacity', 'category', 'status', 'registration_deadline', 'organizer'
    ];
    
    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        updateValues.push(value);
        paramIndex++;
      }
    }
    
    if (updateFields.length === 0) {
      return c.json({
        success: false,
        error: 'No valid fields to update',
        message: 'Please provide at least one field to update'
      }, 400);
    }
    
    updateFields.push('updated_at = NOW()');
    updateValues.push(eventId); // For WHERE clause
    
    const updateQuery = `
      UPDATE events 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await db.execute(updateQuery, updateValues);
    
    if (!result.rows || result.rows.length === 0) {
      return c.json({
        success: false,
        error: 'Failed to update event',
        message: 'Event update failed'
      }, 500);
    }
    
    const updatedEvent = result.rows[0];
    
    log.info('Event updated successfully', {
      eventId: updatedEvent.id,
      eventName: updatedEvent.name,
      adminUser: c.get('user').email
    });
    
    return c.json({
      success: true,
      data: updatedEvent,
      message: 'Event updated successfully'
    });
    
  } catch (error) {
    log.error('Update event error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      eventId: c.req.param('id'),
      adminUser: c.get('user')?.email
    });
    
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
    
    const db = await getDb();
    
    // Check if event exists
    const existingEvent = await db.execute(
      'SELECT * FROM events WHERE id = $1',
      [eventId]
    );
    
    if (!existingEvent.rows || existingEvent.rows.length === 0) {
      return c.json({
        success: false,
        error: 'Event not found',
        message: 'The event to delete does not exist'
      }, 404);
    }
    
    // Check if there are active registrations
    const registrations = await db.execute(
      'SELECT COUNT(*) as count FROM registrations WHERE event_id = $1',
      [eventId]
    );
    
    const registrationCount = parseInt(registrations.rows[0]?.count || '0');
    
    if (registrationCount > 0) {
      return c.json({
        success: false,
        error: 'Cannot delete event',
        message: `Cannot delete event with ${registrationCount} active registrations`
      }, 409);
    }
    
    // Delete the event
    await db.execute('DELETE FROM events WHERE id = $1', [eventId]);
    
    log.info('Event deleted successfully', {
      eventId,
      eventName: existingEvent.rows[0].name,
      adminUser: c.get('user').email
    });
    
    return c.json({
      success: true,
      message: 'Event deleted successfully'
    });
    
  } catch (error) {
    log.error('Delete event error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      eventId: c.req.param('id'),
      adminUser: c.get('user')?.email
    });
    
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
    const db = await getDb();
    
    // Get various event statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_events,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_events,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_events,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_events,
        COUNT(CASE WHEN date > NOW() THEN 1 END) as upcoming_events,
        COUNT(CASE WHEN date <= NOW() THEN 1 END) as past_events,
        AVG(price) as average_price,
        SUM(capacity) as total_capacity
      FROM events
    `;
    
    const statsResult = await db.execute(statsQuery);
    const stats = statsResult.rows[0] || {};
    
    // Get top events by registration count
    const topEventsQuery = `
      SELECT 
        e.name,
        e.id,
        COUNT(r.id) as registration_count,
        e.capacity,
        ROUND((COUNT(r.id)::float / e.capacity * 100), 2) as occupancy_rate
      FROM events e
      LEFT JOIN registrations r ON e.id = r.event_id
      GROUP BY e.id, e.name, e.capacity
      ORDER BY registration_count DESC
      LIMIT 5
    `;
    
    const topEventsResult = await db.execute(topEventsQuery);
    const topEvents = topEventsResult.rows || [];
    
    // Get events by category
    const categoryStatsQuery = `
      SELECT 
        category,
        COUNT(*) as event_count,
        AVG(price) as average_price
      FROM events
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY event_count DESC
    `;
    
    const categoryStatsResult = await db.execute(categoryStatsQuery);
    const categoryStats = categoryStatsResult.rows || [];
    
    return c.json({
      success: true,
      data: {
        overview: stats,
        topEvents,
        categoryStats
      },
      message: 'Event statistics retrieved successfully'
    });
    
  } catch (error) {
    log.error('Get event stats error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminUser: c.get('user')?.email
    });
    
    return c.json({
      success: false,
      error: 'Failed to retrieve event statistics',
      message: 'An error occurred while fetching event statistics'
    }, 500);
  }
});

// Search events (public)
eventRoutes.get('/search/advanced', async (c) => {
  try {
    const { 
      q, category, minPrice, maxPrice, startDate, endDate, 
      status, organizer, hasCapacity, page = '1', limit = '10' 
    } = c.req.query();
    
    const db = await getDb();
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build advanced search query
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;
    
    if (q) {
      whereConditions.push(`(
        e.name ILIKE $${paramIndex} OR 
        e.description ILIKE $${paramIndex} OR 
        e.venue ILIKE $${paramIndex} OR 
        e.organizer ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${q}%`);
      paramIndex++;
    }
    
    if (category) {
      whereConditions.push(`e.category = $${paramIndex}`);
      queryParams.push(category);
      paramIndex++;
    }
    
    if (minPrice !== undefined) {
      whereConditions.push(`e.price >= $${paramIndex}`);
      queryParams.push(parseFloat(minPrice));
      paramIndex++;
    }
    
    if (maxPrice !== undefined) {
      whereConditions.push(`e.price <= $${paramIndex}`);
      queryParams.push(parseFloat(maxPrice));
      paramIndex++;
    }
    
    if (startDate) {
      whereConditions.push(`e.date >= $${paramIndex}`);
      queryParams.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      whereConditions.push(`e.date <= $${paramIndex}`);
      queryParams.push(endDate);
      paramIndex++;
    }
    
    if (status) {
      whereConditions.push(`e.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }
    
    if (organizer) {
      whereConditions.push(`e.organizer ILIKE $${paramIndex}`);
      queryParams.push(`%${organizer}%`);
      paramIndex++;
    }
    
    if (hasCapacity === 'true') {
      whereConditions.push(`(e.capacity - COALESCE(COUNT(r.id), 0)) > 0`);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT e.id) as total
      FROM events e
      LEFT JOIN registrations r ON e.id = r.event_id
      ${whereClause}
    `;
    
    const countResult = await db.execute(countQuery, queryParams);
    const totalCount = parseInt(countResult.rows[0]?.total || '0');
    
    // Get search results
    const searchQuery = `
      SELECT 
        e.*,
        COUNT(r.id) as registration_count,
        (e.capacity - COUNT(r.id)) as available_capacity,
        ROUND((COUNT(r.id)::float / e.capacity * 100), 2) as occupancy_rate
      FROM events e
      LEFT JOIN registrations r ON e.id = r.event_id
      ${whereClause}
      GROUP BY e.id, e.capacity
      ORDER BY e.date ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const searchResult = await db.execute(searchQuery, [...queryParams, parseInt(limit), offset]);
    const events = searchResult.rows || [];
    
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    
    return c.json({
      success: true,
      data: {
        events,
        search: {
          query: q,
          filters: { category, minPrice, maxPrice, startDate, endDate, status, organizer, hasCapacity },
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCount,
            totalPages,
            hasNext: parseInt(page) < totalPages,
            hasPrev: parseInt(page) > 1
          }
        }
      },
      message: 'Event search completed successfully'
    });
    
  } catch (error) {
    log.error('Advanced event search error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      query: c.req.query()
    });
    
    return c.json({
      success: false,
      error: 'Search failed',
      message: 'An error occurred while searching events'
    }, 500);
  }
});

export { eventRoutes };
