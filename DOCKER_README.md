# 🐳 Docker Setup Guide - Saler Platform

This comprehensive guide covers all Docker-related setup, deployment, and management operations for the Saler SaaS Platform.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Docker Architecture](#docker-architecture)
- [Development Setup](#development-setup)
- [Production Deployment](#production-deployment)
- [Docker Management Scripts](#docker-management-scripts)
- [Database Management](#database-management)
- [SSL Certificates](#ssl-certificates)
- [Monitoring & Health Checks](#monitoring--health-checks)
- [Maintenance & Troubleshooting](#maintenance--troubleshooting)

## 🚀 Quick Start

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Make (optional, for convenience)

### Basic Setup

```bash
# Clone and navigate to project
git clone <repository>
cd saler

# Start development environment
make docker-dev
# OR
./scripts/docker/docker-manager.sh start-dev

# Check service health
make docker-health
```

### Default URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **pgAdmin**: http://localhost:8080
- **Redis Commander**: http://localhost:8081

## 🏗️ Docker Architecture

### Services Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │     Worker      │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│  (Background)   │
│   Port: 3000    │    │   Port: 8000    │    │  Port: N/A      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────┤   PostgreSQL   ├──────────────┘
                        │   Port: 5432   │
                        └─────────────────┘
                                 │
                        ┌─────────────────┐
                        │     Redis       │
                        │   Port: 6379    │
                        └─────────────────┘
```

### Network Architecture

- **saler-network**: Primary service communication network
- **saler-dev-network**: Development-specific network
- **saler-prod-network**: Production isolation network

### Volume Structure

```bash
data/
├── postgres/          # Database data
├── redis/            # Cache data
├── pgadmin/          # pgAdmin configuration
└── prometheus/       # Metrics data

logs/
├── backend/          # Backend logs
├── frontend/         # Frontend logs
└── nginx/           # Reverse proxy logs

backups/
└── database/        # Database backups
```

## 🛠️ Development Setup

### Development Environment

```bash
# Start full development environment with GUIs
docker-compose --profile development up -d

# Start only core services
docker-compose up -d

# Start with hot reload
make docker-dev
```

### Development Profiles

- **development**: Includes pgAdmin, Redis Commander, MailHog
- **production**: Optimized configurations, security hardening
- **monitoring**: Prometheus, Grafana, AlertManager

### Development Scripts

```bash
# Interactive management
./scripts/docker/docker-manager.sh

# Health monitoring
./scripts/docker/health-check.sh monitor 30

# Database operations
./scripts/docker/db-backup.sh backup
```

## 🚢 Production Deployment

### Production Environment

```bash
# Set production environment variables
export POSTGRES_PASSWORD="secure-password"
export SECRET_KEY="your-secret-key"
export DOMAIN="your-domain.com"

# Start production environment
make docker-prod
# OR
./scripts/docker/docker-manager.sh start-prod

# Start with monitoring
docker-compose -f docker-compose.yml -f docker-compose.prod.yml --profile monitoring up -d
```

### Production Configuration

#### Environment Variables

```bash
# Database
POSTGRES_DB=saler
POSTGRES_USER=saler
POSTGRES_PASSWORD=<secure-password>
POSTGRES_HOST=postgres

# Redis
REDIS_PASSWORD=<redis-password>

# Security
SECRET_KEY=<very-secure-secret-key>
JWT_SECRET_KEY=<jwt-secret>
ACCESS_TOKEN_EXPIRE_MINUTES=30

# External Services
OPENAI_API_KEY=<openai-key>
TWILIO_ACCOUNT_SID=<twilio-sid>
TWILIO_AUTH_TOKEN=<twilio-token>
ULTRAMSG_API_KEY=<ultramsg-key>

# Monitoring
SENTRY_DSN=<sentry-dsn>
PROMETHEUS_PORT=8001
```

#### Resource Limits

```yaml
# Production resource allocation
postgres:
  memory: 4G
  cpu: 2.0

redis:
  memory: 1G
  cpu: 0.5

backend:
  memory: 2G
  cpu: 1.0
  workers: 4

frontend:
  memory: 1G
  cpu: 0.5
```

## 🔧 Docker Management Scripts

### Comprehensive Docker Manager

```bash
# Main management script
./scripts/docker/docker-manager.sh

# Available commands:
./scripts/docker/docker-manager.sh start-dev      # Start development
./scripts/docker/docker-manager.sh start-prod     # Start production
./scripts/docker/docker-manager.sh stop           # Stop all services
./scripts/docker/docker-manager.sh restart        # Restart services
./scripts/docker/docker-manager.sh logs           # View logs
./scripts/docker/docker-manager.sh exec           # Execute commands
./scripts/docker/docker-manager.sh build          # Build images
./scripts/docker/docker-manager.sh clean          # Cleanup resources
./scripts/docker/docker-manager.sh health         # Health check
```

### Docker Cleanup Script

```bash
# Cleanup utilities
./scripts/docker/docker-cleanup.sh

# Commands:
./scripts/docker/docker-cleanup.sh containers     # Clean containers
./scripts/docker/docker-cleanup.sh images         # Clean images
./scripts/docker/docker-cleanup.sh volumes        # Clean volumes
./scripts/docker/docker-cleanup.sh saler          # Clean Saler resources
./scripts/docker/docker-cleanup.sh system         # System-wide cleanup
./scripts/docker/docker-cleanup.sh deep           # Deep cleanup
```

## 💾 Database Management

### Backup Operations

```bash
# Create backup
./scripts/docker/db-backup.sh backup
# OR
make docker-backup

# Create named backup
./scripts/docker/db-backup.sh backup "custom_name"

# Create uncompressed backup
./scripts/docker/db-backup.sh backup "backup_name" false

# List all backups
./scripts/docker/db-backup.sh list
# OR
make docker-db-list
```

### Restore Operations

```bash
# Restore from backup
./scripts/docker/db-backup.sh restore "backup_file.sql"
# OR
make docker-restore

# Verify backup before restore
./scripts/docker/db-backup.sh verify "backup_file.sql"
```

### Maintenance

```bash
# Clean old backups (older than 30 days)
./scripts/docker/db-backup.sh clean 30
# OR
make docker-db-clean

# Schedule automatic backups
./scripts/docker/db-backup.sh schedule daily    # Daily at 2 AM
./scripts/docker/db-backup.sh schedule weekly   # Weekly on Sunday
./scripts/docker/db-backup.sh schedule monthly  # Monthly on 1st

# Show backup statistics
./scripts/docker/db-backup.sh stats
```

## 🔒 SSL Certificates

### Self-Signed Certificates (Development)

```bash
# Generate self-signed certificate
./scripts/docker/ssl-manager.sh self-signed
# OR
make docker-ssl-self-signed

# Generate for specific domain
./scripts/docker/ssl-manager.sh self-signed "mydomain.com" 365
```

### Let's Encrypt Certificates (Production)

```bash
# Install certbot
./scripts/docker/ssl-manager.sh install-certbot

# Get Let's Encrypt certificate
DOMAIN="your-domain.com" EMAIL="admin@your-domain.com" \
./scripts/docker/ssl-manager.sh letsencrypt

# Renew certificates
./scripts/docker/ssl-manager.sh renew
# OR
make docker-ssl-renew
```

### Certificate Management

```bash
# Generate CSR for CA signing
./scripts/docker/ssl-manager.sh csr "mydomain.com"

# Sign certificate with CA
./scripts/docker/ssl-manager.sh sign "mydomain.com" "ca.crt" "ca.key"

# Verify certificate
./scripts/docker/ssl-manager.sh verify "mydomain.com"

# Show certificate information
./scripts/docker/ssl-manager.sh info "mydomain.com"

# Generate Nginx configuration
./scripts/docker/ssl-manager.sh nginx-config "mydomain.com"

# Cleanup old certificates
./scripts/docker/ssl-manager.sh cleanup 30
```

## 📊 Monitoring & Health Checks

### Health Check System

```bash
# Comprehensive health check
./scripts/docker/health-check.sh check
# OR
make docker-health

# Continuous monitoring
./scripts/docker/health-check.sh monitor 30
# OR
make docker-monitor

# Export health status as JSON
./scripts/docker/health-check.sh export

# Check specific service
./scripts/docker/health-check.sh container "saler-backend"
./scripts/docker/health-check.sh endpoint "http://localhost:8000/health"
./scripts/docker/health-check.sh port "localhost" "5432"
```

### Monitoring Stack

Start monitoring services:

```bash
# Start with monitoring
docker-compose --profile monitoring up -d

# Services available:
# - Prometheus: http://localhost:9090
# - Grafana: http://localhost:3002
# - AlertManager: http://localhost:9093
```

### System Status

```bash
# Comprehensive system status
make docker-status

# Docker containers status
docker-compose ps

# Resource usage
docker stats

# Disk usage
docker system df
```

## 🛠️ Makefile Commands

### Complete Makefile Reference

```bash
# Development
make setup                 # Complete project setup
make dev                   # Start development environment
make docker-dev           # Docker development environment
make docker-prod          # Docker production environment

# Docker Management
make docker-manager       # Docker management interface
make docker-health        # Health check
make docker-monitor       # Continuous monitoring
make docker-backup        # Database backup
make docker-restore       # Database restore
make docker-cleanup       # Cleanup resources
make docker-clean-deep    # Deep cleanup
make docker-status        # System status

# SSL Management
make docker-ssl-self-signed     # Self-signed certificate
make docker-ssl-letsencrypt     # Let's Encrypt certificate
make docker-ssl-renew           # Renew certificates

# Database
make docker-db-list       # List backups
make docker-db-clean      # Clean old backups

# Logs & Monitoring
make logs                 # All service logs
make logs-backend        # Backend logs
make logs-frontend       # Frontend logs
make logs-db            # Database logs
make docker-ps          # Container status
make docker-stats       # Resource statistics

# Service Management
make up                 # Start services
make down               # Stop services
make restart            # Restart services
make exec               # Execute in container
make shell              # Container shell

# System
make status             # System status
make info               # System information
make clean              # Clean temporary files
make clean-all          # Deep clean
```

## 🔧 Maintenance & Troubleshooting

### Common Issues

#### Container Won't Start

```bash
# Check container logs
docker-compose logs [service-name]

# Check resource usage
docker stats

# Restart specific service
docker-compose restart [service-name]
```

#### Database Connection Issues

```bash
# Check database health
make logs-db
docker-compose exec postgres pg_isready -U saler_user -d saler

# Reset database
make db-reset
```

#### Port Already in Use

```bash
# Find process using port
lsof -i :8000

# Kill process
kill -9 [PID]

# Or use different port
docker-compose down
# Edit ports in docker-compose.yml
docker-compose up -d
```

#### Memory Issues

```bash
# Check memory usage
docker stats

# Clean up unused resources
make docker-clean-deep

# Restart with resource limits
docker-compose down
docker-compose up -d
```

### Performance Optimization

#### Database Performance

```sql
-- Monitor slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

#### Application Performance

```bash
# Monitor API response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8000/health

# Check worker queue
docker-compose exec worker python -c "
from workers.scheduler import get_queue_stats
print(get_queue_stats())
"
```

### Backup & Recovery

#### Automated Backups

```bash
# Setup cron job for daily backups
echo "0 2 * * * cd /path/to/saler && ./scripts/docker/db-backup.sh backup" | crontab -

# Setup log rotation
echo "/path/to/saler/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
}" | sudo tee /etc/logrotate.d/saler
```

#### Disaster Recovery

```bash
# Complete disaster recovery script
#!/bin/bash
echo "Starting disaster recovery..."

# Stop all services
docker-compose down

# Clean all resources
./scripts/docker/docker-cleanup.sh deep

# Restore from latest backup
LATEST_BACKUP=$(ls -t backups/*.sql.gz | head -1)
./scripts/docker/db-backup.sh restore "$LATEST_BACKUP"

# Start services
./scripts/docker/docker-manager.sh start-prod

# Verify system health
./scripts/docker/health-check.sh check

echo "Disaster recovery completed"
```

## 📝 Best Practices

### Security

1. **Use environment variables for secrets**
2. **Run containers as non-root users**
3. **Use specific image tags instead of :latest**
4. **Enable health checks for all services**
5. **Use networks for service isolation**
6. **Regular security updates**

### Performance

1. **Use multi-stage builds**
2. **Optimize Docker image layers**
3. **Use .dockerignore files**
4. **Implement proper caching strategies**
5. **Monitor resource usage**
6. **Use connection pooling**

### Maintenance

1. **Regular backups**
2. **Monitor logs and metrics**
3. **Keep dependencies updated**
4. **Clean unused resources**
5. **Document configurations**
6. **Test recovery procedures**

## 📚 Additional Resources

- [Docker Official Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [FastAPI Docker Guide](https://fastapi.tiangolo.com/deployment/docker/)
- [Next.js Docker Guide](https://nextjs.org/docs/deployment)
- [PostgreSQL Docker Documentation](https://www.postgresql.org/docs/current/static/app-postgres.html)

## 🤝 Contributing

When contributing to the Docker setup:

1. Follow the existing code structure
2. Update documentation for new features
3. Test changes in both development and production modes
4. Ensure all scripts have proper error handling
5. Add appropriate comments and logging

---

**Happy Dockerizing! 🐳**