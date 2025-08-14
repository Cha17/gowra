import { Hono } from 'hono';
import { authMiddleware, adminMiddleware } from '../lib/auth';
import { getDb, getSql } from '../db';
import { log } from '../lib/logger';

// Define the context type for Hono
interface PaymentContext {
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

const paymentRoutes = new Hono<PaymentContext>();

// ===== PHASE 3, STEP 3.4: PAYMENTS API ROUTES =====

// Get all payments (admin only)
paymentRoutes.get('/', authMiddleware, adminMiddleware, async (c) => {
  try {
    const { 
      registrationId, userId, status, paymentMethod, startDate, endDate, 
      page = '1', limit = '10' 
    } = c.req.query();
    
    const db = await getDb();
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build dynamic query based on filters
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;
    
    if (registrationId) {
      whereConditions.push(`ph.registration_id = $${paramIndex}`);
      queryParams.push(registrationId);
      paramIndex++;
    }
    
    if (userId) {
      whereConditions.push(`r.user_id = $${paramIndex}`);
      queryParams.push(userId);
      paramIndex++;
    }
    
    if (status) {
      whereConditions.push(`ph.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }
    
    if (paymentMethod) {
      whereConditions.push(`ph.payment_method = $${paramIndex}`);
      queryParams.push(paymentMethod);
      paramIndex++;
    }
    
    if (startDate) {
      whereConditions.push(`ph.transaction_date >= $${paramIndex}`);
      queryParams.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      whereConditions.push(`ph.transaction_date <= $${paramIndex}`);
      queryParams.push(endDate);
      paramIndex++;
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM payment_history ph
      JOIN registrations r ON ph.registration_id = r.id
      ${whereClause}
    `;
    
    const countResult = await db.execute(countQuery, queryParams);
    const totalCount = parseInt(countResult.rows[0]?.total || '0');
    
    // Get payments with registration and user details
    const paymentsQuery = `
      SELECT 
        ph.*,
        r.user_id,
        u.email as user_email,
        u.name as user_name,
        e.name as event_name,
        e.date as event_date,
        e.price as event_price
      FROM payment_history ph
      JOIN registrations r ON ph.registration_id = r.id
      JOIN users u ON r.user_id = u.id
      JOIN events e ON r.event_id = e.id
      ${whereClause}
      ORDER BY ph.transaction_date DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const paymentsResult = await db.execute(paymentsQuery, [...queryParams, parseInt(limit), offset]);
    const payments = paymentsResult.rows || [];
    
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    
    return c.json({
      success: true,
      data: {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          totalPages,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      },
      message: 'Payments retrieved successfully'
    });
    
  } catch (error) {
    log.error('Get payments error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      query: c.req.query()
    });
    
    return c.json({
      success: false,
      error: 'Failed to retrieve payments',
      message: 'An error occurred while fetching payments'
    }, 500);
  }
});

// Get payment by ID (admin or owner)
paymentRoutes.get('/:id', authMiddleware, async (c) => {
  try {
    const paymentId = c.req.param('id');
    const user = c.get('user');
    
    if (!paymentId) {
      return c.json({
        success: false,
        error: 'Payment ID is required',
        message: 'Please provide a valid payment ID'
      }, 400);
    }
    
    const db = await getDb();
    
    // Get payment details with registration and event info
    const paymentQuery = `
      SELECT 
        ph.*,
        r.user_id,
        r.status as registration_status,
        u.email as user_email,
        u.name as user_name,
        e.name as event_name,
        e.description as event_description,
        e.date as event_date,
        e.venue as event_venue,
        e.price as event_price,
        e.organizer as event_organizer
      FROM payment_history ph
      JOIN registrations r ON ph.registration_id = r.id
      JOIN users u ON r.user_id = u.id
      JOIN events e ON r.event_id = e.id
      WHERE ph.id = $1
    `;
    
    const paymentResult = await db.execute(paymentQuery, [paymentId]);
    
    if (!paymentResult.rows || paymentResult.rows.length === 0) {
      return c.json({
        success: false,
        error: 'Payment not found',
        message: 'The requested payment does not exist'
      }, 404);
    }
    
    const payment = paymentResult.rows[0];
    
    // Check if user can access this payment (admin or owner)
    if (!user.isAdmin && payment.user_id !== user.id) {
      return c.json({
        success: false,
        error: 'Access denied',
        message: 'You can only view your own payments'
      }, 403);
    }
    
    return c.json({
      success: true,
      data: payment,
      message: 'Payment retrieved successfully'
    });
    
  } catch (error) {
    log.error('Get payment by ID error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      paymentId: c.req.param('id')
    });
    
    return c.json({
      success: false,
      error: 'Failed to retrieve payment',
      message: 'An error occurred while fetching the payment'
    }, 500);
  }
});

// Get user's payments (authenticated user)
paymentRoutes.get('/user/me', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const { page = '1', limit = '10' } = c.req.query();
    
    const db = await getDb();
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM payment_history ph
      JOIN registrations r ON ph.registration_id = r.id
      WHERE r.user_id = $1
    `;
    
    const countResult = await db.execute(countQuery, [user.id]);
    const totalCount = parseInt(countResult.rows[0]?.total || '0');
    
    // Get user's payments with event details
    const paymentsQuery = `
      SELECT 
        ph.*,
        e.name as event_name,
        e.description as event_description,
        e.date as event_date,
        e.venue as event_venue,
        e.price as event_price,
        e.organizer as event_organizer
      FROM payment_history ph
      JOIN registrations r ON ph.registration_id = r.id
      JOIN events e ON r.event_id = e.id
      WHERE r.user_id = $1
      ORDER BY ph.transaction_date DESC
      LIMIT $2 OFFSET $3
    `;
    
    const paymentsResult = await db.execute(paymentsQuery, [user.id, parseInt(limit), offset]);
    const payments = paymentsResult.rows || [];
    
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    
    return c.json({
      success: true,
      data: {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          totalPages,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      },
      message: 'Your payments retrieved successfully'
    });
    
  } catch (error) {
    log.error('Get user payments error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: c.get('user')?.id
    });
    
    return c.json({
      success: false,
      error: 'Failed to retrieve payments',
      message: 'An error occurred while fetching your payments'
    }, 500);
  }
});

// Process payment for registration (authenticated user)
paymentRoutes.post('/process', authMiddleware, async (c) => {
  const user = c.get('user');
  let body: any;
  
  try {
    body = await c.req.json();
    const { 
      registrationId, 
      paymentMethod, 
      paymentAmount, 
      paymentReference,
      cardLast4,
      cardBrand
    } = body;
    
    if (!registrationId || !paymentMethod || !paymentAmount) {
      return c.json({
        success: false,
        error: 'Missing required fields',
        message: 'Registration ID, payment method, and payment amount are required'
      }, 400);
    }
    
    if (paymentAmount <= 0) {
      return c.json({
        success: false,
        error: 'Invalid payment amount',
        message: 'Payment amount must be greater than 0'
      }, 400);
    }
    
    const db = await getDb();
    
    // Check if registration exists and belongs to user
    const registrationQuery = `
      SELECT r.*, e.name as event_name, e.price as event_price, e.date as event_date
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      WHERE r.id = $1 AND r.user_id = $2
    `;
    
    const registrationResult = await db.execute(registrationQuery, [registrationId, user.id]);
    
    if (!registrationResult.rows || registrationResult.rows.length === 0) {
      return c.json({
        success: false,
        error: 'Registration not found',
        message: 'The registration does not exist or does not belong to you'
      }, 404);
    }
    
    const registration = registrationResult.rows[0];
    
    // Check if event has already started
    if (new Date(registration.event_date) <= new Date()) {
      return c.json({
        success: false,
        error: 'Payment not allowed',
        message: 'Cannot pay for an event that has already started'
      }, 409);
    }
    
    // Check if payment amount matches event price
    if (Math.abs(paymentAmount - registration.event_price) > 0.01) {
      return c.json({
        success: false,
        error: 'Invalid payment amount',
        message: `Payment amount must be ${registration.event_price}`
      }, 400);
    }
    
    // Check if payment already exists
    const existingPaymentQuery = `
      SELECT id FROM payment_history 
      WHERE registration_id = $1 AND status = 'completed'
    `;
    
    const existingPaymentResult = await db.execute(existingPaymentQuery, [registrationId]);
    
    if (existingPaymentResult.rows && existingPaymentResult.rows.length > 0) {
      return c.json({
        success: false,
        error: 'Payment already exists',
        message: 'This registration has already been paid for'
      }, 409);
    }
    
    // Generate payment reference if not provided
    const finalPaymentReference = paymentReference || `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    // Simulate payment processing (in real app, integrate with payment gateway)
    const paymentStatus = 'completed'; // Simulate successful payment
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    // Create payment record
    const createPaymentQuery = `
      INSERT INTO payment_history (
        registration_id, payment_amount, payment_method, payment_reference,
        transaction_id, status, transaction_date, card_last4, card_brand,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8, NOW(), NOW())
      RETURNING *
    `;
    
    const result = await db.execute(createPaymentQuery, [
      registrationId, paymentAmount, paymentMethod, finalPaymentReference,
      transactionId, paymentStatus, cardLast4 || null, cardBrand || null
    ]);
    
    if (!result.rows || result.rows.length === 0) {
      return c.json({
        success: false,
        error: 'Payment creation failed',
        message: 'Failed to create payment record'
      }, 500);
    }
    
    const newPayment = result.rows[0];
    
    // Update registration payment status
    await db.execute(
      'UPDATE registrations SET payment_status = $1, updated_at = NOW() WHERE id = $2',
      ['paid', registrationId]
    );
    
    log.info('Payment processed successfully', {
      paymentId: newPayment.id,
      registrationId,
      userId: user.id,
      eventName: registration.event_name,
      amount: paymentAmount,
      method: paymentMethod
    });
    
    return c.json({
      success: true,
      data: {
        payment: newPayment,
        registration: {
          id: registration.id,
          eventName: registration.event_name,
          eventDate: registration.event_date,
          paymentStatus: 'paid'
        }
      },
      message: 'Payment processed successfully'
    }, 201);
    
  } catch (error) {
    log.error('Process payment error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: user.id,
      registrationId: body?.registrationId
    });
    
    return c.json({
      success: false,
      error: 'Payment processing failed',
      message: 'An error occurred while processing the payment'
    }, 500);
  }
});

// Refund payment (admin only)
paymentRoutes.post('/:id/refund', authMiddleware, adminMiddleware, async (c) => {
  try {
    const paymentId = c.req.param('id');
    const body = await c.req.json();
    const { refundAmount, refundReason } = body;
    
    if (!paymentId) {
      return c.json({
        success: false,
        error: 'Payment ID is required',
        message: 'Please provide a valid payment ID'
      }, 400);
    }
    
    if (!refundAmount || refundAmount <= 0) {
      return c.json({
        success: false,
        error: 'Invalid refund amount',
        message: 'Refund amount must be greater than 0'
      }, 400);
    }
    
    const db = await getDb();
    
    // Check if payment exists and is completed
    const paymentQuery = `
      SELECT ph.*, r.user_id, e.name as event_name
      FROM payment_history ph
      JOIN registrations r ON ph.registration_id = r.id
      JOIN events e ON r.event_id = e.id
      WHERE ph.id = $1 AND ph.status = 'completed'
    `;
    
    const paymentResult = await db.execute(paymentQuery, [paymentId]);
    
    if (!paymentResult.rows || paymentResult.rows.length === 0) {
      return c.json({
        success: false,
        error: 'Payment not found',
        message: 'The payment does not exist or is not completed'
      }, 404);
    }
    
    const payment = paymentResult.rows[0];
    
    // Check if refund amount is valid
    if (refundAmount > payment.payment_amount) {
      return c.json({
        success: false,
        error: 'Invalid refund amount',
        message: 'Refund amount cannot exceed the original payment amount'
      }, 400);
    }
    
    // Create refund record
    const refundQuery = `
      INSERT INTO payment_history (
        registration_id, payment_amount, payment_method, payment_reference,
        transaction_id, status, transaction_date, refund_amount, refund_reason,
        parent_payment_id, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8, $9, NOW(), NOW())
      RETURNING *
    `;
    
    const refundReference = `REFUND-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const refundTransactionId = `REFUND-TXN-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    const result = await db.execute(refundQuery, [
      payment.registration_id,
      -refundAmount, // Negative amount for refund
      'refund',
      refundReference,
      refundTransactionId,
      'completed',
      refundAmount,
      refundReason || 'Admin refund',
      paymentId
    ]);
    
    if (!result.rows || result.rows.length === 0) {
      return c.json({
        success: false,
        error: 'Refund creation failed',
        message: 'Failed to create refund record'
      }, 500);
    }
    
    const refund = result.rows[0];
    
    // Update original payment status if full refund
    if (refundAmount === payment.payment_amount) {
      await db.execute(
        'UPDATE payment_history SET status = $1, updated_at = NOW() WHERE id = $2',
        ['refunded', paymentId]
      );
      
      // Update registration payment status
      await db.execute(
        'UPDATE registrations SET payment_status = $1, updated_at = NOW() WHERE id = $2',
        ['refunded', payment.registration_id]
      );
    }
    
    log.info('Payment refunded successfully', {
      paymentId,
      refundId: refund.id,
      refundAmount,
      adminUser: c.get('user').email,
      eventName: payment.event_name
    });
    
    return c.json({
      success: true,
      data: {
        refund,
        originalPayment: {
          id: payment.id,
          amount: payment.payment_amount,
          status: refundAmount === payment.payment_amount ? 'refunded' : 'partially_refunded'
        }
      },
      message: 'Payment refunded successfully'
    });
    
  } catch (error) {
    log.error('Refund payment error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      paymentId: c.req.param('id'),
      adminUser: c.get('user')?.email
    });
    
    return c.json({
      success: false,
      error: 'Refund failed',
      message: 'An error occurred while processing the refund'
    }, 500);
  }
});

// Get payment statistics (admin only)
paymentRoutes.get('/stats/overview', authMiddleware, adminMiddleware, async (c) => {
  try {
    const db = await getDb();
    
    // Get various payment statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_payments,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_payments,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
        COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refunded_payments,
        COUNT(CASE WHEN payment_method = 'credit_card' THEN 1 END) as credit_card_payments,
        COUNT(CASE WHEN payment_method = 'debit_card' THEN 1 END) as debit_card_payments,
        COUNT(CASE WHEN payment_method = 'bank_transfer' THEN 1 END) as bank_transfer_payments,
        SUM(CASE WHEN status = 'completed' THEN payment_amount END) as total_revenue,
        AVG(CASE WHEN status = 'completed' THEN payment_amount END) as average_payment,
        SUM(CASE WHEN refund_amount IS NOT NULL THEN ABS(refund_amount) END) as total_refunds
      FROM payment_history
    `;
    
    const statsResult = await db.execute(statsQuery);
    const stats = statsResult.rows[0] || {};
    
    // Get payments by month
    const monthlyStatsQuery = `
      SELECT 
        DATE_TRUNC('month', transaction_date) as month,
        COUNT(*) as payment_count,
        SUM(CASE WHEN status = 'completed' THEN payment_amount ELSE 0 END) as revenue,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_payments
      FROM payment_history
      WHERE transaction_date >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', transaction_date)
      ORDER BY month DESC
    `;
    
    const monthlyStatsResult = await db.execute(monthlyStatsQuery);
    const monthlyStats = monthlyStatsResult.rows || [];
    
    // Get payment methods distribution
    const paymentMethodStatsQuery = `
      SELECT 
        payment_method,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'completed' THEN payment_amount ELSE 0 END) as total_amount,
        AVG(CASE WHEN status = 'completed' THEN payment_amount END) as average_amount
      FROM payment_history
      WHERE status = 'completed'
      GROUP BY payment_method
      ORDER BY count DESC
    `;
    
    const paymentMethodStatsResult = await db.execute(paymentMethodStatsQuery);
    const paymentMethodStats = paymentMethodStatsResult.rows || [];
    
    return c.json({
      success: true,
      data: {
        overview: stats,
        monthlyStats,
        paymentMethodStats
      },
      message: 'Payment statistics retrieved successfully'
    });
    
  } catch (error) {
    log.error('Get payment stats error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      adminUser: c.get('user')?.email
    });
    
    return c.json({
      success: false,
      error: 'Failed to retrieve payment statistics',
      message: 'An error occurred while fetching payment statistics'
    }, 500);
  }
});

export { paymentRoutes };
