# Client Staging Setup Guide

## 🎯 What We Just Set Up

Your client (frontend) now supports **easy switching between staging and production APIs** for testing organizer features safely.

## 🚀 How to Use Different Environments

### **Option 1: Using Scripts (Recommended)**

```bash
# Connect to STAGING API (safe for testing organizer features)
cd client
bun run dev:staging

# Connect to PRODUCTION API (for testing live behavior)
cd client
bun run dev:production

# Regular development (defaults to staging)
cd client
bun run dev
```

### **Option 2: Environment Variables**

```bash
# Temporarily override API URL
cd client
NEXT_PUBLIC_API_URL=https://gowwra-api-worker-staging.charlcrtz17.workers.dev bun run dev
```

## 📋 Your Testing Workflow for Organizer Features

### **Step-by-Step Process:**

```
1. 🔧 Make organizer changes to worker code
2. 🚀 Deploy worker to staging: `bun run deploy:staging`
3. 🖥️ Run client with staging API: `bun run dev:staging`
4. 🧪 Test organizer features on localhost:3000
5. ✅ When working, deploy worker to production
6. 🌐 Test with production API: `bun run dev:production`
```

### **Environment Configuration**

**Development (Default):**

- Client runs on: `http://localhost:3000`
- API connects to: `https://gowwra-api-worker-staging.charlcrtz17.workers.dev`
- Database: Staging branch (safe to test)

**Staging Testing:**

- Client runs on: `http://localhost:3000`
- API connects to: `https://gowwra-api-worker-staging.charlcrtz17.workers.dev`
- Database: Staging branch (safe to test)

**Production Testing:**

- Client runs on: `http://localhost:3000`
- API connects to: `https://gowwra-api-worker-production.charlcrtz17.workers.dev`
- Database: Production (real data)

## 🔧 Configuration Files Created

### **1. Environment Configuration (`client/src/config/environment.ts`)**

```typescript
// Automatically detects and switches between environments
const API_BASE_URL = environment.getApiUrl();

// Helper functions available:
environment.getApiUrl(); // Current API URL
environment.STAGING_API; // Staging API URL
environment.PRODUCTION_API; // Production API URL
isUsingStaging(); // Check if using staging
```

### **2. Updated API Client (`client/src/lib/api.ts`)**

- Now automatically uses the configured environment
- No manual URL changes needed
- Supports dynamic environment switching

## 🎯 Organizer Development Workflow

### **Day 1-2: Backend Development**

```bash
# 1. Work on organizer API in worker
cd worker
# Make changes to organizer endpoints

# 2. Deploy to staging
bun run deploy:staging

# 3. Test API with client
cd ../client
bun run dev:staging
# Test organizer upgrade flow, event creation, etc.
```

### **Day 3-5: Frontend Development**

```bash
# 1. Build organizer UI components
cd client
# Make changes to organizer dashboard, forms, etc.

# 2. Test with staging API
bun run dev:staging
# Test complete organizer flow

# 3. When ready, test with production API
bun run dev:production
```

## 🛡️ Safety Features

### **What's Protected:**

- ✅ **Production data safe**: Default connects to staging
- ✅ **Easy switching**: Simple script commands
- ✅ **No manual editing**: No need to change URLs manually
- ✅ **Environment aware**: Knows which API it's connected to

### **Visual Indicators (Optional)**

You can add environment indicators to your UI:

```typescript
// In any component
import { isUsingStaging, environment } from "@/src/config/environment";

// Show environment badge
{
  isUsingStaging() && (
    <div className="bg-yellow-500 text-black px-2 py-1 text-xs">
      STAGING MODE
    </div>
  );
}
```

## 📊 API URLs Reference

### **Staging Environment:**

- **URL**: `https://gowwra-api-worker-staging.charlcrtz17.workers.dev`
- **Database**: Staging branch (copy of production)
- **Purpose**: Safe testing of new features

### **Production Environment:**

- **URL**: `https://gowwra-api-worker-production.charlcrtz17.workers.dev`
- **Database**: Main production database
- **Purpose**: Real user environment

## 🚨 Important Notes

### **Default Behavior:**

- `bun run dev` now connects to **staging by default**
- This prevents accidental testing on production
- Override with `bun run dev:production` when needed

### **Building for Deployment:**

```bash
# Build client for staging environment
bun run build:staging

# Build client for production environment
bun run build:production
```

## ✅ Quick Test

Test your setup:

```bash
# 1. Start client with staging API
cd client
bun run dev:staging

# 2. Open browser to http://localhost:3000
# 3. Check browser dev tools network tab
# 4. Should see API calls to: gowwra-api-worker-staging.charlcrtz17.workers.dev
```

---

## 🎉 Summary

**You now have:**

- ✅ **Automatic environment switching** for your client
- ✅ **Safe staging testing** by default
- ✅ **Easy production testing** when ready
- ✅ **No manual URL changes** needed
- ✅ **Professional development workflow**

**Ready to test organizer features safely!** 🚀
