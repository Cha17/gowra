import { relations } from "drizzle-orm/relations";
import { adminUsers, adminRefreshTokens, users, registrations, events, paymentHistory, refreshTokens } from "./schema";

export const adminRefreshTokensRelations = relations(adminRefreshTokens, ({one}) => ({
	adminUser: one(adminUsers, {
		fields: [adminRefreshTokens.userId],
		references: [adminUsers.id]
	}),
}));

export const adminUsersRelations = relations(adminUsers, ({many}) => ({
	adminRefreshTokens: many(adminRefreshTokens),
}));

export const registrationsRelations = relations(registrations, ({one, many}) => ({
	user: one(users, {
		fields: [registrations.userId],
		references: [users.id]
	}),
	event: one(events, {
		fields: [registrations.eventId],
		references: [events.id]
	}),
	paymentHistories: many(paymentHistory),
}));

export const usersRelations = relations(users, ({many}) => ({
	registrations: many(registrations),
	refreshTokens: many(refreshTokens),
}));

export const eventsRelations = relations(events, ({many}) => ({
	registrations: many(registrations),
}));

export const paymentHistoryRelations = relations(paymentHistory, ({one}) => ({
	registration: one(registrations, {
		fields: [paymentHistory.registrationId],
		references: [registrations.id]
	}),
}));

export const refreshTokensRelations = relations(refreshTokens, ({one}) => ({
	user: one(users, {
		fields: [refreshTokens.userId],
		references: [users.id]
	}),
}));