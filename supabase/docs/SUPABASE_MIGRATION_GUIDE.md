# Circulo Grant Manager - Supabase Migration Guide

## Overview

This guide provides step-by-step instructions for migrating the Circulo Grant Manager application from Manus IM platform to Supabase. The migration enables independent deployment without platform constraints while maintaining all functionality.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Project Setup](#supabase-project-setup)
3. [Database Migration](#database-migration)
4. [Storage Configuration](#storage-configuration)
5. [Edge Functions Deployment](#edge-functions-deployment)
6. [Environment Variables](#environment-variables)
7. [Backend Code Updates](#backend-code-updates)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting the migration, ensure you have:

- **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
- **Node.js**: Version 18+ installed
- **Supabase CLI**: Install with `npm install -g supabase`
- **Git**: For version control
- **OpenAI API Key**: For AI document analysis (optional but recommended)
- **Resend API Key**: For email notifications (optional)

---

## Supabase Project Setup

### Step 1: Create New Supabase Project

1. Log in to [Supabase Dashboard](https://app.supabase.com)
2. Click **"New Project"**
3. Fill in project details:
   - **Name**: `circulo-grant-manager`
   - **Database Password**: Choose a strong password (save it securely!)
   - **Region**: Select closest to your users
   - **Pricing Plan**: Start with Free tier, upgrade as needed
4. Click **"Create new project"**
5. Wait 2-3 minutes for project initialization

### Step 2: Get Project Credentials

Once the project is ready:

1. Go to **Settings** → **API**
2. Copy and save these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: For client-side access
   - **service_role key**: For server-side access (keep secret!)

---

## Database Migration

### Step 3: Run Database Migrations

#### Option A: Using Supabase Dashboard (Recommended for beginners)

1. Go to **SQL Editor** in Supabase Dashboard
2. Click **"New query"**
3. Copy contents of `migrations/001_initial_schema.sql`
4. Paste into SQL Editor
5. Click **"Run"** (bottom right)
6. Wait for completion (should take 10-30 seconds)
7. Repeat for:
   - `migrations/002_rls_policies.sql`
   - `migrations/003_functions_triggers.sql`

#### Option B: Using Supabase CLI (Recommended for developers)

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push

# Or run individual migration files
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" < migrations/001_initial_schema.sql
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" < migrations/002_rls_policies.sql
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" < migrations/003_functions_triggers.sql
```

### Step 4: Verify Database Setup

1. Go to **Table Editor** in Supabase Dashboard
2. Verify all 29 tables are created:
   - users
   - grant_opportunities
   - applications
   - projects
   - budget_items
   - partners
   - documents
   - activities
   - expenses
   - reports
   - audit_records
   - notifications
   - api_credentials
   - audit_logs
   - translations
   - google_drive_files
   - whatsapp_messages
   - email_logs
   - ai_assistance_sessions
   - n8n_webhooks
   - organization_profile
   - impact_metrics
   - impact_reports
   - report_templates
   - beneficiaries
   - impact_stories
   - report_documents

3. Check **Database** → **Functions** to verify helper functions are created
4. Check **Authentication** → **Policies** to verify RLS policies are active

---

## Storage Configuration

### Step 5: Configure Storage Buckets

#### Option A: Using Supabase Dashboard

1. Go to **Storage** in Supabase Dashboard
2. Click **"Create a new bucket"**
3. Create these buckets:

**Bucket 1: documents**
- Name: `documents`
- Public: ✅ Yes
- File size limit: 50 MB
- Allowed MIME types: PDF, Word, Excel, CSV, TXT, Images

**Bucket 2: reports**
- Name: `reports`
- Public: ✅ Yes
- File size limit: 100 MB
- Allowed MIME types: PDF, Word, HTML

**Bucket 3: media**
- Name: `media`
- Public: ✅ Yes
- File size limit: 10 MB
- Allowed MIME types: Images, Videos, Audio

**Bucket 4: receipts**
- Name: `receipts`
- Public: ❌ No (Private)
- File size limit: 20 MB
- Allowed MIME types: PDF, Images

**Bucket 5: whatsapp**
- Name: `whatsapp`
- Public: ❌ No (Private)
- File size limit: 16 MB
- Allowed MIME types: Images, Audio, Video, PDF

#### Option B: Using SQL Script

1. Go to **SQL Editor**
2. Run `storage/storage_setup.sql`

### Step 6: Configure Storage Policies

The storage policies are automatically created by the SQL script. Verify by:

1. Go to **Storage** → Select a bucket → **Policies**
2. Ensure policies are active for SELECT, INSERT, UPDATE, DELETE operations

---

## Edge Functions Deployment

### Step 7: Deploy Edge Functions

Edge Functions provide serverless backend logic for AI analysis, webhooks, and emails.

#### Deploy AI Document Analysis Function

```bash
# Navigate to functions directory
cd supabase-migration/functions

# Deploy ai-document-analysis function
supabase functions deploy ai-document-analysis

# Set environment variables
supabase secrets set OPENAI_API_KEY=your_openai_api_key_here
```

#### Deploy WhatsApp Webhook Function

```bash
# Deploy whatsapp-webhook function
supabase functions deploy whatsapp-webhook

# Set webhook secret (optional but recommended)
supabase secrets set WHATSAPP_WEBHOOK_SECRET=your_random_secret_here
```

#### Deploy Email Function

```bash
# Deploy send-email function
supabase functions deploy send-email

# Set email service credentials
supabase secrets set RESEND_API_KEY=your_resend_api_key_here
supabase secrets set FROM_EMAIL=noreply@yourdomain.com
supabase secrets set FROM_NAME="Circulo Grant Manager"
```

### Step 8: Get Edge Function URLs

After deployment:

1. Go to **Edge Functions** in Supabase Dashboard
2. Copy the URLs for each function:
   - `https://[PROJECT-REF].functions.supabase.co/ai-document-analysis`
   - `https://[PROJECT-REF].functions.supabase.co/whatsapp-webhook`
   - `https://[PROJECT-REF].functions.supabase.co/send-email`

---

## Environment Variables

### Step 9: Configure Application Environment Variables

Create a `.env` file in your application root:

```env
# Supabase Configuration
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Edge Function URLs
AI_ANALYSIS_FUNCTION_URL=https://xxxxx.functions.supabase.co/ai-document-analysis
WHATSAPP_WEBHOOK_URL=https://xxxxx.functions.supabase.co/whatsapp-webhook
EMAIL_FUNCTION_URL=https://xxxxx.functions.supabase.co/send-email

# OpenAI (for AI features)
OPENAI_API_KEY=your_openai_api_key_here

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key_here
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME="Circulo Grant Manager"

# WhatsApp Webhook Secret (optional)
WHATSAPP_WEBHOOK_SECRET=your_random_secret_here

# Application Configuration
NODE_ENV=production
PORT=3000
```

---

## Backend Code Updates

### Step 10: Replace Database Client

The existing application uses Drizzle ORM with MySQL/TiDB. You need to update it to use Supabase client.

#### Install Supabase Client

```bash
npm install @supabase/supabase-js
```

#### Create Supabase Client Utility

Create `server/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to get current user from JWT
export function getCurrentUser(authHeader: string | null) {
  if (!authHeader) return null;
  
  const token = authHeader.replace('Bearer ', '');
  // Decode JWT to get user info
  // Supabase handles this automatically in Edge Functions
  // For Express, you may need to verify the JWT
  
  return token;
}
```

#### Update Database Queries

Replace Drizzle queries with Supabase queries:

**Before (Drizzle):**
```typescript
const grants = await db.select().from(grantOpportunities);
```

**After (Supabase):**
```typescript
const { data: grants, error } = await supabase
  .from('grant_opportunities')
  .select('*');
```

#### Update Authentication

Replace Manus OAuth with Supabase Auth:

**Before (Manus OAuth):**
```typescript
// Complex OAuth flow with cookies
```

**After (Supabase Auth):**
```typescript
// Client-side login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
});

// Or use OAuth providers
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
});
```

#### Update File Uploads

Replace S3 direct uploads with Supabase Storage:

**Before (S3):**
```typescript
await storagePut(fileKey, fileBuffer, mimeType);
```

**After (Supabase Storage):**
```typescript
const { data, error } = await supabase.storage
  .from('documents')
  .upload(fileKey, fileBuffer, {
    contentType: mimeType,
  });

const { data: urlData } = supabase.storage
  .from('documents')
  .getPublicUrl(fileKey);
```

---

## Testing

### Step 11: Test Database Connectivity

```bash
# Test connection
node -e "const { createClient } = require('@supabase/supabase-js'); const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY); supabase.from('users').select('count').then(console.log);"
```

### Step 12: Test Storage

```bash
# Upload test file
curl -X POST 'https://xxxxx.supabase.co/storage/v1/object/documents/test.txt' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: text/plain" \
  --data-binary "Test content"
```

### Step 13: Test Edge Functions

```bash
# Test AI analysis function
curl -X POST 'https://xxxxx.functions.supabase.co/ai-document-analysis' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"documentIds": [1], "reportingPeriodStart": "2024-01-01", "reportingPeriodEnd": "2024-12-31"}'
```

---

## Deployment

### Step 14: Deploy Application

#### Option A: Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel Dashboard
```

#### Option B: Deploy to Your Own VPS

```bash
# Build application
npm run build

# Copy files to VPS
scp -r dist/ user@your-vps:/var/www/circulo

# Start application with PM2
pm2 start npm --name "circulo" -- start
pm2 save
```

#### Option C: Deploy to Railway

1. Connect GitHub repository to Railway
2. Set environment variables in Railway Dashboard
3. Deploy automatically on push

---

## Data Migration (Optional)

### Step 15: Migrate Existing Data

If you have existing data in Manus IM platform:

#### Export Data from Manus

```bash
# Use the existing database connection to export data
pg_dump $DATABASE_URL > manus_data.sql
```

#### Import Data to Supabase

```bash
# Clean up the dump file (remove Manus-specific tables)
# Then import to Supabase
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" < manus_data.sql
```

#### Or Use CSV Import

1. Export tables to CSV from Manus
2. Go to Supabase Dashboard → **Table Editor**
3. Select table → **Import data** → Upload CSV

---

## Troubleshooting

### Common Issues

#### Issue 1: RLS Policies Blocking Queries

**Symptom**: Queries return empty results or "permission denied" errors

**Solution**:
1. Check RLS policies in Dashboard → **Authentication** → **Policies**
2. Verify user authentication token is valid
3. Temporarily disable RLS for testing:
   ```sql
   ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
   ```

#### Issue 2: Edge Functions Timeout

**Symptom**: Edge functions return timeout errors

**Solution**:
1. Increase timeout in function configuration
2. Optimize function code (reduce API calls, use caching)
3. Check Edge Function logs in Dashboard

#### Issue 3: Storage Upload Fails

**Symptom**: File uploads return 403 or 413 errors

**Solution**:
1. Check bucket policies (SELECT, INSERT permissions)
2. Verify file size is within bucket limits
3. Check MIME type is allowed
4. Ensure bucket is public if accessing without auth

#### Issue 4: Database Connection Errors

**Symptom**: "Connection refused" or "Invalid credentials"

**Solution**:
1. Verify SUPABASE_URL and keys are correct
2. Check project is not paused (Free tier pauses after inactivity)
3. Verify IP allowlist if configured

---

## Security Best Practices

1. **Never expose service_role key** in client-side code
2. **Use RLS policies** for all tables - never disable in production
3. **Validate all inputs** in Edge Functions
4. **Use HTTPS only** for all API calls
5. **Rotate API keys** regularly
6. **Enable 2FA** on Supabase account
7. **Monitor audit logs** for suspicious activity
8. **Backup database** regularly (Supabase Pro includes automatic backups)

---

## Performance Optimization

### Database Indexes

All critical indexes are created by the migration scripts. Monitor query performance:

```sql
-- Check slow queries
SELECT * FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

### Edge Function Caching

Add caching to Edge Functions:

```typescript
// Cache responses for 5 minutes
const cacheKey = `cache:${userId}:${queryParams}`;
const cached = await supabase.from('cache').select('*').eq('key', cacheKey).single();

if (cached && cached.expires_at > new Date()) {
  return cached.data;
}
```

### Storage CDN

Supabase Storage uses CDN by default. For better performance:

1. Use public buckets when possible
2. Set appropriate cache headers
3. Use image transformations API for images

---

## Monitoring and Maintenance

### Monitor Application Health

1. **Supabase Dashboard** → **Reports** for usage metrics
2. **Edge Functions** → **Logs** for function errors
3. **Database** → **Query Performance** for slow queries
4. **Storage** → **Usage** for storage consumption

### Set Up Alerts

1. Go to **Project Settings** → **Alerts**
2. Configure alerts for:
   - Database CPU usage > 80%
   - Storage usage > 80%
   - Edge Function errors > 10/minute

### Regular Backups

**Free Tier**: Manual backups via pg_dump
```bash
pg_dump "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" > backup_$(date +%Y%m%d).sql
```

**Pro Tier**: Automatic daily backups with point-in-time recovery

---

## Cost Estimation

### Free Tier Limits

- Database: 500 MB
- Storage: 1 GB
- Bandwidth: 2 GB
- Edge Functions: 500,000 invocations/month
- Auth users: Unlimited

### Pro Tier ($25/month)

- Database: 8 GB (+ $0.125/GB)
- Storage: 100 GB (+ $0.021/GB)
- Bandwidth: 250 GB (+ $0.09/GB)
- Edge Functions: 2M invocations (+ $2/1M)
- Daily backups

### Estimated Monthly Cost for Circulo

**Small NGO (< 50 users)**: Free tier sufficient

**Medium NGO (50-200 users)**: ~$25-50/month (Pro tier)

**Large NGO (200+ users)**: ~$50-100/month (Pro tier + overages)

---

## Support and Resources

### Official Documentation

- [Supabase Docs](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Storage Guide](https://supabase.com/docs/guides/storage)

### Community Support

- [Supabase Discord](https://discord.supabase.com)
- [GitHub Discussions](https://github.com/supabase/supabase/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/supabase)

### Circulo-Specific Support

For questions about this migration:
1. Check this documentation first
2. Review the code comments in migration files
3. Test in a development project before production

---

## Migration Checklist

Use this checklist to track your migration progress:

- [ ] Create Supabase project
- [ ] Copy project credentials
- [ ] Run database migrations (001, 002, 003)
- [ ] Verify all 29 tables created
- [ ] Create storage buckets (5 buckets)
- [ ] Configure storage policies
- [ ] Deploy Edge Functions (3 functions)
- [ ] Set Edge Function secrets
- [ ] Update application .env file
- [ ] Install @supabase/supabase-js
- [ ] Update database queries
- [ ] Update authentication flow
- [ ] Update file upload code
- [ ] Test database connectivity
- [ ] Test storage uploads
- [ ] Test Edge Functions
- [ ] Migrate existing data (if applicable)
- [ ] Deploy application
- [ ] Configure custom domain (optional)
- [ ] Set up monitoring and alerts
- [ ] Configure backups
- [ ] Document any customizations

---

## Conclusion

Congratulations! You've successfully migrated Circulo Grant Manager to Supabase. Your application now runs independently without platform constraints.

**Next Steps:**

1. Monitor application performance for the first week
2. Set up regular backups
3. Configure custom domain (optional)
4. Invite team members to Supabase project
5. Review and optimize RLS policies as needed

**Remember:**
- Keep your service_role key secret
- Monitor usage to avoid unexpected costs
- Review security best practices regularly
- Keep Supabase CLI and libraries updated

For questions or issues, refer to the Troubleshooting section or reach out to Supabase support.

---

**Version**: 1.0.0  
**Last Updated**: 2025  
**Maintained By**: Circulo Development Team
