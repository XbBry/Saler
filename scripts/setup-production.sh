#!/bin/bash

# Production Setup Script for Saler
# ==================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="saler"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
BACKUP_DIR="./backups"
SCRIPTS_DIR="./scripts"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking system requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check available disk space (minimum 10GB)
    AVAILABLE_SPACE=$(df / | awk 'NR==2 {print $4}')
    if [ "$AVAILABLE_SPACE" -lt 10485760 ]; then
        log_error "Insufficient disk space. At least 10GB required."
        exit 1
    fi
    
    # Check memory (minimum 4GB)
    TOTAL_MEM=$(free -m | awk 'NR==2{print $2}')
    if [ "$TOTAL_MEM" -lt 4096 ]; then
        log_warning "Less than 4GB RAM detected. Performance may be affected."
    fi
    
    log_success "System requirements check passed"
}

check_env_file() {
    log_info "Checking environment file..."
    
    if [ ! -f "$ENV_FILE" ]; then
        log_warning "$ENV_FILE not found. Creating from template..."
        if [ -f ".env.example" ]; then
            cp .env.example "$ENV_FILE"
            log_info "Please edit $ENV_FILE with your production values"
            log_warning "Setup paused. Please configure $ENV_FILE and run again."
            exit 1
        else
            log_error ".env.example not found"
            exit 1
        fi
    fi
    
    # Check for placeholder values
    if grep -q "change-this" "$ENV_FILE"; then
        log_error "Environment file contains placeholder values. Please configure production values."
        exit 1
    fi
    
    log_success "Environment file check passed"
}

setup_directories() {
    log_info "Setting up directories..."
    
    # Create necessary directories
    local dirs=(
        "./logs"
        "./logs/nginx"
        "./logs/backend"
        "./logs/postgres"
        "./logs/redis"
        "./logs/security"
        "./logs/audit"
        "$BACKUP_DIR"
        "$BACKUP_DIR/database"
        "$BACKUP_DIR/redis"
        "./data"
        "./docker/ssl"
        "./docker/backups"
        "./monitoring"
        "./monitoring/grafana"
        "./monitoring/prometheus"
    )
    
    for dir in "${dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            log_info "Created directory: $dir"
        fi
    done
    
    # Set proper permissions
    chmod 755 logs
    chmod 755 "$BACKUP_DIR"
    chmod 700 docker/ssl
    
    log_success "Directories created successfully"
}

generate_ssl_certificates() {
    log_info "Generating SSL certificates..."
    
    local ssl_dir="./docker/ssl"
    local cert_file="$ssl_dir/cert.pem"
    local key_file="$ssl_dir/key.pem"
    local dhparam_file="$ssl_dir/dhparam.pem"
    
    if [ ! -f "$cert_file" ] || [ ! -f "$key_file" ]; then
        log_info "Generating self-signed SSL certificates..."
        
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$key_file" \
            -out "$cert_file" \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
        
        log_warning "Self-signed certificates generated (replace with proper certificates for production)"
    else
        log_info "SSL certificates already exist"
    fi
    
    if [ ! -f "$dhparam_file" ]; then
        log_info "Generating DH parameters (this may take a while)..."
        openssl dhparam -out "$dhparam_file" 2048
        log_success "DH parameters generated"
    fi
    
    # Set proper permissions
    chmod 600 "$key_file"
    chmod 644 "$cert_file"
    
    log_success "SSL certificates setup complete"
}

setup_database() {
    log_info "Setting up database..."
    
    # Wait for database to be ready
    log_info "Waiting for PostgreSQL to be ready..."
    timeout=60
    while ! docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres pg_isready -U saler &>/dev/null; do
        if [ $timeout -eq 0 ]; then
            log_error "PostgreSQL failed to start within 60 seconds"
            exit 1
        fi
        sleep 2
        timeout=$((timeout-2))
    done
    
    log_success "PostgreSQL is ready"
    
    # Run initial migrations
    log_info "Running database migrations..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T backend python -m alembic upgrade head || {
        log_warning "Migrations may need to be run manually"
    }
    
    log_success "Database setup complete"
}

setup_monitoring() {
    log_info "Setting up monitoring stack..."
    
    # Create monitoring directories
    mkdir -p ./monitoring/grafana/dashboards
    mkdir -p ./monitoring/prometheus/rules
    
    # Wait for monitoring services
    log_info "Waiting for monitoring services..."
    sleep 30
    
    # Configure Grafana (this would typically be done via API)
    log_info "Grafana should be accessible at http://localhost:3000"
    log_info "Default credentials: admin / admin"
    log_warning "Please change the default password immediately"
    
    log_success "Monitoring stack setup complete"
}

setup_security() {
    log_info "Applying security configurations..."
    
    # Create security configuration files
    cat > ./scripts/security-check.sh << 'EOF'
#!/bin/bash
# Security validation script
echo "Running security checks..."

# Check file permissions
find . -name "*.pem" -exec ls -la {} \; | grep -v "600\|644"

# Check for exposed secrets
if grep -r "password\|secret\|key" --include="*.log" logs/ 2>/dev/null; then
    echo "Warning: Potential secrets found in logs"
fi

echo "Security check completed"
EOF
    
    chmod +x ./scripts/security-check.sh
    
    # Setup fail2ban if available
    if command -v fail2ban-server &> /dev/null; then
        log_info "Setting up fail2ban..."
        sudo systemctl enable fail2ban || true
        sudo systemctl start fail2ban || true
    fi
    
    log_success "Security configuration applied"
}

create_backup_script() {
    log_info "Creating backup script..."
    
    cat > "$SCRIPTS_DIR/backup.sh" << 'EOF'
#!/bin/bash
# Database backup script

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_BACKUP="$BACKUP_DIR/saler_db_$DATE.sql"
REDIS_BACKUP="$BACKUP_DIR/saler_redis_$DATE.rdb"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup PostgreSQL
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U saler saler > "$DB_BACKUP"
gzip "$DB_BACKUP"

# Backup Redis
docker cp $(docker-compose -f docker-compose.prod.yml ps -q redis):/data/dump.rdb "$REDIS_BACKUP"
gzip "$REDIS_BACKUP"

# Clean old backups (keep last 7 days)
find "$BACKUP_DIR" -name "saler_*_*.sql.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name "saler_*_*.rdb.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF
    
    chmod +x "$SCRIPTS_DIR/backup.sh"
    
    log_success "Backup script created"
}

setup_monitoring_dashboards() {
    log_info "Setting up monitoring dashboards..."
    
    # Create basic Grafana dashboard configuration
    cat > ./monitoring/grafana/dashboards/saler-overview.json << 'EOF'
{
  "dashboard": {
    "title": "Saler System Overview",
    "panels": [
      {
        "title": "API Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
          }
        ]
      }
    ]
  }
}
EOF
    
    log_success "Monitoring dashboards created"
}

final_checks() {
    log_info "Performing final checks..."
    
    # Check if all containers are running
    local failed_services=()
    
    for service in postgres redis backend frontend nginx; do
        if ! docker-compose -f "$DOCKER_COMPOSE_FILE" ps | grep -q "$service.*Up"; then
            failed_services+=("$service")
        fi
    done
    
    if [ ${#failed_services[@]} -gt 0 ]; then
        log_error "The following services are not running: ${failed_services[*]}"
        log_info "Check logs with: docker-compose -f $DOCKER_COMPOSE_FILE logs [service]"
        exit 1
    fi
    
    # Health check
    log_info "Performing health check..."
    
    # Check backend health
    if curl -f http://localhost/health &>/dev/null; then
        log_success "Backend health check passed"
    else
        log_warning "Backend health check failed"
    fi
    
    # Check frontend
    if curl -f http://localhost:80/health &>/dev/null; then
        log_success "Frontend health check passed"
    else
        log_warning "Frontend health check failed"
    fi
    
    log_success "Final checks completed"
}

display_summary() {
    log_success "Production setup completed successfully!"
    echo
    echo "============================================"
    echo "         SALER PRODUCTION SETUP"
    echo "============================================"
    echo
    echo "Services:"
    echo "  - Frontend:    https://localhost (or your domain)"
    echo "  - Backend API: https://localhost/api"
    echo "  - Monitoring:  http://localhost:3000 (Grafana)"
    echo "  - Metrics:     http://localhost:9090 (Prometheus)"
    echo
    echo "Default Credentials:"
    echo "  Grafana: admin / admin (CHANGE IMMEDIATELY)"
    echo
    echo "Useful Commands:"
    echo "  View logs:     docker-compose -f $DOCKER_COMPOSE_FILE logs -f"
    echo "  Stop services: docker-compose -f $DOCKER_COMPOSE_FILE down"
    echo "  Backup:        ./scripts/backup.sh"
    echo "  Health check:  curl http://localhost/health"
    echo
    echo "Important Notes:"
    echo "  1. Update SSL certificates for production"
    echo "  2. Change all default passwords"
    echo "  3. Configure proper domain names"
    echo "  4. Set up monitoring and alerting"
    echo "  5. Review security configurations"
    echo
    echo "Documentation: ./docs/production-deployment.md"
    echo "============================================"
}

main() {
    echo "============================================"
    echo "    SALER PRODUCTION SETUP SCRIPT"
    echo "============================================"
    echo
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-checks)
                SKIP_CHECKS=true
                shift
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo "Options:"
                echo "  --skip-checks    Skip system requirements checks"
                echo "  --help          Show this help message"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Run setup steps
    if [ "$SKIP_CHECKS" != true ]; then
        check_requirements
    fi
    check_env_file
    setup_directories
    generate_ssl_certificates
    
    # Start services
    log_info "Starting services..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    setup_database
    setup_monitoring
    setup_security
    create_backup_script
    setup_monitoring_dashboards
    final_checks
    display_summary
}

# Run main function
main "$@"