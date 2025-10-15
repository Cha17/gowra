CREATE TABLE "webhook_events" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"payment_intent_id" varchar(255) NOT NULL,
	"processed_at" timestamp DEFAULT now() NOT NULL
);
