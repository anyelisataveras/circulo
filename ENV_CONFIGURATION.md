# Environment Variables Configuration Guide

This document explains all environment variables needed for self-hosted deployment.

## Required Variables

### Database
```env
DATABASE_URL="mysql://username:password@host:port/database_name"
```
Your MySQL or TiDB connection string.

**How to get it:**
- **TiDB Cloud (Free):** Create account at [tidbcloud.com](https://tidbcloud.com), create cluster, copy connection string
- **Local MySQL:** `mysql://circulo_user:your_password@localhost:3306/circulo`

### Security
```env
JWT_SECRET="your-random-secret-key"
```
Used to sign session tokens. **Must be random and secure.**

**Generate it:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Owner/Admin
```env
OWNER_OPEN_ID="admin"
OWNER_NAME="Administrator"
```
The first admin user's credentials.

### Application
```env
VITE_APP_ID="circulo"
VITE_APP_TITLE="Circulo - Grant Management"
VITE_APP_LOGO="/logo.svg"
NODE_ENV="production"
```

## Optional Variables

### OAuth (if using Manus authentication)
```env
OAUTH_SERVER_URL="https://api.manus.im"
VITE_OAUTH_PORTAL_URL="https://oauth.manus.im"
```

### AI Services (for impact reports)
```env
# Option 1: Use Manus AI (if you have access)
BUILT_IN_FORGE_API_URL="https://forge.manus.im"
BUILT_IN_FORGE_API_KEY="your-key"

# Option 2: Use your own OpenAI key
OPENAI_API_KEY="sk-your-openai-key"
```

### Analytics
```env
VITE_ANALYTICS_ENDPOINT=""
VITE_ANALYTICS_WEBSITE_ID=""
```

## Creating Your .env File

1. Create `.env` in project root:
```bash
nano .env
```

2. Add your variables:
```env
DATABASE_URL="mysql://user:pass@host:3306/circulo"
JWT_SECRET="generated-random-string"
OWNER_OPEN_ID="admin"
OWNER_NAME="Your Name"
VITE_APP_ID="circulo"
VITE_APP_TITLE="Circulo"
VITE_APP_LOGO="/logo.svg"
NODE_ENV="production"
```

3. Save and protect:
```bash
chmod 600 .env
```

## Security Notes

- **Never commit .env to git**
- Use strong, random JWT_SECRET
- Use strong database passwords
- Keep .env file permissions restrictive (600)
- Regular backups recommended
