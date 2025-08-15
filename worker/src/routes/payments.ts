import { Hono } from 'hono';
import { authMiddleware, adminMiddleware } from '../lib/auth';
import { createDbClient } from '../db/types';
import type { EnvBinding } from '../schema/env';

// Define the context type for Hono
interface PaymentContext {
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

const paymentRoutes = new Hono<PaymentContext>();

// Get all payments (admin only)
paymentRoutes.get('/', authMiddleware, adminMiddleware, async (c) => {
  try {
    const { 
      registrationId, userId, status, paymentMethod, startDate, endDate, 
      page = '1', limit = '10' 
    } = c.req.query();
    
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query with filters
    let query = db
      .selectFrom('paymentHistory')
      .innerJoin('registrations', 'paymentHistory.registrationId', 'registrations.id')
      .innerJoin('users', 'registrations.userId', 'users.id')
      .innerJoin('events', 'registrations.eventId', 'events.id')
      .select([
        'paymentHistory.id',
        'paymentHistory.registrationId',
        'paymentHistory.paymentReference',
        'paymentHistory.amount',
        'paymentHistory.status',
        'paymentHistory.paymentMethod',
        'paymentHistory.transactionDate',
        'paymentHistory.createdAt',
        'registrations.userId',
        'users.email as user_email',
        'users.name as user_name',
        'events.name as event_name',
        'events.date as event_date',
        'events.price as event_price',
        db.fn.countAll().over().as('total_count')
      ]);
    
    // Apply filters
    if (registrationId) {
      query = query.where('paymentHistory.registrationId', '=', registrationId);
    }
    
    if (userId) {
      query = query.where('registrations.userId', '=', userId);
    }
    
    if (status) {
      query = query.where('paymentHistory.status', '=', status);
    }
    
    if (paymentMethod) {
      query = query.where('paymentHistory.paymentMethod', '=', paymentMethod);
    }
    
    if (startDate) {
      query = query.where('paymentHistory.transactionDate', '>=', startDate);
    }
    
    if (endDate) {
      query = query.where('paymentHistory.transactionDate', '<=', endDate);
    }
    
    const results = await query
      .orderBy('paymentHistory.transactionDate', 'desc')
      .limit(parseInt(limit))
      .offset(offset)
      .execute();
    
    const totalCount = results.length > 0 ? Number(results[0].total_count) : 0;
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    
    return c.json({
      success: true,
      data: {
        payments: results.map(({ total_count, ...payment }) => payment),
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
    console.error('Get payments error:', error);
    
    return c.json({
      success: false,
      error: 'Failed to retrieve payments',
      message: 'An error occurred while fetching payments'
    }, 500);
  }
});

// Get user's payment history (protected)
paymentRoutes.get('/my-payments', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const { page = '1', limit = '10' } = c.req.query();
    
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const results = await db
      .selectFrom('paymentHistory')
      .innerJoin('registrations', 'paymentHistory.registrationId', 'registrations.id')
      .innerJoin('events', 'registrations.eventId', 'events.id')
      .select([
        'paymentHistory.id',
        'paymentHistory.registrationId',
        'paymentHistory.paymentReference',
        'paymentHistory.amount',
        'paymentHistory.status',
        'paymentHistory.paymentMethod',
        'paymentHistory.transactionDate',
        'paymentHistory.createdAt',
        'events.name as event_name',
        'events.date as event_date',
        'events.venue as event_venue',
        'events.organizer as event_organizer',
        db.fn.countAll().over().as('total_count')
      ])
      .where('registrations.userId', '=', user.id)
      .orderBy('paymentHistory.transactionDate', 'desc')
      .limit(parseInt(limit))
      .offset(offset)
      .execute();
    
    const totalCount = results.length > 0 ? Number(results[0].total_count) : 0;
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    
    return c.json({
      success: true,
      data: {
        payments: results.map(({ total_count, ...payment }) => payment),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          totalPages,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      },
      message: 'User payments retrieved successfully'
    });
    
  } catch (error) {
    console.error('Get user payments error:', error);
    
    return c.json({
      success: false,
      error: 'Failed to retrieve user payments',
      message: 'An error occurred while fetching your payment history'
    }, 500);
  }
});

// Get payment by ID (protected)
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
    
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    
    let query = db
      .selectFrom('paymentHistory')
      .innerJoin('registrations', 'paymentHistory.registrationId', 'registrations.id')
      .innerJoin('events', 'registrations.eventId', 'events.id')
      .innerJoin('users', 'registrations.userId', 'users.id')
      .select([
        'paymentHistory.id',
        'paymentHistory.registrationId',
        'paymentHistory.paymentReference',
        'paymentHistory.amount',
        'paymentHistory.status',
        'paymentHistory.paymentMethod',
        'paymentHistory.transactionDate',
        'paymentHistory.createdAt',
        'registrations.userId',
        'events.name as event_name',
        'events.date as event_date',
        'events.venue as event_venue',
        'events.organizer as event_organizer',
        'users.email as user_email',
        'users.name as user_name'
      ])
      .where('paymentHistory.id', '=', paymentId);
    
    // Non-admin users can only see their own payments
    if (!user.isAdmin) {
      query = query.where('registrations.userId', '=', user.id);
    }
    
    const payment = await query.executeTakeFirst();
    
    if (!payment) {
      return c.json({
        success: false,
        error: 'Payment not found',
        message: 'The requested payment does not exist or you do not have permission to view it'
      }, 404);
    }
    
    return c.json({
      success: true,
      data: payment,
      message: 'Payment retrieved successfully'
    });
    
  } catch (error) {
    console.error('Get payment by ID error:', error);
    
    return c.json({
      success: false,
      error: 'Failed to retrieve payment',
      message: 'An error occurred while fetching the payment'
    }, 500);
  }
});

// Process payment for registration (protected)
paymentRoutes.post('/process', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { registrationId, paymentMethod, paymentReference } = body;
    
    // Validation
    if (!registrationId) {
      return c.json({
        success: false,
        error: 'Registration ID is required',
        message: 'Please provide a valid registration ID'
      }, 400);
    }
    
    if (!paymentMethod) {
      return c.json({
        success: false,
        error: 'Payment method is required',
        message: 'Please specify the payment method'
      }, 400);
    }
    
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    
    // Check if registration exists and belongs to user (unless admin)
    let registrationQuery = db
      .selectFrom('registrations')
      .innerJoin('events', 'registrations.eventId', 'events.id')
      .select([
        'registrations.id',
        'registrations.userId',
        'registrations.paymentStatus',
        'registrations.paymentAmount',
        'registrations.paymentReference as registration_reference',
        'events.name as event_name',
        'events.date as event_date'
      ])
      .where('registrations.id', '=', registrationId);
    
    if (!user.isAdmin) {
      registrationQuery = registrationQuery.where('registrations.userId', '=', user.id);
    }
    
    const registration = await registrationQuery.executeTakeFirst();
    
    if (!registration) {
      return c.json({
        success: false,
        error: 'Registration not found',
        message: 'The specified registration does not exist or you do not have permission to process payment for it'
      }, 404);
    }
    
    // Check if payment is already processed
    if (registration.paymentStatus === 'paid') {
      return c.json({
        success: false,
        error: 'Already paid',
        message: 'Payment for this registration has already been processed'
      }, 409);
    }
    
    // Check if event has passed
    if (new Date(registration.event_date) <= new Date()) {
      return c.json({
        success: false,
        error: 'Event has passed',
        message: 'Cannot process payment for past events'
      }, 400);
    }
    
    // Simulate payment processing (in a real app, this would integrate with a payment gateway)
    const transactionDate = new Date().toISOString();
    const finalPaymentReference = paymentReference || `PAY_${Date.now()}_${registration.id}`;
    
    // For simulation purposes, we'll assume payment is successful
    // In production, this would involve actual payment gateway integration
    const paymentStatus = 'completed'; // This would come from payment gateway
    
    // Begin transaction simulation
    try {
      // Create payment history record
      const paymentHistory = await db
        .insertInto('paymentHistory')
        .values({
          registrationId: registration.id,
          paymentReference: finalPaymentReference,
          amount: registration.paymentAmount,
          status: paymentStatus,
          paymentMethod,
          transactionDate
        })
        .returning('*')
        .executeTakeFirst();
      
      if (!paymentHistory) {
        throw new Error('Failed to create payment history');
      }
      
      // Update registration payment status
      const updatedRegistration = await db
        .updateTable('registrations')
        .set({
          paymentStatus: 'paid',
          paymentReference: finalPaymentReference
        })
        .where('id', '=', registration.id)
        .returning('*')
        .executeTakeFirst();
      
      if (!updatedRegistration) {
        throw new Error('Failed to update registration status');
      }
      
      console.log('Payment processed successfully:', {
        paymentId: paymentHistory.id,
        registrationId: registration.id,
        userId: registration.userId,
        amount: registration.paymentAmount,
        eventName: registration.event_name
      });
      
      return c.json({
        success: true,
        data: {
          payment: paymentHistory,
          registration: updatedRegistration
        },
        message: 'Payment processed successfully'
      }, 201);
      
    } catch (transactionError) {
      console.error('Payment transaction failed:', transactionError);
      
      return c.json({
        success: false,
        error: 'Payment processing failed',
        message: 'An error occurred while processing the payment'
      }, 500);
    }
    
  } catch (error) {
    console.error('Process payment error:', error);
    
    return c.json({
      success: false,
      error: 'Payment failed',
      message: 'An error occurred while processing the payment'
    }, 500);
  }
});

// Refund payment (admin only)
paymentRoutes.post('/:id/refund', authMiddleware, adminMiddleware, async (c) => {
  try {
    const paymentId = c.req.param('id');
    const body = await c.req.json();
    const { reason } = body;
    
    if (!paymentId) {
      return c.json({
        success: false,
        error: 'Payment ID is required',
        message: 'Please provide a valid payment ID'
      }, 400);
    }
    
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    
    // Get payment details
    const payment = await db
      .selectFrom('paymentHistory')
      .innerJoin('registrations', 'paymentHistory.registrationId', 'registrations.id')
      .select([
        'paymentHistory.id',
        'paymentHistory.registrationId',
        'paymentHistory.status',
        'paymentHistory.amount',
        'paymentHistory.paymentReference',
        'registrations.userId'
      ])
      .where('paymentHistory.id', '=', paymentId)
      .executeTakeFirst();
    
    if (!payment) {
      return c.json({
        success: false,
        error: 'Payment not found',
        message: 'The specified payment does not exist'
      }, 404);
    }
    
    if (payment.status !== 'completed') {
      return c.json({
        success: false,
        error: 'Cannot refund',
        message: 'Only completed payments can be refunded'
      }, 400);
    }
    
    // Create refund payment history record
    const refundReference = `REFUND_${Date.now()}_${payment.id}`;
    
    const refundPayment = await db
      .insertInto('paymentHistory')
      .values({
        registrationId: payment.registrationId,
        paymentReference: refundReference,
        amount: `-${payment.amount}`, // Negative amount for refund
        status: 'refunded',
        paymentMethod: 'refund',
        transactionDate: new Date().toISOString()
      })
      .returning('*')
      .executeTakeFirst();
    
    if (!refundPayment) {
      return c.json({
        success: false,
        error: 'Refund failed',
        message: 'Failed to create refund record'
      }, 500);
    }
    
    // Update original payment status
    await db
      .updateTable('paymentHistory')
      .set({ status: 'refunded' })
      .where('id', '=', paymentId)
      .execute();
    
    // Update registration status
    await db
      .updateTable('registrations')
      .set({ paymentStatus: 'refunded' })
      .where('id', '=', payment.registrationId)
      .execute();
    
    console.log('Payment refunded successfully:', {
      originalPaymentId: paymentId,
      refundPaymentId: refundPayment.id,
      registrationId: payment.registrationId,
      amount: payment.amount,
      reason: reason || 'No reason provided',
      adminUser: c.get('user').email
    });
    
    return c.json({
      success: true,
      data: refundPayment,
      message: 'Payment refunded successfully'
    });
    
  } catch (error) {
    console.error('Refund payment error:', error);
    
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
    const db = createDbClient({
      connection_string: c.env.DATABASE_URL,
    });
    
    // Get payment statistics
    const stats = await db
      .selectFrom('paymentHistory')
      .select([
        db.fn.count('id').as('total_transactions'),
        db.fn.count(db.case().when('status', '=', 'completed').then(1).end()).as('completed_payments'),
        db.fn.count(db.case().when('status', '=', 'refunded').then(1).end()).as('refunded_payments'),
        db.fn.sum(db.case().when('status', '=', 'completed').then('amount').end()).as('total_revenue'),
        db.fn.sum(db.case().when('status', '=', 'refunded').then('amount').end()).as('total_refunds')
      ])
      .executeTakeFirst();
    
    // Get payment methods breakdown
    const methodStats = await db
      .selectFrom('paymentHistory')
      .select([
        'paymentMethod',
        db.fn.count('id').as('transaction_count'),
        db.fn.sum('amount').as('total_amount')
      ])
      .where('status', '=', 'completed')
      .groupBy('paymentMethod')
      .orderBy('transaction_count', 'desc')
      .execute();
    
    // Get recent transactions
    const recentTransactions = await db
      .selectFrom('paymentHistory')
      .innerJoin('registrations', 'paymentHistory.registrationId', 'registrations.id')
      .innerJoin('events', 'registrations.eventId', 'events.id')
      .innerJoin('users', 'registrations.userId', 'users.id')
      .select([
        'paymentHistory.id',
        'paymentHistory.amount',
        'paymentHistory.status',
        'paymentHistory.transactionDate',
        'events.name as event_name',
        'users.email as user_email'
      ])
      .orderBy('paymentHistory.transactionDate', 'desc')
      .limit(10)
      .execute();
    
    return c.json({
      success: true,
      data: {
        overview: stats,
        paymentMethods: methodStats,
        recentTransactions
      },
      message: 'Payment statistics retrieved successfully'
    });
    
  } catch (error) {
    console.error('Get payment stats error:', error);
    
    return c.json({
      success: false,
      error: 'Failed to retrieve payment statistics',
      message: 'An error occurred while fetching payment statistics'
    }, 500);
  }
});

export { paymentRoutes };
