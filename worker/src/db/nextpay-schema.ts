import { pgTable, uuid, varchar, timestamp, text, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./schema";

export const accountStatus = pgEnum("account_status", ["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING"]);

export const userAccounts = pgTable("user_accounts", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  userId: uuid("user_id").notNull(),
  accountId: varchar("account_id", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  // Foreign key constraint will be added via migration
]);

export const paymentIntents = pgTable("payment_intents", {
  id: uuid().defaultRandom().primaryKey().notNull(),
  intentId: varchar("intent_id", { length: 255 }).notNull(),
  orderId: uuid("order_id").notNull(),
  accountId: varchar("account_id", { length: 255 }).notNull(),
  amount: varchar({ length: 20 }).notNull(), // Store as string to avoid precision issues
  currency: varchar({ length: 3 }).default('PHP').notNull(),
  status: varchar({ length: 50 }).default('PENDING').notNull(),
  qrCode: text("qr_code").notNull(),
  expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
  // Foreign key constraints will be added via migration
]);
