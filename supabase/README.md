# Circulo Grant Manager - Complete Supabase Migration Package

## Overview

This package contains everything you need to migrate the Circulo Grant Manager application from Manus IM platform to Supabase (PostgreSQL). The migration enables independent deployment without platform constraints while maintaining all 29 database tables, AI-powered features, and complete functionality.

**Migration Time**: 1-2 hours (technical users) | 3-4 hours (non-technical users with developer help)

---

## What's Included

### 📁 Package Contents

```
supabase-migration/
├── migrations/
│   ├── 001_initial_schema.sql       # All 29 tables, enums, indexes
│   ├── 002_rls_policies.sql         # Row Level Security policies
│   └── 003_functions_triggers.sql   # Database functions, triggers, constraints
├── storage/
│   └── storage_setup.sql            # Storage buckets and policies
├── functions/
│   ├── ai-document-analysis/        # AI-powered impact report generation
│   ├── whatsapp-webhook/            # WhatsApp message handler
│   └── send-email/                  # Email notification service
├── docs/
│   ├── SUPABASE_MIGRATION_GUIDE.md  # Comprehensive technical guide
│   ├── QUICK_START.md               # Simplified guide for non-technical users
│   └── API_REFERENCE.md             # API documentation (you may create this)
└── README.md                        # This file
```

### 🗄️ Database Schema (29 Tables)

**Core Tables:**
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

**Communication & Integration:**
- notifications
- whatsapp_messages
- email_logs
- n8n_webhooks

**AI & Analytics:**
- ai_assistance_sessions
- impact_reports
- impact_metrics
- impact_stories
- report_documents
- report_templates

**Supporting Tables:**
- api_credentials
- audit_logs
- translations
- google_drive_files
- organization_profile
- beneficiaries

### 🔒 Security Features

- **Row Level Security (RLS)** on all tables
- **Admin-only access** for sensitive operations
- **User-specific data isolation** for credentials and notifications
- **Audit logging** for all critical operations
- **Encrypted credentials** storage
- **JWT-based authentication**

### 📦 Storage Buckets

1. **documents** (Public) - Application documents, PDFs, spreadsheets
2. **reports** (Public) - Generated impact reports
3. **media** (Public) - Images, logos, videos
4. **receipts** (Private) - Financial receipts and invoices
5. **whatsapp** (Private) - WhatsApp media attachments

### ⚡ Edge Functions

1. **ai-document-analysis** - Analyzes documents and generates impact reports using OpenAI
2. **whatsapp-webhook** - Receives and processes WhatsApp messages from N8N
3. **send-email** - Sends email notifications using Resend

### 🎯 Key Features Preserved

- ✅ Multi-language support (English, Spanish, Catalan, Basque)
- ✅ AI-powered document analysis and impact reports
- ✅ Google Drive integration
- ✅ WhatsApp integration via N8N webhooks
- ✅ Email notifications
- ✅ Comprehensive audit logging
- ✅ Budget tracking and expense management
- ✅ Grant opportunity management
- ✅ Application lifecycle tracking
- ✅ Beneficiary management with anonymization
- ✅ Impact metrics and storytelling

---

## Quick Start

### For Non-Technical Users

👉 **Start here**: [QUICK_START.md](./docs/QUICK_START.md)

This simplified guide walks you through the migration step-by-step with screenshots and plain language.

### For Developers

👉 **Start here**: [SUPABASE_MIGRATION_GUIDE.md](./docs/SUPABASE_MIGRATION_GUIDE.md)

Comprehensive technical guide with code examples, CLI commands, and troubleshooting.

---

## Prerequisites

### Required

- **Supabase Account** (Free tier works for testing)
- **Node.js 18+** and npm
- **Supabase CLI** (`npm install -g supabase`)

### Optional (for full features)

- **OpenAI API Key** - For AI document analysis ($5-20/month usage)
- **Resend API Key** - For email notifications (Free: 100 emails/day)
- **N8N Instance** - For WhatsApp integration (self-hosted or cloud)

---

## Migration Steps (Summary)

1. **Create Supabase Project** (5 min)
2. **Run Database Migrations** (10 min)
3. **Set Up Storage Buckets** (5 min)
4. **Deploy Edge Functions** (10 min)
5. **Configure Environment Variables** (5 min)
6. **Update Application Code** (30-60 min)
7. **Test Everything** (15 min)
8. **Deploy Application** (15 min)

**Total Time**: 1.5-2 hours for experienced developers

---

## Architecture Overview

### Before (Manus IM Platform)

```
┌─────────────────────────────────────────┐
│         Manus IM Platform               │
│  ┌─────────────────────────────────┐   │
│  │  React Frontend                  │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  Express Backend (tRPC)          │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  MySQL/TiDB Database (Drizzle)   │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  S3 Storage                      │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  Manus OAuth                     │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### After (Supabase)

```
┌─────────────────────────────────────────┐
│            Supabase                     │
│  ┌─────────────────────────────────┐   │
│  │  PostgreSQL Database             │   │
│  │  + RLS Policies                  │   │
│  │  + Functions & Triggers          │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  Storage Buckets (5)             │   │
│  │  + Bucket Policies               │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  Edge Functions (3)              │   │
│  │  - AI Analysis                   │   │
│  │  - WhatsApp Webhook              │   │
│  │  - Email Service                 │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  Supabase Auth                   │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
         ↑
         │
┌─────────────────────────────────────────┐
│      Your Application                   │
│  ┌─────────────────────────────────┐   │
│  │  React Frontend                  │   │
│  │  + Supabase Client               │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  Express Backend (Optional)      │   │
│  │  + Supabase Client               │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## Database Schema Highlights

### Users & Authentication

```sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  open_id VARCHAR(64) UNIQUE NOT NULL,
  email VARCHAR(320),
  role user_role DEFAULT 'user',
  preferred_language preferred_language DEFAULT 'en',
  -- Google OAuth integration
  google_access_token TEXT,
  google_refresh_token TEXT,
  ...
);
```

### Grant Opportunities

```sql
CREATE TABLE grant_opportunities (
  id BIGSERIAL PRIMARY KEY,
  funding_source VARCHAR(255) NOT NULL,
  program_title VARCHAR(500) NOT NULL,
  application_deadline TIMESTAMPTZ NOT NULL,
  max_amount INTEGER,
  status grant_status DEFAULT 'monitoring',
  ...
);
```

### Impact Reports (AI-Powered)

```sql
CREATE TABLE impact_reports (
  id BIGSERIAL PRIMARY KEY,
  report_title VARCHAR(500) NOT NULL,
  report_type impact_report_type NOT NULL,
  content TEXT,
  generated_by_ai BOOLEAN DEFAULT FALSE,
  ai_prompt TEXT,
  language preferred_language DEFAULT 'en',
  ...
);
```

---

## Edge Functions Overview

### 1. AI Document Analysis

**Endpoint**: `https://[PROJECT].functions.supabase.co/ai-document-analysis`

**Purpose**: Analyzes uploaded documents (PDF, Excel, Word, images) and generates comprehensive impact reports.

**Input**:
```json
{
  "documentIds": [1, 2, 3],
  "reportingPeriodStart": "2024-01-01",
  "reportingPeriodEnd": "2024-12-31",
  "focusAreas": ["education", "health"],
  "language": "en"
}
```

**Output**:
```json
{
  "success": true,
  "reportContent": "# Executive Summary\n\n...",
  "documentsAnalyzed": 3,
  "documentNames": ["report1.pdf", "data.xlsx", "photo.jpg"]
}
```

### 2. WhatsApp Webhook

**Endpoint**: `https://[PROJECT].functions.supabase.co/whatsapp-webhook`

**Purpose**: Receives WhatsApp messages from N8N, stores media, and creates notifications.

**Input**:
```json
{
  "phoneNumber": "+34612345678",
  "senderName": "John Doe",
  "messageType": "text",
  "messageContent": "Hello, I need help with my application",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 3. Send Email

**Endpoint**: `https://[PROJECT].functions.supabase.co/send-email`

**Purpose**: Sends email notifications using Resend API.

**Input**:
```json
{
  "userId": 123,
  "recipientEmail": "user@example.com",
  "subject": "Grant Deadline Approaching",
  "emailType": "deadline_reminder",
  "content": "<h1>Reminder</h1><p>Your grant deadline is in 7 days.</p>"
}
```

---

## Cost Estimation

### Supabase Costs

| Tier | Price | Database | Storage | Bandwidth | Edge Functions |
|------|-------|----------|---------|-----------|----------------|
| Free | $0 | 500 MB | 1 GB | 2 GB/mo | 500K/mo |
| Pro | $25/mo | 8 GB | 100 GB | 250 GB/mo | 2M/mo |

### Additional Costs

- **OpenAI API**: ~$5-20/month (depends on usage)
- **Resend Email**: Free (100/day) or $20/month (50K/month)
- **N8N**: Self-hosted (free) or Cloud ($20-100/month)

### Total Estimated Monthly Cost

- **Small NGO** (< 50 users): $0-30/month
- **Medium NGO** (50-200 users): $25-75/month
- **Large NGO** (200+ users): $50-150/month

---

## Security Considerations

### ✅ What's Secure

- All tables have RLS policies
- Service role key never exposed to client
- Encrypted credential storage
- Audit logging on all critical operations
- HTTPS-only communication
- JWT-based authentication

### ⚠️ What You Need to Configure

1. **Rotate API keys** regularly
2. **Enable 2FA** on Supabase account
3. **Set up IP allowlist** (optional, for extra security)
4. **Configure webhook secrets** for external integrations
5. **Review RLS policies** for your specific use case
6. **Set up monitoring** and alerts

---

## Performance Optimization

### Database

- ✅ Indexes on all foreign keys
- ✅ Indexes on frequently queried columns
- ✅ Composite indexes for complex queries
- ✅ Automatic timestamp updates via triggers

### Storage

- ✅ CDN-backed storage
- ✅ Public buckets for faster access
- ✅ Appropriate file size limits

### Edge Functions

- ✅ Optimized for cold starts
- ✅ Minimal dependencies
- ✅ Error handling and retries

---

## Monitoring and Maintenance

### What to Monitor

1. **Database Performance**
   - Query execution time
   - Connection pool usage
   - Table sizes

2. **Storage Usage**
   - Total storage consumed
   - Bandwidth usage
   - File upload errors

3. **Edge Functions**
   - Invocation count
   - Error rate
   - Execution time

4. **Application Errors**
   - Failed queries
   - Authentication errors
   - RLS policy violations

### Recommended Tools

- **Supabase Dashboard** - Built-in monitoring
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **Uptime Robot** - Uptime monitoring

---

## Migration Checklist

Use this to track your progress:

### Pre-Migration

- [ ] Read SUPABASE_MIGRATION_GUIDE.md
- [ ] Gather all API keys
- [ ] Back up existing data
- [ ] Test in development first

### Database Setup

- [ ] Create Supabase project
- [ ] Run 001_initial_schema.sql
- [ ] Run 002_rls_policies.sql
- [ ] Run 003_functions_triggers.sql
- [ ] Verify all 29 tables created
- [ ] Test database queries

### Storage Setup

- [ ] Create 5 storage buckets
- [ ] Configure bucket policies
- [ ] Test file uploads
- [ ] Verify public/private access

### Edge Functions

- [ ] Deploy ai-document-analysis
- [ ] Deploy whatsapp-webhook
- [ ] Deploy send-email
- [ ] Set environment secrets
- [ ] Test each function

### Application Updates

- [ ] Install @supabase/supabase-js
- [ ] Update database queries
- [ ] Update authentication
- [ ] Update file uploads
- [ ] Update environment variables
- [ ] Test locally

### Deployment

- [ ] Deploy to production
- [ ] Configure custom domain
- [ ] Set up SSL certificate
- [ ] Test live application
- [ ] Monitor for errors

### Post-Migration

- [ ] Import existing data
- [ ] Train team on new system
- [ ] Set up backups
- [ ] Configure monitoring
- [ ] Document customizations

---

## Troubleshooting

### Quick Fixes

| Problem | Solution |
|---------|----------|
| "Permission denied" | Check RLS policies |
| "Function timeout" | Increase timeout or optimize code |
| "Storage upload failed" | Check bucket policies and file size |
| "Database connection failed" | Verify credentials and project status |
| "Edge function error" | Check function logs and secrets |

### Getting Help

1. **Check Documentation**
   - [SUPABASE_MIGRATION_GUIDE.md](./docs/SUPABASE_MIGRATION_GUIDE.md)
   - [QUICK_START.md](./docs/QUICK_START.md)

2. **Supabase Resources**
   - [Official Docs](https://supabase.com/docs)
   - [Discord Community](https://discord.supabase.com)
   - [GitHub Discussions](https://github.com/supabase/supabase/discussions)

3. **Hire a Developer**
   - Upwork, Fiverr, Toptal
   - Estimated cost: $500-1500 for full migration

---

## Support

### Community Support (Free)

- Supabase Discord
- Stack Overflow
- GitHub Issues

### Professional Support

- **Supabase Pro** ($25/month) - Includes email support
- **Hire a Developer** - For custom implementation

---

## License

This migration package is provided as-is for the Circulo Grant Manager project. The database schema, Edge Functions, and documentation are tailored specifically for this application.

---

## Credits

**Developed for**: Circulo Grant Manager  
**Platform**: Supabase (PostgreSQL)  
**Original Platform**: Manus IM  
**Migration Package Version**: 1.0.0  
**Last Updated**: 2025

---

## Next Steps

1. **Choose your guide**:
   - Non-technical? → [QUICK_START.md](./docs/QUICK_START.md)
   - Developer? → [SUPABASE_MIGRATION_GUIDE.md](./docs/SUPABASE_MIGRATION_GUIDE.md)

2. **Set up development environment** first before production

3. **Test thoroughly** with sample data

4. **Deploy to production** when confident

5. **Monitor closely** for the first week

---

**Questions?** Open an issue or reach out to the Supabase community for help.

**Good luck with your migration! 🚀**
