import { pgTable, uuid, varchar, text, timestamp, decimal, integer, pgEnum, boolean } from 'drizzle-orm/pg-core';

// Enums
export const eventStatusEnum = pgEnum('event_status', ['draft', 'published', 'cancelled', 'completed']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid', 'failed', 'refunded']);

// Users table (regular users)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }),
  password_hash: varchar('password_hash', { length: 255 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Admin Users table
export const adminUsers = pgTable('admin_users', {
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
  organizer: varchar('organizer', { length: 255 }).notNull(),
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
export const paymentHistory = pgTable('payment_history', {
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
export type AdminUser = typeof adminUsers.$inferSelect;
export type NewAdminUser = typeof adminUsers.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Registration = typeof registrations.$inferSelect;
export type NewRegistration = typeof registrations.$inferInsert;
export type PaymentHistory = typeof paymentHistory.$inferSelect;
export type NewPaymentHistory = typeof paymentHistory.$inferInsert; 