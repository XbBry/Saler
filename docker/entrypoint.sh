#!/bin/bash

# Production Entry Point Script
# =============================

set -e

echo "🚀 Starting Saler Application in production mode..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to log messages
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Function to check if required environment variables are set
check_env_vars() {
    local required_vars=("SECRET_KEY" "DATABASE_URL" "REDIS_URL")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log_error "Missing required environment variables:"
        printf '   - %s\n' "${missing_vars[@]}"
        exit 1
    fi
}

# Function to validate database connection
check_database() {
    log "Checking database connection..."
    
    # Wait for database to be ready
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if python -c "
import os
import asyncpg
import asyncio

async def test_connection():
    try:
        conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
        await conn.execute('SELECT 1')
        await conn.close()
        print('Database connection successful')
        return True
    except Exception as e:
        print(f'Database connection failed: {e}')
        return False

asyncio.run(test_connection())
"; then
            log "✅ Database connection successful"
            break
        else
            if [[ $attempt -eq $max_attempts ]]; then
                log_error "❌ Database connection failed after $max_attempts attempts"
                exit 1
            fi
            log_warning "Database not ready, waiting... (attempt $attempt/$max_attempts)"
            sleep 2
            ((attempt++))
        fi
    done
}

# Function to run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # Check if migrations directory exists
    if [[ -d "migrations" ]]; then
        # Run Alembic migrations
        if command -v alembic &> /dev/null; then
            alembic upgrade head
            log "✅ Database migrations completed"
        else
            log_warning "⚠️ Alembic not found, skipping migrations"
        fi
    else
        log_warning "⚠️ Migrations directory not found"
    fi
}

# Function to collect static files (if using Django)
collect_static() {
    if command -v python &> /dev/null; then
        if python -c "import django" 2>/dev/null; then
            log "Collecting static files..."
            python manage.py collectstatic --noinput --clear
            log "✅ Static files collected"
        fi
    fi
}

# Function to setup directories
setup_directories() {
    log "Setting up directories..."
    
    # Create necessary directories
    local dirs=("/app/logs" "/app/data" "/app/uploads" "/app/backups")
    
    for dir in "${dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir"
            log "Created directory: $dir"
        fi
    done
    
    # Set proper permissions
    chown -R appuser:appuser /app/logs /app/data /app/uploads 2>/dev/null || true
    chmod 755 /app/logs /app/data /app/uploads 2>/dev/null || true
}

# Function to setup SSL certificates
setup_ssl() {
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log "Setting up SSL certificates..."
        
        local ssl_dir="/etc/nginx/ssl"
        local cert_file="$ssl_dir/cert.pem"
        local key_file="$ssl_dir/key.pem"
        
        if [[ -f "$cert_file" && -f "$key_file" ]]; then
            log "✅ SSL certificates found"
        else
            log_warning "⚠️ SSL certificates not found, generating self-signed certificates for development"
            
            mkdir -p "$ssl_dir"
            
            # Generate self-signed certificate (for development only)
            openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
                -keyout "$key_file" \
                -out "$cert_file" \
                -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
            
            log "⚠️ Self-signed certificates generated (for development only)"
        fi
    fi
}

# Function to start monitoring services
start_monitoring() {
    if command -v curl &> /dev/null; then
        log "Starting health check monitoring..."
        
        # Start background health check
        (
            while true; do
                sleep 30
                if ! curl -f http://localhost:8000/health &> /dev/null; then
                    log_error "Health check failed"
                fi
            done
        ) &
    fi
}

# Function to handle graceful shutdown
handle_shutdown() {
    log "Received shutdown signal, cleaning up..."
    
    # Stop any background processes
    jobs -p | xargs -r kill
    
    # Close database connections (if needed)
    # Add your cleanup logic here
    
    log "Shutdown complete"
    exit 0
}

# Set up signal handlers
trap handle_shutdown SIGTERM SIGINT

# Main execution
main() {
    log "Starting application initialization..."
    
    # Check environment variables
    check_env_vars
    
    # Setup directories
    setup_directories
    
    # Setup SSL certificates
    setup_ssl
    
    # Check database connection
    check_database
    
    # Run migrations
    run_migrations
    
    # Collect static files
    collect_static
    
    # Start monitoring
    start_monitoring
    
    log "✅ Application initialization complete"
    
    # Start the main application
    log "Starting application server..."
    
    # Execute the main command
    exec "$@"
}

# Run main function with all arguments
main "$@"