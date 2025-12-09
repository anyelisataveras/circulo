# Circulo - Grant Management System
## Self-Hosted Deployment Package

Welcome! This package contains everything you need to deploy your grant management system to your own VPS.

---

## 📦 What's Included

- **Complete source code** - All application files with multilingual support, clipboard export, and bug fixes
- **DEPLOYMENT_GUIDE.md** - Comprehensive step-by-step deployment instructions
- **ENV_CONFIGURATION.md** - Environment variables setup guide
- **Dockerfile** - Docker containerization (optional)
- **docker-compose.yml** - Docker Compose configuration (optional)
- **deploy.sh** - Automated deployment script
- **Database schema** - Drizzle ORM schema in `/drizzle` folder

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- A VPS with Ubuntu 22.04+ (2GB RAM minimum)
- Node.js 22 installed
- MySQL or TiDB database

### Steps

1. **Upload this folder to your VPS**
   ```bash
   scp -r grant-manager user@your-vps-ip:/var/www/
   ```

2. **SSH into your VPS**
   ```bash
   ssh user@your-vps-ip
   cd /var/www/grant-manager
   ```

3. **Create .env file**
   ```bash
   nano .env
   ```
   See `ENV_CONFIGURATION.md` for required variables.

4. **Run deployment script**
   ```bash
   ./deploy.sh
   ```

5. **Done!** Access at `http://your-vps-ip:3000`

---

## 📚 Documentation

### For First-Time Deployment
Read **DEPLOYMENT_GUIDE.md** - It covers:
- VPS setup from scratch
- Node.js and pnpm installation
- Database configuration (TiDB or MySQL)
- SSL certificate setup
- Production deployment with PM2 or systemd
- Nginx reverse proxy configuration
- Security best practices

### For Environment Configuration
Read **ENV_CONFIGURATION.md** - It explains:
- All required environment variables
- How to generate JWT secrets
- Database connection strings
- Optional AI/OAuth configuration

---

## 🐳 Docker Deployment (Alternative)

If you prefer Docker:

```bash
# 1. Create .env file
nano .env

# 2. Build and start with Docker Compose
docker-compose up -d

# 3. View logs
docker-compose logs -f app
```

---

## ✨ Features Included

This deployment package includes ALL features:

### Core Features
- ✅ Grant opportunities tracking
- ✅ Application management
- ✅ Document storage and analysis
- ✅ Organization profile management
- ✅ Admin storage centre

### AI Features
- ✅ **Multilingual impact reports** - Automatically generates reports in Spanish, Portuguese, French, German, and more
- ✅ **Multi-format document analysis** - Analyzes PDF, Excel, CSV, Word documents
- ✅ **Document citations** - Proper source attribution in reports

### Export Features
- ✅ **Copy to Clipboard** - Copy reports for offline editing in Word/Google Docs
- ✅ **Save to Documents** - Store generated reports in database
- ✅ **Professional formatting** - Beautiful Streamdown markdown rendering

### Bug Fixes
- ✅ Storage Centre download functionality fixed
- ✅ Native browser downloads (no external dependencies)

---

## 🔧 System Requirements

### Minimum
- **CPU:** 1 core
- **RAM:** 2GB
- **Storage:** 20GB
- **OS:** Ubuntu 22.04+

### Recommended
- **CPU:** 2 cores
- **RAM:** 4GB
- **Storage:** 40GB
- **OS:** Ubuntu 22.04 LTS

---

## 💰 Estimated Costs

### VPS Hosting
- **DigitalOcean:** $12/month (2GB RAM)
- **Linode:** $10/month (2GB RAM)
- **Hetzner:** $8/month (2GB RAM)
- **AWS EC2:** Free tier available (1 year)

### Database
- **TiDB Cloud:** Free tier (5GB storage)
- **Self-hosted MySQL:** Included in VPS

### Domain (Optional)
- **Namecheap/GoDaddy:** $10-15/year

### SSL Certificate
- **Let's Encrypt:** Free

**Total:** $8-12/month + domain ($10-15/year)

---

## 🆘 Support

### Common Issues

**Build fails with memory error:**
```bash
NODE_OPTIONS="--max-old-space-size=4096" pnpm build
```

**Database connection fails:**
- Check DATABASE_URL in .env
- Verify database is running
- Test connection: `mysql -h host -u user -p`

**Port 3000 already in use:**
```bash
sudo lsof -i :3000
sudo kill -9 <PID>
```

### Getting Help

1. Check **DEPLOYMENT_GUIDE.md** troubleshooting section
2. Review logs:
   - PM2: `pm2 logs circulo`
   - Systemd: `sudo journalctl -u circulo -f`
3. Verify all environment variables are set correctly

---

## 🔒 Security Checklist

Before going live:

- [ ] Strong JWT_SECRET generated
- [ ] Strong database password
- [ ] Firewall configured (UFW)
- [ ] SSL certificate installed
- [ ] .env file permissions set to 600
- [ ] Regular backups configured
- [ ] Automatic security updates enabled

---

## 🎯 Next Steps After Deployment

1. **Setup SSL** - Use Let's Encrypt for HTTPS
2. **Configure domain** - Point your domain to VPS IP
3. **Setup backups** - Daily database backups
4. **Monitor logs** - Use PM2 or systemd logs
5. **Test all features** - Create test grant, generate report

---

## 📝 Files in This Package

```
grant-manager/
├── README_DEPLOYMENT.md     ← You are here
├── DEPLOYMENT_GUIDE.md      ← Full deployment instructions
├── ENV_CONFIGURATION.md     ← Environment variables guide
├── deploy.sh                ← Automated deployment script
├── Dockerfile               ← Docker configuration
├── docker-compose.yml       ← Docker Compose setup
├── package.json             ← Dependencies
├── client/                  ← Frontend code
├── server/                  ← Backend code
├── drizzle/                 ← Database schema
└── shared/                  ← Shared types
```

---

## 🎉 Ready to Deploy!

Follow the Quick Start above or read DEPLOYMENT_GUIDE.md for detailed instructions.

**Your grant management system with multilingual support, AI-powered reports, and all features is ready to go live!**

Good luck with your deployment! 🚀
