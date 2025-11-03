#!/bin/bash

# Database Backup Script for Saler
# =================================

set -e

# Configuration
PROJECT_NAME="saler"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="./backups"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$BACKUP_DIR/backup_$DATE.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

check_requirements() {
    log_info "Checking backup requirements..."
    
    # Check if Docker is running
    if ! docker info &>/dev/null; then
        log_error "Docker is not running"
        exit 1
    fi
    
    # Check if docker-compose is available
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not available"
        exit 1
    fi
    
    # Check backup directory
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        log_info "Created backup directory: $BACKUP_DIR"
    fi
    
    log_success "Backup requirements check passed"
}

backup_postgresql() {
    log_info "Starting PostgreSQL backup..."
    
    local db_backup="$BACKUP_DIR/saler_db_$DATE.sql"
    local db_backup_gz="$db_backup.gz"
    
    # Get database credentials from environment
    local db_user=$(docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres env POSTGRES_USER | tail -1)
    local db_name=$(docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres env POSTGRES_DB | tail -1)
    
    # Create database dump
    if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres pg_dump \
        -U "$db_user" \
        -d "$db_name" \
        --verbose \
        --no-password \
        --format=custom \
        --compress=9 \
        --file="$db_backup"; then
        
        # Compress the backup
        gzip "$db_backup"
        log_success "PostgreSQL backup completed: $db_backup_gz"
        
        # Verify backup integrity
        if pg_restore --list "$db_backup_gz" &>/dev/null; then
            log_success "PostgreSQL backup verification passed"
        else
            log_error "PostgreSQL backup verification failed"
            return 1
        fi
        
        # Get backup size
        local backup_size=$(du -h "$db_backup_gz" | cut -f1)
        log_info "Backup size: $backup_size"
        
    else
        log_error "PostgreSQL backup failed"
        return 1
    fi
}

backup_redis() {
    log_info "Starting Redis backup..."
    
    local redis_backup="$BACKUP_DIR/saler_redis_$DATE.rdb"
    local redis_backup_gz="$redis_backup.gz"
    
    # Get Redis container name
    local redis_container=$(docker-compose -f "$DOCKER_COMPOSE_FILE" ps -q redis)
    
    if [ -z "$redis_container" ]; then
        log_error "Redis container not found"
        return 1
    fi
    
    # Wait for Redis to be ready for BGSAVE
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T redis redis-cli BGSAVE
    
    # Wait for BGSAVE to complete
    local max_wait=300
    local waited=0
    while docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T redis redis-cli LASTSAVE | \
          docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T redis redis-cli LASTSAVE &>/dev/null; do
        sleep 5
        waited=$((waited + 5))
        if [ $waited -ge $max_wait ]; then
            log_error "Redis BGSAVE timed out"
            return 1
        fi
    done
    
    # Copy Redis dump file
    if docker cp "$redis_container:/data/dump.rdb" "$redis_backup"; then
        # Compress the backup
        gzip "$redis_backup"
        log_success "Redis backup completed: $redis_backup_gz"
        
        # Verify backup integrity
        if file "$redis_backup_gz" | grep -q "gzip compressed"; then
            log_success "Redis backup verification passed"
        else
            log_error "Redis backup verification failed"
            return 1
        fi
        
        # Get backup size
        local backup_size=$(du -h "$redis_backup_gz" | cut -f1)
        log_info "Backup size: $backup_size"
        
    else
        log_error "Redis backup failed"
        return 1
    fi
}

backup_files() {
    log_info "Starting file backup..."
    
    local files_backup="$BACKUP_DIR/saler_files_$DATE.tar.gz"
    
    # Create archive of important files
    tar -czf "$files_backup" \
        -C . \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='backups' \
        --exclude='logs' \
        --exclude='data/tmp' \
        uploads/ 2>/dev/null || true
    
    if [ -f "$files_backup" ]; then
        log_success "Files backup completed: $files_backup"
        
        # Get backup size
        local backup_size=$(du -h "$files_backup" | cut -f1)
        log_info "Backup size: $backup_size"
    else
        log_warning "No files to backup or backup failed"
    fi
}

backup_environment() {
    log_info "Starting environment configuration backup..."
    
    local env_backup="$BACKUP_DIR/saler_env_$DATE.tar.gz"
    
    # Backup environment files and configuration (excluding sensitive data)
    tar -czf "$env_backup" \
        -C . \
        --exclude='*.password' \
        --exclude='*.key' \
        --exclude='*.secret' \
        .env.production \
        docker-compose.prod.yml \
        Dockerfile.prod \
        docker/ 2>/dev/null || true
    
    if [ -f "$env_backup" ]; then
        log_success "Environment backup completed: $env_backup"
    else
        log_warning "No environment files to backup"
    fi
}

backup_monitoring_data() {
    log_info "Starting monitoring data backup..."
    
    local monitoring_backup="$BACKUP_DIR/saler_monitoring_$DATE.tar.gz"
    
    # Backup monitoring data (Prometheus, Grafana)
    tar -czf "$monitoring_backup" \
        -C . \
        monitoring/ 2>/dev/null || true
    
    if [ -f "$monitoring_backup" ]; then
        log_success "Monitoring data backup completed: $monitoring_backup"
    else
        log_warning "No monitoring data to backup"
    fi
}

encrypt_backup() {
    local backup_file="$1"
    
    if [ -f "$backup_file" ]; then
        log_info "Encrypting backup: $backup_file"
        
        # Encrypt with GPG if available
        if command -v gpg &> /dev/null; then
            local encrypted_file="${backup_file}.gpg"
            gpg --cipher-algo AES256 --compress-algo 1 \
                --symmetric --output "$encrypted_file" "$backup_file"
            
            if [ $? -eq 0 ]; then
                rm "$backup_file"
                log_success "Backup encrypted successfully: $encrypted_file"
            else
                log_error "Backup encryption failed"
                return 1
            fi
        else
            log_warning "GPG not available, skipping encryption"
        fi
    fi
}

cleanup_old_backups() {
    log_info "Cleaning up old backups (older than $RETENTION_DAYS days)..."
    
    local deleted_count=0
    
    # Clean old PostgreSQL backups
    while IFS= read -r -d '' file; do
        rm -f "$file"
        deleted_count=$((deleted_count + 1))
        log_info "Deleted old backup: $file"
    done < <(find "$BACKUP_DIR" -name "saler_db_*.sql.gz*" -mtime +$RETENTION_DAYS -print0 2>/dev/null)
    
    # Clean old Redis backups
    while IFS= read -r -d '' file; do
        rm -f "$file"
        deleted_count=$((deleted_count + 1))
        log_info "Deleted old backup: $file"
    done < <(find "$BACKUP_DIR" -name "saler_redis_*.rdb.gz*" -mtime +$RETENTION_DAYS -print0 2>/dev/null)
    
    # Clean old file backups
    while IFS= read -r -d '' file; do
        rm -f "$file"
        deleted_count=$((deleted_count + 1))
        log_info "Deleted old backup: $file"
    done < <(find "$BACKUP_DIR" -name "saler_files_*.tar.gz*" -mtime +$RETENTION_DAYS -print0 2>/dev/null)
    
    # Clean old environment backups
    while IFS= read -r -d '' file; do
        rm -f "$file"
        deleted_count=$((deleted_count + 1))
        log_info "Deleted old backup: $file"
    done < <(find "$BACKUP_DIR" -name "saler_env_*.tar.gz*" -mtime +$RETENTION_DAYS -print0 2>/dev/null)
    
    if [ $deleted_count -gt 0 ]; then
        log_success "Cleaned up $deleted_count old backup files"
    else
        log_info "No old backups to clean up"
    fi
}

verify_backups() {
    log_info "Verifying backup integrity..."
    
    local verify_errors=0
    
    # Verify PostgreSQL backups
    while IFS= read -r -d '' backup_file; do
        if ! pg_restore --list "$backup_file" &>/dev/null; then
            log_error "Invalid PostgreSQL backup: $backup_file"
            verify_errors=$((verify_errors + 1))
        fi
    done < <(find "$BACKUP_DIR" -name "saler_db_*.sql.gz" -mtime -1 -print0 2>/dev/null)
    
    # Verify Redis backups
    while IFS= read -r -d '' backup_file; do
        if ! file "$backup_file" | grep -q "gzip compressed"; then
            log_error "Invalid Redis backup: $backup_file"
            verify_errors=$((verify_errors + 1))
        fi
    done < <(find "$BACKUP_DIR" -name "saler_redis_*.rdb.gz" -mtime -1 -print0 2>/dev/null)
    
    # Verify file archives
    while IFS= read -r -d '' backup_file; do
        if ! tar -tzf "$backup_file" &>/dev/null; then
            log_error "Invalid file archive: $backup_file"
            verify_errors=$((verify_errors + 1))
        fi
    done < <(find "$BACKUP_DIR" -name "saler_files_*.tar.gz" -mtime -1 -print0 2>/dev/null)
    
    if [ $verify_errors -eq 0 ]; then
        log_success "All recent backups verified successfully"
    else
        log_error "Found $verify_errors invalid backups"
        return 1
    fi
}

upload_to_s3() {
    local backup_file="$1"
    
    if command -v aws &> /dev/null && [ ! -z "$AWS_S3_BUCKET" ]; then
        log_info "Uploading backup to S3: $backup_file"
        
        local s3_path="s3://$AWS_S3_BUCKET/backups/$(basename "$backup_file")"
        
        if aws s3 cp "$backup_file" "$s3_path" --storage-class STANDARD_IA; then
            log_success "Backup uploaded to S3: $s3_path"
        else
            log_warning "S3 upload failed for $backup_file"
        fi
    else
        log_info "S3 upload skipped (AWS CLI not configured or S3_BUCKET not set)"
    fi
}

send_notification() {
    local status="$1"
    local message="$2"
    
    # Send email notification if configured
    if [ ! -z "$BACKUP_NOTIFICATION_EMAIL" ]; then
        echo "$message" | mail -s "Saler Backup - $status" "$BACKUP_NOTIFICATION_EMAIL" 2>/dev/null || true
    fi
    
    # Send Slack notification if configured
    if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"Saler Backup - $status: $message\"}" \
            "$SLACK_WEBHOOK_URL" 2>/dev/null || true
    fi
}

generate_backup_report() {
    local report_file="$BACKUP_DIR/backup_report_$DATE.txt"
    
    cat > "$report_file" << EOF
Saler Backup Report
==================
Date: $(date)
Status: SUCCESS
Backup ID: $DATE

Files Created:
$(find "$BACKUP_DIR" -name "*$DATE*" -type f -exec ls -lh {} \;)

Disk Usage:
$(du -sh "$BACKUP_DIR"/*$DATE* 2>/dev/null || echo "No files found")

Retention Policy:
- Keep backups for: $RETENTION_DAYS days
- Old backups will be automatically cleaned up

Next Backup: $(date -d '+1 day' '+%Y-%m-%d %H:%M:%S')

System Information:
$(docker system df --format 'table {{.Type}}\t{{.Total}}\t{{.Reclaimed}}' 2>/dev/null || echo "Docker info not available")

EOF
    
    log_success "Backup report generated: $report_file"
}

main() {
    echo "============================================"
    echo "       SALER BACKUP SCRIPT"
    echo "============================================"
    echo
    
    # Parse command line arguments
    SKIP_ENCRYPTION=false
    SKIP_CLEANUP=false
    UPLOAD_S3=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-encryption)
                SKIP_ENCRYPTION=true
                shift
                ;;
            --skip-cleanup)
                SKIP_CLEANUP=true
                shift
                ;;
            --upload-s3)
                UPLOAD_S3=true
                shift
                ;;
            --retention-days)
                RETENTION_DAYS="$2"
                shift 2
                ;;
            --help)
                echo "Usage: $0 [options]"
                echo "Options:"
                echo "  --skip-encryption    Skip backup encryption"
                echo "  --skip-cleanup       Skip old backup cleanup"
                echo "  --upload-s3          Upload to S3 if configured"
                echo "  --retention-days N   Set retention period (default: 30)"
                echo "  --help              Show this help"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Initialize log file
    exec 1> >(tee -a "$LOG_FILE")
    exec 2> >(tee -a "$LOG_FILE" >&2)
    
    log_info "Starting backup process..."
    
    # Check requirements
    check_requirements
    
    # Create backups
    local backup_errors=0
    
    if ! backup_postgresql; then
        backup_errors=$((backup_errors + 1))
    fi
    
    if ! backup_redis; then
        backup_errors=$((backup_errors + 1))
    fi
    
    backup_files
    backup_environment
    backup_monitoring_data
    
    # Cleanup old backups
    if [ "$SKIP_CLEANUP" != true ]; then
        cleanup_old_backups
    fi
    
    # Verify backups
    verify_backups
    
    # Upload to S3 if requested
    if [ "$UPLOAD_S3" = true ]; then
        for file in "$BACKUP_DIR"/*$DATE*; do
            if [ -f "$file" ]; then
                upload_to_s3 "$file"
            fi
        done
    fi
    
    # Generate report
    generate_backup_report
    
    # Send notification
    if [ $backup_errors -eq 0 ]; then
        log_success "Backup process completed successfully"
        send_notification "SUCCESS" "Backup completed successfully at $(date)"
    else
        log_error "Backup process completed with $backup_errors errors"
        send_notification "FAILED" "Backup failed with $backup_errors errors at $(date)"
        exit 1
    fi
    
    echo
    echo "Backup Summary:"
    echo "  Date: $DATE"
    echo "  Location: $BACKUP_DIR"
    echo "  Retention: $RETENTION_DAYS days"
    echo "  Log: $LOG_FILE"
    echo "============================================"
}

# Run main function
main "$@"