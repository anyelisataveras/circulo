# Circulo - Grant Management System
## VPS Deployment Guide

This guide will help you deploy your grant management system to any VPS (Virtual Private Server).

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Environment Variables](#environment-variables)
5. [Database Setup](#database-setup)
6. [Production Deployment](#production-deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js 22.x** or higher
- **pnpm** (package manager)
- **MySQL 8.0+** or **TiDB Cloud** (recommended)
- **Git** (for version control)

### Recommended VPS Specs
- **Minimum:** 2GB RAM, 1 CPU, 20GB storage
- **Recommended:** 4GB RAM, 2 CPU, 40GB storage
- **OS:** Ubuntu 22.04 LTS or newer

### VPS Providers (Choose One)
- **DigitalOcean** - $12/month (2GB RAM) - [digitalocean.com](https://digitalocean.com)
- **Linode** - $10/month (2GB RAM) - [linode.com](https://linode.com)
- **Hetzner** - $8/month (2GB RAM) - [hetzner.com](https://hetzner.com)
- **AWS EC2** - Free tier available - [aws.amazon.com](https://aws.amazon.com)

---

## 🚀 Quick Start

```bash
# 1. Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install pnpm
npm install -g pnpm

# 3. Upload and extract your code
cd /var/www
sudo mkdir circulo
sudo chown $USER:$USER circulo
cd circulo
# Upload your code here (via SCP, SFTP, or git clone)

# 4. Install dependencies
pnpm install

# 5. Create .env file (see Environment Variables section)
nano .env

# 6. Setup database
pnpm db:push

# 7. Build for production
pnpm build

# 8. Start the application
pnpm start
```

Your application will be running on `http://your-vps-ip:3000`

---

## 🔧 Detailed Setup

### Step 1: Prepare Your VPS

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git build-essential

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v22.x.x
npm --version

# Install pnpm globally
npm install -g pnpm

# Verify pnpm
pnpm --version
```

### Step 2: Upload Your Code

**Option A: Using SCP (from your local machine)**
```bash
scp -r grant-manager.zip user@your-vps-ip:/var/www/
ssh user@your-vps-ip
cd /var/www
unzip grant-manager.zip
cd grant-manager
```

**Option B: Using Git (if you have a repository)**
```bash
cd /var/www
git clone https://github.com/yourusername/grant-manager.git
cd grant-manager
```

**Option C: Using SFTP**
Use FileZilla or any SFTP client to upload the folder to `/var/www/grant-manager`

### Step 3: Install Dependencies

```bash
cd /var/www/grant-manager
pnpm install
```

This will install all required packages. It may take 2-5 minutes.

---

## 🔐 Environment Variables

Create a `.env` file in the project root:

```bash
cd /var/www/grant-manager
nano .env
```

### Required Environment Variables

```env
# Database Configuration
DATABASE_URL="mysql://username:password@host:port/database_name"

# JWT Secret (generate a random string)
JWT_SECRET="your-super-secret-jwt-key-change-this"

# OAuth Configuration (Manus-specific, optional for self-hosted)
OAUTH_SERVER_URL="https://api.manus.im"
VITE_OAUTH_PORTAL_URL="https://oauth.manus.im"

# Owner Information
OWNER_OPEN_ID="your-admin-user-id"
OWNER_NAME="Your Name"

# Application Configuration
VITE_APP_ID="circulo"
VITE_APP_TITLE="Circulo - Grant Management"
VITE_APP_LOGO="/logo.svg"

# API Keys (if using Manus AI features)
BUILT_IN_FORGE_API_URL="https://forge.manus.im"
BUILT_IN_FORGE_API_KEY="your-api-key-if-available"
VITE_FRONTEND_FORGE_API_KEY="your-frontend-api-key"

# Analytics (optional)
VITE_ANALYTICS_ENDPOINT=""
VITE_ANALYTICS_WEBSITE_ID=""

# Node Environment
NODE_ENV="production"
```

### How to Generate JWT_SECRET

```bash
# Generate a secure random string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as your `JWT_SECRET`.

---

## 🗄️ Database Setup

### Option 1: TiDB Cloud (Recommended - Free Tier Available)

1. Go to [tidbcloud.com](https://tidbcloud.com)
2. Create a free account
3. Create a new cluster (Serverless Tier is free)
4. Get your connection string
5. Add to `.env`:

```env
DATABASE_URL="mysql://username.root:password@gateway01.region.prod.aws.tidbcloud.com:4000/database_name?ssl={\"minVersion\":\"TLSv1.2\",\"rejectUnauthorized\":true}"
```

### Option 2: Self-Hosted MySQL

```bash
# Install MySQL
sudo apt install -y mysql-server

# Secure installation
sudo mysql_secure_installation

# Create database and user
sudo mysql
```

```sql
CREATE DATABASE circulo;
CREATE USER 'circulo_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON circulo.* TO 'circulo_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Add to `.env`:
```env
DATABASE_URL="mysql://circulo_user:your_password@localhost:3306/circulo"
```

### Push Database Schema

```bash
cd /var/www/grant-manager
pnpm db:push
```

This creates all necessary tables in your database.

---

## 🚀 Production Deployment

### Build the Application

```bash
cd /var/www/grant-manager
pnpm build
```

This compiles TypeScript and builds the frontend. Output goes to `dist/` folder.

### Option 1: Run with PM2 (Recommended)

PM2 keeps your app running and restarts it if it crashes.

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start npm --name "circulo" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions shown

# View logs
pm2 logs circulo

# Monitor
pm2 monit

# Restart
pm2 restart circulo

# Stop
pm2 stop circulo
```

### Option 2: Run with systemd

Create a systemd service file:

```bash
sudo nano /etc/systemd/system/circulo.service
```

```ini
[Unit]
Description=Circulo Grant Management System
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/grant-manager
Environment=NODE_ENV=production
ExecStart=/usr/bin/pnpm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable circulo
sudo systemctl start circulo
sudo systemctl status circulo
```

### Setup Nginx Reverse Proxy

Install Nginx:

```bash
sudo apt install -y nginx
```

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/circulo
```

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain

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

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/circulo /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

---

## 🔒 Security Best Practices

### 1. Firewall Configuration

```bash
# Enable UFW firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

### 2. Keep System Updated

```bash
# Create a cron job for automatic updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 3. Secure Environment Variables

```bash
# Protect .env file
chmod 600 /var/www/grant-manager/.env
```

### 4. Regular Backups

```bash
# Backup database daily
crontab -e
```

Add this line:
```
0 2 * * * mysqldump -u circulo_user -p'your_password' circulo > /var/backups/circulo-$(date +\%Y\%m\%d).sql
```

---

## 🔄 Updating Your Application

```bash
cd /var/www/grant-manager

# Pull latest changes (if using git)
git pull

# Or upload new files via SCP/SFTP

# Install any new dependencies
pnpm install

# Push database changes
pnpm db:push

# Rebuild
pnpm build

# Restart application
pm2 restart circulo
# OR
sudo systemctl restart circulo
```

---

## 🐛 Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs circulo
# OR
sudo journalctl -u circulo -f

# Common issues:
# 1. Database connection - verify DATABASE_URL
# 2. Port already in use - check with: sudo lsof -i :3000
# 3. Missing dependencies - run: pnpm install
```

### Database Connection Errors

```bash
# Test database connection
mysql -h hostname -u username -p database_name

# Check if MySQL is running
sudo systemctl status mysql

# Verify DATABASE_URL format in .env
```

### Build Failures

```bash
# Clear cache and rebuild
rm -rf node_modules dist
pnpm install
pnpm build
```

### Out of Memory During Build

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" pnpm build
```

### Port 3000 Already in Use

```bash
# Find what's using port 3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>

# Or change port in your app configuration
```

---

## 📊 Monitoring

### Check Application Status

```bash
# PM2
pm2 status
pm2 monit

# Systemd
sudo systemctl status circulo

# Check if port is listening
sudo netstat -tulpn | grep :3000
```

### View Logs

```bash
# PM2 logs
pm2 logs circulo --lines 100

# Systemd logs
sudo journalctl -u circulo -n 100 -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Resource Usage

```bash
# Check memory and CPU
htop

# Check disk space
df -h

# Check database size
mysql -u circulo_user -p -e "SELECT table_schema AS 'Database', ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' FROM information_schema.TABLES WHERE table_schema = 'circulo';"
```

---

## 🎯 Performance Optimization

### Enable Gzip Compression in Nginx

Add to your Nginx configuration:

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
```

### Setup Caching

```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Database Optimization

```sql
-- Add indexes for better performance
-- (Already included in schema, but verify)
SHOW INDEX FROM documents;
SHOW INDEX FROM grant_opportunities;
```

---

## 📞 Support

If you encounter issues:

1. Check the logs first
2. Verify all environment variables are set correctly
3. Ensure database is accessible
4. Check firewall rules
5. Verify Node.js and pnpm versions

---

## 🎉 Success!

Once everything is running:

- Your application is accessible at `https://your-domain.com`
- Admin panel at `https://your-domain.com/dashboard`
- All features including multilingual reports are working
- No memory limitations for builds or deployments

**Congratulations on your successful deployment!** 🚀
