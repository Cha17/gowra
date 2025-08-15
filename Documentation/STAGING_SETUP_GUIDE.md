# Staging Environment Setup Guide

## 🎯 What We Just Set Up

You now have **TWO separate environments** for your Gowra API:

### **Production Environment**

- **Worker**: `gowwra-api-worker-production.charlcrtz17.workers.dev`
- **Database**: Your main Neon database (original)
- **Use for**: Real users, live website

### **Staging Environment** ✨ _NEW_

- **Worker**: `gowwra-api-worker-staging.charlcrtz17.workers.dev`
- **Database**: Staging branch copy of your production data
- **Use for**: Testing organizer features safely

## 🗄️ Database Setup

### **Staging Database Branch**

- **Project ID**: `cool-base-82650281`
- **Branch Name**: `staging-organizer`
- **Branch ID**: `br-crimson-grass-a1i24xri`
- **Connection**: `postgresql://neondb_owner:npg_VoaHOG2Crd6g@ep-frosty-bar-a191vjzk.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`

### **What This Means**

- Staging has an **exact copy** of your production data
- Changes to staging **don't affect** production
- Perfect for testing organizer features

## 🚀 How to Use Your New Staging Environment

### **Deploy to Staging**

```bash
cd worker
bun run deploy:staging
```

### **Deploy to Production**

```bash
cd worker
bun run deploy:production
```

### **Test Staging Locally**

```bash
cd worker
bun run dev:staging  # Connects to staging database
```

### **Test Staging API**

```bash
cd worker
bun run test:staging  # Runs API tests against staging
```

### **View Logs**

```bash
# Staging logs
bun run logs:staging

# Production logs
bun run logs:production
```

## 🔧 Environment Configuration

### **Staging Environment Variables**

- `DATABASE_URL`: Points to staging database branch
- `JWT_SECRET`: Same as production (for consistency)
- `JWT_REFRESH_SECRET`: Same as production
- `ADMIN_EMAILS`: Same as production
- `ENVIRONMENT`: "staging"

### **Production Environment Variables**

- `DATABASE_URL`: Points to main production database
- `JWT_SECRET`: Your production JWT secret
- `JWT_REFRESH_SECRET`: Your production refresh secret
- `ADMIN_EMAILS`: Your admin emails
- `ENVIRONMENT`: "production"

## 📋 Workflow for Organizer Development

### **Safe Development Process**

```
1. Make changes to code locally
2. Test locally with: bun run dev:staging
3. Deploy to staging: bun run deploy:staging
4. Test on staging: https://gowwra-api-worker-staging.charlcrtz17.workers.dev
5. When confident: bun run deploy:production
```

### **Testing Organizer Features**

1. **Database changes**: Test migrations on staging first
2. **API changes**: Test new organizer endpoints on staging
3. **Frontend changes**: Point frontend to staging API for testing
4. **User flow**: Test entire organizer upgrade flow on staging

## 🛡️ Safety Features

### **What's Protected**

- ✅ Production database is **never affected** during testing
- ✅ Real users **never see** broken features
- ✅ You can **break staging** without consequences
- ✅ Easy to **reset staging** by recreating the branch

### **Emergency Reset**

If staging gets messed up:

```bash
# Delete old staging branch
neonctl branches delete staging-organizer --project-id cool-base-82650281

# Create fresh staging branch
neonctl branches create --project-id cool-base-82650281 --name staging-organizer

# Update DATABASE_URL secret (get new connection string)
neonctl connection-string --project-id cool-base-82650281 --branch staging-organizer
bun wrangler secret put DATABASE_URL --env staging
```

## 🎯 Next Steps for Organizer Implementation

Now that staging is set up, your **5-day organizer development** will follow this pattern:

### **Day 1: Database Changes**

- Make schema changes on staging first
- Test migrations on staging database
- Deploy to staging and verify

### **Day 2: API Development**

- Build organizer endpoints
- Test on staging environment
- Verify permissions work correctly

### **Day 3-5: Frontend & Integration**

- Point frontend to staging API during development
- Test complete organizer flow on staging
- Only deploy to production when everything works

## 🔍 Monitoring & Debugging

### **Check Staging Health**

```bash
curl https://gowwra-api-worker-staging.charlcrtz17.workers.dev/api/events
```

### **View Real-time Logs**

```bash
bun run logs:staging
```

### **Compare Staging vs Production**

- Staging: `https://gowwra-api-worker-staging.charlcrtz17.workers.dev`
- Production: Your current live API URL

---

## ✨ Summary

You now have a **professional staging setup** that will make organizer development:

- **Safer** (no risk to production)
- **Faster** (test quickly without fear)
- **More confident** (thorough testing before going live)

**Ready to start Day 1 of organizer implementation!** 🚀
