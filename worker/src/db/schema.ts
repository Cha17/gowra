import { pgTable, uuid, varchar, text, timestamp, decimal, integer, pgEnum, boolean } from 'drizzle-orm/pg-core';

// Enums
export const eventStatusEnum = pgEnum('event_status', ['draft', 'published', 'cancelled', 'completed']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'failed', 'refunded']);
// User role enum - defines if user is regular user or organizer
export const userRoleEnum = pgEnum('user_role', ['user', 'organizer']);

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
  imageUrl: varchar('image_url', { length: 500 }),
  venue: varchar('venue', { length: 255 }).notNull(),
  status: eventStatusEnum('status').default('draft').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).default('0').notNull(),
  capacity: integer('capacity'),
  registrationDeadline: timestamp('registration_deadline'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Registrations table
export const registrations = pgTable('registrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }), // References users table
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  paymentStatus: paymentStatusEnum('payment_status').default('pending').notNull(),
  paymentReference: varchar('payment_reference', { length: 255 }),
  paymentAmount: decimal('payment_amount', { precision: 10, scale: 2 }).notNull(),
  registrationDate: timestamp('registration_date').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Payment History table
export const payment_history = pgTable('payment_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  registrationId: uuid('registration_id').notNull().references(() => registrations.id, { onDelete: 'cascade' }),
  paymentReference: varchar('payment_reference', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 100 }),
  transactionDate: timestamp('transaction_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
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
