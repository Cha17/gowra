import { Hono } from 'hono';
import { authMiddleware, adminMiddleware } from '../lib/auth';
import { getDb, getSql } from '../db';
import { log } from '../lib/logger';

// Define the context type for Hono
interface RegistrationContext {
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

const registrationRoutes = new Hono<RegistrationContext>();

// ===== PHASE 3, STEP 3.4: REGISTRATIONS API ROUTES =====

// Get all registrations (admin only)
registrationRoutes.get('/', authMiddleware, adminMiddleware, async (c) => {
  try {
    const { 
      eventId, userId, status, paymentStatus, page = '1', limit = '10' 
    } = c.req.query();
    
    const db = await getDb();
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build dynamic query based on filters
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;
    
    if (eventId) {
      whereConditions.push(`r.event_id = $${paramIndex}`);
      queryParams.push(eventId);
      paramIndex++;
    }
    
    if (userId) {
      whereConditions.push(`r.user_id = $${paramIndex}`);
      queryParams.push(userId);
      paramIndex++;
    }
    
    if (status) {
      whereConditions.push(`r.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }
    
    if (paymentStatus) {
      whereConditions.push(`r.payment_status = $${paramIndex}`);
      queryParams.push(paymentStatus);
      paramIndex++;
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM registrations r
      ${whereClause}
    `;
    
    const countResult = await db.execute(countQuery, queryParams);
    const totalCount = parseInt(countResult.rows[0]?.total || '0');
    
    // Get registrations with user and event details
    const registrationsQuery = `
      SELECT 
        r.*,
        u.email as user_email,
        u.name as user_name,
        e.name as event_name,
        e.date as event_date,
        e.venue as event_venue,
        e.price as event_price,
        e.organizer as event_organizer
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      JOIN events e ON r.event_id = e.id
      ${whereClause}
      ORDER BY r.registration_date DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const registrationsResult = await db.execute(registrationsQuery, [...queryParams, parseInt(limit), offset]);
    const registrations = registrationsResult.rows || [];
    
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    
    return c.json({
      success: true,
      data: {
        registrations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          totalPages,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      },
      message: 'Registrations retrieved successfully'
    });
    
  } catch (error) {
    log.error('Get registrations error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      query: c.req.query()
    });
    
    return c.json({
      success: false,
      error: 'Failed to retrieve registrations',
      message: 'An error occurred while fetching registrations'
    }, 500);
  }
});

// Get registration by ID (admin or owner)
registrationRoutes.get('/:id', authMiddleware, async (c) => {
  try {
    const registrationId = c.req.param('id');
    const user = c.get('user');
    
    if (!registrationId) {
      return c.json({
        success: false,
        error: 'Registration ID is required',
        message: 'Please provide a valid registration ID'
      }, 400);
    }
    
    const db = await getDb();
    
    // Get registration details with user and event info
    const registrationQuery = `
      SELECT 
        r.*,
        u.email as user_email,
        u.name as user_name,
        e.name as event_name,
        e.description as event_description,
        e.date as event_date,
        e.venue as event_venue,
        e.price as event_price,
        e.organizer as event_organizer,
        e.capacity as event_capacity
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      JOIN events e ON r.event_id = e.id
      WHERE r.id = $1
    `;
    
    const registrationResult = await db.execute(registrationQuery, [registrationId]);
    
    if (!registrationResult.rows || registrationResult.rows.length === 0) {
      return c.json({
        success: false,
        error: 'Registration not found',
        message: 'The requested registration does not exist'
      }, 404);
    }
    
    const registration = registrationResult.rows[0];
    
    // Check if user can access this registration (admin or owner)
    if (!user.isAdmin && registration.user_id !== user.id) {
      return c.json({
        success: false,
        error: 'Access denied',
        message: 'You can only view your own registrations'
      }, 403);
    }
    
    return c.json({
      success: true,
      data: registration,
      message: 'Registration retrieved successfully'
    });
    
  } catch (error) {
    log.error('Get registration by ID error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      registrationId: c.req.param('id')
    });
    
    return c.json({
      success: false,
      error: 'Failed to retrieve registration',
      message: 'An error occurred while fetching the registration'
    }, 500);
  }
});

// Get user's registrations (authenticated user)
registrationRoutes.get('/user/me', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const { page = '1', limit = '10' } = c.req.query();
    
    const db = await getDb();
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM registrations r
      WHERE r.user_id = $1
    `;
    
    const countResult = await db.execute(countQuery, [user.id]);
    const totalCount = parseInt(countResult.rows[0]?.total || '0');
    
    // Get user's registrations with event details
    const registrationsQuery = `
      SELECT 
        r.*,
        e.name as event_name,
        e.description as event_description,
        e.date as event_date,
        e.venue as event_venue,
        e.price as event_price,
        e.organizer as event_organizer,
        e.status as event_status
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      WHERE r.user_id = $1
      ORDER BY r.registration_date DESC
      LIMIT $2 OFFSET $3
    `;
    
    const registrationsResult = await db.execute(registrationsQuery, [user.id, parseInt(limit), offset]);
    const registrations = registrationsResult.rows || [];
    
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    
    return c.json({
      success: true,
      data: {
        registrations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          totalPages,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      },
      message: 'Your registrations retrieved successfully'
    });
    
  } catch (error) {
    log.error('Get user registrations error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: c.get('user')?.id
    });
    
    return c.json({
      success: false,
      error: 'Failed to retrieve registrations',
      message: 'An error occurred while fetching your registrations'
    }, 500);
  }
});

// Register for an event (authenticated user)
registrationRoutes.post('/', authMiddleware, async (c) => {
  const user = c.get('user');
  let body: any;
  
  try {
    body = await c.req.json();
    const { eventId, additionalInfo } = body;
    
    if (!eventId) {
      return c.json({
        success: false,
        error: 'Event ID is required',
        message: 'Please provide a valid event ID'
      }, 400);
    }
    
    const db = await getDb();
    
    // Check if event exists and is active
    const eventQuery = `
      SELECT * FROM events 
      WHERE id = $1 AND status = 'active'
    `;
    
    const eventResult = await db.execute(eventQuery, [eventId]);
    
    if (!eventResult.rows || eventResult.rows.length === 0) {
      return c.json({
        success: false,
        error: 'Event not available',
        message: 'The event does not exist or is not available for registration'
      }, 404);
    }
    
    const event = eventResult.rows[0];
    
    // Check if event is full
    const registrationCountQuery = `
      SELECT COUNT(*) as count
      FROM registrations
      WHERE event_id = $1
    `;
    
    const registrationCountResult = await db.execute(registrationCountQuery, [eventId]);
    const currentRegistrations = parseInt(registrationCountResult.rows[0]?.count || '0');
    
    if (currentRegistrations >= event.capacity) {
      return c.json({
        success: false,
        error: 'Event is full',
        message: 'This event has reached its maximum capacity'
      }, 409);
    }
    
    // Check if user is already registered
    const existingRegistrationQuery = `
      SELECT id FROM registrations
      WHERE user_id = $1 AND event_id = $2
    `;
    
    const existingRegistrationResult = await db.execute(existingRegistrationQuery, [user.id, eventId]);
    
    if (existingRegistrationResult.rows && existingRegistrationResult.rows.length > 0) {
      return c.json({
        success: false,
        error: 'Already registered',
        message: 'You are already registered for this event'
      }, 409);
    }
    
    // Check if registration deadline has passed
    if (event.registration_deadline && new Date() > new Date(event.registration_deadline)) {
      return c.json({
        success: false,
        error: 'Registration closed',
        message: 'Registration for this event has closed'
      }, 409);
    }
    
    // Create registration
    const createRegistrationQuery = `
      INSERT INTO registrations (
        user_id, event_id, registration_date, status, 
        payment_status, additional_info, created_at, updated_at
      ) VALUES ($1, $2, NOW(), 'confirmed', 'pending', $3, NOW(), NOW())
      RETURNING *
    `;
    
    const result = await db.execute(createRegistrationQuery, [
      user.id, eventId, additionalInfo || null
    ]);
    
    if (!result.rows || result.rows.length === 0) {
      return c.json({
        success: false,
        error: 'Registration failed',
        message: 'Failed to create registration'
      }, 500);
    }
    
    const newRegistration = result.rows[0];
    
    log.info('Event registration created successfully', {
      registrationId: newRegistration.id,
      userId: user.id,
      eventId: eventId,
      eventName: event.name
    });
    
    return c.json({
      success: true,
      data: {
        registration: newRegistration,
        event: {
          name: event.name,
          date: event.date,
          venue: event.venue,
          price: event.price
        }
      },
      message: 'Successfully registered for the event'
    }, 201);
    
  } catch (error) {
    log.error('Create registration error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: c.get('user')?.id,
      eventId: body?.eventId
    });
    
    return c.json({
      success: false,
      error: 'Registration failed',
      message: 'An error occurred while creating the registration'
    }, 500);
  }
});

// Update registration (admin or owner)
registrationRoutes.put('/:id', authMiddleware, async (c) => {
  try {
    const registrationId = c.req.param('id');
    const user = c.get('user');
    const body = await c.req.json();
    
    if (!registrationId) {
      return c.json({
        success: false,
        error: 'Registration ID is required',
        message: 'Please provide a valid registration ID'
      }, 400);
    }
    
    const db = await getDb();
    
    // Check if registration exists
    const existingRegistrationQuery = `
      SELECT * FROM registrations WHERE id = $1
    `;
    
    const existingRegistrationResult = await db.execute(existingRegistrationQuery, [registrationId]);
    
    if (!existingRegistrationResult.rows || existingRegistrationResult.rows.length === 0) {
      return c.json({
        success: false,
        error: 'Registration not found',
        message: 'The registration to update does not exist'
      }, 404);
    }
    
    const existingRegistration = existingRegistrationResult.rows[0];
    
    // Check if user can update this registration (admin or owner)
    if (!user.isAdmin && existingRegistration.user_id !== user.id) {
      return c.json({
        success: false,
        error: 'Access denied',
        message: 'You can only update your own registrations'
      }, 403);
    }
    
    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;
    
    const allowedFields = ['status', 'payment_status', 'additional_info'];
    
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
    updateValues.push(registrationId); // For WHERE clause
    
    const updateQuery = `
      UPDATE registrations 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await db.execute(updateQuery, updateValues);
    
    if (!result.rows || result.rows.length === 0) {
      return c.json({
        success: false,
        error: 'Failed to update registration',
        message: 'Registration update failed'
      }, 500);
    }
    
    const updatedRegistration = result.rows[0];
    
    log.info('Registration updated successfully', {
      registrationId: updatedRegistration.id,
      userId: user.id,
      updates: body
    });
    
    return c.json({
      success: true,
      data: updatedRegistration,
      message: 'Registration updated successfully'
    });
    
  } catch (error) {
    log.error('Update registration error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      registrationId: c.req.param('id'),
      userId: c.get('user')?.id
    });
    
    return c.json({
      success: false,
      error: 'Failed to update registration',
      message: 'An error occurred while updating the registration'
    }, 500);
  }
});

// Cancel registration (admin or owner)
registrationRoutes.delete('/:id', authMiddleware, async (c) => {
  try {
    const registrationId = c.req.param('id');
    const user = c.get('user');
    
    if (!registrationId) {
      return c.json({
        success: false,
        error: 'Registration ID is required',
        message: 'Please provide a valid registration ID'
      }, 400);
    }
    
    const db = await getDb();
    
    // Check if registration exists
    const existingRegistrationQuery = `
      SELECT r.*, e.name as event_name, e.date as event_date
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      WHERE r.id = $1
    `;
    
    const existingRegistrationResult = await db.execute(existingRegistrationQuery, [registrationId]);
    
    if (!existingRegistrationResult.rows || existingRegistrationResult.rows.length === 0) {
      return c.json({
        success: false,
        error: 'Registration not found',
        message: 'The registration to cancel does not exist'
      }, 404);
    }
    
    const existingRegistration = existingRegistrationResult.rows[0];
    
    // Check if user can cancel this registration (admin or owner)
    if (!user.isAdmin && existingRegistration.user_id !== user.id) {
      return c.json({
        success: false,
        error: 'Access denied',
        message: 'You can only cancel your own registrations'
      }, 403);
    }
    
    // Check if event has already started
    if (new Date(existingRegistration.event_date) <= new Date()) {
      return c.json({
        success: false,
        error: 'Cannot cancel registration',
        message: 'Cannot cancel registration for an event that has already started'
      }, 409);
    }
    
    // Delete the registration
    await db.execute('DELETE FROM registrations WHERE id = $1', [registrationId]);
    
    log.info('Registration cancelled successfully', {
      registrationId,
      userId: user.id,
      eventName: existingRegistration.event_name
    });
    
    return c.json({
      success: true,
      message: 'Registration cancelled successfully'
    });
    
  } catch (error) {
    log.error('Cancel registration error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      registrationId: c.req.param('id'),
      userId: c.get('user')?.id
    });
    
    return c.json({
      success: false,
      error: 'Failed to cancel registration',
      message: 'An error occurred while cancelling the registration'
    }, 500);
  }
});

// Get registration statistics (admin only)
registrationRoutes.get('/stats/overview', authMiddleware, adminMiddleware, async (c) => {
  try {
    const db = await getDb();
    
    // Get various registration statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_registrations,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_registrations,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_registrations,
        COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_registrations,
        COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_registrations,
        COUNT(CASE WHEN payment_status = 'failed' THEN 1 END) as failed_registrations,
        AVG(CASE WHEN payment_status = 'paid' THEN event_price END) as average_paid_amount
      FROM registrations r
      JOIN events e ON r.event_id = e.id
    `;
    
    const statsResult = await db.execute(statsQuery);
    const stats = statsResult.rows[0] || {};
    
    // Get registrations by month
    const monthlyStatsQuery = `
      SELECT 
        DATE_TRUNC('month', registration_date) as month,
        COUNT(*) as registration_count,
        COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_count
      FROM registrations
      WHERE registration_date >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', registration_date)
      ORDER BY month DESC
    `;
    
    const monthlyStatsResult = await db.execute(monthlyStatsQuery);
    const monthlyStats = monthlyStatsResult.rows || [];
    
    // Get top events by registration count
    const topEventsQuery = `
      SELECT 
        e.name as event_name,
        e.id as event_id,
        COUNT(r.id) as registration_count,
        e.capacity,
        ROUND((COUNT(r.id)::float / e.capacity * 100), 2) as occupancy_rate
      FROM events e
      LEFT JOIN registrations r ON e.id = r.event_id
      GROUP BY e.id, e.name, e.capacity
      ORDER BY registration_count DESC
      LIMIT 10
    `;
    
    const topEventsResult = await db.execute(topEventsQuery);
    const topEvents = topEventsResult.rows || [];
    
    return c.json({
      success: true,
      data: {
        overview: stats,
        monthlyStats,
        topEvents
      },
      message: 'Registration statistics retrieved successfully'
    });
    
  } catch (error) {
    log.error('Get registration stats error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminUser: c.get('user')?.email
    });
    
    return c.json({
      success: false,
      error: 'Failed to retrieve registration statistics',
      message: 'An error occurred while fetching registration statistics'
    }, 500);
  }
});

export { registrationRoutes };
