# VPS Deployment Guide - Circulo Grant Manager

Complete guide to deploy your grant management system on any VPS with all improvements:
- ✅ Multilingual AI impact reports
- ✅ Clipboard export for offline editing
- ✅ Security fixes (environment validation, OAuth CSRF, token encryption)
- ✅ Professional report formatting

---

## 📋 Prerequisites

### Required
- VPS with Ubuntu 22.04 (2GB RAM minimum, 4GB recommended)
- Domain name (optional but recommended)
- Basic command line knowledge
- SSH access to your VPS

### Recommended VPS Providers
- **Hetzner** - €4-8/month (best value)
- **DigitalOcean** - $12/month
- **Linode** - $10/month  
- **AWS EC2** - Free tier available (1 year)
- **Vultr** - $6/month

---

## 🚀 Quick Start (15 Minutes)

### Step 1: Prepare Your VPS

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Update system packages
apt update && apt upgrade -y

# Install required packages
apt install -y curl git build-essential

# Create application user (don't run as root!)
adduser circulo
usermod -aG sudo circulo
su - circulo
```

### Step 2: Install Node.js 22

```bash
# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh -
source ~/.bashrc

# Verify installations
node --version  # Should be v22.x.x
pnpm --version  # Should be 9.x.x
```

### Step 3: Set Up Database

**Option A: TiDB Cloud (Free Tier - Recommended for Start)**

1. Go to [https://tidbcloud.com](https://tidbcloud.com)
2. Create free account
3. Create new cluster (Serverless Tier - Free)
4. Get connection string
5. Enable SSL/TLS

**Option B: Self-Hosted MySQL**

```bash
# Install MySQL
sudo apt install -y mysql-server

# Secure installation
sudo mysql_secure_installation

# Create database
sudo mysql
```

```sql
CREATE DATABASE circulo_grants;
CREATE USER 'circulo'@'localhost' IDENTIFIED BY 'your-strong-password';
GRANT ALL PRIVILEGES ON circulo_grants.* TO 'circulo'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 4: Deploy Application

```bash
# Create application directory
cd /var/www
sudo mkdir circulo
sudo chown circulo:circulo circulo
cd circulo

# Upload and extract deployment package
# (Upload circulo-deployment-package.tar.gz to /var/www/circulo first)
tar -xzf circulo-deployment-package.tar.gz
cd grant-manager

# Install dependencies
pnpm install

# Create .env file
cp .env.example .env
nano .env
```

### Step 5: Configure Environment Variables

Edit `.env` with your values:

```env
# Required - Application
VITE_APP_ID=circulo-grant-manager
VITE_APP_TITLE=Circulo Grant Manager
NODE_ENV=production
PORT=3000

# Required - Security (GENERATE NEW VALUES!)
JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)

# Required - Database
DATABASE_URL=mysql://circulo:your-password@localhost:3306/circulo_grants
# Or for TiDB Cloud:
# DATABASE_URL=mysql://user:pass@gateway01.us-west-2.prod.aws.tidbcloud.com:4000/circulo_grants?ssl=true

# Required - OAuth
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im

# Optional - Owner Info
OWNER_OPEN_ID=your-open-id
OWNER_NAME=Your Name

# Optional - LLM API (Choose ONE)
# Option 1: OpenAI (Recommended)
OPENAI_API_KEY=sk-your-openai-key-here

# Option 2: Anthropic
# ANTHROPIC_API_KEY=sk-ant-your-key-here

# Option 3: Manus Built-in (if you have access)
# BUILT_IN_FORGE_API_URL=https://forge.manus.im
# BUILT_IN_FORGE_API_KEY=your-manus-api-key
```

**Important:** Generate NEW secrets, don't use examples!

```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate ENCRYPTION_KEY  
openssl rand -base64 32
```

### Step 6: Initialize Database

```bash
# Push database schema
pnpm db:push

# Verify database connection
pnpm db:studio  # Opens Drizzle Studio (Ctrl+C to exit)
```

### Step 7: Build and Start

```bash
# Build the application
pnpm build

# Test the build
pnpm start

# If it works, press Ctrl+C and set up PM2 for production
```

### Step 8: Set Up PM2 (Process Manager)

```bash
# Install PM2 globally
sudo pnpm add -g pm2

# Start application with PM2
pm2 start pnpm --name "circulo" -- start

# Set up PM2 to start on boot
pm2 startup
# Follow the command it outputs

pm2 save

# Check status
pm2 status
pm2 logs circulo
```

### Step 9: Set Up Nginx (Reverse Proxy)

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/circulo
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Change this!

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/circulo /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Step 10: Set Up SSL (HTTPS)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

---

## ✅ Verification

Visit your domain: `https://your-domain.com`

You should see the login page!

**Test checklist:**
- [ ] Website loads over HTTPS
- [ ] Can log in with Manus OAuth
- [ ] Can upload documents
- [ ] Can generate AI impact reports
- [ ] Reports generate in your language (test with Spanish/Portuguese)
- [ ] Can copy report to clipboard
- [ ] Can save report to documents

---

## 🔧 Configuration

### LLM Provider Setup

#### Option 1: OpenAI (Recommended)

1. Go to [platform.openai.com](https://platform.openai.com)
2. Create account and add payment method
3. Generate API key
4. Add to `.env`:
```env
OPENAI_API_KEY=sk-your-key-here
```

**Cost:** ~$0.01-0.05 per impact report

#### Option 2: Anthropic Claude

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create account and add payment method
3. Generate API key
4. Add to `.env`:
```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**Cost:** ~$0.02-0.08 per impact report

#### Option 3: Manus Built-in API

If you have Manus API access:
```env
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=your-manus-key
```

### Email Notifications (Optional)

To enable email notifications for grant deadlines:

1. Get SMTP credentials (Gmail, SendGrid, etc.)
2. Add to `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## 🛡️ Security Hardening

### 1. Firewall Setup

```bash
# Install UFW
sudo apt install -y ufw

# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
sudo ufw status
```

### 2. Fail2Ban (Protect SSH)

```bash
# Install Fail2Ban
sudo apt install -y fail2ban

# Configure
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. Automatic Security Updates

```bash
# Install unattended-upgrades
sudo apt install -y unattended-upgrades

# Enable automatic security updates
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 4. Regular Backups

```bash
# Create backup script
nano ~/backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/circulo/backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u circulo -p circulo_grants > $BACKUP_DIR/db_$DATE.sql

# Backup uploaded files (if any)
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/www/circulo/grant-manager/uploads

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
# Make executable
chmod +x ~/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
```

Add line:
```
0 2 * * * /home/circulo/backup.sh >> /home/circulo/backup.log 2>&1
```

---

## 📊 Monitoring

### PM2 Monitoring

```bash
# View logs
pm2 logs circulo

# Monitor resources
pm2 monit

# Restart if needed
pm2 restart circulo

# View detailed info
pm2 info circulo
```

### Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### Application Logs

```bash
# View PM2 logs
pm2 logs circulo --lines 100

# View error logs
pm2 logs circulo --err
```

---

## 🔄 Updates & Maintenance

### Update Application Code

```bash
cd /var/www/circulo/grant-manager

# Pull latest changes (if using git)
git pull

# Or upload new package and extract

# Install dependencies
pnpm install

# Run database migrations
pnpm db:push

# Rebuild
pnpm build

# Restart
pm2 restart circulo
```

### Update System Packages

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Reboot if kernel updated
sudo reboot
```

---

## 🆘 Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs circulo --err

# Common issues:
# 1. Missing environment variables
cat .env  # Verify all required vars are set

# 2. Database connection failed
pnpm db:studio  # Test database connection

# 3. Port already in use
sudo lsof -i :3000  # Check what's using port 3000
```

### Database Connection Errors

```bash
# Test MySQL connection
mysql -u circulo -p circulo_grants

# Check DATABASE_URL format
echo $DATABASE_URL

# For TiDB Cloud, ensure SSL is enabled:
# DATABASE_URL=mysql://...?ssl=true
```

### SSL Certificate Issues

```bash
# Renew certificate manually
sudo certbot renew

# Check certificate status
sudo certbot certificates

# Test Nginx configuration
sudo nginx -t
```

### High Memory Usage

```bash
# Check memory
free -h

# Check PM2 processes
pm2 list

# Restart application
pm2 restart circulo

# If needed, increase swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## 💰 Cost Estimate

### Monthly Costs

| Item | Cost | Notes |
|------|------|-------|
| VPS (Hetzner) | €8 | 2GB RAM, 40GB SSD |
| Domain | €1 | ~€12/year |
| LLM API (OpenAI) | $2-10 | Depends on usage |
| **Total** | **~$12-20/month** | |

### Cost Optimization

1. **Use TiDB Cloud free tier** for database (up to 5GB)
2. **Optimize LLM usage** - cache common reports
3. **Use CDN** for static assets (Cloudflare free tier)
4. **Monitor usage** - set up billing alerts

---

## 📞 Support

### Resources
- **Security Guide:** See `SECURITY.md`
- **Environment Config:** See `ENV_CONFIGURATION.md`
- **README:** See `README_DEPLOYMENT.md`

### Common Issues
- Check PM2 logs: `pm2 logs circulo`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Verify environment variables: `cat .env`
- Test database: `pnpm db:studio`

---

## ✨ What's Included

Your deployment includes:

### Features
- ✅ AI-powered impact report generation
- ✅ Multilingual support (auto-detects language)
- ✅ Multi-format document analysis (PDF, Word, Excel, CSV)
- ✅ Clipboard export for offline editing
- ✅ Save reports to database
- ✅ Grant opportunity tracking
- ✅ Application management
- ✅ Document storage
- ✅ Organization profiles

### Security
- ✅ Environment variable validation
- ✅ OAuth CSRF protection
- ✅ Token encryption (AES-256-GCM)
- ✅ Secure session management
- ✅ HTTPS with SSL certificates
- ✅ Firewall protection

### Infrastructure
- ✅ PM2 process management
- ✅ Nginx reverse proxy
- ✅ Automatic SSL renewal
- ✅ Automated backups
- ✅ Log management
- ✅ Monitoring tools

---

**Deployment Time:** 15-30 minutes  
**Difficulty:** Intermediate  
**Support:** See documentation files

**Ready to deploy? Follow the Quick Start guide above!** 🚀
