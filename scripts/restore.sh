#!/bin/bash

# Database Restore Script for Saler
# ==================================

set -e

# Configuration
PROJECT_NAME="saler"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="./backups"
TEMP_DIR="./temp_restore"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

confirm_action() {
    local message="$1"
    echo -e "${YELLOW}$message${NC}"
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Operation cancelled by user"
        exit 0
    fi
}

list_available_backups() {
    log_info "Available backups:"
    echo
    
    local count=1
    
    # PostgreSQL backups
    echo "PostgreSQL Backups:"
    ls -la "$BACKUP_DIR"/saler_db_*.sql.gz 2>/dev/null | tail -10 | while read line; do
        echo "  $count) $line"
        count=$((count + 1))
    done
    echo
    
    # Redis backups
    echo "Redis Backups:"
    ls -la "$BACKUP_DIR"/saler_redis_*.rdb.gz 2>/dev/null | tail -10 | while read line; do
        echo "  $count) $line"
        count=$((count + 1))
    done
    echo
}

select_backup_file() {
    local backup_type="$1"
    local filter_pattern="$2"
    
    log_info "Select $backup_type backup to restore:"
    
    local files=($(ls -t "$BACKUP_DIR"/$filter_pattern 2>/dev/null))
    
    if [ ${#files[@]} -eq 0 ]; then
        log_error "No $backup_type backups found in $BACKUP_DIR"
        return 1
    fi
    
    # Display numbered list
    for i in "${!files[@]}"; do
        echo "  $((i+1))) $(basename "${files[$i]}") ($(du -h "${files[$i]}" | cut -f1))"
    done
    
    # Get user selection
    while true; do
        read -p "Enter number (1-${#files[@]}) or 'q' to quit: " selection
        
        if [ "$selection" = "q" ]; then
            log_info "Restore cancelled"
            exit 0
        fi
        
        if [[ "$selection" =~ ^[0-9]+$ ]] && [ "$selection" -ge 1 ] && [ "$selection" -le ${#files[@]} ]; then
            selected_file="${files[$((selection-1))]}"
            log_info "Selected: $(basename "$selected_file")"
            echo "$selected_file"
            return 0
        else
            log_error "Invalid selection. Please enter a number between 1-${#files[@]} or 'q'"
        fi
    done
}

backup_current_state() {
    log_info "Creating backup of current state before restore..."
    
    local pre_restore_backup="$BACKUP_DIR/pre_restore_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$pre_restore_backup"
    
    # Backup current database
    if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres pg_dump -U saler saler > "$pre_restore_backup/pre_restore_db.sql"; then
        log_success "Current database backed up"
    else
        log_warning "Failed to backup current database"
    fi
    
    # Backup current Redis
    local redis_container=$(docker-compose -f "$DOCKER_COMPOSE_FILE" ps -q redis)
    if [ ! -z "$redis_container" ]; then
        docker cp "$redis_container:/data/dump.rdb" "$pre_restore_backup/pre_restore_redis.rdb"
        log_success "Current Redis data backed up"
    else
        log_warning "Redis container not found, skipping Redis backup"
    fi
    
    log_info "Pre-restore backup saved to: $pre_restore_backup"
}

stop_application_services() {
    log_info "Stopping application services..."
    
    # Stop services that might interfere with restore
    docker-compose -f "$DOCKER_COMPOSE_FILE" stop backend frontend nginx
    
    log_success "Application services stopped"
}

start_database_services() {
    log_info "Starting database services..."
    
    # Start only database services
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d postgres redis
    
    # Wait for database to be ready
    log_info "Waiting for database services to be ready..."
    sleep 30
    
    # Verify PostgreSQL is ready
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres pg_isready -U saler; then
            log_success "PostgreSQL is ready"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "PostgreSQL failed to start"
            exit 1
        fi
        
        log_info "Waiting for PostgreSQL... (attempt $attempt/$max_attempts)"
        sleep 5
        attempt=$((attempt + 1))
    done
}

restore_postgresql() {
    local backup_file="$1"
    
    log_info "Starting PostgreSQL restore from: $(basename "$backup_file")"
    
    # Confirm destructive operation
    confirm_action "WARNING: This will overwrite the current database. Continue?"
    
    # Get database credentials
    local db_user=$(docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres env POSTGRES_USER | tail -1)
    local db_name=$(docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres env POSTGRES_DB | tail -1)
    
    # Drop and recreate database
    log_info "Dropping and recreating database..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres psql -U "$db_user" -c "DROP DATABASE IF EXISTS $db_name;" || true
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres psql -U "$db_user" -c "CREATE DATABASE $db_name;"
    
    # Restore from backup
    log_info "Restoring database from backup..."
    
    if [[ "$backup_file" == *.gz ]]; then
        # Compressed backup
        gunzip -c "$backup_file" | docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres psql -U "$db_user" -d "$db_name"
    else
        # Uncompressed backup
        docker cp "$backup_file" - | docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres psql -U "$db_user" -d "$db_name"
    fi
    
    if [ $? -eq 0 ]; then
        log_success "PostgreSQL restore completed successfully"
    else
        log_error "PostgreSQL restore failed"
        return 1
    fi
    
    # Run migrations if needed
    log_info "Running database migrations..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T backend python -m alembic upgrade head || {
        log_warning "Migration completion status unclear, please verify manually"
    }
}

restore_redis() {
    local backup_file="$1"
    
    log_info "Starting Redis restore from: $(basename "$backup_file")"
    
    # Confirm destructive operation
    confirm_action "WARNING: This will overwrite current Redis data. Continue?"
    
    # Get Redis container
    local redis_container=$(docker-compose -f "$DOCKER_COMPOSE_FILE" ps -q redis)
    
    if [ -z "$redis_container" ]; then
        log_error "Redis container not found"
        return 1
    fi
    
    # Stop Redis
    log_info "Stopping Redis..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" stop redis
    
    # Wait a moment for Redis to stop completely
    sleep 5
    
    # Copy backup file to Redis data directory
    log_info "Restoring Redis data..."
    
    local redis_data_dir=$(docker inspect "$redis_container" --format='{{range .Mounts}}{{if eq .Type "volume"}}{{.Destination}}{{end}}{{end}}')
    if [ -z "$redis_data_dir" ]; then
        # Fallback to default data directory
        redis_data_dir="/data"
    fi
    
    # Extract backup if compressed
    local temp_redis_file="/tmp/redis_backup.rdb"
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" > "$temp_redis_file"
    else
        cp "$backup_file" "$temp_redis_file"
    fi
    
    # Copy to Redis container
    docker cp "$temp_redis_file" "$redis_container:/data/dump.rdb"
    
    # Clean up temp file
    rm -f "$temp_redis_file"
    
    # Set proper permissions
    docker exec "$redis_container" chown redis:redis /data/dump.rdb
    
    # Start Redis
    log_info "Starting Redis..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" start redis
    
    # Wait for Redis to be ready
    sleep 10
    
    # Verify Redis is running
    if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T redis redis-cli ping | grep -q PONG; then
        log_success "Redis restore completed successfully"
    else
        log_error "Redis restore failed"
        return 1
    fi
}

restore_files() {
    local backup_file="$1"
    
    log_info "Starting files restore from: $(basename "$backup_file")"
    
    # Confirm destructive operation
    confirm_action "This will restore files from backup. Continue?"
    
    # Create temporary extraction directory
    mkdir -p "$TEMP_DIR"
    
    # Extract archive
    log_info "Extracting files..."
    tar -xzf "$backup_file" -C "$TEMP_DIR"
    
    # Restore files (excluding sensitive files)
    log_info "Restoring files..."
    tar -xzf "$backup_file" -C . \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='backups' \
        --exclude='logs' \
        --exclude='.env.*' \
        --exclude='docker-compose.*.yml' \
        --exclude='*.pem' \
        --exclude='*.key'
    
    if [ $? -eq 0 ]; then
        log_success "Files restore completed successfully"
    else
        log_error "Files restore failed"
        return 1
    fi
    
    # Clean up temp directory
    rm -rf "$TEMP_DIR"
}

restore_environment() {
    local backup_file="$1"
    
    log_info "Starting environment configuration restore from: $(basename "$backup_file")"
    
    # Confirm operation
    confirm_action "This will restore environment configuration. Continue?"
    
    # Create backup of current environment
    local current_env_backup="$BACKUP_DIR/current_env_$(date +%Y%m%d_%H%M%S).tar.gz"
    tar -czf "$current_env_backup" \
        .env.production \
        docker-compose.prod.yml \
        Dockerfile.prod \
        docker/ 2>/dev/null || true
    
    log_info "Current environment backed up to: $current_env_backup"
    
    # Extract environment files (with careful filtering)
    tar -xzf "$backup_file" \
        --exclude='*.password' \
        --exclude='*.key' \
        --exclude='*.secret' \
        2>/dev/null || true
    
    log_success "Environment configuration restored"
}

verify_restoration() {
    log_info "Verifying restoration..."
    
    local verify_errors=0
    
    # Check PostgreSQL
    log_info "Checking PostgreSQL..."
    if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres pg_isready -U saler; then
        # Test with a simple query
        local table_count=$(docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres psql -U saler -d saler -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null || echo "0")
        log_info "Database tables: $table_count"
    else
        log_error "PostgreSQL verification failed"
        verify_errors=$((verify_errors + 1))
    fi
    
    # Check Redis
    log_info "Checking Redis..."
    if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T redis redis-cli ping | grep -q PONG; then
        local redis_info=$(docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T redis redis-cli INFO memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')
        log_info "Redis memory usage: $redis_info"
    else
        log_error "Redis verification failed"
        verify_errors=$((verify_errors + 1))
    fi
    
    if [ $verify_errors -eq 0 ]; then
        log_success "Restoration verification passed"
    else
        log_error "Restoration verification failed with $verify_errors errors"
        return 1
    fi
}

start_application_services() {
    log_info "Starting application services..."
    
    # Start all services
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 60
    
    # Health check
    log_info "Performing health check..."
    
    # Check backend
    if curl -f http://localhost:8000/health &>/dev/null; then
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
    
    log_success "Application services started"
}

cleanup() {
    log_info "Performing cleanup..."
    
    # Remove any temporary files
    rm -rf "$TEMP_DIR" 2>/dev/null || true
    
    # Clean up Docker images if needed
    docker system prune -f &>/dev/null || true
    
    log_success "Cleanup completed"
}

generate_restore_report() {
    local report_file="$BACKUP_DIR/restore_report_$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" << EOF
Saler Restore Report
===================
Date: $(date)
Restore ID: $(date +%Y%m%d_%H%M%S)

System Status:
$(docker-compose -f "$DOCKER_COMPOSE_FILE" ps --format "table {{.Service}}\t{{.Status}}\t{{.Ports}}")

Database Information:
$(docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres psql -U saler -d saler -c "SELECT version();" 2>/dev/null | head -5)

Disk Usage:
$(df -h / | grep -E "(Filesystem|/dev/)")

Docker Resources:
$(docker system df)

Verification Results:
- PostgreSQL: OK
- Redis: OK
- Application Services: Started

Next Steps:
1. Verify application functionality
2. Update DNS if needed
3. Clear CDN cache if applicable
4. Test all critical features

EOF
    
    log_success "Restore report generated: $report_file"
}

main() {
    echo "============================================"
    echo "       SALER RESTORE SCRIPT"
    echo "============================================"
    echo
    
    # Parse command line arguments
    SELECTED_POSTGRES_BACKUP=""
    SELECTED_REDIS_BACKUP=""
    SELECTED_FILES_BACKUP=""
    SELECTED_ENV_BACKUP=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --postgres)
                SELECTED_POSTGRES_BACKUP="$2"
                shift 2
                ;;
            --redis)
                SELECTED_REDIS_BACKUP="$2"
                shift 2
                ;;
            --files)
                SELECTED_FILES_BACKUP="$2"
                shift 2
                ;;
            --env)
                SELECTED_ENV_BACKUP="$2"
                shift 2
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo "Options:"
                echo "  --postgres <file>    Restore PostgreSQL from specific backup"
                echo "  --redis <file>       Restore Redis from specific backup"
                echo "  --files <file>       Restore files from specific backup"
                echo "  --env <file>         Restore environment from specific backup"
                echo "  --help              Show this help"
                echo
                echo "Interactive mode: Just run the script without arguments"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Check if backup directory exists
    if [ ! -d "$BACKUP_DIR" ]; then
        log_error "Backup directory not found: $BACKUP_DIR"
        exit 1
    fi
    
    # Interactive mode
    if [ -z "$SELECTED_POSTGRES_BACKUP" ] && [ -z "$SELECTED_REDIS_BACKUP" ]; then
        echo "Select what to restore:"
        echo "1) PostgreSQL only"
        echo "2) Redis only"
        echo "3) Files only"
        echo "4) Environment only"
        echo "5) Full restore (PostgreSQL + Redis + Files)"
        echo "6) Custom selection"
        echo "7) List available backups and quit"
        
        read -p "Enter choice (1-7): " choice
        
        case $choice in
            1)
                SELECTED_POSTGRES_BACKUP=$(select_backup_file "PostgreSQL" "saler_db_*.sql.gz")
                ;;
            2)
                SELECTED_REDIS_BACKUP=$(select_backup_file "Redis" "saler_redis_*.rdb.gz")
                ;;
            3)
                SELECTED_FILES_BACKUP=$(select_backup_file "Files" "saler_files_*.tar.gz")
                ;;
            4)
                SELECTED_ENV_BACKUP=$(select_backup_file "Environment" "saler_env_*.tar.gz")
                ;;
            5)
                SELECTED_POSTGRES_BACKUP=$(select_backup_file "PostgreSQL" "saler_db_*.sql.gz")
                SELECTED_REDIS_BACKUP=$(select_backup_file "Redis" "saler_redis_*.rdb.gz")
                SELECTED_FILES_BACKUP=$(select_backup_file "Files" "saler_files_*.tar.gz")
                ;;
            6)
                echo "Select components to restore:"
                read -p "Restore PostgreSQL? (y/N): " restore_postgres
                read -p "Restore Redis? (y/N): " restore_redis
                read -p "Restore Files? (y/N): " restore_files
                read -p "Restore Environment? (y/N): " restore_env
                
                [ "$restore_postgres" = "y" ] && SELECTED_POSTGRES_BACKUP=$(select_backup_file "PostgreSQL" "saler_db_*.sql.gz")
                [ "$restore_redis" = "y" ] && SELECTED_REDIS_BACKUP=$(select_backup_file "Redis" "saler_redis_*.rdb.gz")
                [ "$restore_files" = "y" ] && SELECTED_FILES_BACKUP=$(select_backup_file "Files" "saler_files_*.tar.gz")
                [ "$restore_env" = "y" ] && SELECTED_ENV_BACKUP=$(select_backup_file "Environment" "saler_env_*.tar.gz")
                ;;
            7)
                list_available_backups
                exit 0
                ;;
            *)
                log_error "Invalid choice"
                exit 1
                ;;
        esac
    fi
    
    # Confirmation
    echo
    log_warning "This is a destructive operation that will overwrite current data!"
    confirm_action "Are you sure you want to continue?"
    
    # Backup current state
    backup_current_state
    
    # Stop application services
    stop_application_services
    
    # Start database services
    start_database_services
    
    # Perform restores
    if [ ! -z "$SELECTED_POSTGRES_BACKUP" ]; then
        restore_postgresql "$SELECTED_POSTGRES_BACKUP"
    fi
    
    if [ ! -z "$SELECTED_REDIS_BACKUP" ]; then
        restore_redis "$SELECTED_REDIS_BACKUP"
    fi
    
    if [ ! -z "$SELECTED_FILES_BACKUP" ]; then
        restore_files "$SELECTED_FILES_BACKUP"
    fi
    
    if [ ! -z "$SELECTED_ENV_BACKUP" ]; then
        restore_environment "$SELECTED_ENV_BACKUP"
    fi
    
    # Verify restoration
    verify_restoration
    
    # Start application services
    start_application_services
    
    # Cleanup
    cleanup
    
    # Generate report
    generate_restore_report
    
    log_success "Restore process completed successfully!"
    
    echo
    echo "Restore Summary:"
    echo "  PostgreSQL: $([ -z "$SELECTED_POSTGRES_BACKUP" ] && echo "Skipped" || echo "Restored")"
    echo "  Redis: $([ -z "$SELECTED_REDIS_BACKUP" ] && echo "Skipped" || echo "Restored")"
    echo "  Files: $([ -z "$SELECTED_FILES_BACKUP" ] && echo "Skipped" || echo "Restored")"
    echo "  Environment: $([ -z "$SELECTED_ENV_BACKUP" ] && echo "Skipped" || echo "Restored")"
    echo "  Time: $(date)"
    echo "============================================"
}

# Run main function
main "$@"