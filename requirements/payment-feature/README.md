# Payment Feature Implementation

## Feature Overview

Enable users to complete one-time checkout payments for ticket orders via Payment Intent that returns a base64-encoded QR (PHP/QRPH). Users scan the QR to pay; webhooks confirm payment and tickets are issued immediately upon success.

## System Architecture

### Components

- **Cloudflare Worker API (worker/)**: Exposes endpoints to create accounts, create payment intents (QR), receive webhooks, and persist orders/checkouts.
- **Worker DB (drizzle)**: Stores orders and checkouts, mapping orders to NextAPI payment intents; supports multiple checkouts per unpaid order.
- **Client App (Next.js)**: Checkout page to initiate payment and display QR image.
- **NextAPI Partners**: External payments provider per `nextapi-partners.json` (Basic Auth) for account and payment intent operations.

### Data Flow

1. Client creates/loads an order in Worker DB.
2. Client calls Worker endpoint to create Payment Intent (for PHP/QRPH) tied to order; receives base64 QR string.
3. Client renders QR image from base64 for user to scan and pay.
4. NextAPI posts webhook to Worker on payment status updates.
5. Worker validates webhook, marks order paid, records checkout success, triggers ticket issuance immediately.

### Technology Stack

- **Backend**: Cloudflare Worker (TypeScript), Drizzle ORM for Worker KV/SQLite, NextAPI Partners (OpenAPI 3.1, Basic Auth)
- **Frontend**: Next.js App Router (TypeScript), minimal UI to display QR
- **Infrastructure**: Wrangler for Workers; Sandbox environment

### Integration Points

- **External APIs**: NextAPI Partners
  - Auth: Basic Auth using Client ID/Secret (Base64 in Authorization header)
  - Endpoints: Create Account, Create Payment Intent, Webhook notifications
- **Internal Services**: Ticket issuance flow (existing worker or server handler) invoked after payment success
- **Database Changes**: New Worker DB tables: `orders`, `checkouts`

## Prerequisites

- Cloudflare Worker runtime configured; Wrangler project at `worker/`
- Sandbox credentials for NextAPI Partners (Client ID/Secret)
- Environment variables set in `worker/.dev.vars`
- Existing event and user references to populate `orders`

## Implementation Sequence

1. Epic 1: Payments API Integration (account creation, payment intent QR generation)
2. Epic 2: Checkout and Order Model (DB schema, endpoints, client QR display)
3. Epic 3: Webhooks and Fulfillment (webhook endpoint, validation, ticket issuance)

## Success Criteria

- [ ] Payment Intent API returns base64 QR for PHP/QRPH
- [ ] Webhook marks order paid and issues tickets automatically
- [ ] Multiple checkouts allowed until paid; idempotent handling
