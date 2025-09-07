# 🚀 R&D CRM - Deployment Guide

## 📋 Prerequisites

- Docker and Docker Compose installed
- Domain name (optional, for production)
- SSL certificate (optional, for HTTPS)

## 🔧 Quick Start

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd rnd_crm
```

### 2. Environment Configuration

```bash
# Copy environment template
cp env.example .env

# Edit .env with your values
nano .env
```

**Required environment variables:**
```env
# Database Configuration
DB_NAME=rnd_crm
DB_USER=postgres
DB_PASSWORD=your-secure-password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key

# Server Configuration
NODE_ENV=production
```

### 3. Deploy

**For Linux/Mac:**
```bash
./deploy.sh
```

**For Windows:**
```powershell
.\deploy.ps1
```

**Manual deployment:**
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

## 🌐 Production Setup

### Domain Configuration

1. **Point your domain** to your server's IP address
2. **Update nginx.conf** with your domain name
3. **Add SSL certificate** (recommended)

### SSL Setup (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Update nginx.conf to use SSL
```

### Environment Variables for Production

```env
# Database (use strong passwords!)
DB_NAME=rnd_crm_prod
DB_USER=rnd_crm_user
DB_PASSWORD=your-very-secure-password

# JWT (generate a strong secret)
JWT_SECRET=your-256-bit-secret-key-here

# Production settings
NODE_ENV=production
```

## 🔐 Security Checklist

- [ ] Change default admin password
- [ ] Use strong database passwords
- [ ] Set secure JWT secret
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall
- [ ] Regular backups
- [ ] Monitor logs

## 📊 Monitoring

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Health Checks
```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# Manual health check
curl http://yourdomain.com/health
```

## 🗄️ Database Management

### Backup
```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres rnd_crm > backup.sql

# Automated backup script
./scripts/backup.sh
```

### Restore
```bash
# Restore from backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres rnd_crm < backup.sql
```

## 🔄 Updates

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build
```

### Database Migrations
```bash
# Run migrations
docker-compose -f docker-compose.prod.yml exec backend npm run migrate-all
```

## 🛠️ Troubleshooting

### Common Issues

**Services won't start:**
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Check disk space
df -h

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

**Database connection issues:**
```bash
# Check database status
docker-compose -f docker-compose.prod.yml exec postgres pg_isready

# Check environment variables
docker-compose -f docker-compose.prod.yml config
```

**Frontend not loading:**
```bash
# Check nginx status
docker-compose -f docker-compose.prod.yml exec nginx nginx -t

# Check frontend container
docker-compose -f docker-compose.prod.yml logs frontend
```

### Performance Optimization

**Database:**
- Add indexes for frequently queried columns
- Regular VACUUM and ANALYZE
- Monitor query performance

**Application:**
- Enable gzip compression (already configured)
- Use CDN for static assets
- Monitor memory usage

## 📞 Support

If you encounter issues:

1. Check the logs: `docker-compose -f docker-compose.prod.yml logs`
2. Verify environment variables
3. Check disk space and memory
4. Review this documentation
5. Create an issue in the repository

## 🔄 Maintenance

### Regular Tasks

- **Weekly:** Check logs for errors
- **Monthly:** Update dependencies
- **Quarterly:** Security audit
- **As needed:** Database backups

### Backup Strategy

```bash
# Daily automated backup
0 2 * * * /path/to/backup.sh

# Weekly full system backup
0 3 * * 0 /path/to/full-backup.sh
```

---

**🎉 Your R&D CRM system is now ready for production use!**
