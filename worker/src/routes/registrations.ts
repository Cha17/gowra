import { Hono } from 'hono';
import { authMiddleware, adminMiddleware } from '../lib/auth';
import { createDbClient } from '../db/types';
import type { EnvBinding } from '../schema/env';
import { PaymentStatus } from '../db/types';

// Define the context type for Hono
interface RegistrationContext {
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

const registrationRoutes = new Hono<RegistrationContext>();

// Get all registrations (admin only)
registrationRoutes.get('/', authMiddleware, adminMiddleware, async (c) => {
  try {
    const { 
      eventId, userId, status, paymentStatus, page = '1', limit = '10' 
    } = c.req.query();
    
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query with filters
    let query = db
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
        'events.date as event_date',
        'events.venue as event_venue',
        'events.price as event_price',
        'events.organizer as event_organizer',
        db.fn.countAll().over().as('total_count')
      ]);
    
    // Apply filters
    if (eventId) {
      query = query.where('registrations.event_id', '=', eventId);
    }
    
    if (userId) {
      query = query.where('registrations.user_id', '=', userId);
    }
    
    if (paymentStatus) {
      query = query.where('registrations.payment_status', '=', paymentStatus as PaymentStatus);
    }
    
    const results = await query
      .orderBy('registrations.registration_date', 'desc')
      .limit(parseInt(limit))
      .offset(offset)
      .execute();
    
    const totalCount = results.length > 0 ? Number(results[0].total_count) : 0;
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    
    return c.json({
      success: true,
      data: {
        registrations: results.map(({ total_count, ...registration }) => registration),
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
    console.error('Get registrations error:', error);
    
    return c.json({
      success: false,
      error: 'Failed to retrieve registrations',
      message: 'An error occurred while fetching registrations'
    }, 500);
  }
});

// Get user's registrations (protected)
registrationRoutes.get('/my-registrations', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const { page = '1', limit = '10' } = c.req.query();
    
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const results = await db
      .selectFrom('registrations')
      .innerJoin('events', 'registrations.event_id', 'events.id')
      .select([
        'registrations.id',
        'registrations.event_id',
        'registrations.payment_status',
        'registrations.payment_reference',
        'registrations.payment_amount',
        'registrations.registration_date',
        'registrations.created_at',
        'events.name as event_name',
        'events.date as event_date',
        'events.venue as event_venue',
        'events.organizer as event_organizer',
        'events.image_url as event_image',
        db.fn.countAll().over().as('total_count')
      ])
      .where('registrations.user_id', '=', user.id)
      .orderBy('registrations.registration_date', 'desc')
      .limit(parseInt(limit))
      .offset(offset)
      .execute();
    
    const totalCount = results.length > 0 ? Number(results[0].total_count) : 0;
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    
    return c.json({
      success: true,
      data: {
        registrations: results.map(({ total_count, ...registration }) => registration),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          totalPages,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      },
      message: 'User registrations retrieved successfully'
    });
    
  } catch (error) {
    console.error('Get user registrations error:', error);
    
    return c.json({
      success: false,
      error: 'Failed to retrieve user registrations',
      message: 'An error occurred while fetching your registrations'
    }, 500);
  }
});

// Get registration by ID (protected)
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
    
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    
    let query = db
      .selectFrom('registrations')
      .innerJoin('events', 'registrations.event_id', 'events.id')
      .innerJoin('users', 'registrations.user_id', 'users.id')
      .select([
        'registrations.id',
        'registrations.user_id',
        'registrations.event_id',
        'registrations.payment_status',
        'registrations.payment_reference',
        'registrations.payment_amount',
        'registrations.registration_date',
        'registrations.created_at',
        'events.name as event_name',
        'events.date as event_date',
        'events.venue as event_venue',
        'events.organizer as event_organizer',
        'events.image_url as event_image',
        'users.email as user_email',
        'users.name as user_name'
      ])
      .where('registrations.id', '=', registrationId);
    
    // Non-admin users can only see their own registrations
    if (!user.isAdmin) {
      query = query.where('registrations.user_id', '=', user.id);
    }
    
    const registration = await query.executeTakeFirst();
    
    if (!registration) {
      return c.json({
        success: false,
        error: 'Registration not found',
        message: 'The requested registration does not exist or you do not have permission to view it'
      }, 404);
    }
    
    return c.json({
      success: true,
      data: registration,
      message: 'Registration retrieved successfully'
    });
    
  } catch (error) {
    console.error('Get registration by ID error:', error);
    
    return c.json({
      success: false,
      error: 'Failed to retrieve registration',
      message: 'An error occurred while fetching the registration'
    }, 500);
  }
});

// Create new registration (protected)
registrationRoutes.post('/', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { eventId } = body;
    
    // Validation
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
    
    // Check if event exists and get details
    const event = await db
      .selectFrom('events')
      .selectAll()
      .where('id', '=', eventId)
      .executeTakeFirst();
    
    if (!event) {
      return c.json({
        success: false,
        error: 'Event not found',
        message: 'The specified event does not exist'
      }, 404);
    }
    
    // Check if event is active and not past
    if (event.status !== 'published') {
      return c.json({
        success: false,
        error: 'Event not available',
        message: 'This event is not currently available for registration'
      }, 400);
    }
    
    if (new Date(event.date) <= new Date()) {
      return c.json({
        success: false,
        error: 'Event has passed',
        message: 'Cannot register for past events'
      }, 400);
    }
    
    // Check registration deadline
    if (event.registration_deadline && new Date(event.registration_deadline) <= new Date()) {
      return c.json({
        success: false,
        error: 'Registration deadline passed',
        message: 'The registration deadline for this event has passed'
      }, 400);
    }
    
    // Check if user is already registered
    const existingRegistration = await db
      .selectFrom('registrations')
      .select('id')
      .where('user_id', '=', user.id)
      .where('event_id', '=', eventId)
      .executeTakeFirst();
    
    if (existingRegistration) {
      return c.json({
        success: false,
        error: 'Already registered',
        message: 'You are already registered for this event'
      }, 409);
    }
    
    // Check event capacity
    const registrationCount = await db
      .selectFrom('registrations')
      .select(db.fn.count('id').as('count'))
      .where('event_id', '=', eventId)
      .executeTakeFirst();
    
    const currentRegistrations = Number(registrationCount?.count || 0);
    
    if (event.capacity && currentRegistrations >= event.capacity) {
      return c.json({
        success: false,
        error: 'Event full',
        message: 'This event has reached its maximum capacity'
      }, 409);
    }
    
    // Create registration
    const paymentReference = `REG_${Date.now()}_${user.id.slice(-6)}`;
    
    const result = await db
      .insertInto('registrations')
      .values({
        user_id: user.id,
        event_id: eventId,
        payment_status: 'pending',
        payment_reference: paymentReference,
        payment_amount: event.price,
        registration_date: new Date()
      })
      .returningAll()
      .executeTakeFirst();
    
    if (!result) {
      return c.json({
        success: false,
        error: 'Registration failed',
        message: 'Failed to create registration'
      }, 500);
    }
    
    console.log('Registration created successfully:', {
      registrationId: result.id,
      userId: user.id,
      eventId,
      eventName: event.name
    });
    
    return c.json({
      success: true,
      data: {
        registration: result,
        event: {
          id: event.id,
          name: event.name,
          date: event.date,
          venue: event.venue,
          price: event.price
        }
      },
      message: 'Registration created successfully'
    }, 201);
    
  } catch (error) {
    console.error('Create registration error:', error);
    
    return c.json({
      success: false,
      error: 'Registration failed',
      message: 'An error occurred while creating the registration'
    }, 500);
  }
});

// Update registration status (admin only)
registrationRoutes.put('/:id/status', authMiddleware, adminMiddleware, async (c) => {
  try {
    const registrationId = c.req.param('id');
    const body = await c.req.json();
    const { paymentStatus } = body;
    
    if (!registrationId) {
      return c.json({
        success: false,
        error: 'Registration ID is required',
        message: 'Please provide a valid registration ID'
      }, 400);
    }
    
    if (!paymentStatus || !['pending', 'paid', 'failed', 'refunded'].includes(paymentStatus)) {
      return c.json({
        success: false,
        error: 'Invalid payment status',
        message: 'Payment status must be one of: pending, paid, failed, refunded'
      }, 400);
    }
    
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    
    const result = await db
      .updateTable('registrations')
      .set({ payment_status: paymentStatus })
      .where('id', '=', registrationId)
      .returningAll()
      .executeTakeFirst();
    
    if (!result) {
      return c.json({
        success: false,
        error: 'Registration not found',
        message: 'The specified registration does not exist'
      }, 404);
    }
    
    console.log('Registration status updated:', {
      registrationId: result.id,
      newStatus: paymentStatus,
      adminUser: c.get('user').email
    });
    
    return c.json({
      success: true,
      data: result,
      message: 'Registration status updated successfully'
    });
    
  } catch (error) {
    console.error('Update registration status error:', error);
    
    return c.json({
      success: false,
      error: 'Failed to update registration status',
      message: 'An error occurred while updating the registration status'
    }, 500);
  }
});

// Cancel registration (protected)
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
    
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    
    // Check if registration exists and user has permission
    let query = db
      .selectFrom('registrations')
      .innerJoin('events', 'registrations.event_id', 'events.id')
      .select([
        'registrations.id',
        'registrations.user_id',
        'registrations.payment_status',
        'events.date as event_date',
        'events.name as event_name'
      ])
      .where('registrations.id', '=', registrationId);
    
    // Non-admin users can only cancel their own registrations
    if (!user.isAdmin) {
      query = query.where('registrations.user_id', '=', user.id);
    }
    
    const registration = await query.executeTakeFirst();
    
    if (!registration) {
      return c.json({
        success: false,
        error: 'Registration not found',
        message: 'The specified registration does not exist or you do not have permission to cancel it'
      }, 404);
    }
    
    // Check if event has already passed
    if (new Date(registration.event_date) <= new Date()) {
      return c.json({
        success: false,
        error: 'Cannot cancel',
        message: 'Cannot cancel registration for past events'
      }, 400);
    }
    
    // Check if payment has been made (admin can still cancel)
    if (registration.payment_status === 'paid' && !user.isAdmin) {
      return c.json({
        success: false,
        error: 'Cannot cancel paid registration',
        message: 'Please contact admin to cancel paid registrations'
      }, 400);
    }
    
    // Delete the registration
    await db
      .deleteFrom('registrations')
      .where('id', '=', registrationId)
      .execute();
    
    console.log('Registration cancelled:', {
      registrationId,
      eventName: registration.event_name,
      userId: user.id,
      cancelledBy: user.isAdmin ? 'admin' : 'user'
    });
    
    return c.json({
      success: true,
      message: 'Registration cancelled successfully'
    });
    
  } catch (error) {
    console.error('Cancel registration error:', error);
    
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
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    
    // Get registration statistics
    const stats = await db
      .selectFrom('registrations')
      .select([
        db.fn.count('id').as('total_registrations'),
        db.fn.count(db.case().when('payment_status', '=', 'paid').then(1).end()).as('paid_registrations'),
        db.fn.count(db.case().when('payment_status', '=', 'pending').then(1).end()).as('pending_registrations'),
        db.fn.count(db.case().when('payment_status', '=', 'failed').then(1).end()).as('failed_registrations'),
        db.fn.sum(db.case().when('payment_status', '=', 'paid').then('payment_amount').end()).as('total_revenue')
      ])
      .executeTakeFirst();
    
    // Get registrations by event
    const eventStats = await db
      .selectFrom('registrations')
      .innerJoin('events', 'registrations.event_id', 'events.id')
      .select([
        'events.name as event_name',
        'events.id as event_id',
        db.fn.count('registrations.id').as('registration_count'),
        db.fn.sum(db.case().when('registrations.payment_status', '=', 'paid').then('registrations.payment_amount').end()).as('event_revenue')
      ])
      .groupBy(['events.id', 'events.name'])
      .orderBy('registration_count', 'desc')
      .limit(10)
      .execute();
    
    return c.json({
      success: true,
      data: {
        overview: stats,
        topEvents: eventStats
      },
      message: 'Registration statistics retrieved successfully'
    });
    
  } catch (error) {
    console.error('Get registration stats error:', error);
    
    return c.json({
      success: false,
      error: 'Failed to retrieve registration statistics',
      message: 'An error occurred while fetching registration statistics'
    }, 500);
  }
});

export { registrationRoutes };
