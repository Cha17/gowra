import { pgTable, foreignKey, uuid, varchar, timestamp, numeric, unique, text, integer, serial, bigint, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const eventStatus = pgEnum("event_status", ['draft', 'published', 'cancelled', 'completed'])
export const paymentStatus = pgEnum("payment_status", ['pending', 'paid', 'failed', 'refunded'])


export const adminRefreshTokens = pgTable("admin_refresh_tokens", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	tokenHash: varchar("token_hash", { length: 255 }).notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [adminUsers.id],
			name: "admin_refresh_tokens_user_id_fkey"
		}).onDelete("cascade"),
]);

export const registrations = pgTable("registrations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	eventId: uuid("event_id").notNull(),
	paymentStatus: paymentStatus("payment_status").default('pending').notNull(),
	paymentReference: varchar("payment_reference", { length: 255 }),
	paymentAmount: numeric("payment_amount", { precision: 10, scale:  2 }).notNull(),
	registrationDate: timestamp("registration_date", { mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "registrations_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.eventId],
			foreignColumns: [events.id],
			name: "registrations_event_id_events_id_fk"
		}).onDelete("cascade"),
]);

export const paymentHistory = pgTable("payment_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	registrationId: uuid("registration_id").notNull(),
	paymentReference: varchar("payment_reference", { length: 255 }).notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	status: varchar({ length: 50 }).notNull(),
	paymentMethod: varchar("payment_method", { length: 100 }),
	transactionDate: timestamp("transaction_date", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.registrationId],
			foreignColumns: [registrations.id],
			name: "payment_history_registration_id_registrations_id_fk"
		}).onDelete("cascade"),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }),
	passwordHash: varchar("password_hash", { length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const events = pgTable("events", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	organizer: varchar({ length: 255 }).notNull(),
	details: text(),
	date: timestamp({ mode: 'string' }).notNull(),
	imageUrl: varchar("image_url", { length: 500 }),
	venue: varchar({ length: 255 }).notNull(),
	status: eventStatus().default('draft').notNull(),
	price: numeric({ precision: 10, scale:  2 }).default('0').notNull(),
	capacity: integer(),
	registrationDeadline: timestamp("registration_deadline", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const refreshTokens = pgTable("refresh_tokens", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	tokenHash: varchar("token_hash", { length: 255 }).notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "refresh_tokens_user_id_fkey"
		}).onDelete("cascade"),
]);

export const adminUsers = pgTable("admin_users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	name: varchar({ length: 255 }),
	passwordHash: varchar("password_hash", { length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("admin_users_email_unique").on(table.email),
]);

export const drizzleMigrations = pgTable("drizzle_migrations", {
	id: serial().primaryKey().notNull(),
	hash: text().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	createdAt: bigint("created_at", { mode: "number" }),
});
