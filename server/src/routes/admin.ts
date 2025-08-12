import { Hono } from 'hono';
import { authMiddleware, adminMiddleware } from '../lib/auth';
import { neon } from '@neondatabase/serverless';

const adminRoutes = new Hono();

// Apply auth and admin middleware to all admin routes
adminRoutes.use('*', authMiddleware);
adminRoutes.use('*', adminMiddleware);

// Get admin dashboard stats
adminRoutes.get('/stats', async (c) => {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    
    // Get user count
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    
    // Get event count
    const eventCount = await sql`SELECT COUNT(*) as count FROM events`;
    
    // Get registration count
    const registrationCount = await sql`SELECT COUNT(*) as count FROM registrations`;
    
    // Get total revenue
    const revenueResult = await sql`
      SELECT COALESCE(SUM(payment_amount), 0) as total_revenue 
      FROM registrations 
      WHERE payment_status = 'paid'
    `;
    
    return c.json({
      success: true,
      stats: {
        totalUsers: userCount[0]?.count || 0,
        totalEvents: eventCount[0]?.count || 0,
        totalRegistrations: registrationCount[0]?.count || 0,
        totalRevenue: parseFloat(revenueResult[0]?.total_revenue || '0'),
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
    const sql = neon(process.env.DATABASE_URL!);
    
    const users = await sql`
      SELECT id, email, name, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `;
    
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
    const sql = neon(process.env.DATABASE_URL!);
    
    const events = await sql`
      SELECT e.*, 
             COUNT(r.id) as registration_count
      FROM events e
      LEFT JOIN registrations r ON e.id = r.event_id
      GROUP BY e.id
      ORDER BY e.created_at DESC
    `;
    
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
    const sql = neon(process.env.DATABASE_URL!);
    
    const registrations = await sql`
      SELECT r.*, 
             u.email as user_email,
             u.name as user_name,
             e.name as event_name,
             e.date as event_date
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      JOIN events e ON r.event_id = e.id
      ORDER BY r.registration_date DESC
    `;
    
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
    
    const sql = neon(process.env.DATABASE_URL!);
    
    const result = await sql`
      INSERT INTO events (name, organizer, details, date, image_url, venue, price, capacity, registration_deadline)
      VALUES (${name}, ${organizer}, ${details}, ${date}, ${imageUrl}, ${venue}, ${price}, ${capacity}, ${registrationDeadline})
      RETURNING *
    `;
    
    if (result && result.length > 0) {
      return c.json({
        success: true,
        message: 'Event created successfully',
        event: result[0]
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
    
    const sql = neon(process.env.DATABASE_URL!);
    
    const result = await sql`
      UPDATE events 
      SET name = COALESCE(${body.name}, name),
          organizer = COALESCE(${body.organizer}, organizer),
          details = COALESCE(${body.details}, details),
          date = COALESCE(${body.date}, date),
          image_url = COALESCE(${body.imageUrl}, image_url),
          venue = COALESCE(${body.venue}, venue),
          price = COALESCE(${body.price}, price),
          capacity = COALESCE(${body.capacity}, capacity),
          registration_deadline = COALESCE(${body.registrationDeadline}, registration_deadline),
          updated_at = NOW()
      WHERE id = ${eventId}
      RETURNING *
    `;
    
    if (result && result.length > 0) {
      return c.json({
        success: true,
        message: 'Event updated successfully',
        event: result[0]
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
    
    const sql = neon(process.env.DATABASE_URL!);
    
    // Check if event has registrations
    const registrations = await sql`
      SELECT COUNT(*) as count FROM registrations WHERE event_id = ${eventId}
    `;
    
    if (registrations[0]?.count > 0) {
      return c.json({ error: 'Cannot delete event with existing registrations' }, 400);
    }
    
    const result = await sql`
      DELETE FROM events WHERE id = ${eventId} RETURNING id
    `;
    
    if (result && result.length > 0) {
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
