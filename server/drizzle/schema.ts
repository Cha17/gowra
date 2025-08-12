import { pgTable, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const eventStatus = pgEnum("event_status", ['draft', 'published', 'cancelled', 'completed'])
export const paymentStatus = pgEnum("payment_status", ['pending', 'paid', 'failed', 'refunded'])



