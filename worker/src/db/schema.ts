import { pgTable, uuid, varchar, text, timestamp, decimal, integer, pgEnum, boolean } from 'drizzle-orm/pg-core';

// Enums
export const eventStatusEnum = pgEnum('event_status', ['draft', 'published', 'cancelled', 'completed']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'failed', 'refunded', 'cancelled']);
// User role enum - defines if user is regular user or organizer
export const userRoleEnum = pgEnum('user_role', ['user', 'organizer']);
// Order status enum
export const orderStatusEnum = pgEnum('order_status', ['pending', 'paid', 'cancelled']);
// Checkout status enum
export const checkoutStatusEnum = pgEnum('checkout_status', ['created', 'succeeded', 'failed']);
// Account status enum for NextPay
export const accountStatusEnum = pgEnum('account_status', ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING']);

// Users table (regular users + organizers)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }),
  password_hash: varchar('password_hash', { length: 255 }).notNull(),
  
  // User role field - determines if user is 'user' or 'organizer'
  role: userRoleEnum('role').default('user').notNull(),
  
  // Organizer-specific fields (only filled when role = 'organizer')
  organization_name: varchar('organization_name', { length: 255 }), // e.g., "Tech Community Manila"
  organization_type: varchar('organization_type', { length: 100 }), // e.g., "Community Group"
  event_types: text('event_types'), // JSON array of event types: ["Workshop", "Meetup"]
  organization_description: text('organization_description'), // Brief description of organization
  organization_website: varchar('organization_website', { length: 255 }), // Optional website
  organizer_since: timestamp('organizer_since'), // When user became organizer
  
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Admin Users table
export const admin_users = pgTable('admin_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }),
  password_hash: varchar('password_hash', { length: 255 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Events table
export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  
  // Legacy organizer field (string) - kept for old events
  organizer: varchar('organizer', { length: 255 }).notNull(),
  
  // New organizer reference (UUID) - for new events created by organizers
  // This links to users.id when role = 'organizer'
  organizer_id: uuid('organizer_id').references(() => users.id),
  
  details: text('details'),
  date: timestamp('date').notNull(),
  image_url: varchar('image_url', { length: 500 }),
  venue: varchar('venue', { length: 255 }).notNull(),
  status: eventStatusEnum('status').default('draft').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).default('0').notNull(),
  capacity: integer('capacity'),
  registration_deadline: timestamp('registration_deadline'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Registrations table
export const registrations = pgTable('registrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  event_id: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  payment_status: paymentStatusEnum('payment_status').default('pending').notNull(),
  payment_reference: varchar('payment_reference', { length: 255 }),
  payment_amount: decimal('payment_amount', { precision: 10, scale: 2 }).notNull(),
  ticket_quantity: integer('ticket_quantity').default(1).notNull(),
  registration_date: timestamp('registration_date').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Payment History table
export const payment_history = pgTable('payment_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  registration_id: uuid('registration_id').notNull().references(() => registrations.id, { onDelete: 'cascade' }),
  payment_reference: varchar('payment_reference', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  payment_method: varchar('payment_method', { length: 100 }),
  transaction_date: timestamp('transaction_date'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Orders table - for one-time ticket purchases
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  event_id: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  total_amount: integer('total_amount').notNull(), // in cents/minor units
  currency: varchar('currency', { length: 3 }).default('PHP').notNull(),
  status: orderStatusEnum('status').default('pending').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Checkouts table - tracks payment attempts for orders
export const checkouts = pgTable('checkouts', {
  id: uuid('id').primaryKey().defaultRandom(),
  order_id: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  payment_intent_id: varchar('payment_intent_id', { length: 255 }).notNull().unique(),
  amount: integer('amount').notNull(), // in cents/minor units
  currency: varchar('currency', { length: 3 }).default('PHP').notNull(),
  status: checkoutStatusEnum('status').default('created').notNull(),
  qr_base64: text('qr_base64').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Webhook events table for idempotency
export const webhook_events = pgTable('webhook_events', {
  id: varchar('id', { length: 255 }).primaryKey(),
  payment_intent_id: varchar('payment_intent_id', { length: 255 }).notNull(),
  processed_at: timestamp('processed_at').defaultNow().notNull(),
});

// Ticket issuance records (idempotency for fulfillment)
export const ticket_issuances = pgTable('ticket_issuances', {
  order_id: uuid('order_id').primaryKey().references(() => orders.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  event_id: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// NextPay User Accounts table - links users to NextPay accounts
export const user_accounts = pgTable('user_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  account_id: varchar('account_id', { length: 255 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// NextPay Payment Intents table - stores payment intent data
export const payment_intents = pgTable('payment_intents', {
  id: uuid('id').primaryKey().defaultRandom(),
  intent_id: varchar('intent_id', { length: 255 }).notNull(),
  order_id: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  account_id: varchar('account_id', { length: 255 }).notNull(),
  amount: varchar('amount', { length: 20 }).notNull(), // Store as string to avoid precision issues
  currency: varchar('currency', { length: 3 }).default('PHP').notNull(),
  status: varchar('status', { length: 50 }).default('PENDING').notNull(),
  qr_code: text('qr_code').notNull(),
  expires_at: timestamp('expires_at').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Webhook Logs table - tracks webhook events
export const webhook_logs = pgTable('webhook_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  webhook_id: varchar('webhook_id', { length: 255 }).notNull(),
  event_type: varchar('event_type', { length: 100 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  processed_at: timestamp('processed_at'),
  error: text('error'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Webhook Idempotency table - prevents duplicate webhook processing
export const webhook_idempotency = pgTable('webhook_idempotency', {
  key: varchar('key', { length: 255 }).primaryKey(),
  event_id: varchar('event_id', { length: 255 }).notNull(),
  processed: boolean('processed').default(false).notNull(),
  result: text('result'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  processed_at: timestamp('processed_at'),
});

// Export types for use in the application
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type AdminUser = typeof admin_users.$inferSelect;
export type NewAdminUser = typeof admin_users.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Registration = typeof registrations.$inferSelect;
export type NewRegistration = typeof registrations.$inferInsert;
export type PaymentHistory = typeof payment_history.$inferSelect;
export type NewPaymentHistory = typeof payment_history.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type Checkout = typeof checkouts.$inferSelect;
export type NewCheckout = typeof checkouts.$inferInsert;
export type TicketIssuance = typeof ticket_issuances.$inferSelect;
export type NewTicketIssuance = typeof ticket_issuances.$inferInsert;
export type UserAccount = typeof user_accounts.$inferSelect;
export type NewUserAccount = typeof user_accounts.$inferInsert;
export type PaymentIntent = typeof payment_intents.$inferSelect;
export type NewPaymentIntent = typeof payment_intents.$inferInsert;
export type WebhookLog = typeof webhook_logs.$inferSelect;
export type NewWebhookLog = typeof webhook_logs.$inferInsert;
export type WebhookIdempotency = typeof webhook_idempotency.$inferSelect;
export type NewWebhookIdempotency = typeof webhook_idempotency.$inferInsert;
