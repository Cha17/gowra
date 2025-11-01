# 🚀 Gowra Production Deployment Guide

**Complete guide to deploying your event management system to production.**

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Production Checklist](#production-checklist)
4. [Step-by-Step Deployment](#step-by-step-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Database Setup](#database-setup)
7. [Frontend Deployment](#frontend-deployment)
8. [Backend Deployment](#backend-deployment)
9. [Domain & SSL Setup](#domain--ssl-setup)
10. [Security Hardening](#security-hardening)
11. [Monitoring & Logging](#monitoring--logging)
12. [Backup Strategy](#backup-strategy)
13. [Troubleshooting](#troubleshooting)
14. [Post-Deployment](#post-deployment)

---

## 🏗️ Architecture Overview

### Current System Components

```
┌─────────────────┐
│   Next.js App   │ ← Frontend (Client)
│   (Vercel)      │
└────────┬────────┘
         │
         │ API Calls
         ↓
┌─────────────────────────┐
│ Cloudflare Workers      │ ← Backend API
│ (Production Worker)     │
└────────┬────────────────┘
         │
         │ SQL Queries
         ↓
┌─────────────────────────┐
│   Neon PostgreSQL       │ ← Database
│   (Production Branch)   │
└─────────────────────────┘
         │
         │ Webhooks
         ↓
┌─────────────────────────┐
│     NextPay API         │ ← Payment Gateway
└─────────────────────────┘
```

### Tech Stack

| Component | Technology                | Provider    |
| --------- | ------------------------- | ----------- |
| Frontend  | Next.js 15 + React 19     | Vercel      |
| Backend   | Cloudflare Workers + Hono | Cloudflare  |
| Database  | PostgreSQL                | Neon        |
| Payments  | NextPay API               | NextPay     |
| Auth      | Custom JWT                | Self-hosted |

---

## ✅ Prerequisites

Before you start, ensure you have:

- ✅ **Cloudflare Account** (for Workers deployment)
- ✅ **Vercel Account** (for frontend deployment)
- ✅ **Neon Account** (for database)
- ✅ **NextPay Account** (for payment processing)
- ✅ **Domain** (optional, but recommended)
- ✅ **GitHub Account** (for repository)
- ✅ **Node.js 18+** installed locally
- ✅ **Wrangler CLI** installed (`npm i -g wrangler`)
- ✅ **Vercel CLI** installed (`npm i -g vercel`)

---

## 📝 Production Checklist

Use this checklist to ensure nothing is missed:

### Pre-Deployment

- [ ] All secrets generated and stored securely
- [ ] Database migrations tested in staging
- [ ] API endpoints tested and documented
- [ ] Frontend builds successfully
- [ ] Payment integration tested
- [ ] Authentication flow verified
- [ ] Error handling in place
- [ ] Monitoring tools configured
- [ ] Backup strategy planned

### Deployment

- [ ] Environment variables configured
- [ ] Database connection strings valid
- [ ] Cloudflare Worker deployed
- [ ] Vercel frontend deployed
- [ ] Custom domain configured
- [ ] SSL certificates active
- [ ] CORS settings correct
- [ ] Health checks passing

### Post-Deployment

- [ ] Smoke tests passed
- [ ] Payment flow tested with real provider
- [ ] Authentication working
- [ ] Logs monitoring active
- [ ] Analytics configured
- [ ] Documentation updated

---

## 🔧 Step-by-Step Deployment

### Phase 1: Preparation (30 minutes)

#### 1.1 Generate Production Secrets

**Generate secure secrets for production:**

```bash
# Generate JWT secret (32+ random characters)
openssl rand -base64 32

# Generate refresh secret
openssl rand -base64 32

# Generate webhook secret (if using NextPay webhooks)
openssl rand -base64 32
```

**Save these securely** - you'll need them later!

#### 1.2 Verify Database Access

**Get your production database connection string from Neon:**

1. Go to [Neon Console](https://console.neon.tech)
2. Select your production project
3. Go to "Connection Details"
4. Copy the connection string
5. Test the connection:
   ```bash
   psql "your-connection-string"
   ```

#### 1.3 Get NextPay Credentials

**From your NextPay dashboard:**

- API Key
- Secret Key
- Account ID
- Webhook URL (for receiving payment confirmations)

---

### Phase 2: Backend Deployment (20 minutes)

#### 2.1 Configure Cloudflare Secrets

**Set sensitive variables as secrets (not in wrangler.jsonc):**

```bash
cd worker

# Login to Cloudflare
wrangler login

# Set production secrets
wrangler secret put DATABASE_URL --env production
# Paste your production database connection string when prompted

wrangler secret put JWT_SECRET --env production
# Paste your generated JWT secret

wrangler secret put JWT_REFRESH_SECRET --env production
# Paste your generated refresh secret

wrangler secret put NEXTPAY_API_KEY --env production
# Paste your NextPay API key

wrangler secret put NEXTPAY_SECRET_KEY --env production
# Paste your NextPay secret key

wrangler secret put NEXTPAY_ACCOUNT_ID --env production
# Paste your NextPay account ID

wrangler secret put ADMIN_EMAILS --env production
# Enter your admin emails (comma-separated)

# Optional: Webhook secret
wrangler secret put WEBHOOK_SECRET --env production
```

#### 2.2 Deploy to Production

```bash
# Build the worker
npm run build

# Deploy to production
npm run deploy:production
```

**Expected output:**

```
✨  Compiled Worker successfully
✨  Uploaded gowwra-api-worker-production
✨  Published gowwra-api-worker-production
Published gowwra-api-worker-production (10 seconds)
  https://gowwra-api-worker-production.charlcrtz17.workers.dev
```

#### 2.3 Verify Backend Deployment

**Test the health endpoint:**

```bash
curl https://gowwra-api-worker-production.charlcrtz17.workers.dev/health
```

**Expected response:**

```json
{
  "status": "ok",
  "message": "Gowra Events API is running"
}
```

**Test database connection:**

```bash
curl https://gowwra-api-worker-production.charlcrtz17.workers.dev/testdb
```

---

### Phase 3: Frontend Deployment (15 minutes)

#### 3.1 Configure Vercel Environment Variables

**Option A: Via Vercel Dashboard (Recommended)**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings → Environment Variables
4. Add the following:

```
NEXT_PUBLIC_API_URL=https://gowwra-api-worker-production.charlcrtz17.workers.dev
NEXT_PUBLIC_APP_NAME=Gowra
NEXT_PUBLIC_APP_DESCRIPTION=Event Management Platform
NEXT_PUBLIC_CHECKOUT_ENABLED=true
NEXT_PUBLIC_PAYMENT_SUCCESS_URL=https://your-domain.com/payment-success
NEXT_PUBLIC_PAYMENT_CANCEL_URL=https://your-domain.com/payment-cancel
```

**Option B: Via Vercel CLI**

```bash
cd client

# Set environment variables
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://gowwra-api-worker-production.charlcrtz17.workers.dev

vercel env add NEXT_PUBLIC_CHECKOUT_ENABLED production
# Enter: true
```

#### 3.2 Deploy to Vercel

```bash
cd client

# Build for production
npm run build:production

# Deploy to Vercel
vercel --prod
```

**OR** connect your GitHub repo to Vercel for automatic deployments!

#### 3.3 Verify Frontend Deployment

1. Visit your Vercel deployment URL
2. Check browser console for errors
3. Test login/register functionality
4. Verify API calls are going to production worker

---

### Phase 4: Database Setup (15 minutes)

#### 4.1 Run Production Migrations

**Ensure your production database schema is up-to-date:**

```bash
cd worker

# Check current migrations
ls drizzle/migrations

# Apply migrations to production
npm run db:push
# OR use Neon console SQL editor

# Verify tables exist
npm run db:studio
```

#### 4.2 Create Admin User

**Create your first admin user in production:**

```bash
# Using Neon console SQL editor
INSERT INTO users (email, name, password_hash, role, created_at, updated_at)
VALUES (
  'your-admin@email.com',
  'Admin User',
  -- Generate with: node -e "const bcrypt=require('bcrypt');console.log(bcrypt.hashSync('your-password',10));"
  '$2b$10$...',
  'admin',
  NOW(),
  NOW()
);
```

#### 4.3 Set Up Database Indexes

**Optimize your production database:**

```bash
# Run these SQL commands in Neon console
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
```

---

### Phase 5: Custom Domain & SSL (10 minutes)

#### 5.1 Configure Custom Domain (Cloudflare)

**If you want a custom API domain:**

1. Add a CNAME record in Cloudflare DNS:

   ```
   api.your-domain.com → gowwra-api-worker-production.charlcrtz17.workers.dev
   ```

2. Configure the custom route in `wrangler.jsonc`:

   ```json
   "routes": [
     {
       "pattern": "api.your-domain.com/*",
       "custom_domain": true
     }
   ]
   ```

3. Deploy again:
   ```bash
   cd worker
   npm run deploy:production
   ```

#### 5.2 Configure Custom Domain (Vercel)

**For your frontend:**

1. Go to Vercel project settings
2. Add your domain
3. Update DNS as instructed
4. SSL will be auto-provisioned

---

## 🔐 Security Hardening

### Backend Security Checklist

✅ **Secrets Management**

- Never commit secrets to Git
- Use Cloudflare Workers Secrets
- Rotate secrets regularly

✅ **CORS Configuration**

```json
// In your wrangler.jsonc or code
"cors": {
  "origin": ["https://your-domain.com", "https://www.your-domain.com"],
  "methods": ["GET", "POST", "PUT", "DELETE", "PATCH"],
  "headers": ["Content-Type", "Authorization"],
  "maxAge": 3600
}
```

✅ **Rate Limiting**

- Implement rate limiting in Workers
- Use Cloudflare rate limiting rules
- Protect against DDoS

✅ **Input Validation**

- Validate all user inputs
- Sanitize database queries
- Use Zod for type validation

✅ **Error Handling**

- Never expose internal errors to users
- Log errors securely
- Return generic messages

### Frontend Security Checklist

✅ **Environment Variables**

- Only expose what's needed with `NEXT_PUBLIC_` prefix
- Never expose secrets in client code

✅ **HTTPS Only**

- Force HTTPS redirects
- Use secure cookies

✅ **Content Security Policy**

```typescript
// next.config.ts
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
  },
];
```

---

## 📊 Monitoring & Logging

### Cloudflare Workers Monitoring

**View logs in real-time:**

```bash
cd worker

# Tail production logs
npm run logs:production
```

**Set up log retention:**

- Logs persist by default (configured in wrangler.jsonc)
- Access via Wrangler or Cloudflare Dashboard

**Monitoring metrics:**

- Request count
- Error rate
- Response time
- CPU time used

### Vercel Monitoring

**Analytics:**

- Enable Vercel Analytics
- Track page views and user behavior

**Web Vitals:**

- Monitor Core Web Vitals
- Identify performance issues

### Third-Party Monitoring

**Recommended tools:**

- **Sentry**: Error tracking
- **Datadog**: Infrastructure monitoring
- **Logflare**: Log aggregation

---

## 💾 Backup Strategy

### Neon Database Backups

**Automatic Backups:**

- Neon automatically backs up daily
- PITR (Point-in-Time Recovery) enabled
- 7-day retention (extendable)

**Manual Backups:**

```bash
# Export database
pg_dump "your-connection-string" > backup.sql

# Restore database
psql "your-connection-string" < backup.sql
```

**Branch Backups:**

- Create a production branch for testing
- Use staging branch for safe testing

### Code Backups

- ✅ Version control in GitHub
- ✅ Tag production releases
- ✅ Keep deployment history

---

## 🔍 Troubleshooting

### Common Issues

**Issue: "Worker deployment failed"**

```bash
# Check logs
wrangler tail --env production

# Verify secrets
wrangler secret list --env production

# Test locally first
wrangler dev --env production
```

**Issue: "Database connection error"**

- Verify connection string is correct
- Check Neon project is active
- Verify network access from Cloudflare

**Issue: "Authentication not working"**

- Verify JWT_SECRET matches
- Check token expiration settings
- Ensure ADMIN_EMAILS is set correctly

**Issue: "Frontend can't reach API"**

- Verify NEXT_PUBLIC_API_URL is correct
- Check CORS settings
- Verify Worker is deployed

**Issue: "Payment integration failing"**

- Verify NextPay credentials
- Check webhook URL configuration
- Review NextPay logs

---

## ✅ Post-Deployment Checklist

### Immediate Verification (5 minutes)

- [ ] Frontend loads without errors
- [ ] Backend health check passes
- [ ] User registration works
- [ ] Login/logout works
- [ ] Event listing loads
- [ ] Create event works
- [ ] Database connections stable

### Feature Testing (15 minutes)

- [ ] Browse events
- [ ] Search events
- [ ] Filter events
- [ ] View event details
- [ ] Register for event
- [ ] Payment flow (test mode)
- [ ] Admin dashboard
- [ ] Profile management

### Performance Testing (10 minutes)

- [ ] Page load times acceptable
- [ ] API response times good
- [ ] Database queries optimized
- [ ] Images load efficiently
- [ ] Mobile responsiveness

### Security Testing (10 minutes)

- [ ] HTTPS enforced
- [ ] Auth tokens secure
- [ ] Admin routes protected
- [ ] Input validation working
- [ ] Error messages don't leak info

---

## 🚦 Production Environment Variables Summary

### Backend (Cloudflare Worker)

| Variable             | Type   | Example                              |
| -------------------- | ------ | ------------------------------------ |
| `ENVIRONMENT`        | Config | `production`                         |
| `DATABASE_URL`       | Secret | `postgresql://...`                   |
| `JWT_SECRET`         | Secret | Generated 32+ chars                  |
| `JWT_REFRESH_SECRET` | Secret | Generated 32+ chars                  |
| `ADMIN_EMAILS`       | Secret | `admin@example.com`                  |
| `NEXTPAY_API_KEY`    | Secret | From NextPay                         |
| `NEXTPAY_SECRET_KEY` | Secret | From NextPay                         |
| `NEXTPAY_ACCOUNT_ID` | Secret | From NextPay                         |
| `NEXTAPI_BASE_URL`   | Config | `https://api.partners.nextpay.world` |
| `CHECKOUT_ENABLED`   | Config | `true`                               |

### Frontend (Vercel)

| Variable                          | Type   | Example                                   |
| --------------------------------- | ------ | ----------------------------------------- |
| `NEXT_PUBLIC_API_URL`             | Public | `https://api.your-domain.com`             |
| `NEXT_PUBLIC_APP_NAME`            | Public | `Gowra`                                   |
| `NEXT_PUBLIC_CHECKOUT_ENABLED`    | Public | `true`                                    |
| `NEXT_PUBLIC_PAYMENT_SUCCESS_URL` | Public | `https://your-domain.com/payment-success` |
| `NEXT_PUBLIC_PAYMENT_CANCEL_URL`  | Public | `https://your-domain.com/payment-cancel`  |

---

## 📞 Support & Resources

### Official Documentation

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Vercel Deployment](https://vercel.com/docs/deployments/overview)
- [Neon Database](https://neon.tech/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

### Important URLs

**Staging Environment:**

- Frontend: (if deployed)
- Backend: `https://gowwra-api-worker-staging.charlcrtz17.workers.dev`
- Database: Staging branch on Neon

**Production Environment:**

- Frontend: `https://your-domain.com`
- Backend: `https://gowwra-api-worker-production.charlcrtz17.workers.dev`
- Database: Production branch on Neon

---

## 🎉 Congratulations!

Your Gowra event management system is now live in production!

### Next Steps

1. **Monitor** your production environment closely for the first 24-48 hours
2. **Collect feedback** from early users
3. **Iterate** based on real-world usage
4. **Scale** infrastructure as needed
5. **Document** any issues for future reference

### Maintenance Schedule

**Daily:**

- Check error logs
- Monitor performance metrics

**Weekly:**

- Review database performance
- Check payment integration logs
- Review user feedback

**Monthly:**

- Update dependencies
- Review security patches
- Performance optimization
- Backup verification

---

## 🆘 Need Help?

If you encounter issues:

1. Check logs first
2. Review this guide
3. Search your GitHub issues
4. Consult official docs
5. Reach out to support

**Good luck with your production deployment! 🚀**
