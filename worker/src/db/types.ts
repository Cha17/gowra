import type { Column, Table } from "drizzle-orm";
import type { PgMaterializedView, PgView } from "drizzle-orm/pg-core";
import type { Kyselify } from "drizzle-orm/kysely";
import type * as schema from "./schema";
import {
	DeduplicateJoinsPlugin,
	Kysely,
	PostgresDialect,
	type Transaction,
} from "kysely";
import { z } from "zod";
import { Pool, type PoolConfig } from "pg";

export type KyselifyTable<T extends Table> = Kyselify<T>;

export type KyselifyPgView<T extends PgView> = {
	[K in keyof T["_"]["selectedFields"] &
		string]: T["_"]["selectedFields"][K] extends Column<infer U, object>
		? U extends { data: infer D }
			? D
			: never
		: never;
};

export type KyselifyMaterializeView<T extends PgMaterializedView> = {
	[K in keyof T["_"]["selectedFields"] &
		string]: T["_"]["selectedFields"][K] extends Column<infer U, object>
		? U extends { data: infer D }
			? D
			: never
		: never;
};




// Database enum types
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

// Main database interface
export interface Database {
	users: KyselifyTable<typeof schema.users>;
	admin_users: KyselifyTable<typeof schema.admin_users>;
	events: KyselifyTable<typeof schema.events>;
	registrations: KyselifyTable<typeof schema.registrations>;
	payment_history: KyselifyTable<typeof schema.payment_history>;
}

// Individual table types for type safety
export type UserTable = Database['users'];
export type AdminUserTable = Database['admin_users'];
export type EventTable = Database['events'];
export type RegistrationTable = Database['registrations'];
export type PaymentHistoryTable = Database['payment_history'];

// Select types (for reading data)
export type User = UserTable;
export type AdminUser = AdminUserTable;
export type Event = EventTable;
export type Registration = RegistrationTable;
export type PaymentHistoryRecord = PaymentHistoryTable;

// Insert types (for creating new records)
export type NewUser = Omit<User, 'id' | 'created_at' | 'updated_at'> & {
	id?: string;
	created_at?: Date;
	updated_at?: Date;
};

export type NewAdminUser = Omit<AdminUser, 'id' | 'created_at' | 'updated_at'> & {
	id?: string;
	created_at?: Date;
	updated_at?: Date;
};

export type NewEvent = Omit<Event, 'id' | 'created_at' | 'updated_at'> & {
	id?: string;
	status?: EventStatus;
	created_at?: Date;
	updated_at?: Date;
};

export type NewRegistration = Omit<Registration, 'id' | 'registration_date' | 'created_at'> & {
	id?: string;
	payment_status?: PaymentStatus;
	registration_date?: Date;
	created_at?: Date;
};

export type NewPaymentHistory = Omit<PaymentHistoryRecord, 'id' | 'created_at'> & {
	id?: string;
	created_at?: Date;
};

// Update types (for updating existing records)
export type UserUpdate = Partial<Omit<User, 'id' | 'created_at'>> & {
	updated_at?: Date;
};

export type AdminUserUpdate = Partial<Omit<AdminUser, 'id' | 'created_at'>> & {
	updated_at?: Date;
};

export type EventUpdate = Partial<Omit<Event, 'id' | 'created_at'>> & {
	updated_at?: Date;
};

export type RegistrationUpdate = Partial<Omit<Registration, 'id' | 'user_id' | 'event_id' | 'registration_date' | 'created_at'>>;

export type PaymentHistoryUpdate = Partial<Omit<PaymentHistoryRecord, 'id' | 'registration_id' | 'created_at'>>;

// Query result types for common joins
export type EventWithRegistrations = Event & {
	registrations: Registration[];
};

export type RegistrationWithUser = Registration & {
	user: User;
};

export type RegistrationWithEvent = Registration & {
	event: Event;
};

export type RegistrationWithPaymentHistory = Registration & {
	payment_history: PaymentHistoryRecord[];
};

export type FullRegistration = Registration & {
	user: User;
	event: Event;
	payment_history: PaymentHistoryRecord[];
};

// Utility types for filtering and pagination
export type EventFilters = {
	status?: EventStatus | EventStatus[];
	organizer?: string;
	venue?: string;
	date_from?: Date;
	date_to?: Date;
	price_min?: number;
	price_max?: number;
};

export type RegistrationFilters = {
	payment_status?: PaymentStatus | PaymentStatus[];
	event_id?: string;
	user_id?: string;
	date_from?: Date;
	date_to?: Date;
};

export type PaginationParams = {
	limit?: number;
	offset?: number;
	order_by?: string;
	order_direction?: 'asc' | 'desc';
};

// Query builder helper types
export type EventQueryBuilder = DatabaseClient['selectFrom'] extends (table: 'events') => infer R ? R : never;
export type UserQueryBuilder = DatabaseClient['selectFrom'] extends (table: 'users') => infer R ? R : never;
export type RegistrationQueryBuilder = DatabaseClient['selectFrom'] extends (table: 'registrations') => infer R ? R : never;

export const CreateDbClientSchema = z.object({
	connection_string: z.string({
		required_error: "[createDbClient] connection_string is required",
	}),
	log_prefix: z.string().optional(),
	idle_timeout: z.number().optional(),
	connection_timeout: z.number().optional(),
	max_connections: z.number().optional(),
});

type CreateDbClient = z.infer<typeof CreateDbClientSchema>;

export type DatabaseClient = Kysely<Database>;
export type TransactionClient = Transaction<Database>;
export type DatabaseTransactionClient = DatabaseClient | TransactionClient;

export function createDbClient(input: CreateDbClient): DatabaseClient {
	const logPrefix = input.log_prefix || "generic";

	const options: PoolConfig = {
		connectionString: input.connection_string,
		idleTimeoutMillis: input.idle_timeout,
		connectionTimeoutMillis: input.connection_timeout,
		max: input.max_connections,
	};

	const pool = new Pool(options);

	const dialect = new PostgresDialect({
		pool,
	});

	const db = new Kysely<Database>({
		dialect,
		plugins: [new DeduplicateJoinsPlugin()],
	
	});

	return db;
}


// Repository pattern base types
export interface BaseRepository<T, TInsert, TUpdate> {
	findById(id: string): Promise<T | undefined>;
	findMany(filters?: any, pagination?: PaginationParams): Promise<T[]>;
	create(data: TInsert): Promise<T>;
	update(id: string, data: TUpdate): Promise<T | undefined>;
	delete(id: string): Promise<boolean>;
}

// Specific repository interfaces
export interface UserRepository extends BaseRepository<User, NewUser, UserUpdate> {
	findByEmail(email: string): Promise<User | undefined>;
	findManyByIds(ids: string[]): Promise<User[]>;
}

export interface EventRepository extends BaseRepository<Event, NewEvent, EventUpdate> {
	findByStatus(status: EventStatus): Promise<Event[]>;
	findUpcoming(limit?: number): Promise<Event[]>;
	findByOrganizer(organizer: string): Promise<Event[]>;
	findWithRegistrations(eventId: string): Promise<EventWithRegistrations | undefined>;
}

export interface RegistrationRepository extends BaseRepository<Registration, NewRegistration, RegistrationUpdate> {
	findByUserId(userId: string): Promise<Registration[]>;
	findByEventId(eventId: string): Promise<Registration[]>;
	findByPaymentStatus(status: PaymentStatus): Promise<Registration[]>;
	findFullRegistration(registrationId: string): Promise<FullRegistration | undefined>;
}

export interface PaymentHistoryRepository extends BaseRepository<PaymentHistoryRecord, NewPaymentHistory, PaymentHistoryUpdate> {
	findByRegistrationId(registrationId: string): Promise<PaymentHistoryRecord[]>;
	findByPaymentReference(reference: string): Promise<PaymentHistoryRecord | undefined>;
}

// Database service interface
export interface DatabaseService {
	users: UserRepository;
	admin_users: BaseRepository<AdminUser, NewAdminUser, AdminUserUpdate>;
	events: EventRepository;
	registrations: RegistrationRepository;
	paymentHistory: PaymentHistoryRepository;
	
	// Transaction support
	transaction<T>(callback: (trx: TransactionClient) => Promise<T>): Promise<T>;
}

// Query helper types for common operations
export type SelectableColumns<T extends keyof Database> = keyof Database[T];

export type UserColumns = SelectableColumns<'users'>;
export type EventColumns = SelectableColumns<'events'>;
export type RegistrationColumns = SelectableColumns<'registrations'>;

// API response types
export type ApiResponse<T> = {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
};

export type PaginatedResponse<T> = ApiResponse<T[]> & {
	pagination?: {
		total: number;
		page: number;
		limit: number;
		totalPages: number;
	};
};

// Example usage (commented out - uncomment when needed):
// const users = await db.selectFrom("users").select(["id", "email", "name", "created_at", "updated_at"]).executeTakeFirst();
// console.log(users);








