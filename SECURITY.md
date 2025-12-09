# Security Implementation Guide

This document describes the security improvements implemented in your grant management system based on the Claude code review.

---

## ✅ Implemented Security Fixes (P0 Priority)

### 1. Environment Variable Validation (`server/_core/env.ts`)

**Problem Fixed:** Application could start with missing or invalid configuration, leading to runtime errors.

**Solution:**
- All required environment variables are validated on startup
- Application exits immediately if required variables are missing
- JWT secret must be at least 32 characters
- Database URL format is validated
- Production-specific checks (HTTPS for OAuth, etc.)

**Usage:**
```typescript
import { ENV } from './server/_core/env';

// ENV is guaranteed to have all required values
console.log(ENV.databaseUrl); // Never undefined
```

**Required Environment Variables:**
- `VITE_APP_ID` - Application identifier
- `JWT_SECRET` - Must be 32+ characters (generate with: `openssl rand -base64 32`)
- `DATABASE_URL` - Valid MySQL/PostgreSQL connection string
- `OAUTH_SERVER_URL` - OAuth provider URL (must be HTTPS in production)

---

### 2. OAuth CSRF Protection (`server/_core/oauth.ts`)

**Problem Fixed:** OAuth flow was vulnerable to CSRF attacks due to missing state validation.

**Solution:**
- Cryptographically secure state tokens generated for each OAuth flow
- State tokens stored server-side with 10-minute expiration
- State validated on callback before processing authentication
- One-time use tokens (deleted after validation)
- Automatic cleanup of expired tokens

**How It Works:**
1. Client calls `/api/oauth/initiate` to get a state token
2. State token is included in OAuth redirect URL
3. On callback, state is validated before processing
4. Invalid/expired states are rejected with clear error message

**Additional Improvements:**
- Session expiry reduced from 1 year to 7 days
- HttpOnly cookies prevent JavaScript access
- Secure flag for HTTPS-only cookies in production
- SameSite=lax for additional CSRF protection

---

### 3. Token Encryption (`server/_core/encryption.ts`)

**Problem Fixed:** Sensitive tokens (OAuth refresh tokens, API keys) were stored in plaintext in database.

**Solution:**
- AES-256-GCM encryption for all sensitive data
- Unique salt and IV for each encryption
- Authentication tags prevent tampering
- Key derivation using scrypt (memory-hard function)

**Usage:**
```typescript
import { encrypt, decrypt } from './server/_core/encryption';

// Encrypting sensitive data before database storage
const encryptedToken = await encrypt(userToken);
await db.update(users).set({ token: encryptedToken });

// Decrypting when retrieving
const user = await db.select().from(users).where(eq(users.id, userId));
const decryptedToken = await decrypt(user.token);
```

**Setup:**
Add to `.env`:
```env
ENCRYPTION_KEY=$(openssl rand -base64 32)
```

**Note:** Falls back to JWT_SECRET if ENCRYPTION_KEY not set, but dedicated key is recommended.

---

## ⏳ Deferred Security Improvements (VPS Deployment)

These improvements require additional dependencies that would exceed Manus memory limits. Implement after VPS deployment:

### 4. Rate Limiting

**Install:**
```bash
pnpm add express-rate-limit
```

**Implementation:** See `corrected-index.ts` for complete code.

**Recommended Limits:**
- General API: 100 requests per 15 minutes
- Authentication: 5 attempts per 15 minutes
- tRPC API: 60 requests per minute

---

### 5. Security Headers (Helmet)

**Install:**
```bash
pnpm add helmet
```

**Implementation:**
```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

---

### 6. File Upload Size Limits

**Current:** No validation on file upload sizes

**Recommended:**
```typescript
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Validate in upload handlers
if (file.size > 10 * 1024 * 1024) {
  throw new Error('File too large. Maximum size is 10MB');
}
```

---

## 🔒 Additional Security Best Practices

### Database Security

1. **Use SSL/TLS for database connections** in production:
```env
DATABASE_URL=mysql://user:pass@host:3306/db?ssl=true
```

2. **Encrypt sensitive fields** using the encryption utilities:
- OAuth tokens
- API keys
- Personal identification numbers
- Credit card information (if applicable)

### Session Management

1. **Session expiry:** Currently 7 days (configurable in `oauth.ts`)
2. **Logout:** Properly clears session cookies
3. **Token rotation:** Consider implementing refresh token rotation

### Input Validation

1. **Validate all user inputs** before processing
2. **Sanitize data** before database insertion
3. **Use parameterized queries** (Drizzle ORM does this automatically)

### HTTPS

1. **Always use HTTPS in production**
2. **Redirect HTTP to HTTPS**
3. **Use HSTS headers** (included in helmet)

### Monitoring & Logging

1. **Log security events:**
   - Failed login attempts
   - Invalid state tokens
   - Encryption/decryption failures
   - Rate limit violations

2. **Monitor for suspicious activity:**
   - Multiple failed logins from same IP
   - Unusual API usage patterns
   - Large file uploads

3. **Set up alerts** for critical security events

---

## 🚀 VPS Deployment Security Checklist

Before deploying to production:

### Environment Setup
- [ ] Generate strong JWT_SECRET (32+ characters)
- [ ] Generate separate ENCRYPTION_KEY
- [ ] Use HTTPS for all external URLs
- [ ] Set NODE_ENV=production
- [ ] Configure database with SSL
- [ ] Set up firewall rules (allow only 80, 443, 22)

### Application Security
- [ ] Install and configure helmet
- [ ] Implement rate limiting
- [ ] Add file upload size validation
- [ ] Enable CORS with specific origins
- [ ] Set up request logging
- [ ] Implement health checks

### Infrastructure Security
- [ ] Keep system packages updated
- [ ] Use non-root user for application
- [ ] Configure fail2ban for SSH protection
- [ ] Set up automated backups
- [ ] Enable database backups
- [ ] Use SSL certificates (Let's Encrypt)

### Monitoring
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure uptime monitoring
- [ ] Set up log aggregation
- [ ] Create security event alerts

---

## 📚 Security Resources

### Encryption Key Generation
```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate ENCRYPTION_KEY
openssl rand -base64 32

# Generate random password
openssl rand -base64 24
```

### Testing Security

1. **Test OAuth flow:**
   - Verify state validation works
   - Try replaying old state tokens (should fail)
   - Test expired state tokens (should fail)

2. **Test encryption:**
   - Encrypt and decrypt test data
   - Verify encrypted data is different each time
   - Test with invalid encryption keys (should fail gracefully)

3. **Test environment validation:**
   - Try starting with missing variables (should exit)
   - Try weak JWT_SECRET (should warn/exit)
   - Try invalid DATABASE_URL (should exit)

### Security Audit Tools

- **npm audit** - Check for vulnerable dependencies
- **Snyk** - Continuous security monitoring
- **OWASP ZAP** - Web application security testing
- **SSL Labs** - Test SSL/TLS configuration

---

## 🆘 Security Incident Response

If you suspect a security breach:

1. **Immediate Actions:**
   - Rotate all secrets (JWT_SECRET, ENCRYPTION_KEY, database passwords)
   - Review access logs for suspicious activity
   - Check database for unauthorized changes
   - Temporarily disable affected features

2. **Investigation:**
   - Identify the attack vector
   - Determine scope of compromise
   - Document timeline of events
   - Preserve evidence (logs, database snapshots)

3. **Recovery:**
   - Patch the vulnerability
   - Restore from clean backup if needed
   - Notify affected users if data was compromised
   - Implement additional monitoring

4. **Prevention:**
   - Update security measures
   - Add monitoring for similar attacks
   - Review and update incident response plan
   - Conduct security training

---

## 📞 Support

For security questions or to report vulnerabilities:
- Review this documentation
- Check deployment guides
- Consult OWASP security guidelines
- Consider professional security audit for production deployment

---

**Last Updated:** 2025-11-10
**Security Review By:** Claude (Anthropic)
**Implementation Status:** Core fixes implemented, additional improvements pending VPS deployment
