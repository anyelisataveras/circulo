# Circulo Grant Manager - Supabase Migration Quick Start

## For Non-Technical Users

This guide provides simplified instructions for migrating Circulo to Supabase without deep technical knowledge. If you get stuck, consider hiring a developer to help with the migration.

---

## What You'll Need (15 minutes to gather)

1. **Supabase Account** (Free)
   - Sign up at [supabase.com](https://supabase.com)
   - No credit card required for free tier

2. **OpenAI API Key** (Optional, for AI features)
   - Sign up at [platform.openai.com](https://platform.openai.com)
   - Add $5-10 credit to your account
   - Generate API key in API Keys section

3. **Email Service** (Optional, for notifications)
   - Sign up at [resend.com](https://resend.com) (Free tier: 100 emails/day)
   - Or use any SMTP service (Gmail, SendGrid, etc.)

---

## Step-by-Step Migration (30-45 minutes)

### Part 1: Create Supabase Project (5 minutes)

1. **Go to** [app.supabase.com](https://app.supabase.com)
2. **Click** "New Project"
3. **Fill in:**
   - Name: `circulo-grant-manager`
   - Database Password: Create a strong password (save it!)
   - Region: Choose closest to you
4. **Click** "Create new project"
5. **Wait** 2-3 minutes for setup

### Part 2: Set Up Database (10 minutes)

1. **In Supabase Dashboard**, click **"SQL Editor"** (left sidebar)
2. **Click** "New query"
3. **Open** the file `migrations/001_initial_schema.sql` from the migration package
4. **Copy all text** (Ctrl+A, Ctrl+C)
5. **Paste** into SQL Editor
6. **Click** "Run" (bottom right)
7. **Wait** for "Success" message (10-30 seconds)
8. **Repeat** steps 2-7 for these files:
   - `migrations/002_rls_policies.sql`
   - `migrations/003_functions_triggers.sql`

**✅ Checkpoint**: Go to "Table Editor" → You should see 29 tables listed

### Part 3: Set Up Storage (5 minutes)

1. **Click** "Storage" (left sidebar)
2. **Click** "Create a new bucket"
3. **Create 5 buckets** with these settings:

| Bucket Name | Public? | Size Limit |
|-------------|---------|------------|
| documents   | ✅ Yes  | 50 MB      |
| reports     | ✅ Yes  | 100 MB     |
| media       | ✅ Yes  | 10 MB      |
| receipts    | ❌ No   | 20 MB      |
| whatsapp    | ❌ No   | 16 MB      |

**✅ Checkpoint**: You should see 5 buckets in Storage section

### Part 4: Get Your Credentials (3 minutes)

1. **Click** "Settings" → "API" (left sidebar)
2. **Copy and save** these 3 values somewhere safe:

```
Project URL: https://xxxxx.supabase.co
anon key: eyJhbGc...
service_role key: eyJhbGc... (keep this SECRET!)
```

### Part 5: Deploy Edge Functions (10 minutes)

**Option A: Using Dashboard (Easier)**

Unfortunately, Edge Functions can't be deployed via Dashboard. Skip to Option B.

**Option B: Using Command Line (Required)**

1. **Open Terminal** (Mac) or Command Prompt (Windows)
2. **Install Supabase CLI:**
   ```bash
   npm install -g supabase
   ```
3. **Login:**
   ```bash
   supabase login
   ```
4. **Navigate to migration folder:**
   ```bash
   cd path/to/supabase-migration/functions
   ```
5. **Deploy functions:**
   ```bash
   supabase functions deploy ai-document-analysis
   supabase functions deploy whatsapp-webhook
   supabase functions deploy send-email
   ```

**✅ Checkpoint**: Go to "Edge Functions" → You should see 3 functions

### Part 6: Configure Secrets (5 minutes)

1. **In Terminal**, run these commands:

```bash
# OpenAI API Key (for AI features)
supabase secrets set OPENAI_API_KEY=sk-your-openai-key-here

# Email service (Resend)
supabase secrets set RESEND_API_KEY=re-your-resend-key-here
supabase secrets set FROM_EMAIL=noreply@yourdomain.com
supabase secrets set FROM_NAME="Circulo Grant Manager"

# WhatsApp webhook secret (optional)
supabase secrets set WHATSAPP_WEBHOOK_SECRET=any-random-string-here
```

**✅ Checkpoint**: Secrets are set (no visible confirmation, but commands should complete without errors)

### Part 7: Update Your Application (10 minutes)

**If you're not a developer, hire someone to do this part.**

1. **Install Supabase client:**
   ```bash
   npm install @supabase/supabase-js
   ```

2. **Create `.env` file** in your project root:
   ```env
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   OPENAI_API_KEY=your-openai-key
   ```

3. **Update database code** (see full guide for details)

4. **Test locally:**
   ```bash
   npm run dev
   ```

---

## Testing Your Migration (5 minutes)

### Test 1: Database Connection

1. **Go to** Supabase Dashboard → "Table Editor"
2. **Click** "users" table
3. **Click** "Insert row"
4. **Fill in** some test data
5. **Click** "Save"
6. **Verify** row appears in table

✅ **Pass**: Row saved successfully  
❌ **Fail**: Error message → Check RLS policies

### Test 2: Storage Upload

1. **Go to** "Storage" → "documents" bucket
2. **Click** "Upload file"
3. **Select** a small PDF file
4. **Click** "Upload"
5. **Verify** file appears in bucket

✅ **Pass**: File uploaded  
❌ **Fail**: Error → Check bucket policies

### Test 3: Edge Function

1. **Go to** "Edge Functions" → "ai-document-analysis"
2. **Click** "Invoke function"
3. **Paste** this test data:
   ```json
   {
     "documentIds": [1],
     "reportingPeriodStart": "2024-01-01",
     "reportingPeriodEnd": "2024-12-31"
   }
   ```
4. **Click** "Send request"

✅ **Pass**: Returns JSON response  
❌ **Fail**: Error → Check secrets are set

---

## Common Problems and Solutions

### Problem 1: "Permission denied" errors

**Cause**: RLS policies blocking access

**Solution**:
1. Go to "Authentication" → "Policies"
2. Check policies are enabled for your table
3. Verify you're logged in with correct user

### Problem 2: "Function timeout" errors

**Cause**: Edge function taking too long

**Solution**:
1. Check OpenAI API key is valid
2. Try with smaller documents
3. Check Edge Function logs for errors

### Problem 3: "Storage upload failed"

**Cause**: Bucket not public or wrong MIME type

**Solution**:
1. Go to Storage → Select bucket → Settings
2. Make bucket public (if needed)
3. Check file type is allowed

### Problem 4: "Database connection failed"

**Cause**: Wrong credentials or project paused

**Solution**:
1. Verify SUPABASE_URL and keys are correct
2. Check project is active (not paused)
3. Try restarting project in Dashboard

---

## What's Next?

After successful migration:

1. **Import your existing data** (see full guide)
2. **Deploy your application** (Vercel, Railway, or your own server)
3. **Set up custom domain** (optional)
4. **Invite team members** to Supabase project
5. **Configure backups** (automatic on Pro tier)

---

## Cost Breakdown

### Free Tier (Good for testing and small NGOs)

- ✅ 500 MB database
- ✅ 1 GB storage
- ✅ 2 GB bandwidth/month
- ✅ 500K Edge Function calls/month
- ✅ Unlimited users
- ❌ No automatic backups
- ❌ Community support only

**Perfect for**: < 50 users, < 1000 documents

### Pro Tier ($25/month)

- ✅ 8 GB database
- ✅ 100 GB storage
- ✅ 250 GB bandwidth/month
- ✅ 2M Edge Function calls/month
- ✅ Daily backups
- ✅ Email support
- ✅ Point-in-time recovery

**Perfect for**: 50-500 users, < 10,000 documents

### When to Upgrade?

Upgrade to Pro when you:
- Have more than 50 active users
- Need automatic backups
- Exceed free tier limits
- Need email support

---

## Getting Help

### Free Resources

1. **This documentation** - Read the full migration guide
2. **Supabase Docs** - [supabase.com/docs](https://supabase.com/docs)
3. **YouTube tutorials** - Search "Supabase tutorial"
4. **Supabase Discord** - [discord.supabase.com](https://discord.supabase.com)

### Paid Support

1. **Hire a developer** on:
   - Upwork
   - Fiverr
   - Toptal
   - Local freelancers

2. **Supabase Pro Support** ($25/month includes email support)

### Estimated Developer Cost

- **Full migration**: $500-1500 (5-10 hours)
- **Just database setup**: $200-500 (2-4 hours)
- **Just code updates**: $300-800 (3-6 hours)

---

## Migration Checklist

Print this and check off as you go:

- [ ] Created Supabase account
- [ ] Created new project
- [ ] Saved project credentials
- [ ] Ran 3 SQL migration files
- [ ] Verified 29 tables created
- [ ] Created 5 storage buckets
- [ ] Deployed 3 Edge Functions
- [ ] Set OpenAI API key
- [ ] Set email service credentials
- [ ] Updated application .env file
- [ ] Tested database connection
- [ ] Tested storage upload
- [ ] Tested Edge Functions
- [ ] Imported existing data
- [ ] Deployed application
- [ ] Tested live application
- [ ] Set up monitoring
- [ ] Configured backups

---

## Success!

If you've completed all steps and tests pass, congratulations! Your Circulo Grant Manager is now running on Supabase independently.

**Remember to:**
- Keep your service_role key secret
- Monitor usage to stay within limits
- Back up your database regularly
- Update your team on the new system

---

**Need more help?** Read the full [SUPABASE_MIGRATION_GUIDE.md](./SUPABASE_MIGRATION_GUIDE.md) for detailed technical instructions.

**Questions?** Join the [Supabase Discord](https://discord.supabase.com) community for help.
